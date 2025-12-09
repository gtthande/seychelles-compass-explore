# Database Repair Instructions

## ✅ Completed Steps

1. **Migration Created**: `supabase/migrations/20250210000000_complete_schema_repair.sql`
   - Drops affected tables (business_products, products, businesses, categories)
   - Recreates them with correct schema
   - Seeds clean test data
   - Applies RLS policies

2. **Code References Fixed**:
   - ✅ `SearchFilter.tsx`: Changed `categories.name` → `categories.title`
   - ✅ `useUnifiedSearch.ts`: Changed `businesses.name` → `businesses.title`
   - ✅ `BusinessVerificationWorkflow.tsx`: Updated to use `title`, `category_id`, `is_active`, `is_verified`
   - ✅ `useLiveCounters.tsx`: Changed `.eq('status', 'active')` → `.eq('is_active', true)`
   - ✅ `Directory.tsx`: Changed `.eq('status', 'active')` → `.eq('is_active', true)` and `.eq('category', ...)` → `.eq('category_id', ...)`
   - ✅ `BusinessDetail.tsx`: Updated query to use new schema fields
   - ✅ `admin-utils.ts`: Updated all status queries to use `is_active` and `is_verified`
   - ✅ `BusinessManager.tsx`: Updated status updates to map to `is_active`/`is_verified`
   - ✅ `OptimizedBusinessManager.tsx`: Updated status updates to map to `is_active`/`is_verified`

## 🔄 Next Steps (Manual)

### Step 1: Apply Migration to Supabase

Run the migration against your Supabase database:

```bash
# Option A: Using Supabase CLI (if connected)
supabase db push

# Option B: Apply manually via Supabase Dashboard
# 1. Go to SQL Editor in Supabase Dashboard
# 2. Copy contents of: supabase/migrations/20250210000000_complete_schema_repair.sql
# 3. Paste and execute
```

### Step 2: Regenerate TypeScript Types

After migration is applied, regenerate types:

```bash
npm run gen:types
```

Or manually:
```bash
npx supabase gen types typescript --project-id bwlmlniotyrjttglbjrl --schema public > src/lib/database.types.ts
```

### Step 3: Verify Frontend

Test these pages to ensure no errors:
- ✅ Homepage category grid
- ✅ Homepage business counters
- ✅ Explore Categories page
- ✅ Business admin listing
- ✅ Product admin listing
- ✅ Search page
- ✅ Homepage featured listings

## 📋 Schema Summary

### Categories
- `id` (uuid PK)
- `title` (text NOT NULL) ← Changed from `name`
- `slug` (text UNIQUE)
- `description` (text)
- `image_url` (text)
- `is_active` (boolean)
- `created_at`, `updated_at`

### Businesses
- `id` (uuid PK)
- `owner_id` (uuid FK → profiles)
- `title` (text NOT NULL) ← Changed from `name`
- `description` (text)
- `category_id` (uuid FK → categories) ← Changed from `category`
- `phone`, `email`, `website`, `address`
- `latitude`, `longitude`
- `image_url`, `hero_image`
- `slug` (text UNIQUE)
- `searchable` (boolean)
- `is_active` (boolean) ← Changed from `status` enum
- `is_verified` (boolean)
- `created_at`, `updated_at`

### Products
- `id` (uuid PK)
- `business_id` (uuid FK → businesses)
- `title` (text NOT NULL)
- `description` (text)
- `price` (numeric(10,2))
- `duration` (text)
- `image_url` (text)
- `searchable` (boolean)
- `stock` (integer)
- `is_active` (boolean)
- `slug` (text UNIQUE)
- `created_at`, `updated_at`
- ❌ NO `category` field

### Business_Products
- `id` (uuid PK)
- `business_id` (uuid FK → businesses)
- `product_id` (uuid FK → products)
- `title_override` (text)
- `description_override` (text)
- `price_override` (numeric(12,2))
- `is_active` (boolean)
- `featured` (boolean)
- `created_at`, `updated_at`

## ⚠️ Important Notes

1. **Status Mapping**: The old `status` enum has been replaced with:
   - `is_active = true, is_verified = true` → "active"
   - `is_active = false` → "pending" or "suspended"
   - Components compute status from these boolean fields

2. **Category References**: All `business.category` → `business.category_id` with JOIN to `categories` table

3. **Name References**: All `business.name` → `business.title`, `category.name` → `category.title`

4. **Product Categories**: Products no longer have a `category` field - they're linked to businesses which have categories
