-- ============================
-- COMPLETE SCHEMA REPAIR - Option A
-- iCompass Seychelles Database Repair
-- ============================
-- 
-- This migration:
-- 1. Drops ONLY affected tables (business_products, products, businesses, categories)
-- 2. Recreates them with the FINAL correct schema
-- 3. Seeds clean test data
-- 4. Applies all RLS policies
--
-- DO NOT touch: profiles, appointments, bookings, reviews, payments, etc.

BEGIN;

-- ============================================================
-- STEP 1: DROP ONLY AFFECTED TABLES
-- ============================================================

-- Drop in reverse dependency order
DROP TABLE IF EXISTS public.business_products CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.businesses CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- ============================================================
-- STEP 2: CREATE CATEGORIES TABLE
-- ============================================================

CREATE TABLE public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    slug text UNIQUE,
    description text,
    image_url text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- STEP 3: CREATE BUSINESSES TABLE
-- ============================================================

CREATE TABLE public.businesses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
    phone text,
    email text,
    website text,
    address text,
    latitude numeric(10, 8),
    longitude numeric(11, 8),
    image_url text,
    hero_image text,
    slug text UNIQUE,
    searchable boolean DEFAULT true,
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- STEP 4: CREATE PRODUCTS TABLE
-- ============================================================

CREATE TABLE public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    price numeric(10,2),
    duration text,
    image_url text,
    searchable boolean DEFAULT true,
    stock integer DEFAULT 0,
    is_active boolean DEFAULT true,
    slug text UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- STEP 5: CREATE BUSINESS_PRODUCTS TABLE
-- ============================================================

CREATE TABLE public.business_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    title_override text,
    description_override text,
    price_override numeric(12,2),
    is_active boolean DEFAULT true,
    featured boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT unique_business_product UNIQUE (business_id, product_id)
);

-- ============================================================
-- STEP 6: CREATE INDEXES
-- ============================================================

CREATE INDEX idx_categories_slug ON public.categories(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_categories_is_active ON public.categories(is_active) WHERE is_active = true;

CREATE INDEX idx_businesses_category_id ON public.businesses(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX idx_businesses_owner_id ON public.businesses(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX idx_businesses_slug ON public.businesses(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_businesses_is_active ON public.businesses(is_active) WHERE is_active = true;
CREATE INDEX idx_businesses_searchable ON public.businesses(searchable) WHERE searchable = true;

CREATE INDEX idx_products_business_id ON public.products(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX idx_products_slug ON public.products(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_products_is_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX idx_products_searchable ON public.products(searchable) WHERE searchable = true;

CREATE INDEX idx_business_products_business_id ON public.business_products(business_id);
CREATE INDEX idx_business_products_product_id ON public.business_products(product_id);
CREATE INDEX idx_business_products_is_active ON public.business_products(is_active) WHERE is_active = true;

-- ============================================================
-- STEP 7: CREATE UPDATED_AT TRIGGERS
-- ============================================================

-- Function for categories
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION update_categories_updated_at();

-- Function for businesses
CREATE OR REPLACE FUNCTION update_businesses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_businesses_updated_at();

-- Function for products
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_products_updated_at();

-- Function for business_products
CREATE OR REPLACE FUNCTION update_business_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_business_products_updated_at
    BEFORE UPDATE ON public.business_products
    FOR EACH ROW
    EXECUTE FUNCTION update_business_products_updated_at();

-- ============================================================
-- STEP 8: ENABLE ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_products ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 9: CREATE RLS POLICIES
-- ============================================================

-- PUBLIC READ ACCESS
CREATE POLICY "Public read categories" ON public.categories
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Public read businesses" ON public.businesses
    FOR SELECT TO anon, authenticated
    USING (is_active = true OR auth.uid() = owner_id);

CREATE POLICY "Public read products" ON public.products
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

CREATE POLICY "Public read business_products" ON public.business_products
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

-- ADMIN FULL ACCESS (service_role)
CREATE POLICY "Admin full categories" ON public.categories
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admin full businesses" ON public.businesses
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admin full products" ON public.products
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Admin full business_products" ON public.business_products
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- OWNER ACCESS (for businesses)
CREATE POLICY "Business owners can manage their businesses" ON public.businesses
    FOR ALL TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- ============================================================
-- STEP 10: SEED CLEAN TEST DATA
-- ============================================================

-- Insert Categories
INSERT INTO public.categories (id, title, slug, description, is_active) VALUES
    (gen_random_uuid(), 'Hotels', 'hotels', 'Hotels and accommodations', true),
    (gen_random_uuid(), 'Tourism', 'tourism', 'Tourism and travel services', true),
    (gen_random_uuid(), 'Services', 'services', 'Various services', true),
    (gen_random_uuid(), 'Education', 'education', 'Educational institutions', true)
ON CONFLICT (slug) DO NOTHING;

-- Get category IDs for businesses
DO $$
DECLARE
    hotels_id uuid;
    tourism_id uuid;
    services_id uuid;
    education_id uuid;
BEGIN
    SELECT id INTO hotels_id FROM public.categories WHERE slug = 'hotels' LIMIT 1;
    SELECT id INTO tourism_id FROM public.categories WHERE slug = 'tourism' LIMIT 1;
    SELECT id INTO services_id FROM public.categories WHERE slug = 'services' LIMIT 1;
    SELECT id INTO education_id FROM public.categories WHERE slug = 'education' LIMIT 1;

    -- Insert Businesses (using title, NOT name)
    INSERT INTO public.businesses (title, description, category_id, phone, email, website, slug, is_active) VALUES
        ('Paradise Resort & Spa', 'Luxury resort with stunning ocean views', hotels_id, '+248 4 123 456', 'info@paradiseresort.sc', 'https://paradiseresort.sc', 'paradise-resort-spa', true),
        ('Seychelles Maritime Academy', 'Maritime education and training', education_id, '+248 4 234 567', 'info@maritime.sc', 'https://maritime.sc', 'seychelles-maritime-academy', true),
        ('Dive Seychelles Underwater Centre', 'Professional diving services', services_id, '+248 4 345 678', 'info@diveseychelles.sc', 'https://diveseychelles.sc', 'dive-seychelles-underwater-centre', true),
        ('Seychelles Adventures Tours', 'Adventure tours and excursions', tourism_id, '+248 4 456 789', 'info@adventures.sc', 'https://adventures.sc', 'seychelles-adventures-tours', true)
    ON CONFLICT (slug) DO NOTHING;
END $$;

-- Insert Products (no categories, linked to businesses)
DO $$
DECLARE
    dive_business_id uuid;
    paradise_business_id uuid;
    adventures_business_id uuid;
BEGIN
    SELECT id INTO dive_business_id FROM public.businesses WHERE slug = 'dive-seychelles-underwater-centre' LIMIT 1;
    SELECT id INTO paradise_business_id FROM public.businesses WHERE slug = 'paradise-resort-spa' LIMIT 1;
    SELECT id INTO adventures_business_id FROM public.businesses WHERE slug = 'seychelles-adventures-tours' LIMIT 1;

    INSERT INTO public.products (business_id, title, description, price, slug, is_active) VALUES
        (dive_business_id, 'Visit 3 beautiful islands with snorkeling and lunch', 'Full day island hopping tour with snorkeling and lunch included', 150.00, 'visit-3-islands-snorkeling', true),
        (paradise_business_id, 'Spacious room with stunning ocean views', 'Luxury room with balcony overlooking the ocean', 250.00, 'spacious-ocean-view-room', true),
        (adventures_business_id, 'Luxury catamaran day trip', 'Full day catamaran trip with lunch and drinks', 200.00, 'luxury-catamaran-day-trip', true)
    ON CONFLICT (slug) DO NOTHING;
END $$;

-- Link businesses to products via business_products
DO $$
DECLARE
    dive_business_id uuid;
    paradise_business_id uuid;
    adventures_business_id uuid;
    dive_product_id uuid;
    paradise_product_id uuid;
    adventures_product_id uuid;
BEGIN
    SELECT id INTO dive_business_id FROM public.businesses WHERE slug = 'dive-seychelles-underwater-centre' LIMIT 1;
    SELECT id INTO paradise_business_id FROM public.businesses WHERE slug = 'paradise-resort-spa' LIMIT 1;
    SELECT id INTO adventures_business_id FROM public.businesses WHERE slug = 'seychelles-adventures-tours' LIMIT 1;
    
    SELECT id INTO dive_product_id FROM public.products WHERE slug = 'visit-3-islands-snorkeling' LIMIT 1;
    SELECT id INTO paradise_product_id FROM public.products WHERE slug = 'spacious-ocean-view-room' LIMIT 1;
    SELECT id INTO adventures_product_id FROM public.products WHERE slug = 'luxury-catamaran-day-trip' LIMIT 1;

    INSERT INTO public.business_products (business_id, product_id, is_active) VALUES
        (dive_business_id, dive_product_id, true),
        (paradise_business_id, paradise_product_id, true),
        (adventures_business_id, adventures_product_id, true)
    ON CONFLICT (business_id, product_id) DO NOTHING;
END $$;

COMMIT;
