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
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'active', 'pending', 'suspended'
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