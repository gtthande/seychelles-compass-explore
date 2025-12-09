BEGIN;

-- Ensure deprecated columns do not exist
ALTER TABLE products DROP COLUMN IF EXISTS name CASCADE;

-- Ensure required columns exist
ALTER TABLE products
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS price NUMERIC,
ADD COLUMN IF NOT EXISTS duration TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS searchable BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS image_url JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS business_id UUID,
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Add FK (safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_business_id_fkey'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT products_business_id_fkey
    FOREIGN KEY (business_id) REFERENCES businesses(id)
    ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;



