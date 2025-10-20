-- Add full-text search indexes for advanced search functionality
-- This migration creates GIN indexes for efficient full-text search

-- Create full-text search index for businesses table
CREATE INDEX IF NOT EXISTS idx_businesses_search 
ON businesses 
USING gin(to_tsvector('english', name || ' ' || description));

-- Create full-text search index for products table
CREATE INDEX IF NOT EXISTS idx_products_search 
ON products 
USING gin(to_tsvector('english', name || ' ' || description || ' ' || tags));

-- Create additional indexes for common search patterns
CREATE INDEX IF NOT EXISTS idx_businesses_name_trgm 
ON businesses 
USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_businesses_description_trgm 
ON businesses 
USING gin(description gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_name_trgm 
ON products 
USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_description_trgm 
ON products 
USING gin(description gin_trgm_ops);

-- Enable trigram extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_businesses_status_featured 
ON businesses (status, featured) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_products_status_business 
ON products (status, business_id) 
WHERE status = 'active';

-- Create index for business-product joins
CREATE INDEX IF NOT EXISTS idx_products_business_id 
ON products (business_id);

-- Add search_tsvector column to businesses for better full-text search
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS search_tsvector tsvector 
GENERATED ALWAYS AS (
  to_tsvector('english', 
    COALESCE(name, '') || ' ' || 
    COALESCE(description, '') || ' ' || 
    COALESCE(category::text, '') || ' ' || 
    COALESCE(address, '') || ' ' || 
    COALESCE(island, '') || ' ' || 
    COALESCE(array_to_string(services, ' '), '')
  )
) STORED;

-- Add search_tsvector column to products for better full-text search
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS search_tsvector tsvector 
GENERATED ALWAYS AS (
  to_tsvector('english', 
    COALESCE(name, '') || ' ' || 
    COALESCE(description, '') || ' ' || 
    COALESCE(category, '')
  )
) STORED;

-- Create indexes on the generated tsvector columns
CREATE INDEX IF NOT EXISTS idx_businesses_search_tsvector 
ON businesses 
USING gin(search_tsvector);

CREATE INDEX IF NOT EXISTS idx_products_search_tsvector 
ON products 
USING gin(search_tsvector);

-- Create function for advanced search with ranking
CREATE OR REPLACE FUNCTION search_businesses_and_products(
  search_query text,
  result_limit integer DEFAULT 20
)
RETURNS TABLE (
  business_id uuid,
  business_name text,
  business_description text,
  business_address text,
  business_island text,
  match_source text,
  matched_field text,
  highlight text,
  relevance_score integer,
  product_name text,
  product_description text
) AS $$
BEGIN
  RETURN QUERY
  WITH business_matches AS (
    SELECT 
      b.id as business_id,
      b.name as business_name,
      b.description as business_description,
      b.address as business_address,
      b.island as business_island,
      'business'::text as match_source,
      CASE 
        WHEN b.name ILIKE '%' || search_query || '%' THEN 'name'::text
        WHEN b.description ILIKE '%' || search_query || '%' THEN 'description'::text
        WHEN b.category::text ILIKE '%' || search_query || '%' THEN 'category'::text
        ELSE 'services'::text
      END as matched_field,
      CASE 
        WHEN b.name ILIKE '%' || search_query || '%' THEN b.name
        WHEN b.description ILIKE '%' || search_query || '%' THEN b.name || ' – ' || b.description
        WHEN b.category::text ILIKE '%' || search_query || '%' THEN b.name || ' – ' || b.category::text
        ELSE b.name || ' – offers ' || array_to_string(b.services, ', ')
      END as highlight,
      CASE 
        WHEN b.name ILIKE '%' || search_query || '%' THEN 100
        WHEN b.description ILIKE '%' || search_query || '%' THEN 75
        WHEN b.category::text ILIKE '%' || search_query || '%' THEN 50
        ELSE 40
      END + CASE WHEN b.featured THEN 30 ELSE 0 END as relevance_score,
      NULL::text as product_name,
      NULL::text as product_description
    FROM businesses b
    WHERE b.status = 'active'
      AND (
        b.name ILIKE '%' || search_query || '%' OR
        b.description ILIKE '%' || search_query || '%' OR
        b.category::text ILIKE '%' || search_query || '%' OR
        EXISTS (
          SELECT 1 FROM unnest(b.services) as service 
          WHERE service ILIKE '%' || search_query || '%'
        )
      )
  ),
  product_matches AS (
    SELECT 
      p.business_id,
      b.name as business_name,
      b.description as business_description,
      b.address as business_address,
      b.island as business_island,
      'product'::text as match_source,
      CASE 
        WHEN p.name ILIKE '%' || search_query || '%' THEN 'name'::text
        WHEN p.description ILIKE '%' || search_query || '%' THEN 'description'::text
        ELSE 'category'::text
      END as matched_field,
      CASE 
        WHEN p.name ILIKE '%' || search_query || '%' THEN b.name || ' – offers ' || p.name
        WHEN p.description ILIKE '%' || search_query || '%' THEN b.name || ' – ' || p.name || ': ' || p.description
        ELSE b.name || ' – ' || p.name || ' (' || p.category || ')'
      END as highlight,
      CASE 
        WHEN p.name ILIKE '%' || search_query || '%' THEN 100
        WHEN p.description ILIKE '%' || search_query || '%' THEN 75
        ELSE 50
      END as relevance_score,
      p.name as product_name,
      p.description as product_description
    FROM products p
    JOIN businesses b ON p.business_id = b.id
    WHERE p.status = 'active' 
      AND b.status = 'active'
      AND (
        p.name ILIKE '%' || search_query || '%' OR
        p.description ILIKE '%' || search_query || '%' OR
        p.category ILIKE '%' || search_query || '%'
      )
  ),
  combined_results AS (
    SELECT * FROM business_matches
    UNION ALL
    SELECT * FROM product_matches
  )
  SELECT 
    cr.business_id,
    cr.business_name,
    cr.business_description,
    cr.business_address,
    cr.business_island,
    cr.match_source,
    cr.matched_field,
    cr.highlight,
    cr.relevance_score,
    cr.product_name,
    cr.product_description
  FROM combined_results cr
  ORDER BY cr.relevance_score DESC, cr.business_name
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;
