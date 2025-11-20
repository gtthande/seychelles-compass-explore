-- Add verification_notes column to businesses if missing
-- This migration is idempotent and safe to run multiple times
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'businesses'
        AND column_name = 'verification_notes'
    ) THEN
        ALTER TABLE public.businesses
        ADD COLUMN verification_notes text;
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.businesses.verification_notes IS 'Admin notes about business verification';

