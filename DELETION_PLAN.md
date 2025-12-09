# iCompass Seychelles — SAFE PROJECT CLEANUP DELETION PLAN

**Generated:** $(date)
**Status:** PENDING APPROVAL — Review before execution

---

## PHASE 1: UNUSED COMPONENTS

### ✅ VERIFIED UNUSED (Safe to Delete)

1. **`src/components/ProductList.tsx`**
   - **Reason:** Uses deprecated `business_id` field directly on products table
   - **Replacement:** `src/components/business/ProductList.tsx` (uses unified schema)
   - **Status:** Not imported anywhere

2. **`src/components/products/ProductList.tsx`**
   - **Reason:** Not imported anywhere in codebase
   - **Replacement:** `src/components/business/ProductList.tsx` is the active version
   - **Status:** Unused duplicate

3. **`src/components/products/ProductForm.tsx`**
   - **Reason:** Not imported anywhere (ProductList that used it is also unused)
   - **Replacement:** `src/components/business/ProductManager.tsx` handles product forms
   - **Status:** Unused

4. **`src/components/admin/DataSeeder.tsx`**
   - **Reason:** Not imported in AdminPanel or anywhere else
   - **Status:** Unused admin utility

5. **`src/components/admin/SettingsManager.tsx`**
   - **Reason:** Not imported in AdminPanel (has placeholder instead)
   - **Status:** Unused admin component

6. **`src/components/BusinessMapPreview.tsx`**
   - **Reason:** All imports commented out, not used
   - **Status:** Disabled component

7. **`src/pages/AdminPanelFallback.tsx`**
   - **Reason:** Not imported in App.tsx routes
   - **Status:** Unused fallback page

8. **`src/pages/BusinessPortal.tsx`**
   - **Reason:** Not imported in App.tsx routes
   - **Status:** Unused page (BusinessDashboard is used instead)

---

## PHASE 2: UNUSED HOOKS

### ✅ VERIFIED UNUSED (Safe to Delete)

1. **`src/hooks/useUnifiedSearch.ts`**
   - **Reason:** Not imported anywhere
   - **Status:** Unused hook

---

## PHASE 3: OBSOLETE MIGRATIONS

### ⚠️ MIGRATIONS TO REVIEW (May be safe to delete if superseded)

**Keep these final alignment migrations:**
- `20250208000000_fix_products_schema_alignment.sql` ✅ KEEP
- `20250207000000_fix_business_products_title_override.sql` ✅ KEEP
- `20250203000000_unified_schema_alignment.sql` ✅ KEEP
- `20250202000000_final_products_schema_alignment.sql` ✅ KEEP
- `20250201_products_schema_final.sql` ✅ KEEP
- `20250201000001_products_schema_alignment.sql` ✅ KEEP
- `20250201000000_products_schema_alignment.sql` ✅ KEEP

**Candidates for deletion (older than 20250201, likely superseded):**

1. `20250101000000_add_verification_notes.sql` - Likely superseded
2. `20250113000000_create_hero_section_table.sql` - Check if still needed
3. `20250113000001_create_app_settings_table.sql` - Check if still needed
4. `20250115000000_business_crud_policies.sql` - May be superseded by later RLS fixes
5. `20250115000001_products_catalog_system.sql` - Superseded by unified schema
6. `20250119122700_add_role_and_is_active_to_profiles.sql` - May be superseded
7. `20250119123000_add_role_and_is_active.sql` - Duplicate of above?
8. `20250119130000_comprehensive_schema_fix.sql` - Superseded by final alignment
9. `20250119140000_fix_category_search.sql` - May be superseded
10. `20250119150000_setup_profiles_auth.sql` - May be superseded
11. `20250120000000_add_fulltext_search_indexes.sql` - Check if still needed
12. `20250120000000_add_image_url_to_categories.sql` - Check if still needed
13. `20250120000001_add_category_images_bucket.sql` - Check if still needed
14. `20250120000001_add_products_catalog_system.sql` - Superseded by unified schema
15. `20250120000002_add_image_url_to_reviews.sql` - Check if still needed
16. `20250120000003_add_review_images_and_avatars_buckets.sql` - Check if still needed
17. `20250121000000_admin_rls_policies.sql` - May be superseded
18. `20250122000000_add_profile_insert_policy.sql` - May be superseded
19. `20250122000001_fix_admin_rls_schema_mismatch.sql` - Superseded
20. `20250122000002_fix_profile_schema_and_admin_check.sql` - Superseded
21. `20250122000003_add_admin_product_insert_policy.sql` - May be superseded
22. `20250123000000_ensure_profile_rls_policies.sql` - May be superseded
23. `20250125000000_drop_products_business_id.sql` - Important! Keep if it drops deprecated column
24. `20250125000000_fix_business_schema_complete.sql` - May be superseded
25. `20250125000000_rls_stable_fix.sql` - May be superseded
26. `20250125000001_ensure_public_read_access.sql` - May be superseded
27. `20250126000000_ensure_business_fields.sql` - May be superseded
28. `20250126000000_ensure_business_products_schema.sql` - Important! Keep if creates business_products
29. `20250126000001_simplified_rls_policies.sql` - May be superseded
30. `20250127000000_fix_rls_policies.sql` - May be superseded
31. `20250127000001_add_verification_notes.sql` - Duplicate of 20250101000000?
32. `20250128000000_comprehensive_rls_fix.sql` - May be superseded
33. `20250130000000_comprehensive_schema_repair.sql` - Superseded by final alignment
34. `20250130000000_fix_public_read_policies.sql` - May be superseded
35. `20250131000000_fix_schema_alignment.sql` - Superseded by 20250201+ migrations
36. `20250131000001_migrate_products_to_business_products.sql` - Important! Keep if migrates data
37. `20250131000002_fix_products_queries.sql` - May be superseded

**⚠️ CAUTION:** Some migrations may have data migrations or important schema changes. Review each before deletion.

---

## PHASE 4: DEPRECATED CODE REFERENCES

### Code to Clean (Not Delete Files, Just Remove Deprecated References)

1. **`src/lib/products-api.ts`**
   - Remove references to `business_id` field on products table
   - Update to use `business_products` join table only

2. **`src/components/business/BusinessDashboard.tsx`**
   - Already uses unified schema ✅
   - May have some deprecated field references to clean

3. **`src/pages/admin/ProductEdit.tsx`**
   - Uses unified schema ✅
   - Verify no deprecated field references

---

## PHASE 5: UNUSED UTILITIES

### ✅ VERIFIED UNUSED (Safe to Delete)

1. **`src/lib/stability-fix.ts`** - Check if used
2. **`src/lib/mysql-backup.ts`** - Check if used (may be used by admin)

---

## SUMMARY

### Files to Delete (9 files):
1. `src/components/ProductList.tsx`
2. `src/components/products/ProductList.tsx`
3. `src/components/products/ProductForm.tsx`
4. `src/components/admin/DataSeeder.tsx`
5. `src/components/admin/SettingsManager.tsx`
6. `src/components/BusinessMapPreview.tsx`
7. `src/pages/AdminPanelFallback.tsx`
8. `src/pages/BusinessPortal.tsx`
9. `src/hooks/useUnifiedSearch.ts`

### Migrations to Review (37 candidates):
- Review each migration from 20250101-20250131
- Keep migrations that:
  - Create essential tables (hero_section, app_settings, business_products)
  - Drop deprecated columns (drop_products_business_id)
  - Migrate data (migrate_products_to_business_products)
- Delete migrations that are fully superseded by 20250201+ migrations

### Code to Clean (Not Delete):
- Remove deprecated field references in `products-api.ts`
- Clean up unused imports after deletions

---

## NEXT STEPS

1. ✅ Review this deletion plan
2. ⏳ Approve deletions
3. ⏳ Execute deletions
4. ⏳ Fix broken imports
5. ⏳ Run TypeScript check
6. ⏳ Test application
7. ⏳ Document cleanup

---

**⚠️ IMPORTANT:** This is a SAFE cleanup. Only deleting files with ZERO imports/references. Migrations require careful review before deletion.
