/**
 * Categories API Route
 * 
 * Centralized API for fetching categories with proper error handling
 */

import { supabase } from '@/integrations/supabase/client';

export interface Category {
    id: string;
    name: string;
    slug?: string; // May not exist in schema, generated from name
    description: string | null;
    is_active: boolean;
    created_at: string;
}

/**
 * Fetch all active categories
 */
export async function fetchCategories(): Promise<Category[]> {
    const { data, error } = await supabase
        .from('categories')
        .select('id, name, description, is_active, created_at')
        .eq('is_active', true)
        .order('name', { ascending: true });

    if (import.meta.env.DEV) {
        console.log('[HOMEPAGE] categories returned:', data, 'error:', error);
    }

    if (error) {
        console.error('[fetchCategories] Error:', error);
        throw new Error('Homepage categories query failed: ' + error.message);
    }

    if (data && data.length === 0 && import.meta.env.DEV) {
        console.warn('[HOMEPAGE] categories table is EMPTY');
    }

    return (data || []) as Category[];
}

/**
 * Fetch a single category by slug
 */
export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
    const { data, error } = await supabase
        .from('categories')
        .select('id, name, description, is_active, created_at')
        .eq('is_active', true)
        .single();

    if (error) {
        console.error('[fetchCategoryBySlug] Error:', error);
        throw new Error('Category query failed: ' + error.message);
    }

    return data as Category | null;
}




