-- Fix RLS Policies for Public Read Access
-- This migration ensures anonymous users can read businesses, categories, and products

-- Drop existing restrictive policies for businesses
DROP POLICY IF EXISTS "public_read_businesses" ON public.businesses;
DROP POLICY IF EXISTS "anon_read_businesses" ON public.businesses;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.businesses;

-- Create public read policy for businesses
CREATE POLICY "public_read_businesses"
ON public.businesses
FOR SELECT
USING ( true );

-- Drop existing restrictive policies for categories
DROP POLICY IF EXISTS "public_read_categories" ON public.categories;
DROP POLICY IF EXISTS "anon_read_categories" ON public.categories;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.categories;

-- Create public read policy for categories
CREATE POLICY "public_read_categories"
ON public.categories
FOR SELECT
USING ( true );

-- Drop existing restrictive policies for products
DROP POLICY IF EXISTS "public_read_products" ON public.products;
DROP POLICY IF EXISTS "anon_read_products" ON public.products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;

-- Create public read policy for products
CREATE POLICY "public_read_products"
ON public.products
FOR SELECT
USING ( true );

-- Ensure RLS is enabled on these tables
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;









