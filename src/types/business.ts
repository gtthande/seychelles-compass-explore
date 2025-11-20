/**
 * Central Business type matching the Supabase businesses table schema
 * This is the source of truth for business data structure
 * 
 * Coordinate fields:
 * - latitude/longitude are the ONLY valid coordinate fields
 */
export interface Business {
  // Core identifiers
  id: string;
  owner_id: string | null;
  name: string;
  description: string | null;
  
  // Category and status
  category: string | null;
  category_slug: string | null;
  status: string | null;
  
  // Location fields
  address: string | null;
  island: string | null;
  island_slug: string | null;
  
  // Coordinate fields (ONLY valid fields)
  latitude: number | null;
  longitude: number | null;
  
  // Contact information
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
  
  // Business details
  opening_hours: Record<string, any> | null;
  services: string[] | null;
  
  // Status flags
  featured: boolean;
  verified: boolean;
  
  // Media
  logo_url: string | null;
  cover_image_url: string | null;
  gallery_images: string[] | null;
  
  // Ratings
  average_rating: number | null;
  total_reviews: number | null;
  
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

