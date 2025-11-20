-- Business-Products Many-to-Many Relationship
-- 
-- This migration creates a join table to link products (master catalogue) 
-- to businesses with business-specific pricing, timing, and offers.
--
-- products = master catalogue (no business_id)
-- business_products = business-specific instance with pricing, duration, notes

-- Create business_products join table
CREATE TABLE IF NOT EXISTS public.business_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,

  -- Business-specific overrides
  title_override text,                    -- optional custom title on the business side
  description_override text,              -- optional custom description
  price_from numeric(12,2),               -- minimum price for this product at this business
  price_to numeric(12,2),                 -- optional maximum price
  currency_code text DEFAULT 'SCR',       -- currency code (default SCR)
  duration_minutes integer,               -- duration for this business' version of the product
  is_active boolean DEFAULT true,         -- whether this product is active for this business
  booking_url text,                        -- deep link to booking page if any
  notes text,                              -- conditions / offers / small print

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Ensure one product can only be linked once per business
  CONSTRAINT unique_business_product UNIQUE (business_id, product_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_products_business_id 
  ON public.business_products(business_id);

CREATE INDEX IF NOT EXISTS idx_business_products_product_id 
  ON public.business_products(product_id);

CREATE INDEX IF NOT EXISTS idx_business_products_is_active 
  ON public.business_products(is_active) 
  WHERE is_active = true;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_business_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_business_products_updated_at ON public.business_products;
CREATE TRIGGER update_business_products_updated_at
    BEFORE UPDATE ON public.business_products
    FOR EACH ROW
    EXECUTE FUNCTION update_business_products_updated_at();

-- Enable RLS
ALTER TABLE public.business_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_products

-- Public can view active business_products
DROP POLICY IF EXISTS "Public can view active business_products" ON public.business_products;
CREATE POLICY "Public can view active business_products" 
ON public.business_products 
FOR SELECT 
USING (
  is_active = true AND
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE businesses.id = business_products.business_id 
    AND businesses.status = 'active'
  )
);

-- Business owners can view their own business_products
DROP POLICY IF EXISTS "Business owners can view their business_products" ON public.business_products;
CREATE POLICY "Business owners can view their business_products" 
ON public.business_products 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE businesses.id = business_products.business_id 
    AND businesses.owner_id = auth.uid()
  )
);

-- Business owners can insert business_products for their businesses
DROP POLICY IF EXISTS "Business owners can insert their business_products" ON public.business_products;
CREATE POLICY "Business owners can insert their business_products" 
ON public.business_products 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE businesses.id = business_products.business_id 
    AND businesses.owner_id = auth.uid()
  )
);

-- Business owners can update their business_products
DROP POLICY IF EXISTS "Business owners can update their business_products" ON public.business_products;
CREATE POLICY "Business owners can update their business_products" 
ON public.business_products 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE businesses.id = business_products.business_id 
    AND businesses.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE businesses.id = business_products.business_id 
    AND businesses.owner_id = auth.uid()
  )
);

-- Business owners can delete their business_products
DROP POLICY IF EXISTS "Business owners can delete their business_products" ON public.business_products;
CREATE POLICY "Business owners can delete their business_products" 
ON public.business_products 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE businesses.id = business_products.business_id 
    AND businesses.owner_id = auth.uid()
  )
);

-- Admins can view all business_products
DROP POLICY IF EXISTS "Admins can view all business_products" ON public.business_products;
CREATE POLICY "Admins can view all business_products" 
ON public.business_products 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Admins can insert all business_products
DROP POLICY IF EXISTS "Admins can insert all business_products" ON public.business_products;
CREATE POLICY "Admins can insert all business_products" 
ON public.business_products 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Admins can update all business_products
DROP POLICY IF EXISTS "Admins can update all business_products" ON public.business_products;
CREATE POLICY "Admins can update all business_products" 
ON public.business_products 
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

-- Admins can delete all business_products
DROP POLICY IF EXISTS "Admins can delete all business_products" ON public.business_products;
CREATE POLICY "Admins can delete all business_products" 
ON public.business_products 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Note: We do NOT drop products.business_id column here to preserve data
-- All new queries should use business_products instead
-- Old products.business_id can be migrated later if needed

