-- Disable RLS for safe dropping
ALTER TABLE IF EXISTS business_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories DISABLE ROW LEVEL SECURITY;

-- Drop join table
DROP TABLE IF EXISTS business_products CASCADE;

-- Drop core tables
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Optionally drop old helper or orphaned tables
DROP TABLE IF EXISTS business_categories CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS images CASCADE;
