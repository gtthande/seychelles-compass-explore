-- Ensure all required business fields exist
-- This migration is idempotent and safe to run multiple times

-- Ensure verification_notes exists
ALTER TABLE public.businesses 
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Ensure latitude exists (should already exist, but ensure it's double precision)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses' 
    AND column_name = 'latitude'
  ) THEN
    ALTER TABLE public.businesses ADD COLUMN latitude DOUBLE PRECISION;
  END IF;
END $$;

-- Ensure longitude exists (should already exist, but ensure it's double precision)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses' 
    AND column_name = 'longitude'
  ) THEN
    ALTER TABLE public.businesses ADD COLUMN longitude DOUBLE PRECISION;
  END IF;
END $$;

-- Ensure island exists
ALTER TABLE public.businesses 
  ADD COLUMN IF NOT EXISTS island TEXT;

-- Ensure address exists
ALTER TABLE public.businesses 
  ADD COLUMN IF NOT EXISTS address TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.businesses.verification_notes IS 'Admin notes about business verification';
COMMENT ON COLUMN public.businesses.latitude IS 'Business latitude coordinate';
COMMENT ON COLUMN public.businesses.longitude IS 'Business longitude coordinate';
COMMENT ON COLUMN public.businesses.island IS 'Seychelles island where business is located';
COMMENT ON COLUMN public.businesses.address IS 'Business physical address';

