-- Fix RLS Policies for Public Access
-- This migration ensures all tables have proper RLS policies for public read access

-- Categories table
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Categories" ON categories;
CREATE POLICY "Public Categories" ON categories 
  FOR SELECT 
  USING (true);

-- Products table
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Products" ON products;
CREATE POLICY "Public Products" ON products 
  FOR SELECT 
  USING (true);

-- Business Products table
ALTER TABLE IF EXISTS business_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Business Products" ON business_products;
CREATE POLICY "Public Business Products" ON business_products 
  FOR SELECT 
  USING (true);

-- Businesses table (if not already enabled)
ALTER TABLE IF EXISTS businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Businesses" ON businesses;
CREATE POLICY "Public Businesses" ON businesses 
  FOR SELECT 
  USING (true);

-- Ensure unique constraint on business_products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_business_product'
  ) THEN
    ALTER TABLE business_products
    ADD CONSTRAINT unique_business_product UNIQUE (business_id, product_id);
  END IF;
END$$;

-- Ensure image_url column exists in categories (nullable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE categories ADD COLUMN image_url TEXT NULL;
  END IF;
END$$;




