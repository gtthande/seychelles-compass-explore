-- Make business-documents bucket public for form downloads
UPDATE storage.buckets 
SET public = true 
WHERE id = 'business-documents';

-- Create storage policies for business-documents bucket
CREATE POLICY "Business documents are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'business-documents');

-- Create policy to allow authenticated users to upload business documents (for admin use)
CREATE POLICY "Authenticated users can upload business documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'business-documents' AND auth.role() = 'authenticated');