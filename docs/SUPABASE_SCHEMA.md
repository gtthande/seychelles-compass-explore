# iCompass Seychelles - Supabase Schema Documentation

**Last Updated:** December 2025  
**Schema Version:** Based on `20251209000000_full_schema_rebuild.sql`

---

## Overview

The iCompass Seychelles platform uses Supabase PostgreSQL with comprehensive Row Level Security (RLS) policies. This document provides detailed information about all database tables, columns, relationships, RLS policies, RPC functions, and triggers.

---

## Database Tables

### 1. `profiles`

User profiles and role management system.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | uuid (PK) | Primary key, references auth.users(id) | NOT NULL, DEFAULT gen_random_uuid() |
| `user_id` | uuid (FK) | References auth.users(id) | UNIQUE, NOT NULL, ON DELETE CASCADE |
| `full_name` | text | User's full name | |
| `email` | text | User's email address | |
| `phone` | text | Contact phone number | |
| `avatar_url` | text | Profile image URL | |
| `role` | text | User role ('admin', 'business', 'user') | DEFAULT 'user' |
| `is_admin` | boolean | Admin privileges flag | DEFAULT false |
| `is_active` | boolean | Account active status | DEFAULT true |
| `created_at` | timestamptz | Creation timestamp | NOT NULL, DEFAULT now() |
| `updated_at` | timestamptz | Last update timestamp | NOT NULL, DEFAULT now() |

**Indexes:**
- `profiles_email_idx` on `email`
- `profiles_user_id_idx` on `user_id`
- `idx_profiles_role` on `role`
- `idx_profiles_is_active` on `is_active`

**Relationships:**
- `user_id` → `auth.users(id)` (ON DELETE CASCADE)
- Referenced by `businesses.owner_id`

---

### 2. `categories`

Business categories for classification.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | uuid (PK) | Primary key | NOT NULL, DEFAULT gen_random_uuid() |
| `title` | text | Category name | NOT NULL |
| `description` | text | Category description | |
| `created_at` | timestamptz | Creation timestamp | DEFAULT now() |
| `updated_at` | timestamptz | Last update timestamp | DEFAULT now() |

**Indexes:**
- `idx_businesses_category_id` on `businesses(category_id)` (indirect)

**Relationships:**
- Referenced by `businesses.category_id` (ON DELETE SET NULL)

---

### 3. `businesses`

Main business entity storage.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | uuid (PK) | Primary key | NOT NULL, DEFAULT gen_random_uuid() |
| `owner_id` | uuid (FK) | References profiles(id) | ON DELETE SET NULL |
| `title` | text | Business name | NOT NULL |
| `description` | text | Business description | |
| `phone` | text | Contact phone | |
| `email` | text | Contact email | |
| `website` | text | Business website | |
| `image_url` | text | Business image URL | |
| `category_id` | uuid (FK) | References categories(id) | ON DELETE SET NULL |
| `is_verified` | boolean | Verification status | DEFAULT true |
| `created_at` | timestamptz | Creation timestamp | DEFAULT now() |
| `updated_at` | timestamptz | Last update timestamp | DEFAULT now() |

**Indexes:**
- `idx_businesses_category_id` on `category_id`
- `idx_businesses_owner_id` on `owner_id`

**Relationships:**
- `owner_id` → `profiles(id)` (ON DELETE SET NULL)
- `category_id` → `categories(id)` (ON DELETE SET NULL)
- Referenced by `products.business_id` (ON DELETE CASCADE)
- Referenced by `business_products.business_id` (ON DELETE CASCADE)

---

### 4. `products`

Master product catalog (shared across businesses).

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | uuid (PK) | Primary key | NOT NULL, DEFAULT gen_random_uuid() |
| `business_id` | uuid (FK) | References businesses(id) | ON DELETE CASCADE |
| `title` | text | Product name | NOT NULL |
| `description` | text | Product description | |
| `price` | numeric | Default price | |
| `slug` | text | URL-friendly identifier | |
| `image_url` | text | Product image URL | |
| `created_at` | timestamptz | Creation timestamp | DEFAULT now() |
| `updated_at` | timestamptz | Last update timestamp | DEFAULT now() |

**Indexes:**
- `idx_products_business_id` on `business_id`
- `idx_products_slug` on `slug` (if exists)

**Relationships:**
- `business_id` → `businesses(id)` (ON DELETE CASCADE)
- Referenced by `business_products.product_id` (ON DELETE CASCADE)

---

### 5. `business_products`

Many-to-many join table linking businesses to products with business-specific overrides.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | uuid (PK) | Primary key | DEFAULT gen_random_uuid() |
| `business_id` | uuid (FK) | References businesses(id) | NOT NULL, ON DELETE CASCADE |
| `product_id` | uuid (FK) | References products(id) | NOT NULL, ON DELETE CASCADE |
| `title_override` | text | Business-specific title override | |
| `description_override` | text | Business-specific description override | |
| `price_override` | numeric(12,2) | Business-specific price override | |
| `price_from` | numeric(12,2) | Minimum price (legacy) | |
| `price_to` | numeric(12,2) | Maximum price (legacy) | |
| `currency_code` | text | Currency code | DEFAULT 'SCR' |
| `duration_minutes` | integer | Duration in minutes | |
| `is_active` | boolean | Active status | DEFAULT true |
| `booking_url` | text | Deep link to booking page | |
| `notes` | text | Conditions/offers/small print | |
| `quantity` | integer | Number of units available | DEFAULT 0 |
| `location` | text | Location where product is available | |
| `best_buy_note` | text | Why this is a best buy | |
| `created_at` | timestamptz | Creation timestamp | DEFAULT now() |
| `updated_at` | timestamptz | Last update timestamp | DEFAULT now() |

**Indexes:**
- `idx_business_products_business_id` on `business_id`
- `idx_business_products_product_id` on `product_id`
- `idx_business_products_is_active` on `is_active` WHERE `is_active = true`
- `idx_business_products_quantity` on `quantity` WHERE `quantity > 0`
- `idx_business_products_location` on `location` WHERE `location IS NOT NULL`

**Constraints:**
- `UNIQUE (business_id, product_id)` - One product can only be linked once per business

**Relationships:**
- `business_id` → `businesses(id)` (ON DELETE CASCADE)
- `product_id` → `products(id)` (ON DELETE CASCADE)

---

## Relationships Summary

```
profiles (1) ──< (many) businesses
                    │
                    ├──> (many) products
                    │
                    └──> (many) business_products ──< (many) products
                    
categories (1) ──< (many) businesses
```

---

## Row Level Security (RLS) Policies

### `profiles` Table

**RLS Enabled:** Yes

| Policy Name | Operation | Role | Condition |
|-------------|-----------|------|-----------|
| `user_can_select_own_profile` | SELECT | authenticated | `id = auth.uid() OR user_id = auth.uid()` |
| `Users can update their own profile` | UPDATE | authenticated | `id = auth.uid() OR user_id = auth.uid()` |
| `Users can insert their own profile` | INSERT | authenticated | `id = auth.uid() OR user_id = auth.uid()` |
| `Admins can view all profiles` | SELECT | authenticated | `is_admin = true OR role = 'admin'` |
| `Admins can update all profiles` | UPDATE | authenticated | `is_admin = true OR role = 'admin'` |

---

### `categories` Table

**RLS Enabled:** Yes

| Policy Name | Operation | Role | Condition |
|-------------|-----------|------|-----------|
| `Public read categories` | SELECT | anon, authenticated | `true` (public read) |
| `Admin full categories` | ALL | service_role | `true` (admin full access) |

---

### `businesses` Table

**RLS Enabled:** Yes

| Policy Name | Operation | Role | Condition |
|-------------|-----------|------|-----------|
| `Public read businesses` | SELECT | anon, authenticated | `true` (public read) |
| `Business owners can manage their businesses` | ALL | authenticated | `owner_id = auth.uid()` |
| `Admin full businesses` | ALL | service_role | `true` (admin full access) |

---

### `products` Table

**RLS Enabled:** Yes

| Policy Name | Operation | Role | Condition |
|-------------|-----------|------|-----------|
| `Public read products` | SELECT | anon, authenticated | `true` (public read) |
| `Admin full products` | ALL | service_role | `true` (admin full access) |

---

### `business_products` Table

**RLS Enabled:** Yes

| Policy Name | Operation | Role | Condition |
|-------------|-----------|------|-----------|
| `Public can view active business_products` | SELECT | anon, authenticated | `is_active = true AND business.status = 'active'` |
| `Business owners can view their business_products` | SELECT | authenticated | `business.owner_id = auth.uid()` |
| `Business owners can insert their business_products` | INSERT | authenticated | `business.owner_id = auth.uid()` |
| `Business owners can update their business_products` | UPDATE | authenticated | `business.owner_id = auth.uid()` |
| `Business owners can delete their business_products` | DELETE | authenticated | `business.owner_id = auth.uid()` |
| `Admins can view all business_products` | SELECT | authenticated | `profiles.is_admin = true` |
| `Admins can insert all business_products` | INSERT | authenticated | `profiles.is_admin = true` |
| `Admins can update all business_products` | UPDATE | authenticated | `profiles.is_admin = true` |
| `Admins can delete all business_products` | DELETE | authenticated | `profiles.is_admin = true` |

---

## RPC Functions

### `get_live_counters()`

Returns real-time dashboard statistics.

**Returns:** JSON object with counts:
- Total businesses
- Total products
- Total categories
- Total users

**Usage:**
```sql
SELECT * FROM get_live_counters();
```

---

### `is_admin_user(uid UUID)`

Checks if a user has admin privileges.

**Parameters:**
- `uid` - User UUID

**Returns:** BOOLEAN

**Logic:**
- Checks `profiles` table for `is_admin = true` OR `role = 'admin'`
- Matches `profiles.id = uid` OR `profiles.user_id = uid`

**Usage:**
```sql
SELECT is_admin_user(auth.uid());
```

---

### `can_view_review_profile(target_user_id UUID)`

Privacy-aware profile access for business owners viewing customer profiles in review context.

**Parameters:**
- `target_user_id` - Target user UUID

**Returns:** BOOLEAN

**Usage:**
```sql
SELECT can_view_review_profile('user-uuid-here');
```

---

### `handle_new_user()`

Automatically creates a profile when a new user signs up.

**Trigger:** `on_auth_user_created` on `auth.users` AFTER INSERT

**Logic:**
- Creates profile with `id = NEW.id` (from auth.users)
- Sets default role to 'user'
- Sets `is_active = true`

---

### `update_updated_at_column()` / `trigger_set_timestamp()`

Automatically updates `updated_at` timestamp on row updates.

**Used by triggers on:**
- `profiles`
- `businesses`
- `products`
- `business_products`
- `categories`

---

### `update_business_rating()`

Recalculates business ratings when reviews are added/updated/deleted.

**Trigger:** `update_business_rating_trigger` on `reviews` AFTER INSERT/UPDATE/DELETE

**Logic:**
- Calculates average rating
- Updates `businesses.average_rating` and `businesses.total_reviews`

---

### `audit_trigger()`

Logs all table changes to `audit_logs` table.

**Used by triggers on:**
- `businesses`
- `products`

**Logs:**
- Table name
- Record ID
- Action (INSERT/UPDATE/DELETE)
- User ID
- Old values (JSONB)
- New values (JSONB)

---

## Triggers

### Timestamp Triggers

| Trigger Name | Table | Event | Function |
|--------------|-------|-------|----------|
| `update_profiles_updated_at` | `profiles` | BEFORE UPDATE | `update_updated_at_column()` |
| `update_businesses_updated_at` | `businesses` | BEFORE UPDATE | `update_updated_at_column()` |
| `update_products_updated_at` | `products` | BEFORE UPDATE | `update_updated_at_column()` |
| `update_business_products_updated_at` | `business_products` | BEFORE UPDATE | `update_business_products_updated_at()` |
| `update_categories_updated_at` | `categories` | BEFORE UPDATE | `update_categories_updated_at()` |

### Authentication Triggers

| Trigger Name | Table | Event | Function |
|--------------|-------|-------|----------|
| `on_auth_user_created` | `auth.users` | AFTER INSERT | `handle_new_user()` |

### Business Logic Triggers

| Trigger Name | Table | Event | Function |
|--------------|-------|-------|----------|
| `update_business_rating_trigger` | `reviews` | AFTER INSERT/UPDATE/DELETE | `update_business_rating()` |
| `audit_businesses_trigger` | `businesses` | AFTER INSERT/UPDATE/DELETE | `audit_trigger()` |
| `audit_products_trigger` | `products` | AFTER INSERT/UPDATE/DELETE | `audit_trigger()` |

---

## Storage Buckets

### Public Buckets

- **`business-logos`** - Business logo images
- **`business-covers`** - Business cover images
- **`product-images`** - Product gallery images
- **`business-documents`** - Business documentation
- **`category-images`** - Category images
- **`hero`** - Hero section background images
- **`review-images`** - Review images
- **`avatars`** - User avatar images

### Private Buckets

- **`product-catalogues`** - Private product catalogs

---

## Indexes Summary

### Performance Indexes

- `idx_businesses_category_id` - Fast category filtering
- `idx_businesses_owner_id` - Fast owner lookups
- `idx_products_business_id` - Fast product-business queries
- `idx_business_products_business_id` - Fast business-product joins
- `idx_business_products_product_id` - Fast product-business joins
- `idx_business_products_is_active` - Filtered index for active products
- `profiles_email_idx` - Fast email lookups
- `profiles_user_id_idx` - Fast user ID lookups

---

## Notes

### Schema Evolution

- **December 2025:** Major schema cleanup and alignment
  - Removed deprecated fields (`name`, `category` enum, `images[]`)
  - Unified to `title` field naming
  - Simplified `business_products` structure
  - Stabilized RLS policies

### Field Naming Conventions

- Use `title` instead of `name` for display names
- Use `image_url` (TEXT) instead of `images[]` (array)
- Use `category_id` (UUID FK) instead of `category` (enum)
- Use `is_verified` (boolean) instead of `status` (enum) where applicable

### Deprecated Fields

The following fields should NOT be used:
- `businesses.name` → Use `businesses.title`
- `categories.name` → Use `categories.title`
- `products.name` → Use `products.title`
- `products.images[]` → Use `products.image_url`
- `businesses.category` (enum) → Use `businesses.category_id` (UUID FK)

---

## Schema Validation

To validate the current schema matches this documentation:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

