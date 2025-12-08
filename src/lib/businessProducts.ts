/**
 * Business Products Helper
 * 
 * Typed helper functions for managing product assignments between businesses and products.
 * Uses the public.business_products pivot table.
 * 
 * One product can belong to many businesses.
 * Each business can override price, duration, notes, active flag.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Business Product Assignment with joined product data
 */
export interface BusinessProductWithJoin {
    id: string;
    business_id: string;
    product_id: string;
    active: boolean; // Maps to is_active column
    price: number | null;
    duration: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    products: {
        id: string;
        title: string;
        slug: string | null;
        description: string | null;
        base_price: number | null; // Base price from products table
        base_duration: string | null; // Base duration from products table
    } | null;
}

/**
 * Get all product assignments for a business
 * 
 * @param supabase - Supabase client instance (use anon key for browser)
 * @param businessId - Business ID to fetch assignments for
 * @returns Array of business product assignments with joined product data
 */
export async function getBusinessProductAssignments(
    supabase: SupabaseClient<Database>,
    businessId: string
): Promise<BusinessProductWithJoin[]> {
    const { data, error } = await supabase
        .from("business_products")
        .select(`
      id,
      business_id,
      product_id,
      title_override,
      description_override,
      price_override,
      is_active,
      created_at,
      updated_at,
      products:product_id (
        id,
        title,
        slug,
        description,
        price,
        duration
      )
    `)
        .eq("business_id", businessId)
        .order("title", { foreignTable: "products" });

    if (error) {
        console.error("[BusinessProducts] Failed to load assignments", {
            error,
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            businessId
        });
        throw error;
    }

    // Transform data to match interface (map is_active to active, price/duration to base_price/base_duration)
    const transformed = (data ?? []).map((item: any) => ({
        ...item,
        active: item.is_active,
        price: item.price_override || item.products?.price || null,
        duration: item.products?.duration || null,
        notes: null, // notes field removed from schema
        products: item.products ? {
            ...item.products,
            base_price: item.products.price,
            base_duration: item.products.duration
        } : null
    }));

    // Sort by product title (fallback if foreignTable ordering doesn't work)
    const sorted = transformed.sort((a, b) => {
        const titleA = (a.products?.title || '').toLowerCase();
        const titleB = (b.products?.title || '').toLowerCase();
        return titleA.localeCompare(titleB);
    });

    return sorted as BusinessProductWithJoin[];
}

/**
 * Product assignment overrides
 */
export interface ProductAssignmentOverrides {
    title_override?: string | null;
    description_override?: string | null;
    price_override?: number | null;
    active?: boolean; // Maps to is_active column
    is_active?: boolean; // Also support is_active for backward compatibility
    // Legacy fields for backward compatibility
    price?: number | null;
    duration?: string | null;
    notes?: string | null;
}

/**
 * Attach a product to a business with optional overrides
 * 
 * Uses upsert on (business_id, product_id) to avoid duplicates,
 * matching the unique constraint created by SQL.
 * 
 * @param supabase - Supabase client instance (use service role for writes)
 * @param businessId - Business ID
 * @param productId - Product ID
 * @param overrides - Optional price, duration, notes, active overrides
 * @returns Created or updated business product assignment
 */
export async function attachProductToBusiness(
    supabase: SupabaseClient<Database>,
    businessId: string,
    productId: string,
    overrides: ProductAssignmentOverrides = {}
): Promise<BusinessProductWithJoin | null> {
    // Support both active and is_active for backward compatibility
    const isActive = overrides.active !== undefined ? overrides.active :
        (overrides.is_active !== undefined ? overrides.is_active : true);

    const { data, error } = await supabase
        .from("business_products")
        .upsert(
            {
                business_id: businessId,
                product_id: productId,
                title_override: overrides.title_override ?? null,
                description_override: overrides.description_override ?? null,
                price_override: overrides.price_override ?? overrides.price ?? null,
                is_active: isActive,
            },
            {
                onConflict: "business_id,product_id",
                ignoreDuplicates: false,
            }
        )
        .select(`
      id,
      business_id,
      product_id,
      title_override,
      description_override,
      price_override,
      is_active,
      created_at,
      updated_at,
      products:product_id (
        id,
        title,
        slug,
        description,
        price,
        duration
      )
    `)
        .single();

    if (error) {
        console.error("[BusinessProducts] attach failed", {
            error,
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            businessId,
            productId,
            overrides
        });
        throw error;
    }

    // Transform to match interface
    if (!data) return null;

    return {
        ...data,
        active: data.is_active,
        price: data.price_override || data.products?.price || null,
        duration: data.products?.duration || null,
        notes: null,
        products: data.products ? {
            ...data.products,
            base_price: data.products.price,
            base_duration: data.products.duration
        } : null
    } as BusinessProductWithJoin;
}

/**
 * Detach a product from a business
 * 
 * @param supabase - Supabase client instance (use service role for writes)
 * @param businessProductId - Business product assignment ID
 * @returns true if successful
 */
export async function detachProductFromBusiness(
    supabase: SupabaseClient<Database>,
    businessProductId: string
): Promise<boolean> {
    const { error } = await supabase
        .from("business_products")
        .delete()
        .eq("id", businessProductId);

    if (error) {
        console.error("[BusinessProducts] detach failed", {
            error,
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            businessProductId
        });
        throw error;
    }

    return true;
}

/**
 * Update a business product assignment
 * 
 * @param supabase - Supabase client instance (use service role for writes)
 * @param businessProductId - Business product assignment ID
 * @param overrides - Price, duration, notes, active overrides
 * @returns Updated business product assignment
 */
export async function updateBusinessProductAssignment(
    supabase: SupabaseClient<Database>,
    businessProductId: string,
    overrides: ProductAssignmentOverrides
): Promise<BusinessProductWithJoin | null> {
    const updateData: Record<string, any> = {};

    if (overrides.title_override !== undefined) updateData.title_override = overrides.title_override;
    if (overrides.description_override !== undefined) updateData.description_override = overrides.description_override;
    if (overrides.price_override !== undefined) {
        updateData.price_override = overrides.price_override;
    } else if (overrides.price !== undefined) {
        // Legacy support: map price to price_override
        updateData.price_override = overrides.price;
    }

    // Support both active and is_active
    if (overrides.active !== undefined) {
        updateData.is_active = overrides.active;
    } else if (overrides.is_active !== undefined) {
        updateData.is_active = overrides.is_active;
    }

    // Always update updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .from("business_products")
        .update(updateData)
        .eq("id", businessProductId)
        .select(`
      id,
      business_id,
      product_id,
      title_override,
      description_override,
      price_override,
      is_active,
      created_at,
      updated_at,
      products:product_id (
        id,
        title,
        slug,
        description,
        price,
        duration
      )
    `)
        .single();

    if (error) {
        console.error("[BusinessProducts] update failed", {
            error,
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            businessProductId,
            overrides,
            updateData
        });
        throw error;
    }

    // Transform to match interface
    if (!data) return null;

    return {
        ...data,
        active: data.is_active,
        price: data.price_override || data.products?.price || null,
        duration: data.products?.duration || null,
        notes: null,
        products: data.products ? {
            ...data.products,
            base_price: data.products.price,
            base_duration: data.products.duration
        } : null
    } as BusinessProductWithJoin;
}

