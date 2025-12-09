# iCompass Seychelles - Project Overview

## What the Project Is

**iCompass Seychelles** is a comprehensive business directory platform designed to showcase businesses across the Seychelles archipelago. The platform enables businesses to manage their listings, link products to their profiles, and provides visitors with powerful search and discovery tools.

### Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **State Management:** React Query (TanStack Query)
- **Maps:** Google Maps API (with OpenStreetMap fallback)

---

## Main Modules

### 1. **Authentication & Authorization Module**
- Supabase Auth integration
- Role-based access control (admin, business, user)
- Profile management
- Session handling

### 2. **Business Directory Module**
- Business listings with search and filtering
- Island-based filtering (Mahé, Praslin, La Digue, etc.)
- Category management
- Business detail pages
- Business registration workflow

### 3. **Product Catalog Module**
- Master product catalog (`products` table)
- Business-product linking (`business_products` join table)
- Product search and discovery
- Product management for business owners

### 4. **Admin Panel Module**
- Comprehensive administrative dashboard
- User management
- Business management and verification
- Product catalog management
- Category management
- System settings

### 5. **Business Portal Module**
- Self-service dashboard for business owners
- Business profile management
- Product management
- Location management with geocoding

### 6. **Search & Discovery Module**
- Full-text search across businesses and products
- Advanced filtering (category, island, status)
- Real-time search results

---

## Admin Panel Features

The Admin Panel (`/admin`) provides comprehensive management capabilities:

### 1. **Hero Section Management**
- Edit homepage hero content (title, subtitle)
- Upload and manage hero background images
- Real-time preview

### 2. **Category Management**
- Create, edit, and delete business categories
- Manage category images and descriptions
- Activate/deactivate categories

### 3. **Business Management**
- View all businesses
- Create new businesses
- Edit business details
- Approve/reject pending businesses
- Manage business verification status
- View business statistics

### 4. **Product Management**
- Manage master product catalog
- Create, edit, and delete products
- Link products to businesses
- Manage product images and pricing

### 5. **User Management**
- View all users
- Manage user roles (admin, business, user)
- Activate/deactivate users
- View user profiles

### 6. **Appointment Management**
- View appointment requests
- Approve/reject appointments
- Filter by status and business

### 7. **Payment Management**
- View payment transactions
- Manage payment providers
- Payment analytics

### 8. **Settings**
- System configuration
- Google Maps API key management
- Storage bucket configuration

### 9. **Developer Tools**
- Code sync panel
- Database backup (MySQL)
- Performance monitoring
- Dev sync utilities

---

## Business Owner Features

The Business Portal (`/business`) enables business owners to:

### 1. **Business Profile Management**
- Edit business information (name, description, contact details)
- Update business location with map picker
- Manage business category
- Upload business images (logo, cover, gallery)

### 2. **Product Management**
- View linked products
- Link products from master catalog
- Set custom pricing for products
- Override product titles and descriptions
- Activate/deactivate products
- Manage product images

### 3. **Location Management**
- Set business address
- Use interactive map picker
- Geocoding integration (address → coordinates)
- Island selection

### 4. **Analytics & Insights**
- View business statistics
- Track product performance
- Monitor business views

---

## Product/Catalog Architecture

### Two-Table Model

The product system uses a **two-table model** for flexibility:

#### 1. **`products` Table** (Master Catalog)
- Contains shared product definitions
- Fields: `id`, `title`, `description`, `price`, `duration`, `image_url`, `is_active`, `searchable`, `stock`, `slug`
- No business-specific data (shared catalog)
- Products can be reused across multiple businesses

#### 2. **`business_products` Table** (Linking Table)
- Links businesses to products (many-to-many relationship)
- Fields: `id`, `business_id`, `product_id`, `price_override`, `title_override`, `description_override`, `is_active`
- Allows businesses to customize pricing and descriptions per product
- Enables flexible product offerings

### Architecture Benefits

- **Reusability:** Products can be shared across multiple businesses
- **Customization:** Businesses can override pricing and descriptions
- **Centralized Management:** Admin manages master catalog
- **Flexible Pricing:** Each business can set custom prices
- **Scalability:** Easy to add new products and link to businesses

### Product Linking Flow

```
Master Product Catalog (products)
    ↓
Business selects product
    ↓
Creates link in business_products
    ↓
Sets custom price/description (optional)
    ↓
Product appears in business profile
```

### Key Features

- **Searchable Products:** Products can be marked as searchable for discovery
- **Stock Management:** Track product availability
- **Image Management:** Single `image_url` field (TEXT) for product images
- **Slug Support:** URL-friendly product identifiers
- **Active Status:** Control product visibility

---

## Current State

The project has undergone a **major schema alignment and cleanup** (December 2025), resulting in:

- ✅ Unified Products Schema aligned with TypeScript interfaces
- ✅ Clean business-product linking model via `business_products` join table
- ✅ Removed deprecated fields (`name`, `category`, `images[]`, `status`)
- ✅ Fixed schema inconsistencies and typos
- ✅ Stable RLS (Row Level Security) policies
- ✅ Production-ready database structure

---

## Key Design Principles

1. **Type Safety:** Full TypeScript coverage with generated Supabase types
2. **Security First:** Comprehensive RLS policies for data protection
3. **Performance:** Optimized queries with proper indexing
4. **User Experience:** Modern, responsive UI with accessibility in mind
5. **Scalability:** Modular architecture for easy extension
6. **Maintainability:** Clean code structure with clear separation of concerns

