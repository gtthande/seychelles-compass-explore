# iCompass Seychelles - Development Log

## Recent Updates

### 🔧 Hero Section Fix & JSX Syntax Correction (Latest - 2025-01-13)
**Status**: ✅ Completed  
**Description**: Fixed critical JSX syntax error, removed overlay for clean background display, and verified build stability.

**Key Changes**:
- **JSX Syntax Fix**: Corrected missing closing tag error at line 139 that was causing build failures
- **Overlay Removal**: Removed desktop-only dark overlay (`bg-black/30`) to show background image clearly
- **Clean Structure**: Simplified Hero layout with proper nesting and consistent closing tags
- **Build Verification**: Confirmed `npm run build` completes successfully without errors
- **Responsive Design**: Maintained clean, responsive layout with proper text centering
- **Scroll Indicator**: Verified scroll indicator at bottom still functions correctly

**Files Modified**:
- `src/components/Hero.tsx` - Fixed JSX structure and removed overlay styling
- `DEVLOG.md` - This documentation update
- `README.md` - Added Hero Section Fix troubleshooting notes

**Technical Details**:
- Fixed JSX closing tag mismatch that was causing "Expected corresponding JSX closing tag for <section>" error
- Removed `hidden md:block absolute inset-0 bg-black/30 rounded-2xl` overlay styling
- Simplified Hero text container to clean `p-6 md:p-8 lg:p-12` padding
- Maintained all existing functionality: search bar, stats cards, scroll indicator
- Build now completes successfully in ~22 seconds without syntax errors

**Ownership**: 
- **JSX Syntax Fix**: Cursor (corrected critical build-breaking syntax error)
- **Overlay Removal**: Cursor (cleaned up Hero section for better background visibility)

---

### 🎨 Hero Section UI Enhancement (2025-01-13)
**Status**: ✅ Completed  
**Description**: Improved Hero section with desktop-only text overlay and completely transparent search box for a clean, modern look.

**Key Changes**:
- **Clean Search Box**: Removed all shadows, borders, backgrounds, and gradient effects from search container
- **Desktop-Only Text Overlay**: Added subtle `bg-black/30` overlay behind Hero text only on screens ≥768px (tablet/desktop)
- **Mobile Light Design**: No overlay on mobile screens (<768px) for a lighter, cleaner feel
- **Responsive Overlay**: Overlay uses `hidden md:block` to show only on desktop/tablet
- **Clean Styling**: Search box now floats transparently above the hero image with no visual distractions
- **Proper Spacing**: Added `mt-8` to search box for better visual separation from text

**Files Modified**:
- `src/components/Hero.tsx` - Restructured Hero layout with desktop-only overlay and clean search box
- `DEVLOG.md` - This documentation update
- `README.md` - Updated UI notes with new styling information

**Technical Details**:
- Hero text overlay: `hidden md:block absolute inset-0 bg-black/30 rounded-2xl`
- Search box: Completely transparent with no container styling
- Responsive behavior: Overlay appears only on desktop/tablet (≥768px)
- Mobile experience: Clean, light design without overlays
- Maintains all existing functionality and animations

**Ownership**: 
- **Hero UI Enhancement**: Cursor (desktop-only overlay and transparent search box implementation)

---

### 🔧 Post-Crash Recovery & Hero Border Fix (2025-01-13)
**Status**: ✅ Completed  
**Description**: Recovered from computer crash, verified all changes were saved, and fixed Hero section border issues for complete transparency.

**Key Changes**:
- **Crash Recovery**: Verified all previous changes (transparent Hero, payments subsystem, docs) were properly saved in Git
- **Hero Border Fix**: Removed remaining `border-b border-white/40` from search container for complete transparency
- **Clean Styling**: Search box now has no borders, only transparent background with white text
- **Server Recovery**: Killed stuck Node.js processes and restarted dev server cleanly on port 5173
- **Dependencies**: Verified `npm install` completed successfully with all packages up to date
- **Documentation**: Added troubleshooting steps for server crashes and recovery procedures

**Files Modified**:
- `src/components/Hero.tsx` - Removed border styling for complete transparency
- `DEVLOG.md` - This recovery documentation update
- `README.md` - Added troubleshooting section for server crashes

**Technical Details**:
- Hero search container now uses only `bg-transparent` with no border styling
- Search input maintains `border-none` for clean appearance
- Dev server starts cleanly after killing stuck processes
- All previous work (payments subsystem, environment setup) confirmed intact
- Ready for seamless development on different computers

**Ownership**: 
- **Crash Recovery**: Cursor (verified Git state and recovered all changes)
- **Hero Border Fix**: Cursor (removed remaining border styling for complete transparency)

---

### 🔧 Dev Server & Environment Setup Fix (2025-01-13)
**Status**: ✅ Completed  
**Description**: Fixed localhost:5173 connection issues, ensured proper dev server startup, and completed environment configuration.

**Key Changes**:
- **Dev Server Fix**: Killed existing processes and started fresh dev server on port 5173
- **Environment Setup**: Created comprehensive `.env.local` and `.env.example` files
- **Dependencies**: Verified `npm install` completed successfully with all packages up to date
- **Port Verification**: Confirmed server running on `http://localhost:5173` with proper binding
- **Hero Styling**: Verified transparent search bar styling is working correctly
- **Documentation**: Updated DEVLOG.md and README.md with setup instructions

**Files Modified**:
- `.env.local` - Created with all required environment variables
- `.env.example` - Comprehensive template with setup instructions
- `DEVLOG.md` - This documentation update
- `README.md` - Enhanced environment setup documentation

**Technical Details**:
- Dev server now starts cleanly on port 5173 without connection refused errors
- All environment variables properly configured for development
- Hero section transparent styling confirmed working
- Build process verified to work correctly
- Ready for seamless development workflow

**Ownership**: 
- **Dev Server Fix**: Cursor (resolved connection issues and startup problems)
- **Environment Setup**: Cursor (comprehensive .env configuration)

---

### 🎨 Hero Search Bar Styling Fix (2025-01-13)
**Status**: ✅ Completed  
**Description**: Removed solid white background from Hero search bar and implemented transparent styling with proper contrast.

**Key Changes**:
- **Transparent Search Input**: Removed `bg-white/95` and `border border-white/20` from search container
- **Transparent Styling**: Applied `bg-transparent border-b border-white/40` for clean transparent look
- **Text Contrast**: Updated text and placeholder colors to `text-white` and `placeholder-white/70`
- **Turquoise Button**: Maintained visible `bg-teal-500 hover:bg-teal-600` search button
- **Search Icon**: Updated to `text-white/70` for better visibility against hero background
- **Focus States**: Added `focus:outline-none` for clean focus appearance

**Files Modified**:
- `src/components/Hero.tsx` - Updated search bar container styling
- `src/components/SearchWithTypeahead.tsx` - Applied transparent styling and turquoise button
- `.env.example` - Created comprehensive environment variables template
- `DEVLOG.md` - This documentation update

**Technical Details**:
- Search bar now blends seamlessly with hero background
- Text remains readable with proper white/transparent contrast
- Turquoise search button provides clear call-to-action
- Maintains all existing functionality and responsiveness
- Semi-transparent overlay (`bg-black/40`) ensures hero titles stay readable

**Ownership**: 
- **Hero Styling**: Cursor (transparent search bar implementation)
- **Environment Setup**: Cursor (comprehensive .env.example template)

---

### 🎨 Hero Section Enhancement (2025-01-13)
**Status**: ✅ Completed  
**Description**: Enhanced Hero section with responsive design, better text readability, and mobile optimization.

**Key Changes**:
- **Responsive Padding**: Added `pt-24 md:pt-32` for mobile and desktop navbar clearance
- **Semi-transparent Overlay**: Added `bg-black/40 backdrop-blur-sm` for better text readability
- **Responsive Typography**: Implemented `text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl` for title scaling
- **Mobile Optimization**: Improved spacing and sizing for mobile devices
- **Visual Enhancement**: Maintained beautiful Seychelles background with better text contrast

**Files Modified**:
- `src/components/Hero.tsx` - Complete responsive redesign with overlay and better typography
- `DEVLOG.md` - This documentation update

**Technical Details**:
- Hero section now properly clears fixed navbar on all screen sizes
- Text remains readable on bright background images with semi-transparent overlay
- Responsive design scales beautifully from mobile to desktop
- Maintains all existing functionality and visual appeal

**Ownership**: 
- **Hero Enhancement**: Cursor (responsive design and readability improvements)
- **Mobile Optimization**: Cursor (comprehensive mobile-first approach)

---

### 🔧 Port Configuration Fix (2025-01-13)
**Status**: ✅ Completed  
**Description**: Fixed blank screen issue and ensured consistent port 5173 usage.

**Key Changes**:
- **Environment Setup**: Created `.env.local` with all required `VITE_` prefixed variables
- **Port Configuration**: Updated `vite.config.ts` with `strictPort: true` to force port 5173
- **Error Handling**: Enhanced hooks with fallback mechanisms for database connectivity
- **Server Management**: Implemented proper process cleanup and port conflict resolution

**Files Modified**:
- `.env.local` - Created with proper environment variables
- `vite.config.ts` - Added `strictPort: true` for consistent port usage
- `src/hooks/useLiveCounters.tsx` - Enhanced error handling and fallbacks
- `src/hooks/useHeroSection.ts` - Improved error handling for missing settings

**Technical Details**:
- Dev server now consistently runs on `http://localhost:5173`
- Prevents automatic port switching that caused confusion
- Application loads properly with Hero section, Directory, and Admin panel
- All components functional with proper error boundaries

**Ownership**: 
- **Port Configuration**: Cursor (fixed blank screen and port consistency)
- **Environment Setup**: Cursor (created proper .env.local configuration)
- **Error Handling**: Cursor (enhanced hooks with fallback mechanisms)

---

### 💳 Payments Subsystem Enhancement (2025-01-13)
**Status**: ✅ Completed  
**Description**: Enhanced payments subsystem with Visa/Mastercard as default, demo seeding, and improved admin management.

**Key Changes**:
- **Default Payment Provider**: Visa/Mastercard direct payments set as default (Stripe optional)
- **Demo Seeding Script**: Added `admin/seed-payments.ts` with 3 sample transactions
- **Admin Panel**: Enhanced Payment Provider Manager for easy provider switching
- **Database**: Confirmed payments table with proper RLS policies
- **Documentation**: Updated README.md with setup instructions and payments schema

**Files Added/Modified**:
- `admin/seed-payments.ts` - Demo payments seeding script
- `package.json` - Added `npm run seed:payments` command
- `README.md` - Updated with payments subsystem info and setup instructions
- `DEVLOG.md` - This update

**Demo Data Seeded**:
- 2 demo users (John Smith - Paradise Tours, Marie Dubois - Coral Restaurant)
- 3 sample payments (paid, pending, failed) with different providers
- App settings for payment provider configuration

**Ownership**: 
- **Payments System**: Lovable (original implementation)
- **Visa/Mastercard Default**: Cursor (refactored to prioritize direct payments)
- **Demo Seeding**: Cursor (added comprehensive demo data)

---

### 🎨 Visual Design Enhancement (2025-01-13)
**Status**: ✅ Completed  
**Description**: Implemented beautiful Seychelles-inspired visual design with high-quality imagery and tropical color scheme.

**Visual Changes**:
- **Hero Section**: Stunning Seychelles beach background with tropical overlay for readability
- **Color Scheme**: Updated to turquoise/teal ocean theme with coral accents throughout
- **Category Cards**: Added beautiful Seychelles images for key categories (food, accommodation, tours, retail)
- **Design System**: Comprehensive Seychelles-inspired design tokens and gradients

**Images Added** (all ES6 imports):
- `src/assets/hero-seychelles-beach.jpg` - Hero background (1920x1080, high quality)
- `src/assets/category-diving.jpg` - Tourism/diving category image
- `src/assets/category-restaurant.jpg` - Restaurant/food category image  
- `src/assets/category-hotels.jpg` - Hotels/accommodation category image
- `src/assets/category-retail.jpg` - Shopping/retail category image

**Files Modified**:
- `src/index.css` - Updated color system with Seychelles ocean theme
- `src/components/Hero.tsx` - Enhanced with beach background and tropical styling
- `src/components/CategoryGrid.tsx` - Added category images and improved card design
- `src/components/admin/DataSeeder.tsx` - Fixed build errors (owner_id requirement)

**Design Tokens Added**:
- `--ocean-gradient`, `--tropical-gradient` - Seychelles-inspired gradients
- `--hero-overlay` - Tropical overlay for text readability  
- `--card-shadow`, `--tropical-glow` - Enhanced shadows and glowing effects
- Primary: `hsl(186 85% 45%)` - Seychelles turquoise ocean color
- Accent: `hsl(35 85% 85%)` - Coral/sand accent color

**Note**: All images are properly imported as ES6 modules, optimized for responsive display, and include hover animations. Design maintains full functionality while providing a beautiful Seychelles-inspired aesthetic.

---

## Project Overview

iCompass Seychelles is a comprehensive business directory and registration platform for the Seychelles islands. It allows businesses to register, showcase their services, and connect with customers through various channels including contact forms, social media, and location services.

## Implemented Features

### 1. Business Registration & Appointment System

**Purpose**: Allows businesses to request registration through an appointment booking system.

**Components Involved**:
- `src/components/business/BusinessRegistration.tsx` - Main registration form
- `src/pages/BusinessPortal.tsx` - Business portal entry point

**Supabase Tables**:
- `appointments` - Stores appointment requests from businesses
  - Fields: business_name, contact_person, phone, whatsapp, email, website, social URLs, preferred_date/time, notes, status

**Logic & Validation**:
- Zod schema validation for all form fields
- Required fields: business_name, contact_person, phone, email, preferred_date, preferred_time
- URL validation for website and social media links
- Date validation (no past dates allowed)
- Phone number formatting and validation

**RLS Policies**:
- `Anyone can create appointment requests` - Allows public appointment creation
- `Admins can view all appointments` - Admin access for review
- `Admins can update appointments` - Admin can change status

**Custom Logic**:
- Time slot selection (9 AM - 5 PM in 30-minute intervals)
- Business location input (address, GPS coordinates, island selection)
- PDF form download functionality

### 2. Business Directory & Categorization

**Purpose**: Public directory of active businesses with filtering and search capabilities.

**Components Involved**:
- `src/pages/Directory.tsx` - Main directory page
- `src/components/CategoryGrid.tsx` - Category overview component
- `src/components/SearchWithTypeahead.tsx` - Advanced search
- `src/components/ImageSearch.tsx` - AI-powered image search

**Supabase Tables**:
- `businesses` - Main business data
  - Fields: name, description, category, status, contact info, social links, location data, ratings
- `categories` - Business categories
  - Fields: name, slug, description, is_active

**Logic & Validation**:
- Category-based grouping with subcategories:
  - Healthcare → Government/Private (based on verification status)
  - Hospitality → Licensed Hotels/Guesthouses & B&Bs
  - Education → Government Schools/Private Institutions
  - Financial Services → Banks/Other Financial Services
- Alphabetical sorting within subcategories
- Multiple filter options: category, island, WhatsApp availability, featured status
- Full-text search across name, description, category, address, services

**RLS Policies**:
- `Anyone can view active businesses` - Public directory access
- `Business owners can manage their businesses` - Owner access
- `Admins can manage all businesses` - Admin oversight

### 3. Authentication System

**Purpose**: User authentication with password recovery capabilities.

**Components Involved**:
- `src/pages/Auth.tsx` - Sign in/sign up forms
- `src/pages/AuthCallback.tsx` - OAuth callback handler
- `src/pages/PasswordReset.tsx` - Password reset form
- `src/hooks/useAuth.ts` - Authentication state management
- `src/hooks/useBusinessAuth.ts` - Business-specific auth logic

**Supabase Tables**:
- `profiles` - User profile data
  - Fields: user_id, full_name, phone, is_admin, is_business_owner, avatar_url, business_name

**Logic & Validation**:
- Email/password authentication
- Email-based password recovery
- Auto-redirect for authenticated users
- Profile creation on user signup (trigger-based)

**RLS Policies**:
- `Users can view their own profile only` - Profile privacy
- `Users can update their own profile` - Self-management
- `Users can insert their own profile` - Profile creation
- `Admins can view all profiles` - Admin access
- `Business owners can view customer basic info for their reviews` - Review context

### 4. Google Maps Integration

**Purpose**: Location services for businesses and customers.

**Components Involved**:
- `src/components/GoogleMap.tsx` - Interactive Google Maps
- `src/components/business/BusinessLocationMap.tsx` - Business location display
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