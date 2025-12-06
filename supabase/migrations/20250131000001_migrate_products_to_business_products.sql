-- Migration: Populate business_products from existing products.business_id
-- This migration is idempotent and safe to run multiple times
-- It ensures business_products table has all required columns and migrates data

-- Step 1: Ensure business_products table exists with all required columns
DO $$
BEGIN
    -- Ensure table exists (should already exist from previous migration)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'business_products') THEN
        CREATE TABLE public.business_products (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
            product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
            title_override text,
            description_override text,
            price_from numeric(12,2),
            price_to numeric(12,2),
            currency_code text DEFAULT 'SCR',
            duration_minutes integer,
            is_active boolean DEFAULT true,
            booking_url text,
            notes text,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now(),
            CONSTRAINT unique_business_product UNIQUE (business_id, product_id)
        );
    END IF;

    -- Add missing columns if they don't exist (for backward compatibility)
    ALTER TABLE public.business_products 
        ADD COLUMN IF NOT EXISTS title_override text,
        ADD COLUMN IF NOT EXISTS description_override text,
        ADD COLUMN IF NOT EXISTS price_from numeric(12,2),
        ADD COLUMN IF NOT EXISTS price_to numeric(12,2),
        ADD COLUMN IF NOT EXISTS currency_code text DEFAULT 'SCR',
        ADD COLUMN IF NOT EXISTS duration_minutes integer,
        ADD COLUMN IF NOT EXISTS booking_url text,
        ADD COLUMN IF NOT EXISTS notes text,
        ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

    -- Ensure unique constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_business_product'
    ) THEN
        ALTER TABLE public.business_products 
        ADD CONSTRAINT unique_business_product UNIQUE (business_id, product_id);
    END IF;
END $$;

-- Step 2: Ensure products table has image_url column (if missing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE public.products ADD COLUMN image_url text;
    END IF;
END $$;

-- Step 3: Migrate data from products.business_id to business_products
-- This is idempotent: only inserts if the link doesn't already exist
INSERT INTO public.business_products (
    business_id,
    product_id,
    price_from,
    price_to,
    currency_code,
    is_active,
    created_at,
    updated_at
)
SELECT
    p.business_id,
    p.id AS product_id,
    -- Map price to price_from (if price exists)
    CASE 
        WHEN p.price IS NOT NULL THEN p.price::numeric(12,2)
        ELSE NULL
    END AS price_from,
    -- price_to remains NULL (no range in old schema)
    NULL::numeric(12,2) AS price_to,
    -- Use currency from products if exists, otherwise default to SCR
    COALESCE(p.currency, 'SCR') AS currency_code,
    -- Map is_active from products
    COALESCE(p.is_active, true) AS is_active,
    -- Preserve created_at from products
    COALESCE(p.created_at, now()) AS created_at,
    -- Set updated_at to now
    now() AS updated_at
FROM public.products p
WHERE p.business_id IS NOT NULL
  -- Only insert if link doesn't already exist (idempotent)
  AND NOT EXISTS (
      SELECT 1
      FROM public.business_products bp
      WHERE bp.business_id = p.business_id
        AND bp.product_id = p.id
  )
ON CONFLICT (business_id, product_id) DO NOTHING;

-- Step 4: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_business_products_business_id 
    ON public.business_products(business_id);
CREATE INDEX IF NOT EXISTS idx_business_products_product_id 
    ON public.business_products(product_id);
CREATE INDEX IF NOT EXISTS idx_business_products_is_active 
    ON public.business_products(is_active) 
    WHERE is_active = true;

-- Step 5: Ensure RLS is enabled
ALTER TABLE public.business_products ENABLE ROW LEVEL SECURITY;

-- Step 6: Ensure updated_at trigger exists
CREATE OR REPLACE FUNCTION update_business_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_business_products_updated_at ON public.business_products;
CREATE TRIGGER update_business_products_updated_at
    BEFORE UPDATE ON public.business_products
    FOR EACH ROW
    EXECUTE FUNCTION update_business_products_updated_at();

-- Note: RLS policies should already exist from 20251202130000_create_business_products_table.sql
-- If they don't, they will be created by that migration
-- This migration focuses on data migration and schema alignment

