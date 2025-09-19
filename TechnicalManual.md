# Technical Manual - Seychelles Business Directory

## Overview
This document provides technical details about the Seychelles Business Directory platform, including database schema, access control, and system architecture.

## Database Schema

### Entity Relationship Diagram (ERD)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   auth.users    │    │    profiles     │    │   businesses    │
│                 │    │                 │    │                 │
│ id (PK)         │◄───┤ user_id (FK)    │◄───┤ owner_id (FK)   │
│ email           │    │ full_name       │    │ name            │
│ encrypted_pwd   │    │ phone           │    │ description     │
│ email_confirmed │    │ avatar_url      │    │ category        │
│ created_at      │    │ business_name   │    │ status          │
│ updated_at      │    │ is_business_owner│    │ phone           │
└─────────────────┘    │ is_admin        │    │ email           │
                       │ role            │    │ website         │
                       │ is_active       │    │ address         │
                       │ created_at      │    │ island          │
                       │ updated_at      │    │ latitude        │
                       └─────────────────┘    │ longitude       │
                                              │ featured        │
                                              │ verified        │
                                              │ created_at      │
                                              │ updated_at      │
                                              └─────────────────┘
                                                       │
                                                       │
                                              ┌─────────────────┐
                                              │    products     │
                                              │                 │
                                              │ id (PK)         │
                                              │ business_id (FK)│
                                              │ name            │
                                              │ description     │
                                              │ category        │
                                              │ price           │
                                              │ currency        │
                                              │ stock_quantity  │
                                              │ status          │
                                              │ featured        │
                                              │ images          │
                                              │ created_at      │
                                              │ updated_at      │
                                              └─────────────────┘
```

### Core Tables

#### `profiles` Table
User profiles and role management system.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | uuid (PK) | Primary key | NOT NULL, DEFAULT gen_random_uuid() |
| user_id | uuid (FK) | References auth.users | NOT NULL, UNIQUE |
| full_name | text | User's full name | |
| phone | text | Contact phone number | |
| avatar_url | text | Profile image URL | |
| business_name | text | Associated business name | |
| is_business_owner | boolean | Business owner status | DEFAULT false |
| is_admin | boolean | Admin privileges | DEFAULT false |
| role | text | User role | DEFAULT 'user' |
| is_active | boolean | Account status | DEFAULT true |
| created_at | timestamptz | Creation timestamp | NOT NULL, DEFAULT now() |
| updated_at | timestamptz | Last update timestamp | NOT NULL, DEFAULT now() |

**Indexes:**
- `idx_profiles_role` on `role` column
- `idx_profiles_is_active` on `is_active` column

#### `businesses` Table
Main business entity storage.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | uuid (PK) | Primary key | NOT NULL, DEFAULT gen_random_uuid() |
| owner_id | uuid (FK) | References profiles.id | NOT NULL |
| name | text | Business name | NOT NULL |
| description | text | Business description | |
| category | business_category | Business category enum | NOT NULL |
| status | business_status | Status enum | DEFAULT 'pending' |
| phone | text | Contact phone | |
| whatsapp | text | WhatsApp number | |
| email | text | Contact email | |
| website | text | Business website | |
| facebook_url | text | Facebook page URL | |
| instagram_url | text | Instagram profile URL | |
| linkedin_url | text | LinkedIn profile URL | |
| youtube_url | text | YouTube channel URL | |
| address | text | Physical address | |
| island | text | Seychelles island | |
| latitude | decimal(10,8) | GPS latitude | |
| longitude | decimal(11,8) | GPS longitude | |
| opening_hours | jsonb | Opening hours configuration | |
| featured | boolean | Featured business flag | DEFAULT false |
| verified | boolean | Verification status | DEFAULT false |
| logo_url | text | Business logo URL | |
| cover_image_url | text | Cover image URL | |
| gallery_images | text[] | Gallery image URLs | |
| average_rating | decimal(3,2) | Average rating | DEFAULT 0 |
| total_reviews | integer | Total review count | DEFAULT 0 |
| created_at | timestamptz | Creation timestamp | NOT NULL, DEFAULT now() |
| updated_at | timestamptz | Last update timestamp | NOT NULL, DEFAULT now() |

#### `products` Table
Product catalog management.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| id | uuid (PK) | Primary key | NOT NULL, DEFAULT gen_random_uuid() |
| business_id | uuid (FK) | References businesses.id | NOT NULL |
| name | text | Product name | NOT NULL |
| description | text | Product description | |
| category | text | Product category | |
| price | decimal(10,2) | Product price | |
| currency | text | Currency code | DEFAULT 'SCR' |
| unit | text | Unit of measurement | |
| sku | text | Stock keeping unit | |
| stock_quantity | integer | Available quantity | DEFAULT 0 |
| in_stock | boolean | Stock status | DEFAULT true |
| status | listing_status | Listing status | DEFAULT 'active' |
| featured | boolean | Featured product flag | DEFAULT false |
| images | text[] | Product image URLs | |
| catalogue_url | text | Product catalog URL | |
| tags | text[] | Product tags | |
| published_at | timestamptz | Publication timestamp | |
| created_at | timestamptz | Creation timestamp | NOT NULL, DEFAULT now() |
| updated_at | timestamptz | Last update timestamp | NOT NULL, DEFAULT now() |

## Role-Based Access Control (RBAC)

### User Roles

#### Admin Role (`role = 'admin'`)
- **Access**: Full system access
- **Routes**: `/admin/*` (all admin routes)
- **Permissions**:
  - Manage all users (create, edit, delete, activate/deactivate)
  - Manage all businesses
  - Manage all products
  - Access system settings
  - View audit logs
  - Manage categories and appointments

#### Business Role (`role = 'business'`)
- **Access**: Business management access
- **Routes**: `/business/*` (business dashboard)
- **Permissions**:
  - Manage own business profile
  - Add/edit/delete own products
  - View own business analytics
  - Update business information and location

#### User Role (`role = 'user'`)
- **Access**: Public access
- **Routes**: `/`, `/directory/*`, `/products/*` (public routes)
- **Permissions**:
  - Browse directory and products
  - Register own business (creates business profile)
  - View business information
  - Contact businesses

### Route Protection

#### Protected Routes
```typescript
// Admin-only routes
<Route path="/admin" element={<RouteGuard requiredRole="admin"><AdminPanel /></RouteGuard>} />
<Route path="/admin/settings" element={<RouteGuard requiredRole="admin"><AdminPanel /></RouteGuard>} />

// Business-only routes
<Route path="/business" element={<RouteGuard requiredRole="business"><BusinessDashboard /></RouteGuard>} />

// Public routes (no protection needed)
<Route path="/directory" element={<Directory />} />
<Route path="/products" element={<Products />} />
```

#### RouteGuard Component
```typescript
interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'business' | 'user';
  requireActive?: boolean;
}
```

### Permission Hierarchy
```
Admin (Level 3)
  ├── Can access all admin features
  ├── Can manage all users and businesses
  └── Can access business dashboard features

Business (Level 2)
  ├── Can access business dashboard
  ├── Can manage own business and products
  └── Can access public features

User (Level 1)
  ├── Can access public features only
  ├── Can register own business
  └── Can browse directory and products
```

### Role-Based Access Flow Diagram
```
┌─────────────────┐
│   User Login    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  Check Profile  │
│  (role, is_active)│
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│  Route Access   │
│  Decision       │
└─────────┬───────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌─────────┐ ┌─────────┐
│  Admin  │ │ Business│
│  Routes │ │ Routes  │
└─────────┘ └─────────┘
    │           │
    ▼           ▼
┌─────────┐ ┌─────────┐
│ User    │ │ Public  │
│ Mgmt    │ │ Routes  │
└─────────┘ └─────────┘
```

## Database Migrations

### Migration: Add Role and Is_Active Fields
```sql
-- File: supabase/migrations/20250119123000_add_role_and_is_active.sql

-- Add new columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing profiles with proper role values
UPDATE public.profiles 
SET role = CASE 
  WHEN is_admin = true THEN 'admin'
  WHEN is_business_owner = true THEN 'business'
  ELSE 'user'
END
WHERE role IS NULL OR role = 'user';

-- Set all existing profiles as active
UPDATE public.profiles SET is_active = true WHERE is_active IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Update RLS policies
-- (Additional RLS policy updates...)
```

## Row Level Security (RLS) Policies

### Profiles Table Policies
```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles p 
  WHERE p.user_id = auth.uid() 
  AND p.role = 'admin'
  AND p.is_active = true
));
```

### Businesses Table Policies
```sql
-- Public can view active businesses
CREATE POLICY "Public can view active businesses" 
ON public.businesses 
FOR SELECT 
USING (status = 'active');

-- Business owners can manage their own businesses
CREATE POLICY "Business owners can manage own businesses" 
ON public.businesses 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.id = businesses.owner_id
  AND profiles.is_active = true
));
```

## API Endpoints

### Authentication Endpoints
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/reset-password` - Password reset

### Business Endpoints
- `GET /api/businesses` - List active businesses
- `POST /api/businesses` - Create business (business role required)
- `PUT /api/businesses/:id` - Update business (owner or admin required)
- `DELETE /api/businesses/:id` - Delete business (owner or admin required)

### User Management Endpoints
- `GET /api/users` - List users (admin required)
- `POST /api/users` - Create user (admin required)
- `PUT /api/users/:id` - Update user (admin required)
- `DELETE /api/users/:id` - Delete user (admin required)

## Security Considerations

### Authentication
- JWT tokens for session management
- Automatic token refresh
- Secure password hashing via Supabase Auth

### Authorization
- Role-based access control
- Route-level protection
- Database-level RLS policies
- API endpoint protection

### Data Protection
- Encrypted data transmission (HTTPS)
- Secure database connections
- Input validation and sanitization
- SQL injection prevention via parameterized queries

## Performance Optimizations

### Database
- Indexed columns for frequently queried fields
- Efficient query patterns
- Connection pooling
- Query result caching

### Frontend
- Component lazy loading
- Image optimization
- Bundle splitting
- CDN for static assets

### Caching Strategy
- Browser caching for static assets
- API response caching
- Database query result caching
- Real-time subscription optimization

## Monitoring and Logging

### Audit Logs
- User actions tracking
- Business modifications logging
- Admin operations recording
- Security event monitoring

### Error Tracking
- Client-side error boundaries
- Server-side error logging
- Performance monitoring
- User experience tracking

## Deployment Architecture

### Frontend (React/Vite)
- Static site generation
- CDN distribution
- Progressive Web App features
- Responsive design

### Backend (Supabase)
- PostgreSQL database
- Real-time subscriptions
- Edge functions
- File storage

### Infrastructure
- Vercel deployment
- Automatic scaling
- Global CDN
- SSL/TLS encryption

---

*Last updated: January 19, 2025*
