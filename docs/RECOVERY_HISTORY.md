# Recovery History

**Last Updated:** 2025-01-XX  
**Purpose:** Document why recovery was needed, what caused breakage, what was fixed, and what remains

---

## 📋 Why Recovery Was Required

### Root Causes

1. **Schema Drift**
   - Frontend code assumed database columns that didn't exist
   - Example: Code referenced `business.name` but database has `business.title`
   - Example: Code expected `business_categories` join table but schema uses direct `category_id` FK

2. **Query Failures**
   - Supabase queries failed due to missing columns
   - RPC functions (`get_live_counters`) may not exist or have mismatched signatures
   - Complex joins failed when tables/columns didn't match expectations

3. **Emergency Workarounds**
   - Previous recovery attempts created emergency components (`EmergencyHomepageBusinesses.tsx`, `BruteForceHomepageBusinesses.tsx`)
   - Multiple Supabase client patterns emerged
   - Panic commits ("PANIC SNAPSHOT", "RECOVERY") indicated unstable state

4. **Frontend Assumptions**
   - Code assumed `business.name` existed (legacy field)
   - Code assumed `products.business_id` existed (deprecated after many-to-many migration)
   - Code assumed `business_categories` join table was in use (exists but unused)

---

## 🔧 What Caused Breakage

### 1. **Schema Mismatches**

**Issue:** Frontend queries used columns that didn't exist or were renamed

**Examples:**
- `business.name` → Should be `business.title`
- `products.business_id` → Removed, use `business_products` join table
- `business_categories` join → Not used, use direct `category_id` FK

**Impact:**
- Queries returned errors
- Components failed to render
- Blank screens or error messages

### 2. **Missing RPC Functions**

**Issue:** `get_live_counters` RPC may not exist or have wrong signature

**Impact:**
- Live counters showed errors
- Fallback queries used instead (less efficient)

**Status:** ✅ Handled with fallbacks

### 3. **Complex Join Failures**

**Issue:** Category count queries assumed `category_id` column exists

**Impact:**
- Category counts showed 0 or errors
- Product counts per category inaccurate

**Status:** ✅ Handled with fallbacks

### 4. **Legacy Field References**

**Issue:** Some components still reference deprecated fields

**Impact:**
- Console warnings (non-fatal)
- Potential data display issues

**Status:** ⚠️ Guarded with fallbacks, should be migrated

---

## ✅ What Was Fixed

### 1. **Query Alignment**

**Fixed:**
- `src/lib/business-api.ts` uses correct `title` field
- `src/lib/products-api.ts` uses `business_products` join table correctly
- Category queries use `category_id` FK correctly

**Files Updated:**
- `src/lib/business-api.ts` - Uses `title`, correct field selection
- `src/components/admin/OptimizedBusinessManager.tsx` - Uses `title` correctly
- `src/components/OptimizedCategoryGrid.tsx` - Uses `category_id` FK

### 2. **Defensive Rendering**

**Fixed:**
- All queries wrapped in try-catch blocks
- Empty arrays returned on error (not thrown)
- Fallback values used (0, empty string, "Unknown")

**Pattern:**
```typescript
try {
  const { data, error } = await supabase.from('table').select('*');
  if (error) {
    console.warn('[Component] Query failed (non-critical):', error.message);
    return []; // Fallback to empty array
  }
  return data || [];
} catch (err) {
  console.warn('[Component] Exception (non-critical):', err);
  return []; // Fallback
}
```

### 3. **Error Boundaries**

**Fixed:**
- `LazyErrorBoundary` for lazy-loaded components
- `ErrorBoundary` for React component errors
- `GlobalErrorBoundary` for app-level errors

**Files:**
- `src/components/ErrorBoundary.tsx`
- `src/components/AppErrorBoundary.tsx`
- `src/components/GlobalErrorBoundary.tsx`
- `src/pages/Index.tsx` - Uses `LazyErrorBoundary`

### 4. **RPC Fallbacks**

**Fixed:**
- `useLiveCounters` hook falls back to direct queries if RPC fails
- Caches RPC failure to avoid repeated attempts
- Uses `SELECT COUNT` queries as fallback

**File:** `src/hooks/useLiveCounters.tsx`

### 5. **Category Count Fallbacks**

**Fixed:**
- Category queries handle missing `category_id` gracefully
- Product counts optional (don't throw if join fails)
- Shows 0 or empty state instead of error

**Files:**
- `src/components/OptimizedCategoryGrid.tsx`
- `src/components/CategoryGrid.tsx`

---

## ⚠️ What Was Intentionally NOT Fixed Yet

### 1. **Legacy `business.name` References**

**Status:** ⚠️ Not fixed - guarded with fallbacks

**Reason:**
- Low priority (non-fatal)
- Requires careful migration across multiple files
- Fallbacks prevent crashes

**Files Affected:**
- `src/pages/admin/ProductCreate.tsx`
- `src/components/admin/BusinessManager.tsx`
- `src/components/BusinessCardLight.tsx`
- `src/pages/BusinessDetail.tsx`
- And others...

**Action:** Should be migrated in future refactor

---

### 2. **`business_categories` Join Table**

**Status:** ⚠️ Not fixed - table exists but unused

**Reason:**
- Current direct FK approach works
- Migration would require significant refactoring
- Low priority (not causing issues)

**Options:**
1. Keep direct FK (simpler, current approach)
2. Migrate to join table (many-to-many support)

**Recommendation:** Keep direct FK for now

---

### 3. **RPC `get_live_counters`**

**Status:** ⚠️ Not fixed - fallback queries used instead

**Reason:**
- Fallback works correctly
- RPC may require database migration
- Low priority (non-fatal)

**Action:** Can be addressed in future database optimization

---

### 4. **Product Counts Per Category**

**Status:** ⚠️ Partially working - complex join may fail

**Reason:**
- Requires complex join: `business_products` → `businesses` → `category_id`
- Optional feature (counts are informational)
- Fallback to 0 is acceptable

**Action:** Can be optimized in future

---

## 📊 Recovery Timeline

### Phase 1: Identification
- Identified schema mismatches
- Found emergency workarounds
- Documented query failures

### Phase 2: Fixes
- Aligned queries with actual schema
- Added defensive rendering
- Implemented error boundaries
- Added RPC fallbacks

### Phase 3: Stabilization
- Verified homepage loads
- Verified admin panel works
- Verified product linking works
- Confirmed all errors non-fatal

### Phase 4: Documentation (Current)
- Created `PROJECT_STATUS.md`
- Created `SCHEMA_ALIGNMENT.md`
- Created `RECOVERY_HISTORY.md`
- Added safety guards and comments

---

## 🎯 Current State Summary

**Status:** ✅ **STABLE FOR CONTINUATION**

**Working:**
- ✅ Homepage loads without crashes
- ✅ Admin Panel functional
- ✅ Business↔Product linking works
- ✅ All errors non-fatal with fallbacks

**Degraded (Non-Fatal):**
- ⚠️ Category counts may show 0 (fallback works)
- ⚠️ RPC live counters use fallback queries
- ⚠️ Some legacy field references remain

**Not Fixed (Intentionally):**
- ⚠️ Legacy `business.name` references (guarded)
- ⚠️ `business_categories` table unused (not causing issues)
- ⚠️ RPC function may not exist (fallback works)

---

## 📝 Lessons Learned

1. **Always verify schema before querying** - Don't assume columns exist
2. **Use defensive rendering** - Return empty arrays, not errors
3. **Implement fallbacks** - RPC failures should have query fallbacks
4. **Error boundaries are essential** - Prevent blank screens
5. **Document schema alignment** - Keep frontend and database in sync

---

## 🔗 Related Documentation

- `docs/PROJECT_STATUS.md` - Current project status
- `docs/SCHEMA_ALIGNMENT.md` - Schema alignment details
- `docs/RECOVERY_BASELINE.md` - Baseline recovery documentation
- `BUSINESS_PRODUCTS_NOTES.md` - Business-products relationship

---

## 🚀 Next Steps (Future)

1. **Migrate legacy `business.name` references** to `business.title`
2. **Decide on `business_categories`** - Keep direct FK or migrate to join table
3. **Fix RPC `get_live_counters`** - Create/update database function
4. **Optimize category counts** - Improve product count queries
5. **Remove emergency workarounds** - Clean up any remaining emergency code

**Note:** These are future improvements, not urgent fixes. Current state is stable.
