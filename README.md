# Seychelles Business Directory

A comprehensive business directory platform for the beautiful islands of Seychelles, featuring business listings, product catalogs, appointment booking, and integrated payment processing.

## 🌴 Features

- **Business Directory** - Complete business listings with verification system
- **Product Catalog** - Searchable product inventory with images and pricing
- **Appointment Booking** - Streamlined appointment request system
- **Payment Processing** - Visa/Mastercard (default) + Stripe (optional) + PayPal (optional)
- **Admin Panel** - Complete management dashboard
- **AI-Enhanced Search** - Intelligent search with OpenAI integration
- **Google Maps Integration** - Interactive location services
- **Real-time Statistics** - Live counters and analytics
- **Mobile Responsive** - Optimized for all devices
- **Seychelles Theme** - Island-inspired design with authentic photography
- **Demo Data** - Pre-seeded businesses and payments for testing

## 🚀 Recent Updates (January 15, 2025)

### ✅ Development Environment
- Fixed all build/JSX errors
- Cleaned up Hero section (reduced overlay, improved text contrast)
- Verified development server runs on http://localhost:5173
- All dependencies installed and working

### 💳 Payment System
- **Visa/Mastercard** - Primary payment method (default)
- **Stripe** - Optional integration for advanced features
- **PayPal** - Secondary option (stub for future implementation)
- Admin panel supports payment monitoring and filtering

### 🌱 Demo Data
- Created comprehensive seeding script (`admin/seed-demo-data.ts`)
- 8 demo businesses across Seychelles categories:
  - Restaurants (Café des Arts)
  - Tourism (Paradise Diving Center, Praslin Island Tours)
  - Hotels (Le Nautique Hotel)
  - Transport (Island Transport Services, La Digue Bike Rentals)
  - Retail (Coco de Mer Souvenirs)
  - Services (Seychelles Wellness Spa)
- 10 demo payments with mixed statuses (completed, pending, failed)
- Demo images directory: `/public/assets/demo/`

### 💳 Mock Payment Testing
- Created `/payments/test` route for payment testing
- Mock payment flows for Visa/Mastercard and Stripe
- 80% success rate simulation for realistic testing
- Payment history tracking and status display
- Integration with demo businesses for testing

### 🔐 Password Reset System
- **Frontend Validation**: Inline email validation with error messages
- **Multiple Email Providers**: Resend (recommended) with Supabase fallback
- **Development Preview**: `/dev/email-preview` for local testing
- **Production Ready**: Automatic fallback if Resend fails
- **User-Friendly**: Clear success/error states and instructions

## 🗄️ Database Schema

### Core Tables

#### `profiles`
```sql
- id (uuid, PK) - References auth.users
- user_id (uuid) - Supabase auth user ID  
- full_name (text) - User display name
- phone (text) - Contact number
- is_admin (boolean) - Admin privileges
- is_business_owner (boolean) - Business owner flag
- business_name (text) - Associated business
- avatar_url (text) - Profile picture
```

#### `businesses` 
```sql
- id (uuid, PK)
- owner_id (uuid) - References profiles.id
- name (text) - Business name
- description (text) - Business description
- category (enum) - Business category
- status (enum) - pending|active|inactive|rejected
- verified (boolean) - Admin verification status
- featured (boolean) - Homepage featuring
- address (text) - Physical address
- island (text) - Seychelles island location
- latitude/longitude (numeric) - GPS coordinates
- phone/whatsapp/email/website (text) - Contact info
- social media URLs - Facebook, Instagram, LinkedIn, YouTube
- logo_url/cover_image_url (text) - Branding images
- gallery_images (text[]) - Photo gallery
- services (text[]) - Service offerings
- opening_hours (jsonb) - Operating schedule
- average_rating (numeric) - Calculated rating
- total_reviews (integer) - Review count
```

#### `products`
```sql
- id (uuid, PK)
- business_id (uuid) - References businesses.id
- name (text) - Product name
- description (text) - Product details
- category (text) - Product category
- price (numeric) - Product price
- currency (text) - Price currency (SCR/USD/EUR)
- unit (text) - Pricing unit
- sku (text) - Stock keeping unit
- stock_quantity (integer) - Available quantity
- in_stock (boolean) - Availability flag
- status (enum) - draft|active|inactive
- featured (boolean) - Promotion flag
- images (text[]) - Product photos
- catalogue_url (text) - PDF catalog link
- tags (text[]) - Search tags
- published_at (timestamp) - Publication date
```

#### `categories`
```sql
- id (uuid, PK)
- name (text) - Category display name
- slug (text) - URL-friendly identifier
- description (text) - Category description
- is_active (boolean) - Visibility flag
```

### Operational Tables

#### `appointments`
```sql
- id (uuid, PK)
- business_name (text) - Target business
- contact_person (text) - Requestor name
- phone/email/whatsapp (text) - Contact methods
- preferred_date (date) - Requested date
- preferred_time (text) - Requested time
- notes (text) - Additional details
- status (text) - pending|confirmed|cancelled
- social media URLs - Professional profiles
```

#### `payments`
```sql
- id (uuid, PK)
- user_id (uuid) - Customer reference
- amount (numeric) - Transaction amount
- currency (text) - Transaction currency
- status (text) - pending|completed|failed|cancelled
- payment_provider (text) - visa_mastercard|stripe
- provider_payment_id (text) - External payment ID
- provider_session_id (text) - Session reference
- metadata (jsonb) - Additional payment data
```

#### `reviews`
```sql
- id (uuid, PK)
- business_id (uuid) - References businesses.id
- user_id (uuid) - References profiles.user_id
- rating (integer) - 1-5 star rating
- comment (text) - Review text
- helpful_count (integer) - Usefulness votes
```

#### `bookings`
```sql
- id (uuid, PK)
- business_id (uuid) - Service provider
- user_id (uuid) - Customer
- service_type (text) - Booking category
- check_in_date/check_out_date (date) - Service dates
- guests (integer) - Party size
- total_price (numeric) - Booking cost
- currency (text) - Price currency
- status (text) - Booking status
- booking_details (jsonb) - Service specifics
```

### System Tables

#### `app_settings`
```sql
- id (uuid, PK)
- key (text) - Setting identifier
- value (text) - Setting value
```

#### `audit_logs`
```sql
- id (uuid, PK)
- table_name (text) - Affected table
- record_id (uuid) - Affected record
- action (text) - INSERT|UPDATE|DELETE
- user_id (uuid) - Action performer
- old_values/new_values (jsonb) - Change details
```

## 💳 Payment Processing

### Stripe Integration
```bash
# Enable Stripe in admin panel
# Configure webhook endpoints
# Set up product pricing
# Test payment flows
```

### Visa/Mastercard Support
- Direct card processing
- Secure tokenization
- Multi-currency support (SCR, USD, EUR)
- PCI compliance

### Payment Flow
1. User initiates payment
2. `create-payment-session` edge function called
3. Secure payment page displayed  
4. Payment processed by provider
5. `payment-webhook` updates status
6. User receives confirmation

## 🚀 Local Development

### Running the Dev Server Safely

**Windows Users:**
Use the provided PowerShell script to automatically free port 5173 and start the development server:

```powershell
# Run the safe dev server script
.\run-dev.ps1
```

This script will:
- Check for any processes using port 5173
- Kill conflicting processes automatically
- Start the Vite development server
- Provide clear status messages throughout the process

**Linux/Mac Users:**
Run the development server normally:

```bash
npm run dev
```

### Prerequisites
- Node.js 18+
- Supabase CLI
- Stripe account (for payments)
- Google Maps API key
- OpenAI API key (for AI search)

### Environment Variables
Create `.env` file in project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://bwlmlniotyrjttglbjrl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Keys (configured in Supabase Edge Functions)
OPENAI_API_KEY=sk-... # For AI search features
RESEND_API_KEY=re_... # For email notifications  
GOOGLE_MAPS_API_KEY=AIza... # For maps integration
STRIPE_SECRET_KEY=sk_test_... # For payment processing
```

### Installation & Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Deploy Supabase functions (if needed)
supabase functions deploy
```

### Database Setup
```bash
# Run migrations
supabase db reset

# Seed sample data (optional)
npm run seed

# Seed demo data for testing
npm run seed:demo
```

### Testing Payment System
```bash
# Start development server
npm run dev

# Visit payment test page
# Navigate to http://localhost:5173/payments/test

# Test mock payments with demo businesses
# - Select a demo business
# - Enter customer email and amount
# - Choose payment provider (Visa/Mastercard or Stripe)
# - Process mock payment (80% success rate)
```

### Testing Password Reset System
```bash
# Start development server
npm run dev

# Test password reset flow
# 1. Navigate to http://localhost:5173/auth
# 2. Click "Forgot Password?" on sign-in tab
# 3. Enter email address (validation will show inline errors)
# 4. Check success message and email preview

# Development email preview
# Navigate to http://localhost:5173/dev/email-preview
# - View all password reset requests
# - Copy reset links for testing
# - Preview email content
# - Test reset flow end-to-end
```

## 🔧 Configuration

### Admin Setup
1. Create admin user account
2. Run admin creation script:
```bash
node admin/create-admin.ts
```

### Google Maps Setup
1. Get API key from Google Cloud Console
2. Add to app settings via admin panel
3. Enable required APIs (Maps, Geocoding)

### Payment Setup
1. Configure Stripe webhook endpoints
2. Set up payment providers in admin panel
3. Test payment flows in development

## 📁 Project Structure

### Safe to Edit (Cursor/IDE Compatible)
```
src/
├── components/          # React components
├── pages/              # Page layouts  
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── index.css           # Global styles
└── tailwind.config.ts  # Theme configuration
```

### Requires Care (Supabase Managed)
```
supabase/
├── migrations/         # Database schema changes
├── functions/          # Edge functions
└── config.toml        # Supabase configuration
```

### Generated by Lovable
- Initial project structure and scaffolding
- UI component library (shadcn/ui) integration
- Supabase client setup and configuration
- Authentication flows and user management
- Theme system with design tokens
- Category image generation and optimization
- Responsive layout implementations
- Payment integration boilerplate

## 🔒 Security Features

### Row Level Security (RLS)
- All tables have appropriate RLS policies
- User data isolation
- Admin privilege enforcement
- Business owner data protection

### Authentication
- Supabase Auth integration
- Email/password and OAuth support
- Secure session management
- Role-based access control

### Data Protection
- Encrypted sensitive data
- Audit logging for compliance
- Secure file uploads
- Payment data tokenization

## 🎨 Theming & Customization

### Design System
- Seychelles-inspired color palette
- Island-themed photography
- Responsive breakpoints
- Consistent spacing and typography

### Customization
- Edit `src/index.css` for global styles
- Modify `tailwind.config.ts` for theme tokens
- Update category images in `src/assets/`
- Customize components in `src/components/`

## 🔍 AI Features

### Intelligent Search
- OpenAI-powered semantic search
- Natural language query processing
- Fallback to traditional search
- Image-based product matching

### Setup Requirements
- OpenAI API key configuration
- Edge function deployment
- Search index optimization

## 📱 Mobile Optimization

- Responsive design for all screen sizes
- Touch-friendly interface elements
- Optimized image loading
- Mobile-specific navigation patterns

## 🌟 Key Integrations

- **Supabase** - Backend infrastructure
- **Stripe** - Payment processing
- **Google Maps** - Location services
- **OpenAI** - AI-powered search
- **Resend** - Email notifications
- **Tailwind CSS** - Styling framework
- **shadcn/ui** - Component library

## 📈 Performance

- Lazy loading for images and components
- Efficient database queries with proper indexing
- Real-time subscriptions for live data
- Caching strategies for static content
- Optimized bundle sizes

## 🤝 Contributing

### Development Workflow
1. Create feature branch
2. Implement changes in safe-to-edit areas
3. Test thoroughly with RLS policies
4. Submit pull request with documentation

### Database Changes
- Use Supabase migration tool
- Test RLS policies extensively  
- Document schema changes
- Consider backward compatibility

---

Built with ❤️ for the beautiful islands of Seychelles 🌴

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
- Mobile: Clean, light design with no overlays for optimal readability
- Desktop/Tablet: Subtle semi-transparent overlay behind text for enhanced contrast
- All screen sizes: Text remains readable against background
- Search box: Completely transparent and floats cleanly above the hero image

## Troubleshooting

### Server Crashes & Recovery

If you experience server crashes or connection issues:

**1. Kill Stuck Processes:**
```bash
# Windows
taskkill /F /IM node.exe

# macOS/Linux
pkill -f node
```

**2. Check Port Usage:**
```bash
# Windows
netstat -ano | findstr :5173

# macOS/Linux
lsof -i :5173
```

**3. Clean Restart:**
```bash
# Install dependencies
npm install

# Start fresh dev server
npm run dev
```

**4. Verify Environment:**
- Ensure `.env.local` exists with required variables
- Check that `VITE_SITE_URL=http://localhost:5173` matches your port
- Verify all API keys are properly configured

**5. Git Recovery:**
```bash
# Check current status
git status

# Verify latest commits
git log --oneline -5

# Pull latest changes if needed
git pull origin main
```

**Common Issues:**
- **Blank Screen**: Usually caused by missing environment variables or port conflicts
- **Connection Refused**: Kill existing Node processes and restart dev server
- **Build Errors**: Run `npm install` to ensure dependencies are up to date
- **Styling Issues**: Check that Tailwind classes are properly applied and not overridden

### Hero Section Fix

**Issue**: JSX syntax error causing build failures with "Expected corresponding JSX closing tag for <section>"

**Solution**:
1. Ensure all JSX tags are properly nested and closed
2. Check for missing closing tags in Hero.tsx component
3. Remove any overlay styling that may interfere with background display
4. Verify build with `npm run build` before committing

**Current Status**: ✅ Fixed - Hero section now renders cleanly without overlay, showing background image clearly with proper text contrast and responsive design.

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