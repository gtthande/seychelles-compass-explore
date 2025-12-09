# ARCHITECTURE: Data Flow After Schema Rebuild

## Overview
This document describes how data flows from Supabase PostgreSQL database to the React UI after applying the final schema rebuild migration.

## Database Schema Structure

### Core Tables

1. **`categories`** (Source of Truth)
   - `id` (UUID, PK)
   - `title` (TEXT, NOT NULL) - Category name
   - `description` (TEXT)
   - `slug` (TEXT)
   - `is_active` (BOOLEAN, DEFAULT true)
   - `created_at`, `updated_at` (TIMESTAMPTZ)

2. **`businesses`** (Main Entity)
   - `id` (UUID, PK)
   - `title` (TEXT, NOT NULL) - Business name (replaces old `name`)
   - `description` (TEXT)
   - `category_id` (UUID, FK → categories.id) - Replaces old `category` enum/text
   - `is_verified` (BOOLEAN, DEFAULT false) - Replaces old `status` enum
   - `is_active` (BOOLEAN, DEFAULT true)
   - `phone`, `email`, `website`, `address` (TEXT)
   - `image_url` (TEXT)
   - `owner_id` (UUID, FK → profiles.id)
   - `created_at`, `updated_at` (TIMESTAMPTZ)

3. **`products`** (Product Catalog)
   - `id` (UUID, PK)
   - `title` (TEXT, NOT NULL) - Product name
   - `description` (TEXT)
   - `price` (NUMERIC)
   - `business_id` (UUID, FK → businesses.id)
   - `image_url` (TEXT)
   - `is_active` (BOOLEAN)
   - `created_at`, `updated_at` (TIMESTAMPTZ)

4. **`business_products`** (Join Table)
   - `business_id` (UUID, FK → businesses.id)
   - `product_id` (UUID, FK → products.id)
   - `price_override`, `title_override`, `description_override` (Optional overrides)
   - PRIMARY KEY (business_id, product_id)

## Data Flow Architecture

### 1. Home Page → Category Grid

```
User visits homepage
  ↓
React Component: CategoryGrid / OptimizedCategoryGrid
  ↓
API Call: fetchCategories() from src/lib/api/categories.ts
  ↓
Supabase Query: 
  SELECT id, title, slug, description, is_active, created_at
  FROM categories
  WHERE is_active = true
  ORDER BY title
  ↓
Transform: Map to Category[] type
  ↓
UI Display: Category cards with counts
```

### 2. Category Grid → Business Counts

```
For each category:
  ↓
Supabase Query:
  SELECT COUNT(*) 
  FROM businesses
  WHERE category_id = <category.id>
    AND is_active = true
  ↓
Display: Category card with business count badge
```

### 3. Directory Page → Business Listings

```
User navigates to /directory
  ↓
React Component: Directory.tsx
  ↓
API Call: useServerSideData() hook
  ↓
Supabase Query:
  SELECT 
    id, title, description, category_id,
    phone, email, website, address,
    is_active, searchable, slug, image_url,
    created_at, updated_at,
    categories (id, title, slug)
  FROM businesses
  LEFT JOIN categories ON businesses.category_id = categories.id
  WHERE is_active = true
  ORDER BY created_at DESC
  ↓
Transform: Map to Business[] with category name from JOIN
  ↓
UI Display: Business cards in grid/list view
```

### 4. Admin Panel → Business Manager

```
Admin navigates to /admin
  ↓
React Component: BusinessManager.tsx
  ↓
Supabase Query:
  SELECT 
    id, title, description, category_id,
    phone, email, website, address,
    image_url, is_active, is_verified, owner_id,
    created_at, updated_at,
    categories (id, title, slug)
  FROM businesses
  LEFT JOIN categories ON businesses.category_id = categories.id
  ORDER BY created_at DESC
  ↓
Transform: 
  - Compute status from is_active + is_verified
  - Extract category name from JOIN
  ↓
UI Display: Admin table with status badges
```

### 5. Search Functionality

```
User enters search term
  ↓
React Component: SearchFilter.tsx or useUnifiedSearch.ts
  ↓
Supabase Query:
  SELECT ... FROM businesses
  WHERE title ILIKE '%search%' 
     OR description ILIKE '%search%'
  AND is_active = true
  ↓
Results: Filtered business list
```

## Key Schema Changes Applied

### Field Name Mappings (Old → New)
- `categories.name` → `categories.title`
- `businesses.name` → `businesses.title`
- `businesses.category` (enum/text) → `businesses.category_id` (UUID FK)
- `businesses.status` (enum) → `businesses.is_verified` (boolean) + `is_active` (boolean)

### Removed Fields
- ❌ `products.category` (products don't have categories)
- ❌ `products.name` (replaced by `title`)
- ❌ `products.images` (JSONB array) → `products.image_url` (TEXT)

## Row Level Security (RLS)

### Public Access
- **Categories**: Public read (anon, authenticated)
- **Businesses**: Public read for active businesses
- **Products**: Public read for active products

### Admin Access
- Service role has full access to all tables
- Policies: `"Admin full <table>"` for service_role

## TypeScript Type Generation

Types are generated from Supabase schema:
```bash
npx supabase gen types typescript --project-id bwlmlniotyrjttglbjrl --schema public > src/lib/database.types.ts
```

This ensures TypeScript types match the actual database schema.

## Error Handling

### Column Does Not Exist (42703)
- **Cause**: Frontend queries columns that don't exist in database
- **Solution**: Apply migration to align schema, regenerate types
- **Prevention**: Always use explicit `.select()` with valid column names

### Data Preservation
- Migration uses `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- Data migration: `UPDATE ... SET new_column = old_column WHERE ...`
- Idempotent: Safe to run multiple times

## Performance Optimizations

1. **Indexes**: Created on `category_id`, `title`, `is_active`, `slug`
2. **JOINs**: Use LEFT JOIN to get category names in single query
3. **Pagination**: Use `.range()` for large result sets
4. **Caching**: React Query / useServerSideData for client-side caching

## Migration Safety

- ✅ **Data Preserving**: Uses `ALTER TABLE` not `DROP TABLE`
- ✅ **Idempotent**: Can run multiple times safely
- ✅ **Backward Compatible**: Migrates old field names to new ones
- ✅ **RLS Preserved**: Maintains existing security policies
