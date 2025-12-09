# iCompass Seychelles - Development Setup Guide

**Last Updated:** December 2025

This guide provides step-by-step instructions for setting up the development environment for iCompass Seychelles.

---

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** 18+ (LTS recommended)
- **npm** or **yarn** package manager
- **Git** for version control
- **Supabase account** (free tier works)
- **Code editor** (VS Code recommended)

---

## Environment Variables

### `.env` File Template

Create a `.env` file in the project root with the following variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Google Maps API (Optional - for maps and geocoding)
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here

# Site Configuration
VITE_SITE_URL=http://localhost:5173

# Storage Buckets (Optional - defaults provided)
VITE_IMAGE_BUCKET_CATEGORIES=category-images
VITE_CATEGORY_IMAGES_BUCKET=category-images
```

### Getting Your Supabase Keys

1. **Create a Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for project setup to complete

2. **Get Your API Keys:**
   - Navigate to: `Settings` → `API`
   - Copy the `Project URL` → `VITE_SUPABASE_URL`
   - Copy the `anon` `public` key → `VITE_SUPABASE_ANON_KEY`
   - Copy the `service_role` `secret` key → `VITE_SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

3. **Get Your Google Maps API Key (Optional):**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a project
   - Enable APIs:
     - Maps JavaScript API
     - Geocoding API
   - Create credentials (API Key)
   - Restrict API key to your domain

⚠️ **Security Note:** Never commit the `.env` file to Git. It's already in `.gitignore`.

---

## Local Development Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd seychelles-compass-explore
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- React 18
- TypeScript
- Vite
- Supabase client
- shadcn/ui components
- React Router
- React Query

### Step 3: Set Up Environment Variables

```bash
# Copy the example env file
cp env.example .env

# Edit .env with your actual values
# Use your preferred editor (VS Code, nano, etc.)
code .env  # or nano .env
```

Fill in your Supabase credentials and optional Google Maps API key.

### Step 4: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Step 5: Verify Setup

1. **Check Application Loads:**
   - Open `http://localhost:5173` in your browser
   - You should see the homepage

2. **Check Supabase Connection:**
   - Open browser DevTools (F12)
   - Check Console for any Supabase connection errors
   - Check Network tab for Supabase API calls

3. **Test Authentication:**
   - Navigate to `/auth`
   - Try signing up/logging in
   - Verify profile creation works

---

## Database Setup

### Step 1: Apply Migrations

Migrations are located in `supabase/migrations/` directory.

#### Method 1: Supabase Dashboard (Recommended)

1. Navigate to your Supabase project dashboard
2. Go to `SQL Editor`
3. Open the migration file from `supabase/migrations/`
4. Copy and paste the SQL content
5. Click **"Run"** to execute

**Start with these migrations (in order):**
1. `202512010001_stable_schema.sql` - Creates base tables
2. `20251209000000_full_schema_rebuild.sql` - Full schema rebuild
3. `20251210000000_add_business_product_fields.sql` - Extensions
4. `20251209143628_fix_get_live_counters_columns.sql` - Function fixes

#### Method 2: Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-id

# Push migrations
supabase db push
```

### Step 2: Verify Schema

Run this query in Supabase SQL Editor to verify tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see:
- `profiles`
- `categories`
- `businesses`
- `products`
- `business_products`

### Step 3: Verify RLS Policies

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should have `rowsecurity = true`.

---

## Rebuilding Types

After schema changes, regenerate TypeScript types:

### Method 1: Using npm script (Recommended)

```bash
npm run gen:types
```

This runs the PowerShell script that:
1. Generates types from Supabase schema
2. Saves to `src/types/database.types.ts`

### Method 2: Manual Generation

```bash
# Using Supabase CLI
npx supabase gen types typescript --project-id "your-project-id" > src/types/database.types.ts
```

### Method 3: Using PowerShell Script

```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/regenerate-types.ps1
```

**Note:** Types are automatically generated when you run migrations via Supabase Dashboard if you have the CLI installed.

---

## Running Migrations

### Applying Migrations

1. **Read Migration File:**
   ```bash
   cat supabase/migrations/YYYYMMDDHHMMSS_description.sql
   ```

2. **Review Migration:**
   - Check what tables/columns it creates/modifies
   - Verify it's safe to run
   - Check for data migrations

3. **Apply Migration:**
   - Copy SQL to Supabase SQL Editor
   - Run the migration
   - Verify success

4. **Regenerate Types:**
   ```bash
   npm run gen:types
   ```

5. **Test Application:**
   - Restart dev server if needed
   - Test affected features
   - Check for errors

### Migration Best Practices

- ✅ **Always test in development first**
- ✅ **Backup data before destructive migrations**
- ✅ **Run migrations one at a time**
- ✅ **Verify schema after migration**
- ✅ **Regenerate types after schema changes**

---

## Pushing to Supabase

### Using Supabase Dashboard

1. Navigate to SQL Editor
2. Copy migration SQL
3. Run migration
4. Verify in Table Editor

### Using Supabase CLI

```bash
# Link project (first time only)
supabase link --project-ref your-project-id

# Push migrations
supabase db push

# Or push specific migration
supabase db push --file supabase/migrations/YYYYMMDDHHMMSS_description.sql
```

### Using Supabase API

Migrations can be applied via Supabase Management API (advanced).

---

## Development Commands

### Core Commands

```bash
# Start development server
npm run dev

# Start with port reset (kills stuck processes)
npm run dev:reset

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking (no emit)
npx tsc --noEmit
```

### Utility Scripts

```bash
# Generate Supabase types
npm run gen:types

# Seed admin user
npm run seed:admin

# Reset development environment (PowerShell)
powershell -ExecutionPolicy Bypass -File ./scripts/reset-dev.ps1
```

### Reset Development Environment

The reset script performs:
1. Stops processes on port 5173
2. Clears Vite cache (`node_modules/.vite`)
3. Reinstalls dependencies
4. Starts development server

**Usage:**
```powershell
powershell -ExecutionPolicy Bypass -File ./scripts/reset-dev.ps1
```

---

## Troubleshooting

### Port Already in Use

**Error:** `Port 5173 is already in use`

**Solution:**
```bash
# Use reset script
npm run dev:reset

# Or manually kill process
# Windows:
taskkill /F /IM node.exe
# Linux/Mac:
pkill -f node
```

### Environment Variables Not Loading

**Error:** `undefined` values for environment variables

**Solution:**
1. Ensure `.env` file exists in project root
2. Restart development server after changing `.env`
3. Verify variable names start with `VITE_` for client-side access
4. Check that `.env` is not gitignored (should be in `.gitignore`)

### Supabase Connection Errors

**Error:** Cannot connect to Supabase

**Solution:**
1. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
2. Check Supabase dashboard for service status
3. Verify RLS policies are correctly configured
4. Check browser console for detailed error messages

### Type Errors After Schema Changes

**Error:** TypeScript errors after migration

**Solution:**
1. Regenerate types: `npm run gen:types`
2. Restart TypeScript server in VS Code (Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server")
3. Clear TypeScript cache: `rm -rf node_modules/.cache`

### Migration Errors

**Error:** Migration fails to apply

**Solution:**
1. Check migration SQL syntax
2. Verify dependencies (tables/columns exist)
3. Check for conflicts with existing schema
4. Review Supabase logs for detailed errors
5. Test migration in development first

---

## First-Time Setup Checklist

- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Copy `env.example` to `.env`
- [ ] Add Supabase credentials to `.env`
- [ ] (Optional) Add Google Maps API key
- [ ] Apply database migrations
- [ ] Regenerate TypeScript types
- [ ] Run `npm run dev`
- [ ] Verify application loads at `http://localhost:5173`
- [ ] Test authentication (sign up/login)
- [ ] Verify database connection (check browser console)

---

## Development Workflow

### Typical Development Cycle

1. **Make Code Changes:**
   - Edit files in `src/`
   - Hot reload will update automatically

2. **Test Changes:**
   - Check browser for updates
   - Test functionality
   - Check console for errors

3. **Schema Changes:**
   - Create migration file
   - Apply migration
   - Regenerate types
   - Update code to match schema

4. **Commit Changes:**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Vite Documentation](https://vitejs.dev)
- [shadcn/ui Documentation](https://ui.shadcn.com)

---

## Getting Help

If you encounter issues:

1. **Check Documentation:**
   - `README.md` - Project overview
   - `docs/` - Detailed documentation
   - Supabase/React/Vite docs

2. **Check Error Messages:**
   - Browser console (F12)
   - Terminal output
   - Supabase logs

3. **Common Issues:**
   - See Troubleshooting section above
   - Check GitHub issues
   - Review recent commits

---

## Notes

- **Hot Reload:** Vite provides instant hot module replacement (HMR)
- **Type Safety:** TypeScript provides compile-time type checking
- **Environment Variables:** Must start with `VITE_` for client-side access
- **Database Types:** Regenerate after every schema change
- **RLS Policies:** Test after migration to ensure access control works

---

**Happy Coding! 🚀**

