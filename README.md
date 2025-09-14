# iCompass Seychelles - Business Directory Platform

A comprehensive business directory and registration platform for the Seychelles islands, built with React, TypeScript, and Supabase.

## Features Overview

### ✅ Implemented Features

- **Business Registration System**: Appointment-based business onboarding with form validation
- **Public Business Directory**: Categorized listings with search, filtering, and location services
- **Authentication & User Management**: Email/password auth with profile management and password recovery
- **Google Maps Integration**: Interactive maps with business locations and geocoding
- **File Storage & PDF Handling**: Document storage with downloadable registration forms
- **Admin Panel**: Business approval, user management, and system analytics
- **AI-Powered Search**: Image search and natural language business discovery
- **Review & Rating System**: Customer feedback with automatic rating calculations
- **Product/Service Showcase**: Business offerings with inventory management
- **Booking System**: Service appointment scheduling
- **Real-time Features**: Live counters, search suggestions, and status updates
- **Payments Subsystem**: Visa/Mastercard direct payments with optional Stripe integration
- **Responsive Hero Section**: Beautiful Seychelles-themed hero with mobile-optimized design

### 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth with RLS
- **File Storage**: Supabase Storage with public/private buckets
- **External APIs**: Google Maps, OpenAI, Resend (email)

## Database Overview

The application uses Supabase PostgreSQL with comprehensive Row Level Security (RLS) policies. See [Database Schema Documentation](docs/schema.md) for detailed information and [RLS Policies Documentation](docs/rls.md) for security details.

**Core Tables:**
- `businesses` - Main business entities
- `profiles` - User profiles with role management
- `products` - Business offerings
- `reviews` - Customer feedback
- `appointments` - Registration requests
- `categories` - Business categories
- `payments` - Payment transactions and processing
- `app_settings` - System configuration and API keys

## Database Schema

### Core Tables

#### `businesses`
Main business entity storage
```sql
- id (uuid, PK)
- owner_id (uuid, FK to profiles)
- name (text, required)
- description (text)
- category (business_category enum)
- status (business_status enum: pending/active/inactive)
- phone, whatsapp, email (text)
- website, facebook_url, instagram_url, linkedin_url, youtube_url (text)
- address, island (text)
- latitude, longitude (numeric)
- logo_url, cover_image_url (text)
- gallery_images (text array)
- services (text array)
- opening_hours (jsonb)
- average_rating (numeric), total_reviews (integer)
- featured (boolean), verified (boolean)
- created_at, updated_at (timestamptz)
```

#### `profiles`
User profile and role management
```sql
- id (uuid, PK)
- user_id (uuid, FK to auth.users)
- full_name, phone (text)
- business_name (text)
- avatar_url (text)
- is_admin, is_business_owner (boolean)
- created_at, updated_at (timestamptz)
```

#### `appointments`
Business registration requests
```sql
- id (uuid, PK)
- business_name, contact_person (text, required)
- phone, whatsapp, email (text)
- website, linkedin_url, facebook_url, youtube_url, instagram_url (text)
- preferred_date (timestamptz), preferred_time (text)
- notes (text)
- status (text, default: 'pending')
- created_at, updated_at (timestamptz)
```

#### `categories`
Business category definitions
```sql
- id (uuid, PK)
- name, slug (text, required)
- description (text)
- is_active (boolean)
- created_at, updated_at (timestamptz)
```

#### `products`
Business offerings
```sql
- id (uuid, PK)
- business_id (uuid, FK to businesses)
- name (text, required)
- description, category, unit, sku (text)
- price (numeric), currency (text, default: 'SCR')
- images (text array)
- catalogue_url (text)
- in_stock (boolean), stock_quantity (integer)
- featured (boolean)
- status (listing_status enum: draft/active/inactive)
- tags (text array)
- published_at, created_at, updated_at (timestamptz)
```

#### `reviews`
Customer feedback system
```sql
- id (uuid, PK)
- business_id (uuid, FK to businesses)
- user_id (uuid, FK to profiles)
- rating (integer, 1-5)
- comment (text)
- helpful_count (integer)
- created_at, updated_at (timestamptz)
```

#### `bookings`
Service booking system
```sql
- id (uuid, PK)
- business_id (uuid, FK to businesses)
- user_id (uuid, FK to profiles)
- service_type (text, required)
- check_in_date, check_out_date (date)
- guests (integer)
- total_price (numeric), currency (text)
- booking_details (jsonb)
- status (text, default: 'pending')
- created_at, updated_at (timestamptz)
```

#### `payments`
Payment transactions and processing
```sql
- id (uuid, PK)
- user_id (uuid, FK to profiles)
- amount (numeric, required)
- currency (text, default: 'USD')
- status (text, default: 'pending')
- payment_provider (text, default: 'visa_mastercard')
- provider_payment_id (text)
- provider_session_id (text)
- metadata (jsonb, default: '{}')
- created_at, updated_at (timestamptz)
```

#### `app_settings`
System configuration and API keys
```sql
- id (uuid, PK)
- key (text, unique, required)
- value (text, required)
- created_at, updated_at (timestamptz)
```

#### `audit_logs`
System activity tracking
```sql
- id (uuid, PK)
- table_name (text, required)
- record_id (uuid, required)
- action (text, required)
- user_id (uuid)
- old_values, new_values (jsonb)
- created_at (timestamptz)
```

### Database Functions

#### Security Functions
- `is_admin()` - Check if current user has admin privileges
- `can_view_review_profile(target_user_id)` - Privacy-aware profile access for business owners

#### Automation Functions
- `handle_new_user()` - Auto-create profile on user signup
- `update_updated_at_column()` - Auto-update timestamps
- `update_product_published_at()` - Manage product publication dates
- `update_business_rating()` - Recalculate business ratings on review changes
- `audit_trigger()` - Log all table changes

#### Analytics Functions
- `get_live_counters()` - Real-time dashboard statistics

### Storage Buckets

- `business-logos` (public) - Business logo images
- `business-covers` (public) - Business cover/hero images  
- `product-images` (public) - Product and service images
- `product-catalogues` (private) - Product catalogs and documents
- `business-documents` (public) - Registration forms and certificates

### Row Level Security (RLS) Policies

All tables implement comprehensive RLS policies:

**Public Access**:
- Active businesses and products (directory browsing)
- Categories and reviews (public information)

**Authenticated User Access**:
- Own profile and bookings (personal data)
- Business creation and management (ownership)
- Review and rating submission (engagement)

**Business Owner Access**:
- Own business and product management
- Customer review context (limited profile access)
- Booking management for their services

**Admin Access**:
- Full system access (all tables)
- Audit logs and analytics
- User and business moderation

## Edge Functions

### `ai-search`
Natural language business search using OpenAI
- Input: Search query text
- Output: Categorized results with relevance scoring
- Requires: `OPENAI_API_KEY`

### `image-search` 
AI-powered image analysis for business discovery
- Input: Uploaded image
- Output: Detected categories and business suggestions
- Requires: `OPENAI_API_KEY`

### `geocode-address`
Address to coordinates conversion for Google Maps
- Input: Address string and island
- Output: Latitude/longitude coordinates
- Fallback: Island-specific center coordinates

### `send-business-email`
Transactional email notifications
- Input: Email template and recipient data
- Output: Email delivery confirmation
- Requires: `RESEND_API_KEY`

## Development Guidelines

### Safe to Edit (Lovable Auto-Generated)
✅ **UI Components**: All files in `src/components/ui/` are shadcn/ui components and can be safely customized
✅ **Page Components**: Layout and styling can be modified
✅ **Form Validation**: Zod schemas can be updated for business requirements
✅ **Styling**: Tailwind classes and custom CSS
✅ **Static Assets**: Images, PDFs, and other static files

### Edit with Caution
⚠️ **Database Types**: `src/integrations/supabase/types.ts` is auto-generated from database schema
⚠️ **Migration Files**: `supabase/migrations/` should only be modified through proper migration tools
⚠️ **Auth Hooks**: Core authentication logic should maintain session management integrity
⚠️ **RLS Policies**: Security policies should be tested thoroughly before changes

### Do Not Modify
🚫 **Generated Files**: Package.json, lock files, and build configurations
🚫 **Supabase Config**: Project IDs and API keys (use environment variables)
🚫 **Core Integrations**: Base Supabase client configuration

### Adding New Features

1. **Database Changes**: Use Supabase migrations for schema updates
2. **New Components**: Follow existing patterns and TypeScript interfaces
3. **API Integrations**: Create edge functions for external service calls
4. **File Storage**: Configure appropriate RLS policies for new buckets
5. **Authentication**: Extend existing hooks rather than creating new auth logic

### Environment Setup for Cursor/IDE Development

1. **Clone and Install**:
   ```bash
   git clone <repository>
   npm install
   ```

2. **Environment Variables**:
   ```env
   VITE_SUPABASE_URL=https://bwlmlniotyrjttglbjrl.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon_key>
   ```

3. **Supabase Local Development**:
   ```bash
   supabase start
   supabase db reset
   ```

4. **Development Server**:
   ```bash
   npm run dev
   ```

### Testing Strategy

- **Form Validation**: All Zod schemas include comprehensive validation
- **Error Boundaries**: React error boundaries catch and display user-friendly errors
- **RLS Testing**: Database policies tested with different user roles
- **Mobile Responsiveness**: All components tested on mobile devices
- **Cross-browser Compatibility**: Tested on Chrome, Firefox, Safari, and mobile browsers

### Performance Considerations

- **Database Indexing**: Key columns indexed for search performance
- **Image Optimization**: Responsive images with lazy loading
- **Caching**: React Query for API response caching
- **Bundle Size**: Code splitting and tree shaking implemented
- **Real-time Updates**: Selective subscriptions to minimize bandwidth

## Deployment

The application is configured for automatic deployment through Lovable's infrastructure:

- **Frontend**: Static site generation with Vite
- **Backend**: Serverless edge functions
- **Database**: Managed PostgreSQL with automatic backups
- **Storage**: CDN-distributed file storage
- **Monitoring**: Built-in error tracking and performance monitoring

For manual deployment to other platforms, see the deployment guides in `/docs/deployment/`.

## Contributing

When contributing to this project:

1. Follow the existing code structure and patterns
2. Use TypeScript strictly (no `any` types)
3. Implement proper error handling and validation
4. Test all database changes with appropriate RLS policies
5. Update documentation for new features
6. Follow the component and naming conventions established

## Support & Documentation

- **Full Development Log**: See `DEVLOG.md` for detailed feature implementation notes
- **API Documentation**: Edge function documentation in `/supabase/functions/`
- **Component Library**: UI component examples in Storybook (if available)
- **Database Schema**: Visual schema diagrams in `/docs/database/`

For questions about specific implementations, refer to the detailed component documentation and database function comments.

## Storage & Assets

### Supabase Storage Buckets

#### Public Buckets
- **`business-logos`**: Business logo images (public access)
- **`business-covers`**: Business cover images (public access)
- **`product-images`**: Product gallery images (public access)
- **`business-documents`**: Business documentation (public access)

#### Private Buckets
- **`product-catalogues`**: Private product catalogs (restricted access)

### Storage Policies
- **Business owners**: Can upload to their business folders
- **Public access**: All business and product images are publicly viewable
- **Secure uploads**: Authentication required for file uploads
- **File organization**: Organized by business ID and content type

### File Upload Guidelines
- **Supported formats**: JPEG, PNG, WebP for images; PDF for documents
- **Size limits**: Enforced at application level
- **Organization**: Files organized by business and content type
- **Security**: RLS policies ensure proper access control

## Deployment

### Platform Deployment
This project is designed for deployment on [Lovable](https://lovable.dev/), which provides:
- **Automatic Deployment**: Push to deploy via Git integration
- **Custom Domain Support**: Connect your own domain name
- **Built-in CI/CD**: Automated testing and deployment pipeline
- **Supabase Integration**: Seamless backend connectivity

### Manual Deployment Options
For alternative deployment platforms:

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your hosting provider

3. **Configure environment variables** on your hosting platform

### Production Considerations
- **Environment Variables**: Ensure all required environment variables are set
- **Supabase Configuration**: Update authentication URLs for production domain
- **API Keys**: Secure all API keys and secrets in production environment
- **Performance**: Enable gzip compression and CDN for optimal performance

---

## Support & Contributing

For questions, issues, or contributions, please refer to the project documentation or contact the development team.

**Built with ❤️ for the Seychelles business community**

---

## Tech Stack & Quick Start

### Core Technologies
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **State Management**: TanStack React Query
- **Forms**: React Hook Form + Zod validation
- **Maps**: Google Maps API
- **AI**: OpenAI API (GPT-4 Vision, GPT-4o-mini)

### Quick Start
```bash
# 1. Clone and install
git clone <repository>
cd seychelles-compass-explore
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys (see Environment Variables section)

# 3. Apply database migrations
npx supabase db push

# 4. Seed demo data (optional)
npm run seed:payments

# 5. Start development server
npm run dev
```

### Environment Variables
Create a `.env.local` file with the following variables:

```env
# Required
VITE_SUPABASE_URL=https://bwlmlniotyrjttglbjrl.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SITE_URL=http://localhost:5173

# Optional (configure via Admin Settings)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
OPENAI_API_KEY=your_openai_api_key
RESEND_API_KEY=your_resend_api_key

# Optional (configure via Payment Provider Manager)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# For seeding (optional)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Environment Setup Guide:**
1. Copy `.env.example` to `.env.local`: `cp .env.example .env.local`
2. Fill in your actual API keys in `.env.local`
3. For production, set these as environment variables on your hosting platform
4. Never commit `.env.local` or any file containing real API keys to version control

**Required API Keys:**
- **Google Maps API Key**: For interactive maps and geocoding services
- **OpenAI API Key**: For AI-powered search and image analysis features
- **Resend API Key**: For transactional email notifications
- **Stripe Keys**: For payment processing (optional, can use direct Visa/Mastercard)

### Hero Section Configuration
The Hero section is fully responsive and includes:
- **Responsive Design**: Automatically adjusts padding and text sizes for mobile/desktop
- **Semi-transparent Overlay**: Ensures text readability on bright background images
- **Admin Management**: Hero content can be edited via Admin Panel → Hero Section
- **Background Image**: Uses `/public/assets/hero.jpg` (Seychelles-themed)
- **Typography**: Scales from `text-4xl` on mobile to `text-8xl` on desktop

## Styling / Hero Section

### Transparent Search Bar Styling
The Hero section features a transparent search bar that blends seamlessly with the background:

**Search Container Styling:**
```css
/* Transparent container with subtle border */
bg-transparent border-b border-white/40

/* Text and placeholder styling */
text-white placeholder-white/70 focus:outline-none
```

**Search Button:**
```css
/* Turquoise button for visibility */
bg-teal-500 hover:bg-teal-600 text-white
```

**Key Design Principles:**
- **Transparency**: Search input uses `bg-transparent` to blend with hero background
- **Contrast**: White text (`text-white`) ensures readability against dark overlay
- **Subtle Borders**: `border-white/40` provides gentle visual separation
- **Call-to-Action**: Turquoise search button stands out for user interaction
- **Focus States**: Clean focus appearance with `focus:outline-none`

**Customization:**
To modify the search bar styling, update these classes in:
- `src/components/Hero.tsx` (search container)
- `src/components/SearchWithTypeahead.tsx` (input and button styling)

**Responsive Behavior:**
- Mobile: Maintains transparency and readability
- Desktop: Scales appropriately with hero content
- All screen sizes: Text remains readable against background

## Project Structure

```
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components (Lovable-generated)
│   │   ├── admin/          # Admin components
│   │   ├── business/       # Business portal components
│   │   └── [feature].tsx   # Feature components
│   ├── pages/              # Route components
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # External service integrations
│   └── lib/                # Utility functions
├── supabase/
│   ├── functions/          # Edge functions (AI search, geocoding, etc.)
│   └── migrations/         # Database migrations
├── public/                 # Static assets
└── docs/                   # Documentation (Cursor-managed)
```

## Features Summary

### ✅ Implemented Features
- **Business Registration**: Appointment-based onboarding system
- **Public Directory**: Categorized listings with advanced search
- **AI-Powered Search**: Natural language and image-based discovery
- **Google Maps Integration**: Interactive maps with geocoding
- **User Management**: Authentication with role-based access
- **Admin Panel**: Business approval and system management
- **Real-time Features**: Live counters and status updates
- **File Storage**: Document and image management

### 🏗️ Architecture Highlights
- **Responsive Design**: Mobile-first approach
- **Real-time Updates**: Supabase subscriptions
- **Error Handling**: Comprehensive error boundaries
- **Performance**: Optimized with React Query caching
- **Security**: Row-level security (RLS) policies

## Lovable vs Cursor Ownership

### 🚫 Lovable-Generated Flows (Do Not Modify Manually)
- **Authentication System**: Login/signup flows, session management
- **Business Registration**: Appointment booking and approval workflow
- **AI Search Functions**: OpenAI integration for natural language and image search
- **Database Schema**: Tables, RLS policies, and migrations
- **Core UI Components**: shadcn/ui component library
- **Build Configuration**: Vite, TypeScript, and package.json setup

### ✅ Cursor-Safe Areas (Safe to Edit)
- **Documentation**: All files in `docs/` directory
- **Configuration Files**: Environment variables, deployment configs
- **Bug Fixes**: Patches to existing functionality
- **New Features**: Additional components and pages
- **Styling**: Custom CSS and Tailwind modifications
- **Content**: Static assets, images, and text content
- **Testing**: Test files and testing configurations

### 🔄 Collaboration Guidelines
- Always test changes in development environment
- Use proper migration tools for database changes
- Follow existing code patterns and conventions
- Document new features in DEVLOG.md
- Respect the separation between generated and custom code