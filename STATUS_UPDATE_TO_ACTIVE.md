# Business Status Update: "approved" → "active"

## Summary
Updated all business approval logic to use `"active"` instead of `"approved"` throughout the codebase to match the database schema which uses `business_status` enum with values: `'active', 'pending', 'suspended', 'closed'`.

## Changes Made

### 1. Frontend Code Updates

#### `src/pages/Directory.tsx`
- **Before**: `.in('status', ['active', 'approved'])`
- **After**: `.eq('status', 'active')`
- **Impact**: Non-admin users now only see businesses with `status = 'active'`

#### `src/components/admin/OptimizedBusinessManager.tsx`
- **Status Filter Dropdown**:
  - **Removed**: `"approved"` option
  - **Added**: `"active"` option
  - **Updated options**: `pending`, `active`, `suspended`, `closed`
  
- **Status Change Dropdown** (per business):
  - **Removed**: `"approved"` and `"rejected"` options
  - **Added**: `"active"` and `"suspended"` options
  - **Updated options**: `pending`, `active`, `suspended`, `closed`

### 2. Database RLS Policies

#### `supabase/migrations/20250121000000_admin_rls_policies.sql`
- **Policy Name**: Changed from `"Public can read approved businesses"` to `"Public can read active businesses"`
- **Policy Logic**: 
  - **Before**: `status = 'active' OR status = 'approved'`
  - **After**: `status = 'active'`
- **Comments**: Updated to reflect only `'active'` status

### 3. Already Correct

The following files were already using `'active'` correctly:
- ✅ `src/lib/admin-utils.ts` - `approveBusiness()` function already uses `status: 'active'`
- ✅ `src/pages/admin/PendingBusinesses.tsx` - Uses `approveBusiness()` which sets status to `'active'`
- ✅ `src/components/admin/BusinessVerificationWorkflow.tsx` - Already uses `status: 'active'`

## Database Schema

The `businesses` table uses a `business_status` enum with these values:
```sql
CREATE TYPE business_status AS ENUM ('active', 'pending', 'suspended', 'closed');
```

**Status Values**:
- `'pending'` - Business is awaiting approval
- `'active'` - Business is approved and visible to public
- `'suspended'` - Business is rejected or suspended
- `'closed'` - Business is closed/permanently inactive

## Migration Steps

### 1. Update Existing Data (if needed)
If you have any businesses with `status = 'approved'` in your database, update them:

```sql
-- Update any businesses with 'approved' status to 'active'
UPDATE public.businesses
SET status = 'active'
WHERE status = 'approved';
```

**Note**: This assumes your database enum doesn't include `'approved'`. If it does, you may need to alter the enum type first.

### 2. Apply RLS Policy Updates
Run the updated migration:
```sql
-- File: supabase/migrations/20250121000000_admin_rls_policies.sql
-- This will update the RLS policies to only use 'active'
```

### 3. Verify Changes
1. Check that admin panel status dropdowns show: `pending`, `active`, `suspended`, `closed`
2. Verify that approving a business sets status to `'active'`
3. Confirm that public directory only shows businesses with `status = 'active'`
4. Test that RLS policies allow access to `'active'` businesses only

## Testing Checklist

- [ ] Admin can approve a business (status changes to `'active'`)
- [ ] Admin can reject a business (status changes to `'suspended'`)
- [ ] Public directory only shows businesses with `status = 'active'`
- [ ] Admin panel status filter works with new options
- [ ] Status change dropdown shows correct options
- [ ] RLS policies allow public access to `'active'` businesses only
- [ ] No references to `'approved'` status in queries or UI

## Files Modified

1. ✅ `src/pages/Directory.tsx` - Updated status filter
2. ✅ `src/components/admin/OptimizedBusinessManager.tsx` - Updated status dropdowns
3. ✅ `supabase/migrations/20250121000000_admin_rls_policies.sql` - Updated RLS policies

## Notes

- The `approveBusiness()` function in `src/lib/admin-utils.ts` was already correct and uses `'active'`
- All approval workflows now consistently use `'active'` status
- The database enum type only includes: `'active'`, `'pending'`, `'suspended'`, `'closed'`
- No `'approved'` or `'rejected'` status values exist in the schema

---

**Status**: ✅ **COMPLETE** - All references to `'approved'` have been updated to `'active'`.

