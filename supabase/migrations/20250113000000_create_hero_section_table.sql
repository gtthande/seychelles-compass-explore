-- Create hero_section table
CREATE TABLE IF NOT EXISTS hero_section (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE hero_section ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view hero section" 
ON hero_section FOR SELECT 
USING (true);

CREATE POLICY "Admins can update hero section" 
ON hero_section FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can insert hero section" 
ON hero_section FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true));

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_hero_section_updated_at 
    BEFORE UPDATE ON hero_section 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Ensure public bucket exists for hero images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('public', 'public', true)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  name = 'public';

-- Create RLS policies for public bucket (hero images)
CREATE POLICY "Anyone can view public files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'public');

CREATE POLICY "Admins can upload to public bucket" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'public' AND 
  (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND is_admin = true)));

-- Insert default hero section data
INSERT INTO hero_section (title, subtitle, image_url) 
VALUES (
  'Welcome to iCompass Seychelles',
  'Find trusted businesses, discover local services, and explore everything Seychelles has to offer',
  '/assets/hero-seychelles.jpg'
);
