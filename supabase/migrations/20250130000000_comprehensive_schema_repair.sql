-- ============================================================================
-- COMPREHENSIVE SCHEMA REPAIR MIGRATION
-- ============================================================================
-- This migration repairs and stabilizes the entire database schema:
-- 1. Fixes profiles table structure (id = auth.uid())
-- 2. Ensures businesses table has all required fields
-- 3. Creates/repairs business_categories many-to-many table
-- 4. Fixes all RLS policies
-- 5. Ensures auth trigger exists
-- 6. Adds updated_at triggers
-- ============================================================================

-- ============================================================================
-- STEP 1: FIX PROFILES TABLE
-- ============================================================================

-- Drop existing profiles table if it has wrong structure
DO $$
BEGIN
    -- Check if profiles table exists with wrong structure (has user_id column)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'user_id'
    ) THEN
        -- Backup data if exists
        CREATE TABLE IF NOT EXISTS profiles_backup AS SELECT * FROM profiles;
        
        -- Drop dependent foreign keys first
        ALTER TABLE businesses DROP CONSTRAINT IF EXISTS fk_businesses_owner_id CASCADE;
        
        -- Drop and recreate with correct structure
        DROP TABLE IF EXISTS profiles CASCADE;
    END IF;
END $$;

-- Create profiles table with correct structure (id = auth.uid())
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'business', 'user')),
    is_admin BOOLEAN DEFAULT FALSE,
    is_business_owner BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- ============================================================================
-- STEP 2: FIX BUSINESSES TABLE
-- ============================================================================

-- Ensure businesses table exists with all required columns
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID, -- Legacy field, kept nullable for backward compatibility
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'closed')),
    phone TEXT,
    email TEXT,
    website TEXT,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add owner_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
    
    -- Add category_id if missing (legacy field)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN category_id UUID;
    END IF;
    
    -- Add status if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
    
    -- Add created_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add updated_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.businesses ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON public.businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_category_id ON public.businesses(category_id);

-- ============================================================================
-- STEP 3: CREATE CATEGORIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(active);
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);

-- ============================================================================
-- STEP 4: CREATE BUSINESS_CATEGORIES MANY-TO-MANY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.business_categories (
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (business_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_business_categories_business ON public.business_categories(business_id);
CREATE INDEX IF NOT EXISTS idx_business_categories_category ON public.business_categories(category_id);

-- ============================================================================
-- STEP 5: FIX PRODUCTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10, 2),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_business_id ON public.products(business_id);

-- ============================================================================
-- STEP 6: FIX REVIEWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON public.reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- ============================================================================
-- STEP 7: ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 8: DROP ALL EXISTING POLICIES (CLEAN SLATE)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can read active businesses" ON public.businesses;
DROP POLICY IF EXISTS "Owners can manage their businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins can manage all businesses" ON public.businesses;
DROP POLICY IF EXISTS "Public can read categories" ON public.categories;
DROP POLICY IF EXISTS "Public can read business_categories" ON public.business_categories;
DROP POLICY IF EXISTS "Owners can manage business_categories" ON public.business_categories;
DROP POLICY IF EXISTS "Public can read products" ON public.products;
DROP POLICY IF EXISTS "Owners can manage products" ON public.products;
DROP POLICY IF EXISTS "Public can read reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can write reviews" ON public.reviews;

-- ============================================================================
-- STEP 9: CREATE CORRECT RLS POLICIES
-- ============================================================================

-- PROFILES POLICIES
CREATE POLICY "Allow self read" ON public.profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Allow self update" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Allow self insert" ON public.profiles
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'admin')
        )
    );

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'admin')
        )
    );

-- BUSINESSES POLICIES
CREATE POLICY "Public read active" ON public.businesses
    FOR SELECT USING (status = 'active');

CREATE POLICY "Owner full access" ON public.businesses
    FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Admins full access" ON public.businesses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'admin')
        )
    );

-- CATEGORIES POLICIES
CREATE POLICY "Public read" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Admins manage" ON public.categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'admin')
        )
    );

-- BUSINESS_CATEGORIES POLICIES
CREATE POLICY "Public read" ON public.business_categories
    FOR SELECT USING (true);

CREATE POLICY "Owner write" ON public.business_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.businesses b 
            WHERE b.id = business_categories.business_id 
            AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Admins manage" ON public.business_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'admin')
        )
    );

-- PRODUCTS POLICIES
CREATE POLICY "Public read" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Business owner write" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.businesses b 
            WHERE b.id = products.business_id 
            AND b.owner_id = auth.uid()
        )
    );

CREATE POLICY "Admins manage" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'admin')
        )
    );

-- REVIEWS POLICIES
CREATE POLICY "Public read" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "User write" ON public.reviews
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins manage" ON public.reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND (is_admin = TRUE OR role = 'admin')
        )
    );

-- ============================================================================
-- STEP 10: CREATE AUTH TRIGGER FUNCTION AND TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
CREATE TRIGGER handle_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 11: CREATE UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 12: ADD UPDATED_AT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS set_timestamp ON public.businesses;
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp ON public.products;
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp ON public.profiles;
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================================
-- STEP 13: ENSURE PROFILES EXIST FOR ALL AUTH USERS
-- ============================================================================

INSERT INTO public.profiles (id, email)
SELECT id, email
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMPLETE
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'User profiles with id matching auth.users(id)';
COMMENT ON TABLE public.businesses IS 'Business listings with owner_id referencing profiles(id)';
COMMENT ON TABLE public.categories IS 'Business categories';
COMMENT ON TABLE public.business_categories IS 'Many-to-many relationship between businesses and categories';
COMMENT ON TABLE public.products IS 'Products offered by businesses';
COMMENT ON TABLE public.reviews IS 'User reviews for businesses';

