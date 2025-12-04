/**
 * Products API Route
 * 
 * Centralized API for fetching products with business_products and businesses JOINs
 * Base table: products
 * JOINs: business_products, businesses
 */

import { supabase } from '@/integrations/supabase/client';
import { getServiceClient } from '@/integrations/supabase/service-client';
import type { BusinessProduct } from '@/lib/products-api';

export interface ProductListParams {
    search?: string;
    businessId?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
}

/**
 * Fetch products using products as base table with JOINs
 * Pattern: products -> business_products -> businesses
 */
export async function fetchProducts(params: ProductListParams = {}) {
    try {
        const {
            search = '',
            businessId,
            category,
            priceMin,
            priceMax,
            isActive = true,
            page = 1,
            pageSize = 20,
        } = params;

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from('products')
            .select('*, business_products()', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        // Apply filters
        if (search.trim()) {
            query = query.or(`name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
        }

        if (category) {
            query = query.eq('category', category);
        }

        if (businessId) {
            query = query.eq('business_products.business_id', businessId);
        }

        if (isActive !== undefined) {
            query = query.eq('business_products.is_active', isActive);
        }

        if (priceMin !== undefined) {
            query = query.gte('business_products.price', priceMin);
        }

        if (priceMax !== undefined) {
            query = query.lte('business_products.price', priceMax);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('[fetchProducts] Error:', error);
            throw error;
        }

        return {
            products: (data || []) as any[],
            total: count || 0,
            page,
            pageSize,
        };
    } catch (error: any) {
        console.error('[fetchProducts] Unexpected error:', error);
        throw error;
    }
}

/**
 * Fetch a single product by ID with JOINs
 * Uses products as base table
 */
export async function fetchProductById(id: string): Promise<any | null> {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('[fetchProductById] Error:', error);
            return null;
        }

        return data;
    } catch (error: any) {
        console.error('[fetchProductById] Unexpected error:', error);
        return null;
    }
}

// Re-export types from products-api for convenience
export type { BusinessProduct } from '@/lib/products-api';


