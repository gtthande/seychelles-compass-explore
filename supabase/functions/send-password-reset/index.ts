import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, siteUrl } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if Resend is available
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const useResend = !!resendApiKey

    let resetResult

    if (useResend) {
      // Use Resend for email delivery
      try {
        // Generate reset token
        const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: email,
          options: {
            redirectTo: `${siteUrl}/auth/callback`
          }
        })

        if (resetError) {
          throw resetError
        }

        // Send email via Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'iCompass Seychelles <noreply@icompass.sc>',
            to: [email],
            subject: 'Reset your password - iCompass Seychelles',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Reset Your Password</h2>
                <p>Hi there,</p>
                <p>You requested a password reset for your iCompass Seychelles account.</p>
                <p>Click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetData.properties.action_link}" 
                     style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Reset Password
                  </a>
                </div>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${resetData.properties.action_link}</p>
                <p>If you didn't request this, you can safely ignore this email.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="color: #666; font-size: 14px;">
                  Best regards,<br>
                  The iCompass Seychelles Team
                </p>
              </div>
            `,
          }),
        })

        if (!resendResponse.ok) {
          const errorData = await resendResponse.json()
          console.error('Resend error:', errorData)
          throw new Error(`Resend API error: ${errorData.message || 'Unknown error'}`)
        }

        resetResult = { success: true, method: 'resend' }
      } catch (resendError) {
        console.error('Resend failed, falling back to Supabase:', resendError)
        // Fall back to Supabase
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${siteUrl}/auth/callback`
        })
        
        if (error) throw error
        resetResult = { success: true, method: 'supabase_fallback' }
      }
    } else {
      // Use Supabase default email delivery
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback`
      })
      
      if (error) throw error
      resetResult = { success: true, method: 'supabase' }
    }

    return new Response(
      JSON.stringify(resetResult),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Password reset error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send password reset email',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
