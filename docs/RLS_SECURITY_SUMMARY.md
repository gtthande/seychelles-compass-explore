# iCompass Seychelles - RLS Security Summary

**Last Updated:** December 2025

This document provides a comprehensive security summary for every table, detailing who can read, update, and delete data, which RLS policies are applied, and any security risks or TODOs.

---

## Overview

All tables in the iCompass Seychelles platform have Row Level Security (RLS) enabled. RLS policies control access at the row level, ensuring users can only access data they're authorized to see or modify.

---

## Security Model

### User Roles

1. **Anonymous (`anon`):** Unauthenticated users
2. **Authenticated (`authenticated`):** Logged-in users
3. **Business Owners:** Users who own businesses
4. **Admins:** Users with `is_admin = true` OR `role = 'admin'`
5. **Service Role:** Backend service (bypasses RLS)

---

## Table Security Summaries

### 1. `profiles`

**RLS Enabled:** Yes

#### Who Can Read
- **Users:** Can read their own profile (`id = auth.uid() OR user_id = auth.uid()`)
- **Admins:** Can read all profiles (`is_admin = true OR role = 'admin'`)
- **Business Owners:** Can read customer basic info for reviews (limited access)

#### Who Can Update
- **Users:** Can update their own profile (`id = auth.uid() OR user_id = auth.uid()`)
- **Admins:** Can update all profiles (`is_admin = true OR role = 'admin'`)

#### Who Can Delete
- **Admins:** Can delete profiles (via admin policies)
- **System:** Cascade delete on `auth.users` deletion

#### Who Can Insert
- **Users:** Can insert their own profile (`id = auth.uid() OR user_id = auth.uid()`)
- **Admins:** Can insert profiles
- **System:** Auto-created via `handle_new_user()` trigger

#### Applied Policies
- `user_can_select_own_profile` - SELECT
- `Users can update their own profile` - UPDATE
- `Users can insert their own profile` - INSERT
- `Admins can view all profiles` - SELECT
- `Admins can update all profiles` - UPDATE

#### Security Risks
- ⚠️ **Medium:** Profile data includes email and phone - ensure proper access control
- ✅ **Low:** Self-service profile creation is safe (validated via auth.uid())

#### TODOs
- [ ] Consider adding rate limiting on profile updates
- [ ] Add audit logging for profile changes

---

### 2. `categories`

**RLS Enabled:** Yes

#### Who Can Read
- **Everyone:** Public read access (`true`)

#### Who Can Update
- **Admins:** Full access via service_role
- **Authenticated:** No direct update access (admin-only)

#### Who Can Delete
- **Admins:** Full access via service_role

#### Who Can Insert
- **Admins:** Full access via service_role

#### Applied Policies
- `Public read categories` - SELECT (anon, authenticated)
- `Admin full categories` - ALL (service_role)

#### Security Risks
- ✅ **Low:** Public read is safe (categories are non-sensitive)
- ✅ **Low:** Admin-only write access is appropriate

#### TODOs
- [ ] Consider adding soft delete for categories (preserve historical data)
- [ ] Add category usage tracking before deletion

---

### 3. `businesses`

**RLS Enabled:** Yes

#### Who Can Read
- **Everyone:** Public read access (`true`)
- **Business Owners:** Can read their own businesses (regardless of status)
- **Admins:** Can read all businesses (including pending)

#### Who Can Update
- **Business Owners:** Can update their own businesses (`owner_id = auth.uid()`)
- **Admins:** Full access via service_role

#### Who Can Delete
- **Business Owners:** Can delete their own businesses (`owner_id = auth.uid()`)
- **Admins:** Full access via service_role

#### Who Can Insert
- **Authenticated Users:** Can create businesses (becomes owner)
- **Admins:** Full access via service_role

#### Applied Policies
- `Public read businesses` - SELECT (anon, authenticated)
- `Business owners can manage their businesses` - ALL (authenticated, owner check)
- `Admin full businesses` - ALL (service_role)

#### Security Risks
- ⚠️ **Medium:** Business owners can delete their own businesses - consider soft delete
- ✅ **Low:** Public read is safe (business listings are public)
- ⚠️ **Medium:** Business creation requires validation (pending status)

#### TODOs
- [ ] Add soft delete for businesses (preserve data)
- [ ] Add business verification workflow
- [ ] Consider rate limiting on business creation
- [ ] Add audit logging for business changes

---

### 4. `products`

**RLS Enabled:** Yes

#### Who Can Read
- **Everyone:** Public read access (`true`)

#### Who Can Update
- **Admins:** Full access via service_role
- **Business Owners:** No direct update (products are master catalog)

#### Who Can Delete
- **Admins:** Full access via service_role

#### Who Can Insert
- **Admins:** Full access via service_role

#### Applied Policies
- `Public read products` - SELECT (anon, authenticated)
- `Admin full products` - ALL (service_role)

#### Security Risks
- ✅ **Low:** Public read is safe (products are public catalog)
- ✅ **Low:** Admin-only write access is appropriate (master catalog)

#### TODOs
- [ ] Consider adding product versioning
- [ ] Add product usage tracking before deletion
- [ ] Add audit logging for product changes

---

### 5. `business_products`

**RLS Enabled:** Yes

#### Who Can Read
- **Everyone:** Can view active business_products (`is_active = true AND business.status = 'active'`)
- **Business Owners:** Can view their own business_products (`business.owner_id = auth.uid()`)
- **Admins:** Can view all business_products (`profiles.is_admin = true`)

#### Who Can Update
- **Business Owners:** Can update their own business_products (`business.owner_id = auth.uid()`)
- **Admins:** Can update all business_products (`profiles.is_admin = true`)

#### Who Can Delete
- **Business Owners:** Can delete their own business_products (`business.owner_id = auth.uid()`)
- **Admins:** Can delete all business_products (`profiles.is_admin = true`)

#### Who Can Insert
- **Business Owners:** Can insert business_products for their businesses (`business.owner_id = auth.uid()`)
- **Admins:** Can insert all business_products (`profiles.is_admin = true`)

#### Applied Policies
- `Public can view active business_products` - SELECT (anon, authenticated)
- `Business owners can view their business_products` - SELECT (authenticated)
- `Business owners can insert their business_products` - INSERT (authenticated)
- `Business owners can update their business_products` - UPDATE (authenticated)
- `Business owners can delete their business_products` - DELETE (authenticated)
- `Admins can view all business_products` - SELECT (authenticated)
- `Admins can insert all business_products` - INSERT (authenticated)
- `Admins can update all business_products` - UPDATE (authenticated)
- `Admins can delete all business_products` - DELETE (authenticated)

#### Security Risks
- ✅ **Low:** Public read of active products is safe
- ✅ **Low:** Business owners can only manage their own links
- ⚠️ **Medium:** Business owners can delete product links - consider soft delete

#### TODOs
- [ ] Consider adding soft delete for business_products
- [ ] Add validation to prevent duplicate product links
- [ ] Add audit logging for business_product changes

---

## Security Functions

### `is_admin_user(uid UUID)`

**Purpose:** Checks if a user has admin privileges.

**Security:** Uses `SECURITY DEFINER` to bypass RLS for admin check.

**Logic:**
```sql
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE (profiles.id = uid OR profiles.user_id = uid)
    AND (is_admin = true OR role = 'admin')
  );
$$;
```

**Security Risks:**
- ✅ **Low:** Function is secure (checks profiles table)
- ⚠️ **Medium:** Uses SECURITY DEFINER - ensure it's not abused

---

### `can_view_review_profile(target_user_id UUID)`

**Purpose:** Privacy-aware profile access for business owners viewing customer profiles in review context.

**Security:** Uses `SECURITY DEFINER`.

**Logic:**
- Checks if user is business owner
- Checks if target user has reviewed their business
- Returns limited profile data

**Security Risks:**
- ✅ **Low:** Function is secure (limited access)
- ✅ **Low:** Only returns basic info for review context

---

## Common Security Patterns

### 1. Public Read Access
```sql
CREATE POLICY "Public read" ON table_name
  FOR SELECT TO anon, authenticated
  USING (true);
```

**Use Case:** Public listings (businesses, products, categories)

### 2. Owner Access
```sql
CREATE POLICY "Owner access" ON table_name
  FOR ALL TO authenticated
  USING (owner_id = auth.uid());
```

**Use Case:** User-owned resources (businesses, business_products)

### 3. Admin Access
```sql
CREATE POLICY "Admin access" ON table_name
  FOR ALL TO service_role
  USING (true);
```

**Use Case:** Admin-only resources (via service_role)

### 4. Self Access
```sql
CREATE POLICY "Self access" ON table_name
  FOR SELECT TO authenticated
  USING (id = auth.uid());
```

**Use Case:** User profiles

---

## Security Best Practices

### ✅ Implemented

1. **RLS Enabled:** All tables have RLS enabled
2. **Public Read:** Safe public read access for listings
3. **Owner Checks:** Business owners can only manage their own data
4. **Admin Checks:** Admin access properly validated
5. **Cascade Deletes:** Proper foreign key constraints with CASCADE

### ⚠️ Recommendations

1. **Soft Deletes:** Consider soft delete for important data (businesses, products)
2. **Audit Logging:** Add comprehensive audit logging for all changes
3. **Rate Limiting:** Add rate limiting on create/update operations
4. **Input Validation:** Validate all inputs at application level
5. **SQL Injection:** Use parameterized queries (Supabase handles this)
6. **XSS Protection:** Sanitize user inputs before display

---

## Security Risks Summary

### High Risk
- None identified

### Medium Risk
1. **Business Deletion:** Business owners can delete their businesses - consider soft delete
2. **Profile Data:** Profile data includes sensitive info - ensure proper access control
3. **Admin Functions:** SECURITY DEFINER functions - ensure they're not abused

### Low Risk
1. **Public Read:** Public read access is safe for listings
2. **Owner Access:** Owner checks are properly implemented
3. **Admin Access:** Admin access is properly validated

---

## Security TODOs

### Critical
- [ ] Add comprehensive audit logging
- [ ] Implement soft delete for businesses
- [ ] Add rate limiting on create/update operations

### Important
- [ ] Add input validation at database level (check constraints)
- [ ] Add business verification workflow
- [ ] Add product usage tracking before deletion
- [ ] Add category usage tracking before deletion

### Nice to Have
- [ ] Add security monitoring and alerts
- [ ] Add security testing (penetration testing)
- [ ] Add security documentation for developers
- [ ] Add security incident response plan

---

## Testing RLS Policies

### Manual Testing

```sql
-- Test as anonymous user
SET ROLE anon;
SELECT * FROM businesses; -- Should work (public read)

-- Test as authenticated user
SET ROLE authenticated;
SELECT * FROM profiles WHERE id = auth.uid(); -- Should work (own profile)
SELECT * FROM profiles WHERE id != auth.uid(); -- Should fail (not own profile)

-- Test as admin
-- (Admin policies use service_role, so test via application)
```

### Automated Testing

- Test RLS policies in application tests
- Test with different user roles
- Test edge cases (deleted users, inactive accounts)

---

## Notes

- **Service Role:** Bypasses RLS - use only in backend/server code
- **Anon Key:** Uses RLS policies - safe for client-side use
- **Admin Check:** Uses `is_admin = true` OR `role = 'admin'` for flexibility
- **Owner Check:** Uses `owner_id = auth.uid()` for business ownership

---

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- See `docs/SUPABASE_SCHEMA.md` for detailed schema information

