-- ==================================================
-- COMPREHENSIVE RLS FIX FOR ICOMPASS SEYCHELLES
-- ==================================================
-- This migration fixes all Row Level Security policies to ensure:
-- 1. Public read access for businesses, categories, products, business_products
-- 2. Users can select their own profile
-- 3. Admins have full access to all tables
-- 4. Admin write access for data editing tables
-- ==================================================

-- ==================================================
-- HELPER FUNCTION: Check if user is admin
-- ==================================================
CREATE OR REPLACE FUNCTION public.is_admin_user(uid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE (profiles.id = uid OR profiles.user_id = uid)
    AND (is_admin = true OR role = 'admin')
  );
END;
$$;

COMMENT ON FUNCTION public.is_admin_user IS 
  'Checks if user is admin by matching profiles.id or profiles.user_id with auth.uid(). Returns true if is_admin=true OR role=admin.';

-- ==================================================
-- PROFILES TABLE
-- ==================================================

-- Enable RLS
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies (comprehensive list)
DROP POLICY IF EXISTS "user_can_select_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "admin_full_access_profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Allow users to select their own profile
CREATE POLICY "user_can_select_own_profile"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR 
  auth.uid() = user_id
);

-- Allow admin full access (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "admin_full_access_profiles"
ON public.profiles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p2
    WHERE (p2.id = auth.uid() OR p2.user_id = auth.uid())
    AND (p2.is_admin = true OR p2.role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p2
    WHERE (p2.id = auth.uid() OR p2.user_id = auth.uid())
    AND (p2.is_admin = true OR p2.role = 'admin')
  )
);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (
  auth.uid() = id OR 
  auth.uid() = user_id
);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id OR 
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = id OR 
  auth.uid() = user_id
);

-- ==================================================
-- BUSINESSES TABLE
-- ==================================================

-- Enable RLS
ALTER TABLE IF EXISTS public.businesses ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "public_read_businesses" ON public.businesses;
DROP POLICY IF EXISTS "Public Businesses" ON public.businesses;
DROP POLICY IF EXISTS "Public can view active businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins can view all businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins can insert businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins can update businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins can delete businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admin Write Businesses" ON public.businesses;
DROP POLICY IF EXISTS "Public Read Businesses" ON public.businesses;
DROP POLICY IF EXISTS "admin_write_businesses" ON public.businesses;

-- Public read access (anyone can read)
CREATE POLICY "public_read_businesses"
ON public.businesses
FOR SELECT
USING (true);

-- Admin write access (INSERT, UPDATE, DELETE)
CREATE POLICY "admin_write_businesses"
ON public.businesses
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = auth.uid() OR p.user_id = auth.uid())
    AND (p.is_admin = true OR p.role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = auth.uid() OR p.user_id = auth.uid())
    AND (p.is_admin = true OR p.role = 'admin')
  )
);

-- ==================================================
-- CATEGORIES TABLE
-- ==================================================

-- Enable RLS
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "public_read_categories" ON public.categories;
DROP POLICY IF EXISTS "Public Categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can view all categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
DROP POLICY IF EXISTS "admin_write_categories" ON public.categories;

-- Public read access (anyone can read)
CREATE POLICY "public_read_categories"
ON public.categories
FOR SELECT
USING (true);

-- Admin write access (INSERT, UPDATE, DELETE)
CREATE POLICY "admin_write_categories"
ON public.categories
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = auth.uid() OR p.user_id = auth.uid())
    AND (p.is_admin = true OR p.role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = auth.uid() OR p.user_id = auth.uid())
    AND (p.is_admin = true OR p.role = 'admin')
  )
);

-- ==================================================
-- PRODUCTS TABLE
-- ==================================================

-- Enable RLS
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "public_read_products" ON public.products;
DROP POLICY IF EXISTS "Public Products" ON public.products;
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert all products" ON public.products;
DROP POLICY IF EXISTS "Admins can update all products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete all products" ON public.products;
DROP POLICY IF EXISTS "Admin Write Products" ON public.products;
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
DROP POLICY IF EXISTS "admin_write_products" ON public.products;

-- Public read access (anyone can read)
CREATE POLICY "public_read_products"
ON public.products
FOR SELECT
USING (true);

-- Admin write access (INSERT, UPDATE, DELETE)
CREATE POLICY "admin_write_products"
ON public.products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = auth.uid() OR p.user_id = auth.uid())
    AND (p.is_admin = true OR p.role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = auth.uid() OR p.user_id = auth.uid())
    AND (p.is_admin = true OR p.role = 'admin')
  )
);

-- ==================================================
-- BUSINESS_PRODUCTS TABLE (Junction Table)
-- ==================================================

-- Enable RLS
ALTER TABLE IF EXISTS public.business_products ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "public_read_business_products" ON public.business_products;
DROP POLICY IF EXISTS "Public Business Products" ON public.business_products;
DROP POLICY IF EXISTS "Public can view active business_products" ON public.business_products;
DROP POLICY IF EXISTS "Admins can view all business_products" ON public.business_products;
DROP POLICY IF EXISTS "Admins can insert all business_products" ON public.business_products;
DROP POLICY IF EXISTS "Admins can update all business_products" ON public.business_products;
DROP POLICY IF EXISTS "Admins can delete all business_products" ON public.business_products;
DROP POLICY IF EXISTS "Admin Write BusinessProducts" ON public.business_products;
DROP POLICY IF EXISTS "Public Read BusinessProducts" ON public.business_products;
DROP POLICY IF EXISTS "admin_write_business_products" ON public.business_products;

-- Public read access (anyone can read)
CREATE POLICY "public_read_business_products"
ON public.business_products
FOR SELECT
USING (true);

-- Admin write access (INSERT, UPDATE, DELETE)
CREATE POLICY "admin_write_business_products"
ON public.business_products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = auth.uid() OR p.user_id = auth.uid())
    AND (p.is_admin = true OR p.role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = auth.uid() OR p.user_id = auth.uid())
    AND (p.is_admin = true OR p.role = 'admin')
  )
);

-- ==================================================
-- VERIFICATION
-- ==================================================

-- Verify RLS is enabled on all tables
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  -- Check businesses
  SELECT rowsecurity INTO rls_enabled FROM pg_tables WHERE schemaname = 'public' AND tablename = 'businesses';
  IF NOT rls_enabled THEN
    RAISE EXCEPTION 'RLS not enabled on businesses table';
  END IF;
  
  -- Check categories
  SELECT rowsecurity INTO rls_enabled FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories';
  IF NOT rls_enabled THEN
    RAISE EXCEPTION 'RLS not enabled on categories table';
  END IF;
  
  -- Check products
  SELECT rowsecurity INTO rls_enabled FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products';
  IF NOT rls_enabled THEN
    RAISE EXCEPTION 'RLS not enabled on products table';
  END IF;
  
  -- Check business_products
  SELECT rowsecurity INTO rls_enabled FROM pg_tables WHERE schemaname = 'public' AND tablename = 'business_products';
  IF NOT rls_enabled THEN
    RAISE EXCEPTION 'RLS not enabled on business_products table';
  END IF;
  
  -- Check profiles
  SELECT rowsecurity INTO rls_enabled FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles';
  IF NOT rls_enabled THEN
    RAISE EXCEPTION 'RLS not enabled on profiles table';
  END IF;
  
  RAISE NOTICE '✅ All RLS policies have been successfully applied!';
END $$;

