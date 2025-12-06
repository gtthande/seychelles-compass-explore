# Database Schema Lock

**Last Updated:** 2025-01-30  
**Status:** LOCKED - Do not modify without explicit approval

## ⚠️ CRITICAL RULES

1. **NEVER** drop or recreate the `profiles` table
2. **NEVER** modify `profiles.id` - it MUST reference `auth.users(id)` directly
3. **NEVER** add a `user_id` column to `profiles` - use `id` as the primary key
4. **NEVER** drop tables without explicit approval
5. **ALWAYS** test migrations in a development environment first
6. **ALWAYS** ensure RLS policies are tested after schema changes

## Valid Tables and Columns

### `profiles`
- `id` UUID PK → REFERENCES `auth.users(id)` ON DELETE CASCADE
- `email` TEXT
- `full_name` TEXT
- `avatar_url` TEXT
- `role` TEXT DEFAULT 'user' CHECK (role IN ('admin', 'business', 'user'))
- `is_admin` BOOLEAN DEFAULT FALSE
- `is_business_owner` BOOLEAN DEFAULT FALSE
- `is_active` BOOLEAN DEFAULT TRUE
- `created_at` TIMESTAMPTZ DEFAULT NOW()
- `updated_at` TIMESTAMPTZ DEFAULT NOW()

**Indexes:**
- `idx_profiles_role` on `role`
- `idx_profiles_email` on `email`
- `idx_profiles_is_active` on `is_active`

### `businesses`
- `id` UUID PK DEFAULT gen_random_uuid()
- `owner_id` UUID FK → REFERENCES `profiles(id)` ON DELETE CASCADE
- `name` TEXT NOT NULL
- `description` TEXT
- `category_id` UUID (legacy field, nullable)
- `status` TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'closed'))
- `phone` TEXT
- `email` TEXT
- `website` TEXT
- `address` TEXT
- `latitude` DOUBLE PRECISION
- `longitude` DOUBLE PRECISION
- `created_at` TIMESTAMPTZ DEFAULT NOW()
- `updated_at` TIMESTAMPTZ DEFAULT NOW()

**Indexes:**
- `idx_businesses_owner_id` on `owner_id`
- `idx_businesses_status` on `status`
- `idx_businesses_category_id` on `category_id`

### `categories`
- `id` UUID PK DEFAULT gen_random_uuid()
- `name` TEXT NOT NULL
- `slug` TEXT UNIQUE NOT NULL
- `description` TEXT
- `is_active` BOOLEAN DEFAULT TRUE
- `image_url` TEXT (nullable, added in migration 20250127000000)
- `created_at` TIMESTAMPTZ DEFAULT NOW()
- `updated_at` TIMESTAMPTZ DEFAULT NOW()

**Indexes:**
- `idx_categories_active` on `is_active` (if exists)
- `idx_categories_name` on `name` (if exists)

### `business_categories` (Many-to-Many)
- `business_id` UUID FK → REFERENCES `businesses(id)` ON DELETE CASCADE
- `category_id` UUID FK → REFERENCES `categories(id)` ON DELETE CASCADE
- PRIMARY KEY (`business_id`, `category_id`)

**Indexes:**
- `idx_business_categories_business` on `business_id`
- `idx_business_categories_category` on `category_id`

### `products` (Master Product Catalogue)
- `id` UUID PK DEFAULT gen_random_uuid()
- `name` TEXT NOT NULL
- `title` TEXT (nullable, added in migration 20251202120000)
- `description` TEXT
- `category` TEXT (nullable, added in migration 20251202120000)
- `image_url` TEXT (nullable, added in migration 20251202120000)
- `status` TEXT DEFAULT 'active' (added in migration 20251202120000)
- `searchable` BOOLEAN DEFAULT true (added in migration 20251202120000)
- `duration` TEXT (nullable, added in migration 20251202120000)
- `price` NUMERIC(10, 2) (legacy, may be null)
- `is_active` BOOLEAN DEFAULT true
- `created_at` TIMESTAMPTZ DEFAULT NOW()
- `updated_at` TIMESTAMPTZ DEFAULT NOW()

**Note:** Products are now in a master catalogue. Business-specific pricing/overrides are in `business_products` table.

**Indexes:**
- `idx_products_business_id` on `business_id` (if exists, legacy)

### `business_products` (Business-Product Junction Table)
- `id` UUID PK DEFAULT gen_random_uuid()
- `business_id` UUID FK → REFERENCES `businesses(id)` ON DELETE CASCADE
- `product_id` UUID FK → REFERENCES `products(id)` ON DELETE CASCADE
- `title_override` TEXT (nullable, business-specific title)
- `description_override` TEXT (nullable, business-specific description)
- `price_from` NUMERIC(12,2) (minimum price for this product at this business)
- `price_to` NUMERIC(12,2) (nullable, maximum price)
- `currency_code` TEXT DEFAULT 'SCR'
- `duration_minutes` INTEGER (nullable)
- `is_active` BOOLEAN DEFAULT true
- `booking_url` TEXT (nullable)
- `notes` TEXT (nullable, conditions/offers)
- `created_at` TIMESTAMPTZ DEFAULT NOW()
- `updated_at` TIMESTAMPTZ DEFAULT NOW()
- UNIQUE (`business_id`, `product_id`)

**Indexes:**
- `idx_business_products_business_id` on `business_id`
- `idx_business_products_product_id` on `product_id`
- `idx_business_products_is_active` on `is_active` WHERE `is_active = true`

### `reviews`
- `id` UUID PK DEFAULT gen_random_uuid()
- `business_id` UUID FK → REFERENCES `businesses(id)` ON DELETE CASCADE
- `user_id` UUID FK → REFERENCES `profiles(id)` ON DELETE CASCADE
- `rating` INTEGER CHECK (rating >= 1 AND rating <= 5)
- `comment` TEXT
- `created_at` TIMESTAMPTZ DEFAULT NOW()

**Indexes:**
- `idx_reviews_business_id` on `business_id`
- `idx_reviews_user_id` on `user_id`

## RLS Policies Summary

### Profiles
- Self read: `id = auth.uid()`
- Self update: `id = auth.uid()`
- Self insert: `id = auth.uid()`
- Admins can view/update all

### Businesses
- Public read: `status = 'active'`
- Owner full access: `owner_id = auth.uid()`
- Admins full access

### Categories
- Public read: `true`
- Admins manage

### Business Categories
- Public read: `true`
- Owner write: via business ownership check
- Admins manage

### Products
- Public read: `true`
- Business owner write: via business ownership check
- Admins manage

### Reviews
- Public read: `true`
- User write: `user_id = auth.uid()`
- Admins manage

## Required Functions

### `handle_new_user()`
- Triggered on `auth.users` INSERT
- Creates profile with `id = NEW.id`
- Must use `SECURITY DEFINER`

### `trigger_set_timestamp()`
- Updates `updated_at` column
- Used by triggers on `businesses`, `products`, `profiles`

## Required Triggers

1. `handle_new_user` on `auth.users` AFTER INSERT
2. `set_timestamp` on `businesses` BEFORE UPDATE
3. `set_timestamp` on `products` BEFORE UPDATE
4. `set_timestamp` on `profiles` BEFORE UPDATE

## Migration Guidelines

1. **Before creating a migration:**
   - Check this file for schema constraints
   - Verify the change doesn't violate any rules above
   - Test in development environment

2. **Migration naming:**
   - Format: `YYYYMMDDHHMMSS_description.sql`
   - Use descriptive names

3. **Idempotency:**
   - All migrations MUST be idempotent
   - Use `IF NOT EXISTS` / `IF EXISTS` checks
   - Use `DO $$` blocks for conditional logic

4. **RLS:**
   - Always test RLS policies after schema changes
   - Document any policy changes in migration comments

## Prohibited Actions

❌ Dropping `profiles` table  
❌ Adding `user_id` column to `profiles`  
❌ Changing `profiles.id` structure  
❌ Dropping foreign key constraints without migration plan  
❌ Modifying RLS policies without testing  
❌ Creating duplicate tables  
❌ Removing required columns without deprecation period  

## Approval Required For

- Any table drops
- Column removals
- Foreign key constraint changes
- RLS policy modifications
- Trigger modifications
- Function modifications

## Contact

For schema changes, contact the project maintainer and provide:
1. Reason for change
2. Impact analysis
3. Migration plan
4. Rollback plan
5. Testing plan

