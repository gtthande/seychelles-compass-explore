import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSearchCache } from './useSearchCache';

export interface SearchResult {
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

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

export const useAdvancedSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { get, set } = useSearchCache();

  const search = useCallback(async (
    query: string, 
    limit: number = 20
  ): Promise<SearchResponse | null> => {
    if (!query.trim() || query.trim().length < 2) {
      return { results: [], total: 0, query: query.trim() };
    }

    const cacheKey = `search_${query.trim()}_${limit}`;
    
    // Check cache first
    const cachedResult = get(cacheKey);
    if (cachedResult) {
      console.log(`🔍 Cache hit for: "${query}"`);
      return cachedResult;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔍 Advanced search for: "${query}"`);

      // Use the advanced search function
      const { data, error: searchError } = await supabase
        .rpc('search_businesses_and_products', {
          search_query: query.trim(),
          result_limit: limit
        });

      if (searchError) {
        console.error('Advanced search error:', searchError);
        setError('Search failed. Please try again.');
        return null;
      }

      const results = data || [];
      console.log(`🔍 Found ${results.length} results for "${query}"`);

      const searchResponse = {
        results,
        total: results.length,
        query: query.trim()
      };

      // Cache the result
      set(cacheKey, searchResponse);

      return searchResponse;

    } catch (err) {
      console.error('Search error:', err);
      setError('An unexpected error occurred during search.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [get, set]);

  const searchWithFallback = useCallback(async (
    query: string, 
    limit: number = 20
  ): Promise<SearchResponse | null> => {
    const cacheKey = `fallback_${query.trim()}_${limit}`;
    
    // Check cache first
    const cachedResult = get(cacheKey);
    if (cachedResult) {
      console.log(`🔍 Cache hit for fallback search: "${query}"`);
      return cachedResult;
    }

    // Try advanced search first
    const advancedResult = await search(query, limit);
    if (advancedResult && advancedResult.results.length > 0) {
      // Cache the result
      set(cacheKey, advancedResult);
      return advancedResult;
    }

    // Fallback to basic search if advanced search fails or returns no results
    console.log('🔄 Falling back to basic search...');
    
    setIsLoading(true);
    setError(null);

    try {
      // Basic business search using the improved pattern - optimized with specific fields and limits
      const { data: businessMatches, error: businessError } = await supabase
        .from('businesses')
        .select('id, title, description, category_id, address, is_active, searchable, slug, image_url')
        .eq('is_active', true)
        .ilike('title', `%${query}%`)
        .or(`description.ilike.%${query}%`)
        .limit(limit);

      if (businessError) {
        console.error('Basic business search error:', businessError);
      }

      // Basic product search using business_products join pattern
      const { data: productMatches, error: productError } = await supabase
        .from('business_products')
        .select(`
          id,
          title_override,
          description_override,
          price_override,
          product:products!inner(
            id,
            title,
            description,
            price,
            duration,
            is_active,
            searchable,
            image_url,
            stock,
            slug
          ),
          business:businesses!inner(
            id,
            title,
            category_id,
            description,
            address
          )
        `)
        .eq('is_active', true)
        .eq('product.is_active', true)
        .or(`product.title.ilike.%${query}%,product.description.ilike.%${query}%,title_override.ilike.%${query}%,description_override.ilike.%${query}%`)
        .limit(limit);

      if (productError) {
        console.error('Basic product search error:', productError);
      }

      // Process results using the improved pattern
      const businessResults: SearchResult[] = (businessMatches || []).map(business => {
        let relevanceScore = 0;
        let matchedField: 'name' | 'description' | 'category' | 'services' = 'name';
        const businessName = business.title || '';
        let highlight = businessName;

        const queryLower = query.toLowerCase();
        const name = businessName.toLowerCase();
        const description = business.description?.toLowerCase() || '';

        if (name.includes(queryLower)) {
          relevanceScore += 100;
          matchedField = 'name';
          highlight = businessName;
        } else if (description.includes(queryLower)) {
          relevanceScore += 75;
          matchedField = 'description';
          highlight = `${businessName} – ${business.description}`;
        }

        return {
          business_id: business.id,
          business_name: businessName,
          business_description: business.description,
          business_address: business.address,
          business_island: undefined, // Not selected in query
          match_source: 'business' as const,
          matched_field: matchedField,
          highlight,
          relevance_score: relevanceScore
        };
      });

      // Process product results using the improved pattern
      // Note: Products have NO category field - only businesses have category_id
      const productResults: SearchResult[] = (productMatches || []).map((bp: any) => {
        let relevanceScore = 0;
        let matchedField: 'name' | 'description' | 'category' | 'services' = 'name';
        const product = bp.product || {};
        const business = bp.business || {};
        const productTitle = bp.title_override || product.title || '';
        const businessName = business.title || '';
        let highlight = `${businessName} – ${productTitle}`;

        const queryLower = query.toLowerCase();
        const productTitleLower = productTitle.toLowerCase();
        const productDescription = (bp.description_override || product.description || '').toLowerCase();

        if (productTitleLower.includes(queryLower)) {
          relevanceScore += 100;
          matchedField = 'name';
          highlight = `${businessName} – offers ${productTitle}`;
        } else if (productDescription.includes(queryLower)) {
          relevanceScore += 75;
          matchedField = 'description';
          highlight = `${businessName} – ${productTitle}: ${bp.description_override || product.description}`;
        }

        return {
          business_id: bp.business_id,
          business_name: businessName,
          business_description: business.description,
          business_address: business.address,
          business_island: undefined, // Not selected in query
          match_source: 'product' as const,
          matched_field: matchedField,
          highlight,
          relevance_score: relevanceScore,
          product_name: productTitle,
          product_description: bp.description_override || product.description || '',
          match_detail: productTitle
        };
      });

      // Combine and deduplicate
      const allResults = [...businessResults, ...productResults];
      const uniqueResults = allResults.reduce((acc, current) => {
        const existing = acc.find(item => item.business_id === current.business_id);
        if (!existing) {
          acc.push(current);
        } else if (current.relevance_score > existing.relevance_score) {
          const index = acc.findIndex(item => item.business_id === current.business_id);
          acc[index] = current;
        }
        return acc;
      }, [] as SearchResult[]);

      const sortedResults = uniqueResults
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, limit);

      const fallbackResponse = {
        results: sortedResults,
        total: sortedResults.length,
        query: query.trim()
      };

      // Cache the fallback result
      set(cacheKey, fallbackResponse);

      return fallbackResponse;

    } catch (err) {
      console.error('Fallback search error:', err);
      setError('Search failed. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [search, get, set]);

  return {
    search,
    searchWithFallback,
    isLoading,
    error
  };
};
