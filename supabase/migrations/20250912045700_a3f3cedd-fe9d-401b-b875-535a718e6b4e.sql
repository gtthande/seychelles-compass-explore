-- Ensure business-documents bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('business-documents', 'business-documents', true)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  name = 'business-documents';

-- Create RLS policies for business-documents bucket
CREATE POLICY "Anyone can view business documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'business-documents');

CREATE POLICY "Admins can upload business documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'business-documents' AND 
  (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true)));

-- Fix appointments table validation - ensure email can be null properly
ALTER TABLE appointments ALTER COLUMN email DROP NOT NULL;