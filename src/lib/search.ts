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
    // Search businesses - use correct field names: title (not name), is_active (not status)
    // Join with categories to get category title (businesses.category_id -> categories.id)
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select(`
        id,
        title,
        description,
        category_id,
        address,
        latitude,
        longitude,
        is_active,
        categories (id, title, slug)
      `)
      .eq('is_active', true)
      .ilike('title', `%${searchTerm}%`)
      .limit(25);

    if (businessError) {
      console.error('Business search error:', businessError);
    }

    // Search products - simplified to basic query (products have NO category field)
    const { data: products, error: productError } = await supabase
      .from('products')
      .select(`
        id,
        title,
        description,
        price,
        duration,
        is_active,
        searchable,
        image_url,
        stock,
        business_id,
        slug,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .ilike('title', `%${searchTerm}%`)
      .limit(25);

    if (productError) {
      console.error('Product search error:', productError);
    }

    // Format business results
    const businessResults: UnifiedSearchResult[] = (businesses || []).map(business => {
      const categoryTitle = (business.categories as any)?.title || '';
      return {
        type: 'business' as const,
        id: business.id,
        title: business.title || '',
        subtitle: business.description || categoryTitle || business.address || '',
        latitude: business.latitude,
        longitude: business.longitude,
      };
    });

    // Format product results
    const productResults: UnifiedSearchResult[] = (products || []).map(product => ({
      type: 'product' as const,
      id: product.id,
      title: product.title || '',
      subtitle: product.description || '',
      latitude: null,
      longitude: null,
    }));

    // Combine and return results
    return [...businessResults, ...productResults];
  } catch (error) {
    console.error('Unified search error:', error);
    return [];
  }
}

