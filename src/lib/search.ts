import { supabase } from '@/integrations/supabase/client';

export interface UnifiedSearchResult {
  type: 'business' | 'product';
  id: string;
  title: string;
  subtitle: string;
  latitude: number | null;
  longitude: number | null;
  businessId?: string; // For products, the business_id
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
    // Search businesses
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, description, latitude, longitude, category, address')
      .eq('status', 'active')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .limit(25);

    if (businessError) {
      console.error('Business search error:', businessError);
    }

    // Search products
    const { data: products, error: productError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        business_id,
        businesses!inner (
          id,
          name,
          latitude,
          longitude,
          address
        )
      `)
      .eq('status', 'active')
      .eq('searchable', true)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .limit(25);

    if (productError) {
      console.error('Product search error:', productError);
    }

    // Format business results
    const businessResults: UnifiedSearchResult[] = (businesses || []).map(business => ({
      type: 'business' as const,
      id: business.id,
      title: business.name,
      subtitle: business.description || business.category || business.address || '',
      latitude: business.latitude,
      longitude: business.longitude,
    }));

    // Format product results
    const productResults: UnifiedSearchResult[] = (products || []).map(product => ({
      type: 'product' as const,
      id: product.id,
      title: product.name,
      subtitle: `${product.businesses?.name || ''}${product.price ? ` - ${product.price} SCR` : ''}`,
      latitude: product.businesses?.latitude || null,
      longitude: product.businesses?.longitude || null,
      businessId: product.business_id,
    }));

    // Combine and return results
    return [...businessResults, ...productResults];
  } catch (error) {
    console.error('Unified search error:', error);
    return [];
  }
}

