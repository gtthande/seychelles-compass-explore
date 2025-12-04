# 🔧 Migration Application Guide

## ✅ Completed Steps

1. ✅ **Database Types Generated**
   - File: `src/lib/database.types.ts` (55KB)
   - Generated successfully with all schema types

2. ✅ **RLS Migration Files Created**
   - `supabase/migrations/99999999999999_reset_rls.sql` - Resets all RLS policies
   - `supabase/migrations/99999999999998_fix_admin_users.sql` - Fixes admin user

3. ✅ **App Rebuilt**
   - Vite cache cleared
   - Dependencies reinstalled
   - Dev server running on port 5173

## 📋 Required: Apply RLS Migrations

The migrations must be applied manually via Supabase Dashboard SQL Editor:

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/bwlmlniotyrjttglbjrl
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New query"**

### Step 2: Apply RLS Reset Migration
1. Open file: `supabase/migrations/99999999999999_reset_rls.sql`
2. Copy the entire SQL content
3. Paste into SQL Editor
4. Click **"Run"** (or press Ctrl+Enter)
5. Wait for success message

### Step 3: Apply Admin User Fix
1. Open file: `supabase/migrations/99999999999998_fix_admin_users.sql`
2. Copy the entire SQL content
3. Paste into SQL Editor
4. Click **"Run"**
5. Wait for success message

## ✅ Testing Checklist

After applying migrations, test:

- [ ] **Public Categories Load**
  - Visit: http://localhost:5173/
  - Check "Explore by Category" section loads
  - Categories grid displays correctly

- [ ] **Public Products Load**
  - Navigate to Products page
  - Products list displays without errors

- [ ] **Login Works**
  - Go to: http://localhost:5173/auth
  - Login as: `gtthande@gmail.com`
  - Password: (check your admin password)
  - Should redirect to admin panel

- [ ] **Admin Panel Loads**
  - After login, should see admin dashboard
  - No RLS errors in console

## 🔍 If Issues Persist

If any fetch functions still break:

1. Check browser console for errors
2. Verify RLS policies are applied (check Supabase Dashboard → Authentication → Policies)
3. Ensure all `.select()` calls use `.select("*")` instead of specific fields
4. Check that `src/integrations/supabase/client.ts` is properly configured

## 📝 Notes

- Migrations are numbered `99999999999999_*` to ensure they run last
- The RLS reset migration drops ALL existing policies and creates new ones
- Admin policies check both `is_admin` and `role='admin'` fields

