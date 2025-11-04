-- Create category-images storage bucket for category images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for category images
-- Anyone can view category images (public bucket)
CREATE POLICY IF NOT EXISTS "Anyone can view category images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'category-images');

-- Admins can upload category images
CREATE POLICY IF NOT EXISTS "Admins can upload category images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'category-images' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (profiles.is_admin = true OR profiles.role = 'admin')
  )
);

-- Admins can update category images
CREATE POLICY IF NOT EXISTS "Admins can update category images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'category-images' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (profiles.is_admin = true OR profiles.role = 'admin')
  )
);

-- Admins can delete category images
CREATE POLICY IF NOT EXISTS "Admins can delete category images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'category-images' AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND (profiles.is_admin = true OR profiles.role = 'admin')
  )
);


