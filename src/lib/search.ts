import { supabase } from '@/integrations/supabase/client';

export interface UnifiedSearchResult {
  type: 'business' | 'product';
  id: string;
  title: string;
  subtitle: string;
  latitude: number | null;
  longitude: number | null;
  businessId?: string; // For products, the business_id from business_products
}

/**
 * Unified search function that searches both businesses and products
 * Returns results in a standardized format with type, id, title, subtitle, latitude, longitude
 */
export async function unifiedSearch(query: string): Promise<UnifiedSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = query.trim();

  try {
    // Search businesses - simplified to ilike(title) only
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('id, title, description, category, address, latitude, longitude, island, status')
      .eq('status', 'active')
      .ilike('title', `%${searchTerm}%`)
      .limit(25);

    // Silent error handling - continue with empty results if query fails
    if (businessError) {
      // Continue with empty business results
    }

    // Search products - simplified to basic query
    const { data: products, error: productError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        category_id,
        image_url,
        price,
        duration,
        slug,
        is_active,
        searchable,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .ilike('name', `%${searchTerm}%`)
      .limit(25);

    // Silent error handling - continue with empty results if query fails
    if (productError) {
      // Continue with empty product results
    }

    // Format business results
    const businessResults: UnifiedSearchResult[] = (businesses || []).map(business => ({
      type: 'business' as const,
      id: business.id,
      title: business.title,
      subtitle: business.description || business.category || business.address || '',
      latitude: business.latitude,
      longitude: business.longitude,
    }));

    // Format product results
    const productResults: UnifiedSearchResult[] = (products || []).map(product => ({
      type: 'product' as const,
      id: product.id,
      title: product.name,
      subtitle: product.description || product.category || '',
      latitude: null,
      longitude: null,
    }));

    // Combine and return results
    return [...businessResults, ...productResults];
  } catch (error) {
    // Silent error handling - return empty results
    return [];
  }
}

