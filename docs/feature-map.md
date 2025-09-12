# iCompass Seychelles - Feature Map Documentation

## Overview

This document maps features to their implementation files, database tables, and related components. It serves as a guide for understanding how features are implemented across the codebase.

## Feature Implementation Map

### Business Registration

#### Components/Files
- `src/pages/BusinessPortal.tsx` - Business portal entry point
- `src/components/business/BusinessRegistration.tsx` - Registration form
- `src/components/business/BusinessOnboarding.tsx` - Onboarding flow
- `src/components/admin/AppointmentManager.tsx` - Admin appointment management

#### Database Tables
- `appointments` - Registration requests
- `businesses` - Business entities
- `profiles` - User profiles

#### Storage Buckets
- `business-documents` - Registration forms and documents

#### Validation/Logic
- Form validation with Zod schemas
- Email notifications via Resend API
- Admin approval workflow

#### RLS Dependencies
- Public can create appointments
- Admins can view/update appointments
- Business owners can manage their businesses

#### Status: ✅ Working
#### Ownership: Lovable

---

### Directory/Search/Filters

#### Components/Files
- `src/pages/Directory.tsx` - Main directory page
- `src/pages/Index.tsx` - Landing page with featured listings
- `src/components/CategoryGrid.tsx` - Category navigation
- `src/components/FeaturedListings.tsx` - Featured business display
- `src/components/SearchFilter.tsx` - Search and filtering
- `src/components/SearchWithTypeahead.tsx` - Search suggestions

#### Database Tables
- `businesses` - Business listings
- `categories` - Business categories
- `reviews` - Customer reviews

#### Edge Functions
- `ai-search` - Natural language search
- `image-search` - Image-based search

#### Validation/Logic
- Real-time search with debouncing
- Category-based filtering
- Location-based filtering
- AI-powered search capabilities

#### RLS Dependencies
- Public can view active businesses
- Public can view active products
- Public can view reviews

#### Status: ✅ Working
#### Ownership: Lovable

---

### Authentication & Profiles

#### Components/Files
- `src/pages/Auth.tsx` - Login/signup forms
- `src/pages/AuthCallback.tsx` - OAuth callback handler
- `src/pages/PasswordReset.tsx` - Password recovery
- `src/pages/Onboarding.tsx` - User profile setup
- `src/hooks/useAuth.ts` - Authentication state management
- `src/hooks/useBusinessAuth.ts` - Business owner authentication

#### Database Tables
- `profiles` - User profiles and roles
- `auth.users` - Supabase authentication (managed)

#### Validation/Logic
- Supabase Auth integration
- Automatic profile creation on signup
- Role-based access control

#### RLS Dependencies
- Users can view/edit their own profiles
- Business owners can view limited customer info
- Admins can view all profiles

#### Status: ✅ Working
#### Ownership: Lovable

---

### Google Maps

#### Components/Files
- `src/components/GoogleMap.tsx` - Main map component
- `src/components/business/BusinessLocationMap.tsx` - Business location map
- `supabase/functions/geocode-address/index.ts` - Address geocoding

#### Database Tables
- `businesses` - Location data (latitude, longitude, address)

#### External APIs
- Google Maps API - Geocoding and map display

#### Validation/Logic
- Manual API key input (stored in localStorage)
- Fallback coordinates for Seychelles islands
- Interactive markers and info windows

#### RLS Dependencies
- Public can view business locations
- Business owners can update their locations

#### Status: ⚠️ Partial
#### Ownership: Lovable
**Note**: Requires manual Google Maps API key input

---

### PDF Form Handling

#### Components/Files
- `public/Business_Registration_Form.pdf` - Registration form
- `public/business-registration-form.md` - Form documentation
- `src/components/business/BusinessRegistration.tsx` - Form submission

#### Storage Buckets
- `business-documents` - PDF storage and retrieval

#### Validation/Logic
- Public access to registration forms
- Admin upload of business documents

#### RLS Dependencies
- Public can view business documents
- Admins can upload business documents

#### Status: ✅ Working
#### Ownership: Lovable

---

### Storage (Logos, PDFs)

#### Components/Files
- `src/components/FileUpload.tsx` - File upload component
- `src/components/ImageGallery.tsx` - Image display

#### Storage Buckets
- `business-logos` - Business logos (public)
- `business-covers` - Cover images (public)
- `product-images` - Product images (public)
- `business-documents` - Documents (public)
- `product-catalogues` - Private catalogs

#### Validation/Logic
- File type validation
- Size limits
- Organized by business ID

#### RLS Dependencies
- Public read access for business images
- Authenticated upload for business owners
- Private access for product catalogs

#### Status: ✅ Working
#### Ownership: Lovable

---

### Admin Approval

#### Components/Files
- `src/pages/AdminPanel.tsx` - Admin dashboard
- `src/components/admin/AppointmentManager.tsx` - Appointment management
- `src/components/admin/CategoryManager.tsx` - Category management

#### Database Tables
- `appointments` - Registration requests
- `businesses` - Business approval
- `categories` - Category management
- `audit_logs` - System activity

#### Validation/Logic
- Admin role verification
- Business status management
- Audit logging

#### RLS Dependencies
- Admins have full access to all tables
- Admin-only access to audit logs

#### Status: ✅ Working
#### Ownership: Lovable

---

### AI Search

#### Components/Files
- `src/components/ImageSearch.tsx` - Image-based search
- `supabase/functions/ai-search/index.ts` - Natural language search
- `supabase/functions/image-search/index.ts` - Image analysis

#### Database Tables
- `businesses` - Search targets
- `products` - Product search targets
- `categories` - Category mapping

#### External APIs
- OpenAI API - GPT-4 Vision and GPT-4o-mini

#### Validation/Logic
- AI-powered query analysis
- Image recognition and categorization
- Relevance scoring

#### RLS Dependencies
- Public can use AI search
- Results respect business visibility rules

#### Status: ✅ Working
#### Ownership: Lovable

---

### Reviews/Ratings

#### Components/Files
- `src/components/ReviewForm.tsx` - Review submission
- `src/components/ReviewList.tsx` - Review display

#### Database Tables
- `reviews` - Review entities
- `businesses` - Review targets (rating calculation)

#### Database Functions
- `update_business_rating()` - Automatic rating calculation

#### Validation/Logic
- One review per user per business
- Rating validation (1-5)
- Automatic average calculation

#### RLS Dependencies
- Public can view reviews
- Users can create/edit their own reviews
- Business owners can view their business reviews

#### Status: ✅ Working
#### Ownership: Lovable

---

### Products & Services

#### Components/Files
- `src/pages/Products.tsx` - Product catalog page
- `src/components/business/ProductManager.tsx` - Product management
- `src/components/business/ProductList.tsx` - Product listing

#### Database Tables
- `products` - Product entities
- `businesses` - Product owners
- `categories` - Product categories

#### Validation/Logic
- Product status management
- Inventory tracking
- Publication date management

#### RLS Dependencies
- Public can view active products
- Business owners can manage their products
- Admins have full access

#### Status: ✅ Working
#### Ownership: Lovable

---

### Booking

#### Components/Files
- `src/components/BookingForm.tsx` - Booking submission
- `src/components/BookingList.tsx` - Booking management

#### Database Tables
- `bookings` - Booking entities
- `businesses` - Service providers
- `profiles` - Booking customers

#### Validation/Logic
- Date validation
- Guest count validation
- Status management

#### RLS Dependencies
- Users can view their own bookings
- Business owners can view their business bookings
- Users can create bookings

#### Status: ✅ Working
#### Ownership: Lovable

---

### Real-time Counters

#### Components/Files
- `src/components/LiveCounters.tsx` - Live statistics display
- `src/hooks/useLiveCounters.tsx` - Counter state management

#### Database Tables
- `businesses` - Counter data
- `products` - Counter data
- `profiles` - Counter data
- `reviews` - Counter data

#### Database Functions
- `get_live_counters()` - Real-time statistics

#### Validation/Logic
- Real-time subscriptions
- Automatic counter updates
- Error handling with fallbacks

#### RLS Dependencies
- Public can view counters
- Counters respect business visibility

#### Status: ✅ Working
#### Ownership: Lovable

---

## TODO & Ownership Plan

### Broken Parts (Cursor Should Fix)

#### 1. Google Maps API Key Management ⚠️
**Issue**: Manual API key input required, not using environment variables
**Files**: `src/components/GoogleMap.tsx`
**Fix**: Implement proper environment variable handling
**Priority**: Medium
**Ownership**: Cursor

#### 2. Environment Variable Configuration ⚠️
**Issue**: Missing comprehensive .env.example file
**Files**: Need to create `.env.example`
**Fix**: Document all required environment variables
**Priority**: High
**Ownership**: Cursor

#### 3. Error Handling Improvements ⚠️
**Issue**: Some components lack comprehensive error handling
**Files**: Various components
**Fix**: Add error boundaries and better error states
**Priority**: Medium
**Ownership**: Cursor

### Should Remain in Lovable

#### 1. Core Authentication System ✅
**Reason**: Complex Supabase integration with RLS policies
**Files**: `src/hooks/useAuth.ts`, `src/hooks/useBusinessAuth.ts`
**Status**: Working correctly

#### 2. Database Schema & RLS Policies ✅
**Reason**: Critical security layer, complex relationships
**Files**: All migration files, RLS policies
**Status**: Working correctly

#### 3. AI Search Functions ✅
**Reason**: Complex OpenAI integration with custom logic
**Files**: `supabase/functions/ai-search/`, `supabase/functions/image-search/`
**Status**: Working correctly

#### 4. Business Registration Flow ✅
**Reason**: Complex multi-step process with validation
**Files**: Business registration components
**Status**: Working correctly

#### 5. Real-time Features ✅
**Reason**: Complex Supabase real-time integration
**Files**: `src/hooks/useLiveCounters.tsx`
**Status**: Working correctly

### Cursor-Safe Enhancement Areas

#### 1. Documentation ✅
**Files**: All `docs/` directory files
**Status**: Safe to edit and enhance

#### 2. UI/UX Improvements ✅
**Files**: Component styling, layout improvements
**Status**: Safe to customize

#### 3. Additional Features ✅
**Files**: New components, pages, utilities
**Status**: Safe to add

#### 4. Testing ✅
**Files**: Test files, testing configurations
**Status**: Safe to add and modify

#### 5. Performance Optimizations ✅
**Files**: Code splitting, caching, optimization
**Status**: Safe to implement

### Priority Fixes for Cursor

1. **High Priority**: Create comprehensive `.env.example` file
2. **High Priority**: Fix Google Maps API key environment variable handling
3. **Medium Priority**: Add comprehensive error handling
4. **Medium Priority**: Improve documentation and runbooks
5. **Low Priority**: Add additional testing coverage

### Development Guidelines

- **Never modify**: Database migrations, RLS policies, core auth logic
- **Safe to modify**: UI components, styling, documentation, new features
- **Test thoroughly**: Any changes to authentication or data access
- **Follow patterns**: Use existing code patterns and conventions
- **Document changes**: Update documentation for any modifications