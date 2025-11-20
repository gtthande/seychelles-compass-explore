-- Backup entire schema
-- Run this before making schema changes
-- Idempotent: safe to run multiple times

DO $$
BEGIN
    -- Create backup schema if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'backup_schema') THEN
        CREATE SCHEMA backup_schema;
        RAISE NOTICE 'Backup schema created';
    END IF;

    -- Backup businesses table
    DROP TABLE IF EXISTS backup_schema.businesses;
    CREATE TABLE backup_schema.businesses AS SELECT * FROM public.businesses;
    
    RAISE NOTICE 'Businesses table backed up to backup_schema.businesses';
END $$;

