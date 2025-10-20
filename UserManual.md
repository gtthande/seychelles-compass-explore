# User Manual - Seychelles Business Directory

## Overview
The Seychelles Business Directory is a comprehensive platform that helps visitors and locals discover businesses, services, and products across the beautiful islands of Seychelles.

## Features

### 🔍 Business Discovery
- **Smart Search**: Find businesses by name, description, or category with real-time suggestions
- **Category Browsing**: Explore businesses by type with live counts (Food (5), Accommodation (3), etc.)
- **Location-based Search**: Filter by specific islands (Mahé, Praslin, La Digue, etc.)
- **Map Integration**: View business locations on interactive maps
- **Instant Results**: Search results appear as you type with no delays
- **Toast Notifications**: Get feedback on search success and results count

### 🏢 Business Categories
- **Food & Beverages**: Restaurants, cafes, bars
- **Accommodation**: Hotels, guesthouses, resorts
- **Tours & Activities**: Diving, hiking, cultural tours
- **Transportation**: Car rentals, bike rentals, boat services
- **Retail Products**: Souvenirs, local crafts, shopping
- **Services**: Wellness, professional services, utilities
- **Entertainment**: Nightlife, cultural events, recreation
- **Education**: Schools, training centers, educational services

### 📱 User Features
- **Business Profiles**: Detailed information including contact details, hours, and services
- **Product Catalogs**: Browse products and services offered by businesses
- **Reviews & Ratings**: Read customer feedback and ratings
- **Contact Information**: Direct access to phone, email, and social media
- **Map Navigation**: Get directions to business locations
- **Interactive Maps**: View business locations on embedded Google Maps
- **Quick Directions**: One-click access to Google Maps directions

## How to Use

### Finding Businesses

#### 1. Smart Search
- Use the search bar at the top of the page
- Type the business name, description, or keywords
- Results appear instantly as you type (no "AI searching..." delays)
- Get toast notifications showing how many businesses were found
- Click on any result to go directly to that business detail page

#### 2. Browse by Category
- Click on category tiles on the homepage
- Or use the category dropdown in the directory
- Each category shows the count of businesses (e.g., "Education (1)")
- Categories are loaded dynamically from actual business data
- Clicking a category immediately filters and shows results

#### 3. Filter by Location
- Use the location dropdown to select an island
- Choose from Mahé, Praslin, La Digue, and other islands
- Results will show businesses on that island

#### 4. Advanced Filtering
- Combine multiple filters (category + location + features)
- Use the "Featured" filter to see highlighted businesses
- Filter by businesses with WhatsApp contact

### Business Information

#### What You'll Find
- **Business Name & Description**: What the business offers
- **Contact Details**: Phone, email, website, social media
- **Location**: Address and island information
- **Services**: List of products and services offered
- **Operating Hours**: When the business is open
- **Ratings**: Customer reviews and star ratings

#### Getting Directions
- **View on Map**: Click the "📍 View on Map" button on any business card to see the location in an interactive Google Maps modal
- **Get Directions**: Click the "🧭 Get Directions" button to open Google Maps with turn-by-turn directions to the business
- Buttons are only available for businesses with location coordinates
- If a business doesn't have location data, the "View on Map" button will be disabled with a tooltip
- Opens in your device's default map application
- Provides turn-by-turn directions

### Product Catalogs
- Browse products and services offered by businesses
- Filter by category, price range, and location
- View product details, images, and pricing
- Contact businesses directly for purchases

## Recent Updates

### January 19, 2025 - Interactive Google Maps & Automated Deployment
- **Interactive Maps**: Business detail pages now feature fully interactive Google Maps with embedded iframes
- **Enhanced Search**: Fixed search functionality to properly navigate to business detail pages
- **Search Timeout Fix**: Resolved "AI searching..." infinite loading issue with proper timeout handling
- **Maps Display Fix**: Fixed missing Google Maps display with proper API key validation and error handling
- **Automated Deployment**: Complete CI/CD pipeline with GitHub Actions and Vercel integration
- **Business Editing**: Business owners can edit their listings directly from the directory
- **Google Maps Integration**: All maps now open with directions in Google Maps or Apple Maps
- **Search Functionality**: Fixed search to properly find businesses like "Seychelles Maritime Academy"
- **Watchdog System**: Automated development server management for better reliability
- **Comprehensive Schema**: Complete database schema with proper role-based access control
- **Enhanced Security**: Improved RLS policies and role-based permissions
- **Fixed Dropdown Issues**: Resolved crashes when using category and location filters
- **Enhanced Search**: Improved search functionality across all business fields

### January 20, 2025 - Directory Map Integration
- **View on Map Buttons**: Added "📍 View on Map" buttons to all business cards in the directory
- **Get Directions Buttons**: Added "🧭 Get Directions" buttons for quick navigation
- **Interactive Map Modal**: Full-screen modal with embedded Google Maps for each business
- **Smart Button States**: Buttons are disabled when location coordinates are missing
- **Mobile Responsive**: Map modal works perfectly on mobile devices
- **API Key Configuration**: Easy setup with VITE_GOOGLE_MAPS_KEY environment variable
- **Utility Functions**: Comprehensive maps utility library for consistent URL generation
- **Enhanced UX**: Buttons positioned under contact icons for better user experience

### January 20, 2025 - Enhanced Map Picker with Fallback
- **Google Maps Primary**: Map picker uses Google Maps when API key is available
- **OpenStreetMap Fallback**: Automatically falls back to Leaflet/OpenStreetMap when Google Maps fails
- **Robust Location Selection**: Works offline and without API keys using OpenStreetMap
- **GPS Integration**: "Get Current Location" button for automatic coordinate detection
- **Coordinate Validation**: All coordinates validated before saving to database
- **Database Sync**: Coordinates sync to both MySQL and Supabase databases
- **Enhanced Security**: API keys stored securely in .env.local (git-ignored)
- **Mobile Optimized**: Touch-friendly map interaction on mobile devices
- **Better Navigation**: Smoother filtering and browsing experience
- **Role-Based Access**: Admin, business, and user roles with appropriate permissions
- **CI/CD Pipeline**: Automated GitHub Actions workflow for testing, building, and deployment
- **Vercel Integration**: Automatic deployment to production on every push to main branch

### Key Improvements
- **Business Management**: Edit business information, coordinates, and social media links
- **Map Directions**: Click any business location to get directions via your preferred map app
- **Stable Filtering**: Category and location dropdowns now work reliably

## Automated Deployment System

### CI/CD Pipeline
The Seychelles Business Directory now features a fully automated deployment system:

#### 🔄 Automated Workflow
- **Code Push** → Automatic deployment triggered
- **Quality Checks** → Linting and testing before deployment
- **Build Process** → Production build with optimized assets
- **Vercel Deployment** → Automatic deployment to production
- **Health Monitoring** → Continuous monitoring of deployment status

#### 🛠️ Development Workflow
1. **Local Development** → Use `npm run dev` with watchdog system
2. **Code Changes** → Make changes to the codebase
3. **Git Push** → Push changes to GitHub main branch
4. **Automatic Testing** → GitHub Actions runs tests and linting
5. **Automatic Build** → Production build created automatically
6. **Automatic Deployment** → Deployed to Vercel production
7. **Live Updates** → Changes are live on production immediately

#### 🔧 Technical Features
- **GitHub Actions**: Automated CI/CD pipeline with quality gates
- **Vercel Integration**: Seamless deployment to production with automatic builds
- **Environment Management**: Secure environment variable handling for all services
- **Quality Assurance**: Automated testing, linting, and build verification
- **Performance Optimization**: Optimized builds for production with caching
- **Interactive Maps**: Embedded Google Maps with full interactivity
- **Search Enhancement**: Improved search navigation and result handling
- **Consistent Interface**: All dropdowns have proper placeholder text
- **Error Prevention**: Eliminated crashes when selecting filter options
- **Better Performance**: Faster loading and smoother interactions
- **User Roles**: Different access levels for admins, business owners, and regular users

## Tips for Best Experience

### Search Tips
- Use specific keywords for better results
- Try different spellings if you don't find what you're looking for
- Use category filters to narrow down results
- Combine location and category filters for precise results

### Navigation Tips
- Use the map feature to see business locations
- Check business hours before visiting
- Look for verified businesses (marked with a checkmark)
- Read reviews to learn about other customers' experiences

### Mobile Usage
- The platform is fully responsive and works on all devices
- Use the map integration for easy navigation
- Save business contact information directly to your phone
- Share business information with friends and family

### Business Owner Features
- **Edit Your Business**: Click the edit button on your business listing to update information
- **Update Location**: Use the "Get Location" button to automatically set coordinates from your address
- **Social Media Links**: Add or update your Facebook, Instagram, LinkedIn, and YouTube links
- **Map Preview**: See how your business location appears on maps before saving
- **Real-time Updates**: Changes appear immediately in the directory

### Admin Features
- **User Management**: View, create, and manage all user accounts
- **Role Assignment**: Promote users to admin or business roles
- **Account Control**: Activate or deactivate user accounts
- **Business Oversight**: Monitor and manage all business listings
- **System Settings**: Configure platform-wide settings and features
- **Dev Sync Panel**: Manage code synchronization and database migrations

#### Dev Sync Panel
The Dev Sync Panel provides powerful tools for managing your development workflow:

**Access**: Navigate to `/admin` and click the "Dev Sync" tab (admin role required)

**Features**:
- **Pull from GitHub** (Blue button): Fetch latest changes from the main branch
- **Push to GitHub** (Green button): Stage, commit, and push your changes
- **Sync UI** (Black button): Synchronize UI components (placeholder)
- **Push DB Migrations** (Purple button): Deploy database changes to production

**Setup Requirements**:
1. Add `ALLOW_SYNC=1` to your `.env` file
2. Install dependencies: `npm install express cors concurrently`
3. Start sync server: `npm run dev:sync` or `npm run dev:full`

**Security**: The Dev Sync Panel is only available when:
- You have admin role (`role = 'admin'`)
- `ALLOW_SYNC=1` is set in environment variables
- The sync server is running on port 3001

**Real-time Logs**: All sync operations show live output in the logs panel, including success messages, errors, and command output.

## Support

### Getting Help
- Check the business contact information for direct support
- Use the platform's search and filter features to find what you need
- Contact businesses directly for specific questions about their services

### Reporting Issues
- If you encounter technical problems, try refreshing the page
- Clear your browser cache if you experience loading issues
- Use a different browser if problems persist

## Privacy & Security
- Your search history is not stored or tracked
- Business contact information is public and provided by the businesses themselves
- The platform uses secure connections for all data transmission
- No personal information is required to browse businesses

---

*Last updated: January 19, 2025*
