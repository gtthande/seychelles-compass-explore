-- Add admin INSERT policy for products to ensure admins can write
-- This complements the existing admin UPDATE and DELETE policies

DROP POLICY IF EXISTS "Admins can insert all products" ON public.products;

CREATE POLICY "Admins can insert all products" 
ON public.products 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

