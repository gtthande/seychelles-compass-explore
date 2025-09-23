-- Comprehensive Schema Fix Migration
-- This migration ensures all required fields and policies are properly set up

-- 1. Ensure profiles table has all required columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Update existing profiles with proper role values
UPDATE public.profiles 
SET role = CASE 
  WHEN is_admin = true THEN 'admin'
  WHEN is_business_owner = true THEN 'business'
  ELSE 'user'
END
WHERE role IS NULL OR role = 'user';

-- 3. Set all existing profiles as active
UPDATE public.profiles SET is_active = true WHERE is_active IS NULL;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- 5. Ensure businesses table has all required columns
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS services TEXT[];

-- 6. Create indexes for businesses table
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON public.businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_island ON public.businesses(island);

-- 7. Drop and recreate all RLS policies to ensure consistency

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Business owners can view customer basic info for their reviews" ON public.profiles;

-- Drop payment policies
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;

-- 8. Create security definer functions for role checking
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
    AND profiles.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_business_user()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'business'
    AND profiles.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_active = true
  );
$$;

-- 9. Recreate profiles policies with proper role-based access
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.is_admin());

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid());

-- 10. Recreate payment policies
CREATE POLICY "Admins can view all payments" 
ON public.payments 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
USING (
  public.is_active_user() 
  AND user_id = auth.uid()
);

-- 11. Ensure businesses policies are correct
DROP POLICY IF EXISTS "Users can view active businesses" ON public.businesses;
DROP POLICY IF EXISTS "Business owners can manage their businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins can manage all businesses" ON public.businesses;

CREATE POLICY "Users can view active businesses" 
ON public.businesses 
FOR SELECT 
USING (status = 'active');

CREATE POLICY "Business owners can manage their businesses" 
ON public.businesses 
FOR ALL 
USING (
  public.is_business_user() 
  AND owner_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all businesses" 
ON public.businesses 
FOR ALL 
USING (public.is_admin());

-- 12. Ensure products policies are correct
DROP POLICY IF EXISTS "Users can view active products" ON public.products;
DROP POLICY IF EXISTS "Business owners can manage their products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;

CREATE POLICY "Users can view active products" 
ON public.products 
FOR SELECT 
USING (status = 'active');

CREATE POLICY "Business owners can manage their products" 
ON public.products 
FOR ALL 
USING (
  public.is_business_user() 
  AND business_id IN (
    SELECT b.id FROM public.businesses b
    JOIN public.profiles p ON p.id = b.owner_id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all products" 
ON public.products 
FOR ALL 
USING (public.is_admin());

-- 13. Ensure appointments policies are correct
DROP POLICY IF EXISTS "Anyone can create appointment requests" ON public.appointments;
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can update appointments" ON public.appointments;

CREATE POLICY "Anyone can create appointment requests" 
ON public.appointments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all appointments" 
ON public.appointments 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can update appointments" 
ON public.appointments 
FOR UPDATE 
USING (public.is_admin());

-- 14. Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  value TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 15. Insert default categories if they don't exist
INSERT INTO public.categories (value, label, description) VALUES
('food', 'Food & Beverages', 'Restaurants, cafes, bars, and food services'),
('accommodation', 'Accommodation', 'Hotels, guesthouses, and lodging'),
('tours', 'Tours & Activities', 'Tour operators, excursions, and activities'),
('transport', 'Transportation', 'Car rentals, taxis, and transport services'),
('retail', 'Retail Products', 'Shops, stores, and retail businesses'),
('services', 'Services', 'Professional and personal services'),
('entertainment', 'Entertainment', 'Entertainment venues and services'),
('education', 'Education', 'Schools, training centers, and educational services'),
('health', 'Health & Wellness', 'Medical, dental, and wellness services'),
('other', 'Other', 'Other business categories')
ON CONFLICT (value) DO NOTHING;

-- 16. Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 17. Create categories policies
CREATE POLICY "Anyone can view categories" 
ON public.categories 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage categories" 
ON public.categories 
FOR ALL 
USING (public.is_admin());

-- 18. Create app_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 19. Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- 20. Create app_settings policies
CREATE POLICY "Anyone can view app settings" 
ON public.app_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage app settings" 
ON public.app_settings 
FOR ALL 
USING (public.is_admin());

-- 21. Insert default app settings
INSERT INTO public.app_settings (key, value, description) VALUES
('hero_title', '"Discover Seychelles"', 'Main hero section title'),
('hero_subtitle', '"Your gateway to local businesses and services"', 'Main hero section subtitle'),
('hero_image', '"hero-seychelles.jpg"', 'Main hero section background image'),
('contact_email', '"info@seychellescompass.com"', 'Contact email address'),
('contact_phone', '"+248 123 4567"', 'Contact phone number'),
('social_facebook', '"https://facebook.com/seychellescompass"', 'Facebook page URL'),
('social_instagram', '"https://instagram.com/seychellescompass"', 'Instagram page URL'),
('google_maps_api_key', '""', 'Google Maps API key for geocoding and maps')
ON CONFLICT (key) DO NOTHING;

-- 22. Create trigger for automatic timestamp updates on app_settings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 23. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
