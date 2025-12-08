import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  type: 'business' | 'product';
  name: string;
  description: string;
  category: string;
  price?: number;
  image_url?: string;
  business_name?: string;
  business_address?: string;
  business_island?: string;
  rank: number;
}

interface UnifiedSearchOptions {
  query: string;
  category?: string;
  priceMin?: number;
  priceMax?: number;
  businessId?: string;
  limit?: number;
}

export const useUnifiedSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (options: UnifiedSearchOptions): Promise<SearchResult[]> => {
    const {
      query,
      category,
      priceMin,
      priceMax,
      businessId,
      limit = 50
    } = options;

    setLoading(true);
    setError(null);

    try {
      // Search businesses
      const businessQuery = supabase
        .from('businesses')
        .select(`
          id,
          name,
          description,
          category,
          logo_url,
          address,
          island,
          status
        `)
        .eq('status', 'active')
        .limit(limit / 2);

      if (query) {
        businessQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      }

      if (category) {
        businessQuery.eq('category', category);
      }

      // Search products via business_products join table
      const productQuery = supabase
        .from('business_products')
        .select(`
          id,
          title_override,
          description_override,
          price_override,
          is_active,
          product:products!inner (
            id,
            title,
            description,
            image_url,
            price,
            duration,
            is_active,
            searchable,
            stock,
            slug
          ),
          business:businesses!inner (
            id,
            name,
            address,
            island
          )
        `)
        .eq('is_active', true)
        .eq('product.is_active', true)
        .limit(limit / 2);

      if (query) {
        productQuery.or(`
          product.title.ilike.%${query}%,
          product.description.ilike.%${query}%,
          title_override.ilike.%${query}%,
          description_override.ilike.%${query}%
        `);
      }

      // Category filter removed - products don't have category field
      // if (category) {
      //   productQuery.eq('product.category', category);
      // }

      if (priceMin !== undefined) {
        productQuery.gte('price_override', priceMin);
      }

      if (priceMax !== undefined) {
        productQuery.lte('price_override', priceMax);
      }

      if (businessId) {
        productQuery.eq('business_id', businessId);
      }

      // Execute both queries in parallel
      const [businessResult, productResult] = await Promise.all([
        businessQuery,
        productQuery
      ]);

      if (businessResult.error) throw businessResult.error;
      if (productResult.error) throw productResult.error;

      // Format results
      const businessResults: SearchResult[] = (businessResult.data || []).map(business => ({
        id: business.id,
        type: 'business' as const,
        name: business.name,
        description: business.description || '',
        category: business.category,
        image_url: business.logo_url,
        business_name: business.name,
        business_address: business.address,
        business_island: business.island,
        rank: calculateRank(business.name, business.description || '', query)
      }));

      const productResults: SearchResult[] = (productResult.data || []).map((bp: any) => {
        const product = bp.product || {};
        const business = bp.business || {};
        const displayName = bp.title_override || product.title || 'Unknown Product';
        const displayDescription = bp.description_override || product.description || '';
        return {
          id: bp.id,
          type: 'product' as const,
          name: displayName,
          description: displayDescription,
          category: '', // Category removed from products schema
          price: bp.price_override || product.price || 0,
          image_url: product.image_url,
          business_name: business.name,
          business_address: business.address,
          business_island: business.island,
          rank: calculateRank(displayName, displayDescription, query)
        };
      });

      // Combine and sort by rank
      const allResults = [...businessResults, ...productResults]
        .sort((a, b) => b.rank - a.rank)
        .slice(0, limit);

      return allResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('Search error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const searchBusinesses = async (query: string, limit = 25): Promise<SearchResult[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          id,
          name,
          description,
          category,
          logo_url,
          address,
          island
        `)
        .eq('status', 'active')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(limit);

      if (error) throw error;

      return (data || []).map(business => ({
        id: business.id,
        type: 'business' as const,
        name: business.name,
        description: business.description || '',
        category: business.category,
        image_url: business.logo_url,
        business_name: business.name,
        business_address: business.address,
        business_island: business.island,
        rank: calculateRank(business.name, business.description || '', query)
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Business search failed';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (query: string, limit = 25): Promise<SearchResult[]> => {
    setLoading(true);
    setError(null);

    try {
      // Use business_products as base table with JOINs
      // Pattern: business_products -> products -> businesses
      const { data, error } = await supabase
        .from('business_products')
        .select(`
          id,
          business_id,
          product_id,
          title_override,
          description_override,
          price_override,
          is_active,
          product:products!inner (
            id,
            title,
            description,
            image_url,
            price,
            duration,
            is_active,
            searchable,
            stock,
            slug
          ),
          business:businesses!inner (
            id,
            name,
            address,
            island
          )
        `)
        .eq('is_active', true)
        .eq('product.is_active', true)
        .eq('product.searchable', true)
        .or(`product.title.ilike.%${query}%,product.description.ilike.%${query}%,title_override.ilike.%${query}%,description_override.ilike.%${query}%`)
        .limit(limit);

      if (error) {
        console.error('[searchProducts] Error:', error);
        throw error;
      }

      // Transform business_products data
      const results: SearchResult[] = (data || []).map((bp: any) => {
        const product = bp.product || {};
        const business = bp.business || {};
        const displayName = bp.title_override || product.title || '';
        const displayDescription = bp.description_override || product.description || '';
        return {
          id: bp.id,
          type: 'product' as const,
          name: displayName,
          description: displayDescription,
          category: '', // Category removed from products schema
          price: bp.price_override || product.price || 0,
          image_url: product.image_url,  // Single string, not array
          business_name: business.name,
          business_address: business.address,
          business_island: business.island,
          rank: calculateRank(displayName, displayDescription, query)
        };
      });

      return results;
    } catch (err: any) {
      const errorMessage = err?.message || 'Product search failed';
      console.error('[searchProducts] Error:', err);
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    search,
    searchBusinesses,
    searchProducts,
    loading,
    error
  };
};

// Helper function to calculate search rank
const calculateRank = (name: string, description: string, query: string): number => {
  if (!query) return 1.0;

  const queryLower = query.toLowerCase();
  const nameLower = name.toLowerCase();
  const descriptionLower = description.toLowerCase();

  let rank = 0;

  // Exact name match gets highest rank
  if (nameLower === queryLower) rank += 10;
  // Name starts with query
  else if (nameLower.startsWith(queryLower)) rank += 8;
  // Name contains query
  else if (nameLower.includes(queryLower)) rank += 6;

  // Description contains query
  if (descriptionLower.includes(queryLower)) rank += 3;

  // Boost for shorter names (more specific matches)
  rank += Math.max(0, 5 - name.length / 10);

  return rank;
};

export default useUnifiedSearch;
















