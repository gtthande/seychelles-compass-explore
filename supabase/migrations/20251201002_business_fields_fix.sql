-- Business Fields Fix Migration
-- Ensures all required business fields exist
-- Idempotent - safe to run multiple times

DO $$
BEGIN
    -- Add verification_notes if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'verification_notes'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN verification_notes TEXT;
        COMMENT ON COLUMN public.businesses.verification_notes IS 'Admin notes about business verification';
    END IF;

    -- Add island if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'island'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN island TEXT;
        COMMENT ON COLUMN public.businesses.island IS 'Seychelles island where business is located';
    END IF;

    -- Add category if missing (should exist, but ensure it does)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'category'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN category TEXT;
        COMMENT ON COLUMN public.businesses.category IS 'Business category';
    END IF;

    -- Add opening_hours if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'opening_hours'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN opening_hours JSONB;
        COMMENT ON COLUMN public.businesses.opening_hours IS 'Business opening hours configuration';
    END IF;

    -- Add services if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'services'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN services TEXT[];
        COMMENT ON COLUMN public.businesses.services IS 'List of services offered by the business';
    END IF;

    -- Add gallery_images if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'gallery_images'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN gallery_images TEXT[];
        COMMENT ON COLUMN public.businesses.gallery_images IS 'Array of gallery image URLs';
    END IF;

    -- Add average_rating if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'average_rating'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN average_rating NUMERIC(3,2) DEFAULT 0;
        COMMENT ON COLUMN public.businesses.average_rating IS 'Average rating of the business';
    END IF;

    -- Add total_reviews if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'total_reviews'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN total_reviews INTEGER DEFAULT 0;
        COMMENT ON COLUMN public.businesses.total_reviews IS 'Total number of reviews';
    END IF;

    RAISE NOTICE 'All business fields verified';
END $$;

