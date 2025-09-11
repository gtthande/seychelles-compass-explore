# iCompass Seychelles Business Directory

A comprehensive business directory platform for Seychelles, connecting businesses with customers through an intuitive web application built with modern technologies.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Database Schema](#database-schema)
- [Security & Policies](#security--policies)
- [User Workflows](#user-workflows)
- [Admin Features](#admin-features)
- [Development Guidelines](#development-guidelines)
- [API & Edge Functions](#api--edge-functions)
- [Storage & Assets](#storage--assets)
- [Deployment](#deployment)

## Overview

iCompass Seychelles is a business directory platform designed to help users discover local businesses, products, and services across the Seychelles islands. The platform emphasizes clean, factual presentation without promotional content, using only business-uploaded images and maintaining a neutral, trustworthy interface.

### Core Principles

- **No Auto-Generated Content**: Only display images and information uploaded by businesses themselves
- **No Promotional Content**: Completely removes event posters, ads, and promotional banners
- **Clean Visual Design**: If no business image is available, omit image sections entirely rather than showing placeholders
- **Direct Contact**: All contact information is directly clickable (phone numbers use `tel:` links, emails use `mailto:` links)
- **User-Friendly Language**: Avoids technical jargon in favor of clear, intuitive wording

## Features

### Core Features
- **Business Directory**: Searchable database of Seychelles businesses
- **Product Catalog**: Business owners can list products and services
- **Advanced Search**: Text, category, and AI-powered image search capabilities
- **Google Maps Integration**: Location-based business discovery with GPS coordinates
- **User Reviews**: Customer feedback system with ratings
- **Live Statistics**: Real-time counters for businesses, products, users, and reviews
- **Responsive Design**: Mobile-first design that works on all devices

### Business Features
- **Business Registration**: Multi-step onboarding process
- **Business Dashboard**: Comprehensive management interface
- **Product Management**: Add, edit, and manage business offerings
- **Image Upload**: Logo, cover images, and product galleries
- **Contact Integration**: Phone, email, WhatsApp, and social media links
- **Location Management**: Address and GPS coordinate storage

### Admin Features
- **Business Approval**: Review and approve new business registrations
- **Content Moderation**: Manage reviews and business information
- **User Management**: View and manage user profiles
- **Analytics Dashboard**: Platform usage statistics
- **Appointment Management**: Handle business consultation requests

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui component library
- **Routing**: React Router DOM
- **State Management**: React hooks and context
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for analytics visualization

### Backend
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **File Storage**: Supabase Storage
- **Edge Functions**: Deno-based serverless functions
- **AI Integration**: OpenAI Vision API for image search

### Development Tools
- **Testing**: Vitest with Testing Library
- **Code Quality**: ESLint with TypeScript support
- **Package Manager**: npm
- **Version Control**: Git

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd icompass-seychelles
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env.local` file in the project root:
   ```env
   VITE_SUPABASE_URL=https://bwlmlniotyrjttglbjrl.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDM3MDEsImV4cCI6MjA3MjI3OTcwMX0.Wx2ypE6AlTBe0vBqC_MvYc5IiwemMaxXGiHOmGM6MoI
   VITE_SUPABASE_PROJECT_ID=bwlmlniotyrjttglbjrl
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Local development: `http://localhost:5173`
   - The app will hot-reload as you make changes

### Additional Setup for Full Functionality

For complete functionality, ensure the following Supabase configurations:

1. **Authentication URLs**: Set Site URL and Redirect URLs in Supabase Dashboard > Authentication > URL Configuration
2. **Google Maps**: Add Google Maps API key for location services
3. **OpenAI**: Configure OpenAI API key for AI-powered search features

## Database Schema

### Core Tables

#### `profiles`
User profile information linked to Supabase Auth users.
```sql
- id: uuid (Primary Key)
- user_id: uuid (Foreign Key to auth.users, Unique)
- full_name: text
- phone: text
- business_name: text
- avatar_url: text
- is_admin: boolean (default: false)
- is_business_owner: boolean (default: false)
- created_at: timestamp with time zone
- updated_at: timestamp with time zone
```

#### `businesses`
Business listings and information.
```sql
- id: uuid (Primary Key)
- owner_id: uuid (Foreign Key to profiles.id)
- name: text (Not Null)
- category: business_category enum (Not Null)
- description: text
- phone: text
- whatsapp: text
- email: text
- website: text
- address: text
- island: text
- latitude: numeric
- longitude: numeric
- logo_url: text
- cover_image_url: text
- gallery_images: text[]
- services: text[]
- opening_hours: jsonb
- status: business_status enum (default: 'pending')
- featured: boolean (default: false)
- verified: boolean (default: false)
- average_rating: numeric (default: 0)
- total_reviews: integer (default: 0)
- facebook_url: text
- instagram_url: text
- linkedin_url: text
- youtube_url: text
- created_at: timestamp with time zone
- updated_at: timestamp with time zone
```

#### `products`
Business products and services.
```sql
- id: uuid (Primary Key)
- business_id: uuid (Foreign Key to businesses.id)
- name: text (Not Null)
- description: text
- category: text
- price: numeric
- currency: text (default: 'SCR')
- unit: text
- images: text[]
- tags: text[]
- sku: text
- in_stock: boolean (default: true)
- stock_quantity: integer
- featured: boolean (default: false)
- status: listing_status enum (default: 'draft')
- catalogue_url: text
- published_at: timestamp with time zone
- created_at: timestamp with time zone
- updated_at: timestamp with time zone
```

#### `reviews`
Customer reviews for businesses.
```sql
- id: uuid (Primary Key)
- business_id: uuid (Foreign Key to businesses.id)
- user_id: uuid (Foreign Key to profiles.user_id)
- rating: integer (1-5)
- comment: text
- helpful_count: integer (default: 0)
- created_at: timestamp with time zone
- updated_at: timestamp with time zone
```

#### `appointments`
Business consultation and appointment requests.
```sql
- id: uuid (Primary Key)
- business_name: text (Not Null)
- contact_person: text (Not Null)
- phone: text
- whatsapp: text
- email: text
- website: text
- preferred_date: timestamp with time zone
- preferred_time: text
- notes: text
- status: text (default: 'pending')
- linkedin_url: text
- facebook_url: text
- youtube_url: text
- instagram_url: text
- created_at: timestamp with time zone
- updated_at: timestamp with time zone
```

### Supporting Tables

#### `categories`
Business category management.
```sql
- id: uuid (Primary Key)
- name: text (Not Null)
- slug: text (Not Null, Unique)
- description: text
- is_active: boolean (default: true)
- created_at: timestamp with time zone
- updated_at: timestamp with time zone
```

#### `bookings`
Service booking management.
```sql
- id: uuid (Primary Key)
- business_id: uuid (Foreign Key to businesses.id)
- user_id: uuid (Foreign Key to profiles.user_id)
- service_type: text (Not Null)
- check_in_date: date
- check_out_date: date
- guests: integer (default: 1)
- total_price: numeric
- currency: text (default: 'SCR')
- booking_details: jsonb
- status: text (default: 'pending')
- created_at: timestamp with time zone
- updated_at: timestamp with time zone
```

#### `audit_logs`
System audit trail for administrative oversight.
```sql
- id: uuid (Primary Key)
- table_name: text (Not Null)
- record_id: uuid (Not Null)
- action: text (Not Null)
- user_id: uuid
- old_values: jsonb
- new_values: jsonb
- created_at: timestamp with time zone
```

### Enums

#### `business_category`
```sql
'restaurants', 'accommodation', 'transportation', 'tours_activities', 
'shopping', 'services', 'healthcare', 'automotive', 'real_estate', 
'education', 'finance', 'technology', 'agriculture', 'fishing', 
'construction', 'entertainment', 'beauty_wellness', 'professional_services'
```

#### `business_status`
```sql
'pending', 'active', 'suspended', 'rejected'
```

#### `listing_status`
```sql
'draft', 'active', 'inactive'
```

## Security & Policies

### Row Level Security (RLS)

All tables have RLS enabled with specific policies:

#### Profiles Table
- **Users can view/update their own profile**: `auth.uid() = user_id`
- **Admins can view all profiles**: Uses `is_admin()` function
- **Business owners can view customer basic info**: For reviews via `can_view_review_profile()` function

#### Businesses Table
- **Anyone can view active businesses**: `status = 'active'`
- **Business owners can manage their businesses**: Owner verification via profiles table
- **Admins can manage all businesses**: Admin verification via profiles table

#### Products Table
- **Anyone can view active products**: Product and business must be active
- **Business owners can manage their products**: Ownership verification via businesses table

#### Reviews Table
- **Anyone can view reviews**: Public access for transparency
- **Users can create/update their own reviews**: User verification via profiles table

#### Admin-Only Tables
- **Appointments**: Only admins can view/update, anyone can create
- **Audit Logs**: Only admins can view
- **Categories**: Only admins can manage, anyone can view active categories

### Database Functions

#### Security Functions
- `is_admin()`: Checks if current user has admin privileges
- `can_view_review_profile(target_user_id)`: Allows business owners to see reviewer profiles
- `get_live_counters()`: Returns platform statistics securely

#### Utility Functions
- `handle_new_user()`: Creates profile when user signs up
- `update_business_rating()`: Maintains rating calculations
- `update_updated_at_column()`: Timestamp management
- `update_product_published_at()`: Product publication tracking
- `audit_trigger()`: Logs data changes for admin oversight

## User Workflows

### Customer Journey

1. **Discovery**
   - Browse featured businesses on homepage
   - Use search (text, category, or AI image search)
   - View live platform statistics
   - Filter by location, category, or ratings

2. **Business Information**
   - View business details, location on map
   - See products/services offered
   - Read customer reviews
   - Access contact information (clickable phone/email)

3. **Engagement**
   - Contact businesses directly via phone/email/WhatsApp
   - Leave reviews and ratings
   - Book services (where applicable)

### Business Owner Journey

1. **Registration**
   - Create user account
   - Complete business registration form
   - Upload business logo and cover image
   - Submit for admin approval

2. **Dashboard Management**
   - Access business dashboard
   - Update business information
   - Manage products and services
   - Upload product images
   - View customer reviews

3. **Growth**
   - Monitor business statistics
   - Respond to customer inquiries
   - Update business information
   - Add new products/services

### Admin Journey

1. **Business Management**
   - Review pending business applications
   - Approve or reject registrations
   - Monitor business activity

2. **Content Moderation**
   - Review user-generated content
   - Manage inappropriate reviews
   - Monitor platform usage

3. **Platform Oversight**
   - View audit logs
   - Manage categories
   - Handle appointment requests
   - Monitor platform statistics

## Admin Features

### Business Administration
- **Approval Workflow**: Review and approve new business registrations
- **Business Monitoring**: View all business activities and updates
- **Status Management**: Activate, suspend, or reject business listings

### Content Management
- **Category Management**: Create and manage business categories
- **Review Moderation**: Monitor and moderate customer reviews
- **Content Oversight**: Ensure platform content meets guidelines

### User Management
- **Profile Access**: View user profiles and activity
- **Permission Management**: Grant admin and business owner privileges
- **Activity Monitoring**: Track user engagement and behavior

### Platform Analytics
- **Live Statistics**: Monitor real-time platform metrics
- **Audit Trails**: Track all data changes and administrative actions
- **Performance Metrics**: Analyze platform usage and growth

### Appointment System
- **Request Management**: Handle business consultation requests
- **Communication Tracking**: Monitor business inquiry responses
- **Follow-up Coordination**: Ensure proper customer service

## Development Guidelines

### Code Organization
- **Component Structure**: Organized by feature (business/, admin/, ui/)
- **Custom Hooks**: Reusable logic in dedicated hook files
- **Type Safety**: Full TypeScript implementation with strict types
- **Design System**: Centralized styling via Tailwind CSS semantic tokens

### Design System Principles
- **Semantic Tokens**: Use CSS custom properties for colors and spacing
- **Neutral Colors**: Professional blue and clean gray palette
- **Responsive Design**: Mobile-first approach with proper touch targets
- **Accessibility**: Proper contrast ratios and semantic HTML

### Code Quality Standards
- **No Direct Colors**: Always use design system tokens
- **Clean Architecture**: Separate concerns and modular components
- **Error Handling**: Comprehensive error boundaries and validation
- **Performance**: Optimized rendering and efficient data fetching

### Business Logic Constraints
- **Image Policy**: Only show business-uploaded images, no placeholders
- **Content Policy**: No promotional banners, ads, or auto-generated content
- **Contact Integration**: All contact info must be directly actionable
- **User-Friendly Language**: Avoid technical jargon in user-facing text

## API & Edge Functions

### Supabase Edge Functions

#### `ai-search`
AI-powered search functionality using OpenAI.
- **Purpose**: Process user search queries with AI analysis
- **Input**: Search query text
- **Output**: Relevant businesses and products with relevance scoring
- **Integration**: OpenAI API for query processing

#### `image-search`
AI-powered image analysis for business categorization.
- **Purpose**: Analyze uploaded images to suggest relevant business categories
- **Input**: Image data (base64)
- **Output**: Suggested categories, keywords, and descriptions
- **Integration**: OpenAI Vision API

#### `geocode-address`
Address to GPS coordinate conversion.
- **Purpose**: Convert business addresses to latitude/longitude coordinates
- **Input**: Address string
- **Output**: GPS coordinates for map integration
- **Integration**: Google Maps Geocoding API

#### `send-business-email`
Email notification system for business communications.
- **Purpose**: Send notifications for business registrations and updates
- **Input**: Email data and recipient information
- **Output**: Email delivery confirmation
- **Integration**: Resend API for email delivery

### API Secrets Configuration

Required secrets in Supabase for full functionality:
- `OPENAI_API_KEY`: For AI search and image analysis
- `RESEND_API_KEY`: For email notifications
- `SUPABASE_SERVICE_ROLE_KEY`: For admin operations
- `SUPABASE_DB_URL`: Database connection string

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