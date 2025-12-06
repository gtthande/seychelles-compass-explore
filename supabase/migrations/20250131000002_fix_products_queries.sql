-- Fix Products Module Queries
-- This migration fixes:
-- 1. get_live_counters to use business_products instead of products.business_id
-- 2. Ensures RLS policies allow admin access to products and business_products

-- ============================================
-- FIX get_live_counters FUNCTION
-- ============================================
-- Update to use business_products instead of products.business_id
CREATE OR REPLACE FUNCTION public.get_live_counters()
RETURNS TABLE (
  verified_businesses bigint,
  active_products bigint,
  total_users bigint,
  total_reviews bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM businesses WHERE status = 'active' AND verified = true) as verified_businesses,
    (SELECT COUNT(*) FROM business_products bp
     JOIN businesses b ON bp.business_id = b.id
     JOIN products p ON bp.product_id = p.id
     WHERE bp.is_active = true 
     AND b.status = 'active' 
     AND b.verified = true
     AND (p.status = 'active' OR p.status IS NULL)) as active_products,
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM reviews r
     JOIN businesses b ON r.business_id = b.id
     WHERE b.status = 'active' AND b.verified = true) as total_reviews;
$$;

-- ============================================
-- ENSURE RLS POLICIES ALLOW ADMIN ACCESS
-- ============================================

-- Products table: Ensure admin can read all products
DROP POLICY IF EXISTS "admin_read_all_products" ON public.products;
CREATE POLICY "admin_read_all_products"
ON public.products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = auth.uid() OR p.user_id = auth.uid())
    AND (p.is_admin = true OR p.role = 'admin')
  )
);

-- Business_products table: Ensure admin can read all business_products
DROP POLICY IF EXISTS "admin_read_all_business_products" ON public.business_products;
CREATE POLICY "admin_read_all_business_products"
ON public.business_products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = auth.uid() OR p.user_id = auth.uid())
    AND (p.is_admin = true OR p.role = 'admin')
  )
);

-- Note: The existing "public_read_products" and "public_read_business_products" policies
-- should already allow public read access. This adds explicit admin read access.

