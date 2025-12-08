-- Fix business_products.title_override column
-- 
-- This migration ensures that business_products has the title_override column
-- that is expected by the TypeScript code. This column allows businesses to
-- override the product title for their specific instance.
--
-- The column is nullable - if not set, the UI falls back to products.title

-- Add title_override column if it doesn't exist
ALTER TABLE public.business_products
  ADD COLUMN IF NOT EXISTS title_override TEXT;

-- Add description_override column if it doesn't exist (also used by code)
ALTER TABLE public.business_products
  ADD COLUMN IF NOT EXISTS description_override TEXT;

-- Add price_override column if it doesn't exist (unified schema field)
ALTER TABLE public.business_products
  ADD COLUMN IF NOT EXISTS price_override NUMERIC(12,2);

-- Ensure updated_at column exists (used by triggers)
ALTER TABLE public.business_products
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create or replace trigger for updated_at if it doesn't exist
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

-- Add comment to document the column
COMMENT ON COLUMN public.business_products.title_override IS 
  'Optional custom title for this product at this business. If NULL, falls back to products.title.';

COMMENT ON COLUMN public.business_products.description_override IS 
  'Optional custom description for this product at this business. If NULL, falls back to products.description.';

COMMENT ON COLUMN public.business_products.price_override IS 
  'Primary price field for this product at this business. Legacy fields (price_from, price_to) are kept for backward compatibility.';
