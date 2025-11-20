# 🔐 iCompass Auth Recovery Kit

This document provides step-by-step instructions for recovering from authentication issues in the iCompass project.

## Table of Contents

1. [Confirm Active Supabase Project](#confirm-active-supabase-project)
2. [Access Supabase Dashboard](#access-supabase-dashboard)
3. [Recreate Admin User](#recreate-admin-user)
4. [Clear Vite Cache](#clear-vite-cache)
5. [Verify Login Works](#verify-login-works)

---

## Confirm Active Supabase Project

### Method 1: Check `.env` File

1. Open `.env` file at project root
2. Verify `VITE_SUPABASE_URL` matches:
   ```
   VITE_SUPABASE_URL=https://bwlmlniotyrjttglbjrl.supabase.co
   ```
3. The project ID is: `bwlmlniotyrjttglbjrl`

### Method 2: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for: `✔ Supabase client initialized`
4. Check the masked URL in the log

### Method 3: Check Supabase Client Code

1. Open `src/integrations/supabase/client.ts`
2. Verify the URL matches the project ID

---

## Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Sign in with your Supabase account
3. Select project: **bwlmlniotyrjttglbjrl** (or search for "seychelles-compass")
4. You should see the project dashboard

### Key Dashboard Sections:

- **Authentication** → Users: View/manage auth users
- **Database** → Tables: View database schema
- **SQL Editor**: Run SQL queries
- **Settings** → API: View API keys

---

## Recreate Admin User

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - **Email**: `gtthande@gmail.com`
   - **Password**: `Admin123!`
   - **Auto Confirm User**: ✅ **Enable this** (sets Email Confirmed = TRUE)
4. Click **"Create user"**

### Option 2: Via SQL Editor

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this SQL:

```sql
-- Insert admin user into auth.users
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
) VALUES (
    '62a90a1c-2491-4637-a21e-93e9b4726b55',
    '00000000-0000-0000-0000-000000000000',
    'gtthande@gmail.com',
    crypt('Admin123!', gen_salt('bf')),
    NOW(),  -- This sets Email Confirmed = TRUE
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    'authenticated'
)
ON CONFLICT (id) DO UPDATE
SET email_confirmed_at = NOW(),
    encrypted_password = crypt('Admin123!', gen_salt('bf'));

-- Ensure profile exists
INSERT INTO public.profiles (
    user_id,
    full_name,
    is_admin,
    created_at,
    updated_at
) VALUES (
    '62a90a1c-2491-4637-a21e-93e9b4726b55',
    'Admin User',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET is_admin = true,
    updated_at = NOW();
```

3. Click **"Run"**

### Verify User Created

1. Go to **Authentication** → **Users**
2. Search for: `gtthande@gmail.com`
3. Verify:
   - ✅ Email Confirmed = **TRUE** (green checkmark)
   - ✅ User ID = `62a90a1c-2491-4637-a21e-93e9b4726b55`
   - ✅ Status = **Active**

---

## Clear Vite Cache

### Method 1: Via Command Line

```bash
# Windows PowerShell
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue

# Linux/Mac
rm -rf node_modules/.vite
```

### Method 2: Via NPM Script

```bash
npm run predev
```

This automatically clears the cache.

### Method 3: Manual Delete

1. Navigate to project root
2. Delete folder: `node_modules/.vite`
3. Restart dev server

---

## Verify Login Works

### Step 1: Start Dev Server

```bash
npm run dev
```

### Step 2: Open Browser

1. Go to: http://localhost:5173
2. Navigate to `/auth` or click "Sign In"

### Step 3: Test Login

1. Enter credentials:
   - **Email**: `gtthande@gmail.com`
   - **Password**: `Admin123!`
2. Click **"Sign In"**

### Step 4: Check Console Logs

Open browser DevTools (F12) → Console tab. You should see:

```
[Auth] SignIn attempt gtthande@gmail.com
[Auth] Supabase URL: Loaded
[Auth] Sign in successful: { userId: '...', email: '...', sessionExists: true }
[Supabase] Auth session loaded { userId: '...' }
[Auth OK]
[AdminPanel mounted]
[Session: user.id=...]
```

### Step 5: Verify Redirect

- ✅ Should redirect to `/` or `/admin`
- ✅ Should see admin panel (not login page)
- ✅ No error messages in console

### Troubleshooting

#### Issue: "Invalid login credentials"

**Solutions:**
1. Verify user exists in Supabase Dashboard → Authentication → Users
2. Check Email Confirmed = TRUE
3. Try resetting password in Supabase Dashboard
4. Clear browser cookies/localStorage
5. Check `.env` file has correct `VITE_SUPABASE_URL`

#### Issue: "Session not found after sign in"

**Solutions:**
1. Check `persistSession: true` in `src/integrations/supabase/client.ts`
2. Clear Vite cache: `npm run predev`
3. Restart dev server
4. Check browser console for errors

#### Issue: "Supabase URL: Missing"

**Solutions:**
1. Verify `.env` file exists at project root
2. Check `VITE_SUPABASE_URL` is set correctly
3. Restart dev server (Vite needs restart to load new env vars)

---

## Quick Recovery Checklist

- [ ] `.env` file exists with correct `VITE_SUPABASE_URL`
- [ ] Admin user exists in Supabase Dashboard
- [ ] Email Confirmed = TRUE for admin user
- [ ] Vite cache cleared (`npm run predev`)
- [ ] Dev server restarted
- [ ] Browser console shows no errors
- [ ] Login redirects to admin panel

---

## Admin Credentials Reference

- **Email**: `gtthande@gmail.com`
- **Password**: `Admin123!`
- **User ID**: `62a90a1c-2491-4637-a21e-93e9b4726b55`
- **Project ID**: `bwlmlniotyrjttglbjrl`
- **Supabase URL**: `https://bwlmlniotyrjttglbjrl.supabase.co`

---

**Last Updated**: 2025-11-20  
**Version**: 1.0.0

