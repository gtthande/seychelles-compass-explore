-- Ensure RLS policies for profiles table allow authenticated users to create their own profile
-- This migration ensures 100% reliability for profile creation

-- Step 1: Ensure profiles table has required columns
DO $$ 
BEGIN
  -- Add is_admin if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
  
  -- Add user_id if missing (for backward compatibility)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN user_id UUID;
    -- Set user_id = id for existing rows where user_id is NULL
    UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;
  END IF;
  
  -- Ensure is_active exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Step 2: Drop existing INSERT policy if it exists (to recreate with better conditions)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Step 3: Create comprehensive INSERT policy that works with both id and user_id schemas
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT 
  WITH CHECK (
    -- Allow if id matches auth.uid() (newer schema)
    (id = auth.uid()) OR
    -- Allow if user_id matches auth.uid() (older schema)
    (user_id = auth.uid()) OR
    -- Allow if both id and user_id are set to auth.uid() (schema-compatible)
    (id = auth.uid() AND user_id = auth.uid())
  );

-- Step 4: Ensure SELECT policy works with both schemas
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT 
  USING (
    (id = auth.uid()) OR (user_id = auth.uid())
  );

-- Step 5: Ensure UPDATE policy works with both schemas
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE 
  USING (
    (id = auth.uid()) OR (user_id = auth.uid())
  );

-- Step 6: Ensure admin policies exist and work correctly
-- Drop and recreate admin SELECT policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE (profiles.id = auth.uid() OR profiles.user_id = auth.uid())
      AND (role = 'admin' OR is_admin = true)
    )
  );

-- Drop and recreate admin UPDATE policy
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE (profiles.id = auth.uid() OR profiles.user_id = auth.uid())
      AND (role = 'admin' OR is_admin = true)
    )
  );

-- Step 7: Add comments for clarity
COMMENT ON POLICY "Users can insert their own profile" ON public.profiles IS 
  'Allows authenticated users to create their own profile. Works with both id and user_id schemas.';

COMMENT ON POLICY "Users can view their own profile" ON public.profiles IS 
  'Allows users to view their own profile. Works with both id and user_id schemas.';

COMMENT ON POLICY "Users can update their own profile" ON public.profiles IS 
  'Allows users to update their own profile. Works with both id and user_id schemas.';

-- Step 8: Create indexes for performance (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id) WHERE id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role) WHERE role IS NOT NULL;

