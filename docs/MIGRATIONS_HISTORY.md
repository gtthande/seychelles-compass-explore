# iCompass Seychelles - Migrations History

**Last Updated:** December 2025

This document summarizes all database migrations in chronological order, noting schema changes, RLS policy updates, and index additions.

---

## Migration Naming Convention

Migrations follow the format: `YYYYMMDDHHMMSS_description.sql`

- **Date-based:** Chronological ordering
- **Descriptive:** Clear purpose in filename
- **Idempotent:** Most migrations are safe to run multiple times

---

## Migration Categories

- **Schema Changes:** Table creation, column additions/modifications
- **RLS Policies:** Row Level Security policy updates
- **Indexes:** Performance optimization indexes
- **Functions/Triggers:** Database functions and triggers
- **Data Migrations:** Data transformations and seed data

---

## Migration History

### December 2025

#### `20251210000000_add_business_product_fields.sql`
**Type:** Schema Changes  
**Summary:** Adds `quantity`, `location`, and `best_buy_note` columns to `business_products` table.

**Changes:**
- Added `quantity` (integer, default 0)
- Added `location` (text, nullable)
- Added `best_buy_note` (text, nullable)
- Created indexes on `quantity` and `location`
- Ensured `price_override` column exists

**Impact:** Extends business-product linking with additional metadata.

---

#### `20251209143628_fix_get_live_counters_columns.sql`
**Type:** Functions  
**Summary:** Fixes `get_live_counters()` RPC function to use correct column names.

**Changes:**
- Updated function to use `is_active` instead of `status`
- Updated function to use `is_verified` instead of `verified`
- Fixed joins to use correct table relationships

**Impact:** Dashboard statistics now display correctly.

---

#### `20251209000000_full_schema_rebuild.sql`
**Type:** Schema Changes, RLS Policies  
**Summary:** Complete schema rebuild - authoritative migration.

**Changes:**
- **Dropped and recreated tables:**
  - `categories` - Simplified structure (id, title, description)
  - `businesses` - Uses `title` instead of `name`, `category_id` FK
  - `products` - Simplified structure
  - `business_products` - Many-to-many join table

- **RLS Policies:**
  - Public read access for all tables
  - Admin full access via service_role

- **Indexes:**
  - `idx_businesses_category_id`
  - `idx_businesses_owner_id`
  - `idx_products_business_id`
  - `idx_business_products_business_id`
  - `idx_business_products_product_id`

- **Seed Data:**
  - Sample categories
  - Sample business
  - Sample product

**Impact:** Major schema cleanup and alignment. Removed deprecated fields.

---

#### `20251202130000_create_business_products_table.sql`
**Type:** Schema Changes, RLS Policies, Triggers  
**Summary:** Creates `business_products` join table with business-specific overrides.

**Changes:**
- Created `business_products` table with:
  - `id`, `business_id`, `product_id`
  - `title_override`, `description_override`
  - `price_from`, `price_to`, `currency_code`
  - `duration_minutes`, `is_active`
  - `booking_url`, `notes`

- **RLS Policies:**
  - Public can view active business_products
  - Business owners can manage their business_products
  - Admins can manage all business_products

- **Triggers:**
  - `update_business_products_updated_at`

**Impact:** Enables many-to-many business-product relationships with custom pricing.

---

#### `20251202120000_add_product_fields.sql`
**Type:** Schema Changes  
**Summary:** Adds additional fields to products table.

**Changes:**
- Added product fields as needed
- Ensured compatibility with TypeScript interfaces

**Impact:** Product schema alignment.

---

#### `20251201002_business_fields_fix.sql`
**Type:** Schema Changes  
**Summary:** Fixes business table fields.

**Changes:**
- Ensured all required business fields exist
- Fixed field types and constraints

**Impact:** Business schema alignment.

---

#### `20251201001_seed_admin.sql`
**Type:** Data Migration  
**Summary:** Seeds admin user.

**Changes:**
- Creates admin user in profiles table
- Sets `is_admin = true` and `role = 'admin'`

**Impact:** Provides initial admin access.

---

#### `202512010001_stable_schema.sql`
**Type:** Schema Changes  
**Summary:** Idempotent schema migration ensuring all tables exist.

**Changes:**
- Creates `profiles` table if not exists
- Creates `businesses` table if not exists
- Creates `categories` table if not exists
- Creates `business_categories` junction table if not exists
- Creates `products` table if not exists
- Adds indexes

**Impact:** Ensures stable schema state.

---

#### `20251201000000_repair_business_schema.sql`
**Type:** Schema Changes  
**Summary:** Repairs business schema.

**Changes:**
- Fixes business table structure
- Ensures all required columns exist

**Impact:** Business schema repair.

---

#### `20251201000000_icomp_business_admin_resync.sql`
**Type:** Schema Changes  
**Summary:** Resyncs business and admin schema.

**Changes:**
- Aligns business and admin tables
- Ensures consistency

**Impact:** Schema synchronization.

---

### February 2025

#### `20250210000001_data_preserving_schema_align.sql`
**Type:** Schema Changes, RLS Policies, Triggers  
**Summary:** Data-preserving schema alignment.

**Changes:**
- Aligns schema while preserving data
- Updates RLS policies
- Adds triggers for `updated_at` columns

**Impact:** Schema alignment without data loss.

---

#### `20250210000000_complete_schema_repair.sql`
**Type:** Schema Changes, RLS Policies, Triggers  
**Summary:** Complete schema repair.

**Changes:**
- Repairs all table structures
- Updates RLS policies
- Adds triggers

**Impact:** Comprehensive schema repair.

---

#### `20250209000000_full_schema_rebuild.sql`
**Type:** Schema Changes, RLS Policies  
**Summary:** Full schema rebuild (earlier version).

**Changes:**
- Similar to December 2025 version
- Uses `service_role` for admin access

**Impact:** Schema rebuild.

---

#### `20250208000000_fix_products_schema_alignment.sql`
**Type:** Schema Changes, Triggers  
**Summary:** Fixes products schema alignment with TypeScript interfaces.

**Changes:**
- **Fixed typo column:** `updated_atupdated_at` → `updated_at`
- **Removed deprecated columns:**
  - `name` → migrated to `title`
  - `category`, `status`, `images[]`, `currency`

- **Ensured required columns:**
  - `title` (NOT NULL)
  - `description`, `price`, `duration`
  - `is_active`, `searchable`
  - `image_url` (TEXT)
  - `stock`, `business_id`, `slug`

- **Triggers:**
  - `update_products_updated_at`
  - `update_business_products_updated_at`

**Impact:** Products schema aligned with frontend TypeScript interfaces.

---

#### `20250207000000_fix_business_products_title_override.sql`
**Type:** Schema Changes, Triggers  
**Summary:** Ensures `business_products` has `title_override` column.

**Changes:**
- Adds `title_override` column if missing
- Adds trigger for `updated_at`

**Impact:** Business products can override product titles.

---

#### `20250203000000_unified_schema_alignment.sql`
**Type:** Schema Changes, RLS Policies  
**Summary:** Unified schema alignment.

**Changes:**
- Aligns all tables to unified schema
- Updates RLS policies

**Impact:** Unified schema structure.

---

#### `20250202000000_final_products_schema_alignment.sql`
**Type:** Schema Changes  
**Summary:** Final products schema alignment.

**Changes:**
- Final alignment of products table
- Ensures all fields match TypeScript interfaces

**Impact:** Products schema finalization.

---

#### `20250201000001_products_schema_alignment.sql`
**Type:** Schema Changes  
**Summary:** Products schema alignment (version 2).

**Changes:**
- Continues products schema alignment
- Field updates

**Impact:** Products schema alignment.

---

#### `20250201000000_products_schema_alignment.sql`
**Type:** Schema Changes  
**Summary:** Products schema alignment (version 1).

**Changes:**
- Initial products schema alignment
- Field additions/modifications

**Impact:** Products schema alignment start.

---

#### `20250201000000_fix_admin_products_rls_alignment.sql`
**Type:** RLS Policies  
**Summary:** Fixes admin products RLS alignment.

**Changes:**
- Updates RLS policies for products
- Updates RLS policies for business_products
- Ensures admin access

**Impact:** Admin product management access fixed.

---

### January 2025

#### `20250131000002_fix_products_queries.sql`
**Type:** Functions, RLS Policies  
**Summary:** Fixes product queries and adds admin read policies.

**Changes:**
- Adds `admin_read_all_products` policy
- Adds `admin_read_all_business_products` policy
- Updates `get_live_counters()` function

**Impact:** Admin can read all products.

---

#### `20250131000001_migrate_products_to_business_products.sql`
**Type:** Schema Changes, RLS Policies, Triggers  
**Summary:** Migrates products to business_products model.

**Changes:**
- Creates `business_products` table
- Migrates data from products.business_id
- Adds triggers

**Impact:** Many-to-many product linking enabled.

---

#### `20250131000000_fix_schema_alignment.sql`
**Type:** Schema Changes  
**Summary:** Fixes schema alignment.

**Changes:**
- Aligns schema across tables
- Ensures consistency

**Impact:** Schema alignment.

---

#### `20250130000000_fix_public_read_policies.sql`
**Type:** RLS Policies  
**Summary:** Fixes public read policies.

**Changes:**
- Adds public read policies for businesses, categories, products
- Ensures public access

**Impact:** Public can read listings.

---

#### `20250130000000_comprehensive_schema_repair.sql`
**Type:** Schema Changes, RLS Policies, Triggers  
**Summary:** Comprehensive schema repair.

**Changes:**
- **Profiles table:**
  - Fixes structure (id = auth.uid())
  - Adds role, is_admin, is_active columns

- **Businesses table:**
  - Ensures all required columns
  - Adds owner_id, category_id, status

- **Categories table:**
  - Creates if not exists
  - Adds required columns

- **Triggers:**
  - `handle_new_user()` - Creates profile on signup
  - `trigger_set_timestamp()` - Updates updated_at

**Impact:** Comprehensive schema repair and stabilization.

---

#### `20250128000000_comprehensive_rls_fix.sql`
**Type:** RLS Policies, Functions  
**Summary:** Comprehensive RLS policy fix.

**Changes:**
- Creates `is_admin_user()` function
- Updates all RLS policies
- Ensures admin access
- Ensures public read access

**Impact:** RLS policies stabilized.

---

#### `20250127000001_add_verification_notes.sql`
**Type:** Schema Changes  
**Summary:** Adds verification_notes to businesses.

**Changes:**
- Adds `verification_notes` column to businesses table

**Impact:** Admin can add verification notes.

---

#### `20250127000000_fix_rls_policies.sql`
**Type:** RLS Policies  
**Summary:** Fixes RLS policies.

**Changes:**
- Updates RLS policies across tables
- Ensures proper access control

**Impact:** RLS policies fixed.

---

#### `20250126000001_simplified_rls_policies.sql`
**Type:** RLS Policies  
**Summary:** Simplifies RLS policies.

**Changes:**
- Simplifies policy logic
- Improves performance

**Impact:** Simplified RLS policies.

---

#### `20250126000000_ensure_business_products_schema.sql`
**Type:** Schema Changes  
**Summary:** Ensures business_products schema exists.

**Changes:**
- Creates business_products table if not exists
- Adds required columns

**Impact:** Business products table ensured.

---

#### `20250126000000_ensure_business_fields.sql`
**Type:** Schema Changes  
**Summary:** Ensures business fields exist.

**Changes:**
- Adds missing business fields
- Ensures all required columns

**Impact:** Business fields ensured.

---

#### `20250125000001_ensure_public_read_access.sql`
**Type:** RLS Policies  
**Summary:** Ensures public read access.

**Changes:**
- Adds public read policies
- Ensures admin access

**Impact:** Public can read listings.

---

#### `20250125000000_rls_stable_fix.sql`
**Type:** RLS Policies  
**Summary:** Stable RLS fix.

**Changes:**
- Enables RLS on all tables
- Creates public read policies
- Creates admin policies

**Impact:** RLS stabilized.

---

#### `20250125000000_fix_business_schema_complete.sql`
**Type:** Schema Changes, Triggers  
**Summary:** Complete business schema fix.

**Changes:**
- Fixes business table structure
- Adds `sync_business_coordinates()` function
- Adds trigger for coordinate sync

**Impact:** Business schema fixed.

---

#### `20250125000000_drop_products_business_id.sql`
**Type:** Schema Changes  
**Summary:** Drops products.business_id column (migrated to business_products).

**Changes:**
- Drops `business_id` column from products table

**Impact:** Products no longer directly linked to businesses.

---

#### `20250123000000_ensure_profile_rls_policies.sql`
**Type:** RLS Policies  
**Summary:** Ensures profile RLS policies exist.

**Changes:**
- Adds profile RLS policies
- Ensures user can view own profile
- Ensures admin access

**Impact:** Profile RLS policies ensured.

---

#### `20250122000003_add_admin_product_insert_policy.sql`
**Type:** RLS Policies  
**Summary:** Adds admin product insert policy.

**Changes:**
- Adds policy allowing admins to insert products

**Impact:** Admin can create products.

---

#### `20250122000002_fix_profile_schema_and_admin_check.sql`
**Type:** Schema Changes, Functions  
**Summary:** Fixes profile schema and admin check.

**Changes:**
- Fixes profile table structure
- Creates `is_admin_user()` function

**Impact:** Profile schema and admin check fixed.

---

#### `20250122000001_fix_admin_rls_schema_mismatch.sql`
**Type:** RLS Policies, Functions  
**Summary:** Fixes admin RLS schema mismatch.

**Changes:**
- Updates admin RLS policies
- Fixes `is_admin_user()` function

**Impact:** Admin RLS policies fixed.

---

#### `20250122000000_add_profile_insert_policy.sql`
**Type:** RLS Policies  
**Summary:** Adds profile insert policy.

**Changes:**
- Allows users to insert their own profile

**Impact:** Users can create profiles.

---

#### `20250121000000_admin_rls_policies.sql`
**Type:** RLS Policies, Functions  
**Summary:** Admin RLS policies setup.

**Changes:**
- Creates `is_admin_user()` function
- Adds admin RLS policies for businesses

**Impact:** Admin access to businesses enabled.

---

#### `20250120000003_add_review_images_and_avatars_buckets.sql`
**Type:** Storage  
**Summary:** Creates storage buckets for review images and avatars.

**Changes:**
- Creates `review-images` bucket
- Creates `avatars` bucket

**Impact:** Storage buckets for images created.

---

#### `20250120000002_add_image_url_to_reviews.sql`
**Type:** Schema Changes  
**Summary:** Adds image_url to reviews table.

**Changes:**
- Adds `image_url` column to reviews table

**Impact:** Reviews can have images.

---

#### `20250120000001_add_products_catalog_system.sql`
**Type:** Schema Changes, RLS Policies, Triggers  
**Summary:** Adds products catalog system.

**Changes:**
- Creates products table
- Adds RLS policies
- Adds triggers for updated_at

**Impact:** Products catalog system added.

---

#### `20250120000001_add_category_images_bucket.sql`
**Type:** Storage  
**Summary:** Creates category images storage bucket.

**Changes:**
- Creates `category-images` bucket

**Impact:** Category images storage enabled.

---

#### `20250120000000_add_image_url_to_categories.sql`
**Type:** Schema Changes  
**Summary:** Adds image_url to categories table.

**Changes:**
- Adds `image_url` column to categories table

**Impact:** Categories can have images.

---

#### `20250120000000_add_fulltext_search_indexes.sql`
**Type:** Indexes, Functions  
**Summary:** Adds full-text search indexes and function.

**Changes:**
- Creates full-text search indexes
- Creates `search_businesses_and_products()` function

**Impact:** Full-text search enabled.

---

#### `20250119150000_setup_profiles_auth.sql`
**Type:** Schema Changes, Triggers  
**Summary:** Sets up profiles and auth triggers.

**Changes:**
- Creates profiles table
- Creates `handle_new_user()` trigger
- Creates `handle_user_email_update()` trigger

**Impact:** Auth integration with profiles.

---

#### `20250119140000_fix_category_search.sql`
**Type:** Functions  
**Summary:** Fixes category search function.

**Changes:**
- Creates `search_businesses()` function

**Impact:** Category search fixed.

---

#### `20250119130000_comprehensive_schema_fix.sql`
**Type:** Schema Changes, Functions  
**Summary:** Comprehensive schema fix.

**Changes:**
- Creates helper functions: `is_admin()`, `is_business_user()`, `is_active_user()`
- Updates schema across tables

**Impact:** Comprehensive schema fix.

---

#### `20250119123000_add_role_and_is_active.sql`
**Type:** Schema Changes  
**Summary:** Adds role and is_active to profiles.

**Changes:**
- Adds `role` column (default 'user')
- Adds `is_active` column (default true)

**Impact:** Role-based access control enabled.

---

#### `20250119122700_add_role_and_is_active_to_profiles.sql`
**Type:** Schema Changes  
**Summary:** Adds role and is_active to profiles (version 1).

**Changes:**
- Similar to above migration

**Impact:** Role-based access control.

---

#### `20250115000001_products_catalog_system.sql`
**Type:** Schema Changes, Functions, Triggers  
**Summary:** Products catalog system (earlier version).

**Changes:**
- Creates products table
- Creates search functions
- Adds triggers

**Impact:** Products catalog system.

---

#### `20250115000000_business_crud_policies.sql`
**Type:** RLS Policies, Functions, Triggers  
**Summary:** Business CRUD RLS policies.

**Changes:**
- Creates business RLS policies
- Creates `is_admin()` function
- Adds triggers

**Impact:** Business CRUD access control.

---

#### `20250113000001_create_app_settings_table.sql`
**Type:** Schema Changes, Triggers  
**Summary:** Creates app_settings table.

**Changes:**
- Creates `app_settings` table
- Adds trigger for updated_at

**Impact:** App settings storage.

---

#### `20250113000000_create_hero_section_table.sql`
**Type:** Schema Changes, Triggers  
**Summary:** Creates hero_section table.

**Changes:**
- Creates `hero_section` table
- Adds trigger for updated_at

**Impact:** Hero section management.

---

#### `20250101000000_add_verification_notes.sql`
**Type:** Schema Changes  
**Summary:** Adds verification_notes to businesses.

**Changes:**
- Adds `verification_notes` column

**Impact:** Verification notes support.

---

### September 2024

Multiple migrations from September 2024 covering:
- Initial schema setup
- RLS policies
- Functions and triggers
- Storage buckets
- Audit logging

**Key migrations:**
- `20250901060848_*` - Initial schema with profiles, businesses, products
- `20250903103509_*` - Adds `get_live_counters()`, `update_business_rating()`, audit triggers
- `20250914140712_*` - Payments table and RLS policies

---

## Special Migrations

### `99999999999999_reset_rls.sql`
**Type:** RLS Policies  
**Summary:** Hard reset of all RLS policies.

**Changes:**
- Drops all existing policies
- Creates new public read policies
- Creates admin full access policies

**Impact:** Complete RLS reset (use with caution).

---

### `99999999999998_fix_admin_users.sql`
**Type:** Data Migration  
**Summary:** Fixes admin users.

**Changes:**
- Updates admin user records
- Ensures admin flags are set

**Impact:** Admin users fixed.

---

## Migration Patterns

### Common Patterns

1. **Idempotent Migrations:**
   - Use `IF NOT EXISTS` checks
   - Use `ADD COLUMN IF NOT EXISTS`
   - Safe to run multiple times

2. **Data Preservation:**
   - Migrate data before dropping columns
   - Use `COALESCE` for default values
   - Backup tables before major changes

3. **RLS Policy Updates:**
   - Drop old policies before creating new ones
   - Use `DROP POLICY IF EXISTS`
   - Test policies after creation

4. **Trigger Management:**
   - Drop triggers before recreating
   - Use `DROP TRIGGER IF EXISTS`
   - Ensure functions exist before creating triggers

---

## Migration Best Practices

1. **Always test migrations in development first**
2. **Backup data before destructive migrations**
3. **Use transactions for complex migrations**
4. **Document breaking changes**
5. **Ensure idempotency where possible**
6. **Test RLS policies after updates**
7. **Verify indexes after schema changes**

---

## Notes

- **December 2025:** Major schema cleanup and alignment
- **February 2025:** Products schema alignment and business_products implementation
- **January 2025:** Comprehensive RLS fixes and schema repairs
- **September 2024:** Initial schema setup

---

## Current Schema State

The current schema is based on:
- `20251209000000_full_schema_rebuild.sql` (authoritative)
- `20251210000000_add_business_product_fields.sql` (extensions)
- `20251209143628_fix_get_live_counters_columns.sql` (function fixes)

All other migrations are historical and may have been superseded by later migrations.

