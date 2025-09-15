# Development Log - Seychelles Business Directory

## Project Overview
A comprehensive business directory platform for Seychelles featuring business listings, product catalogs, appointment booking, payment processing, and admin management.

## Implemented Features

### 1. User Authentication & Profiles
**UI Components:**
- `src/pages/Auth.tsx` - Login/signup page
- `src/pages/AuthCallback.tsx` - OAuth callback handler
- `src/hooks/useAuth.ts` - Authentication hook
- `src/hooks/useBusinessAuth.ts` - Business owner authentication

**Supabase Tables:**
- `profiles` - User profile data (extends auth.users)

**Custom Logic:**
- Automatic profile creation via trigger `handle_new_user()`
- Admin flag management in user metadata

**RLS Policies:**
- Users can only view/edit their own profiles
- Admins can view all profiles
- Business owners can view customer profiles for their reviews

### 2. Business Listings
**UI Components:**
- `src/components/business/BusinessRegistration.tsx` - Business registration form
- `src/components/business/BusinessDashboard.tsx` - Business owner dashboard
- `src/components/business/BusinessOnboarding.tsx` - Onboarding flow
- `src/components/FeaturedListings.tsx` - Homepage featured businesses
- `src/pages/Directory.tsx` - Business directory listing

**Supabase Tables:**
- `businesses` - Core business data with status, verification, ratings
- `categories` - Business categorization system

**Custom Logic:**
- Business status workflow: pending → active → verified
- Automatic rating calculation via trigger `update_business_rating()`
- Google Maps integration for location services

**RLS Policies:**
- Public can view active businesses only
- Business owners can manage their own businesses
- Admins can manage all businesses

### 3. Product Catalog
**UI Components:**
- `src/components/business/ProductManager.tsx` - Product management
- `src/components/business/ProductList.tsx` - Product listing
- `src/pages/Products.tsx` - Public product catalog

**Supabase Tables:**
- `products` - Product inventory with pricing, stock, images

**Custom Logic:**
- Product publication date management via trigger
- Automatic status workflow integration
- Multi-image upload support

**RLS Policies:**
- Public can view active products from active businesses only
- Business owners can manage their own products

### 4. Appointment Booking
**UI Components:**
- `src/components/admin/AppointmentManager.tsx` - Admin appointment management

**Supabase Tables:**
- `appointments` - Appointment requests with contact details

**Custom Logic:**
- Email notifications via Resend API
- Business email automation via edge function `send-business-email`

**RLS Policies:**
- Anyone can create appointment requests
- Admins can view and manage all appointments

### 5. Category Management
**UI Components:**
- `src/components/CategoryGrid.tsx` - Category display with images
- `src/components/admin/CategoryManager.tsx` - Admin category management

**Supabase Tables:**
- `categories` - Category definitions with slugs and descriptions

**Custom Logic:**
- Dynamic category counting for businesses and products
- Image mapping system for Seychelles-themed visuals

**RLS Policies:**
- Public can view active categories
- Admins can manage all categories

### 6. Admin Panel
**UI Components:**
- `src/pages/AdminPanel.tsx` - Main admin dashboard
- `src/components/admin/SettingsManager.tsx` - System settings
- `src/components/admin/DataSeeder.tsx` - Database seeding tools
- `src/components/admin/HeroSectionManager.tsx` - Homepage content management

**Supabase Tables:**
- `app_settings` - System configuration
- `audit_logs` - Activity tracking

**Custom Logic:**
- Admin privilege checking via `is_admin()` function
- Audit trail via `audit_trigger()` on sensitive tables

**RLS Policies:**
- Admin-only access to management interfaces
- Audit logs visible to admins only

### 7. Google Maps Integration
**UI Components:**
- `src/components/GoogleMap.tsx` - Interactive map component
- `src/components/business/BusinessLocationMap.tsx` - Business location display

**Custom Logic:**
- Edge function `geocode-address` for address validation
- Dynamic API key management via settings
- Responsive map rendering

**Supabase Storage:**
- Maps integration with business coordinates

### 8. File Upload & Storage
**UI Components:**
- Business logo uploads
- Product image galleries
- PDF catalog uploads

**Supabase Storage Buckets:**
- `business-logos` (public)
- `business-covers` (public) 
- `product-images` (public)
- `product-catalogues` (private)
- `business-documents` (public)

**Custom Logic:**
- Automatic file organization by business/product
- Image optimization and resizing
- PDF preview and download

### 9. Payment Processing (Stripe + Visa/Mastercard)
**UI Components:**
- `src/components/admin/PaymentDashboard.tsx` - Payment monitoring
- `src/components/admin/PaymentProviderManager.tsx` - Provider configuration

**Supabase Tables:**
- `payments` - Transaction records with provider details

**Custom Logic:**
- Edge functions:
  - `create-payment-session` - Stripe checkout creation
  - `payment-webhook` - Payment status updates
- Multi-provider support (Stripe, Visa, Mastercard)
- Currency handling (SCR, USD, EUR)

**RLS Policies:**
- Users can view their own payments
- Admins can view all payments
- System can create/update payment records

### 10. AI-Enhanced Search
**UI Components:**
- `src/components/SearchWithTypeahead.tsx` - Intelligent search with suggestions
- `src/components/ImageSearch.tsx` - Visual search functionality

**Custom Logic:**
- Edge function `ai-search` - OpenAI-powered semantic search
- Edge function `image-search` - Visual product matching
- Fallback to traditional database search

### 11. Live Statistics
**UI Components:**
- `src/components/LiveCounters.tsx` - Real-time counters
- `src/components/Hero.tsx` - Homepage statistics display

**Custom Logic:**
- Database function `get_live_counters()` for accurate counts
- Real-time subscriptions for live updates
- Fallback handling for offline scenarios

### 12. Seychelles Visual Theme
**UI Components:**
- Custom Seychelles-themed photography for categories
- Island-inspired color palette and gradients
- Responsive design for tropical aesthetic

**Assets:**
- High-quality photographic images for each category
- Consistent aspect ratios and sizing
- Mobile-optimized layouts

**Lovable-Generated Code:**
- All image generation and theme implementation
- Category image mapping and optimization
- Responsive grid layouts

## Database Schema Summary

### Core Tables
- `profiles` - User management and admin flags
- `businesses` - Business directory with verification workflow
- `products` - Product catalog with inventory management
- `categories` - Classification system for businesses/products

### Operational Tables  
- `appointments` - Booking requests and contact management
- `payments` - Transaction processing and provider integration
- `reviews` - Rating and feedback system
- `bookings` - Service reservation system

### System Tables
- `app_settings` - Configuration management
- `audit_logs` - Activity tracking and compliance

## Edge Functions
- `ai-search` - Semantic search with OpenAI
- `image-search` - Visual product matching
- `geocode-address` - Location validation
- `send-business-email` - Automated notifications
- `create-payment-session` - Stripe integration
- `payment-webhook` - Payment processing
- `get-setting` - Configuration retrieval
- `update-settings` - Configuration updates

## Key Features for External Development

### Safe to Edit Manually:
- UI components in `src/components/`
- Page layouts in `src/pages/`
- Styling in `src/index.css` and `tailwind.config.ts`
- Hook implementations in `src/hooks/`

### Requires Careful Handling:
- Supabase migrations (use migration tool)
- RLS policies (test thoroughly)
- Edge functions (deploy considerations)
- Authentication flows (security implications)

### Generated by Lovable:
- Initial project structure
- Supabase integration setup
- UI component library (shadcn/ui)
- Theme system and design tokens
- Category image generation and mapping
- Responsive layout implementations

## Development Notes

### Recent Updates:
- Implemented photographic category images for enhanced visual appeal
- Optimized Seychelles theme with island-inspired photography
- Enhanced responsive design for mobile users
- Improved image caching and loading performance

### Known Considerations:
- Payment provider configuration requires admin setup
- Google Maps requires valid API key configuration
- AI search features require OpenAI API key
- Email notifications require Resend API setup

### Performance Optimizations:
- Image lazy loading and caching
- Real-time subscription management
- Efficient query patterns with proper indexing
- Fallback handling for offline scenarios
- `src/types/google-maps.d.ts` - TypeScript definitions

**Edge Functions**:
- `supabase/functions/geocode-address/index.ts` - Address geocoding service

**Logic & Validation**:
- Dynamic Google Maps API loading
- Custom markers for businesses
- Info windows with business details
- Fallback to OpenStreetMap for individual business locations
- Address to coordinates conversion
- Island-specific fallback coordinates

**External Dependencies**:
- Google Maps JavaScript API
- OpenStreetMap embed iframes

### 5. File Storage & PDF Handling

**Purpose**: Document storage and downloadable business registration forms.

**Components Involved**:
- `src/components/business/BusinessRegistration.tsx` - PDF download functionality
- PDF storage in `public/business-registration-form.pdf`

**Supabase Storage Buckets**:
- `business-logos` - Business logo images (public)
- `business-covers` - Business cover images (public)
- `product-images` - Product/service images (public)
- `product-catalogues` - Product catalogs (private)
- `business-documents` - Registration forms and documents (public)

**Logic & Validation**:
- PDF download with browser compatibility
- File type validation
- Size limits and compression
- Public/private access control

**RLS Policies**:
- Storage bucket policies for user-specific file access
- Public buckets for logos, covers, and documents
- Private buckets for sensitive catalogs

### 6. Admin Panel System

**Purpose**: Administrative oversight of businesses, appointments, users, and site content.

**Components Involved**:
- `src/pages/AdminPanel.tsx` - Main admin interface
- `src/components/admin/AppointmentManager.tsx` - Appointment management
- `src/components/admin/CategoryManager.tsx` - Category management
- `src/components/admin/HeroSectionManager.tsx` - Hero section content management

**Supabase Tables**:
- `audit_logs` - System activity tracking
  - Fields: table_name, record_id, action, user_id, old_values, new_values
- `hero_section` - Homepage hero section content
  - Fields: id, title, subtitle, image_url, updated_at

**Database Functions**:
- `is_admin()` - Check admin status
- `get_live_counters()` - Dashboard statistics
- `audit_trigger()` - Automatic audit logging
- `update_updated_at_column()` - Automatic timestamp updates

**Logic & Validation**:
- Role-based access control
- Appointment status management (pending → approved/rejected)
- Business verification system
- Category management (create, edit, deactivate)
- Hero section content management with image upload
- Real-time statistics and counters

**RLS Policies**:
- `Anyone can view hero section` - Public access to hero content
- `Admins can update hero section` - Admin-only content editing
- `Admins can insert hero section` - Admin-only content creation

### 7. Search & Discovery Features

**Purpose**: Help users find businesses through various search methods.

**Components Involved**:
- `src/components/SearchWithTypeahead.tsx` - Typeahead search
- `src/components/ImageSearch.tsx` - AI-powered image search
- `src/components/SearchFilter.tsx` - Advanced filtering

**Edge Functions**:
- `supabase/functions/ai-search/index.ts` - AI-powered search
- `supabase/functions/image-search/index.ts` - Image analysis

**Logic & Validation**:
- Real-time search suggestions
- Multi-field search (name, description, services, location)
- AI category detection from images
- Filter combinations (category + location + features)
- Search result ranking and relevance

### 8. Business Reviews & Ratings

**Purpose**: Customer feedback and business reputation system.

**Supabase Tables**:
- `reviews` - Customer reviews
  - Fields: business_id, user_id, rating, comment, helpful_count

**Database Functions**:
- `update_business_rating()` - Automatic rating calculation
- `can_view_review_profile()` - Privacy-aware profile access

**Logic & Validation**:
- Rating scale 1-5 stars
- Comment validation and moderation
- Automatic business rating updates (trigger-based)
- Review helpfulness voting
- Privacy controls for reviewer information

### 9. Product & Service Management

**Purpose**: Businesses can showcase their offerings.

**Components Involved**:
- `src/components/business/ProductManager.tsx` - Product management
- `src/components/business/ProductList.tsx` - Product display
- `src/pages/Products.tsx` - Public product listings

**Supabase Tables**:
- `products` - Business products/services
  - Fields: business_id, name, description, price, currency, category, images, stock_quantity, sku

**Logic & Validation**:
- Product categorization
- Price and currency handling
- Stock management
- Image galleries
- SEO-friendly product pages
- Status management (draft, active, inactive)

### 10. Booking System

**Purpose**: Service booking for businesses that offer appointments.

**Supabase Tables**:
- `bookings` - Service bookings
  - Fields: business_id, user_id, service_type, check_in_date, check_out_date, guests, total_price

**Logic & Validation**:
- Date range validation
- Guest count limits
- Price calculation
- Booking status management
- Calendar integration

## Database Triggers & Functions

### Automatic Functions
- `handle_new_user()` - Creates profile on user signup
- `update_updated_at_column()` - Updates timestamps
- `update_product_published_at()` - Manages product publication dates
- `update_business_rating()` - Recalculates ratings on review changes

### Security Functions
- `is_admin()` - Admin privilege checking
- `can_view_review_profile()` - Privacy-aware profile access

### Analytics Functions
- `get_live_counters()` - Real-time dashboard statistics

## Edge Functions

### AI & Search Services
- `ai-search` - Natural language business search
- `image-search` - AI-powered image analysis for category detection
- `geocode-address` - Address to coordinates conversion

### Communication Services
- `send-business-email` - Email notifications for business operations

## Security Model

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies:

**Public Access**:
- Active businesses (directory browsing)
- Categories and product listings
- Reviews and ratings

**User Access**:
- Own profile and bookings
- Business creation and management
- Review submission

**Admin Access**:
- All tables for management
- Audit logs and analytics
- User and business moderation

### Authentication Flow
1. User registration with email verification
2. Profile creation (automatic trigger)
3. Role assignment (user/business_owner/admin)
4. Session management with automatic refresh
5. Password recovery via email

## External Integrations

### Google Services
- Google Maps JavaScript API for interactive maps
- Google Geocoding API for address resolution

### Email Services
- Resend.com for transactional emails
- Supabase Auth for email verification

### AI Services
- OpenAI API for image analysis and search

## Recent Updates

### Hero Section Refactoring (January 2025)

**Purpose**: Made the homepage hero section fully editable through the admin panel.

**Changes Made**:
- **Database**: Created `hero_section` table with title, subtitle, image_url, and updated_at fields
- **Migration**: `20250113000000_create_hero_section_table.sql` - Includes RLS policies and default data
- **Components**: 
  - Updated `src/components/Hero.tsx` to fetch data dynamically from Supabase
  - Created `src/hooks/useHeroSection.ts` for data management
  - Added `src/components/admin/HeroSectionManager.tsx` for admin editing
- **Admin Panel**: Extended `src/pages/AdminPanel.tsx` with new "Hero Section" tab
- **Types**: Updated `src/integrations/supabase/types.ts` with hero_section table definitions

**Features**:
- Dynamic hero content loading with fallback to default values
- Admin-only image upload to Supabase storage (hero/ folder)
- Real-time content updates without page refresh
- Background image support with overlay for text readability
- Form validation and error handling

**Ownership**: 
- **Original Implementation**: Lovable (hard-coded hero section)
- **Refactoring**: Cursor (migrated to Supabase with admin editing capabilities)

## Development Notes

### Auto-Generated Components (Safe to Edit)
- All UI components in `src/components/ui/` (shadcn/ui)
- Form components and layouts
- Styling and responsive design elements

### Critical System Files (Edit with Caution)
- `src/integrations/supabase/types.ts` - Auto-generated, do not edit
- `supabase/migrations/` - Database schema changes
- Authentication hooks and state management

### Environment Configuration
- Supabase project configuration in `supabase/config.toml`
- Edge function deployment settings
- Storage bucket policies and RLS

### Testing & Validation
- Form validation using Zod schemas
- TypeScript strict mode enabled
- Error boundaries for graceful failures
- Console logging for debugging

## Deployment Architecture

### Frontend (React/Vite)
- Responsive design with Tailwind CSS
- Component-based architecture
- Real-time updates via Supabase subscriptions

### Backend (Supabase)
- PostgreSQL database with RLS
- Edge functions for custom logic
- Storage for file management
- Authentication and authorization

### Infrastructure
- Automatic deployments via Lovable
- CDN for static assets
- Database backups and migrations
- Monitoring and analytics

## Known Issues & Bug Tracking

### High Priority

#### 1. Google Maps API Key Management ⚠️
**Status**: Partial - Manual input required
**Files**: `src/components/GoogleMap.tsx:43-199`
**Repro Steps**:
1. Navigate to any page with Google Maps component
2. Observe "Google Maps API Key Required" prompt
3. Must manually enter API key each session

**Expected vs Actual**:
- **Expected**: API key loaded from environment variables automatically
- **Actual**: Requires manual user input stored in localStorage

**Likely Cause**: 
- Missing environment variable configuration
- No fallback to `VITE_GOOGLE_MAPS_API_KEY` or similar
- Component relies on localStorage instead of build-time env vars

**Ownership**: Cursor
**Suggested Fix**: 
- Add `VITE_GOOGLE_MAPS_API_KEY` to environment variables
- Modify GoogleMap component to check `import.meta.env.VITE_GOOGLE_MAPS_API_KEY` first
- Fallback to localStorage only if env var not available
- Update `.env.example` with required Google Maps API key

#### 2. Missing Environment Variable Documentation ⚠️
**Status**: Partial - Incomplete setup instructions
**Files**: No `.env.example` file exists
**Repro Steps**:
1. Clone repository
2. Try to run `npm run dev`
3. Missing environment variable guidance

**Expected vs Actual**:
- **Expected**: Clear `.env.example` with all required variables
- **Actual**: No environment variable template provided

**Likely Cause**: 
- Environment variables not documented in setup process
- Missing template file for new developers

**Ownership**: Cursor
**Suggested Fix**:
- Create `.env.example` with all required variables
- Update README.md with environment setup instructions

### Medium Priority

#### 3. Error Handling in Google Maps Component ⚠️
**Status**: Partial - Basic error handling only
**Files**: `src/components/GoogleMap.tsx:64-66`
**Repro Steps**:
1. Enter invalid Google Maps API key
2. Observe generic error message
3. No specific error handling for different failure types

**Expected vs Actual**:
- **Expected**: Specific error messages for different failure types
- **Actual**: Generic "Failed to load Google Maps" error

**Likely Cause**: 
- Basic error handling in script.onerror
- No differentiation between error types

**Ownership**: Cursor
**Suggested Fix**:
- Add specific error handling for different Google Maps API errors
- Implement retry logic for network failures
- Add user-friendly error messages with troubleshooting tips

## Cursor Workflow Guide

### Safe Development Practices
1. **Always work in development branch**
2. **Test changes locally before committing**
3. **Use proper migration tools for database changes**
4. **Follow existing code patterns and conventions**
5. **Document all changes in this DEVLOG.md**

### Areas Safe for Cursor Editing
- `docs/` directory - All documentation files
- `src/components/[feature].tsx` - Feature-specific components
- `src/pages/` - Page components (layout and styling)
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions
- Configuration files (environment, deployment)
- Static assets and content
- Test files

### Areas to Avoid Modifying
- `src/components/ui/` - shadcn/ui components (Lovable-generated)
- `src/integrations/supabase/` - Core Supabase integration
- `supabase/migrations/` - Database schema changes
- `package.json` - Dependencies and scripts
- Core authentication flows
- AI search functions
- Database RLS policies

### Adding New Features
1. Create feature branch from main
2. Implement changes in appropriate directories
3. Add tests for new functionality
4. Update documentation
5. Test thoroughly in development
6. Create pull request with detailed description

## Development Notes

### Architecture Decisions
- **State Management**: Using TanStack React Query for server state
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with shadcn/ui components
- **Real-time**: Supabase subscriptions for live updates
- **Error Handling**: React Error Boundaries throughout app

### Performance Considerations
- Database queries optimized with proper indexing
- Image optimization with lazy loading
- Code splitting implemented
- Caching strategy with React Query
- Real-time subscriptions optimized for bandwidth

## Future Development Considerations

### Scalability
- Database indexing for search performance
- Image optimization and CDN
- Caching strategies for directory data

### Features to Consider
- Multi-language support
- Advanced analytics dashboard
- Mobile app development
- Payment processing integration
- Social media integration
- Real-time chat/messaging

### Maintenance
- Regular security updates
- Database performance monitoring
- User feedback collection
- Content moderation tools