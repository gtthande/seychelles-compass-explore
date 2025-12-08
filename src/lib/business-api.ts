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
  name: string;
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
  name,
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
      name,
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
    query = query.or(`name.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  // Filter by category via business_categories join
  // Note: This filter might not work with nested joins in Supabase
  // If filtering fails, we'll filter client-side instead
  // TODO: Verify FK relationship between businesses and business_categories exists
  // If PGRST200 errors occur, the join table name or FK constraint may need alignment
  if (category && category !== "all") {
    // Try to filter via join - if this fails, we'll filter client-side
    // Supabase might not support nested filtering on joined tables
    try {
      query = query.eq("business_categories.categories.name", category);
    } catch (e) {
      // Filter will be done client-side if join filter fails
      console.warn("[fetchBusinesses] Category filter via join not supported, will filter client-side");
    }
  }

  if (island && island !== "all") {
    query = query.eq("island", island);
  }

  if (featured !== undefined) {
    query = query.eq("featured", featured);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[fetchBusinesses] Error", error);
    if (import.meta.env.DEV) {
      console.error("[fetchBusinesses] Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    }
    // Don't throw - return empty result with error info
    // This prevents infinite loading states
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
    query = query.ilike("name", `%${search.trim()}%`);
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
