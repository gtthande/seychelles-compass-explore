-- Fix Admin RLS Schema Mismatch
-- Issue: is_admin_user() and some policies use profiles.user_id but schema uses profiles.id
-- This migration fixes the schema mismatch to ensure admin access works correctly

-- Fix 1: Update is_admin_user() function to use correct schema (id not user_id)
CREATE OR REPLACE FUNCTION public.is_admin_user(uid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE 
  admin_check BOOLEAN;
BEGIN
  -- Use profiles.id (primary key) which matches auth.uid()
  SELECT (role = 'admin' OR is_admin = true) INTO admin_check
  FROM public.profiles 
  WHERE profiles.id = uid;
  RETURN COALESCE(admin_check, false);
END;
$$;

-- Fix 2: Update business policies that incorrectly reference profiles.user_id
-- Since businesses.owner_id references profiles.id (which equals auth.uid()), we can simplify
-- Policy 3: Users can read their own businesses
DROP POLICY IF EXISTS "Users can read their own businesses" ON public.businesses;
CREATE POLICY "Users can read their own businesses"
ON public.businesses
FOR SELECT
TO authenticated
USING (
  businesses.owner_id = auth.uid()  -- Simplified: owner_id directly references profiles.id = auth.uid()
);

-- Policy 5: Users can update their own businesses
DROP POLICY IF EXISTS "Users can update their own businesses" ON public.businesses;
CREATE POLICY "Users can update their own businesses"
ON public.businesses
FOR UPDATE
TO authenticated
USING (
  businesses.owner_id = auth.uid()  -- Simplified: owner_id directly references profiles.id = auth.uid()
)
WITH CHECK (
  businesses.owner_id = auth.uid()  -- Simplified: owner_id directly references profiles.id = auth.uid()
  -- Prevent users from changing status to active
  AND (status = OLD.status OR status IN ('pending', 'draft'))
);

-- Policy 7: Users can insert businesses
DROP POLICY IF EXISTS "Users can insert businesses" ON public.businesses;
CREATE POLICY "Users can insert businesses"
ON public.businesses
FOR INSERT
TO authenticated
WITH CHECK (
  businesses.owner_id = auth.uid()  -- Simplified: owner_id directly references profiles.id = auth.uid()
  -- Ensure new businesses are not immediately active unless admin
  AND (
    (SELECT public.is_admin_user(auth.uid())) = true
    OR status IN ('pending', 'draft')
  )
);

-- Fix 3: Ensure admin policies work with both role='admin' and is_admin=true
-- The is_admin_user() function already checks both, but verify admin policies are correct
-- (Admin policies already use is_admin_user() which we fixed above)

-- Add comment for clarity
COMMENT ON FUNCTION public.is_admin_user(UUID) IS 
  'Checks if user is admin by matching profiles.id (primary key) with auth.uid(). Returns true if role=admin OR is_admin=true.';

