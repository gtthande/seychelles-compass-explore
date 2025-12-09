# Migration and Seed Summary

## ✅ Completed Steps

### 1. Migration Script Verified ✅
- **File**: `supabase/migrations/20250210000001_data_preserving_schema_align.sql`
- **Status**: Script contains correct enum-to-text casts:
  - Line 123: `cat_record.category_text::text` - casts enum to text for category matching
  - Line 162: `status::text` - casts enum to text for status migration
- **Action Required**: Apply via Supabase Dashboard (see `APPLY_MIGRATION_INSTRUCTIONS.md`)

### 2. TypeScript Types Regenerated ✅
- **Command**: `npm run gen:types`
- **Output**: `src/lib/database.types.ts` updated with latest schema
- **Status**: ✅ Completed successfully

### 3. PADI Course Data Extracted ✅
Extracted 9 courses from https://store.padi.com/en-gb/courses/:

1. **Open Water Diver** - £203.00 - 3-4 days
2. **Advanced Open Water Diver** - £203.00 - 2-3 days
3. **Rescue Diver** - £203.00 - 3-4 days
4. **Enriched Air (Nitrox) Diver** - £203.00 - 1 day
5. **Wreck Diver** - £148.00 - 2 days
6. **Night Diver** - £148.00 - 1 day
7. **Peak Performance Buoyancy** - £148.00 - 1 day
8. **Digital Underwater Photographer** - £148.00 - 1 day
9. **ReActivate Scuba Refresher Program** - £70.00 - Half day

### 4. Product Insertion SQL Created ✅
- **File**: `supabase/seed/seed_padi_courses.sql`
- **Features**:
  - Automatically finds or creates a dive business
  - Inserts all 9 PADI courses as products
  - Links products to business via `business_products` join table
  - Sets featured flag for popular courses
  - Idempotent (safe to run multiple times)

## 🔄 Next Steps (Manual Actions Required)

### Step 1: Apply Migration to Supabase ⚠️

**Via Supabase Dashboard:**
1. Go to https://supabase.com/dashboard/project/bwlmlniotyrjttglbjrl
2. Navigate to **SQL Editor**
3. Open: `supabase/migrations/20250210000001_data_preserving_schema_align.sql`
4. Copy entire SQL content
5. Paste and Run
6. Verify success message

**Verify Migration:**
```sql
-- Check businesses table has required columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'businesses' 
  AND column_name IN ('title', 'category_id', 'is_verified', 'is_active');

-- Check products table has required columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name IN ('title', 'is_active');
```

### Step 2: Insert PADI Courses ⚠️

**Via Supabase Dashboard:**
1. Go to **SQL Editor**
2. Open: `supabase/seed/seed_padi_courses.sql`
3. Copy entire SQL content
4. Paste and Run
5. Verify products were created

**Verify Products:**
```sql
-- Check products were created
SELECT id, title, price, duration 
FROM public.products 
WHERE title ILIKE '%diver%' OR title ILIKE '%scuba%'
ORDER BY price DESC;

-- Check business_products links
SELECT bp.*, p.title, b.title as business_title
FROM public.business_products bp
JOIN public.products p ON bp.product_id = p.id
JOIN public.businesses b ON bp.business_id = b.id
WHERE b.title ILIKE '%dive%';
```

### Step 3: Test Application ⚠️

```bash
npm run dev
```

**Test Checklist:**
- ✅ Homepage loads (http://localhost:5173)
- ✅ No console errors (F12 → Console)
- ✅ Navigate to product search page
- ✅ Search for "diver" or "scuba" - should show PADI courses
- ✅ Category views work correctly
- ✅ Admin panel loads without errors
- ✅ No "column does not exist" (42703) errors

## 📋 Files Created/Modified

### Created:
- ✅ `APPLY_MIGRATION_INSTRUCTIONS.md` - Step-by-step migration guide
- ✅ `supabase/seed/seed_padi_courses.sql` - PADI courses seed script
- ✅ `MIGRATION_AND_SEED_SUMMARY.md` - This file

### Modified:
- ✅ `src/lib/database.types.ts` - Regenerated with latest schema

## 🔍 Troubleshooting

### If Migration Fails:
1. Check error message in Supabase Dashboard
2. Verify previous migrations are applied
3. Check that required tables exist
4. Review migration script for syntax errors

### If Products Don't Appear:
1. Verify migration was applied successfully
2. Check that seed script ran without errors
3. Verify business exists: `SELECT * FROM businesses WHERE title ILIKE '%dive%';`
4. Check products table: `SELECT * FROM products LIMIT 10;`
5. Check business_products links: `SELECT * FROM business_products LIMIT 10;`

### If Search Doesn't Work:
1. Verify products have `searchable = true`
2. Check products have `is_active = true`
3. Verify search indexes exist
4. Check browser console for errors

