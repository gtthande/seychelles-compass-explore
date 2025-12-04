# Supabase "Failed to Fetch" Error - Troubleshooting Guide

## Quick Fix Checklist

### 1. ✅ Verify Environment Variables

Run the verification script:
```bash
npm run verify-supabase
```

This will check:
- ✅ `.env.local` or `.env` file exists
- ✅ `VITE_SUPABASE_URL` is set correctly
- ✅ `VITE_SUPABASE_ANON_KEY` is set correctly
- ✅ Connection to Supabase works

### 2. ✅ Check Your .env.local File

Create or update `.env.local` in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
```

**⚠️ Security:** Replace `[YOUR_SUPABASE_ANON_KEY]` with your actual key from Supabase dashboard.

**Important:** 
- Use `.env.local` (not `.env`) for local development
- Get your keys from: https://app.supabase.com/project/_/settings/api
- Restart your dev server after changing `.env.local`

### 3. ✅ Restart Dev Server

After updating `.env.local`, **always restart** your dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

Vite only reads environment variables on startup, so changes require a restart.

### 4. ✅ Check CORS Settings

If you see "Failed to fetch" errors, check CORS in Supabase:

1. Go to: https://app.supabase.com/project/_/settings/api
2. Scroll to "CORS Configuration"
3. Add your local URLs:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
   - `http://192.168.56.1:5173` (if using network access)
   - `http://10.150.87.134:5173` (if using network access)

### 5. ✅ Verify Supabase Project Status

Check if your Supabase project is active:

1. Go to: https://app.supabase.com/project/_/settings/general
2. Ensure project is not paused
3. Check project region matches your location

### 6. ✅ Test Network Connectivity

Test if Supabase is reachable:

```bash
# Test from terminal
curl https://your-project-id.supabase.co/rest/v1/

# Should return JSON (even if it's an error, it means connection works)
```

### 7. ✅ Check Browser Console

Open browser DevTools (F12) and check:

1. **Console tab**: Look for Supabase initialization messages
2. **Network tab**: Check failed requests to Supabase
   - Status code (404, 403, CORS error, etc.)
   - Request URL
   - Response headers

### 8. ✅ Common Error Messages

#### "Failed to fetch"
- **Cause**: Network/CORS issue or Supabase URL incorrect
- **Fix**: 
  - Verify `VITE_SUPABASE_URL` in `.env.local`
  - Check CORS settings in Supabase dashboard
  - Restart dev server

#### "Invalid API key"
- **Cause**: Wrong or missing `VITE_SUPABASE_ANON_KEY`
- **Fix**: 
  - Get correct key from Supabase dashboard
  - Update `.env.local`
  - Restart dev server

#### "permission denied" or "new row violates row-level security policy"
- **Cause**: RLS (Row Level Security) policy blocking access
- **Fix**: 
  - Check RLS policies in Supabase
  - Verify user has correct role/permissions
  - Check if you're logged in (for protected data)

#### "relation does not exist"
- **Cause**: Table doesn't exist or wrong table name
- **Fix**: 
  - Check table name spelling
  - Verify table exists in Supabase dashboard
  - Run migrations if needed

## Debugging Steps

### Step 1: Run Verification Script

```bash
npm run verify-supabase
```

This will:
- ✅ Check environment variables
- ✅ Test Supabase connection
- ✅ Show detailed error messages if something fails

### Step 2: Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Look for messages starting with:
   - `🔗 Supabase client initialized:`
   - `✅ Supabase connection test successful`
   - `❌ Supabase connection test failed:`

### Step 3: Check Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Refresh the page
4. Look for requests to `*.supabase.co`
5. Check:
   - Status code (should be 200)
   - Request URL (should match your project URL)
   - Response (should be JSON, not HTML error page)

### Step 4: Test Direct API Call

Open browser console and run:

```javascript
// Test Supabase connection
const testUrl = 'https://your-project-id.supabase.co/rest/v1/businesses?select=id&limit=1';
const testKey = 'your-anon-key';

fetch(testUrl, {
  headers: {
    'apikey': testKey,
    'Authorization': `Bearer ${testKey}`
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

## Environment Variable Setup

### For Vite Projects (This Project)

Vite requires the `VITE_` prefix for environment variables:

```env
# ✅ Correct
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# ❌ Wrong (won't work in Vite)
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

### File Priority

Vite reads environment variables in this order:
1. `.env.local` (highest priority, not committed to git)
2. `.env.development` (for development)
3. `.env` (lowest priority)

**Best practice**: Use `.env.local` for local development.

## Getting Your Supabase Credentials

1. Go to: https://app.supabase.com
2. Select your project
3. Go to: **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

## Still Having Issues?

1. **Check Supabase Status**: https://status.supabase.com
2. **Check Project Logs**: Supabase Dashboard → Logs
3. **Verify RLS Policies**: Supabase Dashboard → Authentication → Policies
4. **Test with curl**: See if it's a browser-specific issue
5. **Check Firewall/VPN**: Some networks block Supabase

## Quick Commands

```bash
# Verify Supabase configuration
npm run verify-supabase

# Check all environment variables
npm run check-env

# Test Supabase connection
npm run test:supabase

# Restart dev server
npm run dev
```

## Need Help?

If you've tried all the above and still have issues:

1. Check the browser console for detailed error messages
2. Run `npm run verify-supabase` and share the output
3. Check Supabase dashboard for project status
4. Verify your network can reach Supabase (try curl command)

