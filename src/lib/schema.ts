/**
 * Schema Contract - Single Source of Truth
 * 
 * This file defines the ACTUAL database column names used across the application.
 * All Supabase queries MUST reference these constants to ensure schema alignment.
 * 
 * IMPORTANT:
 * - products table uses `name` (NOT `title`)
 * - businesses table uses `title` (NOT `name`)
 * - business_products is the join table linking businesses ↔ products
 */

/**
 * Products table columns
 * Schema: products table has been migrated from `title` to `name`
 */
export const PRODUCT_COLUMNS = [
  'id',
  'name',
  'description',
  'price',
  'duration',
  'image_url',
  'category_id',
  'business_id',
  'slug',
  'is_active',
  'searchable',
  'created_at',
  'updated_at'
] as const;

/**
 * Businesses table columns
 * Schema: businesses table uses `title` (NOT `name`)
 */
export const BUSINESS_COLUMNS = [
  'id',
  'title',
  'slug',
  'category_id',
  'is_active',
  'description',
  'status',
  'address',
  'island',
  'phone',
  'email',
  'website',
  'latitude',
  'longitude',
  'logo_url',
  'cover_image_url',
  'created_at',
  'updated_at'
] as const;

/**
 * Business Products join table columns
 * Links businesses ↔ products with business-specific overrides
 * NOTE: business_products table has SINGLE price column (NOT price_from/price_to)
 */
export const BUSINESS_PRODUCT_COLUMNS = [
  'id',
  'business_id',
  'product_id',
  'price',
  'duration',
  'is_active',
  'created_at',
  'updated_at'
] as const;

/**
 * Helper: Get products select string for Supabase queries
 */
export const PRODUCT_SELECT = PRODUCT_COLUMNS.join(', ');

/**
 * Helper: Get businesses select string for Supabase queries
 */
export const BUSINESS_SELECT = BUSINESS_COLUMNS.join(', ');

/**
 * Helper: Get business_products select string for Supabase queries
 */
export const BUSINESS_PRODUCT_SELECT = BUSINESS_PRODUCT_COLUMNS.join(', ');
