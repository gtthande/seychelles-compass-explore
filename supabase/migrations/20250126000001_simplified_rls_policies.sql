-- Simplified RLS Policies for Stability
-- This migration replaces complex RLS policies with simpler ones:
-- - Public read access (anyone can read)
-- - Authenticated write access (any authenticated user can write)
-- 
-- NOTE: This is less secure than admin-only write, but ensures stability.
-- You can tighten security later by adding admin checks.

-- ============================================
-- BUSINESSES TABLE
-- ============================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Public Read Businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admin Write Businesses" ON public.businesses;
DROP POLICY IF EXISTS "Public can view active businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins can view all businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins can insert businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins can update businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins can delete businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can view their own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can insert their own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can delete their own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admin can read all businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admin can update businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admin can delete businesses" ON public.businesses;
DROP POLICY IF EXISTS "Anyone can view active businesses" ON public.businesses;
DROP POLICY IF EXISTS "Business owners can manage their businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins can manage all businesses" ON public.businesses;

-- Public read (anyone can read)
CREATE POLICY "Public Read Businesses"
ON public.businesses FOR SELECT 
USING (true);

-- Authenticated write (any authenticated user can write)
CREATE POLICY "Admin Write Businesses"
ON public.businesses FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- PRODUCTS TABLE
-- ============================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
DROP POLICY IF EXISTS "Admin Write Products" ON public.products;
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert all products" ON public.products;
DROP POLICY IF EXISTS "Admins can update all products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete all products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Business owners can manage their products" ON public.products;

-- Public read (anyone can read)
CREATE POLICY "Public Read Products"
ON public.products FOR SELECT 
USING (true);

-- Authenticated write (any authenticated user can write)
CREATE POLICY "Admin Write Products"
ON public.products FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- BUSINESS_PRODUCTS TABLE (Pivot Table)
-- ============================================

ALTER TABLE public.business_products ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Public Read BusinessProducts" ON public.business_products;
DROP POLICY IF EXISTS "Admin Write BusinessProducts" ON public.business_products;
DROP POLICY IF EXISTS "Public can view active business_products" ON public.business_products;
DROP POLICY IF EXISTS "Business owners can view their business_products" ON public.business_products;
DROP POLICY IF EXISTS "Business owners can insert their business_products" ON public.business_products;
DROP POLICY IF EXISTS "Business owners can update their business_products" ON public.business_products;
DROP POLICY IF EXISTS "Business owners can delete their business_products" ON public.business_products;
DROP POLICY IF EXISTS "Admins can view all business_products" ON public.business_products;
DROP POLICY IF EXISTS "Admins can insert all business_products" ON public.business_products;
DROP POLICY IF EXISTS "Admins can update all business_products" ON public.business_products;
DROP POLICY IF EXISTS "Admins can delete all business_products" ON public.business_products;

-- Public read (anyone can read)
CREATE POLICY "Public Read BusinessProducts"
ON public.business_products FOR SELECT 
USING (true);

-- Authenticated write (any authenticated user can write)
CREATE POLICY "Admin Write BusinessProducts"
ON public.business_products FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

