-- Fix security issues from the linter

-- Fix Function Search Path Mutable issue
-- Update existing functions to have proper search_path

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
    (SELECT COUNT(*) FROM products p 
     JOIN businesses b ON p.business_id = b.id 
     WHERE p.status = 'active' AND b.status = 'active' AND b.verified = true) as active_products,
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM reviews r
     JOIN businesses b ON r.business_id = b.id
     WHERE b.status = 'active' AND b.verified = true) as total_reviews;
$$;

CREATE OR REPLACE FUNCTION public.update_business_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update average rating and total reviews for the business
  UPDATE businesses 
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0) 
      FROM reviews 
      WHERE business_id = COALESCE(NEW.business_id, OLD.business_id)
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM reviews 
      WHERE business_id = COALESCE(NEW.business_id, OLD.business_id)
    )
  WHERE id = COALESCE(NEW.business_id, OLD.business_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    user_id,
    old_values,
    new_values
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    auth.uid(),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;