-- Migration: Add quantity, location, and best_buy_note to business_products
-- This migration extends business_products to support business-specific product details
-- Following Cubic Matrix Level-5 Dev Mode: Architecture → Plan → Code → Test → Handoff

-- Ensure business_products table exists with id column
DO $$
BEGIN
    -- Add id column if it doesn't exist (some migrations use composite PK)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_products' 
        AND column_name = 'id'
    ) THEN
        -- Add id column as primary key
        ALTER TABLE public.business_products 
        ADD COLUMN id uuid PRIMARY KEY DEFAULT gen_random_uuid();
        
        -- If there's a composite primary key, drop it first
        ALTER TABLE public.business_products 
        DROP CONSTRAINT IF EXISTS business_products_pkey;
        
        -- Create new primary key on id
        ALTER TABLE public.business_products 
        ADD PRIMARY KEY (id);
        
        -- Ensure unique constraint on business_id + product_id
        ALTER TABLE public.business_products 
        ADD CONSTRAINT unique_business_product UNIQUE (business_id, product_id);
    END IF;
END $$;

-- Ensure price_override exists (some migrations use price_from/price_to)
DO $$
BEGIN
    -- Add price_override if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_products' 
        AND column_name = 'price_override'
    ) THEN
        ALTER TABLE public.business_products 
        ADD COLUMN price_override numeric(12,2);
        
        -- Migrate data from price_from if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'business_products' 
            AND column_name = 'price_from'
        ) THEN
            UPDATE public.business_products 
            SET price_override = price_from 
            WHERE price_override IS NULL AND price_from IS NOT NULL;
        END IF;
    END IF;
END $$;

-- Add quantity column (integer, default 0)
ALTER TABLE public.business_products 
ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 0;

-- Add location column (text, nullable)
ALTER TABLE public.business_products 
ADD COLUMN IF NOT EXISTS location text;

-- Add best_buy_note column (text, nullable)
ALTER TABLE public.business_products 
ADD COLUMN IF NOT EXISTS best_buy_note text;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_products_quantity 
ON public.business_products(quantity) 
WHERE quantity > 0;

CREATE INDEX IF NOT EXISTS idx_business_products_location 
ON public.business_products(location) 
WHERE location IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.business_products.price_override IS 
  'Business-specific price override for this product (numeric, SCR currency)';

COMMENT ON COLUMN public.business_products.quantity IS 
  'Number of units available from this business (integer, default 0)';

COMMENT ON COLUMN public.business_products.location IS 
  'Location where this product is available (e.g., island or neighborhood, free-form text)';

COMMENT ON COLUMN public.business_products.best_buy_note IS 
  'Short description explaining why this business offer is a best buy';

-- Note: RLS policies from previous migrations should already allow business owners
-- to insert/update rows where business_id matches their own profile.
-- No changes needed to RLS policies for these new columns.

