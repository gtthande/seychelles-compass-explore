# CURSOR PROMPT: Final Migration - Quick Reference

## Quick CLI Commands

### 1. Accept Autopilot Changes
```bash
git add .
git commit -m "Accept autopilot changes: schema alignment and type fixes"
```

### 2. Apply Migration to Supabase

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard → Project `bwlmlniotyrjttglbjrl`
2. SQL Editor → Copy contents of `supabase/migrations/20250210000001_data_preserving_schema_align.sql`
3. Paste and Run

**Option B: Via Supabase CLI**
```bash
npx supabase link --project-ref bwlmlniotyrjttglbjrl
npx supabase db push
```

### 3. Verify Migration Applied
```sql
-- Run in Supabase SQL Editor
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
SELECT COUNT(*) FROM businesses;
```

### 4. Regenerate TypeScript Types
```bash
npm run gen:types
# Or manually:
npx supabase gen types typescript --project-id bwlmlniotyrjttglbjrl --schema public > src/integrations/supabase/types.ts
```

### 5. Restart TypeScript Server
- VS Code / Cursor: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### 6. Start Dev Server & Test
```bash
npm run dev
```

**Test Checklist:**
- ✅ Homepage loads (http://localhost:5173)
- ✅ Category grid displays
- ✅ No console errors (F12 → Console)
- ✅ Navigate to `/directory` → Businesses load
- ✅ Admin panel works (if implemented)

### 7. Verify No Errors
```bash
# TypeScript compilation
npx tsc --noEmit

# Check browser console (F12)
# - No 42703 errors
# - No "column does not exist" errors
# - Network tab: All Supabase calls return 200
```

## Key Files

- **Migration**: `supabase/migrations/20250210000001_data_preserving_schema_align.sql`
- **Architecture**: `MIGRATION_ARCHITECTURE_FINAL.md`
- **Plan**: `MIGRATION_PLAN_FINAL.md`
- **Test Checklist**: `MIGRATION_TEST_CHECKLIST_FINAL.md`
- **Handoff**: `MIGRATION_HANDOFF_FINAL.md`
- **Self-Review**: `MIGRATION_SELF_REVIEW_FINAL.md`

## Success Criteria

✅ Migration applied without errors
✅ All existing businesses preserved
✅ TypeScript types regenerated
✅ Application runs without "column does not exist" errors
✅ Homepage and admin panel work correctly
✅ Ready for product creation UI development

## Next Steps

After successful migration:
1. ✅ Product creation UI can be added next
2. ✅ Continue with feature development
3. ✅ Monitor for any edge cases

## Troubleshooting

**"Column does not exist" errors persist:**
1. Verify migration applied (run verification queries)
2. Regenerate types
3. Clear browser cache
4. Restart dev server

**Types don't generate:**
- Ensure Supabase CLI installed: `npm install -g supabase`
- Verify project ID: `bwlmlniotyrjttglbjrl`

**Migration fails:**
- Migration is idempotent, safe to re-run
- Check SQL Editor for specific error messages
