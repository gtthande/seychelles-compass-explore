-- Stable Schema Migration
-- Ensures all required tables, columns, and indexes exist
-- Idempotent: safe to run multiple times

DO $$
BEGIN
    -- ============================================================
    -- PROFILES TABLE
    -- ============================================================
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) THEN
        CREATE TABLE public.profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            full_name TEXT,
            email TEXT,
            phone TEXT,
            role TEXT DEFAULT 'user',
            is_admin BOOLEAN DEFAULT false,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created profiles table';
    END IF;

    -- Ensure role column exists
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

    -- ============================================================
    -- BUSINESSES TABLE
    -- ============================================================
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'businesses'
    ) THEN
        CREATE TABLE public.businesses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            owner_id UUID REFERENCES auth.users(id),
            name TEXT NOT NULL,
            description TEXT,
            category TEXT,
            status TEXT DEFAULT 'pending',
            address TEXT,
            latitude NUMERIC(10,8),
            longitude NUMERIC(11,8),
            verification_notes TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created businesses table';
    END IF;

    -- Ensure all required columns exist
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,8);
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS longitude NUMERIC(11,8);
    ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS verification_notes TEXT;

    -- ============================================================
    -- CATEGORIES TABLE
    -- ============================================================
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'categories'
    ) THEN
        CREATE TABLE public.categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created categories table';
    END IF;

    -- ============================================================
    -- BUSINESS_CATEGORIES TABLE (junction table)
    -- ============================================================
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'business_categories'
    ) THEN
        CREATE TABLE public.business_categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
            category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(business_id, category_id)
        );
        RAISE NOTICE 'Created business_categories table';
    END IF;

    -- ============================================================
    -- PRODUCTS TABLE
    -- ============================================================
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'products'
    ) THEN
        CREATE TABLE public.products (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            price NUMERIC(10,2),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        RAISE NOTICE 'Created products table';
    END IF;

    -- ============================================================
    -- INDEXES
    -- ============================================================
    
    -- Profiles indexes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'profiles' AND indexname = 'profiles_email_idx'
    ) THEN
        CREATE INDEX profiles_email_idx ON public.profiles(email);
        RAISE NOTICE 'Created profiles_email_idx';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'profiles' AND indexname = 'profiles_user_id_idx'
    ) THEN
        CREATE INDEX profiles_user_id_idx ON public.profiles(user_id);
        RAISE NOTICE 'Created profiles_user_id_idx';
    END IF;

    -- Businesses indexes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'businesses' AND indexname = 'businesses_category_idx'
    ) THEN
        CREATE INDEX businesses_category_idx ON public.businesses(category);
        RAISE NOTICE 'Created businesses_category_idx';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'businesses' AND indexname = 'businesses_status_idx'
    ) THEN
        CREATE INDEX businesses_status_idx ON public.businesses(status);
        RAISE NOTICE 'Created businesses_status_idx';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'businesses' AND indexname = 'businesses_owner_id_idx'
    ) THEN
        CREATE INDEX businesses_owner_id_idx ON public.businesses(owner_id);
        RAISE NOTICE 'Created businesses_owner_id_idx';
    END IF;

    -- Products indexes
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = 'products' AND indexname = 'products_business_id_idx'
    ) THEN
        CREATE INDEX products_business_id_idx ON public.products(business_id);
        RAISE NOTICE 'Created products_business_id_idx';
    END IF;

    RAISE NOTICE 'Stable schema migration complete - all tables, columns, and indexes verified';
END $$;

