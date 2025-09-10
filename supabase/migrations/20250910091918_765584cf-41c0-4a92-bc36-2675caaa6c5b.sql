-- Fix infinite recursion in profiles policies by creating security definer functions
-- First drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Business owners can view customer basic info for their reviews" ON public.profiles;

-- Create security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
  );
$$;

-- Create security definer function to check if user is business owner for reviews
CREATE OR REPLACE FUNCTION public.can_view_review_profile(target_user_id UUID)
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM businesses b
    JOIN reviews r ON r.business_id = b.id
    JOIN auth.users u ON u.id = b.owner_id
    WHERE u.id = auth.uid() 
    AND r.user_id = target_user_id
  );
$$;

-- Recreate policies with security definer functions
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Business owners can view customer basic info for their reviews" 
ON public.profiles 
FOR SELECT 
USING (public.can_view_review_profile(user_id));