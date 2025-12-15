# Seychelles Compass Explore - Architecture Documentation

## System Overview

Seychelles Compass Explore is a comprehensive business directory platform built with modern web technologies, designed to showcase local businesses and services across the Seychelles islands.

## Technology Stack

### Frontend
- **React 18** - Modern UI library with hooks and functional components
- **TypeScript** - Type-safe JavaScript for better development experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Shadcn/ui** - High-quality React component library
- **React Router** - Client-side routing
- **React Hook Form** - Form handling and validation
- **Zod** - Schema validation

### Backend & Database
- **Supabase** - Backend-as-a-Service providing:
  - PostgreSQL database
  - Authentication system
  - Row Level Security (RLS)
  - Edge Functions
  - Real-time subscriptions
  - File storage

### Deployment & Infrastructure
- **Vercel** - Frontend deployment and hosting
- **GitHub** - Version control and CI/CD
- **Supabase Cloud** - Database and backend services

## Database Schema

### Core Tables

#### `profiles`
User profiles with role-based access control:
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id),
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  business_name TEXT,
  is_business_owner BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'user', -- 'admin', 'business', 'user'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `businesses`
Business listings with comprehensive information:
```sql
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,  -- ✅ Uses 'title' field (NOT 'name')
  description TEXT,
  category TEXT,        -- Text category (legacy)
  category_id UUID,    -- FK to categories (preferred)
  status TEXT DEFAULT 'pending', -- 'active', 'pending', 'suspended', 'closed'
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
  services TEXT[],
  featured BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  logo_url TEXT,
  cover_image_url TEXT,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Important:** The `businesses` table uses `title` field (NOT `name`). See `docs/SCHEMA_ALIGNMENT.md` for details.

#### `products`
Master product catalogue (reusable across businesses):
```sql
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,  -- Product name
  title TEXT,          -- Optional display title
  description TEXT,
  category TEXT,
  category_id UUID,     -- FK to categories
  price NUMERIC(12,2),
  duration TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  searchable BOOLEAN DEFAULT true,
  stock INTEGER,
  status TEXT DEFAULT 'active',
  slug TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Important:** Products are master catalogue items. They are NOT directly linked to businesses. See `business_products` table below.

#### `business_products`
Many-to-many join table linking products to businesses:
```sql
CREATE TABLE public.business_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  product_id UUID REFERENCES products(id),
  title_override TEXT,      -- Optional override for product title
  description_override TEXT, -- Optional override for product description
  price_from NUMERIC(12,2),  -- Business-specific pricing
  price_to NUMERIC(12,2),
  price NUMERIC(12,2),       -- Single price (alternative to price_from/to)
  currency_code TEXT DEFAULT 'SCR',
  duration_minutes INTEGER,
  duration TEXT,             -- Business-specific duration
  is_active BOOLEAN DEFAULT true,
  booking_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(business_id, product_id)  -- Prevents duplicate assignments
);
```

**Important:** Products are linked to businesses via `business_products` join table. This allows:
- One product to be used by multiple businesses
- Business-specific pricing and overrides
- Master product catalogue remains reusable

See `docs/SCHEMA_ALIGNMENT.md` for detailed schema alignment information.