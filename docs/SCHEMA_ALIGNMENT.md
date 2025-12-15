# Schema Alignment Documentation

**Last Updated:** 2025-01-XX  
**Purpose:** Document the actual database schema and how frontend code aligns with it

---

## 🎯 Critical Schema Facts

### 1. **Businesses Table Uses `title` (NOT `name`)**

**Database Schema:**
```sql
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,  -- ✅ CORRECT FIELD NAME
  description TEXT,
  category TEXT,
  category_id UUID,     -- Optional FK to categories
  status TEXT,
  -- ... other fields
);
```

**Frontend Alignment:**
- ✅ `src/lib/business-api.ts` uses `title` correctly
- ✅ `src/types/business.ts` defines `title: string`
- ✅ `src/components/admin/OptimizedBusinessManager.tsx` uses `title`
- ⚠️ Some legacy components reference `business.name` (deprecated, guarded)

**Action Required:**
- Use `business.title` in all new code
- Legacy `business.name` references are guarded but should be migrated

---

### 2. **Products Linked Via `business_products` Join Table**

**Database Schema:**
```sql
-- Master product catalogue (no business_id)
CREATE TABLE public.products (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  description TEXT,
  category TEXT,
  -- NO business_id column
);

-- Business-product links (many-to-many)
CREATE TABLE public.business_products (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  product_id UUID REFERENCES products(id),
  title_override TEXT,
  description_override TEXT,
  price_from NUMERIC(12,2),
  price_to NUMERIC(12,2),
  currency_code TEXT DEFAULT 'SCR',
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  booking_url TEXT,
  notes TEXT,
  UNIQUE(business_id, product_id)
);
```

**Frontend Alignment:**
- ✅ `src/lib/products-api.ts` uses `business_products` correctly
- ✅ `fetchBusinessProducts()` queries join table
- ✅ `createBusinessProduct()` creates links
- ✅ Admin Product Manager displays links correctly

**Key Points:**
- Products are **reusable master catalogue items**
- Business-specific pricing/overrides stored in `business_products`
- One product can be linked to multiple businesses
- One business can have multiple products

---

### 3. **Categories Linked Via `category_id` Direct FK**

**Database Schema:**
```sql
CREATE TABLE public.categories (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Businesses have direct FK (NOT via join table in practice)
CREATE TABLE public.businesses (
  -- ...
  category TEXT,        -- Text category name (legacy)
  category_id UUID,    -- FK to categories.id (preferred)
  -- ...
);
```

**Frontend Alignment:**
- ✅ `src/components/OptimizedCategoryGrid.tsx` queries `businesses.category_id`
- ✅ Category counts derived from `businesses.category_id` FK
- ⚠️ Some queries may fail if `category_id` column missing (handled gracefully)

**Important Notes:**
- `business_categories` join table **exists in migrations** but **not used in practice**
- Current implementation uses direct `category_id` FK on `businesses` table
- Legacy `category` text field still exists for backward compatibility

**Query Pattern:**
```typescript
// ✅ CORRECT: Direct FK query
const { data } = await supabase
  .from('businesses')
  .select('id, category_id')
  .eq('status', 'active');

// Count businesses per category
businesses.forEach(b => {
  if (b.category_id) {
    countMap[b.category_id] = (countMap[b.category_id] || 0) + 1;
  }
});
```

---

### 4. **No `business_categories` Join Table In Use**

**Migrations Show:**
```sql
-- This table EXISTS in migrations but NOT USED
CREATE TABLE public.business_categories (
  business_id UUID REFERENCES businesses(id),
  category_id UUID REFERENCES categories(id),
  PRIMARY KEY (business_id, category_id)
);
```

**Reality:**
- ❌ `business_categories` table exists but is **not queried** in frontend
- ✅ Frontend uses direct `businesses.category_id` FK instead
- ⚠️ This is a schema drift - table exists but unused

**Action Required:**
- Either migrate to use `business_categories` join table (many-to-many)
- Or remove `business_categories` table if keeping direct FK approach
- **Current state:** Direct FK approach is working, join table is legacy

---

## 📋 Field Mapping Reference

### Businesses Table

| Frontend Field | Database Column | Status | Notes |
|--------------|----------------|--------|-------|
| `business.title` | `title` | ✅ Correct | Use this, not `name` |
| `business.name` | ❌ Does not exist | ⚠️ Legacy | Some code references this (guarded) |
| `business.description` | `description` | ✅ Correct | Nullable |
| `business.category` | `category` | ✅ Correct | Text field (legacy) |
| `business.category_id` | `category_id` | ✅ Correct | FK to categories (preferred) |
| `business.status` | `status` | ✅ Correct | 'active', 'pending', 'suspended', 'closed' |
| `business.latitude` | `latitude` | ✅ Correct | Numeric(10,8) |
| `business.longitude` | `longitude` | ✅ Correct | Numeric(11,8) |

### Products Table

| Frontend Field | Database Column | Status | Notes |
|--------------|----------------|--------|-------|
| `product.id` | `id` | ✅ Correct | UUID |
| `product.name` | `name` | ✅ Correct | Master product name |
| `product.title` | `title` | ✅ Correct | Optional display title |
| `product.description` | `description` | ✅ Correct | Nullable |
| `product.category` | `category` | ✅ Correct | Text category |
| `product.business_id` | ❌ Does not exist | ✅ Correct | Removed - use `business_products` |

### Business Products Table

| Frontend Field | Database Column | Status | Notes |
|--------------|----------------|--------|-------|
| `link.id` | `id` | ✅ Correct | UUID |
| `link.business_id` | `business_id` | ✅ Correct | FK to businesses |
| `link.product_id` | `product_id` | ✅ Correct | FK to products |
| `link.title_override` | `title_override` | ✅ Correct | Optional override |
| `link.price_from` | `price_from` | ✅ Correct | Minimum price |
| `link.price_to` | `price_to` | ✅ Correct | Maximum price (optional) |
| `link.is_active` | `is_active` | ✅ Correct | Visibility flag |

---

## 🔍 Known Schema Mismatches

### 1. **Legacy `business.name` References**

**Location:** Multiple files reference `business.name`
- `src/pages/admin/ProductCreate.tsx`
- `src/components/admin/BusinessManager.tsx`
- `src/components/BusinessCardLight.tsx`
- `src/pages/BusinessDetail.tsx`
- And others...

**Status:** ⚠️ Guarded with fallbacks, but should be migrated

**Fix:** Replace `business.name` with `business.title` (or `business.title || 'Unnamed Business'`)

---

### 2. **`business_categories` Table Exists But Unused**

**Status:** Schema drift - table exists in migrations but not queried

**Options:**
1. **Keep direct FK:** Remove `business_categories` table (simpler, current approach)
2. **Migrate to join table:** Update queries to use `business_categories` (many-to-many support)

**Recommendation:** Keep direct FK for now (simpler, working)

---

### 3. **Category Count Queries May Fail**

**Issue:** Queries assume `category_id` column exists on all businesses

**Status:** ✅ Handled gracefully with fallbacks

**Pattern:**
```typescript
// Safe query with fallback
const { data, error } = await supabase
  .from('businesses')
  .select('id, category_id')
  .eq('status', 'active');

if (error) {
  // Log warning, use empty map
  console.warn('[CategoryGrid] Business counts query failed (non-critical)');
  return []; // or empty count map
}
```

---

## ✅ Schema Alignment Checklist

- [x] Businesses use `title` field (not `name`)
- [x] Products linked via `business_products` join table
- [x] Categories linked via `category_id` direct FK
- [x] No `business_categories` join table in use (exists but unused)
- [x] Legacy references guarded with fallbacks
- [x] Queries handle missing columns gracefully

**Status:** ✅ **SCHEMA ALIGNED** (with known legacy references)

---

## 📝 Developer Guidelines

1. **Always use `business.title`** - never `business.name`
2. **Link products via `business_products`** - never `products.business_id`
3. **Query categories via `businesses.category_id`** - not `business_categories` join
4. **Handle missing columns gracefully** - use fallbacks, don't assume schema
5. **Check for null/undefined** - all nullable fields should be checked

---

## 🔗 Related Documentation

- `docs/PROJECT_STATUS.md` - Overall project status
- `docs/RECOVERY_HISTORY.md` - Recovery history and fixes
- `BUSINESS_PRODUCTS_NOTES.md` - Business-products relationship details
- `supabase/SCHEMA_LOCK.md` - Schema lock documentation
