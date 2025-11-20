-- iCompass Business & Admin Schema Resync Migration
-- This migration ensures all required columns exist in the businesses table
-- Idempotent: safe to run multiple times
-- 
-- To apply: Run this in Supabase SQL Editor or via Supabase CLI
-- To rollback: See ROLLBACK section at bottom (commented out)

DO $$
BEGIN
    -- Ensure businesses table exists (should already exist, but safe check)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'businesses'
    ) THEN
        CREATE TABLE public.businesses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created businesses table';
    END IF;

    -- Core business fields
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS category TEXT;
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS whatsapp TEXT;
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS website TEXT;

    -- Social media URLs
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS facebook_url TEXT;
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS instagram_url TEXT;
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS youtube_url TEXT;

    -- Location fields
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,8);
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS longitude NUMERIC(11,8);
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS island TEXT;

    -- Business metadata
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS opening_hours JSONB;
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS services TEXT[];
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

    -- Media URLs
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS logo_url TEXT;
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS gallery_images TEXT[];

    -- Ratings
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0;
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

    -- Admin verification notes (used in admin panel)
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS verification_notes TEXT;

    -- Ensure timestamps have defaults
    ALTER TABLE public.businesses ALTER COLUMN created_at SET DEFAULT NOW();
    ALTER TABLE public.businesses ALTER COLUMN updated_at SET DEFAULT NOW();

    RAISE NOTICE 'Business schema resync complete - all required columns verified';
END $$;

-- ============================================================================
-- ROLLBACK SECTION (DO NOT RUN UNLESS YOU NEED TO REMOVE COLUMNS)
-- ============================================================================
-- 
-- To rollback this migration (remove columns):
-- 
-- DO $$
-- BEGIN
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS verification_notes;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS total_reviews;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS average_rating;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS gallery_images;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS cover_image_url;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS logo_url;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS verified;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS featured;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS services;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS opening_hours;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS island;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS longitude;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS latitude;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS address;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS youtube_url;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS linkedin_url;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS instagram_url;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS facebook_url;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS website;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS email;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS whatsapp;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS phone;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS status;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS category;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS description;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS name;
--     ALTER TABLE public.businesses DROP COLUMN IF EXISTS owner_id;
--     RAISE NOTICE 'Rollback complete - columns removed';
-- END $$;
-- 
-- ============================================================================

