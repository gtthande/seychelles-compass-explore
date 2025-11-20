# Business-Products Many-to-Many Model

## Overview

The product system has been refactored from a one-to-many relationship (`products.business_id`) to a many-to-many relationship using a join table (`business_products`).

## Data Model

### `products` (Master Catalogue)
- **Purpose**: Reusable master product catalogue items
- **Key Fields**: `id`, `name`, `title`, `description`, `category`, `image_url`, `status`, `searchable`
- **Note**: Does NOT contain `business_id` (removed/deprecated)

### `business_products` (Join Table)
- **Purpose**: Links products to businesses with business-specific pricing, timing, and offers
- **Key Fields**:
  - `id` - Primary key
  - `business_id` - References `businesses(id)`
  - `product_id` - References `products(id)`
  - `title_override` - Optional custom title for this business
  - `description_override` - Optional custom description
  - `price_from` - Minimum price (required)
  - `price_to` - Maximum price (optional)
  - `currency_code` - Currency (default: 'SCR')
  - `duration_minutes` - Duration in minutes
  - `is_active` - Visibility flag
  - `booking_url` - Deep link to booking page
  - `notes` - Conditions/offers/small print
- **Constraints**: Unique constraint on `(business_id, product_id)` prevents duplicate links

## Migration

**File**: `supabase/migrations/20251202130000_create_business_products_table.sql`

This migration:
1. Creates the `business_products` table
2. Sets up indexes for performance
3. Creates RLS policies for public viewing and admin/business owner management
4. Does NOT drop `products.business_id` column (preserves existing data)

## API Changes

### New API Helper: `src/lib/products-api.ts`

**Functions**:
- `fetchBusinessProducts(params)` - Fetch business-product links with filters
- `createProductMaster(data)` - Create a new master product
- `createBusinessProduct(data)` - Link a product to a business
- `updateBusinessProduct(id, updates)` - Update a business-product link
- `deleteBusinessProduct(id)` - Remove a product from a business
- `fetchAllProducts()` - Get all master products (for dropdowns)

## UI Changes

### Admin Panel

**ProductManager** (`src/components/admin/ProductManager.tsx`):
- Now displays `business_products` joined with `products` and `businesses`
- Shows business-specific pricing, duration, and status
- Filters work against the join table

**ProductCreate** (`src/pages/admin/ProductCreate.tsx`):
- Two-step process:
  1. Create new master product OR select existing product
  2. Link product to business with business-specific configuration
- Tabs for "Create New Product" vs "Link Existing Product"

**ProductEdit** (`src/pages/admin/ProductEdit.tsx`):
- Edits `business_products` row (not master product)
- Shows master product info (read-only)
- Allows editing business-specific fields (price, duration, notes, etc.)

### Public Pages

**Products Page** (`src/pages/Products.tsx`):
- Queries `business_products` instead of `products`
- Displays business-specific pricing and information

**Search** (`src/lib/search.ts`):
- Updated to search `business_products` with joins
- Returns business location for products

**Category Grid** (`src/components/OptimizedCategoryGrid.tsx`):
- Updated product count query to use `business_products`

**Business Dashboard** (`src/components/business/ProductList.tsx`):
- Updated to fetch products via `business_products` for the logged-in business

## Key Benefits

1. **Reusability**: One master product can be linked to multiple businesses
2. **Flexibility**: Each business can have different pricing, duration, and conditions
3. **Scalability**: Easy to add more business-specific fields in the future
4. **Data Integrity**: Unique constraint prevents duplicate links

## Migration Path

- Existing `products.business_id` data is preserved but not used
- New queries use `business_products` exclusively
- Old data can be migrated later if needed

## Notes

- The `products.business_id` column still exists in the database but is deprecated
- All new code uses `business_products` exclusively
- RLS policies ensure proper access control
- The system is backward-compatible with existing master products

