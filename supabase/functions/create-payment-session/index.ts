import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
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
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { amount, currency = 'USD', description, metadata = {} }: PaymentRequest = await req.json()

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get payment provider from settings
    const { data: providerSetting } = await supabaseClient
      .from('app_settings')
      .select('value')
      .eq('key', 'PAYMENT_PROVIDER')
      .single()

    const provider = providerSetting?.value || 'visa_mastercard'

    // Create payment session based on provider
    let sessionData: any = {}
    const payment_id: string = crypto.randomUUID()

    if (provider === 'stripe') {
      // Handle Stripe payment session
      const { data: stripeSecret } = await supabaseClient
        .from('app_settings')
        .select('value')
        .eq('key', 'STRIPE_SECRET_KEY')
        .single()

      if (!stripeSecret?.value) {
        return new Response(
          JSON.stringify({ error: 'Stripe not configured' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Here you would create a Stripe checkout session
      // For now, we'll simulate it
      sessionData = {
        sessionId: `cs_test_${crypto.randomUUID()}`,
        publishableKey: 'pk_test_simulated',
        url: `https://checkout.stripe.com/c/pay/cs_test_${crypto.randomUUID()}`
      }
    } else {
      // Handle direct card gateway
      const { data: gatewaySettings } = await supabaseClient
        .from('app_settings')
        .select('key, value')
        .in('key', ['CARD_GATEWAY_API_KEY', 'CARD_GATEWAY_ENDPOINT'])

      const settings = gatewaySettings?.reduce((acc, setting) => {
        acc[setting.key] = setting.value
        return acc
      }, {} as Record<string, string>)

      if (!settings?.CARD_GATEWAY_API_KEY || !settings?.CARD_GATEWAY_ENDPOINT) {
        return new Response(
          JSON.stringify({ error: 'Card gateway not configured' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Here you would integrate with your card gateway
      // For now, we'll simulate it
      sessionData = {
        sessionId: `cg_${crypto.randomUUID()}`,
        gatewayUrl: settings.CARD_GATEWAY_ENDPOINT,
        paymentToken: `token_${crypto.randomUUID()}`
      }
    }

    // Create payment record in database
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert([{
        id: payment_id,
        user_id: user.id,
        amount,
        currency,
        status: 'pending',
        payment_provider: provider,
        provider_session_id: sessionData.sessionId,
        metadata: {
          description,
          ...metadata,
          sessionData
        }
      }])
      .select()
      .single()

    if (paymentError) {
      console.error('Payment creation error:', paymentError)
      return new Response(
        JSON.stringify({ error: 'Failed to create payment' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        payment: {
          id: payment.id,
          sessionId: sessionData.sessionId,
          provider,
          amount,
          currency,
          ...sessionData
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Payment session error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})