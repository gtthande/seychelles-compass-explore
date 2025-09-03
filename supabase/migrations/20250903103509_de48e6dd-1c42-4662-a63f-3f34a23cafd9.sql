-- Fix the businesses table to use 'verified' field for filtering
-- Ensure we have proper verification system
-- Update the LiveCounters queries to only count verified businesses and their products

-- Create database function for accurate counter aggregation
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

-- Create triggers to update business ratings automatically
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

-- Create trigger for reviews
DROP TRIGGER IF EXISTS update_business_rating_trigger ON reviews;
CREATE TRIGGER update_business_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_business_rating();

-- Add audit log table for tracking changes
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL, -- INSERT, UPDATE, DELETE
  user_id uuid REFERENCES auth.users(id),
  old_values jsonb,
  new_values jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Create audit trigger function
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

-- Add audit triggers to important tables
DROP TRIGGER IF EXISTS audit_businesses_trigger ON businesses;
CREATE TRIGGER audit_businesses_trigger
  AFTER INSERT OR UPDATE OR DELETE ON businesses
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS audit_products_trigger ON products;
CREATE TRIGGER audit_products_trigger
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();