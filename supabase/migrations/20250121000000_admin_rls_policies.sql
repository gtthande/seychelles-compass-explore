-- Admin RLS Policies for Business Directory
-- This migration sets up Row Level Security policies for admin access

-- Create helper function to check if user is admin
-- This is more efficient than checking in every policy
CREATE OR REPLACE FUNCTION public.is_admin_user(uid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE 
  is_admin BOOLEAN;
BEGIN
  SELECT profiles.is_admin INTO is_admin 
  FROM public.profiles 
  WHERE profiles.user_id = uid;
  RETURN COALESCE(is_admin, false);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO anon;

-- Enable RLS on businesses table if not already enabled
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for clean migration)
DROP POLICY IF EXISTS "Admin can read all businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admin can update businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admin can delete businesses" ON public.businesses;
DROP POLICY IF EXISTS "Public can read approved businesses" ON public.businesses;
DROP POLICY IF EXISTS "Public can read active businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can read their own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own businesses" ON public.businesses;

-- Policy 1: Admins can read ALL businesses (including pending)
CREATE POLICY "Admin can read all businesses"
ON public.businesses
FOR SELECT
TO authenticated
USING (
  (SELECT public.is_admin_user(auth.uid()))
);

-- Policy 2: Public and authenticated users can read only active businesses
CREATE POLICY "Public can read active businesses"
ON public.businesses
FOR SELECT
TO authenticated, anon
USING (
  status = 'active'
);

-- Policy 3: Users can read their own businesses (regardless of status)
CREATE POLICY "Users can read their own businesses"
ON public.businesses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = businesses.owner_id
    AND profiles.user_id = auth.uid()
  )
);

-- Policy 4: Admins can update any business
CREATE POLICY "Admin can update businesses"
ON public.businesses
FOR UPDATE
TO authenticated
USING (
  (SELECT public.is_admin_user(auth.uid()))
)
WITH CHECK (
  (SELECT public.is_admin_user(auth.uid()))
);

-- Policy 5: Users can update their own businesses (but cannot change status to active)
CREATE POLICY "Users can update their own businesses"
ON public.businesses
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = businesses.owner_id
    AND profiles.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = businesses.owner_id
    AND profiles.user_id = auth.uid()
  )
  -- Prevent users from changing status to active
  AND (status = OLD.status OR status IN ('pending', 'draft'))
);

-- Policy 6: Admins can delete businesses
CREATE POLICY "Admin can delete businesses"
ON public.businesses
FOR DELETE
TO authenticated
USING (
  (SELECT public.is_admin_user(auth.uid()))
);

-- Policy 7: Authenticated users can insert businesses (status will be set to pending)
CREATE POLICY "Users can insert businesses"
ON public.businesses
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = businesses.owner_id
    AND profiles.user_id = auth.uid()
  )
  -- Ensure new businesses are not immediately active unless admin
  AND (
    (SELECT public.is_admin_user(auth.uid())) = true
    OR status IN ('pending', 'draft')
  )
);

-- Create index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_businesses_status ON public.businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses(category);

-- Add comment explaining the policies
COMMENT ON FUNCTION public.is_admin_user(UUID) IS 'Helper function to check if a user is an admin. Uses SECURITY DEFINER for efficiency.';
COMMENT ON POLICY "Admin can read all businesses" ON public.businesses IS 'Allows admins to see all businesses including pending ones';
COMMENT ON POLICY "Public can read active businesses" ON public.businesses IS 'Allows public and authenticated users to see only active businesses';
COMMENT ON POLICY "Users can read their own businesses" ON public.businesses IS 'Allows users to see their own businesses regardless of status';

