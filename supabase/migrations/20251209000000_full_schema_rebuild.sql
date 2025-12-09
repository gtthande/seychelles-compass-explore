-- ============================
-- iCompass Seychelles — FULL SCHEMA REBUILD (Authoritative)
-- Migration: 20251209000000_full_schema_rebuild.sql
-- ============================
-- This migration completely rebuilds the database schema from scratch
-- to match the exact structure expected by the frontend.

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS business_products CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- ============================
-- 1. CATEGORIES TABLE
-- ============================
CREATE TABLE categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================
-- 2. BUSINESSES TABLE
-- ============================
-- Note: profiles table should already exist from auth setup
-- If it doesn't, create it first
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE TABLE businesses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    phone text,
    email text,
    website text,
    image_url text,
    category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
    is_verified boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================
-- 3. PRODUCTS TABLE
-- ============================
-- Note: products table does NOT have a category field
-- Products are linked to businesses via business_products join table
CREATE TABLE products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    price numeric,
    slug text,
    image_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================
-- 4. BUSINESS_PRODUCTS JOIN TABLE
-- ============================
CREATE TABLE business_products (
    business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (business_id, product_id)
);

-- ============================
-- INDEXES
-- ============================
CREATE INDEX idx_businesses_category_id ON businesses(category_id);
CREATE INDEX idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX idx_products_business_id ON products(business_id);
CREATE INDEX idx_business_products_business_id ON business_products(business_id);
CREATE INDEX idx_business_products_product_id ON business_products(product_id);

-- ============================
-- ROW LEVEL SECURITY (RLS)
-- ============================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_products ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Public read categories" ON categories 
    FOR SELECT TO anon, authenticated 
    USING (true);

CREATE POLICY "Public read businesses" ON businesses 
    FOR SELECT TO anon, authenticated 
    USING (true);

CREATE POLICY "Public read products" ON products 
    FOR SELECT TO anon, authenticated 
    USING (true);

CREATE POLICY "Public read business_products" ON business_products 
    FOR SELECT TO anon, authenticated 
    USING (true);

-- Admin full access (using service_role check)
CREATE POLICY "Admin full categories" ON categories 
    FOR ALL TO service_role 
    USING (true);

CREATE POLICY "Admin full businesses" ON businesses 
    FOR ALL TO service_role 
    USING (true);

CREATE POLICY "Admin full products" ON products 
    FOR ALL TO service_role 
    USING (true);

CREATE POLICY "Admin full business_products" ON business_products 
    FOR ALL TO service_role 
    USING (true);

-- ============================
-- SEED DATA
-- ============================
-- Insert minimal categories for testing
INSERT INTO categories (title, description) VALUES
    ('Restaurants', 'Dining establishments'),
    ('Hotels', 'Accommodation providers'),
    ('Tourism', 'Tour and travel services'),
    ('Retail', 'Shopping and retail stores'),
    ('Services', 'Various service providers')
ON CONFLICT DO NOTHING;

-- Insert a sample business (requires a profile to exist)
-- Note: This will only work if profiles table has at least one row
DO $$
DECLARE
    sample_owner_id uuid;
BEGIN
    -- Get or create a sample owner profile
    SELECT id INTO sample_owner_id FROM profiles LIMIT 1;
    
    IF sample_owner_id IS NULL THEN
        INSERT INTO profiles (id) VALUES (gen_random_uuid()) RETURNING id INTO sample_owner_id;
    END IF;
    
    -- Insert sample business
    INSERT INTO businesses (owner_id, title, description, category_id, phone, email, is_verified)
    SELECT 
        sample_owner_id,
        'Sample Business',
        'This is a sample business for testing',
        (SELECT id FROM categories LIMIT 1),
        '+248 123 4567',
        'sample@example.com',
        true
    WHERE NOT EXISTS (SELECT 1 FROM businesses WHERE title = 'Sample Business');
    
    -- Insert sample product
    INSERT INTO products (business_id, title, description, price, slug)
    SELECT 
        (SELECT id FROM businesses WHERE title = 'Sample Business' LIMIT 1),
        'Sample Product',
        'Sample Product Description',
        99.99,
        'sample-product'
    WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = 'sample-product');
    
    -- Link business and product
    INSERT INTO business_products (business_id, product_id)
    SELECT 
        b.id,
        p.id
    FROM businesses b
    CROSS JOIN products p
    WHERE b.title = 'Sample Business' 
      AND p.slug = 'sample-product'
    ON CONFLICT DO NOTHING;
END $$;

-- ============================
-- COMMENTS
-- ============================
COMMENT ON TABLE categories IS 'Business categories';
COMMENT ON TABLE businesses IS 'Business listings';
COMMENT ON TABLE products IS 'Product catalog';
COMMENT ON TABLE business_products IS 'Many-to-many relationship between businesses and products';

COMMENT ON COLUMN businesses.title IS 'Business name (replaces old "name" field)';
COMMENT ON COLUMN businesses.category_id IS 'Foreign key to categories (replaces old "category" enum)';
COMMENT ON COLUMN businesses.is_verified IS 'Verification status (replaces old "status" enum)';
COMMENT ON COLUMN categories.title IS 'Category name (replaces old "name" field)';

