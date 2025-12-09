# CURSOR PROMPT: Quick Reference Commands

## Apply Final Supabase Migration

### Step 1: Apply Migration

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard → Project `bwlmlniotyrjttglbjrl`
2. Navigate to **SQL Editor**
3. Open: `supabase/migrations/20250210000001_data_preserving_schema_align.sql`
4. Copy entire SQL content → Paste → Click **Run**

**Option B: Via Supabase CLI**
```bash
# Link project (if not linked)
npx supabase link --project-ref bwlmlniotyrjttglbjrl

# Apply migration
npx supabase db push
```

### Step 2: Regenerate TypeScript Types

```bash
npm run gen:types
```

**Or manually:**
```bash
npx supabase gen types typescript \
  --project-id bwlmlniotyrjttglbjrl \
  --schema public > src/types/database.types.ts
```

### Step 3: Start Dev Server & Test

```bash
npm run dev
```

**Verify:**
- Open http://localhost:5173
- Check browser console (F12) - no "column does not exist" errors
- Verify businesses load correctly
- Verify categories display correctly

---

## Quick Verification Commands

### Check Migration Applied
```sql
-- In Supabase SQL Editor
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'businesses' 
AND column_name IN ('title', 'category_id', 'is_verified', 'is_active');
```

### Check Data Preserved
```sql
SELECT COUNT(*) FROM businesses;
SELECT id, title, category_id, is_verified FROM businesses LIMIT 5;
```

### Check TypeScript Compilation
```bash
npm run tsc --noEmit
```

---

## Environment Variables

Ensure `.env.local` or `.env` has:
```bash
VITE_SUPABASE_URL=https://bwlmlniotyrjttglbjrl.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Files Created/Modified

**Created:**
- `supabase/migrations/20250210000001_data_preserving_schema_align.sql` - Data-preserving migration
- `MIGRATION_ARCHITECTURE.md` - Data flow documentation
- `MIGRATION_PLAN.md` - Step-by-step instructions
- `MIGRATION_TEST_CHECKLIST.md` - Testing guide
- `MIGRATION_HANDOFF.md` - Environment & migration notes
- `MIGRATION_SELF_REVIEW.md` - Code review
- `CURSOR_PROMPT.md` - This file

**Modified:**
- `src/pages/BusinessRegister.tsx` - Updated to use `title`, `category_id`, `is_verified`, `is_active`

---

## Success Criteria

✅ Migration applied without errors  
✅ All businesses preserved (count matches)  
✅ TypeScript types regenerated  
✅ No "column does not exist" (42703) errors  
✅ Home page loads correctly  
✅ Categories display with `title` field  
✅ Businesses display with correct fields  

---

## Next Steps

After migration is applied and verified:
1. ✅ Product creation UI can be added (database schema ready)
2. ✅ All queries use correct field names
3. ✅ No further schema changes needed for basic functionality

---

**Migration File:** `supabase/migrations/20250210000001_data_preserving_schema_align.sql`  
**Project ID:** `bwlmlniotyrjttglbjrl`  
**Status:** Ready for deployment
