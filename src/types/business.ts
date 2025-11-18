/**
 * Central Business type matching the Supabase businesses table schema
 * This is the source of truth for business data structure
 */
export interface Business {
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

