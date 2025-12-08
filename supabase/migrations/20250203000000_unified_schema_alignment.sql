-- Unified Schema Alignment Migration
-- Station-2100 / iCompass Seychelles Dev Mode
-- 
-- This migration ensures:
-- 1. products table has: id, title, description, price, duration, is_active, searchable, image_url, stock, business_id, slug
-- 2. business_products table has: id, business_id, product_id, price_override, title_override, description_override
-- 3. Removes deprecated "name" field from products
-- 4. Aligns all columns with unified schema

BEGIN;

-- ============================================================
-- PRODUCTS TABLE ALIGNMENT
-- ============================================================

-- Drop deprecated "name" column if it exists
ALTER TABLE public.products DROP COLUMN IF EXISTS name;

-- Ensure all required columns exist with correct types
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS duration TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS searchable BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS business_id UUID,
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- Drop columns that should not exist in unified schema
ALTER TABLE public.products DROP COLUMN IF EXISTS category;
ALTER TABLE public.products DROP COLUMN IF EXISTS status;
ALTER TABLE public.products DROP COLUMN IF EXISTS images;

-- Ensure image_url is TEXT (not JSONB)
-- Convert existing JSONB to TEXT if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'image_url'
        AND data_type = 'jsonb'
    ) THEN
        -- Convert JSONB array to first string value, or empty string
        UPDATE public.products 
        SET image_url = CASE 
            WHEN image_url::text = 'null' OR image_url IS NULL THEN ''
            WHEN jsonb_typeof(image_url) = 'array' AND jsonb_array_length(image_url) > 0 
                THEN (image_url->>0)
            ELSE ''
        END;
        
        -- Change column type
        ALTER TABLE public.products 
        ALTER COLUMN image_url TYPE TEXT USING image_url::text;
    END IF;
END $$;

-- Ensure title is NOT NULL (migrate from name if needed)
DO $$
BEGIN
    -- If title is null but name exists, copy name to title
    UPDATE public.products 
    SET title = COALESCE(title, name) 
    WHERE title IS NULL AND name IS NOT NULL;
    
    -- Make title NOT NULL if we have data
    IF EXISTS (SELECT 1 FROM public.products WHERE title IS NOT NULL) THEN
        ALTER TABLE public.products ALTER COLUMN title SET NOT NULL;
    END IF;
END $$;

-- Add FK constraint for business_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'products_business_id_fkey'
    ) THEN
        ALTER TABLE public.products
        ADD CONSTRAINT products_business_id_fkey
            FOREIGN KEY (business_id) REFERENCES public.businesses(id)
            ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================
-- BUSINESS_PRODUCTS TABLE ALIGNMENT
-- ============================================================

-- Add price_override if it doesn't exist
ALTER TABLE public.business_products
  ADD COLUMN IF NOT EXISTS price_override NUMERIC(10,2);

-- Migrate data from price_from to price_override
UPDATE public.business_products
SET price_override = price_from
WHERE price_override IS NULL AND price_from IS NOT NULL;

-- Keep existing columns for backward compatibility but mark as deprecated
-- Note: We keep price_from, price_to, currency_code, duration_minutes, booking_url, notes, is_active
-- for backward compatibility, but new code should use price_override, title_override, description_override

-- Ensure required columns exist
ALTER TABLE public.business_products
  ADD COLUMN IF NOT EXISTS title_override TEXT,
  ADD COLUMN IF NOT EXISTS description_override TEXT;

-- ============================================================
-- INDEXES
-- ============================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_title ON public.products(title);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_searchable ON public.products(searchable) WHERE searchable = true;
CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug) WHERE slug IS NOT NULL;

-- Business products indexes
CREATE INDEX IF NOT EXISTS idx_business_products_price_override ON public.business_products(price_override) WHERE price_override IS NOT NULL;

-- ============================================================
-- RLS POLICIES UPDATE
-- ============================================================

-- Products RLS: Public read for active products
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" 
ON public.products 
FOR SELECT 
USING (is_active = true AND searchable = true);

-- Products RLS: Admins can do everything
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
CREATE POLICY "Admins can manage all products" 
ON public.products 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.is_admin = true OR profiles.role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.is_admin = true OR profiles.role = 'admin')
  )
);

-- Business owners can manage products for their businesses
DROP POLICY IF EXISTS "Business owners can manage their products" ON public.products;
CREATE POLICY "Business owners can manage their products" 
ON public.products 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE businesses.id = products.business_id 
    AND businesses.owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.is_admin = true OR profiles.role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE businesses.id = products.business_id 
    AND businesses.owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.is_admin = true OR profiles.role = 'admin')
  )
);

-- Business products RLS policies remain the same (already correct)

COMMIT;

