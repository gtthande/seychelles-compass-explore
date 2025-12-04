/**
 * Businesses API Route
 * 
 * Centralized API for fetching businesses with proper error handling
 */

import { supabase } from '@/integrations/supabase/client';

export interface Category {
    id: string;
    name: string;
    description: string | null;
    active: boolean;
}

export interface Business {
    id: string;
    owner_id: string;
    name: string;
    description: string | null;
    category_id: string | null; // Legacy field, kept for backward compatibility
    status: string;
    phone: string | null;
    email: string | null;
    website: string | null;
    address: string | null;
    island: string | null;
    latitude: number | null;
    longitude: number | null;
    featured: boolean;
    verified: boolean;
    logo_url: string | null;
    cover_image_url: string | null;
    average_rating: number | null;
    total_reviews: number | null;
    created_at: string;
    updated_at: string;
    // Categories via business_categories join
    categories?: Category[];
    // Legacy category field (deprecated, use categories array instead)
    category?: string | null;
}

export interface BusinessListParams {
    search?: string;
    status?: string;
    category?: string;
    island?: string;
    featured?: boolean;
    page?: number;
    pageSize?: number;
}

/**
 * Fetch businesses with categories via business_categories join
 * Base table: businesses
 * JOINs: business_categories, categories
 */
export async function fetchBusinesses(params: BusinessListParams = {}) {
    try {
        const {
            search = '',
            status,
            category,
            island,
            featured,
            page = 1,
            pageSize = 20,
        } = params;

        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // Select businesses with categories via join
        let query = supabase
            .from('businesses')
            .select(`
                *,
                business_categories (
                    category_id,
                    categories (
                        id,
                        name,
                        description,
                        active
                    )
                )
            `, { count: 'exact' })
            .order('featured', { ascending: false })
            .order('created_at', { ascending: false })
            .range(from, to);

        // Apply filters
        if (search.trim()) {
            query = query.or(`name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
        }

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        // Filter by category via business_categories join
        if (category && category !== 'all') {
            query = query.eq('business_categories.categories.name', category);
        }

        if (island && island !== 'all') {
            query = query.eq('island', island);
        }

        if (featured !== undefined) {
            query = query.eq('featured', featured);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('[fetchBusinesses] Error:', error);
            throw error;
        }

        // Transform data to include categories array
        const businesses = (data || []).map((business: any) => ({
            ...business,
            categories: business.business_categories?.map((bc: any) => bc.categories).filter(Boolean) || []
        }));

        return {
            businesses: businesses as Business[],
            total: count || 0,
            page,
            pageSize,
        };
    } catch (error: any) {
        console.error('[fetchBusinesses] Unexpected error:', error);
        throw error;
    }
}

/**
 * Fetch a single business by ID with categories via business_categories join
 */
export async function fetchBusinessById(id: string): Promise<Business | null> {
    try {
        const { data, error } = await supabase
            .from('businesses')
            .select(`
                *,
                business_categories (
                    category_id,
                    categories (
                        id,
                        name,
                        description,
                        active
                    )
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('[fetchBusinessById] Error:', error);
            throw error;
        }

        // Transform to include categories array
        const business = {
            ...data,
            categories: data.business_categories?.map((bc: any) => bc.categories).filter(Boolean) || []
        };

        return business as Business;
    } catch (error: any) {
        console.error('[fetchBusinessById] Unexpected error:', error);
        return null;
    }
}


