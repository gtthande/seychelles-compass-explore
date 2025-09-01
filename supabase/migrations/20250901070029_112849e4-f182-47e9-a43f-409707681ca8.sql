-- Create storage buckets for business documents and product images
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('business-documents', 'business-documents', false),
  ('business-logos', 'business-logos', true),
  ('business-covers', 'business-covers', true),
  ('product-images', 'product-images', true),
  ('product-catalogues', 'product-catalogues', false);

-- Create storage policies for business documents
CREATE POLICY "Business owners can upload their documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'business-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Business owners can view their documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'business-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for business logos  
CREATE POLICY "Anyone can view business logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'business-logos');

CREATE POLICY "Business owners can upload their logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'business-logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Business owners can update their logos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'business-logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for business covers
CREATE POLICY "Anyone can view business covers" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'business-covers');

CREATE POLICY "Business owners can upload their covers" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'business-covers' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Business owners can update their covers" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'business-covers' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for product images
CREATE POLICY "Anyone can view product images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Business owners can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' AND 
  EXISTS (
    SELECT 1 FROM businesses b
    JOIN profiles p ON b.owner_id = p.id
    WHERE p.user_id = auth.uid()
    AND b.id::text = (storage.foldername(name))[1]
  )
);

-- Create storage policies for product catalogues
CREATE POLICY "Business owners can upload product catalogues" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'product-catalogues' AND 
  EXISTS (
    SELECT 1 FROM businesses b
    JOIN profiles p ON b.owner_id = p.id
    WHERE p.user_id = auth.uid()
    AND b.id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Business owners can view their catalogues" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'product-catalogues' AND 
  EXISTS (
    SELECT 1 FROM businesses b
    JOIN profiles p ON b.owner_id = p.id
    WHERE p.user_id = auth.uid()
    AND b.id::text = (storage.foldername(name))[1]
  )
);

-- Add catalogue_url field to products table
ALTER TABLE products ADD COLUMN catalogue_url TEXT;

-- Add services field to businesses table for service listings
ALTER TABLE businesses ADD COLUMN services TEXT[];