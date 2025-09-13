import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getApiKey } from './_shared/get-api-key.ts';

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
    
    const openAIApiKey = await getApiKey('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured in admin settings');
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
            content: `You are a search query analyzer for a Seychelles business directory. Extract search terms and map them to database fields.
            
            Business Categories: restaurants, hotels, accommodations, activities, tours, shopping, retail, services, transport, health, medical, education, government, real_estate, automotive, technology, entertainment, food, beverages
            
            Product Categories: food, beverages, clothing, electronics, home, beauty, health, automotive, books, sports, toys, art, services
            
            Database Fields to Consider:
            - name: exact business/product names
            - category: business type or product category  
            - description: detailed descriptions
            - services: array of services offered
            - address: location information
            - island: Mahé, Praslin, La Digue, etc.
            
            Return JSON with:
            - keywords: array of core search terms
            - category: most relevant category
            - searchType: "business", "product", or "mixed"
            - fieldMappings: object mapping keywords to likely database fields
            - location: any location mentioned (island names)`
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 200
      }),
    });

    const aiData = await aiResponse.json();
    
    if (!aiData.choices || !aiData.choices[0] || !aiData.choices[0].message) {
      throw new Error('Invalid AI response format');
    }
    
    const analysis = JSON.parse(aiData.choices[0].message.content);

    // Build dynamic search conditions based on AI analysis
    const searchConditions = [];
    const productConditions = [];
    
    // Add field-specific searches based on AI mapping
    if (analysis.fieldMappings) {
      if (analysis.fieldMappings.name) {
        searchConditions.push(`name.ilike.%${analysis.fieldMappings.name}%`);
        productConditions.push(`name.ilike.%${analysis.fieldMappings.name}%`);
      }
      if (analysis.fieldMappings.category) {
        searchConditions.push(`category.ilike.%${analysis.fieldMappings.category}%`);
        productConditions.push(`category.ilike.%${analysis.fieldMappings.category}%`);
      }
      if (analysis.fieldMappings.description) {
        searchConditions.push(`description.ilike.%${analysis.fieldMappings.description}%`);
        productConditions.push(`description.ilike.%${analysis.fieldMappings.description}%`);
      }
      if (analysis.fieldMappings.services) {
        searchConditions.push(`services.cs.{${analysis.fieldMappings.services}}`);
      }
      if (analysis.location) {
        searchConditions.push(`island.ilike.%${analysis.location}%`);
        searchConditions.push(`address.ilike.%${analysis.location}%`);
      }
    }

    // Fallback to original query if no specific mappings
    if (searchConditions.length === 0) {
      searchConditions.push(`name.ilike.%${query}%`);
      searchConditions.push(`description.ilike.%${query}%`);
      searchConditions.push(`category.ilike.%${analysis.category || query}%`);
    }
    if (productConditions.length === 0) {
      productConditions.push(`name.ilike.%${query}%`);
      productConditions.push(`description.ilike.%${query}%`);
      productConditions.push(`category.ilike.%${analysis.category || query}%`);
    }

    // Search businesses with enhanced AI-mapped conditions
    let businesses = null;
    if (analysis.searchType !== 'product') {
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('id, name, description, category, address, island')
        .eq('status', 'active')
        .or(searchConditions.join(','))
        .limit(6);

      if (businessError) console.error('Business search error:', businessError);
      businesses = businessData;
    }

    // Search products with enhanced AI-mapped conditions  
    let products = null;
    if (analysis.searchType !== 'business') {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('id, name, description, category, business_id, businesses!inner(name)')
        .eq('status', 'active')
        .or(productConditions.join(','))
        .limit(6);

      if (productError) console.error('Product search error:', productError);
      products = productData;
    }

    // Format results with enhanced relevance scoring
    const results = [
      ...(businesses || []).map(business => ({
        id: business.id,
        name: business.name,
        type: 'business' as const,
        category: business.category,
        description: business.description,
        relevance: calculateRelevance(business, analysis.keywords, query)
      })),
      ...(products || []).map(product => ({
        id: product.id,
        name: product.name,
        type: 'product' as const,
        category: product.category,
        description: product.description,
        business_name: product.businesses?.name,
        relevance: calculateRelevance(product, analysis.keywords, query)
      }))
    ];

    // Sort by relevance score (high to low)
    results.sort((a, b) => b.relevance - a.relevance);

    // Helper function to calculate relevance score
    function calculateRelevance(item: any, keywords: string[], originalQuery: string): number {
      let score = 0;
      const itemText = `${item.name} ${item.description || ''} ${item.category || ''}`.toLowerCase();
      
      // Exact name match gets highest score
      if (item.name.toLowerCase().includes(originalQuery.toLowerCase())) score += 10;
      
      // Keyword matches
      keywords?.forEach(keyword => {
        if (itemText.includes(keyword.toLowerCase())) score += 5;
      });
      
      // Category match
      if (item.category?.toLowerCase().includes(analysis.category?.toLowerCase())) score += 3;
      
      return score;
    }

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