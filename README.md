# iCompass Seychelles

> A modern business directory platform for the beautiful islands of Seychelles, featuring comprehensive business listings, product catalogs, and seamless business-product linking.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Architecture](#architecture)
- [Environment Variables](#environment-variables)
- [Setup Instructions](#setup-instructions)
- [Database Schema](#database-schema)
- [Running Migrations](#running-migrations)
- [Development Commands](#development-commands)
- [Deployment Notes](#deployment-notes)
- [Troubleshooting](#troubleshooting)
- [Changelog](#changelog)

---

## 🎯 Project Overview

**iCompass Seychelles** is a comprehensive business directory platform designed to showcase businesses across the Seychelles archipelago. The platform enables businesses to manage their listings, link products to their profiles, and provides visitors with powerful search and discovery tools.

### Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **State Management:** React Query (TanStack Query)
- **Maps:** Google Maps API (with OpenStreetMap fallback)

### Current State

The project has undergone a **major schema alignment and cleanup** (December 2025), resulting in:

- ✅ Unified Products Schema aligned with TypeScript interfaces
- ✅ Clean business-product linking model via `business_products` join table
- ✅ Removed deprecated fields (`name`, `category`, `images[]`, `status`)
- ✅ Fixed schema inconsistencies and typos
- ✅ Stable RLS (Row Level Security) policies
- ✅ Production-ready database structure

---

## ✨ Features

### Core Functionality

- **� directory Search** - Advanced search with island filters, category filtering, and real-time results
- **🏝️ Island Filters** - Filter businesses by Seychelles islands (Mahé, Praslin, La Digue, etc.)
- **📦 Product Management** - Master product catalog with business-specific linking
- **🔗 Business-Product Linking** - Many-to-many relationship allowing businesses to link products with custom pricing
- **👤 Admin Panel** - Complete administrative dashboard for managing businesses, products, and users
- **🏢 Business Portal** - Self-service dashboard for business owners
- **🔒 Security** - Supabase RLS (Row Level Security) ensuring data protection
- **🖼️ Image Management** - Single `image_url` field (TEXT) for product images
- **🔍 Searchable Fields** - Full-text search on products with `searchable` flag
- **📱 Responsive Design** - Mobile-optimized UI with modern UX patterns

### Technical Features

- **Type Safety** - Full TypeScript coverage with generated Supabase types
- **Performance** - Optimized queries with proper indexing
- **Real-time Updates** - Live counters and statistics
- **Error Handling** - Comprehensive error boundaries and user feedback
- **Accessibility** - WCAG-compliant components via Radix UI

---

## 🏗️ Architecture

### Frontend Structure

```
src/
├── components/          # React components
│   ├── admin/         # Admin panel components
│   ├── business/      # Business portal components
│   ├── products/      # Product-related components
│   └── ui/            # shadcn/ui base components
├── pages/             # Route components (React Router)
│   ├── admin/        # Admin pages
│   └── api/          # API route handlers
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and API helpers
│   ├── api/          # API route handlers
│   └── *.ts          # Business logic utilities
├── types/             # TypeScript type definitions
│   ├── product.ts    # Product interface (unified schema)
│   └── business.ts   # Business interface
├── integrations/      # External service integrations
│   └── supabase/     # Supabase client configuration
└── utils/             # Helper utilities
```

### Data Layer

**Supabase (PostgreSQL)** provides:

- **Authentication** - Email/password + OAuth providers
- **Database** - PostgreSQL with RLS policies
- **Storage** - File uploads (images, documents)
- **Real-time** - Live subscriptions (optional)

### Unified Products Schema

The products system uses a **two-table model**:

1. **`products`** - Master product catalog
   - Contains: `id`, `title`, `description`, `price`, `duration`, `image_url`, `is_active`, `searchable`, `stock`, `slug`
   - No business-specific data (shared catalog)

2. **`business_products`** - Business-product linking table
   - Contains: `id`, `business_id`, `product_id`, `price_override`, `title_override`, `description_override`, `is_active`
   - Allows businesses to link products with custom pricing/descriptions

### Business-Product Join Model

```
products (master catalog)
    ↓
business_products (join table)
    ↓
businesses (business profiles)
```

**Benefits:**
- Products can be reused across multiple businesses
- Businesses can override pricing/descriptions per product
- Centralized product management
- Flexible pricing model

---

## 🔐 Environment Variables

Create a `.env` file in the project root (use `env.example` as a template):

### Required Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://bwlmlniotyrjttglbjrl.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Site Configuration
VITE_SITE_URL=http://localhost:5173
```

### Optional Variables

```bash
# Google Maps API (for maps and geocoding)
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

### Getting Your API Keys

1. **Supabase Keys:**
   - Navigate to: `https://supabase.com/dashboard/project/[PROJECT_ID]/settings/api`
   - Copy the `anon` `public` key for `VITE_SUPABASE_ANON_KEY`
   - Copy the project URL for `VITE_SUPABASE_URL`

2. **Google Maps API Key:**
   - Go to: `https://console.cloud.google.com/`
   - Create a project and enable:
     - Maps JavaScript API
     - Geocoding API
   - Create credentials (API Key) and restrict to your domain

⚠️ **Security Note:** Never commit real API keys to the repository. The `.env` file is gitignored.

---

## 🚀 Setup Instructions

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** or **yarn**
- **Git**
- **Supabase account** (for backend services)

### Local Development Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd seychelles-compass-explore

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp env.example .env
# Edit .env with your actual values (see Environment Variables section)

# 4. Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### First-Time Setup Checklist

- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Copy `env.example` to `.env`
- [ ] Add Supabase credentials to `.env`
- [ ] (Optional) Add Google Maps API key
- [ ] Run `npm run dev`
- [ ] Verify application loads at `http://localhost:5173`

---

## 🗄️ Database Schema

### Core Tables

#### `products` (Master Product Catalog)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `title` | TEXT (NOT NULL) | Product name |
| `description` | TEXT | Product description |
| `price` | NUMERIC(10,2) | Default price |
| `duration` | TEXT | Service duration (e.g., "1 hour") |
| `image_url` | TEXT | Single image URL |
| `is_active` | BOOLEAN | Active status (default: true) |
| `searchable` | BOOLEAN | Include in search (default: true) |
| `stock` | INTEGER | Stock quantity (default: 0) |
| `business_id` | UUID | Optional direct business link (nullable) |
| `slug` | TEXT | URL-friendly identifier |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Key Features:**
- `title` is required (NOT NULL)
- `image_url` is TEXT (not JSONB array)
- Deprecated fields removed: `name`, `category`, `images[]`, `status`, `currency`

#### `business_products` (Business-Product Linking)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `business_id` | UUID | Foreign key to `businesses` |
| `product_id` | UUID | Foreign key to `products` |
| `price_override` | NUMERIC(12,2) | Business-specific price |
| `title_override` | TEXT | Business-specific title |
| `description_override` | TEXT | Business-specific description |
| `is_active` | BOOLEAN | Active status |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Key Features:**
- Many-to-many relationship between businesses and products
- Allows custom pricing per business
- Override fields for business-specific customization

#### `businesses` (Business Listings)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `owner_id` | UUID | Foreign key to `profiles` |
| `name` | TEXT | Business name |
| `description` | TEXT | Business description |
| `island` | TEXT | Seychelles island location |
| `address` | TEXT | Physical address |
| `status` | TEXT | Verification status |
| `verified` | BOOLEAN | Verification flag |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### Required Triggers & RLS Rules

#### Triggers

- **`update_products_updated_at`** - Auto-updates `products.updated_at` on row changes
- **`update_business_products_updated_at`** - Auto-updates `business_products.updated_at` on row changes

#### RLS Policies

**`products` table:**
- Public read access (anyone can view active products)
- Admin write access (INSERT, UPDATE, DELETE)

**`business_products` table:**
- Public read access (anyone can view active business_products)
- Admin write access (INSERT, UPDATE, DELETE)
- Business owner access (view/manage their own business_products)

**`businesses` table:**
- Public read access (anyone can view active businesses)
- Admin write access (full CRUD)
- Business owner access (view/manage their own businesses)

### Unified Fields Explanation

The unified schema uses consistent field names across the application:

- **`id`** - UUID primary key (all tables)
- **`title`** - Product name (replaces deprecated `name`)
- **`description`** - Text description (nullable)
- **`price`** - NUMERIC(10,2) for products, NUMERIC(12,2) for overrides
- **`duration`** - Service duration as TEXT
- **`image_url`** - Single TEXT field (not array)
- **`is_active`** - Boolean flag for active/inactive status
- **`searchable`** - Boolean flag for search inclusion
- **`created_at`** / **`updated_at`** - Timestamp tracking

---

## 🔄 Running Migrations

### Migration Location

All migrations are stored in `supabase/migrations/` directory.

### Applying Migrations

#### Method 1: Supabase Dashboard (Recommended)

1. Navigate to: `https://supabase.com/dashboard/project/[PROJECT_ID]/sql/new`
2. Open the migration file from `supabase/migrations/`
3. Copy and paste the SQL content
4. Click **"Run"** to execute

#### Method 2: Supabase CLI

```bash
# If using Supabase CLI
supabase db push
```

### Safe Migrations (Post-Cleanup)

After the December 2025 cleanup, the following migrations are **SAFE** and **REQUIRED**:

- ✅ **`20250208000000_fix_products_schema_alignment.sql`** - Core schema alignment (REQUIRED)
- ✅ **`20250207000000_fix_business_products_title_override.sql`** - Business products schema fix
- ✅ Any RLS policy migrations dated after cleanup

### Historical Migrations Removed

The following deprecated migrations were removed during cleanup:

- ❌ Migrations with deprecated fields (`name`, `category`, `images[]`)
- ❌ Duplicate schema alignment migrations
- ❌ Migrations with typo columns (`updated_atupdated_at`)

### Migration Order

1. Apply schema migrations first (`20250208000000_fix_products_schema_alignment.sql`)
2. Apply RLS policy migrations
3. Run type generation: `npm run gen:types`
4. Test the application

---

## 💻 Development Commands

### Core Commands

```bash
# Start development server
npm run dev

# Start with port reset (kills stuck processes)
npm run dev:reset

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking (no emit)
npx tsc --noEmit
```

### Utility Scripts

```bash
# Generate Supabase types
npm run gen:types

# Reset development environment (PowerShell)
powershell -ExecutionPolicy Bypass -File ./scripts/reset-dev.ps1

# Seed admin user
npm run seed:admin
```

### Reset Development Environment

The `scripts/reset-dev.ps1` script performs:

1. Stops processes on port 5173
2. Clears Vite cache (`node_modules/.vite`)
3. Reinstalls dependencies
4. Starts development server

**Usage:**
```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/reset-dev.ps1
```

---

## 🚢 Deployment Notes

### Static Hosting (Vercel / Netlify)

The application is a **static site** built with Vite, making it ideal for:

- **Vercel** (recommended)
- **Netlify**
- **Cloudflare Pages**
- Any static hosting provider

### Deployment Steps

1. **Connect Repository:**
   - Push code to GitHub/GitLab
   - Connect repository to hosting provider

2. **Configure Environment Variables:**
   - Add all required variables in hosting dashboard:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_SITE_URL` (set to production domain)
     - `VITE_GOOGLE_MAPS_API_KEY` (optional)

3. **Build Settings:**
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Node Version:** 18+ (LTS)

4. **Deploy:**
   - Hosting provider will automatically build and deploy
   - Verify environment variables are loaded correctly

### Production Considerations

- ✅ **Environment Sync** - Ensure all Supabase environment variables match production
- ✅ **CORS Configuration** - Verify Supabase CORS settings include production domain
- ✅ **RLS Policies** - Test RLS policies in production environment
- ✅ **Image Storage** - Configure Supabase Storage buckets for production
- ✅ **Error Monitoring** - Set up error tracking (e.g., Sentry)

### MySQL Migration (Future)

⚠️ **Note:** MySQL migration is planned for future implementation but is **NOT currently used**. The application currently uses **Supabase (PostgreSQL)** exclusively.

---

## 🔧 Troubleshooting

### Missing Product Fields

**Symptoms:** Products missing `title`, `image_url`, or other fields

**Solution:**
1. Verify schema alignment migration has been applied: `20250208000000_fix_products_schema_alignment.sql`
2. Check that deprecated fields (`name`, `category`, `images[]`) are not being referenced in code
3. Run type generation: `npm run gen:types`
4. Restart development server

### 400 Errors on Product Linking

**Symptoms:** HTTP 400 errors when linking products to businesses

**Solution:**
1. Verify `business_products` table schema includes:
   - `title_override` column
   - `description_override` column
   - `price_override` column
2. Check that `business_id` and `product_id` are valid UUIDs
3. Verify RLS policies allow the operation

### Supabase RLS Errors

**Symptoms:** "Row Level Security policy violation" errors

**Solution:**
1. Verify RLS policies are enabled on tables:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```
2. Check that user has appropriate role (`is_admin` or `role = 'admin'`)
3. Verify `business_products` policies allow public read access
4. Check migration: `20250201000000_fix_admin_products_rls_alignment.sql`

### Port Conflicts

**Symptoms:** Port 5173 already in use

**Solution:**
```bash
# Use the reset script
npm run dev:reset

# Or manually kill the process
# Windows:
taskkill /F /IM node.exe
# Linux/Mac:
pkill -f node
```

### Environment Variables Not Loading

**Symptoms:** `undefined` values for environment variables

**Solution:**
1. Ensure `.env` file exists in project root
2. Restart development server after changing `.env`
3. Verify variable names start with `VITE_` for client-side access
4. Check that `.env` is not gitignored (should be in `.gitignore`)

### Database Connection Issues

**Symptoms:** Cannot connect to Supabase

**Solution:**
1. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
2. Check Supabase dashboard for service status
3. Verify RLS policies are correctly configured
4. Check browser console for detailed error messages

---

## 📝 Changelog

### December 2025

**Major Schema + Code Cleanup Alignment**

- ✅ Unified Products Schema aligned with TypeScript interfaces
- ✅ Removed deprecated fields (`name`, `category`, `images[]`, `status`, `currency`)
- ✅ Fixed schema inconsistencies and typos (`updated_atupdated_at` → `updated_at`)
- ✅ Cleaned up business-product linking model
- ✅ Stabilized RLS policies for `products` and `business_products`
- ✅ Updated all TypeScript interfaces to match database schema
- ✅ Removed historical migrations with deprecated fields

### Previous Updates

- Product catalog system implementation
- Business-product many-to-many linking
- Admin panel features
- Island filtering system
- Search functionality enhancements

---

## 📚 Additional Documentation

- [SCHEMA_LOCK.md](./supabase/SCHEMA_LOCK.md) - Database schema reference
- [MIGRATION_APPLICATION_GUIDE.md](./MIGRATION_APPLICATION_GUIDE.md) - Migration guide
- [DEVLOG.md](./DEVLOG.md) - Development log
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guide

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

## 📄 License

This project is private and proprietary.

---

**Built with ❤️ for the beautiful islands of Seychelles 🌴**
