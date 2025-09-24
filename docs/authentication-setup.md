# Authentication Setup Guide

## Overview
This guide provides complete instructions for setting up authentication and role-based access control for the Seychelles Compass Explore application.

## Current Database Schema

### Profiles Table Structure
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  business_name TEXT,
  is_business_owner BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Test Users Setup

### Admin User (Ready)
- **Email**: gtthande@gmail.com
- **Password**: Admin123!
- **Role**: admin
- **User ID**: 6e9d39ce-9185-49f8-86b5-3a4167ca55d9
- **Status**: ✅ Profile exists and is configured as admin

### Business User (Ready)
- **Email**: testbusiness@seychellescompass.com
- **Password**: TestBusiness123!
- **Role**: business
- **Status**: ✅ Profile exists and is configured as business owner

## Authentication Flow

### 1. User Login Process
1. User enters credentials in the login form
2. Supabase Auth validates credentials
3. On successful login, `useAuth` hook fetches user profile
4. Profile data includes role information (`is_admin`, `is_business_owner`, `role`)
5. User is redirected based on their role

### 2. Role-Based Access Control
- **Admin Users** (`is_admin: true` or `role: 'admin'`):
  - Access to `/admin` panel
  - Can manage all users, businesses, and system settings
  - Full system access

- **Business Users** (`is_business_owner: true` or `role: 'business'`):
  - Access to `/business` dashboard
  - Can manage their own businesses and products
  - Limited to their own data

- **Regular Users** (`role: 'user'`):
  - Access to public pages and directory
  - Can register their own business (becomes business user)
  - No admin or business management access

### 3. Route Protection
The `RouteGuard` component protects routes based on required roles:
```tsx
<RouteGuard requiredRole="admin">
  <AdminPanel />
</RouteGuard>
```

## Manual User Creation in Supabase

### Step 1: Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `seychelles-compass-explore`
3. Navigate to **Authentication** > **Users**

### Step 2: Create Admin User
1. Click **"Add user"**
2. Fill in the details:
   - **Email**: gtthande@gmail.com
   - **Password**: Admin123!
   - **User ID**: 6e9d39ce-9185-49f8-86b5-3a4167ca55d9 (exact match required)
   - **Email Confirmed**: ✅ (check this box)
3. Click **"Create user"**

### Step 3: Create Business User
1. Click **"Add user"** again
2. Fill in the details:
   - **Email**: testbusiness@seychellescompass.com
   - **Password**: TestBusiness123!
   - **User ID**: (generate new UUID or use existing)
   - **Email Confirmed**: ✅ (check this box)
3. Click **"Create user"**

## Testing Authentication

### 1. Test Admin Login
1. Navigate to the application login page
2. Enter admin credentials:
   - Email: gtthande@gmail.com
   - Password: Admin123!
3. Verify you can access `/admin` panel
4. Check that admin features are available

### 2. Test Business User Login
1. Log out and navigate to login page
2. Enter business user credentials:
   - Email: testbusiness@seychellescompass.com
   - Password: TestBusiness123!
3. Verify you can access `/business` dashboard
4. Check that business management features are available

### 3. Test Access Control
1. Try accessing `/admin` with business user account
2. Verify you get "Access Denied" message
3. Try accessing `/business` with regular user account
4. Verify appropriate access controls are in place

## Role Management

### Promoting Users to Admin
```sql
UPDATE public.profiles 
SET is_admin = true, role = 'admin' 
WHERE email = 'user@example.com';
```

### Promoting Users to Business Owner
```sql
UPDATE public.profiles 
SET is_business_owner = true, role = 'business' 
WHERE email = 'user@example.com';
```

### Deactivating Users
```sql
UPDATE public.profiles 
SET is_admin = false, is_business_owner = false, role = 'user' 
WHERE email = 'user@example.com';
```

## Security Features

### Row Level Security (RLS)
- Users can only view and update their own profiles
- Admins can view and update all profiles
- Business owners can manage their own businesses

### Authentication Policies
- Email confirmation required for new users
- Password strength requirements enforced
- Session management with automatic refresh

### Data Protection
- Sensitive data encrypted in transit and at rest
- API keys secured in environment variables
- User permissions validated on every request

## Troubleshooting

### Common Issues

#### 1. "Access Denied" on Admin Panel
**Cause**: User profile not properly configured as admin
**Solution**: 
```sql
UPDATE public.profiles 
SET is_admin = true, role = 'admin' 
WHERE user_id = 'USER_ID_HERE';
```

#### 2. Profile Not Found After Login
**Cause**: Profile doesn't exist for authenticated user
**Solution**: The `useAuth` hook automatically creates profiles for new users

#### 3. Role Not Updating
**Cause**: Cache or session not refreshed
**Solution**: Log out and log back in, or clear browser cache

### Debug Commands
```bash
# Check user profiles
npx tsx admin/check-database.ts

# Setup admin user
npx tsx admin/setup-admin-user.ts

# Verify authentication
npx tsx admin/verify-auth.ts
```

## Production Deployment

### Environment Variables
Ensure these are set in your production environment:
```bash
VITE_SUPABASE_URL=https://bwlmlniotyrjttglbjrl.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_MAPS_API_KEY=AIzaSyByNrxUDO-dODXwTaT6RINSbAfASZ-eGfY
```

### Security Checklist
- ✅ RLS policies enabled on all tables
- ✅ Authentication policies configured
- ✅ Environment variables secured
- ✅ Admin users properly configured
- ✅ Role-based access control tested
- ✅ Session management working
- ✅ Password policies enforced

## Support

For authentication issues:
1. Check Supabase dashboard for user status
2. Verify profile data in database
3. Test with provided test credentials
4. Review browser console for errors
5. Check network requests in developer tools

## Success Indicators

✅ **Authentication Working When:**
- Admin user can log in and access `/admin`
- Business user can log in and access `/business`
- Regular users get appropriate access controls
- Role-based redirects work correctly
- Session persistence works across page refreshes
- Logout functionality works properly
- New user registration creates profiles automatically
