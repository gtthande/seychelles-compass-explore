# RLS Fix Application Guide

## ✅ Migration Created

A comprehensive RLS fix migration has been created at:
**`supabase/migrations/20250128000000_comprehensive_rls_fix.sql`**

This migration fixes all Row Level Security policies for iCompass Seychelles.

## 📋 What Was Fixed

### 1. **Public Read Access**
- ✅ `businesses` - Anyone can read
- ✅ `categories` - Anyone can read
- ✅ `products` - Anyone can read
- ✅ `business_products` - Anyone can read

### 2. **Profile Table Policies**
- ✅ Users can select their own profile (`auth.uid() = id OR auth.uid() = user_id`)
- ✅ Users can insert their own profile
- ✅ Users can update their own profile
- ✅ Admins have full access (SELECT, INSERT, UPDATE, DELETE)

### 3. **Admin Write Access**
- ✅ `businesses` - Admins can INSERT, UPDATE, DELETE
- ✅ `categories` - Admins can INSERT, UPDATE, DELETE
- ✅ `products` - Admins can INSERT, UPDATE, DELETE
- ✅ `business_products` - Admins can INSERT, UPDATE, DELETE

### 4. **Helper Function**
- ✅ Created `is_admin_user(uid)` function for efficient admin checks
- ✅ Checks both `profiles.id` and `profiles.user_id` for compatibility
- ✅ Checks both `is_admin = true` and `role = 'admin'`

## 🚀 How to Apply

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/bwlmlniotyrjttglbjrl
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/20250128000000_comprehensive_rls_fix.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press `Ctrl+Enter`)
7. Verify success message: `✅ All RLS policies have been successfully applied!`

### Option 2: Via Supabase CLI

```bash
# If you have Supabase CLI installed
supabase migration up

# Or apply specific migration
supabase db push
```

## 🔄 Regenerate TypeScript Types

After applying the migration, regenerate your TypeScript types:

```bash
# Using Supabase CLI
npx supabase gen types typescript --project-id bwlmlniotyrjttglbjrl > src/types/supabase.types.ts

# Or if you have Supabase CLI installed globally
supabase gen types typescript --project-id bwlmlniotyrjttglbjrl > src/types/supabase.types.ts
```

**Note:** You may need to be logged in to Supabase CLI:
```bash
supabase login
```

## ✅ Testing Checklist

After applying the migration:

1. **Restart Dev Server**
   ```bash
   npm run dev
   ```

2. **Test Public Access (No Login Required)**
   - [ ] Homepage loads
   - [ ] Categories display correctly
   - [ ] Businesses list loads
   - [ ] Products list loads
   - [ ] Search functionality works
   - [ ] Business detail pages load

3. **Test Admin Access (Login as Admin)**
   - [ ] Admin panel loads (`/admin`)
   - [ ] Can view all businesses (including pending)
   - [ ] Can edit businesses
   - [ ] Can create/edit categories
   - [ ] Can create/edit products
   - [ ] Can manage business_products

4. **Test User Profile Access**
   - [ ] Users can view their own profile
   - [ ] Users can update their own profile
   - [ ] Admins can view all profiles

## 🔍 Verification Queries

You can run these in Supabase SQL Editor to verify policies:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('businesses', 'categories', 'products', 'business_products', 'profiles');

-- Check policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('businesses', 'categories', 'products', 'business_products', 'profiles')
ORDER BY tablename, policyname;
```

## 🐛 Troubleshooting

### If data still doesn't load:

1. **Check RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'businesses';
   ```
   Should return `rowsecurity = true`

2. **Check policies exist:**
   ```sql
   SELECT policyname FROM pg_policies 
   WHERE tablename = 'businesses';
   ```
   Should include `public_read_businesses` and `admin_write_businesses`

3. **Check admin user exists:**
   ```sql
   SELECT id, email, is_admin, role 
   FROM profiles 
   WHERE is_admin = true OR role = 'admin';
   ```

4. **Clear browser cache and reload**

5. **Check browser console for specific error messages**

## 📝 Notes

- The migration drops and recreates all policies to ensure clean state
- Admin checks use both `is_admin = true` and `role = 'admin'` for compatibility
- Profile checks use both `id` and `user_id` for backward compatibility
- All public read policies use `USING (true)` for maximum compatibility

## 🎯 Expected Result

After applying this migration:
- ✅ All frontend data fetches should work
- ✅ No more "Failed to load data" errors
- ✅ Public users can browse businesses, categories, and products
- ✅ Admins can edit all data
- ✅ Users can manage their own profiles

