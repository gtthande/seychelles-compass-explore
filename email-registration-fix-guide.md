# Email Registration Fix Guide

## Current Issues Identified
1. **Email confirmation is enabled** by default in Supabase
2. **Users don't receive confirmation emails** (SMTP not configured)
3. **No proper redirect handling** after email confirmation
4. **Business users and regular users** have different flows
5. **Error messages** are not user-friendly

## Solutions Implemented

### ✅ 1. Improved Auth Component (`src/pages/Auth.tsx`)
- **Better error handling** for different error types
- **Improved user feedback** with specific error messages
- **Enhanced redirect URL** with type parameter
- **Better validation** for email and password

### ✅ 2. Enhanced AuthCallback Component (`src/pages/AuthCallback.tsx`)
- **URL parameter handling** for different redirect types
- **Smart routing** based on user type (admin, business owner, regular user)
- **Better error messages** and retry functionality
- **Proper session handling**

## Manual Configuration Steps

### Step 1: Disable Email Confirmation (Recommended for Development)

1. **Go to Supabase Dashboard**:
   - URL: `https://supabase.com/dashboard/project/bwlmlniotyrjttglbjrl`
   - Navigate to: **Authentication → Settings**

2. **Disable Email Confirmation**:
   - Find "Email Confirmation" section
   - Turn OFF "Enable email confirmations"
   - Click "Save"

3. **Result**: Users can sign up and sign in immediately without email verification

### Step 2: Configure Email Templates (For Production)

If you want to keep email confirmation enabled:

1. **Go to Authentication → Email Templates**
2. **Configure Confirmation Email**:
   - Update the email template
   - Set proper redirect URL: `{{ .SiteURL }}/auth/callback?type=signup`
   - Customize the email content

3. **Configure SMTP Settings**:
   - Go to Authentication → Settings
   - Set up SMTP provider (Gmail, SendGrid, etc.)
   - Test email delivery

### Step 3: Test the Fixes

1. **Test Regular User Registration**:
   - Go to `http://localhost:5173/auth`
   - Sign up with a new email
   - Should work immediately (if email confirmation disabled)

2. **Test Business User Registration**:
   - Sign up as regular user first
   - Go to onboarding
   - Complete business registration
   - Should redirect to dashboard

3. **Test Admin Access**:
   - Create admin user manually in Supabase dashboard
   - Sign in with admin credentials
   - Should redirect to admin panel

## Testing Checklist

### ✅ Regular User Flow
- [ ] Sign up works without email confirmation
- [ ] User is redirected to onboarding
- [ ] Profile is created automatically
- [ ] User can complete onboarding

### ✅ Business User Flow
- [ ] User can register as business owner
- [ ] Business registration form works
- [ ] User is redirected to dashboard after registration
- [ ] Business appears in directory (after approval)

### ✅ Admin User Flow
- [ ] Admin user can sign in
- [ ] Admin is redirected to admin panel
- [ ] Admin can access settings page
- [ ] Admin can manage API keys

### ✅ Error Handling
- [ ] Invalid email shows proper error
- [ ] Password mismatch shows proper error
- [ ] Existing user shows proper error
- [ ] Network errors are handled gracefully

## Troubleshooting

### Issue: "Invalid login credentials"
**Solution**: User doesn't exist. Create user manually in Supabase dashboard.

### Issue: "Email not received"
**Solution**: 
1. Check spam folder
2. Disable email confirmation in Supabase settings
3. Configure SMTP settings

### Issue: "User not redirected after confirmation"
**Solution**: 
1. Check AuthCallback component
2. Verify redirect URLs in Supabase settings
3. Check browser console for errors

### Issue: "Business registration fails"
**Solution**:
1. Check if user has profile
2. Verify business table permissions
3. Check Edge Function logs

## Next Steps

1. **Create admin user manually** (as discussed)
2. **Test all user flows**
3. **Configure production email settings** (if needed)
4. **Set up proper SMTP** for production
5. **Test email delivery** in production environment

## Files Modified

- `src/pages/Auth.tsx` - Improved sign-up handling
- `src/pages/AuthCallback.tsx` - Enhanced redirect logic
- `fix-email-registration.md` - This guide
- `email-registration-fix-guide.md` - Comprehensive guide

## Environment Variables

Make sure these are set in your `.env` file:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SITE_URL=http://localhost:5173
```
