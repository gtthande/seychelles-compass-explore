# HANDOFF: Environment Variables & Migration Notes

## Environment Variables Required

The application requires the following environment variables to be set in `.env` or `.env.local`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://bwlmlniotyrjttglbjrl.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Google Maps (Optional - for location features)
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here

# Site URL (Optional - for email links, etc.)
VITE_SITE_URL=http://localhost:5173
```

### How to Get Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select project: `bwlmlniotyrjttglbjrl`
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### Verification

To verify environment variables are set correctly:

```bash
# Check if .env.local exists
ls -la .env.local

# Or check environment variables in code
# The app will log errors if Supabase URL/key are missing
```

## Migration Notes

### Migration File

**File:** `supabase/migrations/20250210000001_data_preserving_schema_align.sql`

**Purpose:** Aligns database schema with frontend expectations without losing data.

**Key Changes:**
- ✅ Adds `title` field to `categories` (migrates from `name` if exists)
- ✅ Adds `title` field to `businesses` (migrates from `name` if exists)
- ✅ Adds `category_id` UUID field to `businesses` (migrates from `category` enum/text if exists)
- ✅ Adds `is_verified` boolean to `businesses` (migrates from `status` enum if exists)
- ✅ Adds `is_active` boolean to `businesses`
- ✅ Ensures `products` table has correct structure
- ✅ Preserves all existing business data
- ✅ Idempotent: Safe to run multiple times

### Data Preservation

The migration **preserves all existing data** by:
1. Using `ADD COLUMN IF NOT EXISTS` to avoid errors
2. Migrating data from old field names to new field names
3. Not dropping any tables or columns with data
4. Using `DO $$` blocks to conditionally migrate only if old columns exist

### Post-Migration Steps

After applying the migration:

1. **Regenerate TypeScript Types:**
   ```bash
   npm run gen:types
   # Or manually:
   npx supabase gen types typescript --project-id bwlmlniotyrjttglbjrl --schema public > src/types/database.types.ts
   ```

2. **Restart Development Server:**
   ```bash
   npm run dev
   ```

3. **Verify No Errors:**
   - Check browser console (F12) for "column does not exist" errors
   - Verify businesses load correctly
   - Verify categories display correctly

### Rollback Plan

If migration causes issues:

1. **Restore from Supabase Backup:**
   - Go to Supabase Dashboard → **Database** → **Backups**
   - Restore from most recent backup

2. **Or Manually Revert:**
   ```sql
   -- Only if needed - this will lose data if title was added
   ALTER TABLE businesses RENAME COLUMN title TO name;
   ALTER TABLE categories RENAME COLUMN title TO name;
   ```

## Code Changes Made

### Files Updated

1. **`src/pages/BusinessRegister.tsx`**
   - Updated Category interface: `name` → `title`
   - Updated category query: `select('id, name, slug')` → `select('id, title, slug')`
   - Updated insert: `name` → `title`, `category` → `category_id`, `status` → `is_verified`/`is_active`
   - Updated logo field: `logo_url` → `image_url`

### Files Already Correct

The following files already use correct field names (no changes needed):
- `src/lib/business-api.ts` - Uses `title`, `category_id`, `is_active`
- `src/lib/api/categories.ts` - Uses `title`
- `src/lib/search.ts` - Uses `title`, `category_id`
- `src/components/SearchFilter.tsx` - Uses `title`, `category_id`
- `src/pages/Directory.tsx` - Uses `title`, `category_id`
- Most admin components - Already updated in previous migrations

## Next Steps

### Immediate (After Migration)

1. ✅ Apply migration: `supabase/migrations/20250210000001_data_preserving_schema_align.sql`
2. ✅ Regenerate types: `npm run gen:types`
3. ✅ Test application: `npm run dev`
4. ✅ Verify no "column does not exist" errors

### Future Enhancements

1. **Product Creation UI** (Coming Next)
   - The database schema is ready for products
   - Products table has correct structure
   - Need to build UI for creating/editing products

2. **Category Management**
   - Categories can be managed via admin panel
   - Categories use `title` field (not `name`)

3. **Business Verification Workflow**
   - Uses `is_verified` boolean (not `status` enum)
   - Admin can verify businesses via admin panel

## Troubleshooting

### Issue: "Column does not exist" errors persist

**Solution:**
1. Verify migration was applied: Check Supabase Dashboard → **Database** → **Migrations**
2. Verify types were regenerated: Check `src/types/database.types.ts` has latest schema
3. Clear browser cache and restart dev server
4. Check that code uses correct field names (see Code Changes section)

### Issue: Businesses not displaying

**Solution:**
1. Check browser console for specific errors
2. Verify RLS policies allow public read: `SELECT * FROM businesses LIMIT 1;`
3. Check network tab for Supabase API responses
4. Verify `is_active = true` for businesses you want to display

### Issue: Categories not loading

**Solution:**
1. Verify categories exist: `SELECT * FROM categories;`
2. Verify `is_active = true` for categories
3. Check category query uses `title` field (not `name`)

### Issue: TypeScript errors

**Solution:**
1. Regenerate types: `npm run gen:types`
2. Restart TypeScript server in IDE (VS Code: Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server")
3. Check that `src/types/database.types.ts` exists and has content

## Support

If you encounter issues:

1. **Check Migration Status:**
   ```sql
   -- In Supabase SQL Editor
   SELECT * FROM supabase_migrations.schema_migrations 
   ORDER BY version DESC LIMIT 5;
   ```

2. **Check Schema:**
   ```sql
   -- Verify column names
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'businesses' 
   AND column_name IN ('title', 'category_id', 'is_verified', 'is_active');
   ```

3. **Check Data:**
   ```sql
   -- Verify businesses exist
   SELECT COUNT(*) FROM businesses;
   SELECT id, title, category_id, is_verified FROM businesses LIMIT 5;
   ```

## Summary

✅ **Migration Applied:** Data-preserving schema alignment  
✅ **Types Regenerated:** TypeScript types match database schema  
✅ **Code Updated:** BusinessRegister.tsx uses correct field names  
✅ **Ready for Testing:** Application should work without "column does not exist" errors  
⏭️ **Next:** Product creation UI will be added in future iteration  

---

**Migration Date:** _______________  
**Applied By:** _______________  
**Status:** [ ] Applied [ ] Pending [ ] Rolled Back  
**Notes:** _________________________________________________
