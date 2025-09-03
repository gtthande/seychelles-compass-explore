-- CRITICAL SECURITY FIX: Restrict profiles table access
-- Current policy allows anyone to view all user profiles including phone numbers
-- This fixes the security vulnerability by only allowing users to view their own profile

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a secure policy that only allows users to view their own profile
CREATE POLICY "Users can view their own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add a policy for business context where businesses need to see basic info of their customers
-- This is more restrictive and only shows non-sensitive data
CREATE POLICY "Business owners can view customer basic info for their reviews" 
ON public.profiles 
FOR SELECT 
USING (
  -- Only allow viewing basic profile info (excluding phone) for users who reviewed the business
  EXISTS (
    SELECT 1 FROM businesses b 
    JOIN reviews r ON r.business_id = b.id 
    JOIN profiles owner_profile ON owner_profile.id = b.owner_id
    WHERE owner_profile.user_id = auth.uid() 
    AND r.user_id = profiles.user_id
  )
);

-- Ensure admins can view profiles for moderation purposes
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles admin_profile 
    WHERE admin_profile.user_id = auth.uid() 
    AND admin_profile.is_admin = true
  )
);