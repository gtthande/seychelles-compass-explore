-- Fix get_live_counters function to use correct column names
-- Products table uses is_active (not status)
-- Businesses table uses is_active and is_verified (not status and verified)

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
    (SELECT COUNT(*) FROM businesses 
     WHERE is_active = true AND is_verified = true) as verified_businesses,
    (SELECT COUNT(*) FROM business_products bp
     JOIN businesses b ON bp.business_id = b.id
     JOIN products p ON bp.product_id = p.id
     WHERE bp.is_active = true 
     AND b.is_active = true 
     AND b.is_verified = true
     AND p.is_active = true) as active_products,
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM reviews r
     JOIN businesses b ON r.business_id = b.id
     WHERE b.is_active = true AND b.is_verified = true) as total_reviews;
$$;









