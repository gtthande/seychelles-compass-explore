-- Schema Alignment Fix Migration
-- Ensures categories table has all required columns matching frontend expectations
-- Idempotent: safe to run multiple times
-- 
-- This migration fixes:
-- 1. Categories table: ensures is_active (not active), slug, and image_url exist
-- 2. Ensures business_categories junction table structure is correct
-- 3. Ensures products table has is_active column

DO $$
BEGIN
    -- ============================================================
    -- FIX CATEGORIES TABLE
    -- ============================================================
    
    -- Ensure slug column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'categories' 
        AND column_name = 'slug'
    ) THEN
        ALTER TABLE public.categories ADD COLUMN slug TEXT;
        -- Generate slugs from name for existing records
        UPDATE public.categories 
        SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
        WHERE slug IS NULL;
        -- Make slug unique and not null after population
        ALTER TABLE public.categories ALTER COLUMN slug SET NOT NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_unique ON public.categories(slug);
        RAISE NOTICE 'Added slug column to categories table';
    END IF;
    
    -- Rename active to is_active if active exists and is_active doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'categories' 
        AND column_name = 'active'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'categories' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.categories RENAME COLUMN active TO is_active;
        RAISE NOTICE 'Renamed active column to is_active in categories table';
    END IF;
    
    -- Ensure is_active column exists
    ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    
    -- Ensure image_url column exists
    ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;
    
    -- Ensure updated_at column exists
    ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    
    -- ============================================================
    -- FIX BUSINESS_CATEGORIES TABLE
    -- ============================================================
    
    -- Ensure business_categories has id column (some migrations use composite PK)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'business_categories' 
        AND column_name = 'id'
    ) THEN
        -- Check if table exists first
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'business_categories'
        ) THEN
            ALTER TABLE public.business_categories ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
            RAISE NOTICE 'Added id column to business_categories table';
        END IF;
    END IF;
    
    -- Ensure created_at exists
    ALTER TABLE public.business_categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    
    -- ============================================================
    -- FIX PRODUCTS TABLE
    -- ============================================================
    
    -- Ensure is_active column exists in products
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
    
    -- Ensure status column exists (some queries use status)
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
    
    -- Ensure image_url exists
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
    
    -- Ensure category column exists
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
    
    RAISE NOTICE 'Schema alignment migration complete - all required columns verified';
END $$;








