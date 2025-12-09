# TEST: Manual Test Checklist

## Pre-Migration Verification

Before running the migration, verify current state:

- [ ] **Database Connection**: Can connect to Supabase
- [ ] **Business Count**: Note current number of businesses
  ```sql
  SELECT COUNT(*) FROM businesses;
  ```
- [ ] **Current Errors**: Check browser console for existing errors
- [ ] **Environment Variables**: Verify `.env` or `.env.local` has:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Post-Migration Verification

### 1. Database Schema Verification

Run these SQL queries in Supabase SQL Editor:

- [ ] **Tables Exist**:
  ```sql
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN ('categories', 'businesses', 'products', 'business_products');
  ```
  Expected: All 4 tables should exist

- [ ] **Categories Table Structure**:
  ```sql
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'categories' 
    AND column_name IN ('id', 'title', 'slug', 'is_active', 'description');
  ```
  Expected: All columns should exist, `title` should be present (not just `name`)

- [ ] **Businesses Table Structure**:
  ```sql
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'businesses' 
    AND column_name IN ('id', 'title', 'category_id', 'is_verified', 'is_active');
  ```
  Expected: All columns should exist, `title` should be present (not just `name`)

- [ ] **Products Table Structure**:
  ```sql
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'products' 
    AND column_name IN ('id', 'title', 'business_id', 'is_active');
  ```
  Expected: All columns should exist, `title` should be present (not just `name`)

- [ ] **Data Preservation**:
  ```sql
  SELECT COUNT(*) as business_count FROM businesses;
  ```
  Expected: Count should match pre-migration count (or be greater if seed data was added)

- [ ] **Sample Data Check**:
  ```sql
  SELECT id, title, category_id, is_verified, is_active 
  FROM businesses 
  LIMIT 5;
  ```
  Expected: Should return businesses with `title` field populated

### 2. TypeScript Types Verification

- [ ] **Types File Exists**: 
  ```bash
  ls -la src/types/database.types.ts
  ```
  Expected: File should exist

- [ ] **Types File Content**: 
  ```bash
  head -50 src/types/database.types.ts
  ```
  Expected: Should contain `Database` interface with `categories`, `businesses`, `products` tables

- [ ] **TypeScript Compilation**:
  ```bash
  npm run tsc --noEmit
  ```
  Expected: No type errors

### 3. Development Server Test

- [ ] **Start Dev Server**:
  ```bash
  npm run dev
  ```
  Expected: Server starts without errors

- [ ] **Server URL**: Navigate to http://localhost:5173 (or configured port)
  Expected: Page loads without errors

### 4. Home Page Test

- [ ] **Page Loads**: Homepage renders without errors
- [ ] **Browser Console**: Open DevTools (F12) → Console tab
  - [ ] No "column does not exist" errors (42703)
  - [ ] No "relation does not exist" errors
  - [ ] No TypeScript errors
- [ ] **Network Tab**: Check Supabase API calls
  - [ ] Requests return 200 status
  - [ ] Response data contains expected fields (`title`, `category_id`, etc.)

### 5. Category Grid Test

- [ ] **Categories Display**: Category grid shows categories (if any exist)
- [ ] **Category Names**: Categories display with `title` field (not `name`)
- [ ] **No Errors**: No console errors when loading categories
- [ ] **Query Verification**: Check network request to `categories` table
  - [ ] Request uses `select('id, title, slug, ...')`
  - [ ] Response contains `title` field

### 6. Business Listings Test

- [ ] **Navigate to Directory**: Go to `/directory` or business listing page
- [ ] **Businesses Load**: Businesses display correctly
- [ ] **Category Names**: Business listings show category names (from JOIN with categories)
- [ ] **No Errors**: No "column does not exist" errors in console
- [ ] **Query Verification**: Check network request to `businesses` table
  - [ ] Request uses `select('id, title, category_id, ...')`
  - [ ] Request includes JOIN: `categories (id, title, slug)`
  - [ ] Response contains `title` and `category_id` fields

### 7. Business Detail Page Test

- [ ] **Navigate to Business**: Click on a business from listings
- [ ] **Page Loads**: Business detail page renders
- [ ] **Business Data**: Business information displays correctly
- [ ] **Category Display**: Category name displays (from JOIN)
- [ ] **No Errors**: No console errors

### 8. Admin Panel Test (If Implemented)

- [ ] **Navigate to Admin**: Go to `/admin` or admin route
- [ ] **Business Manager Loads**: Admin business manager component renders
- [ ] **Business List**: Businesses display in admin table
- [ ] **Status Badges**: Status badges work correctly (computed from `is_verified`)
- [ ] **Category Filter**: Category filter works (uses `category_id`)
- [ ] **No Errors**: No console errors

### 9. Search Functionality Test

- [ ] **Search Bar**: Use search functionality (if implemented)
- [ ] **Business Search**: Search for businesses by name
  - [ ] Results return correctly
  - [ ] No "column does not exist" errors
- [ ] **Product Search**: Search for products (if implemented)
  - [ ] Results return correctly
  - [ ] No errors

### 10. Error Monitoring

Monitor for these specific errors:

- [ ] **42703 Error**: "column does not exist"
  - Expected: Should NOT appear after migration
- [ ] **42P01 Error**: "relation does not exist"
  - Expected: Should NOT appear
- [ ] **400 Error**: Bad request
  - Expected: Should NOT appear for valid queries
- [ ] **Type Errors**: TypeScript type mismatches
  - Expected: Should NOT appear after type regeneration

### 11. Data Integrity Check

- [ ] **Business Count**: Verify business count matches pre-migration
  ```sql
  SELECT COUNT(*) FROM businesses;
  ```
- [ ] **Category Relationships**: Verify businesses have valid category_id
  ```sql
  SELECT COUNT(*) 
  FROM businesses b
  LEFT JOIN categories c ON b.category_id = c.id
  WHERE b.category_id IS NOT NULL AND c.id IS NULL;
  ```
  Expected: Should return 0 (no orphaned category_id references)

- [ ] **Product Relationships**: Verify products have valid business_id
  ```sql
  SELECT COUNT(*) 
  FROM products p
  LEFT JOIN businesses b ON p.business_id = b.id
  WHERE p.business_id IS NOT NULL AND b.id IS NULL;
  ```
  Expected: Should return 0 (no orphaned business_id references)

## Success Criteria Summary

✅ All database tables exist with correct column names  
✅ All existing business data preserved  
✅ TypeScript types regenerated and match schema  
✅ Home page loads without errors  
✅ Category grid displays correctly  
✅ Business listings show correct data with category names  
✅ No "column does not exist" (42703) errors  
✅ No TypeScript compilation errors  
✅ Admin panel works (if implemented)  
✅ Search functionality works  
✅ Data integrity maintained (no orphaned foreign keys)  

## If Tests Fail

1. **Check Migration Applied**: Verify migration ran successfully in Supabase
2. **Check Types**: Regenerate types: `npm run gen:types`
3. **Check Console**: Look for specific error messages
4. **Check Network**: Verify API requests use correct field names
5. **Rollback if Needed**: Use backup or reverse migration

## Test Results Log

Date: _______________  
Tester: _______________  
Migration Applied: [ ] Yes [ ] No  
All Tests Passed: [ ] Yes [ ] No  

Notes:
_________________________________________________
_________________________________________________
_________________________________________________
