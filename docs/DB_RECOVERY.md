# Database Recovery Guide

This document explains how to recover from database schema issues and apply migrations.

## Quick Recovery

### To Re-align DB Schema

1. **Via Supabase Dashboard (Recommended):**
   - Go to https://supabase.com/dashboard
   - Select your project: `bwlmlniotyrjttglbjrl`
   - Navigate to **SQL Editor**
   - Open the migration file: `supabase/migrations/20251201000000_icomp_business_admin_resync.sql`
   - Copy the entire SQL content (excluding rollback section)
   - Paste into SQL Editor
   - Click **Run**

2. **Via Supabase CLI:**
   ```bash
   supabase db reset --linked
   # or
   supabase migration up --linked
   ```

3. **Via psql (Direct Database Access):**
   ```bash
   psql -h db.bwlmlniotyrjttglbjrl.supabase.co -U postgres -d postgres -f supabase/migrations/20251201000000_icomp_business_admin_resync.sql
   ```

## Migration Details

### File: `20251201000000_icomp_business_admin_resync.sql`

This migration ensures all required columns exist in the `businesses` table:

- **Core fields**: id, owner_id, name, description, category, status
- **Contact**: phone, whatsapp, email, website
- **Social**: facebook_url, instagram_url, linkedin_url, youtube_url
- **Location**: address, latitude, longitude, island
- **Metadata**: opening_hours, services, featured, verified
- **Media**: logo_url, cover_image_url, gallery_images
- **Ratings**: average_rating, total_reviews
- **Admin**: verification_notes

### Idempotency

The migration uses `ADD COLUMN IF NOT EXISTS`, so it's safe to run multiple times. It will:
- Add missing columns
- Skip existing columns
- Never duplicate columns

## Rollback Steps

⚠️ **Warning**: Only rollback if you need to remove columns. This will delete data in those columns.

1. Open the migration file
2. Find the `ROLLBACK SECTION` (commented out)
3. Uncomment the rollback SQL
4. Run it in Supabase SQL Editor

**Note**: The rollback section is provided for reference only. In production, always backup data before rolling back.

## Troubleshooting

### Issue: "Column already exists"
- This is normal - the migration is idempotent
- The column was already added in a previous run
- No action needed

### Issue: "Permission denied"
- Ensure you're using the correct database credentials
- Check RLS policies if accessing via anon key
- Use service role key for admin operations

### Issue: "Table does not exist"
- The migration will create the table if it doesn't exist
- If you see this error, check your database connection

## Verification

After running the migration, verify all columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'businesses'
ORDER BY column_name;
```

You should see all columns listed in the migration file.

---

**Last Updated**: 2025-11-20  
**Migration Version**: 20251201000000

