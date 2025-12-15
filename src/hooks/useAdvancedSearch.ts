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
      return cachedResult;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the advanced search function
      const { data, error: searchError } = await supabase
        .rpc('search_businesses_and_products', {
          search_query: query.trim(),
          result_limit: limit
        });

      if (searchError) {
        // Silent fallback - don't log RPC errors, fallback will handle it
        return null;
      }

      const results = data || [];

      const searchResponse = {
        results,
        total: results.length,
        query: query.trim()
      };

      // Cache the result
      set(cacheKey, searchResponse);

      return searchResponse;

    } catch (err) {
      // Silent error handling - fallback will be used
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
    setIsLoading(true);
    setError(null);

    try {
      // Basic business search using the improved pattern - optimized with specific fields and limits
      const { data: businessMatches, error: businessError } = await supabase
        .from('businesses')
        .select('id, title, description, category, address, island, featured, status')
        .eq('status', 'active')
        .ilike('title', `%${query}%`)
        .or(`description.ilike.%${query}%`)
        .limit(limit);

      // Silent error handling - continue with empty results if query fails
      if (businessError) {
        // Continue with empty business results
      }

      // Basic product search via business_products join table
      // Products don't have business_id directly - they're linked via business_products
      const { data: productMatches, error: productError } = await supabase
        .from('business_products')
        .select(`
          id,
          business_id,
          product_id,
          price,
          is_active,
          product:products!inner (
            id,
            name,
            description,
            category_id,
            image_url,
            price,
            is_active
          ),
          business:businesses!inner (
            id,
            title,
            description,
            category,
            address,
            island,
            status
          )
        `)
        .eq('is_active', true)
        .eq('business.status', 'active')
        .eq('product.is_active', true)
        .or(`product.name.ilike.%${query}%,product.description.ilike.%${query}%`)
        .limit(limit);

      // Silent error handling - continue with empty results if query fails
      if (productError) {
        // Continue with empty product results
      }

      // Process results using the improved pattern
      const businessResults: SearchResult[] = (businessMatches || []).map(business => {
        let relevanceScore = 0;
        let matchedField: 'name' | 'description' | 'category' | 'services' = 'name';
        let highlight = business.title;

        const queryLower = query.toLowerCase();
        const title = business.title?.toLowerCase() || '';
        const description = business.description?.toLowerCase() || '';
        const category = business.category?.toLowerCase() || '';

        if (title.includes(queryLower)) {
          relevanceScore += 100;
          matchedField = 'name';
          highlight = business.title;
        } else if (description.includes(queryLower)) {
          relevanceScore += 75;
          matchedField = 'description';
          highlight = `${business.title} – ${business.description}`;
        } else if (category.includes(queryLower)) {
          relevanceScore += 50;
          matchedField = 'category';
          highlight = `${business.title} – ${business.category}`;
        }

        if (business.featured) {
          relevanceScore += 30;
        }

        return {
          business_id: business.id,
          business_name: business.title,
          business_description: business.description,
          business_address: business.address,
          business_island: business.island,
          match_source: 'business' as const,
          matched_field: matchedField,
          highlight,
          relevance_score: relevanceScore
        };
      });

      // Process product results using the improved pattern
      const productResults: SearchResult[] = (productMatches || []).map((bp: any) => {
        const product = bp.product || {};
        const business = bp.business || {};
        const productName = product.name || '';
        const productDescription = product.description || '';
        
        let relevanceScore = 0;
        let matchedField: 'name' | 'description' | 'category' | 'services' = 'name';
        let highlight = `${business.title} – ${productName}`;

        const queryLower = query.toLowerCase();
        const nameLower = productName.toLowerCase();
        const descLower = productDescription.toLowerCase();

        if (nameLower.includes(queryLower)) {
          relevanceScore += 100;
          matchedField = 'name';
          highlight = `${business.title} – offers ${productName}`;
        } else if (descLower.includes(queryLower)) {
          relevanceScore += 75;
          matchedField = 'description';
          highlight = `${business.title} – ${productName}: ${productDescription}`;
        }

        return {
          business_id: bp.business_id,
          business_name: business.title || '',
          business_description: business.description,
          business_address: business.address,
          business_island: business.island,
          match_source: 'product' as const,
          matched_field: matchedField,
          highlight,
          relevance_score: relevanceScore,
          product_name: productName,
          product_description: productDescription,
          match_detail: productName
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
      // Silent error handling - return empty results
      setError(null);
      return { results: [], total: 0, query: query.trim() };
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
