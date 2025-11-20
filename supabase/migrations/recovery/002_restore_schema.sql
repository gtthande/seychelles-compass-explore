-- Restore data back from backup
-- Use this to restore businesses table from backup
-- WARNING: This will overwrite existing data in public.businesses

DO $$
BEGIN
    -- Check if backup exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'backup_schema' AND table_name = 'businesses') THEN
        RAISE EXCEPTION 'Backup table backup_schema.businesses does not exist. Cannot restore.';
    END IF;

    -- Truncate current table
    TRUNCATE TABLE public.businesses;
    
    -- Restore from backup
    INSERT INTO public.businesses SELECT * FROM backup_schema.businesses;
    
    RAISE NOTICE 'Businesses table restored from backup_schema.businesses';
    RAISE NOTICE 'Restored % rows', (SELECT COUNT(*) FROM public.businesses);
END $$;

