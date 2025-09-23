-- Fix category search by converting business_category enum to TEXT
-- This allows proper text search operations like ilike

-- First, add a new text column for category
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS category_text TEXT;

-- Copy enum values to text column
UPDATE public.businesses 
SET category_text = category::text 
WHERE category_text IS NULL;

-- Make category_text NOT NULL and add default
ALTER TABLE public.businesses ALTER COLUMN category_text SET NOT NULL;
ALTER TABLE public.businesses ALTER COLUMN category_text SET DEFAULT 'other';

-- Create index on category_text for better search performance
CREATE INDEX IF NOT EXISTS idx_businesses_category_text ON public.businesses(category_text);

-- Update the search functionality to use category_text instead of category
-- This will be handled in the application code

-- Also ensure services column exists and is properly indexed
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS services TEXT[];
CREATE INDEX IF NOT EXISTS idx_businesses_services ON public.businesses USING GIN(services);

-- Update existing businesses to have proper category_text values
UPDATE public.businesses 
SET category_text = CASE 
  WHEN category::text = 'restaurants' THEN 'food'
  WHEN category::text = 'hotels' THEN 'accommodation'
  WHEN category::text = 'tourism' THEN 'tours'
  WHEN category::text = 'health' THEN 'health'
  WHEN category::text = 'education' THEN 'education'
  WHEN category::text = 'finance' THEN 'services'
  WHEN category::text = 'transport' THEN 'transport'
  WHEN category::text = 'real_estate' THEN 'services'
  WHEN category::text = 'technology' THEN 'services'
  ELSE 'other'
END
WHERE category_text IS NULL OR category_text = '';

-- Ensure all businesses have proper status
UPDATE public.businesses SET status = 'active' WHERE status IS NULL;

-- Create a function to search businesses with proper text search
CREATE OR REPLACE FUNCTION public.search_businesses(search_term TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  category_text TEXT,
  address TEXT,
  island TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  featured BOOLEAN,
  verified BOOLEAN,
  average_rating DECIMAL(3,2),
  total_reviews INTEGER
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    b.id,
    b.name,
    b.description,
    b.category_text,
    b.address,
    b.island,
    b.phone,
    b.email,
    b.website,
    b.latitude,
    b.longitude,
    b.featured,
    b.verified,
    b.average_rating,
    b.total_reviews
  FROM public.businesses b
  WHERE b.status = 'active'
  AND (
    b.name ILIKE '%' || search_term || '%'
    OR b.description ILIKE '%' || search_term || '%'
    OR b.category_text ILIKE '%' || search_term || '%'
    OR b.address ILIKE '%' || search_term || '%'
    OR b.island ILIKE '%' || search_term || '%'
    OR EXISTS (
      SELECT 1 FROM unnest(b.services) AS service
      WHERE service ILIKE '%' || search_term || '%'
    )
  )
  ORDER BY 
    CASE WHEN b.name ILIKE '%' || search_term || '%' THEN 1 ELSE 2 END,
    b.featured DESC,
    b.average_rating DESC,
    b.created_at DESC;
$$;

-- Grant execute permission on the search function
GRANT EXECUTE ON FUNCTION public.search_businesses(TEXT) TO anon, authenticated;
