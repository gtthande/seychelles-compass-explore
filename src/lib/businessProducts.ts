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
        name: string;
        description: string | null;
        price: number | null;
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
      is_active,
      price,
      duration,
      notes,
      created_at,
      updated_at,
      products:product_id (
        id,
        name,
        description,
        price,
        image_url,
        category_id
      )
    `)
        .eq("business_id", businessId)
        .order("name", { foreignTable: "products" });

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

    // Transform data to match interface (map is_active to active)
    const transformed = (data ?? []).map((item: any) => ({
        ...item,
        active: item.is_active,
        products: item.products || null
    }));

    // Sort by product name (fallback if foreignTable ordering doesn't work)
    const sorted = transformed.sort((a, b) => {
        const nameA = (a.products?.name || '').toLowerCase();
        const nameB = (b.products?.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });

    return sorted as BusinessProductWithJoin[];
}

/**
 * Product assignment overrides
 */
export interface ProductAssignmentOverrides {
    price?: number | null;
    duration?: string | null;
    notes?: string | null;
    active?: boolean; // Maps to is_active column
    is_active?: boolean; // Also support is_active for backward compatibility
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
                price: overrides.price ?? null,
                duration: overrides.duration ?? null,
                notes: overrides.notes ?? null,
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
      is_active,
      price,
      duration,
      notes,
      created_at,
      updated_at,
      products:product_id (
        id,
        name,
        description,
        price,
        image_url,
        category_id
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
        products: data.products || null
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

    if (overrides.price !== undefined) updateData.price = overrides.price;
    if (overrides.duration !== undefined) updateData.duration = overrides.duration;
    if (overrides.notes !== undefined) updateData.notes = overrides.notes;

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
      is_active,
      price,
      duration,
      notes,
      created_at,
      updated_at,
      products:product_id (
        id,
        name,
        description,
        price,
        image_url,
        category_id
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
        products: data.products || null
    } as BusinessProductWithJoin;
}

