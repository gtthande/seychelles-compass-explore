-- Fix Business Fields Migration
-- Ensures correct field names and removes legacy fields
-- This migration is idempotent and safe to run multiple times

DO $$
BEGIN
    -- Add verification_notes if missing
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'businesses'
        AND column_name = 'verification_notes'
    ) THEN
        ALTER TABLE public.businesses
        ADD COLUMN verification_notes TEXT;
        COMMENT ON COLUMN public.businesses.verification_notes IS 'Admin notes about business verification';
    END IF;

    -- Ensure latitude exists as NUMERIC
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'businesses'
        AND column_name = 'latitude'
    ) THEN
        ALTER TABLE public.businesses
        ADD COLUMN latitude NUMERIC(10, 8);
        COMMENT ON COLUMN public.businesses.latitude IS 'Business latitude coordinate';
    END IF;

    -- Ensure longitude exists as NUMERIC
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'businesses'
        AND column_name = 'longitude'
    ) THEN
        ALTER TABLE public.businesses
        ADD COLUMN longitude NUMERIC(11, 8);
        COMMENT ON COLUMN public.businesses.longitude IS 'Business longitude coordinate';
    END IF;

    -- Ensure island exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'businesses'
        AND column_name = 'island'
    ) THEN
        ALTER TABLE public.businesses
        ADD COLUMN island TEXT;
        COMMENT ON COLUMN public.businesses.island IS 'Seychelles island where business is located';
    END IF;

    -- Remove legacy fields if they exist (lat, lng, coords)
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'businesses'
        AND column_name = 'lat'
    ) THEN
        -- Migrate data from lat to latitude if latitude is null
        UPDATE public.businesses
        SET latitude = lat::NUMERIC(10, 8)
        WHERE latitude IS NULL AND lat IS NOT NULL;
        
        ALTER TABLE public.businesses DROP COLUMN IF EXISTS lat;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'businesses'
        AND column_name = 'lng'
    ) THEN
        -- Migrate data from lng to longitude if longitude is null
        UPDATE public.businesses
        SET longitude = lng::NUMERIC(11, 8)
        WHERE longitude IS NULL AND lng IS NOT NULL;
        
        ALTER TABLE public.businesses DROP COLUMN IF EXISTS lng;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'businesses'
        AND column_name = 'coords'
    ) THEN
        -- Migrate data from coords JSONB to latitude/longitude if they are null
        UPDATE public.businesses
        SET 
            latitude = COALESCE(latitude, (coords->>'lat')::NUMERIC(10, 8)),
            longitude = COALESCE(longitude, (coords->>'lng')::NUMERIC(11, 8))
        WHERE (latitude IS NULL OR longitude IS NULL)
        AND coords IS NOT NULL
        AND coords->>'lat' IS NOT NULL
        AND coords->>'lng' IS NOT NULL;
        
        ALTER TABLE public.businesses DROP COLUMN IF EXISTS coords;
    END IF;

    -- Remove other legacy coordinate fields
    ALTER TABLE public.businesses DROP COLUMN IF EXISTS location_lat;
    ALTER TABLE public.businesses DROP COLUMN IF EXISTS location_lng;

END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_businesses_latitude_longitude ON public.businesses(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_businesses_island ON public.businesses(island);

