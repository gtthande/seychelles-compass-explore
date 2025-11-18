/**
 * Direct profile creation script
 * Run this in Supabase SQL Editor or via Node.js to create a profile for a user
 * 
 * Usage in Supabase SQL Editor:
 * 1. Replace 'USER_EMAIL_HERE' with your actual email
 * 2. Run the query
 */

-- First, get your user ID from auth.users
-- Replace 'your-email@example.com' with your actual email
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then create the profile (replace USER_ID_HERE with the ID from above)
INSERT INTO public.profiles (id, email, role, is_active)
VALUES (
  'USER_ID_HERE',  -- Replace with your user ID from auth.users
  'your-email@example.com',  -- Replace with your email
  'user',  -- or 'admin' if you need admin access
  true
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Verify the profile was created
SELECT * FROM public.profiles WHERE email = 'your-email@example.com';

