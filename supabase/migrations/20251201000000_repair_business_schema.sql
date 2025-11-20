-- Repair Business Schema Migration
-- Ensures all required columns exist in the businesses table
-- Idempotent - safe to run multiple times

DO $$
BEGIN
    -- Ensure id exists (should always exist, but check anyway)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'id'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
    END IF;

    -- Ensure owner_id exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN owner_id UUID REFERENCES auth.users(id);
    END IF;

    -- Ensure name exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'name'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN name TEXT NOT NULL;
    END IF;

    -- Ensure description exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'description'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN description TEXT;
    END IF;

    -- Ensure category exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'category'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN category TEXT;
    END IF;

    -- Ensure status exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;

    -- Ensure phone exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'phone'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN phone TEXT;
    END IF;

    -- Ensure whatsapp exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'whatsapp'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN whatsapp TEXT;
    END IF;

    -- Ensure email exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'email'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN email TEXT;
    END IF;

    -- Ensure website exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'website'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN website TEXT;
    END IF;

    -- Ensure latitude exists (NUMERIC)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'latitude'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN latitude NUMERIC(10,8);
    ELSE
        -- Ensure it's NUMERIC type
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'businesses' 
            AND column_name = 'latitude' AND data_type != 'numeric'
        ) THEN
            ALTER TABLE public.businesses ALTER COLUMN latitude TYPE NUMERIC(10,8);
        END IF;
    END IF;

    -- Ensure longitude exists (NUMERIC)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'longitude'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN longitude NUMERIC(11,8);
    ELSE
        -- Ensure it's NUMERIC type
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'businesses' 
            AND column_name = 'longitude' AND data_type != 'numeric'
        ) THEN
            ALTER TABLE public.businesses ALTER COLUMN longitude TYPE NUMERIC(11,8);
        END IF;
    END IF;

    -- Ensure island exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'island'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN island TEXT;
    END IF;

    -- Ensure opening_hours exists (JSONB)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'opening_hours'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN opening_hours JSONB;
    END IF;

    -- Ensure services exists (array)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'services'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN services TEXT[];
    END IF;

    -- Ensure featured exists (boolean)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'featured'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN featured BOOLEAN DEFAULT false;
    END IF;

    -- Ensure verified exists (boolean)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'verified'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN verified BOOLEAN DEFAULT false;
    END IF;

    -- Ensure logo_url exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'logo_url'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN logo_url TEXT;
    END IF;

    -- Ensure cover_image_url exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'cover_image_url'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN cover_image_url TEXT;
    END IF;

    -- Ensure gallery_images exists (array)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'gallery_images'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN gallery_images TEXT[];
    END IF;

    -- Ensure average_rating exists (numeric)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'average_rating'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN average_rating NUMERIC(3,2) DEFAULT 0;
    END IF;

    -- Ensure total_reviews exists (integer)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'total_reviews'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN total_reviews INTEGER DEFAULT 0;
    END IF;

    -- Ensure created_at exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Ensure updated_at exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    RAISE NOTICE 'Business schema repair complete - all required columns verified';
END $$;

