# HANDOFF: Final Migration Handoff Document

## Overview
This document provides all necessary information for completing the Supabase schema migration, including environment variables, migration notes, and next steps.

## Environment Variables

### Required Variables

The following environment variables must be set in `.env`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://bwlmlniotyrjttglbjrl.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# Google Maps (if using maps)
VITE_GOOGLE_MAPS_API_KEY=<your-google-maps-key>

# Site URL
VITE_SITE_URL=http://localhost:5173
```

### How to Get Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select project: `bwlmlniotyrjttglbjrl`
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## Migration Notes

### Migration File
- **File**: `supabase/migrations/20250210000001_data_preserving_schema_align.sql`
- **Type**: Data-preserving (uses `ALTER TABLE`, not `DROP TABLE`)
- **Safety**: Idempotent (safe to run multiple times)
- **Data Loss**: None (preserves all existing businesses)

### Key Schema Changes

#### Field Name Mappings
| Old Field | New Field | Table |
|-----------|-----------|-------|
| `categories.name` | `categories.title` | categories |
| `businesses.name` | `businesses.title` | businesses |
| `businesses.category` | `businesses.category_id` | businesses |
| `businesses.status` | `businesses.is_verified` + `is_active` | businesses |
| `products.name` | `products.title` | products |

#### Removed Fields
- ❌ `products.category` (products don't have categories)
- ❌ `products.images` (JSONB) → `products.image_url` (TEXT)

### Migration Application

#### Option A: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select project: `bwlmlniotyrjttglbjrl`
3. Navigate to **SQL Editor**
4. Open file: `supabase/migrations/20250210000001_data_preserving_schema_align.sql`
5. Copy entire SQL content
6. Paste into SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Verify success: Should see "Migration complete" or similar

#### Option B: Via Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Link to project
npx supabase link --project-ref bwlmlniotyrjttglbjrl

# Apply migration
npx supabase db push
```

### Verification Queries

After applying migration, run these in Supabase SQL Editor to verify:

```sql
-- Check required columns exist
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('categories', 'businesses', 'products')
  AND column_name IN ('title', 'category_id', 'is_verified', 'is_active')
ORDER BY table_name, column_name;

-- Verify data preserved
SELECT COUNT(*) as business_count FROM businesses;
SELECT COUNT(*) as category_count FROM categories;

-- Check sample data
SELECT id, title, category_id, is_verified, is_active 
FROM businesses 
LIMIT 5;
```

## TypeScript Types Regeneration

### After Migration Applied

1. **Generate Types**:
   ```bash
   npm run gen:types
   ```

   Or manually:
   ```bash
   npx supabase gen types typescript --project-id bwlmlniotyrjttglbjrl --schema public > src/integrations/supabase/types.ts
   ```

2. **Restart TypeScript Server**:
   - In VS Code / Cursor: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

3. **Verify Types**:
   ```bash
   npx tsc --noEmit
   ```

### Types File Location
- **Primary**: `src/integrations/supabase/types.ts`
- **Client Import**: `@/types/supabase` (aliased in `tsconfig.json`)

## Code Status

### Already Updated
The following code has already been updated to use the new schema:
- ✅ `src/lib/business-api.ts` - Uses `title`, `category_id`
- ✅ `src/lib/api/categories.ts` - Uses `title`
- ✅ `src/pages/Directory.tsx` - Uses `title`, `category_id`, JOINs categories
- ✅ `src/components/admin/BusinessManager.tsx` - Uses `is_verified`, `is_active`
- ✅ `src/components/CategoryGrid.tsx` - Uses `title`
- ✅ `src/components/SearchFilter.tsx` - Uses correct field names

### No Code Changes Needed
Based on codebase analysis, all code already uses the correct field names. No additional code updates are required after applying the migration.

## Testing

### Manual Testing Checklist
See `MIGRATION_TEST_CHECKLIST_FINAL.md` for detailed testing steps.

### Quick Test
1. Start dev server: `npm run dev`
2. Navigate to homepage
3. Check browser console (F12) - no 42703 errors
4. Verify category grid displays
5. Navigate to `/directory` - verify businesses load

## Troubleshooting

### Issue: Types don't generate
**Solution**: 
- Ensure Supabase CLI is installed: `npm install -g supabase`
- Verify project ID is correct: `bwlmlniotyrjttglbjrl`
- Check network connection to Supabase

### Issue: Migration fails
**Solution**:
- Migration is idempotent, safe to re-run
- Check SQL Editor for specific error messages
- Verify you have admin access to the project

### Issue: "Column does not exist" errors persist
**Solution**:
1. Verify migration was applied (run verification queries)
2. Regenerate types
3. Clear browser cache
4. Restart dev server

## Next Steps

### Immediate
1. ✅ Apply migration to Supabase (see Migration Application above)
2. ✅ Regenerate TypeScript types
3. ✅ Test application (see Testing section)

### Future Development
- **Product Creation UI**: Will be added next (as mentioned in requirements)
- **Feature Development**: Continue building features on stable schema
- **Monitoring**: Watch for any edge cases or issues

## Important Notes

### Data Preservation
- ✅ Migration preserves all existing businesses
- ✅ Uses `ALTER TABLE` not `DROP TABLE`
- ✅ Migrates old field names to new ones automatically

### Backward Compatibility
- Migration handles old field names (`name` → `title`, `category` → `category_id`)
- Code already uses new field names
- No breaking changes for existing data

### Security
- RLS policies are preserved
- Public read access maintained
- Admin access via service_role

## Support

If issues arise:
1. Check migration was applied correctly
2. Verify types were regenerated
3. Review browser console for specific errors
4. Check Supabase dashboard for database state
5. Refer to troubleshooting section above

## Success Criteria

✅ Migration applied without errors
✅ All existing businesses preserved
✅ TypeScript types regenerated
✅ Application runs without "column does not exist" errors
✅ Homepage and admin panel work correctly
✅ Ready for product creation UI development
