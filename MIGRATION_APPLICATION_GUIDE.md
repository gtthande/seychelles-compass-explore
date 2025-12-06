# Migration Application Guide

This guide explains how to apply database migrations to the iCompass Seychelles project.

## Overview

Migrations are SQL files located in `supabase/migrations/` that modify the database schema. They must be applied in order and tested thoroughly.

## Migration Order

**CRITICAL:** Migrations must be applied in this exact order:

1. **Schema Migrations** - Apply all SQL migration files
2. **Type Generation** - Regenerate TypeScript types
3. **Application Testing** - Test the application

## Method 1: Supabase Dashboard (Recommended)

This is the safest method for production environments.

### Steps

1. **Open Supabase Dashboard:**
   - Go to https://supabase.com/dashboard/project/bwlmlniotyrjttglbjrl
   - Navigate to **SQL Editor** in the left sidebar
   - Click **"New query"**

2. **Apply Migration:**
   - Open the migration file from `supabase/migrations/`
   - Copy the entire SQL content
   - Paste into SQL Editor
   - Click **"Run"** (or press Ctrl+Enter)
   - Wait for success message

3. **Verify:**
   - Check for any errors in the output
   - Verify the changes in the Table Editor
   - Test RLS policies if applicable

### Advantages

- ✅ Visual feedback on errors
- ✅ Can review SQL before execution
- ✅ Easy to rollback if needed
- ✅ No CLI setup required

## Method 2: Supabase CLI

For local development or automated deployments.

### Prerequisites

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref bwlmlniotyrjttglbjrl
```

### Apply Migrations

```bash
# Push all migrations
supabase db push

# Or apply a specific migration
supabase migration up
```

### Advantages

- ✅ Automated and scriptable
- ✅ Good for CI/CD pipelines
- ✅ Can be version controlled

## After Applying Migrations

### 1. Regenerate TypeScript Types

After schema changes, you must regenerate types:

```bash
npm run gen:types
```

This script:
- Generates types from Supabase schema
- Updates `src/types/supabase.ts`
- Ensures type safety in the application

### 2. Test the Application

```bash
# Start development server
npm run dev

# Test affected features
# - Business registration
# - Product management
# - Admin panel
# - Public directory
```

### 3. Verify RLS Policies

If migrations modified RLS policies:

1. Test as anonymous user (public access)
2. Test as regular user (own data access)
3. Test as business owner (business data access)
4. Test as admin (full access)

## Migration Best Practices

### Before Creating a Migration

1. **Check SCHEMA_LOCK.md:**
   - Verify your changes don't violate critical rules
   - Ensure you're not dropping protected tables
   - Check for required columns/constraints

2. **Test Locally First:**
   - Apply migration to local Supabase instance
   - Test all affected features
   - Verify RLS policies work correctly

3. **Make Migrations Idempotent:**
   - Use `IF NOT EXISTS` / `IF EXISTS` checks
   - Use `DO $$` blocks for conditional logic
   - Safe to run multiple times

### Migration Naming

Format: `YYYYMMDDHHMMSS_description.sql`

Examples:
- `20250130000000_add_hero_section_table.sql`
- `20250130000001_update_business_status_enum.sql`

### Common Patterns

#### Adding a Column

```sql
-- Idempotent column addition
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'new_column'
  ) THEN
    ALTER TABLE businesses ADD COLUMN new_column TEXT;
  END IF;
END $$;
```

#### Creating a Table

```sql
-- Idempotent table creation
CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Adding RLS Policy

```sql
-- Idempotent policy creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'businesses' AND policyname = 'public_read'
  ) THEN
    CREATE POLICY "public_read" ON businesses
      FOR SELECT USING (status = 'active');
  END IF;
END $$;
```

## Troubleshooting

### Migration Fails

1. **Check Error Message:**
   - Read the full error in Supabase dashboard
   - Common issues: syntax errors, constraint violations, missing dependencies

2. **Rollback if Needed:**
   - If migration partially applied, you may need to manually fix
   - Check migration file for rollback instructions
   - Contact maintainer if unsure

3. **Verify Dependencies:**
   - Ensure previous migrations are applied
   - Check that required tables/columns exist

### Types Out of Sync

If TypeScript errors appear after migration:

```bash
# Regenerate types
npm run gen:types

# Restart dev server
npm run dev
```

### RLS Policy Issues

If data access fails after migration:

1. Check policy definitions in migration
2. Test with different user roles
3. Verify `auth.uid()` is working correctly
4. Check Supabase dashboard → Authentication → Policies

## Emergency Procedures

### If Migration Breaks Production

1. **Stop the Application:**
   - Pause deployments if possible
   - Notify users if necessary

2. **Assess the Damage:**
   - Check which tables/features are affected
   - Review error logs

3. **Rollback Options:**
   - If migration is reversible, create rollback migration
   - If not, manual SQL fixes may be needed
   - Contact database administrator if critical

4. **Prevent Future Issues:**
   - Always test migrations in development first
   - Use staging environment for production-like testing
   - Keep migration backups

## Resources

- [SCHEMA_LOCK.md](./supabase/SCHEMA_LOCK.md) - Schema reference and rules
- [Supabase Migration Docs](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Support

For migration issues:
1. Check this guide first
2. Review SCHEMA_LOCK.md for constraints
3. Test in development environment
4. Contact project maintainer with:
   - Migration file name
   - Error message
   - Steps to reproduce
