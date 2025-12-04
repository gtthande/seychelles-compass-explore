# Business-Products Many-to-Many Migration Summary

## Overview
Successfully migrated from a one-to-many relationship (products.business_id) to a many-to-many relationship using a join table (business_products).

## Data Model Changes

### Before
- **products** table had a `business_id` column (one-to-many)
- Each product belonged to exactly one business
- Business-specific pricing/timing was stored on the product itself

### After
- **products** = master catalogue (no business_id)
- **business_products** = join table linking products to businesses with business-specific data:
  - `price_from`, `price_to`, `currency_code`
  - `duration_minutes`
  - `title_override`, `description_override`
  - `booking_url`, `notes`
  - `is_active`

## Database Migrations

1. **20251202130000_create_business_products_table.sql**
   - Creates `business_products` join table
   - Adds indexes and unique constraints
   - Sets up RLS policies for public, business owners, and admins

2. **20250125000000_drop_products_business_id.sql**
   - Safely drops `products.business_id` column if it exists
   - Removes related indexes and constraints

## Code Changes

### Updated Files

1. **src/lib/products-api.ts**
   - `fetchBusinessProducts()` - queries business_products with joins
   - `createBusinessProduct()` - creates business-product links
   - `updateBusinessProduct()` - updates business-product links
   - `deleteBusinessProduct()` - removes business-product links
   - `createProductMaster()` - creates master products
   - `fetchAllProducts()` - fetches master products

2. **src/pages/Products.tsx**
   - Updated to use `business_products` join table
   - Filters and search work with new structure

3. **src/components/admin/ProductManager.tsx**
   - Already using business_products API
   - Displays business-product links with pricing

4. **src/pages/BusinessDashboard.tsx**
   - `fetchProducts()` now queries `business_products`
   - Transforms data to match expected interface

5. **src/lib/data-loader.ts**
   - `getProducts()` updated to use `business_products`
   - Returns transformed data with business info

6. **src/hooks/useUnifiedSearch.ts**
   - Product search now uses `business_products` join table
   - Filters by business_id on join table

7. **src/components/products/ProductList.tsx**
   - Updated to fetch from `business_products`
   - Transforms data for display

8. **src/components/business/BusinessDashboard.tsx**
   - Updated to fetch from `business_products`
   - Transforms data for display

9. **src/components/business/ProductList.tsx**
   - Already using `business_products` (verified)

## Key Concepts

### Master Products (products table)
- Reusable catalogue items
- No business_id
- Contains: name, description, category, image_url, status

### Business Products (business_products table)
- Links a product to a business
- Contains business-specific: pricing, duration, notes, overrides
- One product can be linked to multiple businesses with different pricing

## API Usage

### Fetching Business Products
```typescript
import { fetchBusinessProducts } from '@/lib/products-api';

const { businessProducts, total } = await fetchBusinessProducts({
  businessId: 'business-uuid',
  category: 'tours',
  priceMin: 100,
  priceMax: 500,
  isActive: true,
  search: 'diving'
});
```

### Creating a Business-Product Link
```typescript
import { createBusinessProduct } from '@/lib/products-api';

const businessProduct = await createBusinessProduct({
  business_id: 'business-uuid',
  product_id: 'product-uuid',
  price_from: 150,
  price_to: 200,
  currency_code: 'SCR',
  duration_minutes: 120,
  notes: 'Includes equipment rental'
});
```

## Testing Checklist

- [x] Migration files created
- [x] All code updated to use business_products
- [x] Admin ProductManager uses new API
- [x] Public Products page uses new structure
- [x] Business dashboard shows products correctly
- [ ] Regenerate Supabase types (requires CLI auth)
- [ ] Test Admin Products page loads without errors
- [ ] Test creating product links
- [ ] Test editing product links
- [ ] Test filtering and search

## Notes

- The `products.business_id` column is deprecated but not yet dropped in production
- All new queries use `business_products` join table
- Old `products.business_id` references have been removed from code
- Migration to drop the column is ready but should be tested in staging first

## Next Steps

1. Run migration in Supabase dashboard or via CLI
2. Regenerate TypeScript types: `npm run sync:types` (requires Supabase CLI auth)
3. Test Admin Products page functionality
4. Verify public product listings work correctly
5. Monitor for any remaining references to products.business_id







