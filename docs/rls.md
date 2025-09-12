# iCompass Seychelles - Row Level Security (RLS) Documentation

## Overview

Row Level Security (RLS) is implemented across all database tables to ensure proper access control and data privacy. This document outlines the security policies and access patterns for different user roles.

## User Roles

### Anonymous Users
- Can view public business listings
- Can view public product listings
- Can view categories
- Can view public reviews
- Can create appointment requests
- Cannot access user-specific data
- Cannot modify any data

### Authenticated Users
- Can view and edit their own profile
- Can create and manage their own businesses
- Can create and manage their own products
- Can write reviews for businesses
- Can make bookings
- Can view their own bookings and reviews

### Business Owners
- Can manage their own business data
- Can manage their own products
- Can view reviews for their businesses
- Can manage bookings for their services
- Can view limited customer profile information

### Administrators
- Full access to all data
- Can manage all businesses and users
- Can approve business registrations
- Can manage categories
- Can view audit logs
- Can access all system functions

## RLS Policies by Table

### `profiles` Table

#### Lovable-Generated Policies (Do Not Edit)
- **"Users can view their own profile only"** - Users can only view their own profile data
- **"Users can update their own profile"** - Users can modify their own profile
- **"Users can insert their own profile"** - Users can create their own profile
- **"Admins can view all profiles"** - Administrators have full profile access
- **"Business owners can view customer basic info for their reviews"** - Limited access for business context

#### Security Functions Used
- `is_admin()` - Checks admin privileges
- `can_view_review_profile(target_user_id)` - Privacy-aware profile access

### `businesses` Table

#### Lovable-Generated Policies (Do Not Edit)
- **"Anyone can view active businesses"** - Public access to active business listings
- **"Business owners can manage their businesses"** - Business owners can manage their own businesses
- **"Admins can manage all businesses"** - Administrators have full business access

#### Access Patterns
- **Public**: Can view businesses with `status = 'active'`
- **Business Owners**: Can manage businesses where they are the owner
- **Admins**: Can manage all businesses regardless of status

### `products` Table

#### Lovable-Generated Policies (Do Not Edit)
- **"Anyone can view active products"** - Public access to active products from active businesses
- **"Business owners can manage their products"** - Business owners can manage products for their businesses
- **"Admins can manage all products"** - Administrators have full product access

#### Access Patterns
- **Public**: Can view products with `status = 'active'` from active businesses
- **Business Owners**: Can manage products for their own businesses
- **Admins**: Can manage all products

### `reviews` Table

#### Lovable-Generated Policies (Do Not Edit)
- **"Anyone can view reviews"** - Public access to all reviews
- **"Users can create reviews"** - Authenticated users can create reviews
- **"Users can update their own reviews"** - Users can modify their own reviews
- **"Users can delete their own reviews"** - Users can delete their own reviews

#### Access Patterns
- **Public**: Can view all reviews
- **Users**: Can create, update, and delete their own reviews
- **Business Owners**: Can view reviews for their businesses (via business relationship)

### `bookings` Table

#### Lovable-Generated Policies (Do Not Edit)
- **"Users can view their own bookings"** - Users can view their own bookings
- **"Users can create bookings"** - Users can create new bookings
- **"Business owners can view bookings for their business"** - Business owners can view bookings for their services

#### Access Patterns
- **Users**: Can view and create their own bookings
- **Business Owners**: Can view bookings for their businesses
- **Admins**: Can view all bookings (via admin policies)

### `appointments` Table

#### Lovable-Generated Policies (Do Not Edit)
- **"Anyone can create appointment requests"** - Public can create appointment requests
- **"Admins can view all appointments"** - Administrators can view all appointment requests
- **"Admins can update appointments"** - Administrators can update appointment status

#### Access Patterns
- **Public**: Can create appointment requests
- **Admins**: Can view and update all appointments

### `categories` Table

#### Lovable-Generated Policies (Do Not Edit)
- **"Anyone can view active categories"** - Public can view active categories
- **"Admins can manage all categories"** - Administrators can manage all categories

#### Access Patterns
- **Public**: Can view categories with `is_active = true`
- **Admins**: Can manage all categories

### `audit_logs` Table

#### Lovable-Generated Policies (Do Not Edit)
- **"Admins can view audit logs"** - Only administrators can view audit logs

#### Access Patterns
- **Admins**: Can view all audit logs
- **Others**: No access to audit logs

## Storage Bucket Policies

### Public Buckets (Lovable-Generated, Do Not Edit)

#### `business-logos`
- **"Anyone can view business logos"** - Public read access
- **"Business owners can upload their logos"** - Authenticated upload for business owners
- **"Business owners can update their logos"** - Business owners can update their logos

#### `business-covers`
- **"Anyone can view business covers"** - Public read access
- **"Business owners can upload their covers"** - Authenticated upload for business owners
- **"Business owners can update their covers"** - Business owners can update their covers

#### `product-images`
- **"Anyone can view product images"** - Public read access
- **"Business owners can upload product images"** - Authenticated upload for business owners

#### `business-documents`
- **"Anyone can view business documents"** - Public read access
- **"Admins can upload business documents"** - Admin-only upload

### Private Buckets (Lovable-Generated, Do Not Edit)

#### `product-catalogues`
- **"Business owners can upload product catalogues"** - Authenticated upload for business owners
- **"Business owners can view their catalogues"** - Business owners can view their own catalogues

## Security Functions

### Lovable-Generated Functions (Do Not Edit)

#### `is_admin()`
Checks if the current user has admin privileges.
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
  );
$$;
```

#### `can_view_review_profile(target_user_id)`
Determines if a business owner can view a reviewer's profile information.
```sql
CREATE OR REPLACE FUNCTION public.can_view_review_profile(target_user_id UUID)
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM businesses b
    JOIN reviews r ON r.business_id = b.id
    JOIN auth.users u ON u.id = b.owner_id
    WHERE u.id = auth.uid() 
    AND r.user_id = target_user_id
  );
$$;
```

## Security Audit Findings

### ✅ Secure Policies
- **Profile Privacy**: Users can only view their own profiles
- **Business Ownership**: Business owners can only manage their own businesses
- **Admin Access**: Proper admin privilege checking
- **Public Data**: Appropriate public access to business listings
- **Audit Logs**: Admin-only access to sensitive audit data

### ⚠️ Areas Requiring Attention

#### 1. Profile Access for Business Context
**Policy**: "Business owners can view customer basic info for their reviews"
**Risk Level**: Low
**Description**: Business owners can view limited profile information of customers who reviewed their businesses
**Mitigation**: Function `can_view_review_profile()` provides controlled access
**Ownership**: Lovable-managed, do not edit

#### 2. Public Review Access
**Policy**: "Anyone can view reviews"
**Risk Level**: Low
**Description**: All reviews are publicly visible
**Mitigation**: Review content is moderated, no sensitive data exposed
**Ownership**: Lovable-managed, do not edit

### 🔒 Security Best Practices Implemented

#### Policy Design
- **Least Privilege**: Users only access data they need
- **Role-Based Access**: Clear separation between user types
- **Data Isolation**: Users cannot access other users' private data
- **Admin Override**: Admins have necessary access for system management

#### Data Protection
- **Sensitive Data**: Phone numbers and personal info protected
- **Business Data**: Public business information appropriately exposed
- **Audit Trail**: All changes logged for security monitoring
- **Function Security**: Security definer functions with proper search paths

## Common Security Patterns

### User-Specific Data Access
```sql
-- Users can only access their own data
USING (user_id = auth.uid())
```

### Business Owner Access
```sql
-- Business owners can access their business data
USING (
  owner_id IN (
    SELECT id FROM profiles 
    WHERE user_id = auth.uid() 
    AND is_business_owner = true
  )
)
```

### Admin Override
```sql
-- Admins can access everything
USING (is_admin())
```

### Public Data Access
```sql
-- Public data is accessible to everyone
USING (status = 'active' AND public = true)
```

## Troubleshooting RLS Issues

### Common Problems
1. **Policy Too Restrictive**: Users can't access their own data
2. **Policy Too Permissive**: Unauthorized access to sensitive data
3. **Function Errors**: Security definer functions failing
4. **Performance Issues**: Complex policies causing slow queries

### Debugging Steps
1. Check user authentication status
2. Verify user role assignments
3. Test policies with different user contexts
4. Review policy logic for edge cases
5. Check function definitions and permissions

### Testing Commands
```sql
-- Check current user
SELECT auth.uid();

-- Check user profile
SELECT * FROM profiles WHERE user_id = auth.uid();

-- Test policy access
SELECT * FROM businesses; -- Should respect RLS policies

-- Check admin status
SELECT is_admin();
```

## Cursor-Safe Adjustments

### Safe to Modify
- **Documentation**: Update this documentation
- **Testing**: Add RLS policy tests
- **Monitoring**: Add security monitoring queries
- **Analysis**: Create security analysis reports

### Do Not Modify
- **RLS Policies**: All policies are Lovable-generated
- **Security Functions**: All security functions are Lovable-generated
- **Storage Policies**: All storage policies are Lovable-generated
- **Database Schema**: Schema changes require proper migrations

## Security Monitoring

### Recommended Monitoring
- **Failed Access Attempts**: Monitor for unauthorized access attempts
- **Policy Performance**: Track slow queries due to RLS policies
- **Admin Actions**: Monitor admin activities in audit logs
- **Data Access Patterns**: Analyze access patterns for anomalies

### Security Alerts
- **Multiple Failed Logins**: Potential brute force attacks
- **Unusual Admin Activity**: Potential privilege escalation
- **Data Export Patterns**: Potential data exfiltration
- **Policy Violations**: Attempts to bypass RLS policies
