# TEST: Manual Testing Checklist

## Overview
After applying the schema migration, use this checklist to verify the application works correctly and no "column does not exist" errors appear.

## Prerequisites

- ✅ Migration applied to Supabase
- ✅ TypeScript types regenerated
- ✅ Dev server running: `npm run dev`

## Test 1: Home Page

### Steps:
1. Navigate to `http://localhost:5173`
2. Open browser DevTools (F12) → Console tab
3. Wait for page to load completely

### Expected Results:
- ✅ Homepage loads without errors
- ✅ No console errors (check for 42703 or 400 errors)
- ✅ Category grid displays (if categories exist in database)
- ✅ Category cards show business counts
- ✅ No "column does not exist" errors

### Verify:
```javascript
// In browser console, check:
// - No errors with code 42703
// - No errors mentioning "column does not exist"
// - Network tab shows 200 status for Supabase API calls
```

## Test 2: Category Grid

### Steps:
1. On homepage, locate the category grid component
2. Verify categories display with titles
3. Check that business counts appear on category cards
4. Click a category (if links are implemented)

### Expected Results:
- ✅ Categories display with `title` field (not `name`)
- ✅ Business counts are accurate
- ✅ No "column does not exist" errors in console
- ✅ Category cards are clickable (if implemented)

### Verify Database Query:
The category grid should query:
```sql
SELECT id, title, slug, description, is_active, created_at
FROM categories
WHERE is_active = true
ORDER BY title
```

## Test 3: Business Listings (Directory Page)

### Steps:
1. Navigate to `/directory`
2. Wait for businesses to load
3. Check browser console for errors
4. Verify business cards display correctly

### Expected Results:
- ✅ Businesses load correctly
- ✅ Category names display (from JOIN with categories table)
- ✅ Business titles display correctly
- ✅ No 400/42703 errors in console
- ✅ Business cards show correct information

### Verify Database Query:
The directory should query:
```sql
SELECT 
  id, title, description, category_id,
  phone, email, website, address,
  is_active, searchable, slug, image_url,
  created_at, updated_at,
  categories (id, title, slug)
FROM businesses
LEFT JOIN categories ON businesses.category_id = categories.id
WHERE is_active = true
ORDER BY created_at DESC
```

## Test 4: Admin Panel

### Steps:
1. Navigate to `/admin` (if implemented)
2. Open Business Manager component
3. Verify businesses display in table
4. Check status badges
5. Verify category names display

### Expected Results:
- ✅ Business manager loads without errors
- ✅ Businesses display with correct fields (`title`, `category_id`, etc.)
- ✅ Status badges work (computed from `is_verified` + `is_active`)
- ✅ Category names display correctly (from JOIN)
- ✅ No console errors

### Verify Status Computation:
Status should be computed as:
- `status = !is_active ? 'pending' : is_verified ? 'active' : 'pending'`

## Test 5: Search Functionality

### Steps:
1. Navigate to search page or use search component
2. Enter a search term
3. Verify results display
4. Check browser console

### Expected Results:
- ✅ Search results load correctly
- ✅ Businesses match search term
- ✅ No "column does not exist" errors
- ✅ Results show correct fields

### Verify Search Query:
Search should query:
```sql
SELECT ... FROM businesses
WHERE title ILIKE '%search%' 
   OR description ILIKE '%search%'
AND is_active = true
```

## Test 6: Network Tab Verification

### Steps:
1. Open browser DevTools (F12) → Network tab
2. Filter by "Fetch/XHR"
3. Navigate through the app
4. Check Supabase API calls

### Expected Results:
- ✅ All Supabase API calls return 200 status
- ✅ Response data contains expected fields:
  - `title` (not `name`)
  - `category_id` (not `category`)
  - `is_verified` (not `status`)
- ✅ No 400 or 42703 error responses

## Test 7: TypeScript Compilation

### Steps:
1. Run TypeScript compiler:
   ```bash
   npx tsc --noEmit
   ```

### Expected Results:
- ✅ No TypeScript compilation errors
- ✅ All types match database schema
- ✅ No "Property does not exist" errors

## Test 8: Console Error Monitoring

### Steps:
1. Keep browser console open (F12)
2. Navigate through all major pages:
   - Homepage
   - Directory
   - Admin panel
   - Business detail pages
3. Monitor for errors

### Expected Results:
- ✅ No "column does not exist" (42703) errors
- ✅ No "relation does not exist" errors
- ✅ No TypeScript type errors
- ✅ No 400 Bad Request errors

## Common Issues and Solutions

### Issue: "Column does not exist" errors persist
**Solution:**
1. Verify migration was applied: Check Supabase SQL Editor → Run:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'businesses' AND column_name = 'title';
   ```
2. Clear browser cache and restart dev server
3. Verify types were regenerated: Check `src/integrations/supabase/types.ts` has content

### Issue: Categories don't display
**Solution:**
1. Check database has categories:
   ```sql
   SELECT * FROM categories WHERE is_active = true;
   ```
2. Verify `title` field exists and has values
3. Check browser console for specific error messages

### Issue: Business counts are wrong
**Solution:**
1. Verify `category_id` is set correctly on businesses:
   ```sql
   SELECT id, title, category_id FROM businesses LIMIT 5;
   ```
2. Check that JOIN is working correctly in queries

### Issue: Status badges don't work
**Solution:**
1. Verify `is_verified` and `is_active` columns exist:
   ```sql
   SELECT id, title, is_verified, is_active FROM businesses LIMIT 5;
   ```
2. Check status computation logic in BusinessManager component

## Success Criteria

✅ All tests pass without errors
✅ No "column does not exist" errors in console
✅ All pages load correctly
✅ Data displays correctly
✅ TypeScript compilation succeeds
✅ Network requests return 200 status

## Next Steps After Testing

If all tests pass:
1. ✅ Product creation UI can be added next
2. ✅ Continue with feature development
3. ✅ Monitor for any edge cases

If tests fail:
1. Review error messages
2. Check migration was applied correctly
3. Verify types were regenerated
4. Check database schema matches expectations
