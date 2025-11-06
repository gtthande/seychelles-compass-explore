# Admin Workflow Implementation Guide

This document describes the complete admin workflow implementation for the iCompass Business Directory, including RLS policies, admin access control, and pending approval features.

## 1. Database RLS Policies ✅

### Migration File
**File**: `supabase/migrations/20250121000000_admin_rls_policies.sql`

### Key Features:
- **Helper Function**: `is_admin_user(uid)` - Efficiently checks admin status using SECURITY DEFINER
- **Admin Read Policy**: Admins can read ALL businesses (including pending)
- **Public Read Policy**: Non-admins can only read active/approved businesses
- **User Read Policy**: Users can read their own businesses regardless of status
- **Admin Update Policy**: Admins can update any business
- **User Update Policy**: Users can update their own businesses but cannot change status to approved/active
- **Admin Delete Policy**: Admins can delete businesses
- **User Insert Policy**: Users can insert businesses (status defaults to pending)

### To Apply:
```bash
# Run the migration
supabase migration up
# Or apply directly in Supabase Dashboard SQL Editor
```

## 2. Admin Access Control ✅

### Front-end Route Guard
**File**: `src/components/RouteGuard.tsx` (already exists)

The RouteGuard component protects admin routes:
- Checks if user is authenticated
- Checks if user is admin via `useAuth()` hook
- Redirects non-admins to appropriate pages

### Admin Status Check
**File**: `src/hooks/useAuth.ts`

The `useAuth()` hook provides:
- `isAdmin`: Boolean indicating if current user is admin
- Determined from `profiles.is_admin` or `profiles.role === 'admin'`

### Admin Utilities
**File**: `src/lib/admin-utils.ts`

Helper functions for admin operations:
- `checkIsAdmin()`: Check if current user is admin
- `getPendingBusinessesCount()`: Get count of pending businesses
- `subscribeToPendingBusinesses()`: Realtime subscription for pending businesses
- `approveBusiness()`: Approve a business (admin only)
- `rejectBusiness()`: Reject a business (admin only)

## 3. Business Search Filtering ✅

### Directory Search
**File**: `src/pages/Directory.tsx`

**Implementation**:
- Non-admin users: Query filters to only show `status IN ('active', 'approved')`
- Admin users: Query shows all businesses (including pending)
- RLS policies enforce this at the database level
- Client-side filtering improves UX and reduces unnecessary data transfer

**Cache Key**: Includes admin status to differentiate queries:
```typescript
`directory_businesses_${isAdmin ? 'admin' : 'public'}`
```

## 4. Admin Notifications ✅

### Pending Count Badge
**File**: `src/components/admin/PendingCountBadge.tsx`

**Features**:
- Displays count of pending businesses
- Only visible to admins
- Updates in real-time via Supabase Realtime
- Shows badge with count when pending businesses exist

**Usage**:
```tsx
<PendingCountBadge className="ml-1" />
```

### Integration Points:
1. **Admin Panel Tab**: Shows badge on "Businesses" tab
2. **Business Manager**: Shows badge on "Pending Approvals" button
3. **Realtime Updates**: Automatically updates when new businesses are submitted

## 5. Admin Dashboard for Approvals ✅

### Pending Businesses Page
**File**: `src/pages/admin/PendingBusinesses.tsx`

**Features**:
- Lists all pending businesses
- Search functionality
- Real-time updates via Supabase Realtime
- Approve/Reject actions
- View business details
- Shows submitter information

### Realtime Subscriptions:
- **INSERT events**: New pending businesses trigger toast notification
- **UPDATE events**: Updates to pending businesses refresh the list
- Automatically unsubscribes on component unmount

### Approval Workflow:
1. Admin views pending businesses
2. Admin can search/filter pending businesses
3. Admin clicks "Approve" → Status changes to 'active'
4. Admin clicks "Reject" → Status changes to 'suspended'
5. Business is removed from pending list
6. Pending count badge updates automatically

## 6. Security Considerations ✅

### RLS Enforcement:
- All policies use the `is_admin_user()` function for efficiency
- Policies are enforced at the database level
- Front-end filtering is for UX only - RLS is the source of truth

### Admin Status:
- Stored in `profiles.is_admin` (boolean)
- Alternative: `profiles.role === 'admin'`
- Cannot be modified by users (protected by RLS)

### Service Role Key:
- **NEVER** use service role key in front-end
- All admin operations use the admin user's authenticated session
- RLS policies ensure proper access control

## 7. Testing Checklist

### Admin Access:
- [ ] Admin can access `/admin` route
- [ ] Non-admin redirected from `/admin` route
- [ ] Admin can see pending businesses
- [ ] Non-admin cannot see pending businesses

### Search Filtering:
- [ ] Non-admin search only shows active/approved businesses
- [ ] Admin search shows all businesses (including pending)
- [ ] RLS policies prevent unauthorized access

### Pending Approvals:
- [ ] Pending count badge appears for admins
- [ ] Badge updates in real-time
- [ ] Admin can approve businesses
- [ ] Admin can reject businesses
- [ ] Approved businesses appear in public search
- [ ] Rejected businesses do not appear in public search

### Realtime:
- [ ] New pending business triggers notification
- [ ] Pending count updates automatically
- [ ] List refreshes on approval/rejection

## 8. Environment Setup

### Supabase Configuration:
1. Run the RLS migration: `20250121000000_admin_rls_policies.sql`
2. Enable Realtime on `businesses` table:
   - Go to Database → Replication
   - Enable `businesses` table for Realtime

### User Setup:
To make a user an admin:
```sql
UPDATE public.profiles
SET is_admin = true
WHERE user_id = '<user-uuid>';
```

Or using role:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE user_id = '<user-uuid>';
```

## 9. Files Created/Modified

### New Files:
1. `supabase/migrations/20250121000000_admin_rls_policies.sql` - RLS policies
2. `src/lib/admin-utils.ts` - Admin utility functions
3. `src/components/admin/PendingCountBadge.tsx` - Pending count badge component
4. `ADMIN_WORKFLOW_IMPLEMENTATION.md` - This documentation

### Modified Files:
1. `src/pages/Directory.tsx` - Added status filtering based on admin role
2. `src/pages/admin/PendingBusinesses.tsx` - Added realtime subscriptions
3. `src/pages/AdminPanel.tsx` - Added pending count badge to Businesses tab
4. `src/components/admin/OptimizedBusinessManager.tsx` - Added pending count badge

## 10. Best Practices

1. **Always use RLS**: Never bypass RLS policies
2. **Check admin status**: Always verify admin status before showing admin UI
3. **Realtime cleanup**: Always unsubscribe from realtime channels
4. **Error handling**: Handle RLS errors gracefully
5. **Cache invalidation**: Use different cache keys for admin vs public queries
6. **User feedback**: Show clear messages for approval/rejection actions

## 11. Troubleshooting

### Admin cannot see pending businesses:
- Check that `is_admin = true` in profiles table
- Verify RLS policies are applied
- Check that user has refreshed session (logout/login)

### Pending count not updating:
- Verify Realtime is enabled on businesses table
- Check browser console for subscription errors
- Verify admin status is correct

### RLS errors:
- Check that policies are created correctly
- Verify `is_admin_user()` function exists
- Check that RLS is enabled on businesses table

