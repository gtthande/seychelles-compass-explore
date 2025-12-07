# iCompass Seychelles - API Documentation

## Overview

The iCompass Seychelles platform uses **Supabase** as its backend, providing:
- PostgreSQL database with Row Level Security (RLS)
- Real-time subscriptions
- Authentication and authorization
- File storage
- Edge Functions for serverless operations

All API interactions are performed directly through the Supabase client library in the frontend.

---

## Base Configuration

### Supabase Client

**Location:** `src/integrations/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Environment Variables

```bash
VITE_SUPABASE_URL=https://bwlmlniotyrjttglbjrl.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

---

## Database Tables & Queries

### Profiles

**Table:** `profiles`

#### Get Current User Profile

```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

#### Update Profile

```typescript
const { data, error } = await supabase
  .from('profiles')
  .update({
    full_name: 'John Doe',
    phone: '+248 4 123 456',
    avatar_url: 'https://...'
  })
  .eq('id', userId);
```

**RLS Policies:**
- Users can read/update their own profile
- Admins can read/update all profiles

---

### Businesses

**Table:** `businesses`

#### List Active Businesses

```typescript
const { data, error } = await supabase
  .from('businesses')
  .select('*')
  .eq('status', 'active')
  .order('name');
```

#### Get Business by ID

```typescript
const { data, error } = await supabase
  .from('businesses')
  .select('*')
  .eq('id', businessId)
  .single();
```

#### Search Businesses

```typescript
const { data, error } = await supabase
  .from('businesses')
  .select('id, name, description, category, address')
  .eq('status', 'active')
  .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
  .limit(10);
```

#### Filter by Category

```typescript
const { data, error } = await supabase
  .from('businesses')
  .select('*')
  .eq('status', 'active')
  .eq('category', categoryName);
```

#### Create Business (Business Owner Only)

```typescript
const { data, error } = await supabase
  .from('businesses')
  .insert({
    name: 'Business Name',
    description: 'Business description',
    category: 'restaurant',
    phone: '+248 4 123 456',
    email: 'info@business.sc',
    address: 'Victoria, Mahé',
    owner_id: userId
  });
```

#### Update Business (Owner or Admin Only)

```typescript
const { data, error } = await supabase
  .from('businesses')
  .update({
    name: 'Updated Name',
    description: 'Updated description'
  })
  .eq('id', businessId);
```

**RLS Policies:**
- Public can read active businesses
- Business owners can manage their own businesses
- Admins can manage all businesses

---

### Categories

**Table:** `categories`

#### List Active Categories

```typescript
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .eq('is_active', true)
  .order('name');
```

#### Get Category by Slug

```typescript
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .eq('slug', categorySlug)
  .single();
```

#### Create Category (Admin Only)

```typescript
const { data, error } = await supabase
  .from('categories')
  .insert({
    name: 'Category Name',
    slug: 'category-slug',
    description: 'Category description',
    is_active: true
  });
```

**RLS Policies:**
- Public can read active categories
- Admins can manage all categories

---

### Products

**Table:** `products` (Master Product Catalogue)

#### List Active Products

```typescript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true)
  .order('name');
```

#### Get Product by ID

```typescript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('id', productId)
  .single();
```

#### Search Products

```typescript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true)
  .eq('searchable', true)
  .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
  .limit(20);
```

#### Create Product (Admin Only)

```typescript
const { data, error } = await supabase
  .from('products')
  .insert({
    name: 'Product Name',
    description: 'Product description',
    category: 'tourism',
    image_url: 'https://...',
    images: ['https://...', 'https://...'],
    status: 'active',
    is_active: true,
    searchable: true
  });
```

**RLS Policies:**
- Public can read active products
- Admins can manage all products

---

### Business Products

**Table:** `business_products` (Business-Product Assignments)

#### Get Products for a Business

```typescript
const { data, error } = await supabase
  .from('business_products')
  .select(`
    *,
    product:products(*)
  `)
  .eq('business_id', businessId)
  .eq('is_active', true);
```

#### Assign Product to Business

```typescript
const { data, error } = await supabase
  .from('business_products')
  .insert({
    business_id: businessId,
    product_id: productId,
    price_from: 100.00,
    price_to: 200.00,
    currency_code: 'SCR',
    is_active: true
  });
```

#### Update Business Product

```typescript
const { data, error } = await supabase
  .from('business_products')
  .update({
    price_from: 150.00,
    price_to: 250.00,
    is_active: true
  })
  .eq('id', businessProductId);
```

**RLS Policies:**
- Public can read active business products
- Business owners can manage products for their businesses
- Admins can manage all business products

---

### Reviews

**Table:** `reviews`

#### Get Reviews for a Business

```typescript
const { data, error } = await supabase
  .from('reviews')
  .select(`
    *,
    user:profiles(id, full_name, avatar_url)
  `)
  .eq('business_id', businessId)
  .order('created_at', { ascending: false });
```

#### Create Review

```typescript
const { data, error } = await supabase
  .from('reviews')
  .insert({
    business_id: businessId,
    user_id: userId,
    rating: 5,
    comment: 'Great service!',
    image_url: 'https://...' // optional
  });
```

**RLS Policies:**
- Public can read reviews
- Users can create reviews (for themselves)
- Admins can manage all reviews

---

### Appointments

**Table:** `appointments`

#### Get Appointments for a Business

```typescript
const { data, error } = await supabase
  .from('appointments')
  .select(`
    *,
    user:profiles(id, full_name, email, phone)
  `)
  .eq('business_id', businessId)
  .order('appointment_date', { ascending: true });
```

#### Create Appointment

```typescript
const { data, error } = await supabase
  .from('appointments')
  .insert({
    business_id: businessId,
    user_id: userId,
    appointment_date: '2025-02-15T10:00:00Z',
    status: 'pending',
    notes: 'Appointment notes'
  });
```

#### Update Appointment Status (Admin/Business Owner)

```typescript
const { data, error } = await supabase
  .from('appointments')
  .update({
    status: 'approved' // or 'rejected'
  })
  .eq('id', appointmentId);
```

**RLS Policies:**
- Users can create appointments
- Business owners can view/manage appointments for their businesses
- Admins can view/manage all appointments

---

### Payments

**Table:** `payments`

#### Get Payments for a Business

```typescript
const { data, error } = await supabase
  .from('payments')
  .select('*')
  .eq('business_id', businessId)
  .order('created_at', { ascending: false });
```

#### Create Payment

```typescript
const { data, error } = await supabase
  .from('payments')
  .insert({
    business_id: businessId,
    user_id: userId,
    amount: 500.00,
    currency: 'SCR',
    status: 'pending',
    provider: 'stripe',
    transaction_id: 'txn_123456'
  });
```

**RLS Policies:**
- Users can view their own payments
- Business owners can view payments for their businesses
- Admins can view all payments

---

## Storage API

### Upload Image

#### Category Image

```typescript
const fileExt = file.name.split('.').pop();
const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
const filePath = `${fileName}`;

const { data: uploadData, error: uploadError } = await supabase.storage
  .from('category-images')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: false
  });

if (uploadError) throw uploadError;

const { data: urlData } = supabase.storage
  .from('category-images')
  .getPublicUrl(filePath);

const imageUrl = urlData.publicUrl;
```

#### Product Image

```typescript
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('product-images')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: false
  });
```

#### User Avatar

```typescript
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('avatars')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: false
  });
```

### Delete Image

```typescript
const { data, error } = await supabase.storage
  .from('bucket-name')
  .remove([filePath]);
```

### Storage Buckets

- `category-images` (public)
- `product-images` (public)
- `review-images` (public)
- `avatars` (public)
- `hero` (public)
- `business-logos` (public)
- `business-covers` (public)

---

## Authentication API

### Sign Up

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'John Doe'
    }
  }
});
```

### Sign In

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

### Sign Out

```typescript
const { error } = await supabase.auth.signOut();
```

### Get Current Session

```typescript
const { data: { session }, error } = await supabase.auth.getSession();
```

### Reset Password

```typescript
const { data, error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  {
    redirectTo: 'https://example.com/auth/reset-password'
  }
);
```

### Update Password

```typescript
const { data, error } = await supabase.auth.updateUser({
  password: 'newpassword123'
});
```

---

## Real-time Subscriptions

### Subscribe to Business Updates

```typescript
const subscription = supabase
  .channel('businesses')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'businesses',
    filter: `id=eq.${businessId}`
  }, (payload) => {
    console.log('Business updated:', payload);
  })
  .subscribe();
```

### Subscribe to Live Counters

```typescript
const subscription = supabase
  .channel('counters')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'businesses'
  }, () => {
    // Refresh counters
    refreshCounters();
  })
  .subscribe();
```

### Unsubscribe

```typescript
subscription.unsubscribe();
```

---

## Edge Functions

### AI Search

**Endpoint:** `/functions/v1/ai-search`

```typescript
const { data, error } = await supabase.functions.invoke('ai-search', {
  body: {
    query: 'restaurants in Victoria'
  }
});
```

### Geocode Address

**Endpoint:** `/functions/v1/geocode-address`

```typescript
const { data, error } = await supabase.functions.invoke('geocode-address', {
  body: {
    address: 'Victoria, Mahé, Seychelles'
  }
});
```

### Send Password Reset Email

**Endpoint:** `/functions/v1/send-password-reset`

```typescript
const { data, error } = await supabase.functions.invoke('send-password-reset', {
  body: {
    email: 'user@example.com',
    resetUrl: 'https://example.com/auth/reset-password'
  }
});
```

### Create Payment Session (Stripe)

**Endpoint:** `/functions/v1/create-payment-session`

```typescript
const { data, error } = await supabase.functions.invoke('create-payment-session', {
  body: {
    business_id: businessId,
    amount: 500.00,
    currency: 'SCR'
  }
});
```

---

## Error Handling

### Standard Error Format

```typescript
{
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}
```

### Common Error Codes

- `PGRST116` - Resource not found
- `23505` - Unique violation
- `23503` - Foreign key violation
- `42501` - Insufficient privilege (RLS policy violation)

### Error Handling Example

```typescript
const { data, error } = await supabase
  .from('businesses')
  .select('*')
  .eq('id', businessId)
  .single();

if (error) {
  if (error.code === 'PGRST116') {
    console.error('Business not found');
  } else if (error.code === '42501') {
    console.error('Permission denied');
  } else {
    console.error('Error:', error.message);
  }
  return;
}

// Use data
console.log('Business:', data);
```

---

## Query Helpers

### Using Helper Functions

**Location:** `src/lib/`

#### Business API

```typescript
import { fetchBusinesses, fetchBusiness, createBusiness } from '@/lib/business-api';

// Fetch businesses with filters
const businesses = await fetchBusinesses({
  category: 'restaurant',
  island: 'Mahé',
  featured: true
});

// Fetch single business
const business = await fetchBusiness(businessId);

// Create business
const newBusiness = await createBusiness(businessData);
```

#### Products API

```typescript
import { fetchAllProducts, fetchProduct, createProduct } from '@/lib/products-api';

// Fetch all products
const products = await fetchAllProducts();

// Fetch single product
const product = await fetchProduct(productId);

// Create product
const newProduct = await createProduct(productData);
```

---

## Rate Limiting

Supabase provides built-in rate limiting:
- **Free tier:** 500 requests per second
- **Pro tier:** 2000 requests per second

Monitor usage in Supabase Dashboard → Settings → API.

---

## Best Practices

1. **Always check for errors** after Supabase operations
2. **Use RLS policies** for security (never disable RLS)
3. **Implement pagination** for large datasets
4. **Use indexes** for frequently queried fields
5. **Cache results** when appropriate (React Query)
6. **Handle loading states** in UI
7. **Validate input** before database operations
8. **Use transactions** for multi-step operations
9. **Monitor performance** via Supabase Dashboard
10. **Test RLS policies** thoroughly

---

## TypeScript Types

### Generated Types

Types are auto-generated from the database schema:

```typescript
import { Database } from '@/types/supabase';

type Business = Database['public']['Tables']['businesses']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
```

### Type Generation

```bash
npm run gen:types
```

This generates types from the Supabase schema and stores them in `supabase/types.gen.ts`.

---

## Testing

### Test Supabase Connection

```typescript
const { data, error } = await supabase
  .from('businesses')
  .select('count')
  .limit(1);

if (error) {
  console.error('Connection failed:', error);
} else {
  console.log('Connection successful');
}
```

### Test RLS Policies

Test with different user roles to ensure RLS policies work correctly:
- Anonymous user (not logged in)
- Regular user
- Business owner
- Admin

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)

---

**Last Updated:** 2025-01-30  
**API Version:** Supabase JS v2.56.1
