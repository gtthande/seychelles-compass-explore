# iCompass Seychelles - Component Map

**Last Updated:** December 2025

This document provides an overview of all major components in the `src/components/` directory, their purpose, props, Supabase queries, and dependencies.

---

## Component Structure

```
src/components/
├── admin/              # Admin panel components
├── business/           # Business portal components
├── products/           # Product-related components
├── ui/                 # shadcn/ui base components
└── [root components]   # Shared/common components
```

---

## Root Components

### `Navbar` (`src/components/Navbar.tsx`)

**Purpose:** Main navigation bar with authentication-aware menu items.

**Props:** None (uses hooks internally)

**Features:**
- Responsive mobile menu
- Authentication state display
- Role-based navigation items
- Search functionality

**Dependencies:**
- `useAuth` hook
- React Router (`useNavigate`, `Link`)
- shadcn/ui components (`Sheet`, `NavigationMenu`)

**Supabase Queries:**
- None (uses `useAuth` hook which handles auth)

---

### `Hero` (`src/components/Hero.tsx`)

**Purpose:** Homepage hero section with search functionality.

**Props:** None

**Features:**
- Hero background image
- Search bar with typeahead
- Live statistics display
- Call-to-action buttons

**Dependencies:**
- `useLiveCounters` hook
- `useHeroSection` hook
- `SearchWithTypeahead` (lazy-loaded)
- `OptimizedImage`

**Supabase Queries:**
- Fetches hero section via `useHeroSection` hook
- Fetches live counters via `useLiveCounters` hook

---

### `RouteGuard` (`src/components/RouteGuard.tsx`)

**Purpose:** Protects routes requiring authentication.

**Props:**
```typescript
{
  children: React.ReactNode;
  requiredRole?: 'admin' | 'business' | 'user';
  requireActive?: boolean;
}
```

**Features:**
- Session validation
- Role checking
- Active status checking
- Redirects to `/auth` if unauthorized

**Dependencies:**
- Supabase client
- React Router (`Navigate`, `useLocation`)

**Supabase Queries:**
- `supabase.auth.getSession()`
- `supabase.auth.onAuthStateChange()`

---

### `BusinessTable` (`src/components/BusinessTable.tsx`)

**Purpose:** Displays businesses in a table format.

**Props:**
```typescript
{
  businesses: Business[];
  searchTerm?: string;
}
```

**Features:**
- Expandable rows
- Business details display
- Contact information
- Map integration
- Social media links

**Dependencies:**
- React Router (`useNavigate`)
- shadcn/ui components (`Card`, `Badge`, `Button`)

**Supabase Queries:** None (receives data as props)

---

### `CategoryGrid` (`src/components/CategoryGrid.tsx`)

**Purpose:** Displays business categories in a grid layout.

**Props:** None

**Features:**
- Category cards with images
- Category count display
- Navigation to category pages
- Optimized image loading

**Dependencies:**
- Supabase client
- `OptimizedImage`
- `useToast` hook

**Supabase Queries:**
- `supabase.from('categories').select('*')`
- Counts businesses per category

---

### `OptimizedCategoryGrid` (`src/components/OptimizedCategoryGrid.tsx`)

**Purpose:** Optimized version of CategoryGrid with performance improvements.

**Props:** None

**Features:**
- Memoized category data
- Lazy loading
- Error boundaries
- Performance monitoring

**Dependencies:**
- Same as `CategoryGrid`

**Supabase Queries:**
- Same as `CategoryGrid` with caching

---

### `LiveCounters` (`src/components/LiveCounters.tsx`)

**Purpose:** Displays real-time statistics (businesses, products, categories, users).

**Props:** None

**Features:**
- Animated counters
- Real-time updates
- Loading states

**Dependencies:**
- `useLiveCounters` hook

**Supabase Queries:**
- Uses `get_live_counters()` RPC function via hook

---

### `OptimizedFeaturedListings` (`src/components/OptimizedFeaturedListings.tsx`)

**Purpose:** Displays featured business listings.

**Props:** None

**Features:**
- Featured businesses carousel
- Optimized rendering
- Image lazy loading

**Dependencies:**
- Supabase client
- `OptimizedImage`

**Supabase Queries:**
- `supabase.from('businesses').select('*').eq('featured', true)`

---

### `SearchWithTypeahead` (`src/components/SearchWithTypeahead.tsx`)

**Purpose:** Search input with typeahead suggestions.

**Props:**
```typescript
{
  onSearch: (query: string) => void;
  placeholder?: string;
}
```

**Features:**
- Real-time search suggestions
- Debounced input
- Keyboard navigation

**Dependencies:**
- Supabase client

**Supabase Queries:**
- Full-text search on businesses and products

---

### `BusinessSearch` (`src/components/BusinessSearch.tsx`)

**Purpose:** Advanced business search component.

**Props:** None

**Features:**
- Search filters (category, island, status)
- Results pagination
- Sort options

**Dependencies:**
- Supabase client
- React Query

**Supabase Queries:**
- `supabase.from('businesses').select('*, categories(*)')`
- Filtered by search term, category, island

---

### `LoadingSkeleton` (`src/components/LoadingSkeleton.tsx`)

**Purpose:** Loading placeholder component.

**Props:** None

**Features:**
- Animated skeleton
- Responsive layout

**Dependencies:**
- shadcn/ui `Skeleton` component

---

### `ErrorBoundary` (`src/components/ErrorBoundary.tsx`)

**Purpose:** Catches and displays React errors.

**Props:**
```typescript
{
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}
```

**Features:**
- Error catching
- Error display
- Recovery options

---

### `OptimizedImage` (`src/components/OptimizedImage.tsx`)

**Purpose:** Optimized image component with lazy loading.

**Props:**
```typescript
{
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}
```

**Features:**
- Lazy loading
- Placeholder display
- Error handling

---

## Admin Components (`src/components/admin/`)

### `CategoryManager` (`src/components/admin/CategoryManager.tsx`)

**Purpose:** Admin interface for managing business categories.

**Props:** None

**Features:**
- Create/edit/delete categories
- Upload category images
- Activate/deactivate categories
- Category list with search

**Dependencies:**
- Supabase client
- React Hook Form
- Zod validation
- `useToast` hook

**Supabase Queries:**
- `supabase.from('categories').select('*')`
- `supabase.from('categories').insert()`
- `supabase.from('categories').update()`
- `supabase.from('categories').delete()`
- Storage: `supabase.storage.from('category-images').upload()`

---

### `HeroSectionManager` (`src/components/admin/HeroSectionManager.tsx`)

**Purpose:** Admin interface for managing homepage hero section.

**Props:** None

**Features:**
- Edit hero title and subtitle
- Upload hero background image
- Preview changes

**Dependencies:**
- `useHeroSection` hook
- Supabase Storage
- `useToast` hook

**Supabase Queries:**
- `supabase.from('hero_section').select('*').single()`
- `supabase.from('hero_section').update()`
- Storage: `supabase.storage.from('hero').upload()`

---

### `OptimizedBusinessManager` (`src/components/admin/OptimizedBusinessManager.tsx`)

**Purpose:** Admin interface for managing businesses.

**Props:** None

**Features:**
- List all businesses
- Create/edit/delete businesses
- Approve/reject businesses
- Filter and search
- Bulk actions

**Dependencies:**
- Supabase client
- React Query
- `useToast` hook

**Supabase Queries:**
- `supabase.from('businesses').select('*, profiles(*), categories(*)')`
- `supabase.from('businesses').insert()`
- `supabase.from('businesses').update()`
- `supabase.from('businesses').delete()`

---

### `OptimizedUserManager` (`src/components/admin/OptimizedUserManager.tsx`)

**Purpose:** Admin interface for managing users.

**Props:** None

**Features:**
- List all users
- Edit user roles
- Activate/deactivate users
- View user profiles

**Dependencies:**
- Supabase client
- React Query

**Supabase Queries:**
- `supabase.from('profiles').select('*')`
- `supabase.from('profiles').update()`

---

### `ProductManager` (`src/components/admin/ProductManager.tsx`)

**Purpose:** Admin interface for managing products.

**Props:** None

**Features:**
- List all products
- Create/edit/delete products
- Link products to businesses
- Manage product images

**Dependencies:**
- Supabase client
- React Query

**Supabase Queries:**
- `supabase.from('products').select('*')`
- `supabase.from('products').insert()`
- `supabase.from('products').update()`
- `supabase.from('products').delete()`
- `supabase.from('business_products').select('*, businesses(*), products(*)')`

---

### `AppointmentManager` (`src/components/admin/AppointmentManager.tsx`)

**Purpose:** Admin interface for managing appointments.

**Props:** None

**Features:**
- List all appointments
- Approve/reject appointments
- Filter by status and business

**Dependencies:**
- Supabase client

**Supabase Queries:**
- `supabase.from('appointments').select('*, businesses(*), profiles(*)')`
- `supabase.from('appointments').update()`

---

### `PaymentDashboard` (`src/components/admin/PaymentDashboard.tsx`)

**Purpose:** Admin interface for payment management.

**Props:** None

**Features:**
- View payment transactions
- Payment analytics
- Manage payment providers

**Dependencies:**
- Supabase client

**Supabase Queries:**
- `supabase.from('payments').select('*')`

---

### `SettingsManager` (`src/components/admin/SettingsManager.tsx`)

**Purpose:** Admin interface for system settings.

**Props:** None

**Features:**
- Google Maps API key management
- Storage bucket configuration
- System configuration

**Dependencies:**
- Supabase client

**Supabase Queries:**
- `supabase.from('app_settings').select('*')`
- `supabase.from('app_settings').update()`

---

### `LazyTabContent` (`src/components/admin/LazyTabContent.tsx`)

**Purpose:** Lazy-loads admin tab content for performance.

**Props:**
```typescript
{
  tab: string;
  children: React.ReactNode;
}
```

**Features:**
- Lazy loading
- Loading states
- Error boundaries

---

## Business Components (`src/components/business/`)

### `BusinessDashboard` (`src/components/business/BusinessDashboard.tsx`)

**Purpose:** Business owner dashboard component.

**Props:** None

**Features:**
- Business profile display
- Quick stats
- Navigation to business features

**Dependencies:**
- `useBusinessAuth` hook
- Supabase client

**Supabase Queries:**
- Fetches business via `useBusinessAuth` hook

---

### `ProductList` (`src/components/business/ProductList.tsx`)

**Purpose:** Displays products linked to a business.

**Props:**
```typescript
{
  businessId: string;
}
```

**Features:**
- List linked products
- Link/unlink products
- Set custom pricing

**Dependencies:**
- Supabase client

**Supabase Queries:**
- `supabase.from('business_products').select('*, products(*)').eq('business_id', businessId)`
- `supabase.from('business_products').insert()`
- `supabase.from('business_products').update()`
- `supabase.from('business_products').delete()`

---

### `BusinessLocationMap` (`src/components/business/BusinessLocationMap.tsx`)

**Purpose:** Map component for business location selection.

**Props:**
```typescript
{
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number) => void;
}
```

**Features:**
- Interactive map
- Location picker
- Geocoding integration

**Dependencies:**
- Google Maps API
- `MapLocationPicker` component

---

### `BusinessRegistration` (`src/components/business/BusinessRegistration.tsx`)

**Purpose:** Business registration form.

**Props:** None

**Features:**
- Business information form
- Category selection
- Location selection
- Image upload

**Dependencies:**
- React Hook Form
- Zod validation
- Supabase client

**Supabase Queries:**
- `supabase.from('businesses').insert()`
- `supabase.from('categories').select('*')`

---

## Product Components (`src/components/products/`)

### `ProductList` (`src/components/products/ProductList.tsx`)

**Purpose:** Displays a list of products.

**Props:**
```typescript
{
  products: Product[];
  onProductClick?: (product: Product) => void;
}
```

**Features:**
- Product cards
- Image display
- Price display
- Click handling

**Dependencies:**
- `OptimizedImage`

**Supabase Queries:** None (receives data as props)

---

### `ProductForm` (`src/components/products/ProductForm.tsx`)

**Purpose:** Form for creating/editing products.

**Props:**
```typescript
{
  product?: Product;
  onSubmit: (data: ProductFormData) => void;
  onCancel?: () => void;
}
```

**Features:**
- Product information form
- Image upload
- Validation

**Dependencies:**
- React Hook Form
- Zod validation
- Supabase Storage

**Supabase Queries:**
- Storage: `supabase.storage.from('product-images').upload()`

---

## UI Components (`src/components/ui/`)

All UI components are from shadcn/ui library. Key components include:

- `Button` - Button component
- `Card` - Card container
- `Dialog` - Modal dialogs
- `Input` - Text input
- `Select` - Dropdown select
- `Tabs` - Tabbed interface
- `Toast` - Toast notifications
- `Badge` - Badge component
- `Avatar` - Avatar component
- `Table` - Table component
- `Form` - Form components with validation

**Documentation:** See [shadcn/ui documentation](https://ui.shadcn.com/)

---

## Component Dependencies Summary

### Common Hooks Used

- `useAuth` - Authentication state
- `useToast` - Toast notifications
- `useLiveCounters` - Live statistics
- `useHeroSection` - Hero section data
- `useBusinessAuth` - Business authentication

### Common Supabase Patterns

1. **Select queries:**
   ```typescript
   supabase.from('table').select('*, related_table(*)')
   ```

2. **Insert queries:**
   ```typescript
   supabase.from('table').insert(data)
   ```

3. **Update queries:**
   ```typescript
   supabase.from('table').update(data).eq('id', id)
   ```

4. **Delete queries:**
   ```typescript
   supabase.from('table').delete().eq('id', id)
   ```

5. **Storage uploads:**
   ```typescript
   supabase.storage.from('bucket').upload(path, file)
   ```

---

## Performance Optimizations

### Lazy Loading
- `SearchWithTypeahead` - Lazy-loaded in Hero component
- Admin tab content - Lazy-loaded via `LazyTabContent`

### Memoization
- `OptimizedCategoryGrid` - Memoized category data
- `Navbar` - Memoized navigation items

### Image Optimization
- `OptimizedImage` - Lazy loading and placeholder
- Image compression before upload

### Query Optimization
- React Query for caching
- Selective field queries (`.select('field1, field2')`)
- Indexed queries on foreign keys

---

## Component Testing

Components should be tested for:
- Props validation
- Supabase query error handling
- Loading states
- Error boundaries
- Accessibility (ARIA labels, keyboard navigation)

---

## Notes

- All components use TypeScript for type safety
- Components follow React best practices (hooks, functional components)
- Error handling is implemented via error boundaries and try-catch
- Loading states are shown during async operations
- Toast notifications provide user feedback

