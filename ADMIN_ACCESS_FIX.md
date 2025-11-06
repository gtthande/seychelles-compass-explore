# Admin Access Control Fix

## Problem
Users with admin privileges were getting "Access Denied" errors when trying to access `/admin` route, even though they should have admin access.

## Root Cause
The `RouteGuard` component was:
1. Re-fetching the profile separately instead of using the `isAdmin` value from `useAuth()`
2. Not waiting for the profile to load before checking admin status
3. Using inconsistent logic for determining admin status

## Solution

### 1. Updated RouteGuard Component
**File**: `src/components/RouteGuard.tsx`

**Changes**:
- ✅ Now uses `isAdmin` and `isBusiness` directly from `useAuth()` hook
- ✅ Removed duplicate profile fetching logic
- ✅ Added loading state check to wait for profile to load
- ✅ Added better error logging and debugging
- ✅ Improved error messages with helpful information

**Key Changes**:
```typescript
// Before: Re-fetched profile separately
const { user, loading: authLoading } = useAuth();
// ... separate profile fetch logic ...

// After: Uses isAdmin directly from useAuth
const { user, loading: authLoading, isAdmin, isBusiness, profile } = useAuth();
const userRole = React.useMemo(() => {
  if (isAdmin) return 'admin';
  if (isBusiness) return 'business';
  return 'user';
}, [isAdmin, isBusiness]);
```

### 2. Admin Status Check
**File**: `src/hooks/useAuth.ts`

The `useAuth()` hook already provides:
- `isAdmin`: `profile?.is_admin || profile?.role === 'admin'`
- `isBusiness`: `profile?.is_business_owner || profile?.role === 'business'`

This is the single source of truth for admin status.

### 3. Utility Scripts
Created utility scripts to help verify and set admin status:

**Check Admin Status**:
```bash
# Check specific user
npx tsx scripts/check-admin-status.ts user@example.com

# List all admins
npx tsx scripts/check-admin-status.ts
```

**Set Admin Status**:
```bash
# Make user admin
npx tsx scripts/set-admin.ts user@example.com true

# Remove admin status
npx tsx scripts/set-admin.ts user@example.com false
```

## Verification Steps

### 1. Check User's Admin Status
```bash
npx tsx scripts/check-admin-status.ts your-email@example.com
```

### 2. Set Admin Status (if needed)
```bash
# Make user admin
npx tsx scripts/set-admin.ts your-email@example.com true
```

### 3. Verify in Database
```sql
-- Check admin status
SELECT 
  id,
  email,
  full_name,
  is_admin,
  role,
  is_business_owner
FROM profiles
WHERE email = 'your-email@example.com';

-- Set admin status (if needed)
UPDATE profiles
SET is_admin = true, role = 'admin'
WHERE email = 'your-email@example.com';
```

### 4. Test Access
1. Log out and log back in (to refresh session)
2. Navigate to `/admin`
3. Check browser console for debug logs
4. Should see admin panel if admin status is correct

## Debugging

### Console Logs
The RouteGuard now logs helpful debug information:
- When access is denied, it logs:
  - `userRole`: Current user role
  - `requiredRole`: Required role for the route
  - `isAdmin`: Admin status from useAuth
  - `isBusiness`: Business status from useAuth
  - `profile`: Profile data (is_admin, role)
  - `userId`: User ID

### Common Issues

1. **Profile not loaded yet**
   - **Symptom**: Access denied even though user is admin
   - **Solution**: RouteGuard now waits for profile to load before checking permissions

2. **Admin flag not set in database**
   - **Symptom**: `isAdmin` is false even though user should be admin
   - **Solution**: Run `npx tsx scripts/set-admin.ts user@example.com true`

3. **Session not refreshed**
   - **Symptom**: Admin status changed but still showing old status
   - **Solution**: Log out and log back in to refresh session

4. **Profile doesn't exist**
   - **Symptom**: Profile is null
   - **Solution**: Profile should be auto-created by useAuth, but if not, run the set-admin script which will create it

## Testing Checklist

- [ ] User with `is_admin = true` can access `/admin`
- [ ] User with `role = 'admin'` can access `/admin`
- [ ] User without admin status gets "Access Denied"
- [ ] Loading state shows while profile is loading
- [ ] Console logs show correct admin status
- [ ] Admin panel loads correctly for admin users

## Files Modified

1. `src/components/RouteGuard.tsx` - Fixed to use isAdmin from useAuth
2. `scripts/check-admin-status.ts` - New utility script
3. `scripts/set-admin.ts` - New utility script
4. `ADMIN_ACCESS_FIX.md` - This documentation

## Next Steps

1. **Verify Admin Status**: Run `npx tsx scripts/check-admin-status.ts your-email@example.com`
2. **Set Admin Status** (if needed): Run `npx tsx scripts/set-admin.ts your-email@example.com true`
3. **Test Access**: Log out, log back in, and navigate to `/admin`
4. **Check Console**: Look for debug logs if access is still denied

---

**Status**: ✅ **FIXED** - RouteGuard now correctly uses `isAdmin` from `useAuth()` hook.

