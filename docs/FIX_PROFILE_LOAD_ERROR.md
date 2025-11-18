# Fix Profile Load Error - Step by Step Guide

## The Problem
You're seeing "Profile Load Error" when trying to access `/admin`. This happens when:
1. Your profile doesn't exist in the database
2. Network/CORS issues prevent loading your profile
3. RLS (Row Level Security) policies block profile creation

## Quick Fix Steps

### Step 1: Fix CORS Settings (Most Common Fix)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Scroll down to **"CORS Configuration"** or **"Additional Allowed Origins"**
5. Add these URLs (one per line):
   ```
   http://localhost:5173
   http://127.0.0.1:5173
   http://192.168.56.1:5173
   ```
6. Click **Save**
7. **Refresh your browser** (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)

### Step 2: Create Profile Manually (If CORS is Fixed)

1. Click **"Create Profile & Retry"** button on the error screen
2. Check browser console (F12) for any errors
3. If it fails, proceed to Step 3

### Step 3: Create Profile via Supabase Dashboard (If Auto-Creation Fails)

1. Go to Supabase Dashboard → **Table Editor** → **profiles**
2. Click **Insert** → **Insert row**
3. Fill in:
   - `id`: Your user ID (from `auth.users` table)
   - `email`: Your email address
   - `role`: `user` (or `admin` if you need admin access)
   - `is_admin`: `false` (or `true` if you need admin access)
   - `is_active`: `true`
4. Click **Save**
5. Refresh your browser

### Step 4: Check RLS Policies (If Still Failing)

1. Go to Supabase Dashboard → **Authentication** → **Policies**
2. Find the `profiles` table
3. Check if there's a policy like **"Users can insert their own profile"**
4. If missing, you may need to run a migration or contact your database admin

### Step 5: Verify Profile Exists

Run this query in Supabase SQL Editor:
```sql
SELECT * FROM profiles WHERE email = 'your-email@example.com';
```

Replace `your-email@example.com` with your actual email.

## Common Error Messages

### "Permission denied" (Error Code: 42501)
- **Cause**: RLS policy is blocking profile creation
- **Fix**: Check RLS policies in Supabase dashboard or contact admin

### "Network timeout" or "Failed to fetch"
- **Cause**: CORS not configured or network issue
- **Fix**: Follow Step 1 above

### "Profile already exists" (Error Code: 23505)
- **Cause**: Profile exists but query isn't finding it
- **Fix**: Check if profile exists with different `user_id` vs `id` schema

## Still Having Issues?

1. **Check Browser Console** (F12) for detailed error messages
2. **Check Network Tab** (F12 → Network) for failed requests to Supabase
3. **Verify Environment Variables**:
   ```bash
   npm run verify-supabase
   ```
4. **Check Supabase Project Status**: https://status.supabase.com

## Need Admin Access?

If you need admin access after creating your profile:

1. Go to Supabase Dashboard → **Table Editor** → **profiles**
2. Find your profile row
3. Edit and set:
   - `is_admin`: `true`
   - `role`: `admin`
4. Save and refresh

