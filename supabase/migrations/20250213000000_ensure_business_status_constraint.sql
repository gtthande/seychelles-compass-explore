-- ============================
-- Ensure Business Status Column with CHECK Constraint
-- Migration: 20250213000000_ensure_business_status_constraint.sql
-- ============================
-- This migration ensures the status column exists with proper CHECK constraint
-- for Hybrid Option C: pending (users) / approved (admins)
-- ============================

DO $$
BEGIN
  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'businesses' 
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.businesses
    ADD COLUMN status TEXT DEFAULT 'pending';
    
    RAISE NOTICE 'Added status column to businesses table';
  END IF;

  -- Drop existing CHECK constraint if it exists (to update it)
  ALTER TABLE public.businesses
    DROP CONSTRAINT IF EXISTS businesses_status_check;

  -- Add CHECK constraint allowing: pending, approved, suspended, closed
  ALTER TABLE public.businesses
    ADD CONSTRAINT businesses_status_check 
    CHECK (status IN ('pending', 'approved', 'suspended', 'closed'));

  -- Set default to 'pending'
  ALTER TABLE public.businesses
    ALTER COLUMN status SET DEFAULT 'pending';

  -- Create index for status filtering if it doesn't exist
  CREATE INDEX IF NOT EXISTS idx_businesses_status ON public.businesses(status);

  RAISE NOTICE 'Status column constraint verified and index created';
END $$;

-- Ensure is_verified and is_active columns exist (for backward compatibility)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;

-- Sync existing data: if is_verified=true AND is_active=true, set status='approved'
UPDATE public.businesses
SET status = 'approved'
WHERE (is_verified = true AND is_active = true)
  AND (status IS NULL OR status = 'pending');

COMMENT ON COLUMN public.businesses.status IS 
  'Business approval status: pending (default for public users), approved (admin-created or verified), suspended, closed';

