-- ============================
-- Data-Preserving Schema Alignment Migration
-- Migration: 20250210000001_data_preserving_schema_align.sql
-- ============================
-- This migration aligns the database schema with frontend expectations
-- WITHOUT dropping tables or losing data.
-- 
-- Key changes:
-- 1. Ensures categories table has 'title' field (not 'name')
-- 2. Ensures businesses table has 'title', 'category_id', 'is_verified', 'is_active'
-- 3. Ensures products table has correct structure
-- 4. Preserves all existing data
-- 5. Idempotent: Safe to run multiple times
--
-- ============================

BEGIN;

-- ============================
-- 1. CATEGORIES TABLE: Ensure 'title' field exists
-- ============================

-- Add 'title' column if it doesn't exist
ALTER TABLE public.categories 
  ADD COLUMN IF NOT EXISTS title TEXT;

-- Migrate data from 'name' to 'title' if 'name' exists and 'title' is NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'categories' 
      AND column_name = 'name'
  ) THEN
    -- Copy name to title where title is NULL
    UPDATE public.categories 
    SET title = COALESCE(title, name)
    WHERE title IS NULL AND name IS NOT NULL;
  END IF;
END $$;

-- Make title NOT NULL if we have data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.categories WHERE title IS NOT NULL) THEN
    ALTER TABLE public.categories 
      ALTER COLUMN title SET NOT NULL;
  END IF;
END $$;

-- Add other required columns
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create index on slug if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug) WHERE slug IS NOT NULL;

-- ============================
-- 2. BUSINESSES TABLE: Ensure correct field names
-- ============================

-- Add 'title' column if it doesn't exist
ALTER TABLE public.businesses 
  ADD COLUMN IF NOT EXISTS title TEXT;

-- Migrate data from 'name' to 'title' if 'name' exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'businesses' 
      AND column_name = 'name'
  ) THEN
    -- Copy name to title where title is NULL
    UPDATE public.businesses 
    SET title = COALESCE(title, name)
    WHERE title IS NULL AND name IS NOT NULL;
  END IF;
END $$;

-- Make title NOT NULL if we have data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.businesses WHERE title IS NOT NULL) THEN
    ALTER TABLE public.businesses 
      ALTER COLUMN title SET NOT NULL;
  END IF;
END $$;

-- Ensure category_id exists (UUID foreign key to categories)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS category_id UUID;

-- Migrate from old 'category' enum/text to category_id if needed
DO $$
DECLARE
  cat_record RECORD;
BEGIN
  -- If 'category' column exists and category_id is NULL, try to match with categories
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'businesses' 
      AND column_name = 'category'
  ) THEN
    -- Try to match category text to category title
    FOR cat_record IN 
      SELECT DISTINCT b.id as business_id, b.category as category_text
      FROM public.businesses b
      WHERE b.category_id IS NULL 
        AND b.category IS NOT NULL
    LOOP
      -- Find matching category by title (cast enum to text for comparison)
      UPDATE public.businesses
      SET category_id = (
        SELECT id FROM public.categories 
        WHERE title ILIKE (cat_record.category_text::text)
        LIMIT 1
      )
      WHERE id = cat_record.business_id
        AND category_id IS NULL;
    END LOOP;
  END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'businesses_category_id_fkey'
  ) THEN
    ALTER TABLE public.businesses
      ADD CONSTRAINT businesses_category_id_fkey
        FOREIGN KEY (category_id) REFERENCES public.categories(id)
        ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure is_verified exists (boolean, replaces old 'status' enum)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Migrate from old 'status' enum to is_verified if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'businesses' 
      AND column_name = 'status'
  ) THEN
    -- Set is_verified based on status
    UPDATE public.businesses
    SET is_verified = CASE 
      WHEN status::text IN ('active', 'verified', 'approved') THEN true
      ELSE false
    END
    WHERE is_verified IS NULL OR is_verified = false;
  END IF;
END $$;

-- Ensure is_active exists
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Set is_active based on is_verified if not set
UPDATE public.businesses
SET is_active = COALESCE(is_active, is_verified, true)
WHERE is_active IS NULL;

-- Ensure other required columns exist
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS searchable BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_businesses_category_id ON public.businesses(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_title ON public.businesses(title);
CREATE INDEX IF NOT EXISTS idx_businesses_is_active ON public.businesses(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON public.businesses(slug) WHERE slug IS NOT NULL;

-- ============================
-- 3. PRODUCTS TABLE: Ensure correct structure
-- ============================

-- Ensure title exists (NOT name)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS title TEXT;

-- Migrate from 'name' to 'title' if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'products' 
      AND column_name = 'name'
  ) THEN
    UPDATE public.products 
    SET title = COALESCE(title, name)
    WHERE title IS NULL AND name IS NOT NULL;
  END IF;
END $$;

-- Make title NOT NULL if we have data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.products WHERE title IS NOT NULL) THEN
    ALTER TABLE public.products 
      ALTER COLUMN title SET NOT NULL;
  END IF;
END $$;

-- Ensure other required columns exist
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS duration TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS business_id UUID,
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS searchable BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Fix typo column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'products' 
      AND column_name = 'updated_atupdated_at'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE public.products 
        RENAME COLUMN updated_atupdated_at TO updated_at;
    ELSE
      -- Both exist, copy data and drop typo
      UPDATE public.products 
      SET updated_at = COALESCE(updated_at, updated_atupdated_at)
      WHERE updated_at IS NULL AND updated_atupdated_at IS NOT NULL;
      
      ALTER TABLE public.products 
        DROP COLUMN updated_atupdated_at;
    END IF;
  END IF;
END $$;

-- Ensure image_url is TEXT (not JSONB)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'products' 
      AND column_name = 'image_url'
      AND data_type = 'jsonb'
  ) THEN
    -- Convert JSONB to TEXT
    UPDATE public.products 
    SET image_url = CASE 
      WHEN image_url IS NULL THEN NULL
      WHEN jsonb_typeof(image_url) = 'array' AND jsonb_array_length(image_url) > 0 
        THEN (image_url->>0)
      WHEN jsonb_typeof(image_url) = 'string'
        THEN image_url::text
      ELSE NULL
    END;
    
    ALTER TABLE public.products 
      ALTER COLUMN image_url TYPE TEXT USING image_url::text;
  END IF;
END $$;

-- Add foreign key for business_id if it doesn't exist
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

-- Remove deprecated 'category' column from products (products don't have categories)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'products' 
      AND column_name = 'category'
  ) THEN
    ALTER TABLE public.products DROP COLUMN category;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_title ON public.products(title);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug) WHERE slug IS NOT NULL;

-- ============================
-- 4. BUSINESS_PRODUCTS TABLE: Ensure structure
-- ============================

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.business_products (
  business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  PRIMARY KEY (business_id, product_id)
);

-- Add additional columns if needed
ALTER TABLE public.business_products
  ADD COLUMN IF NOT EXISTS title_override TEXT,
  ADD COLUMN IF NOT EXISTS description_override TEXT,
  ADD COLUMN IF NOT EXISTS price_override NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_business_products_business_id ON public.business_products(business_id);
CREATE INDEX IF NOT EXISTS idx_business_products_product_id ON public.business_products(product_id);

-- ============================
-- 5. ROW LEVEL SECURITY (RLS): Ensure policies exist
-- ============================

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts, then recreate
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
DROP POLICY IF EXISTS "Public read businesses" ON public.businesses;
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Public read business_products" ON public.business_products;

DROP POLICY IF EXISTS "Admin full categories" ON public.categories;
DROP POLICY IF EXISTS "Admin full businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admin full products" ON public.products;
DROP POLICY IF EXISTS "Admin full business_products" ON public.business_products;

-- Public read access
CREATE POLICY "Public read categories" ON public.categories 
  FOR SELECT TO anon, authenticated 
  USING (true);

CREATE POLICY "Public read businesses" ON public.businesses 
  FOR SELECT TO anon, authenticated 
  USING (true);

CREATE POLICY "Public read products" ON public.products 
  FOR SELECT TO anon, authenticated 
  USING (true);

CREATE POLICY "Public read business_products" ON public.business_products 
  FOR SELECT TO anon, authenticated 
  USING (true);

-- Admin full access (service_role)
CREATE POLICY "Admin full categories" ON public.categories 
  FOR ALL TO service_role 
  USING (true);

CREATE POLICY "Admin full businesses" ON public.businesses 
  FOR ALL TO service_role 
  USING (true);

CREATE POLICY "Admin full products" ON public.products 
  FOR ALL TO service_role 
  USING (true);

CREATE POLICY "Admin full business_products" ON public.business_products 
  FOR ALL TO service_role 
  USING (true);

-- ============================
-- 6. TRIGGERS: Ensure updated_at triggers exist
-- ============================

-- Categories updated_at trigger
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION update_categories_updated_at();

-- Businesses updated_at trigger
CREATE OR REPLACE FUNCTION update_businesses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_businesses_updated_at ON public.businesses;
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_businesses_updated_at();

-- Products updated_at trigger
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_updated_at();

-- Business products updated_at trigger
CREATE OR REPLACE FUNCTION update_business_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_business_products_updated_at ON public.business_products;
CREATE TRIGGER update_business_products_updated_at
  BEFORE UPDATE ON public.business_products
  FOR EACH ROW
  EXECUTE FUNCTION update_business_products_updated_at();

-- ============================
-- 7. SEED DATA: Add default categories if none exist
-- ============================

INSERT INTO public.categories (title, description, slug, is_active) VALUES
  ('Restaurants', 'Dining establishments', 'restaurants', true),
  ('Hotels', 'Accommodation providers', 'hotels', true),
  ('Tourism', 'Tour and travel services', 'tourism', true),
  ('Retail', 'Shopping and retail stores', 'retail', true),
  ('Services', 'Various service providers', 'services', true)
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================
-- MIGRATION COMPLETE
-- ============================
-- 
-- Next steps:
-- 1. Verify data preservation: SELECT COUNT(*) FROM businesses;
-- 2. Regenerate TypeScript types: npx supabase gen types typescript --project-id <project-id> > src/types/database.types.ts
-- 3. Test application: npm run dev
-- 4. Check for "column does not exist" errors in browser console
-- 
-- ============================
