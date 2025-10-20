-- Business CRUD RLS Policies
-- Enable comprehensive business management with proper security

-- Ensure businesses table has RLS enabled
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can insert their own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can update their own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can delete their own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins can manage all businesses" ON public.businesses;

-- Policy 1: Anyone can view active businesses (public directory)
CREATE POLICY "Public can view active businesses" 
ON public.businesses 
FOR SELECT 
USING (status = 'active');

-- Policy 2: Authenticated users can view their own businesses
CREATE POLICY "Users can view their own businesses" 
ON public.businesses 
FOR SELECT 
USING (auth.uid() = owner_id);

-- Policy 3: Business owners can insert their own businesses
CREATE POLICY "Users can insert their own businesses" 
ON public.businesses 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

-- Policy 4: Business owners can update their own businesses
CREATE POLICY "Users can update their own businesses" 
ON public.businesses 
FOR UPDATE 
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Policy 5: Business owners can delete their own businesses
CREATE POLICY "Users can delete their own businesses" 
ON public.businesses 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Policy 6: Admins can view all businesses
CREATE POLICY "Admins can view all businesses" 
ON public.businesses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Policy 7: Admins can update all businesses
CREATE POLICY "Admins can update all businesses" 
ON public.businesses 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Policy 8: Admins can delete all businesses
CREATE POLICY "Admins can delete all businesses" 
ON public.businesses 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Create business-logos storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('business-logos', 'business-logos', true)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  name = 'business-logos';

-- Storage policies for business logos
CREATE POLICY "Anyone can view business logos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'business-logos');

CREATE POLICY "Authenticated users can upload business logos" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'business-logos' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own business logos" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'business-logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own business logos" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'business-logos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for businesses table
DROP TRIGGER IF EXISTS update_businesses_updated_at ON public.businesses;
CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON public.businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_island ON public.businesses(island);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON public.businesses(created_at);

-- Add verification fields to businesses table if they don't exist
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS verification_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
