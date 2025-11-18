-- Add missing INSERT policy for profiles table
-- This allows users to create their own profile if it doesn't exist

-- Drop existing policy if it exists (for clean migration)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create INSERT policy for users to create their own profile
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Also ensure the policy allows inserting with the correct structure
-- Users can insert profiles with their own user ID as the primary key
COMMENT ON POLICY "Users can insert their own profile" ON public.profiles IS 
  'Allows authenticated users to create their own profile with id matching their auth.uid()';

