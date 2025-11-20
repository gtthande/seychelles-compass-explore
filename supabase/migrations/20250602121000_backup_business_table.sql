-- Backup Business Table Migration
-- Creates a backup of the businesses table before schema changes
-- This migration is idempotent and safe to run multiple times

DO $$
BEGIN
    -- Check if backup table already exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'businesses_backup'
    ) THEN
        -- Create backup table with all current data
        CREATE TABLE public.businesses_backup AS 
        SELECT * FROM public.businesses;
        
        -- Add comment
        COMMENT ON TABLE public.businesses_backup IS 'Backup of businesses table created before schema migration on 2025-06-02';
        
        RAISE NOTICE 'Businesses backup table created successfully';
    ELSE
        RAISE NOTICE 'Businesses backup table already exists, skipping creation';
    END IF;
END $$;

