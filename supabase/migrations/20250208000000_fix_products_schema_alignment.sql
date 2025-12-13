-- Fix Products Schema Alignment
-- Station-2100 / iCompass Seychelles Unified Schema
-- 
-- This migration ensures:
-- 1. products table has correct columns matching TypeScript Product interface:
--    - id, title (NOT NULL), description, price, duration, is_active, searchable, 
--    - image_url (TEXT), stock, business_id, slug, created_at, updated_at
-- 2. Removes deprecated "name" column (replaced by "title")
-- 3. Fixes typo column "updated_atupdated_at" → "updated_at"
-- 4. Ensures business_products has title_override column
-- 5. Does NOT modify RLS policies (keeps existing policies intact)
--
-- Idempotent: Safe to run multiple times

BEGIN;

-- ============================================================
-- PRODUCTS TABLE: Fix Typo Column
-- ============================================================

-- Fix typo column: updated_atupdated_at → updated_at
DO $$
BEGIN
    -- Check if typo column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'updated_atupdated_at'
    ) THEN
        -- If updated_at doesn't exist, rename the typo column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'products' 
            AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE public.products 
            RENAME COLUMN updated_atupdated_at TO updated_at;
        ELSE
            -- If both exist, copy data and drop typo column
            UPDATE public.products 
            SET updated_at = COALESCE(updated_at, updated_atupdated_at)
            WHERE updated_at IS NULL AND updated_atupdated_at IS NOT NULL;
            
            ALTER TABLE public.products 
            DROP COLUMN updated_atupdated_at;
        END IF;
    END IF;
END $$;

-- ============================================================
-- PRODUCTS TABLE: Remove Deprecated Columns
-- ============================================================

-- Drop deprecated "name" column (replaced by "title")
-- Migrate data first if title is NULL
DO $$
BEGIN
    -- Migrate name → title before dropping
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'name'
    ) THEN
        -- Copy name to title where title is NULL
        UPDATE public.products 
        SET title = COALESCE(title, name)
        WHERE title IS NULL AND name IS NOT NULL;
        
        -- Drop name column
        ALTER TABLE public.products DROP COLUMN IF EXISTS name CASCADE;
    END IF;
END $$;

-- Drop other deprecated columns that shouldn't exist
ALTER TABLE public.products DROP COLUMN IF EXISTS category CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS status CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS images CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS currency CASCADE;

-- ============================================================
-- PRODUCTS TABLE: Ensure Required Columns Exist
-- ============================================================

-- Add all required columns with correct types
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
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ============================================================
-- PRODUCTS TABLE: Fix Column Types
-- ============================================================

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
        -- Convert JSONB array to first string value, or NULL
        UPDATE public.products 
        SET image_url = CASE 
            WHEN image_url IS NULL THEN NULL
            WHEN image_url::text = 'null' THEN NULL
            WHEN jsonb_typeof(image_url) = 'array' AND jsonb_array_length(image_url) > 0 
                THEN (image_url->>0)
            WHEN jsonb_typeof(image_url) = 'string'
                THEN image_url::text
            ELSE NULL
        END;
        
        -- Change column type from JSONB to TEXT
        ALTER TABLE public.products 
        ALTER COLUMN image_url TYPE TEXT USING image_url::text;
    END IF;
END $$;

-- Ensure price is NUMERIC(10,2) (not just NUMERIC)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'price'
        AND (numeric_precision IS NULL OR numeric_precision != 10 OR numeric_scale IS NULL OR numeric_scale != 2)
    ) THEN
        ALTER TABLE public.products 
        ALTER COLUMN price TYPE NUMERIC(10,2) USING price::numeric(10,2);
    END IF;
END $$;

-- ============================================================
-- PRODUCTS TABLE: Set NOT NULL Constraints
-- ============================================================

-- Make title NOT NULL (required field)
-- First ensure all rows have a title
DO $$
BEGIN
    -- Set default title for rows without title
    UPDATE public.products 
    SET title = COALESCE(title, 'Untitled Product')
    WHERE title IS NULL;
    
    -- Now make it NOT NULL if we have data
    IF EXISTS (SELECT 1 FROM public.products WHERE title IS NOT NULL) THEN
        ALTER TABLE public.products 
        ALTER COLUMN title SET NOT NULL;
    END IF;
END $$;

-- Ensure defaults are set
ALTER TABLE public.products
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN searchable SET DEFAULT true,
  ALTER COLUMN stock SET DEFAULT 0;

-- ============================================================
-- PRODUCTS TABLE: Foreign Key Constraints
-- ============================================================

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
-- PRODUCTS TABLE: Updated_at Trigger
-- ============================================================

-- Ensure updated_at trigger exists
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

-- ============================================================
-- BUSINESS_PRODUCTS TABLE: Ensure title_override Exists
-- ============================================================

-- Add title_override if it doesn't exist (already added in 20250207000000, but ensure it exists)
ALTER TABLE public.business_products
  ADD COLUMN IF NOT EXISTS title_override TEXT,
  ADD COLUMN IF NOT EXISTS description_override TEXT,
  ADD COLUMN IF NOT EXISTS price_override NUMERIC(12,2);

-- Ensure updated_at exists and has trigger
ALTER TABLE public.business_products
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

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

-- ============================================================
-- INDEXES: Ensure Performance Indexes Exist
-- ============================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_title ON public.products(title);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_searchable ON public.products(searchable) WHERE searchable = true;
CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug) WHERE slug IS NOT NULL;

-- Business products indexes
CREATE INDEX IF NOT EXISTS idx_business_products_price_override ON public.business_products(price_override) WHERE price_override IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_business_products_title_override ON public.business_products(title_override) WHERE title_override IS NOT NULL;

COMMIT;









