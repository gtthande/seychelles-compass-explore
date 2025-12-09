# iCompass Seychelles - Application Routes

**Last Updated:** December 2025

This document maps all application routes to their responsible components and access requirements.

---

## Route Structure

All routes are defined in `src/App.tsx` using React Router v6.

---

## Public Routes

These routes are accessible to all users (no authentication required).

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Index` | Homepage with hero section, featured listings, and category grid |
| `/directory` | `Directory` | Business directory with search and filtering |
| `/search` | `Search` | Advanced search page |
| `/products` | `Products` | Product catalog page |
| `/business/:id` | `BusinessDetail` | Public business detail page |
| `/docs` | `Documentation` | Documentation page |

---

## Authentication Routes

These routes handle user authentication and account management.

| Route | Component | Description |
|-------|-----------|-------------|
| `/auth` | `Auth` | Login/signup page |
| `/auth/callback` | `AuthCallback` | OAuth callback handler |
| `/auth/reset-password` | `PasswordReset` | Password reset page |
| `/onboarding` | `Onboarding` | New user onboarding flow |

---

## User Dashboard Routes

These routes require authentication but no specific role.

| Route | Component | Description | Protection |
|-------|-----------|-------------|------------|
| `/dashboard` | `Dashboard` | User dashboard | RouteGuard (authenticated) |

---

## Business Owner Routes

These routes require `business` role or business ownership.

| Route | Component | Description | Protection |
|-------|-----------|-------------|------------|
| `/business` | `BusinessDashboard` | Business owner dashboard | RouteGuard |
| `/business/products` | `MyProductsPage` | Business product management | RouteGuard |
| `/business/register` | `BusinessRegister` | Business registration form | Public (but redirects if already registered) |

---

## Admin Routes

These routes require `admin` role (`is_admin = true` OR `role = 'admin'`).

| Route | Component | Description | Protection |
|-------|-----------|-------------|------------|
| `/admin` | `AdminPanel` | Main admin panel | RouteGuard (admin) |
| `/admin/settings` | `AdminPanel` | Admin settings tab | RouteGuard (admin) |
| `/admin/businesses/create` | `BusinessCreate` | Create new business | RouteGuard (admin) |
| `/admin/businesses/edit/:id` | `BusinessEdit` | Edit business | RouteGuard (admin) |
| `/admin/businesses/pending` | `PendingBusinesses` | Pending businesses approval | RouteGuard (admin) |
| `/admin/products/create` | `ProductCreate` | Create new product | RouteGuard (admin) |
| `/admin/products/edit/:id` | `ProductEdit` | Edit product | RouteGuard (admin) |

---

## Utility/Development Routes

These routes are for testing and development purposes.

| Route | Component | Description | Protection |
|-------|-----------|-------------|------------|
| `/payments/test` | `PaymentTest` | Payment testing page | Public |
| `/dev/email-preview` | `EmailPreview` | Email template preview | Public (dev only) |

---

## Catch-All Route

| Route | Component | Description |
|-------|-----------|-------------|
| `*` | `NotFound` | 404 Not Found page |

---

## Route Protection

### RouteGuard Component

The `RouteGuard` component (`src/components/RouteGuard.tsx`) provides route protection:

**Features:**
- Checks user authentication status
- Validates user role (if `requiredRole` prop is provided)
- Checks `is_active` status (if `requireActive` prop is true)
- Redirects to `/auth` if unauthorized
- Shows loading state during verification

**Usage:**
```tsx
<Route path="/admin" element={<RouteGuard><AdminPanel /></RouteGuard>} />
```

**Props:**
- `children` - React node to render if authorized
- `requiredRole?` - Optional role requirement ('admin', 'business', 'user')
- `requireActive?` - Optional flag to require active account

---

## Admin Panel Tabs

The `/admin` route uses a tabbed interface. Tabs are accessible via query parameter:

| Tab | Route | Component | Description |
|-----|-------|-----------|-------------|
| Hero | `/admin?tab=hero` | `HeroSectionManager` | Manage homepage hero section |
| Categories | `/admin?tab=categories` | `CategoryManager` | Manage business categories |
| Businesses | `/admin?tab=businesses` | `OptimizedBusinessManager` | Manage businesses |
| Products | `/admin?tab=products` | `ProductManager` | Manage products |
| Users | `/admin?tab=users` | `OptimizedUserManager` | Manage users |
| Appointments | `/admin?tab=appointments` | `AppointmentManager` | Manage appointments |
| Payments | `/admin?tab=payments` | `PaymentDashboard` | Payment management |
| Settings | `/admin?tab=settings` | `SettingsManager` | System settings |
| Dev Sync | `/admin?tab=dev-sync` | `DevSyncPanel` | Developer sync tools |
| Code Sync | `/admin?tab=code-sync` | `CodeSync` | Code synchronization |
| MySQL Backup | `/admin?tab=mysql-backup` | `MySQLBackup` | Database backup |

---

## Route Component Details

### Public Pages

#### `Index` (`src/pages/Index.tsx`)
- Homepage with hero section
- Featured business listings
- Category grid
- Search functionality

#### `Directory` (`src/pages/Directory.tsx`)
- Business directory listing
- Search and filter functionality
- Island filtering
- Category filtering

#### `Search` (`src/pages/Search.tsx`)
- Advanced search interface
- Full-text search across businesses and products
- Filter options

#### `Products` (`src/pages/Products.tsx`)
- Product catalog display
- Product search
- Category filtering

#### `BusinessDetail` (`src/pages/BusinessDetail.tsx`)
- Public business profile page
- Business information
- Products linked to business
- Contact information
- Map location

---

### Admin Pages

#### `AdminPanel` (`src/pages/AdminPanel.tsx`)
- Main admin dashboard
- Tabbed interface
- Access to all admin features
- Performance monitoring

#### `BusinessCreate` (`src/pages/admin/BusinessCreate.tsx`)
- Form to create new business
- Business information input
- Category selection
- Owner assignment

#### `BusinessEdit` (`src/pages/admin/BusinessEdit.tsx`)
- Form to edit existing business
- All business fields editable
- Location management
- Verification status

#### `PendingBusinesses` (`src/pages/admin/PendingBusinesses.tsx`)
- List of pending business registrations
- Approval/rejection workflow
- Bulk actions

#### `ProductCreate` (`src/pages/admin/ProductCreate.tsx`)
- Form to create new product
- Product information input
- Image upload
- Pricing configuration

#### `ProductEdit` (`src/pages/admin/ProductEdit.tsx`)
- Form to edit existing product
- All product fields editable
- Image management

---

### Business Owner Pages

#### `BusinessDashboard` (`src/pages/BusinessDashboard.tsx`)
- Business owner dashboard
- Business profile management
- Product management
- Location management
- Statistics

#### `MyProductsPage` (`src/pages/dashboard/my-products.tsx`)
- List of products linked to business
- Link/unlink products
- Set custom pricing
- Manage product overrides

---

### Authentication Pages

#### `Auth` (`src/pages/Auth.tsx`)
- Login/signup form
- Email/password authentication
- OAuth providers (if configured)

#### `AuthCallback` (`src/pages/AuthCallback.tsx`)
- Handles OAuth callbacks
- Processes authentication tokens
- Redirects to appropriate page

#### `PasswordReset` (`src/pages/PasswordReset.tsx`)
- Password reset form
- Email verification
- New password input

#### `Onboarding` (`src/pages/Onboarding.tsx`)
- New user onboarding flow
- Profile completion
- Role selection

---

## Navigation

Navigation is handled by the `Navbar` component (`src/components/Navbar.tsx`):

**Public Navigation:**
- Home
- Directory
- Products
- Search
- Login/Register

**Authenticated Navigation:**
- Dashboard
- Business Portal (if business owner)
- Admin Panel (if admin)
- Profile
- Logout

**Business Owner Navigation:**
- Business Dashboard
- My Products
- Business Settings

**Admin Navigation:**
- Admin Panel
- All admin sub-routes

---

## Route Parameters

### Dynamic Routes

| Route | Parameter | Type | Description |
|-------|-----------|------|-------------|
| `/business/:id` | `id` | string (UUID) | Business ID |
| `/admin/businesses/edit/:id` | `id` | string (UUID) | Business ID |
| `/admin/products/edit/:id` | `id` | string (UUID) | Product ID |

### Query Parameters

| Route | Parameter | Description |
|-------|-----------|-------------|
| `/admin` | `tab` | Admin panel tab name |
| `/search` | `q` | Search query |
| `/directory` | `category` | Category filter |
| `/directory` | `island` | Island filter |

---

## Route Guards Summary

| Route Pattern | Required Role | Required Active | Redirect If Unauthorized |
|--------------|---------------|-----------------|---------------------------|
| `/admin/*` | `admin` | Yes | `/auth` |
| `/business` | `business` | Yes | `/auth` |
| `/business/products` | `business` | Yes | `/auth` |
| `/dashboard` | Any authenticated | Yes | `/auth` |
| Public routes | None | No | N/A |

---

## Lazy Loading

Most route components are lazy-loaded for performance:

```tsx
const Index = lazy(() => import("./pages/Index"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
// ... etc
```

**Benefits:**
- Reduced initial bundle size
- Faster initial page load
- Code splitting by route

**Loading State:**
- `LoadingSkeleton` component shown during lazy load
- Wrapped in `Suspense` boundary

---

## Route Changes History

### December 2025
- Added `/business/products` route for business product management
- Consolidated admin routes under `/admin/*`
- Added query parameter support for admin tabs

### Previous
- Initial route structure established
- Authentication routes added
- Admin panel routes added
- Business portal routes added

