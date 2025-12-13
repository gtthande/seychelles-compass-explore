-- Fix Supabase RPC and RLS issues; update StatusBadge default
-- This migration fixes:
-- 1. get_live_counters RPC function to remove invalid status column references
-- 2. Ensures RLS policy allows read access to businesses table
-- 3. Simplifies counters to count all records (no status filtering)

-- ============================================
-- FIX get_live_counters FUNCTION
-- ============================================
-- Remove status column references and count all records
-- Simplified to count all businesses and products without status filtering
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
    -- Count all businesses (no status filter)
    (SELECT COUNT(*) FROM businesses) as verified_businesses,
    -- Count all business_products (no status filter)
    (SELECT COUNT(*) FROM business_products) as active_products,
    -- Count all profiles
    (SELECT COUNT(*) FROM profiles) as total_users,
    -- Count all reviews
    (SELECT COUNT(*) FROM reviews) as total_reviews;
$$;

-- ============================================
-- ENSURE RLS POLICY FOR BUSINESSES
-- ============================================
-- Enable RLS on businesses table if not already enabled
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Allow read access to businesses" ON public.businesses;
DROP POLICY IF EXISTS "public_read" ON public.businesses;
DROP POLICY IF EXISTS "public_read_businesses" ON public.businesses;

-- Create a simple policy that allows anyone to read businesses
CREATE POLICY "Allow read access to businesses"
  ON public.businesses
  FOR SELECT
  USING (true);

-- ============================================
-- ENSURE RLS POLICY FOR PRODUCTS (for consistency)
-- ============================================
-- Enable RLS on products table if not already enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow read access to products" ON public.products;
DROP POLICY IF EXISTS "public_read" ON public.products;
DROP POLICY IF EXISTS "public_read_products" ON public.products;

-- Create a simple policy that allows anyone to read products
CREATE POLICY "Allow read access to products"
  ON public.products
  FOR SELECT
  USING (true);

-- ============================================
-- ENSURE RLS POLICY FOR BUSINESS_PRODUCTS
-- ============================================
-- Enable RLS on business_products table if not already enabled
ALTER TABLE public.business_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow read access to business_products" ON public.business_products;
DROP POLICY IF EXISTS "public_read" ON public.business_products;

-- Create a simple policy that allows anyone to read business_products
CREATE POLICY "Allow read access to business_products"
  ON public.business_products
  FOR SELECT
  USING (true);
