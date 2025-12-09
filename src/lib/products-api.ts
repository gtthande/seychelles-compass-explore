/**
 * Products API Helper
 * 
 * Handles product operations using the many-to-many business_products model:
 * - products = master catalogue (no business_id)
 * - business_products = business-specific instance with pricing, duration, notes
 */

import { supabase } from "@/integrations/supabase/client";
import { getServiceClient } from "@/integrations/supabase/service-client";
import { slugify } from "@/lib/utils";

/**
 * Business Product (join table row with product and business data)
 * Normalized structure: { id: join_id, product: {...}, business: {...} }
 * 
 * Unified schema: id, business_id, product_id, price_override, title_override, description_override
 */
export interface BusinessProduct {
    id: string;
    business_id: string;
    product_id: string;
    title_override: string | null;
    description_override: string | null;
    price_override: number | null;  // Primary price field (unified schema)
    is_active?: boolean;
    created_at: string;
    updated_at: string;
    // Joined data - normalized structure with all fields
    business?: {
        id: string;
        title: string;
        description: string | null;
        category_id: string | null;
        phone: string | null;
        email: string | null;
        website: string | null;
        address: string | null;
        is_active: boolean;
        searchable: boolean;
        slug: string;
        image_url: string | null;
        created_at: string;
        updated_at: string;
    };
    product?: {
        id: string;
        title: string;
        description: string | null;
        price: number | null;
        duration: string | null;
        is_active: boolean;
        searchable: boolean;
        image_url: string | null;  // Single URL (TEXT, not array)
        stock: number;
        slug: string;
        business_id: string | null;
        created_at: string;
        updated_at: string;
    };
}

/**
 * Product interface matching unified Station-2100 / iCompass schema
 * Imported from src/types/product.ts for consistency
 */
import type { Product } from '@/types/product';
export type { Product };

/**
 * Parameters for fetching business products
 * Note: category filter removed - products have NO category field
 * Only businesses have category_id
 */
export interface BusinessProductListParams {
    search?: string;
    businessId?: string;
    priceMin?: number;
    priceMax?: number;
    isActive?: boolean;
    limit?: number;
    offset?: number;
}

/**
 * Fetch products with business_products and businesses JOINs
 * Note: This function queries business_products, not products directly
 * Returns normalized structure: { id: join_id, product: {...}, business: {...} }
 */
export async function fetchProducts(
    params: BusinessProductListParams = {}
): Promise<{ products: any[]; total: number }> {
    try {
        // Query business_products with many-to-many join pattern
        // This matches: SELECT business_products.id, products.*, businesses.*
        // Returns normalized: { id: join_id, product: {...}, business: {...} }
        let query = supabase
            .from('business_products')
            .select(`
        id,
        business_id,
        product_id,
        title_override,
        description_override,
        price_override,
        created_at,
        updated_at,
        business:businesses (
          id,
          title,
          description,
          category_id,
          phone,
          email,
          website,
          address,
          is_active,
          searchable,
          slug,
          image_url,
          created_at,
          updated_at
        ),
        product:products!inner (
          id,
          title,
          description,
          price,
          duration,
          is_active,
          searchable,
          image_url,
          stock,
          slug,
          created_at,
          updated_at
        )
      `, { count: 'exact' });

        // Apply filters
        if (params.businessId) {
            query = query.eq('business_id', params.businessId);
        }

        if (params.isActive !== undefined) {
            query = query.eq('is_active', params.isActive);
        }

        if (params.priceMin !== undefined) {
            query = query.gte('price_override', params.priceMin);
        }

        if (params.priceMax !== undefined) {
            query = query.lte('price_override', params.priceMax);
        }

        // Category filter removed - category no longer exists in products table
        // if (params.category) {
        //     query = query.eq('product.category', params.category);
        // }

        if (params.search) {
            query = query.or(`
        product.title.ilike.%${params.search}%,
        product.description.ilike.%${params.search}%,
        title_override.ilike.%${params.search}%,
        description_override.ilike.%${params.search}%
      `);
        }

        // Apply pagination
        const limit = params.limit || 100;
        const offset = params.offset || 0;
        query = query.range(offset, offset + limit - 1);

        // Order by id (business_products.id)
        query = query.order('id', { ascending: true });

        const { data, error, count } = await query;

        if (error) {
            console.error('Products error:', error);
            throw error;
        }

        return {
            products: (data ?? []) as any[],
            total: count ?? 0,
        };
    } catch (error: any) {
        console.error('Products error:', error);
        throw error;
    }
}

/**
 * Fetch business products with filters (legacy function for compatibility)
 * Uses safe query pattern: business_products LEFT JOIN products LEFT JOIN businesses
 * Returns normalized structure: { id: join_id, product: {...}, business: {...} }
 */
export async function fetchBusinessProducts(
    params: BusinessProductListParams = {}
): Promise<{ businessProducts: BusinessProduct[]; total: number }> {
    try {
        // Query business_products with joins to products and businesses
        // This matches: SELECT business_products.id, products.*, businesses.*
        // Returns normalized: { id: join_id, product: {...}, business: {...} }
        let query = supabase
            .from('business_products')
            .select(`
        id,
        business_id,
        product_id,
        title_override,
        description_override,
        price_override,
        created_at,
        updated_at,
        business:businesses (
          id,
          title,
          description,
          category_id,
          phone,
          email,
          website,
          address,
          is_active,
          searchable,
          slug,
          image_url,
          created_at,
          updated_at
        ),
        product:products!inner (
          id,
          title,
          description,
          price,
          duration,
          is_active,
          searchable,
          image_url,
          stock,
          slug,
          created_at,
          updated_at
        )
      `, { count: 'exact' });

        // Apply filters - only use fields that exist
        if (params.businessId) {
            query = query.eq('business_id', params.businessId);
        }

        if (params.isActive !== undefined) {
            query = query.eq('is_active', params.isActive);
        }

        if (params.priceMin !== undefined) {
            query = query.gte('price_override', params.priceMin);
        }

        if (params.priceMax !== undefined) {
            query = query.lte('price_override', params.priceMax);
        }

        // Category filter removed - category no longer exists in products table
        // if (params.category) {
        //     query = query.eq('product.category', params.category);
        // }

        if (params.search) {
            query = query.or(`
        product.title.ilike.%${params.search}%,
        product.description.ilike.%${params.search}%,
        title_override.ilike.%${params.search}%,
        description_override.ilike.%${params.search}%
      `);
        }

        // Apply pagination
        const limit = params.limit || 100;
        const offset = params.offset || 0;
        query = query.range(offset, offset + limit - 1);

        // Order by id (business_products.id)
        query = query.order('id', { ascending: true });

        const { data, error, count } = await query;

        if (error) {
            console.error('Products error:', error);
            throw error;
        }

        return {
            businessProducts: (data ?? []) as BusinessProduct[],
            total: count ?? 0,
        };
    } catch (error: any) {
        console.error('Products error:', error);
        throw error;
    }
}

/**
 * Create a product
 * Uses unified schema fields (business_id is NOT inserted here - use business_products table for linking)
 * Uses service role for writes
 */
export async function createProductMaster(
    productData: {
        title: string; // Required
        description?: string;
        price?: number;
        duration?: string;
        is_active?: boolean;
        searchable?: boolean;
        image_url?: string | string[]; // Single URL string (or array for backward compatibility)
        stock?: number;
        slug?: string;
    }
): Promise<Product | null> {
    try {
        const serviceClient = getServiceClient();
        
        // Generate slug if not provided
        const slug = productData.slug || slugify(productData.title);
        
        // Build insert object with unified schema fields (NO business_id - linking happens in business_products)
        const insertData: any = {
            title: productData.title, // Required
            description: productData.description || null,
            price: productData.price ?? null,
            duration: productData.duration || null,
            is_active: productData.is_active ?? true,
            searchable: productData.searchable ?? true,
            image_url: Array.isArray(productData.image_url) 
                ? (productData.image_url[0] || null) 
                : (productData.image_url || null),  // Convert array to single string
            stock: productData.stock ?? 0,
            slug: slug,
        };

        const { data, error } = await serviceClient
            .from('products')
            .insert(insertData)
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
              created_at
            `)
            .single();

        if (error) {
            console.error('Products error:', error);
            throw error;
        }

        // Map response to Product interface
        const item = data as any;
        return {
            id: item.id,
            title: item.title || '',
            description: item.description || null,
            price: item.price ? Number(item.price) : null,
            duration: item.duration || null,
            is_active: item.is_active ?? true,
            searchable: item.searchable ?? true,
            image_url: item.image_url || null,  // Single string, not array
            stock: item.stock ?? 0,
            slug: item.slug || '',
            business_id: item.business_id || null,
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
        } as Product;
    } catch (error: any) {
        console.error('Products error:', error);
        throw error;
    }
}

/**
 * Update a product
 * Updates unified schema fields
 * Uses service role for writes
 */
export async function updateProductMaster(
    productId: string,
    productData: {
        title?: string;
        description?: string;
        price?: number;
        duration?: string;
        is_active?: boolean;
        searchable?: boolean;
        image_url?: string | string[]; // Single URL string (or array for backward compatibility)
        stock?: number;
        slug?: string;
        business_id?: string | null;
    }
): Promise<Product | null> {
    try {
        const serviceClient = getServiceClient();
        
        // Build update object with only provided fields
        const updates: any = {};
        if (productData.title !== undefined) updates.title = productData.title;
        if (productData.description !== undefined) updates.description = productData.description;
        if (productData.price !== undefined) updates.price = productData.price;
        if (productData.duration !== undefined) updates.duration = productData.duration;
        if (productData.is_active !== undefined) updates.is_active = productData.is_active;
        if (productData.searchable !== undefined) updates.searchable = productData.searchable;
        if (productData.image_url !== undefined) {
            updates.image_url = Array.isArray(productData.image_url) 
                ? (productData.image_url[0] || null) 
                : productData.image_url;  // Convert array to single string
        }
        if (productData.stock !== undefined) updates.stock = productData.stock;
        if (productData.slug !== undefined) updates.slug = productData.slug;
        if (productData.business_id !== undefined) updates.business_id = productData.business_id;
        
        // Always update updated_at
        updates.updated_at = new Date().toISOString();

        const { data, error } = await serviceClient
            .from('products')
            .update(updates)
            .eq('id', productId)
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
            .single();

        if (error) {
            console.error('Products error:', error);
            throw error;
        }

        // Map response to Product interface
        const item = data as any;
        return {
            id: item.id,
            title: item.title || '',
            description: item.description || null,
            price: item.price ? Number(item.price) : null,
            duration: item.duration || null,
            is_active: item.is_active ?? true,
            searchable: item.searchable ?? true,
            image_url: item.image_url || null,  // Single string, not array
            stock: item.stock ?? 0,
            slug: item.slug || '',
            business_id: item.business_id || null,
            created_at: item.created_at,
            updated_at: item.updated_at,
        } as Product;
    } catch (error: any) {
        console.error('Products error:', error);
        throw error;
    }
}

/**
 * Create a business-product link
 * Uses service role for writes
 */
export async function createBusinessProduct(
    linkData: {
        business_id: string;
        product_id: string;
        title_override?: string | null;
        description_override?: string | null;
        price_override?: number | null;
        is_active?: boolean;
    }
): Promise<BusinessProduct | null> {
    try {
        const serviceClient = getServiceClient();
        const { data, error } = await serviceClient
            .from('business_products')
            .insert({
                business_id: linkData.business_id,
                product_id: linkData.product_id,
                title_override: linkData.title_override || null,
                description_override: linkData.description_override || null,
                price_override: linkData.price_override ?? null,
                is_active: linkData.is_active ?? true,
            })
            .select(`
        id,
        business_id,
        product_id,
        title_override,
        description_override,
        price_override,
        created_at,
        updated_at,
        product:products (
          id,
          title,
          description,
          price,
          duration,
          is_active,
          searchable,
          image_url,
          stock,
          slug,
          created_at,
          updated_at
        ),
        business:businesses (
          id,
          title,
          description,
          category_id,
          phone,
          email,
          website,
          address,
          is_active,
          searchable,
          slug,
          image_url,
          created_at,
          updated_at
        )
      `)
            .single();

        if (error) {
            console.error('Products error:', error);
            throw error;
        }

        return data as BusinessProduct;
    } catch (error: any) {
        console.error('Products error:', error);
        throw error;
    }
}

/**
 * Update a business-product link
 * Uses service role for writes
 */
export async function updateBusinessProduct(
    id: string,
    updates: Partial<{
        title_override: string | null;
        description_override: string | null;
        price_override: number | null;
        is_active: boolean;
    }>
): Promise<BusinessProduct | null> {
    try {
        const serviceClient = getServiceClient();
        const { data, error } = await serviceClient
            .from('business_products')
            .update(updates)
            .eq('id', id)
            .select(`
        id,
        business_id,
        product_id,
        title_override,
        description_override,
        price_override,
        created_at,
        updated_at,
        product:products (
          id,
          title,
          description,
          price,
          duration,
          is_active,
          searchable,
          image_url,
          stock,
          slug,
          created_at,
          updated_at
        ),
        business:businesses (
          id,
          title,
          description,
          category_id,
          phone,
          email,
          website,
          address,
          is_active,
          searchable,
          slug,
          image_url,
          created_at,
          updated_at
        )
      `)
            .single();

        if (error) {
            console.error('Products error:', error);
            throw error;
        }

        return data as BusinessProduct;
    } catch (error: any) {
        console.error('Products error:', error);
        throw error;
    }
}

/**
 * Delete a business-product link
 * Uses service role for writes
 */
export async function deleteBusinessProduct(id: string): Promise<boolean> {
    try {
        const serviceClient = getServiceClient();
        const { error } = await serviceClient
            .from('business_products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Products error:', error);
            throw error;
        }

        return true;
    } catch (error: any) {
        console.error('Products error:', error);
        throw error;
    }
}

/**
 * Fetch all products (for dropdown/selection)
 * Selects only real existing columns and maps image_url to string (not array)
 */
export async function fetchAllProducts(): Promise<Product[]> {
    try {
        const { data, error } = await supabase
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
            .order('title');

        if (error) {
            console.error('Products error:', error);
            return [];
        }

        // Map image_url to string (not array) and set defaults
        return (data ?? []).map((item: any) => ({
            id: item.id,
            title: item.title || '',
            description: item.description || null,
            price: item.price ? Number(item.price) : null,
            duration: item.duration || null,
            is_active: item.is_active ?? true,
            searchable: item.searchable ?? true,
            image_url: item.image_url || null,  // Single string, not array
            stock: item.stock ?? 0,
            slug: item.slug || '',
            business_id: item.business_id || null,
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
        })) as Product[];
    } catch (error: any) {
        console.error('Products error:', error);
        return [];
    }
}

/**
 * Attach a product to a business (create business_product link)
 */
export async function attachProductToBusiness(
    productId: string,
    businessId: string,
    overrides: {
        title_override?: string | null;
        description_override?: string | null;
        price_override?: number | null;
        is_active?: boolean;
    } = {}
): Promise<BusinessProduct | null> {
    return createBusinessProduct({
        business_id: businessId,
        product_id: productId,
        ...overrides,
    });
}

/**
 * Detach a product from a business (delete business_product link)
 */
export async function detachProductFromBusiness(id: string): Promise<boolean> {
    return deleteBusinessProduct(id);
}

/**
 * Update a business-product assignment
 */
export async function updateBusinessProductAssignment(
    id: string,
    overrides: {
        title_override?: string | null;
        description_override?: string | null;
        price_override?: number | null;
        is_active?: boolean;
    }
): Promise<BusinessProduct | null> {
    return updateBusinessProduct(id, overrides);
}

/**
 * Get all products (master catalogue) - for dropdown/selection
 * Alias for fetchAllProducts for consistency
 */
export async function getAllProducts(): Promise<Product[]> {
    return fetchAllProducts();
}

/**
 * Get products linked to a specific business
 */
export async function getProductsByBusiness(businessId: string): Promise<BusinessProduct[]> {
    try {
        const result = await fetchBusinessProducts({ businessId, limit: 1000 });
        return result.businessProducts;
    } catch (error: any) {
        console.error('Products error:', error);
        throw error;
    }
}

/**
 * Get all businesses linked to a specific product
 */
export async function getLinkedBusinessesForProduct(productId: string): Promise<BusinessProduct[]> {
    try {
        const { data, error } = await supabase
            .from('business_products')
            .select(`
        id,
        business_id,
        product_id,
        title_override,
        description_override,
        price_override,
        created_at,
        updated_at,
        business:businesses(
            id,
            title,
            address,
            is_active
        )
      `)
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Products error:', error);
            throw error;
        }

        return (data ?? []) as BusinessProduct[];
    } catch (error: any) {
        console.error('Products error:', error);
        throw error;
    }
}

/**
 * Link a product to a business (create business_product link)
 * Alias for attachProductToBusiness for consistency
 */
export async function linkProductToBusiness(
    productId: string,
    businessId: string,
    overrides: {
        title_override?: string | null;
        description_override?: string | null;
        price_override?: number | null;
        is_active?: boolean;
    } = {}
): Promise<BusinessProduct | null> {
    return attachProductToBusiness(productId, businessId, overrides);
}

