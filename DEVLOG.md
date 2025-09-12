# iCompass Seychelles - Development Log

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

**Purpose**: Administrative oversight of businesses, appointments, and users.

**Components Involved**:
- `src/pages/AdminPanel.tsx` - Main admin interface
- `src/components/admin/AppointmentManager.tsx` - Appointment management
- `src/components/admin/CategoryManager.tsx` - Category management

**Supabase Tables**:
- `audit_logs` - System activity tracking
  - Fields: table_name, record_id, action, user_id, old_values, new_values

**Database Functions**:
- `is_admin()` - Check admin status
- `get_live_counters()` - Dashboard statistics
- `audit_trigger()` - Automatic audit logging

**Logic & Validation**:
- Role-based access control
- Appointment status management (pending → approved/rejected)
- Business verification system
- Category management (create, edit, deactivate)
- Real-time statistics and counters

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