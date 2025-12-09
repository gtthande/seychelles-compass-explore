-- ============================
-- Add location_note column to business_products
-- Migration: 20250212000001_add_location_note_to_business_products.sql
-- ============================
-- This migration adds location_note column (alias for location field)
-- to match UI requirements exactly
-- ============================

-- Add location_note column if it doesn't exist
ALTER TABLE public.business_products
  ADD COLUMN IF NOT EXISTS location_note TEXT;

-- Migrate data from location to location_note if location exists and location_note is empty
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'business_products' 
      AND column_name = 'location'
  ) THEN
    UPDATE public.business_products
    SET location_note = location
    WHERE location_note IS NULL AND location IS NOT NULL;
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN public.business_products.location_note IS 
  'Location note where this product is available (e.g., "Beau Vallon, Mahé" or "La Digue only")';

-- Note: We keep both 'location' and 'location_note' for backward compatibility
-- The UI will use 'location_note' going forward

