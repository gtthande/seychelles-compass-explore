/**
 * Category interface matching the actual Supabase categories table schema
 * Schema: id, title
 */
export interface Category {
  id: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  is_active?: boolean;
  created_at?: string;
}









