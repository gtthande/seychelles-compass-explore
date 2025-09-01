-- Create enum types for business categories and status
CREATE TYPE business_category AS ENUM (
  'restaurants', 'hotels', 'tourism', 'retail', 'services', 'entertainment',
  'health', 'education', 'finance', 'transport', 'real_estate', 'technology'
);

CREATE TYPE business_status AS ENUM ('active', 'pending', 'suspended', 'closed');
CREATE TYPE listing_status AS ENUM ('active', 'draft', 'pending', 'expired');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  business_name TEXT,
  is_business_owner BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create businesses table
CREATE TABLE public.businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category business_category NOT NULL,
  status business_status DEFAULT 'pending',
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  youtube_url TEXT,
  address TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  island TEXT,
  opening_hours JSONB,
  featured BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  logo_url TEXT,
  cover_image_url TEXT,
  gallery_images TEXT[],
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'SCR',
  category TEXT,
  images TEXT[],
  in_stock BOOLEAN DEFAULT true,
  stock_quantity INTEGER,
  featured BOOLEAN DEFAULT false,
  status listing_status DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table for accommodations and tours
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL, -- 'accommodation', 'tour', 'rental'
  check_in_date DATE,
  check_out_date DATE,
  guests INTEGER DEFAULT 1,
  total_price DECIMAL(10,2),
  currency TEXT DEFAULT 'SCR',
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
  booking_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for businesses
CREATE POLICY "Anyone can view active businesses" ON public.businesses FOR SELECT USING (status = 'active');
CREATE POLICY "Business owners can manage their businesses" ON public.businesses FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = owner_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage all businesses" ON public.businesses FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true)
);

-- RLS Policies for products
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (
  status = 'active' AND EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND status = 'active')
);
CREATE POLICY "Business owners can manage their products" ON public.products FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.businesses b 
    JOIN public.profiles p ON b.owner_id = p.id 
    WHERE b.id = business_id AND p.user_id = auth.uid()
  )
);

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND user_id = auth.uid())
);
CREATE POLICY "Business owners can view bookings for their business" ON public.bookings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.businesses b 
    JOIN public.profiles p ON b.owner_id = p.id 
    WHERE b.id = business_id AND p.user_id = auth.uid()
  )
);

-- RLS Policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" ON public.reviews FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update their own reviews" ON public.reviews FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND user_id = auth.uid())
);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_businesses_category ON public.businesses(category);
CREATE INDEX idx_businesses_status ON public.businesses(status);
CREATE INDEX idx_businesses_location ON public.businesses(latitude, longitude);
CREATE INDEX idx_products_business_id ON public.products(business_id);
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_business_id ON public.bookings(business_id);
CREATE INDEX idx_reviews_business_id ON public.reviews(business_id);