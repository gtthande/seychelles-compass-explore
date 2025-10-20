-- Products Catalog System
-- Comprehensive product management with full-text search and RLS

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  image_url text,
  category text,
  status text DEFAULT 'active',
  searchable boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_products_name 
ON public.products USING gin (to_tsvector('english', name || ' ' || coalesce(description,'')));

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_searchable ON public.products(searchable);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Business owners can view their products" ON public.products;
DROP POLICY IF EXISTS "Business owners can insert their products" ON public.products;
DROP POLICY IF EXISTS "Business owners can update their products" ON public.products;
DROP POLICY IF EXISTS "Business owners can delete their products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;

-- Policy 1: Public can view active, searchable products
CREATE POLICY "Public can view active products" 
ON public.products 
FOR SELECT 
USING (status = 'active' AND searchable = true);

-- Policy 2: Business owners can view their own products
CREATE POLICY "Business owners can view their products" 
ON public.products 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE businesses.id = products.business_id 
    AND businesses.owner_id = auth.uid()
  )
);

-- Policy 3: Business owners can insert products for their businesses
CREATE POLICY "Business owners can insert their products" 
ON public.products 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE businesses.id = products.business_id 
    AND businesses.owner_id = auth.uid()
  )
);

-- Policy 4: Business owners can update their products
CREATE POLICY "Business owners can update their products" 
ON public.products 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE businesses.id = products.business_id 
    AND businesses.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE businesses.id = products.business_id 
    AND businesses.owner_id = auth.uid()
  )
);

-- Policy 5: Business owners can delete their products
CREATE POLICY "Business owners can delete their products" 
ON public.products 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE businesses.id = products.business_id 
    AND businesses.owner_id = auth.uid()
  )
);

-- Policy 6: Admins can view all products
CREATE POLICY "Admins can view all products" 
ON public.products 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Policy 7: Admins can update all products
CREATE POLICY "Admins can update all products" 
ON public.products 
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

-- Policy 8: Admins can delete all products
CREATE POLICY "Admins can delete all products" 
ON public.products 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for products table
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_products_updated_at();

-- Create product-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  name = 'product-images';

-- Storage policies for product images
CREATE POLICY "Anyone can view product images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own product images" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'product-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own product images" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'product-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create function for product search
CREATE OR REPLACE FUNCTION search_products(
  search_term text DEFAULT '',
  category_filter text DEFAULT '',
  price_min decimal DEFAULT NULL,
  price_max decimal DEFAULT NULL,
  business_id_filter uuid DEFAULT NULL,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  business_id uuid,
  name text,
  description text,
  price decimal,
  image_url text,
  category text,
  status text,
  business_name text,
  business_address text,
  business_island text,
  created_at timestamptz,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.business_id,
    p.name,
    p.description,
    p.price,
    p.image_url,
    p.category,
    p.status,
    b.name as business_name,
    b.address as business_address,
    b.island as business_island,
    p.created_at,
    CASE 
      WHEN search_term = '' THEN 1.0
      ELSE ts_rank(
        to_tsvector('english', p.name || ' ' || coalesce(p.description,'')),
        plainto_tsquery('english', search_term)
      )
    END as rank
  FROM public.products p
  JOIN public.businesses b ON p.business_id = b.id
  WHERE 
    p.status = 'active' 
    AND p.searchable = true
    AND b.status = 'active'
    AND (search_term = '' OR to_tsvector('english', p.name || ' ' || coalesce(p.description,'')) @@ plainto_tsquery('english', search_term))
    AND (category_filter = '' OR p.category = category_filter)
    AND (price_min IS NULL OR p.price >= price_min)
    AND (price_max IS NULL OR p.price <= price_max)
    AND (business_id_filter IS NULL OR p.business_id = business_id_filter)
  ORDER BY rank DESC, p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_products TO authenticated;
GRANT EXECUTE ON FUNCTION search_products TO anon;

-- Create function to get product categories
CREATE OR REPLACE FUNCTION get_product_categories()
RETURNS TABLE (
  category text,
  product_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.category,
    COUNT(*) as product_count
  FROM public.products p
  JOIN public.businesses b ON p.business_id = b.id
  WHERE 
    p.status = 'active' 
    AND p.searchable = true
    AND b.status = 'active'
  GROUP BY p.category
  ORDER BY product_count DESC, p.category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_product_categories TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_categories TO anon;

-- Insert sample product categories
INSERT INTO public.products (business_id, name, description, price, category, status, searchable) VALUES
  ((SELECT id FROM public.businesses LIMIT 1), 'Seychelles Island Tour', 'Full day tour of the most beautiful islands in Seychelles', 150.00, 'tours', 'active', true),
  ((SELECT id FROM public.businesses LIMIT 1), 'Snorkeling Equipment', 'Complete snorkeling gear for underwater exploration', 25.00, 'equipment', 'active', true),
  ((SELECT id FROM public.businesses LIMIT 1), 'Traditional Creole Lunch', 'Authentic Seychelles cuisine with local ingredients', 35.00, 'food', 'active', true)
ON CONFLICT DO NOTHING;

