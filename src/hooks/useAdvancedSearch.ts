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
      // Basic business search using the improved pattern
      const { data: businessMatches, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('status', 'active')
        .ilike('name', `%${query}%`)
        .or(`description.ilike.%${query}%`);

      if (businessError) {
        console.error('Basic business search error:', businessError);
      }

      // Basic product search using the improved pattern
      const { data: productMatches, error: productError } = await supabase
        .from('products')
        .select('*, business:business_id(name, id, category, description, address, island)')
        .eq('status', 'active')
        .eq('business.status', 'active')
        .ilike('name', `%${query}%`)
        .or(`description.ilike.%${query}%`);

      if (productError) {
        console.error('Basic product search error:', productError);
      }

      // Process results using the improved pattern
      const businessResults: SearchResult[] = (businessMatches || []).map(business => {
        let relevanceScore = 0;
        let matchedField: 'name' | 'description' | 'category' | 'services' = 'name';
        let highlight = business.name;

        const queryLower = query.toLowerCase();
        const name = business.name?.toLowerCase() || '';
        const description = business.description?.toLowerCase() || '';
        const category = business.category?.toLowerCase() || '';

        if (name.includes(queryLower)) {
          relevanceScore += 100;
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

      // Process product results using the improved pattern
      const productResults: SearchResult[] = (productMatches || []).map(product => {
        let relevanceScore = 0;
        let matchedField: 'name' | 'description' | 'category' | 'services' = 'name';
        let highlight = `${product.business?.name} – ${product.name}`;

        const queryLower = query.toLowerCase();
        const productName = product.name?.toLowerCase() || '';
        const productDescription = product.description?.toLowerCase() || '';
        const productCategory = product.category?.toLowerCase() || '';

        if (productName.includes(queryLower)) {
          relevanceScore += 100;
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
          product_description: product.description,
          match_detail: product.name
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
