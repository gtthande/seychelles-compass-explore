-- Comprehensive fix for profile schema and admin access
-- This migration ensures the profiles table has all necessary columns and correct RLS policies

-- Step 1: Ensure profiles table has all required columns
-- Add is_admin column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add user_id column if it doesn't exist (for backward compatibility)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'user_id'
  ) THEN
    -- If id is the primary key referencing auth.users, user_id should match it
    ALTER TABLE public.profiles ADD COLUMN user_id UUID;
    -- Set user_id = id for existing rows
    UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;
    -- Add foreign key constraint if id doesn't already reference auth.users
    -- (This is safe - if id already references auth.users, this will be a no-op)
  END IF;
END $$;

-- Step 2: Ensure id column exists and references auth.users
-- If id doesn't exist, create it
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'id'
  ) THEN
    -- If user_id exists, use it as id
    ALTER TABLE public.profiles ADD COLUMN id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE;
    UPDATE public.profiles SET id = user_id WHERE id IS NULL;
  END IF;
END $$;

-- Step 3: Update is_admin_user() function to check both id and user_id
CREATE OR REPLACE FUNCTION public.is_admin_user(uid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE 
  admin_check BOOLEAN;
BEGIN
  -- Check both id and user_id columns (for schema compatibility)
  SELECT (role = 'admin' OR COALESCE(is_admin, false) = true) INTO admin_check
  FROM public.profiles 
  WHERE (profiles.id = uid OR profiles.user_id = uid);
  RETURN COALESCE(admin_check, false);
END;
$$;

-- Step 4: Ensure RLS policies work with both id and user_id
-- Drop and recreate SELECT policy to handle both schemas
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT 
  USING (
    id = auth.uid() OR user_id = auth.uid()
  );

-- Drop and recreate UPDATE policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE 
  USING (
    id = auth.uid() OR user_id = auth.uid()
  );

-- Drop and recreate INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT 
  WITH CHECK (
    id = auth.uid() OR user_id = auth.uid()
  );

-- Step 5: Update admin policies to use the fixed is_admin_user() function
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT 
  USING (
    (SELECT public.is_admin_user(auth.uid()))
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE 
  USING (
    (SELECT public.is_admin_user(auth.uid()))
  );

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Add comments
COMMENT ON FUNCTION public.is_admin_user(UUID) IS 
  'Checks if user is admin by matching profiles.id or profiles.user_id with auth.uid(). Returns true if role=admin OR is_admin=true.';

COMMENT ON COLUMN public.profiles.id IS 
  'Primary key that references auth.users.id. Should match auth.uid() for RLS policies.';

COMMENT ON COLUMN public.profiles.user_id IS 
  'Foreign key to auth.users.id. For backward compatibility. Should match id if both exist.';

COMMENT ON COLUMN public.profiles.is_admin IS 
  'Boolean flag indicating admin status. Can be used alongside role=''admin''.';

