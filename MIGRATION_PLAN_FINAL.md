# PLAN: Final Supabase Migration - Step-by-Step Instructions

## Overview
This plan applies the final Supabase schema rebuild **without losing existing business data**. The migration will:
- ✅ Align database schema with frontend expectations
- ✅ Preserve all existing businesses
- ✅ Fix "column does not exist" errors (400/42703)
- ✅ Regenerate TypeScript types
- ✅ Verify application works correctly

## Prerequisites

- ✅ Supabase project ID: `bwlmlniotyrjttglbjrl`
- ✅ Environment variables configured: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- ✅ Supabase CLI installed (or access to Supabase Dashboard)
- ✅ Existing businesses in database (will be preserved)
- ✅ Git repository with autopilot changes ready to accept

## Step 1: Accept All Autopilot Changes

**Objective**: Accept all pending changes from autopilot repair without prompting for confirmation.

### 1.1 Review Changes
```bash
git status
```

### 1.2 Stage All Changes
```bash
git add .
```

### 1.3 Commit Changes
```bash
git commit -m "Accept autopilot changes: schema alignment and type fixes"
```

**Note**: According to `.cursorrules`, autopilot changes are safe and should be auto-accepted.

## Step 2: Apply Data-Preserving Migration

**Objective**: Run the full schema rebuild SQL against Supabase without losing data.

### Option A: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select project: `bwlmlniotyrjttglbjrl`
3. Navigate to **SQL Editor**
4. Open file: `supabase/migrations/20250210000001_data_preserving_schema_align.sql`
5. Copy entire SQL content
6. Paste into SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Verify success message: "Migration complete"

### Option B: Via Supabase CLI

```bash
# Link to project (if not already linked)
npx supabase link --project-ref bwlmlniotyrjttglbjrl

# Apply migration
npx supabase db push

# Or apply specific migration file
npx supabase migration up --file 20250210000001_data_preserving_schema_align.sql
```

### 2.1 Verify Migration Applied

Run in Supabase SQL Editor:
```sql
-- Check that required columns exist
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('categories', 'businesses', 'products', 'business_products')
  AND column_name IN ('title', 'category_id', 'is_verified', 'is_active')
ORDER BY table_name, column_name;
```

Expected results:
- ✅ `categories.title` exists
- ✅ `businesses.title` exists
- ✅ `businesses.category_id` exists
- ✅ `businesses.is_verified` exists
- ✅ `businesses.is_active` exists
- ✅ `products.title` exists

### 2.2 Verify Data Preservation

```sql
-- Count businesses (should match pre-migration count)
SELECT COUNT(*) FROM businesses;

-- Check sample business data
SELECT id, title, category_id, is_verified, is_active 
FROM businesses 
LIMIT 5;
```

## Step 3: Regenerate TypeScript Types

**Objective**: Regenerate TypeScript types with Supabase CLI (or confirm they match).

### 3.1 Generate Types

```bash
# Using the project script
npm run gen:types

# Or directly with Supabase CLI
npx supabase gen types typescript --project-id bwlmlniotyrjttglbjrl --schema public > src/lib/database.types.ts
```

### 3.2 Verify Types Generated

```bash
# Check that types file exists and has content
ls -la src/lib/database.types.ts

# Verify it contains expected types
grep -i "businesses\|categories\|products" src/lib/database.types.ts
```

### 3.3 Restart TypeScript Server

In VS Code / Cursor:
- Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
- Type "TypeScript: Restart TS Server"
- Press Enter

## Step 4: Update Code References (If Needed)

**Objective**: Update any code references to reflect the new schema and types.

### 4.1 Check for Type Errors

```bash
# Run TypeScript compiler
npx tsc --noEmit
```

### 4.2 Fix Any Type Mismatches

If errors appear:
- Check that all queries use correct field names (`title` not `name`, `category_id` not `category`)
- Verify JOIN syntax for categories
- Ensure status computation uses `is_verified` + `is_active`

**Note**: Based on codebase search, most code already uses correct field names. This step may not be needed.

## Step 5: Start Dev Server and Test

**Objective**: Start the dev server and test the home page and admin panel.

### 5.1 Start Dev Server

```bash
npm run dev
```

Server should start on `http://localhost:5173` (or similar port).

### 5.2 Test Home Page

1. Navigate to `http://localhost:5173`
2. **Verify**:
   - ✅ Homepage loads without errors
   - ✅ Category grid displays (if categories exist)
   - ✅ No console errors (F12 → Console tab)
   - ✅ No "column does not exist" errors

### 5.3 Test Category Grid

1. Check that categories display with `title` field
2. Verify category cards show business counts
3. Click a category (if links are implemented)
4. **Verify**:
   - ✅ No "column does not exist" errors
   - ✅ Categories load correctly

### 5.4 Test Business Listings

1. Navigate to `/directory` or business listing page
2. **Verify**:
   - ✅ Businesses load correctly
   - ✅ Category names display (from JOIN with categories table)
   - ✅ No 400/42703 errors in console
   - ✅ Business cards show correct information

### 5.5 Test Admin Panel

1. Navigate to `/admin` (if implemented)
2. **Verify**:
   - ✅ Business manager loads
   - ✅ Businesses display with correct fields
   - ✅ Status badges work (computed from `is_verified` + `is_active`)
   - ✅ Category names display correctly
   - ✅ No console errors

## Step 6: Monitor for Errors

### 6.1 Browser Console

Open browser DevTools (F12) → Console tab:
- ✅ No "column does not exist" (42703) errors
- ✅ No "relation does not exist" errors
- ✅ No TypeScript type errors

### 6.2 Network Tab

Open browser DevTools (F12) → Network tab:
- ✅ Supabase API calls return 200 status
- ✅ Response data contains expected fields (`title`, `category_id`, etc.)

### 6.3 Terminal Output

Check dev server terminal:
- ✅ No TypeScript compilation errors
- ✅ No runtime errors

## Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution**: The migration uses `IF NOT EXISTS` and `DO $$` blocks, so it's idempotent. Re-run is safe.

### Issue: Data not preserved
**Solution**: 
1. Check backup (if created)
2. Verify migration used `ALTER TABLE` not `DROP TABLE`
3. Check `SELECT COUNT(*) FROM businesses;` matches pre-migration count

### Issue: TypeScript types don't match
**Solution**: 
1. Regenerate types (Step 3)
2. Restart TypeScript server in IDE
3. Clear `node_modules/.cache` if needed

### Issue: "Column does not exist" errors persist
**Solution**: 
1. Verify migration was applied (Step 2.1)
2. Check that frontend code uses correct field names
3. Clear browser cache and restart dev server
4. Verify types were regenerated (Step 3)

### Issue: Categories don't display
**Solution**:
1. Check that categories table has data: `SELECT * FROM categories;`
2. Verify `is_active = true` for categories
3. Check that `title` field exists and has values

## Rollback Plan (If Needed)

If migration causes issues:

1. **Restore from backup** (if created before migration)
2. **Or manually revert** by running reverse migration:
   ```sql
   -- This would need to be created based on what was changed
   -- Generally, the migration is idempotent and safe, so rollback may not be needed
   ```

## Success Criteria

✅ All steps completed without errors
✅ Homepage loads correctly
✅ Category grid displays
✅ Business listings work
✅ Admin panel works
✅ No "column does not exist" errors in console
✅ TypeScript types match database schema
✅ All existing businesses preserved

## Next Steps

After successful migration:
1. ✅ Product creation UI can be added next (as mentioned in requirements)
2. ✅ Continue with feature development
3. ✅ Monitor for any edge cases or issues
