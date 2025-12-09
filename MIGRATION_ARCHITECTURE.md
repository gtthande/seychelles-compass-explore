# ARCHITECTURE: Data Flow from Supabase to UI

## Overview

The iCompass Seychelles application uses a **React + TypeScript + Vite** frontend that communicates directly with **Supabase (PostgreSQL)** via the Supabase JavaScript client library. After applying the schema rebuild migration, data flows through the following layers:

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  categories  │  │  businesses  │  │   products   │       │
│  │  - id        │  │  - id        │  │  - id        │       │
│  │  - title     │  │  - title     │  │  - title    │       │
│  │  - slug      │  │  - category_ │  │  - business_│       │
│  │  - is_active │  │    id (FK)   │  │    id (FK)  │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ RLS Policies
                          │ (Public Read, Admin Write)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE CLIENT (TypeScript)                    │
│  Location: src/integrations/supabase/client.ts               │
│  - Uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY        │
│  - Typed with Database interface from types                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Type-safe queries
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              API LAYER (Business Logic)                      │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ business-api.ts  │  │ categories.ts   │                 │
│  │ - fetchBusinesses│  │ - fetchCategories│                 │
│  │ - Uses: title,  │  │ - Uses: title,  │                 │
│  │   category_id,  │  │   slug, is_active│                 │
│  │   is_active      │  │                  │                 │
│  └──────────────────┘  └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ React hooks & components
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              UI COMPONENTS                                   │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ CategoryGrid    │  │ BusinessTable   │                 │
│  │ - Displays      │  │ - Lists         │                 │
│  │   categories    │  │   businesses    │                 │
│  │   with title    │  │   with JOIN to  │                 │
│  │                 │  │   categories    │                 │
│  └──────────────────┘  └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## Key Schema Changes After Migration

### Field Name Mappings

| Old Field | New Field | Location |
|-----------|-----------|----------|
| `businesses.name` | `businesses.title` | All queries |
| `categories.name` | `categories.title` | All queries |
| `businesses.category` (enum) | `businesses.category_id` (UUID FK) | All queries |
| `businesses.status` (enum) | `businesses.is_verified` (boolean) | Status computation |
| `products.category` | ❌ Removed | Products have no category |

### Query Pattern

**Before (Incorrect):**
```typescript
supabase
  .from('businesses')
  .select('name, category, status')  // ❌ Wrong field names
```

**After (Correct):**
```typescript
supabase
  .from('businesses')
  .select(`
    title,
    category_id,
    is_verified,
    categories (id, title, slug)  // ✅ JOIN for category name
  `)
```

## Type Safety Flow

1. **Database Schema** → Supabase PostgreSQL tables with correct column names
2. **TypeScript Types** → Generated via `npx supabase gen types typescript`
3. **Client Typing** → `createClient<Database>()` ensures type safety
4. **Query Results** → Typed responses prevent runtime errors

## RLS (Row Level Security) Flow

- **Public Read**: Anonymous and authenticated users can SELECT from `categories`, `businesses`, `products`
- **Admin Write**: Service role can INSERT/UPDATE/DELETE all tables
- **Business Owners**: Can update their own businesses (via `owner_id` FK)

## Real-time Subscriptions

Components like `SearchFilter.tsx` subscribe to real-time changes:
- `businesses` table changes
- `products` table changes  
- `categories` table changes

These subscriptions automatically update the UI when data changes in Supabase.

## Error Handling

The application handles "column does not exist" errors (400/42703) by:
1. Using only valid field names in queries
2. TypeScript types preventing invalid field access
3. Graceful error handling in API layer (returns empty arrays instead of throwing)
