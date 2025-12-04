-- Ensure Public Read Access for Businesses, Products, and Categories
-- This migration ensures anonymous users can read active businesses, products, and categories
-- for public browsing while maintaining write restrictions for admins only

-- ============================================
-- BUSINESSES TABLE - Public Read Access
-- ============================================

-- Ensure businesses table has RLS enabled
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Public can view active businesses
DROP POLICY IF EXISTS "Public can view active businesses" ON public.businesses;
CREATE POLICY "Public can view active businesses" 
ON public.businesses 
FOR SELECT 
USING (status = 'active');

-- Admins can view all businesses (including pending/inactive)
DROP POLICY IF EXISTS "Admins can view all businesses" ON public.businesses;
CREATE POLICY "Admins can view all businesses" 
ON public.businesses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Admins can insert businesses
DROP POLICY IF EXISTS "Admins can insert businesses" ON public.businesses;
CREATE POLICY "Admins can insert businesses" 
ON public.businesses 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Admins can update businesses
DROP POLICY IF EXISTS "Admins can update businesses" ON public.businesses;
CREATE POLICY "Admins can update businesses" 
ON public.businesses 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Admins can delete businesses
DROP POLICY IF EXISTS "Admins can delete businesses" ON public.businesses;
CREATE POLICY "Admins can delete businesses" 
ON public.businesses 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- ============================================
-- PRODUCTS TABLE - Public Read Access
-- ============================================

-- Ensure products table has RLS enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public can view active products (master catalogue)
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" 
ON public.products 
FOR SELECT 
USING (
  status = 'active' OR status IS NULL
);

-- Admins can view all products
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
CREATE POLICY "Admins can view all products" 
ON public.products 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Admins can insert products
DROP POLICY IF EXISTS "Admins can insert all products" ON public.products;
CREATE POLICY "Admins can insert all products" 
ON public.products 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Admins can update products
DROP POLICY IF EXISTS "Admins can update all products" ON public.products;
CREATE POLICY "Admins can update all products" 
ON public.products 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Admins can delete products
DROP POLICY IF EXISTS "Admins can delete all products" ON public.products;
CREATE POLICY "Admins can delete all products" 
ON public.products 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- ============================================
-- CATEGORIES TABLE - Public Read Access
-- ============================================

-- Ensure categories table has RLS enabled
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Public can view active categories
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
CREATE POLICY "Public can view active categories" 
ON public.categories 
FOR SELECT 
USING (is_active = true OR is_active IS NULL);

-- Admins can view all categories
DROP POLICY IF EXISTS "Admins can view all categories" ON public.categories;
CREATE POLICY "Admins can view all categories" 
ON public.categories 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Admins can insert categories
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories" 
ON public.categories 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Admins can update categories
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories" 
ON public.categories 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Admins can delete categories
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories" 
ON public.categories 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Note: business_products RLS policies are already set in migration 20251202130000
-- They allow public read access for active business_products linked to active businesses







