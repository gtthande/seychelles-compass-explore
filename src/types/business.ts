/**
 * Central Business type matching the Supabase businesses table schema
 * This is the source of truth for business data structure
 * 
 * Coordinate fields:
 * - latitude/longitude are the ONLY valid coordinate fields
 */
/**
 * Business interface matching the actual Supabase businesses table schema
 * Schema: id, title, description, image_url, island_id, category_id, is_active, created_at, updated_at
 */
export interface Business {
  // Core identifiers
  id: string;
  title: string;
  description: string | null;
  
  // Category and status
  category_id: string | null;
  island_id?: string | null;
  island?: string | null; // Alternative field name used in some queries
  status?: string | null; // 'pending', 'approved', 'suspended', 'closed'
  is_verified?: boolean;
  is_active: boolean;
  
  // Media
  image_url: string | null;
  
  // Optional fields that may exist in some queries
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  owner_id?: string | null;
  searchable?: boolean;
  slug?: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Helper function to normalize coordinates
 * Returns { lat, lng } or null
 */
export function normalizeBusinessCoords(business: Partial<Business>): { lat: number; lng: number } | null {
  if (business.latitude != null && business.longitude != null) {
    return { lat: Number(business.latitude), lng: Number(business.longitude) };
  }
  return null;
}

