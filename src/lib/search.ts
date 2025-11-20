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

    // Search business_products (products linked to businesses)
    const { data: businessProducts, error: productError } = await supabase
      .from('business_products')
      .select(`
        id,
        business_id,
        price_from,
        price_to,
        currency_code,
        title_override,
        description_override,
        business:businesses!inner (
          id,
          name,
          latitude,
          longitude,
          address
        ),
        product:products!inner (
          id,
          name,
          description,
          searchable
        )
      `)
      .eq('is_active', true)
      .eq('product.searchable', true)
      .or(`product.name.ilike.%${searchTerm}%,product.description.ilike.%${searchTerm}%,title_override.ilike.%${searchTerm}%,description_override.ilike.%${searchTerm}%`)
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
    const productResults: UnifiedSearchResult[] = (businessProducts || []).map(bp => {
      const title = bp.title_override || bp.product?.name || '';
      const subtitle = bp.description_override || bp.product?.description || '';
      const price = bp.price_from ? `${bp.price_from} ${bp.currency_code || 'SCR'}` : '';
      return {
        type: 'product' as const,
        id: bp.id,
        title,
        subtitle: `${bp.business?.name || ''}${price ? ` - ${price}` : ''}`,
        latitude: bp.business?.latitude || null,
        longitude: bp.business?.longitude || null,
        businessId: bp.business_id,
      };
    });

    // Combine and return results
    return [...businessResults, ...productResults];
  } catch (error) {
    console.error('Unified search error:', error);
    return [];
  }
}

