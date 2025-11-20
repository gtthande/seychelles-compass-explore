# 🚨 iCompass Emergency Repair Kit

This document contains all emergency repair prompts and procedures for the iCompass project.

## Quick Reference

### 1. Emergency Repair (Main)
**Use when:** Project is unusable, blank screens, missing types, build failures

```bash
npm run repair
```

Or copy this into Cursor:
```
CURSOR: Run the full iCompass Emergency Repair Kit.

1. Validate .env exists and has all 4 required variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - VITE_GOOGLE_MAPS_API_KEY
   - VITE_SITE_URL

2. Delete:
   - node_modules/.vite
   - node_modules/.cache
   - .vite
   - .cursor-cache

3. Reinstall dependencies:
   rm -rf node_modules package-lock.json
   npm install

4. Verify supabase folder exists:
   - supabase/migrations
   - supabase/types

5. Regenerate Supabase Types:
   npx supabase gen types typescript --project-id "bwlmlniotyrjttglbjrl" > src/types/supabase.types.ts

6. Rebuild the TS type index:
   - Ensure `src/types/index.ts` exports supabase.types.ts
   - Ensure no stale imports exist

7. Run the migration healer:
   - Compare migrations with database schema
   - Recreate missing columns automatically
   - Ensure `businesses` table contains all fields:
        address, latitude, longitude, gallery_images, services,
        opening_hours, verified, featured, island, verification_notes,
        average_rating, total_reviews

8. Repair Supabase client:
   - Ensure supabase/client.ts throws missing-env errors
   - Ensure auth.persistSession is false
   - Ensure from().select() never throws limit() errors

9. Fix Vite startup:
   - Ensure scripts/prestart.mjs exists
   - Ensure prestart runs before dev

10. Run project:
   npm run prestart
   npm run dev

Execute everything automatically.
```

### 2. Supabase Schema Resync
**Use when:** "Could not find column 'verification_notes'", "Business count failed", missing fields after restart

```bash
npm run resync-schema
```

Or copy this into Cursor:
```
CURSOR: Perform a Supabase Schema Resync.

1. Fetch the remote schema from Supabase.
2. Compare with all SQL migrations.
3. Generate a unified migration that restores missing columns.
4. Rebuild:
   supabase gen types typescript --project-id "bwlmlniotyrjttglbjrl" > src/types/supabase.types.ts
5. Clear local schema caches.
6. Restart the dev server.

Run now.
```

### 3. Migration Self-Healing
**Use when:** Migrations are out of order or lost

```bash
npm run heal-migrations
```

Or copy this into Cursor:
```
CURSOR: Heal iCompass migrations:

1. Validate every migration in supabase/migrations has been applied.
2. Auto-create missing migrations for:
   - businesses table
   - categories table
   - verification_notes
   - island
   - gallery_images
   - services
   - average_rating
   - total_reviews
3. Generate a new migration file with the correct SQL.
4. Run Supabase migrations locally.
```

### 4. Login & Auth Repair
**Use when:** "Invalid login credentials", admin user exists in users but NOT in auth.users

```bash
npm run repair-auth
```

Or copy this into Cursor:
```
CURSOR: Repair Supabase Auth for admin login.

1. Check if auth.users has record for gtthande@gmail.com.
2. If missing, create it:
   INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
   VALUES (
      '62a90a1c-2491-4637-a21e-93e9b4726b55',
      'gtthande@gmail.com',
      crypt('Admin123!', gen_salt('bf')),
      NOW()
   ) ON CONFLICT (id) DO NOTHING;

3. Ensure RLS policies allow login and profile creation.
4. Restart the dev server.
```

### 5. Vite/Node Module Repair
**Use when:** Project does not load, Vite HMR breaks, endless "loading businesses…" loop

```bash
rm -rf node_modules .vite package-lock.json
npm install
npm run prestart
npm run dev
```

Or copy this into Cursor:
```
CURSOR: Run Vite/Node healing.

rm -rf node_modules .vite package-lock.json
npm install
npm run prestart
npm run dev
```

### 6. Health Check
**Use when:** You want to verify project health

```bash
npm run healthcheck
```

### 7. Project Resurrection (1-Line)
**Use only if everything is broken:**

```bash
npm run resurrect
```

Or manually:
```bash
rm -rf node_modules .vite package-lock.json && npm install && npx supabase gen types typescript --project-id "bwlmlniotyrjttglbjrl" > src/types/supabase.types.ts && npm run dev
```

## Available Scripts

All repair scripts are available via npm:

- `npm run repair` - Full emergency repair
- `npm run healthcheck` - Health check
- `npm run heal-migrations` - Migration healer
- `npm run resync-schema` - Schema resync
- `npm run repair-auth` - Auth repair
- `npm run resurrect` - Complete project resurrection

## Protection Rules

The `.cursor/rules.json` file protects critical files:

- `supabase/migrations/**` - Never delete migrations
- `src/integrations/supabase/**` - Protected Supabase code
- `src/types/**` - Protected type definitions
- `scripts/prestart.mjs` - Protected prestart script
- `.env` - Protected environment file

## Admin Credentials

- **Email:** gtthande@gmail.com
- **Password:** Admin123!
- **User ID:** 62a90a1c-2491-4637-a21e-93e9b4726b55

## Required Environment Variables

Ensure `.env` contains:

```
VITE_SUPABASE_URL=https://bwlmlniotyrjttglbjrl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDM3MDEsImV4cCI6MjA3MjI3OTcwMX0.Wx2ypE6AlTBe0vBqC_MvYc5IiwemMaxXGiHOmGM6MoI
VITE_GOOGLE_MAPS_API_KEY=AIzaSyByNrxUDO-dODXwTaT6RINSbAfASZ-eGfY
VITE_SITE_URL=http://localhost:5173
```

## Troubleshooting

### Issue: "Could not find column 'verification_notes'"
**Solution:** Run `npm run resync-schema`

### Issue: "Invalid login credentials"
**Solution:** Run `npm run repair-auth`

### Issue: Blank screen on load
**Solution:** Run `npm run repair`

### Issue: Endless "loading businesses..." loop
**Solution:** Run `npm run repair` then `npm run resync-schema`

### Issue: TypeScript errors about missing types
**Solution:** Run `npm run resync-schema`

### Issue: Vite HMR not working
**Solution:** Run `npm run repair` (clears Vite cache)

## Support

If issues persist after running all repair scripts:

1. Check browser console for errors
2. Verify `.env` file is correct
3. Run `npm run healthcheck`
4. Check Supabase dashboard for database status
5. Verify all migrations are applied

---

**Last Updated:** 2025-11-20
**Version:** 1.0.0

