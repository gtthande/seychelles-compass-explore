-- Add title and duration fields to products table
-- Idempotent migration - safe to run multiple times

DO $$
BEGIN
    -- Add title column if it doesn't exist (use name as fallback)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'title'
    ) THEN
        ALTER TABLE public.products ADD COLUMN title TEXT;
        -- Populate title from name if name exists
        UPDATE public.products SET title = name WHERE title IS NULL AND name IS NOT NULL;
        RAISE NOTICE 'Added title column to products table';
    END IF;

    -- Add duration column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'duration'
    ) THEN
        ALTER TABLE public.products ADD COLUMN duration TEXT;
        RAISE NOTICE 'Added duration column to products table';
    END IF;

    -- Ensure all other required columns exist
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS searchable BOOLEAN DEFAULT true;

    RAISE NOTICE 'Product fields migration complete';
END $$;

