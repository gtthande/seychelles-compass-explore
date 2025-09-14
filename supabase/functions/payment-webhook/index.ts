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

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    // Create a Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const webhookData = await req.json()
    console.log('Webhook received:', webhookData)

    // Determine provider and process accordingly
    const provider = webhookData.provider || 'unknown'
    
    if (provider === 'stripe') {
      // Handle Stripe webhook
      const stripeEvent = webhookData.data
      
      if (stripeEvent.type === 'checkout.session.completed') {
        const session = stripeEvent.data.object
        
        // Update payment status
        const { error } = await supabaseClient
          .from('payments')
          .update({
            status: 'completed',
            provider_payment_id: session.payment_intent,
            metadata: { 
              stripe_session: session,
              updated_at: new Date().toISOString()
            }
          })
          .eq('provider_session_id', session.id)

        if (error) {
          console.error('Failed to update Stripe payment:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to update payment' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      }
    } else if (provider === 'visa_mastercard') {
      // Handle direct card gateway webhook
      const { sessionId, status, transactionId, amount, currency } = webhookData
      
      const paymentStatus = status === 'success' ? 'completed' : 
                           status === 'failed' ? 'failed' : 'pending'
      
      // Update payment status
      const { error } = await supabaseClient
        .from('payments')
        .update({
          status: paymentStatus,
          provider_payment_id: transactionId,
          metadata: { 
            gateway_response: webhookData,
            updated_at: new Date().toISOString()
          }
        })
        .eq('provider_session_id', sessionId)

      if (error) {
        console.error('Failed to update card gateway payment:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to update payment' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    } else {
      console.log('Unknown provider webhook:', provider)
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})