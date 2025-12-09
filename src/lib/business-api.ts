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
  title: string;
  description: string | null;
  category_id: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  island: string | null;
  status: string | null;
  is_verified: boolean;
  is_active: boolean;
  searchable: boolean;
  slug: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  categories?: {
    id: string;
    title: string;
  } | null;
}

/**
 * Parameters for fetching business list
 */
export interface BusinessListParams {
  search?: string;
  status?: string; // 'pending', 'approved', 'suspended', 'closed', or 'all'
  isActive?: boolean;
  categoryId?: string;
  island?: string;
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 20;

/**
 * Valid business fields (ONLY existing columns)
 */
const VALID_BUSINESS_FIELDS = `
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
    isActive,
    categoryId,
    island,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  } = params;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Select businesses with explicit valid fields only
  // Join with categories to get category title
  let query = supabase
    .from("businesses")
    .select(`
      id,
      title,
      description,
      category_id,
      phone,
      email,
      website,
      address,
      island,
      status,
      is_verified,
      is_active,
      searchable,
      slug,
      image_url,
      created_at,
      updated_at,
      categories (
        id,
        title
      )
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  // Apply filters
  if (search.trim()) {
    query = query.or(`title.ilike.%${search.trim()}%,description.ilike.%${search.trim()}%`);
  }

  // Filter by status (if not 'all')
  if (status && status !== 'all') {
    query = query.eq("status", status);
  }

  if (isActive !== undefined) {
    query = query.eq("is_active", isActive);
  }

  // Filter by category_id
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  // Filter by island
  if (island) {
    query = query.eq("island", island);
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
  const businesses = data ?? [];

  if (import.meta.env.DEV) {
    console.debug('[Home] fetchBusinesses: Loaded businesses', {
      count: businesses.length,
      total: count ?? 0,
      isActive: isActive !== undefined ? isActive : 'all',
      categoryFilter: categoryId || 'none'
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
  const { search = "", status, isActive, categoryId, island } = filters;

  let query = supabase
    .from("businesses")
    .select("id", { count: "exact", head: true });

  if (search.trim()) {
    query = query.ilike("title", `%${search.trim()}%`);
  }
  if (status && status !== 'all') {
    query = query.eq("status", status);
  }
  if (isActive !== undefined) {
    query = query.eq("is_active", isActive);
  }
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }
  if (island) {
    query = query.eq("island", island);
  }

  const { error, count } = await query;

  if (error) {
    console.error("[getBusinessesCount] Error", error);
    throw error;
  }

  return count ?? 0;
}
