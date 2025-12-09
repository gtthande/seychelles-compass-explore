# Apply Migration Instructions

## Step 1: Apply Migration to Supabase

The migration script `supabase/migrations/20250210000001_data_preserving_schema_align.sql` contains the corrected data-preserving migration with enum-to-text casts.

### Via Supabase Dashboard (Recommended):

1. Go to https://supabase.com/dashboard/project/bwlmlniotyrjttglbjrl
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New query"**
4. Open the file: `supabase/migrations/20250210000001_data_preserving_schema_align.sql`
5. Copy the entire SQL content
6. Paste into SQL Editor
7. Click **"Run"** (or press Ctrl+Enter)
8. Wait for success message

### Verify Migration Success:

Run this query in SQL Editor to verify columns exist:

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
  AND column_name IN ('title', 'is_active', 'category_id');
```

Expected results:
- `businesses`: title (text), category_id (uuid), is_verified (boolean), is_active (boolean)
- `products`: title (text), is_active (boolean)

---

## Migration Script Details

The migration script includes:
- ✅ Enum-to-text casts: `cat_record.category_text::text` (line 123)
- ✅ Enum-to-text casts: `status::text` (line 162)
- ✅ Data preservation: Migrates from old column names to new ones
- ✅ Idempotent: Safe to run multiple times

