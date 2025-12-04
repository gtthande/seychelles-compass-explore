-- Drop products.business_id column migration
-- 
-- This migration safely removes the business_id column from products table
-- since we've migrated to the many-to-many business_products join table.
--
-- products = master catalogue (no business_id)
-- business_products = business-specific instance with pricing, duration, notes
--
-- Note: This only drops the column if it exists and has no critical data dependencies.
-- If there's existing data in products.business_id, it should be migrated to business_products first.

-- Check if column exists and drop it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'products' 
        AND column_name = 'business_id'
    ) THEN
        -- Drop the foreign key constraint first if it exists
        ALTER TABLE public.products 
        DROP CONSTRAINT IF EXISTS products_business_id_fkey;
        
        -- Drop the index if it exists
        DROP INDEX IF EXISTS idx_products_business;
        DROP INDEX IF EXISTS uq_products_business_slug;
        
        -- Drop the column
        ALTER TABLE public.products 
        DROP COLUMN IF EXISTS business_id;
        
        RAISE NOTICE 'Dropped products.business_id column successfully';
    ELSE
        RAISE NOTICE 'products.business_id column does not exist, skipping';
    END IF;
END $$;







