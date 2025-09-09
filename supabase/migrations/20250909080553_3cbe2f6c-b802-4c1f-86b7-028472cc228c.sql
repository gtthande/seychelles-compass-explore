-- Create categories table for admin management
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Anyone can view active categories" 
ON public.categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all categories" 
ON public.categories 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_admin = true
));

-- Create trigger for updating timestamps
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default categories
INSERT INTO public.categories (name, description, slug) VALUES
('Food & Beverages', 'Restaurants, cafes, bars, and food services', 'food'),
('Accommodation', 'Hotels, resorts, guest houses, and lodging', 'accommodation'),
('Tours & Activities', 'Guided tours, excursions, and recreational activities', 'tours'),
('Transportation', 'Car rentals, transfers, and transport services', 'transport'),
('Retail Products', 'Shopping, souvenirs, and retail goods', 'retail'),
('Services', 'Professional and personal services', 'services'),
('Entertainment', 'Shows, events, and entertainment venues', 'entertainment'),
('Health & Wellness', 'Spas, fitness, and wellness services', 'wellness');

-- Update existing products to use category slugs instead of old values
UPDATE public.products 
SET category = 'accommodation' 
WHERE category IN ('accommodation');

UPDATE public.products 
SET category = 'tours' 
WHERE category IN ('tours');

UPDATE public.products 
SET category = 'food' 
WHERE category IN ('food', 'restaurant', 'cafe');

UPDATE public.products 
SET category = 'transport' 
WHERE category IN ('transport', 'transportation');

UPDATE public.products 
SET category = 'retail' 
WHERE category IN ('retail', 'shopping');

UPDATE public.products 
SET category = 'services' 
WHERE category IN ('services', 'service');

UPDATE public.products 
SET category = 'entertainment' 
WHERE category IN ('entertainment');

-- Add foreign key constraint to products table
ALTER TABLE public.products 
ADD CONSTRAINT fk_products_category 
FOREIGN KEY (category) REFERENCES public.categories(slug) 
ON DELETE SET NULL;