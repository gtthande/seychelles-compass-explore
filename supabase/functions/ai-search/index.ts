import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use OpenAI to extract search keywords and intent
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a search query analyzer for a Seychelles business directory. Extract key search terms and categorize the intent.
            
            Categories: restaurants, hotels, activities, shopping, services, transport, health, education, government, other
            
            Return JSON with:
            - keywords: array of search terms
            - category: most likely category
            - intent: brief description of what user is looking for`
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 150
      }),
    });

    const aiData = await aiResponse.json();
    const analysis = JSON.parse(aiData.choices[0].message.content);

    // Search businesses with enhanced keywords
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, description, category, address, island')
      .eq('status', 'active')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${analysis.category}%,address.ilike.%${query}%`)
      .limit(5);

    // Search products with enhanced keywords
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('id, name, description, category, business_id, businesses!inner(name)')
      .eq('status', 'active')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${analysis.category}%`)
      .limit(5);

    if (businessError) console.error('Business search error:', businessError);
    if (productError) console.error('Product search error:', productError);

    // Format results
    const results = [
      ...(businesses || []).map(business => ({
        id: business.id,
        name: business.name,
        type: 'business' as const,
        category: business.category,
        description: business.description,
        relevance: analysis.keywords.some(keyword => 
          business.name.toLowerCase().includes(keyword.toLowerCase()) ||
          business.description?.toLowerCase().includes(keyword.toLowerCase())
        ) ? 'high' : 'medium'
      })),
      ...(products || []).map(product => ({
        id: product.id,
        name: product.name,
        type: 'product' as const,
        category: product.category,
        description: product.description,
        business_name: product.businesses?.name,
        relevance: analysis.keywords.some(keyword => 
          product.name.toLowerCase().includes(keyword.toLowerCase()) ||
          product.description?.toLowerCase().includes(keyword.toLowerCase())
        ) ? 'high' : 'medium'
      }))
    ];

    // Sort by relevance
    results.sort((a, b) => a.relevance === 'high' && b.relevance !== 'high' ? -1 : 1);

    return new Response(JSON.stringify({
      success: true,
      results,
      analysis,
      query
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-search function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});