# PLAN: Step-by-Step Migration Instructions

## Overview

This plan applies the final Supabase schema rebuild **without losing existing business data**. The migration will:
- Align database schema with frontend expectations
- Preserve all existing businesses
- Fix "column does not exist" errors (400/42703)
- Regenerate TypeScript types

## Prerequisites

- ✅ Supabase project ID: `bwlmlniotyrjttglbjrl`
- ✅ Environment variables configured: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- ✅ Supabase CLI installed (or access to Supabase Dashboard)
- ✅ Existing businesses in database (will be preserved)

## Step 1: Backup Current Data (Optional but Recommended)

**Via Supabase Dashboard:**
1. Go to https://supabase.com/dashboard
2. Select project: `bwlmlniotyrjttglbjrl`
3. Navigate to **Database** → **Backups**
4. Create a manual backup or note the automatic backup timestamp

**Via SQL (Export businesses):**
```sql
-- Run in Supabase SQL Editor
COPY (SELECT * FROM businesses) TO STDOUT WITH CSV HEADER;
-- Save output to businesses_backup.csv
```

## Step 2: Review Current Schema

**Check existing columns:**
```sql
-- Run in Supabase SQL Editor
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('categories', 'businesses', 'products', 'business_products')
ORDER BY table_name, ordinal_position;
```

**Note:** This helps identify which columns need to be migrated/renamed.

## Step 3: Apply Data-Preserving Migration

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard
2. Select project: `bwlmlniotyrjttglbjrl`
3. Navigate to **SQL Editor**
4. Open file: `supabase/migrations/20250210000001_data_preserving_schema_align.sql`
5. Copy entire SQL content
6. Paste into SQL Editor
7. Click **Run** (or press Ctrl+Enter)

**Option B: Via Supabase CLI**
```bash
# Link to project (if not already linked)
npx supabase link --project-ref bwlmlniotyrjttglbjrl

# Apply migration
npx supabase db push
```

**Option C: Via psql (Direct Database)**
```bash
psql -h db.bwlmlniotyrjttglbjrl.supabase.co -U postgres -d postgres \
  -f supabase/migrations/20250210000001_data_preserving_schema_align.sql
```

## Step 4: Verify Migration Success

**Check tables exist:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('categories', 'businesses', 'products', 'business_products');
```

**Check column names:**
```sql
-- Verify businesses table has correct columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'businesses' 
  AND column_name IN ('title', 'category_id', 'is_verified', 'is_active');

-- Verify categories table has 'title'
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'categories' 
  AND column_name = 'title';
```

**Check data preserved:**
```sql
-- Count businesses (should match pre-migration count)
SELECT COUNT(*) FROM businesses;

-- Sample businesses to verify data
SELECT id, title, category_id, is_verified FROM businesses LIMIT 5;
```

## Step 5: Regenerate TypeScript Types

**Using Supabase CLI:**
```bash
npx supabase gen types typescript \
  --project-id bwlmlniotyrjttglbjrl \
  --schema public > src/types/database.types.ts
```

**Alternative (if CLI not available):**
1. Go to Supabase Dashboard → **Settings** → **API**
2. Scroll to **TypeScript Types**
3. Copy generated types
4. Paste into `src/types/database.types.ts`

**Verify types file:**
```bash
# Check file exists and has content
cat src/types/database.types.ts | head -20
```

## Step 6: Start Development Server

```bash
npm run dev
```

**Expected behavior:**
- Server starts on http://localhost:5173 (or configured port)
- No TypeScript errors in console
- No "column does not exist" errors in browser console

## Step 7: Test Application

### 7.1 Test Home Page
1. Navigate to http://localhost:5173
2. Verify homepage loads without errors
3. Check browser console (F12) for any errors
4. Verify category grid displays (if categories exist)

### 7.2 Test Category Grid
1. Check that categories display with `title` field
2. Verify no "column does not exist" errors
3. Click a category (if links are implemented)

### 7.3 Test Business Listings
1. Navigate to `/directory` or business listing page
2. Verify businesses load correctly
3. Check that category names display (from JOIN with categories table)
4. Verify no 400/42703 errors in console

### 7.4 Test Admin Panel
1. Navigate to `/admin` (if implemented)
2. Verify business manager loads
3. Check that businesses display with correct fields
4. Verify status badges work (computed from `is_verified`)

## Step 8: Monitor for Errors

**Check browser console:**
- No "column does not exist" (42703) errors
- No "relation does not exist" errors
- No TypeScript type errors

**Check network tab:**
- Supabase API calls return 200 status
- Response data contains expected fields

## Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution:** The migration uses `IF NOT EXISTS` and `DO $$` blocks, so it's idempotent. Re-run is safe.

### Issue: Data not preserved
**Solution:** Check backup, then restore from backup if needed.

### Issue: TypeScript types don't match
**Solution:** Regenerate types (Step 5) and restart TypeScript server in IDE.

### Issue: "Column does not exist" errors persist
**Solution:** 
1. Verify migration was applied (Step 4)
2. Check that frontend code uses correct field names
3. Clear browser cache and restart dev server

## Rollback Plan (If Needed)

If migration causes issues:

1. **Restore from backup** (if created in Step 1)
2. **Or manually revert** by running reverse migration:
   ```sql
   -- Restore old column names (if needed)
   ALTER TABLE businesses RENAME COLUMN title TO name;
   ALTER TABLE categories RENAME COLUMN title TO name;
   -- etc.
   ```

## Success Criteria

✅ Migration applied without errors  
✅ All businesses preserved (count matches pre-migration)  
✅ TypeScript types regenerated  
✅ Home page loads without errors  
✅ Category grid displays correctly  
✅ Business listings show correct data  
✅ No "column does not exist" errors in console  
✅ Admin panel works correctly  
