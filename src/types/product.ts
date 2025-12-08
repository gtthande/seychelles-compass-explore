/**
 * Product interface matching unified Station-2100 / iCompass schema
 * 
 * products table columns:
 * - id, title, description, price, duration, is_active, searchable, image_url, stock, business_id, slug
 */
export interface Product {
  id: string;
  title: string;
  description?: string | null;
  price?: number | null;
  duration?: string | null;
  is_active: boolean;
  searchable: boolean;
  image_url?: string | null;
  stock: number;
  business_id?: string | null;
  slug?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * BusinessProduct interface matching business_products table schema
 */
export interface BusinessProduct {
  id: string;
  business_id: string;
  product_id: string;
  title_override?: string | null;
  description_override?: string | null;
  price_override?: number | null;
  updated_at: string;
}
