-- Add role and is_active columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing profiles with proper role values based on existing fields
UPDATE public.profiles 
SET role = CASE 
  WHEN is_admin = true THEN 'admin'
  WHEN is_business_owner = true THEN 'business'
  ELSE 'user'
END
WHERE role IS NULL OR role = 'user';

-- Set all existing profiles as active
UPDATE public.profiles SET is_active = true WHERE is_active IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Update RLS policies to use the new role field
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;

-- Recreate policies with role-based access
CREATE POLICY "Admins can view all payments" 
ON public.payments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
  AND profiles.is_active = true
));

CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.user_id = payments.user_id
  AND profiles.is_active = true
));

-- Add RLS policies for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own profile
CREATE POLICY IF NOT EXISTS "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- Policy for admins to view all profiles
CREATE POLICY IF NOT EXISTS "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.role = 'admin'
  AND p.is_active = true
));

-- Policy for admins to update profiles
CREATE POLICY IF NOT EXISTS "Admins can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.role = 'admin'
  AND p.is_active = true
));

-- Policy for users to update their own profile
CREATE POLICY IF NOT EXISTS "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid());
