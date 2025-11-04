-- Create review-images storage bucket for review photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for review images
-- Anyone can view review images (public bucket)
CREATE POLICY IF NOT EXISTS "Anyone can view review images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'review-images');

-- Authenticated users can upload review images
CREATE POLICY IF NOT EXISTS "Users can upload review images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'review-images' AND
  auth.uid() IS NOT NULL
);

-- Users can update their own review images
CREATE POLICY IF NOT EXISTS "Users can update their own review images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'review-images' AND
  auth.uid() IS NOT NULL
);

-- Users can delete their own review images
CREATE POLICY IF NOT EXISTS "Users can delete their own review images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'review-images' AND
  auth.uid() IS NOT NULL
);

-- Create avatars storage bucket for user profile pictures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
-- Anyone can view avatars (public bucket)
CREATE POLICY IF NOT EXISTS "Anyone can view avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar
CREATE POLICY IF NOT EXISTS "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid() IS NOT NULL
);

-- Users can update their own avatar
CREATE POLICY IF NOT EXISTS "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' AND
  auth.uid() IS NOT NULL
);

-- Users can delete their own avatar
CREATE POLICY IF NOT EXISTS "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' AND
  auth.uid() IS NOT NULL
);

