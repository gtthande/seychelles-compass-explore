/**
 * Island interface matching the actual Supabase islands table schema
 * Schema: id, title
 */
export interface Island {
  id: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  created_at?: string;
}









