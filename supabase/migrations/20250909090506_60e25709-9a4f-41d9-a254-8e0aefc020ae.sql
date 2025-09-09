-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  linkedin_url TEXT,
  youtube_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  preferred_date TIMESTAMP WITH TIME ZONE,
  preferred_time TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for appointments
CREATE POLICY "Anyone can create appointment requests" 
ON public.appointments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all appointments" 
ON public.appointments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_admin = true
));

CREATE POLICY "Admins can update appointments" 
ON public.appointments 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_admin = true
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for business documents (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('business-documents', 'business-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for business documents
CREATE POLICY "Public can view business documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'business-documents');

CREATE POLICY "Admins can upload business documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'business-documents' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);