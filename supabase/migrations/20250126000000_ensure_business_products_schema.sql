-- Ensure business_products table exists with required schema
-- This migration ensures the table has the exact fields specified:
-- price (numeric), duration (text), notes (text), overrides (jsonb)
-- Also maintains backward compatibility with existing fields

-- Create table if it doesn't exist with the exact schema specified
CREATE TABLE IF NOT EXISTS public.business_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price numeric,
  duration text,
  notes text,
  is_active boolean DEFAULT true,
  overrides jsonb DEFAULT '{}'::jsonb,
  created_at timestamp DEFAULT now(),
  -- Backward compatibility: ensure unique constraint
  CONSTRAINT unique_business_product UNIQUE (business_id, product_id)
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
    -- Add price column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_products' 
        AND column_name = 'price'
    ) THEN
        ALTER TABLE public.business_products ADD COLUMN price numeric;
    END IF;

    -- Add duration column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_products' 
        AND column_name = 'duration'
    ) THEN
        ALTER TABLE public.business_products ADD COLUMN duration text;
    END IF;

    -- Add notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_products' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE public.business_products ADD COLUMN notes text;
    END IF;

    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_products' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.business_products ADD COLUMN is_active boolean DEFAULT true;
    END IF;

    -- Add overrides column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_products' 
        AND column_name = 'overrides'
    ) THEN
        ALTER TABLE public.business_products ADD COLUMN overrides jsonb DEFAULT '{}'::jsonb;
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'business_products' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.business_products ADD COLUMN created_at timestamp DEFAULT now();
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bp_business ON public.business_products(business_id);
CREATE INDEX IF NOT EXISTS idx_bp_product ON public.business_products(product_id);
CREATE INDEX IF NOT EXISTS idx_bp_is_active ON public.business_products(is_active) WHERE is_active = true;

-- Ensure unique constraint exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_business_product'
    ) THEN
        ALTER TABLE public.business_products 
        ADD CONSTRAINT unique_business_product UNIQUE (business_id, product_id);
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.business_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_products
-- Drop existing policies and recreate to ensure they're correct

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

