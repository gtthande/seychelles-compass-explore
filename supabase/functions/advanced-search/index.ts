import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchResult {
  business_id: string;
  business_name: string;
  business_description?: string;
  business_address?: string;
  business_island?: string;
  match_source: 'business' | 'product';
  matched_field: 'name' | 'description' | 'category' | 'services';
  highlight: string;
  relevance_score: number;
  product_name?: string;
  product_description?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 20 } = await req.json();

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Query must be at least 2 characters long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`🔍 Advanced search for: "${query}"`);

    // Search businesses using full-text search with fallback
    const { data: businessMatches, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('status', 'active')
      .textSearch('search_tsvector', query, {
        type: 'websearch',
        config: 'english'
      });

    if (businessError) {
      console.error('Business full-text search error:', businessError);
      // Fallback to ilike search
      const { data: fallbackBusinesses } = await supabase
        .from('businesses')
        .select('*')
        .eq('status', 'active')
        .ilike('name', `%${query}%`)
        .or(`description.ilike.%${query}%`);
      
      businessMatches = fallbackBusinesses;
    }

    // Search products using full-text search with fallback
    const { data: productMatches, error: productError } = await supabase
      .from('products')
      .select('*, business:business_id(name, id, category, description, address, island)')
      .eq('status', 'active')
      .eq('business.status', 'active')
      .textSearch('search_tsvector', query, {
        type: 'websearch',
        config: 'english'
      });

    if (productError) {
      console.error('Product full-text search error:', productError);
      // Fallback to ilike search
      const { data: fallbackProducts } = await supabase
        .from('products')
        .select('*, business:business_id(name, id, category, description, address, island)')
        .eq('status', 'active')
        .eq('business.status', 'active')
        .ilike('name', `%${query}%`)
        .or(`description.ilike.%${query}%`);
      
      productMatches = fallbackProducts;
    }

    // Process business results
    const processedBusinessResults: SearchResult[] = (businessMatches || []).map(business => {
      let relevanceScore = 0;
      let matchedField: 'name' | 'description' | 'category' | 'services' = 'name';
      let highlight = business.name;

      const queryLower = query.toLowerCase();
      const name = business.name?.toLowerCase() || '';
      const description = business.description?.toLowerCase() || '';
      const category = business.category?.toLowerCase() || '';

      // Calculate relevance score
      if (name.includes(queryLower)) {
        relevanceScore += 100;
        if (name === queryLower) relevanceScore += 50;
        if (name.startsWith(queryLower)) relevanceScore += 25;
        matchedField = 'name';
        highlight = business.name;
      } else if (description.includes(queryLower)) {
        relevanceScore += 75;
        matchedField = 'description';
        highlight = `${business.name} – ${business.description}`;
      } else if (category.includes(queryLower)) {
        relevanceScore += 50;
        matchedField = 'category';
        highlight = `${business.name} – ${business.category}`;
      }

      // Check services array
      if (business.services && Array.isArray(business.services)) {
        const serviceMatch = business.services.some(service => 
          service?.toLowerCase().includes(queryLower)
        );
        if (serviceMatch) {
          relevanceScore += 40;
          matchedField = 'services';
          const matchingService = business.services.find(service => 
            service?.toLowerCase().includes(queryLower)
          );
          highlight = `${business.name} – offers ${matchingService}`;
        }
      }

      // Featured business bonus
      if (business.featured) {
        relevanceScore += 30;
      }

      return {
        business_id: business.id,
        business_name: business.name,
        business_description: business.description,
        business_address: business.address,
        business_island: business.island,
        match_source: 'business' as const,
        matched_field: matchedField,
        highlight,
        relevance_score: relevanceScore
      };
    });

    // Process product results
    const processedProductResults: SearchResult[] = (productResults || []).map(product => {
      let relevanceScore = 0;
      let matchedField: 'name' | 'description' | 'category' | 'services' = 'name';
      let highlight = `${product.business?.name} – ${product.name}`;

      const queryLower = query.toLowerCase();
      const productName = product.name?.toLowerCase() || '';
      const productDescription = product.description?.toLowerCase() || '';
      const productCategory = product.category?.toLowerCase() || '';

      // Calculate relevance score for products
      if (productName.includes(queryLower)) {
        relevanceScore += 100;
        if (productName === queryLower) relevanceScore += 50;
        if (productName.startsWith(queryLower)) relevanceScore += 25;
        matchedField = 'name';
        highlight = `${product.business?.name} – offers ${product.name}`;
      } else if (productDescription.includes(queryLower)) {
        relevanceScore += 75;
        matchedField = 'description';
        highlight = `${product.business?.name} – ${product.name}: ${product.description}`;
      } else if (productCategory.includes(queryLower)) {
        relevanceScore += 50;
        matchedField = 'category';
        highlight = `${product.business?.name} – ${product.name} (${product.category})`;
      }

      return {
        business_id: product.business_id,
        business_name: product.business?.name || '',
        business_description: product.business?.description,
        business_address: product.business?.address,
        business_island: product.business?.island,
        match_source: 'product' as const,
        matched_field: matchedField,
        highlight,
        relevance_score: relevanceScore,
        product_name: product.name,
        product_description: product.description
      };
    });

    // Combine and deduplicate results
    const allResults = [...processedBusinessResults, ...processedProductResults];
    
    // Remove duplicates based on business_id
    const uniqueResults = allResults.reduce((acc, current) => {
      const existing = acc.find(item => item.business_id === current.business_id);
      if (!existing) {
        acc.push(current);
      } else if (current.relevance_score > existing.relevance_score) {
        // Replace with higher scoring result
        const index = acc.findIndex(item => item.business_id === current.business_id);
        acc[index] = current;
      }
      return acc;
    }, [] as SearchResult[]);

    // Sort by relevance score and limit results
    const sortedResults = uniqueResults
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, limit);

    console.log(`🔍 Found ${sortedResults.length} results for "${query}"`);

    return new Response(
      JSON.stringify({
        results: sortedResults,
        total: sortedResults.length,
        query
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Advanced search error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
