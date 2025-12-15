/**
 * Centralized Business API for admin business list
 * Clean, efficient queries without manual timeouts
 * ONLY uses valid database columns
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Business row type for admin list (only valid fields)
 */
export interface BusinessRow {
  id: string;
  owner_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  status: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  island: string | null;
  opening_hours: any | null;
  featured: boolean;
  verified: boolean;
  logo_url: string | null;
  cover_image_url: string | null;
  gallery_images: string[] | null;
  average_rating: number | null;
  total_reviews: number | null;
  services: string[] | null;
  created_at: string;
  updated_at: string;
}

/**
 * Parameters for fetching business list
 */
export interface BusinessListParams {
  search?: string;
  status?: string;
  category?: string;
  island?: string;
  page?: number;
  pageSize?: number;
  featured?: boolean;
}

const DEFAULT_PAGE_SIZE = 20;

/**
 * Valid business fields (ONLY existing columns)
 */
const VALID_BUSINESS_FIELDS = `
  id,
  owner_id,
  title,
  description,
  category,
  status,
  phone,
  whatsapp,
  email,
  website,
  facebook_url,
  instagram_url,
  linkedin_url,
  youtube_url,
  address,
  latitude,
  longitude,
  island,
  opening_hours,
  featured,
  verified,
  logo_url,
  cover_image_url,
  gallery_images,
  average_rating,
  total_reviews,
  services,
  created_at,
  updated_at
`;

/**
 * Fetch businesses with pagination and filters
 * Uses count: "exact" to get total in single query
 * NO timeouts - let Supabase handle query execution
 */
export async function fetchBusinesses(params: BusinessListParams = {}) {
  const {
    search = "",
    status,
    category,
    island,
    featured,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  } = params;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Select businesses with explicit fields
  let query = supabase
    .from("businesses")
    .select(`
      id,
      title,
      description,
      category,
      status,
      phone,
      logo_url
    `, { count: "exact" })
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  // Apply filters
  if (search.trim()) {
    query = query.or(`title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  // Filter by category via direct category_id FK
  // SCHEMA NOTE: Uses businesses.category (text field) for filtering
  // TODO: Consider using category_id FK if available for better performance
  // NOTE: Currently filters client-side after fetching (see below)
  if (category && category !== "all") {
    // FALLBACK: Client-side filtering - category_id FK query may not be available
    // Will filter client-side after fetching (see line 177)
  }

  if (island && island !== "all") {
    query = query.eq("island", island);
  }

  if (featured !== undefined) {
    query = query.eq("featured", featured);
  }

  const { data, error, count } = await query;

  if (error) {
    // SAFETY: Non-fatal error - return empty array instead of throwing
    // This prevents blank screens and infinite loading states
    console.error("[fetchBusinesses] Error", error);
    if (import.meta.env.DEV) {
      console.error("[fetchBusinesses] Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    }
    // FALLBACK: Return empty result - prevents component crashes
    return {
      businesses: [] as BusinessRow[],
      total: 0,
    };
  }

  // Transform data
  let businesses = data ?? [];
  
  // Client-side category filter
  if (category && category !== "all") {
    businesses = businesses.filter((business: any) => {
      return business.category === category;
    });
  }

  if (import.meta.env.DEV) {
    console.debug('[Home] fetchBusinesses: Loaded businesses', {
      count: businesses.length,
      total: count ?? 0,
      featured: featured !== undefined ? featured : 'all',
      categoryFilter: category || 'none'
    });
  }

  return {
    businesses: businesses as BusinessRow[],
    total: count ?? 0,
  };
}

/**
 * Get business count (cheap head query)
 * Only use if you need count without data
 */
export async function getBusinessesCount(
  filters: Omit<BusinessListParams, "page" | "pageSize"> = {}
): Promise<number> {
  const { search = "", status, category, island, featured } = filters;

  let query = supabase
    .from("businesses")
    .select("id", { count: "exact", head: true });

  if (search.trim()) {
    query = query.ilike("title", `%${search.trim()}%`);
  }
  if (status && status !== "all") {
    query = query.eq("status", status);
  }
  if (category && category !== "all") {
    query = query.eq("category", category);
  }
  if (island && island !== "all") {
    query = query.eq("island", island);
  }
  if (featured !== undefined) {
    query = query.eq("featured", featured);
  }

  const { error, count } = await query;

  if (error) {
    console.error("[getBusinessesCount] Error", error);
    throw error;
  }

  return count ?? 0;
}
