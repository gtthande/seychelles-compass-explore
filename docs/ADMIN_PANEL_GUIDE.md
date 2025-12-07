# iCompass Seychelles - Admin Panel Guide

## Overview

The Admin Panel is a comprehensive management interface for administrators to manage all aspects of the iCompass Seychelles platform. Access is restricted to users with the `admin` role.

**Access URL:** `/admin`  
**Required Role:** `admin`  
**Route Protection:** Yes (via `RouteGuard`)

---

## Access Control

### Authentication

- Admin panel requires user authentication
- Only users with `role = 'admin'` and `is_active = true` can access
- Route is protected by `RouteGuard` component
- Unauthorized users are redirected to `/auth`

### Role Verification

The admin panel checks user role via:
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('role, is_active')
  .eq('id', userId)
  .single();

if (profile?.role !== 'admin' || !profile?.is_active) {
  // Redirect to auth
}
```

---

## Admin Panel Tabs

The admin panel consists of **12 main tabs** organized in a tabbed interface:

### 1. Hero Section

**Icon:** Image  
**Component:** `HeroSectionManager`

#### Features

- **Edit Hero Content**
  - Update homepage title
  - Update homepage subtitle
  - Upload hero background image
  - Preview changes in real-time

#### Workflow

1. Navigate to Admin Panel → Hero Section tab
2. Edit title and/or subtitle
3. Click "Upload Image" to change hero background
4. Click "Save Changes" to update
5. Changes reflect immediately on homepage

#### Database

- **Table:** `hero_section`
- **Fields:** `id`, `title`, `subtitle`, `image_url`, `updated_at`
- **Storage:** Images stored in `hero` bucket

---

### 2. Appointments

**Icon:** Calendar  
**Component:** `LazyTabContent` (with AppointmentManager)

#### Features

- **View Appointments**
  - List all appointment requests
  - Filter by status (pending, approved, rejected)
  - Filter by business
  - View appointment details

- **Manage Appointments**
  - Approve appointment requests
  - Reject appointment requests
  - Add notes to appointments
  - View customer contact information

#### Workflow

1. Navigate to Admin Panel → Appointments tab
2. View list of appointment requests
3. Click on appointment to view details
4. Approve or reject appointment
5. Add notes if needed

#### Database

- **Table:** `appointments`
- **Fields:** `id`, `business_id`, `user_id`, `appointment_date`, `status`, `notes`, `created_at`
- **Status Values:** `pending`, `approved`, `rejected`, `cancelled`

---

### 3. Categories

**Icon:** FolderOpen  
**Component:** `CategoryManager`

#### Features

- **Category Management**
  - Create new categories
  - Edit existing categories
  - Delete categories (soft delete via `is_active`)
  - Upload category images

- **Category Properties**
  - Name (required)
  - Slug (auto-generated, unique)
  - Description (optional)
  - Image URL (uploaded to `category-images` bucket)
  - Active status

#### Workflow

**Create Category:**
1. Navigate to Admin Panel → Categories tab
2. Click "Add Category"
3. Enter category name (slug auto-generates)
4. Add description (optional)
5. Upload category image (optional)
6. Click "Create Category"

**Edit Category:**
1. Find category in list
2. Click "Edit" button
3. Modify fields as needed
4. Upload new image if needed
5. Click "Save Changes"

**Deactivate Category:**
1. Find category in list
2. Click "Deactivate" button
3. Category becomes inactive (hidden from public)

#### Database

- **Table:** `categories`
- **Fields:** `id`, `name`, `slug`, `description`, `image_url`, `is_active`, `created_at`, `updated_at`
- **Storage:** Images in `category-images` bucket

---

### 4. Businesses

**Icon:** Building  
**Component:** `OptimizedBusinessManager`

#### Features

- **Business Management**
  - View all businesses
  - Filter by status (active, pending, suspended, closed)
  - Search businesses by name
  - View business details
  - Edit business information
  - Approve/reject business registrations
  - Verify businesses

- **Pending Businesses Badge**
  - Shows count of pending business registrations
  - Click badge to filter to pending businesses

#### Workflow

**Approve Business:**
1. Navigate to Admin Panel → Businesses tab
2. View pending businesses (badge shows count)
3. Click on business to view details
4. Review business information
5. Click "Approve" to activate business
6. Business becomes visible to public

**Edit Business:**
1. Find business in list
2. Click "Edit" button
3. Modify business fields:
   - Name, description, category
   - Contact information (phone, email, website)
   - Address and location (with map picker)
   - Social media links
   - Status and verification
4. Click "Save Changes"

**Suspend Business:**
1. Find business in list
2. Click "Suspend" button
3. Business status changes to `suspended`
4. Business hidden from public directory

#### Database

- **Table:** `businesses`
- **Fields:** See `PROJECT_STATE_SNAPSHOT.md` for complete schema
- **Status Values:** `active`, `pending`, `suspended`, `closed`

---

### 5. Payments

**Icon:** CreditCard  
**Component:** `PaymentDashboard`

#### Features

- **Payment Monitoring**
  - View all payment transactions
  - Filter by status (completed, pending, failed)
  - Filter by provider (Stripe, Visa, Mastercard, PayPal)
  - Filter by business
  - View payment details
  - Export payment data

- **Payment Information**
  - Transaction ID
  - Amount and currency
  - Payment provider
  - Business and user information
  - Timestamp

#### Workflow

1. Navigate to Admin Panel → Payments tab
2. View payment list (default: all payments)
3. Use filters to narrow down:
   - Status filter (completed, pending, failed)
   - Provider filter (Stripe, Visa, etc.)
   - Business filter
4. Click on payment to view details
5. Export data if needed

#### Database

- **Table:** `payments`
- **Fields:** `id`, `business_id`, `user_id`, `amount`, `currency`, `status`, `provider`, `transaction_id`, `created_at`
- **Status Values:** `completed`, `pending`, `failed`, `refunded`

---

### 6. Users

**Icon:** Users  
**Component:** `OptimizedUserManager`

#### Features

- **User Management**
  - View all user profiles
  - Search users by name or email
  - Filter by role (admin, business, user)
  - Filter by active status
  - Edit user information
  - Change user roles
  - Activate/deactivate users
  - Create new users

- **User Properties**
  - Full name
  - Email
  - Phone
  - Avatar
  - Role (admin, business, user)
  - Active status
  - Business owner flag
  - Admin flag

#### Workflow

**Change User Role:**
1. Navigate to Admin Panel → Users tab
2. Find user in list
3. Click "Edit" button
4. Change role dropdown:
   - `admin` - Full system access
   - `business` - Business dashboard access
   - `user` - Public access only
5. Click "Save Changes"

**Deactivate User:**
1. Find user in list
2. Click "Deactivate" button
3. User's `is_active` set to `false`
4. User cannot log in

**Create User:**
1. Click "Add User" button
2. Fill in user information:
   - Email (required)
   - Password (required)
   - Full name (optional)
   - Role (default: user)
3. Click "Create User"
4. User account created with profile

#### Database

- **Table:** `profiles`
- **Fields:** `id`, `email`, `full_name`, `phone`, `avatar_url`, `role`, `is_admin`, `is_business_owner`, `is_active`, `created_at`, `updated_at`
- **Role Values:** `admin`, `business`, `user`

---

### 7. Products

**Icon:** Package  
**Component:** `ProductManager`

#### Features

- **Product Management**
  - View master product catalogue
  - Create new products
  - Edit existing products
  - Delete products (soft delete via `is_active`)
  - Upload product images (multiple images)
  - Assign products to businesses
  - Manage product status

- **Product Properties**
  - Name (required)
  - Title (optional)
  - Description (optional)
  - Category (optional)
  - Images (array of URLs)
  - Status (active, draft, inactive)
  - Searchable flag
  - Duration (optional)
  - Stock quantity (optional)
  - Slug (optional)

#### Workflow

**Create Product:**
1. Navigate to Admin Panel → Products tab
2. Click "Add Product" button
3. Fill in product form:
   - Name (required)
   - Description
   - Category
   - Upload images (multiple)
   - Set status
4. Click "Create Product"

**Edit Product:**
1. Find product in list
2. Click "Edit" button
3. Modify product fields
4. Add/remove images
5. Click "Save Changes"

**Assign Product to Business:**
1. Find product in list
2. Click "Assign to Business"
3. Select business from dropdown
4. Set business-specific pricing:
   - Price from
   - Price to
   - Currency
5. Add business-specific notes
6. Click "Assign"

#### Database

- **Table:** `products` (master catalogue)
- **Table:** `business_products` (business assignments)
- **Storage:** Images in `product-images` bucket

---

### 8. Settings

**Icon:** Settings  
**Component:** `SettingsManager`

#### Features

- **System Configuration**
  - Google Maps API key management
  - Email service configuration
  - Payment provider settings
  - Site-wide settings
  - Feature flags

#### Workflow

1. Navigate to Admin Panel → Settings tab
2. View current settings
3. Edit settings as needed:
   - Google Maps API key
   - Resend API key
   - Stripe keys
   - Site URL
4. Click "Save Settings"
5. Settings stored in `app_settings` table

#### Database

- **Table:** `app_settings`
- **Fields:** `id`, `key`, `value` (JSONB), `updated_at`

---

### 9. Dev Sync

**Icon:** Terminal  
**Component:** `DevSyncPanel`

#### Features

- **Code Synchronization**
  - Pull latest changes from GitHub
  - Push changes to GitHub
  - Sync UI components
  - Push database migrations to Supabase

#### Workflow

**Pull from GitHub:**
1. Navigate to Admin Panel → Dev Sync tab
2. Click "Pull from GitHub" button (blue)
3. View real-time output in logs panel
4. Latest changes pulled to local repository

**Push to GitHub:**
1. Click "Push to GitHub" button (green)
2. Changes staged, committed, and pushed
3. View commit message and status

**Push DB Migrations:**
1. Click "Push DB Migrations" button (purple)
2. Pending migrations pushed to Supabase
3. View migration status

#### Requirements

- `ALLOW_SYNC=1` environment variable must be set
- Sync server must be running on port 3001
- Git repository must be configured

---

### 10. Code & DB Sync

**Icon:** GitBranch  
**Component:** `CodeSync`

#### Features

- **Advanced Synchronization**
  - Code synchronization tools
  - Database migration management
  - Advanced Git operations

#### Workflow

1. Navigate to Admin Panel → Code & DB Sync tab
2. Use synchronization tools
3. Manage database migrations
4. Perform Git operations

---

### 11. Performance

**Icon:** Activity  
**Component:** `PerformanceMonitor`

#### Features

- **Performance Monitoring**
  - Real-time performance metrics
  - Database query performance
  - API response times
  - Resource usage
  - Performance optimization tools

#### Workflow

1. Navigate to Admin Panel → Performance tab
2. View performance metrics
3. Analyze performance data
4. Use optimization tools if needed

---

### 12. MySQL Backup

**Icon:** Database  
**Component:** `MySQLBackup`

#### Features

- **Database Backup Management**
  - Create database backups
  - Restore from backups
  - Backup history
  - Automated backup scheduling

#### Workflow

1. Navigate to Admin Panel → MySQL Backup tab
2. View backup history
3. Create new backup
4. Restore from backup if needed

---

## Common Admin Tasks

### Approve Pending Business

1. Go to Businesses tab
2. Check pending count badge
3. Filter to pending businesses
4. Review business details
5. Click "Approve"

### Create New Category

1. Go to Categories tab
2. Click "Add Category"
3. Enter name (slug auto-generates)
4. Add description and image
5. Click "Create"

### Promote User to Admin

1. Go to Users tab
2. Find user
3. Click "Edit"
4. Change role to "admin"
5. Click "Save"

### Upload Product Images

1. Go to Products tab
2. Create or edit product
3. Click "Upload Images"
4. Select multiple images
5. Images upload to `product-images` bucket
6. Images saved to `products.images` array

### Manage Business Verification

1. Go to Businesses tab
2. Find business
3. Click "Edit"
4. Toggle "Verified" checkbox
5. Click "Save"

---

## Keyboard Shortcuts

- `Ctrl/Cmd + K` - Open search (if implemented)
- `Esc` - Close modals/dialogs
- `Enter` - Submit forms
- `Tab` - Navigate between fields

---

## Error Handling

### Common Errors

**"Permission Denied"**
- User doesn't have admin role
- User account is inactive
- RLS policy blocking access

**"Resource Not Found"**
- Record doesn't exist
- Record was deleted
- Invalid ID provided

**"Upload Failed"**
- Storage bucket doesn't exist
- File too large
- Invalid file type
- Network error

### Troubleshooting

1. **Check user role:** Verify user has `role = 'admin'`
2. **Check RLS policies:** Ensure admin policies are correct
3. **Check storage buckets:** Verify buckets exist in Supabase
4. **Check network:** Verify Supabase connection
5. **Check console:** Review browser console for errors

---

## Best Practices

1. **Always verify before deleting** - Use soft deletes when possible
2. **Test changes in development** - Don't test in production
3. **Backup before major changes** - Use MySQL Backup tool
4. **Monitor performance** - Use Performance tab regularly
5. **Review audit logs** - Check `audit_logs` table for changes
6. **Communicate changes** - Notify team of major updates
7. **Document custom workflows** - Keep notes on complex processes

---

## Security Considerations

1. **Admin Access**
   - Only grant admin role to trusted users
   - Regularly review admin user list
   - Deactivate unused admin accounts

2. **Data Protection**
   - Never share admin credentials
   - Use strong passwords
   - Enable 2FA if available

3. **Audit Trail**
   - All admin actions logged in `audit_logs`
   - Review audit logs regularly
   - Monitor for suspicious activity

---

## Support

For issues or questions:
1. Check this documentation
2. Review error messages in console
3. Check Supabase Dashboard for database issues
4. Review `audit_logs` table for action history
5. Contact development team

---

**Last Updated:** 2025-01-30  
**Admin Panel Version:** 1.0




