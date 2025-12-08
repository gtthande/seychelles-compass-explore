-- Fix Admin Products API Column Mapping + RLS Alignment
-- This migration ensures:
-- 1. RLS policies for products and business_products use consistent admin check pattern
-- 2. Admin policies check both profiles.id and profiles.user_id for compatibility
-- 3. All admin checks verify is_admin=true OR role='admin'

-- ==================================================
-- PRODUCTS TABLE - RLS ALIGNMENT
-- ==================================================

-- Enable RLS
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for products
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
DROP POLICY IF EXISTS "admin_full" ON public.products;
DROP POLICY IF EXISTS "Admins manage" ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;

-- Public read access (anyone can read)
CREATE POLICY "public_read_products"
ON public.products
FOR SELECT
USING (true);

-- Admin write access (INSERT, UPDATE, DELETE) - consistent pattern
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
-- BUSINESS_PRODUCTS TABLE - RLS ALIGNMENT
-- ==================================================

-- Enable RLS
ALTER TABLE IF EXISTS public.business_products ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for business_products
DROP POLICY IF EXISTS "public_read_business_products" ON public.business_products;
DROP POLICY IF EXISTS "Public Read BusinessProducts" ON public.business_products;
DROP POLICY IF EXISTS "Public can view active business_products" ON public.business_products;
DROP POLICY IF EXISTS "Admins can view all business_products" ON public.business_products;
DROP POLICY IF EXISTS "Admins can insert all business_products" ON public.business_products;
DROP POLICY IF EXISTS "Admins can update all business_products" ON public.business_products;
DROP POLICY IF EXISTS "Admins can delete all business_products" ON public.business_products;
DROP POLICY IF EXISTS "Admin Write BusinessProducts" ON public.business_products;
DROP POLICY IF EXISTS "admin_write_business_products" ON public.business_products;
DROP POLICY IF EXISTS "admin_full" ON public.business_products;
DROP POLICY IF EXISTS "Business owners can view their business_products" ON public.business_products;
DROP POLICY IF EXISTS "Business owners can insert their business_products" ON public.business_products;
DROP POLICY IF EXISTS "Business owners can update their business_products" ON public.business_products;
DROP POLICY IF EXISTS "Business owners can delete their business_products" ON public.business_products;

-- Public read access (anyone can read active business_products)
CREATE POLICY "public_read_business_products"
ON public.business_products
FOR SELECT
USING (is_active = true);

-- Admin write access (INSERT, UPDATE, DELETE) - consistent pattern
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

-- Business owners can manage their own business_products
CREATE POLICY "business_owners_manage_products"
ON public.business_products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.businesses b
    JOIN public.profiles p ON b.owner_id = p.id
    WHERE b.id = business_products.business_id
    AND (p.id = auth.uid() OR p.user_id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses b
    JOIN public.profiles p ON b.owner_id = p.id
    WHERE b.id = business_products.business_id
    AND (p.id = auth.uid() OR p.user_id = auth.uid())
  )
);

COMMENT ON POLICY "public_read_products" ON public.products IS 
  'Allows anyone to read products from the master catalogue';

COMMENT ON POLICY "admin_write_products" ON public.products IS 
  'Allows admins (is_admin=true OR role=admin) to INSERT, UPDATE, DELETE products. Checks both profiles.id and profiles.user_id for compatibility.';

COMMENT ON POLICY "public_read_business_products" ON public.business_products IS 
  'Allows anyone to read active business-product links';

COMMENT ON POLICY "admin_write_business_products" ON public.business_products IS 
  'Allows admins (is_admin=true OR role=admin) to INSERT, UPDATE, DELETE business_products. Checks both profiles.id and profiles.user_id for compatibility.';

COMMENT ON POLICY "business_owners_manage_products" ON public.business_products IS 
  'Allows business owners to manage their own business-product links. Checks both profiles.id and profiles.user_id for compatibility.';
