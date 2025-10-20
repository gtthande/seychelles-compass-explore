# Technical Documentation - Seychelles Business Directory

## Overview
This document provides comprehensive technical details about the Seychelles Business Directory platform, including architecture, components, and implementation details.

## Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Maps**: Google Maps API
- **Deployment**: Vercel + GitHub Actions CI/CD
- **State Management**: React hooks + TanStack Query

### Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui base components
│   ├── admin/           # Admin-specific components
│   ├── business/        # Business-related components
│   ├── BusinessSearch.tsx    # Global business search
│   └── ...
├── pages/               # Route components
│   ├── BusinessDetail.tsx    # Business detail page
│   ├── Directory.tsx         # Business directory
│   └── ...
├── hooks/               # Custom React hooks
├── integrations/        # External service integrations
├── lib/                 # Utility functions
└── types/               # TypeScript type definitions
```

## Directory Enhancements - Map Integration

### Overview
The Directory page now includes enhanced map functionality with "View on Map" and "Get Directions" buttons for each business card. This provides users with quick access to location information and navigation.

### Implementation Details

#### MapModal Component
**Location**: `src/components/MapModal.tsx`

**Features**:
- Interactive Google Maps embed using Google Maps Embed API
- Business location display with coordinates
- "Get Directions" and "View in Google Maps" action buttons
- Responsive design with mobile optimization
- Graceful fallback when API key is not configured

**Props**:
```typescript
interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  lat: number;
  lng: number;
  address?: string;
}
```

#### Maps Utility Library
**Location**: `src/lib/maps.ts`

**Functions**:
- `getDirectionsUrl(lat, lng)` - Generate Google Maps directions URL
- `getAddressDirectionsUrl(address)` - Generate directions from address
- `getEmbedUrl(lat, lng, apiKey, zoom)` - Generate Google Maps embed URL
- `getViewUrl(lat, lng)` - Generate Google Maps search URL
- `isValidCoordinates(lat, lng)` - Validate coordinate values
- `formatCoordinates(lat, lng, precision)` - Format coordinates for display

#### Button Implementation
**Location**: `src/pages/Directory.tsx` (BusinessListingCard component)

**Features**:
- "View on Map" button (secondary variant) - Opens modal with interactive map
- "Get Directions" button (outline variant) - Opens Google Maps directions
- Buttons are disabled when coordinates are missing
- Proper tooltips for disabled state
- Positioned under contact icons as requested

#### API Configuration
**Environment Variables**:
```bash
# .env.local
VITE_GOOGLE_MAPS_KEY=your_google_maps_api_key_here
```

**Required Google Maps APIs**:
- Maps Embed API
- Maps JavaScript API  
- Directions API

#### Coordinate Data
Business records must include `latitude` and `longitude` fields:
```sql
ALTER TABLE businesses ADD COLUMN latitude DECIMAL(10, 8);
ALTER TABLE businesses ADD COLUMN longitude DECIMAL(11, 8);
```

The Directory query already fetches these fields:
```typescript
.select('id, name, description, category, address, island, phone, email, website, average_rating, featured, status, created_at, latitude, longitude')
```

### Testing Checklist
- [ ] Verify buttons render only when lat/lng exist
- [ ] Test "View on Map" opens modal with correct coordinates
- [ ] Test "Get Directions" opens Google Maps with route
- [ ] Test modal closes smoothly and is responsive on mobile
- [ ] Test fallback behavior when coordinates are missing
- [ ] Test API key configuration and fallback display

## Enhanced Map Picker with Fallback

### Overview
The map picker system has been enhanced with Google Maps primary support and OpenStreetMap (Leaflet) fallback for robust location selection functionality.

### Implementation Details

#### EnhancedMapLocationPicker Component
**Location**: `src/components/EnhancedMapLocationPicker.tsx`

**Features**:
- **Google Maps Primary**: Uses Google Maps JavaScript API when API key is available
- **Leaflet Fallback**: Automatically falls back to OpenStreetMap when Google Maps fails
- **Dynamic Loading**: Loads map libraries only when needed
- **Draggable Markers**: Users can click or drag to set location
- **Current Location**: GPS-based location detection
- **Reset Functionality**: Reset to default Seychelles coordinates

**Fallback Logic**:
```typescript
// Try Google Maps first
if (apiKey && apiKey !== 'your_key_here') {
  try {
    const maps = await loadGoogleMaps(apiKey);
    await initGoogleMap(maps);
    setMapType('google');
    return;
  } catch (error) {
    console.warn('Google Maps failed, falling back to Leaflet:', error);
  }
}

// Fallback to Leaflet
await initLeafletMap();
setMapType('leaflet');
```

#### API Key Configuration
**Environment Variables**:
```bash
# .env.local (ignored by git)
VITE_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
```

**Required Google Maps APIs**:
- Maps JavaScript API
- Maps Embed API
- Directions API

#### Database Schema
**Coordinate Fields**:
```sql
-- Already exists in businesses table
latitude DECIMAL(10,8),   -- -90 to 90 degrees
longitude DECIMAL(11,8),  -- -180 to 180 degrees
```

**Indexes**:
```sql
CREATE INDEX idx_businesses_location ON public.businesses(latitude, longitude);
```

#### Coordinate Validation
**Utility Functions**:
- `isValidCoordinates(lat, lng)` - Validates coordinate ranges
- `getDirectionsUrl(lat, lng)` - Generates Google Maps directions URL
- `getViewUrl(lat, lng)` - Generates Google Maps view URL
- `formatCoordinates(lat, lng, precision)` - Formats coordinates for display

### Security Considerations
- **API Key Protection**: Google Maps API key stored in `.env.local` (git-ignored)
- **Rate Limiting**: Google Maps API has built-in rate limiting
- **Fallback Security**: OpenStreetMap requires no API key, reducing security surface
- **Coordinate Validation**: All coordinates validated before database storage

### Testing Checklist
- [ ] Test Google Maps picker with valid API key
- [ ] Test Leaflet fallback when API key is missing/invalid
- [ ] Test coordinate validation and error handling
- [ ] Test GPS location detection
- [ ] Test marker dragging and map clicking
- [ ] Test coordinate sync to database
- [ ] Test "View in Maps" and "Get Directions" buttons
- [ ] Test mobile responsiveness
- [ ] Test offline functionality with Leaflet

## Dev Sync Panel

### Overview
The Dev Sync Panel provides administrators with a web-based interface to manage code synchronization and database migrations directly from the admin dashboard.

### Architecture
- **Frontend**: React component (`src/pages/admin/DevSyncPanel.tsx`)
- **Backend**: Express server (`scripts/sync-server.js`)
- **Security**: Role-based access with `ALLOW_SYNC` environment flag
- **Integration**: Admin panel tab with real-time logs

### Sync Server
**Location**: `scripts/sync-server.js`

**Endpoints**:
- `POST /api/sync/pull` - Pull latest changes from GitHub
- `POST /api/sync/push` - Stage, commit, and push changes to GitHub
- `POST /api/sync/sync-ui` - Sync UI components (placeholder)
- `POST /api/sync/migrate` - Push database migrations to Supabase
- `GET /api/sync/health` - Health check endpoint

**Features**:
- Cross-platform shell command execution
- Real-time output streaming
- Error handling and logging
- CORS support for frontend integration

### DevSyncPanel Component
**Location**: `src/pages/admin/DevSyncPanel.tsx`

**Features**:
- 4 action buttons with distinct styling:
  - Blue: Pull from GitHub
  - Green: Push to GitHub  
  - Black: Sync UI
  - Purple: Push DB Migrations
- Real-time logs panel with status indicators
- Toast notifications for user feedback
- Security check for `ALLOW_SYNC` environment variable

### Security Implementation
- **Environment Check**: Requires `ALLOW_SYNC=1` to enable functionality
- **Role-based Access**: Only accessible to admin users
- **Server Validation**: Health check endpoint validates sync server availability
- **Graceful Degradation**: Shows locked state when sync is not available

### Setup Instructions

#### 1. Environment Configuration
Add to your `.env` file:
```bash
ALLOW_SYNC=1
SYNC_SERVER_PORT=3001
```

#### 2. Install Dependencies
```bash
npm install express cors concurrently
```

#### 3. Start Development Server
```bash
# Start both frontend and sync server
npm run dev:full

# Or start individually
npm run dev        # Frontend on port 5173
npm run dev:sync   # Sync server on port 3001
```

#### 4. Access Dev Sync Panel
1. Navigate to `/admin` (admin role required)
2. Click on "Dev Sync" tab
3. Use the sync buttons to manage code and database

### Usage

#### Pull from GitHub
- Fetches latest changes from `origin/main`
- Updates local repository
- Shows real-time output in logs panel

#### Push to GitHub
- Stages all changes with `git add .`
- Commits with message "Dev Sync: [action]"
- Pushes to `origin/main`
- Requires write access to repository

#### Sync UI
- Placeholder for UI component synchronization
- Can be extended for specific UI sync workflows

#### Push DB Migrations
- Runs `npx supabase migration push`
- Requires Supabase CLI to be installed
- Pushes pending migrations to production database

### Error Handling
- Network errors are caught and displayed in logs
- Command failures show error output
- Toast notifications provide user feedback
- Logs are limited to last 50 entries

### Cross-Platform Support
- Uses `child_process.spawn` with shell option
- Works on Windows, macOS, and Linux
- Handles different shell environments automatically

## Business Search System

### SearchWithTypeahead Component
**Location**: `src/components/SearchWithTypeahead.tsx`

**Features**:
- Direct Supabase querying (no AI search dependency)
- Real-time autocomplete with 300ms debounce
- Keyboard navigation (arrow keys, enter, escape)
- Click-to-navigate functionality
- Toast notifications for search results
- Error handling with user-friendly messages
- Bounded timeout (3 seconds max) for search operations

**Search Implementation**:
```typescript
// Direct Supabase query for businesses
const { data: businesses, error: businessError } = await supabase
  .from('businesses')
  .select('id, name, category, category_text, description')
  .eq('status', 'active')
  .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category_text.ilike.%${searchTerm}%`)
  .limit(8);
```

**User Feedback**:
- Loading spinner during search
- Toast messages for search success/failure
- "No businesses found for {query}" message
- Clear search and retry options

### BusinessSearch Component
**Location**: `src/components/BusinessSearch.tsx`

**Features**:
- Real-time autocomplete with 300ms debounce
- Keyboard navigation (arrow keys, enter, escape)
- Click-to-navigate functionality
- Responsive design with Tailwind CSS
- Error handling and loading states

## Category System

### Dynamic Category Loading
**Location**: `src/pages/Directory.tsx`

**Implementation**:
```typescript
// Fetch categories from businesses table with counts
const { data, error } = await supabase
  .from('businesses')
  .select('category_text, category')
  .eq('status', 'active')
  .not('category_text', 'is', null);

// Get distinct categories with counts
const categoryMap = new Map<string, { label: string, count: number }>();

data?.forEach(business => {
  const categoryValue = business.category_text || business.category;
  if (categoryValue) {
    const existing = categoryMap.get(categoryValue) || { label: categoryValue, count: 0 };
    existing.count++;
    categoryMap.set(categoryValue, existing);
  }
});

// Convert to array and format labels with counts
const categoryOptions = Array.from(categoryMap.entries()).map(([value, data]) => ({
  value,
  label: `${data.label} (${data.count})`
})).sort((a, b) => a.label.localeCompare(b.label));
```

**Features**:
- Dynamic category loading from actual business data
- Category counts displayed in dropdown
- Fallback to default categories if database query fails
- Real-time category filtering
- Sorted alphabetically for better UX

### Category Filtering
- Clicking a category filters businesses by that category
- Results show immediately without page reload
- Category counts update based on active businesses
- Supports both `category` and `category_text` fields

**Props**:
```typescript
interface BusinessSearchProps {
  placeholder?: string;
  className?: string;
}
```

**Search Query**:
```sql
SELECT id, name, category, description, address, island
FROM businesses
WHERE status = 'active'
AND (
  name ILIKE '%query%' OR
  description ILIKE '%query%' OR
  category ILIKE '%query%'
)
ORDER BY name
LIMIT 10
```

### Business Detail Page
**Location**: `src/pages/BusinessDetail.tsx`

**Route**: `/business/:id`

**Features**:
- Complete business information display
- Google Maps integration (static maps + directions)
- Contact actions (call, WhatsApp, email, website)
- Social media links
- Responsive layout with sidebar
- Error handling for missing businesses

**Data Fetching**:
```typescript
const { data, error } = await supabase
  .from('businesses')
  .select('*')
  .eq('id', businessId)
  .eq('status', 'active')
  .single();
```

## Google Maps Integration

### API Configuration
**Environment Variable**: `VITE_GOOGLE_MAPS_API_KEY`

**Required APIs**:
- Maps JavaScript API (for interactive maps)
- Geocoding API (for address conversion)
- Static Maps API (for static map images)

### Implementation Details

#### Static Maps
```typescript
const getStaticMapUrl = () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&markers=color:red%7C${lat},${lng}&key=${apiKey}`;
};
```

#### Directions Integration
```typescript
const getGoogleMapsUrl = () => {
  if (business?.latitude && business?.longitude) {
    return `https://www.google.com/maps?q=${business.latitude},${business.longitude}`;
  } else if (business?.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`;
  }
  return null;
};
```

## Database Schema

### Businesses Table
```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  island TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  opening_hours TEXT,
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  phone TEXT,
  business_name TEXT,
  is_business_owner BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Authentication & Authorization

### Role-Based Access Control
- **Admin**: Full system access, user management
- **Business**: Business dashboard, own business management
- **User**: Public access, business registration

### Route Protection
```typescript
<RouteGuard requiredRole="admin">
  <AdminPanel />
</RouteGuard>
```

### Authentication Flow
1. User logs in via Supabase Auth
2. `useAuth` hook fetches user profile
3. Role-based redirects and access control
4. Automatic profile creation for new users

## Search Implementation

### Search Types
1. **Business Search** - Direct business name search
2. **Typeahead Search** - AI-enhanced search with suggestions
3. **Image Search** - Visual search capabilities
4. **Filter Search** - Category and location filtering

### Search Performance
- Debounced queries (300ms delay)
- Database indexes on searchable fields
- Result limiting (10 results max)
- Caching with TanStack Query

## Error Handling

### Business Detail Page Errors
- Business not found (404)
- Network errors
- Invalid business ID
- Missing location data

### Search Errors
- No results found
- API failures
- Network timeouts
- Invalid search terms

## Performance Optimizations

### Frontend
- Code splitting with React.lazy()
- Image optimization
- Debounced search queries
- Memoized components

### Backend
- Database indexes
- Query optimization
- Connection pooling
- Caching strategies

## Security

### Data Protection
- Row Level Security (RLS) policies
- Input validation and sanitization
- API key protection
- Secure authentication

### RLS Policies
```sql
-- Users can only view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );
```

## Development Server

### Port Configuration
The development server runs on **port 5174** by default to avoid conflicts with other services.

**Configuration:**
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    host: "::",
    port: 5174,
    strictPort: true, // fail instead of switching ports
  },
});
```

### Port Management Scripts
- `npm run dev` - Start development server on port 5174
- `npm run dev:reset` - Cross-platform script to kill stuck processes and start fresh
- `npm run dev:watchdog` - Start with auto-restart watchdog system

### Cross-Platform Reset Script
**Location**: `scripts/reset-port.js`

**Features:**
- Detects OS platform (Windows, Mac, Linux)
- Kills processes on both ports 5173 and 5174 (legacy and current conflicts)
- Automatically starts fresh dev server on port 5174
- Error handling and user feedback
- ES module compatible

**Platform Commands:**
- **Windows**: `powershell -Command "Get-Process -Id (Get-NetTCPConnection -LocalPort 5173/5174).OwningProcess | Stop-Process -Force"`
- **Mac/Linux**: `lsof -ti:5173/5174 | xargs kill -9 || true`

**Usage:**
```bash
npm run dev:reset
```

**What it does:**
1. Detects your operating system
2. Kills any Node.js/Vite processes on ports 5173 and 5174
3. Waits 2 seconds for processes to fully terminate
4. Starts a fresh development server on port 5174
5. Provides detailed console feedback

### Custom Port Usage
```bash
# Use custom port
npm run dev -- --port 3000

# Override in vite.config.ts
export default defineConfig({
  server: { port: 3000 }
});
```

## Deployment

### CI/CD Pipeline
- GitHub Actions workflow
- Automated testing and linting
- Vercel deployment
- Environment variable management

### Environment Variables
```bash
# Frontend
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-maps-api-key

# Backend (Supabase)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_MAPS_API_KEY=your-maps-api-key
```

## Testing

### Test Coverage
- Component unit tests
- Integration tests
- E2E testing with Playwright
- API endpoint testing

### Test Commands
```bash
npm test              # Run unit tests
npm run test:e2e      # Run E2E tests
npm run test:coverage # Generate coverage report
```

## Monitoring & Analytics

### Performance Monitoring
- Vercel Analytics
- Supabase monitoring
- Error tracking
- Performance metrics

### Business Metrics
- Search queries
- Business page views
- Contact actions
- User engagement

## API Endpoints

### Supabase Edge Functions
- `/ai-search` - AI-enhanced search
- `/geocode-address` - Address geocoding
- `/image-search` - Visual search
- `/send-business-email` - Email notifications

### Database Queries
- Business search and filtering
- User profile management
- Business CRUD operations
- Analytics and reporting

## Future Enhancements

### Planned Features
- Advanced filtering options
- Business reviews and ratings
- Appointment booking system
- Payment integration
- Mobile app development

### Technical Improvements
- Search result caching
- Offline functionality
- Progressive Web App (PWA)
- Advanced analytics dashboard

## Troubleshooting

### Port Conflicts
**Problem**: `Error: Port 5173/5174 is already in use`

**Solution**: Use the cross-platform reset script
```bash
npm run dev:reset
```

**Manual Resolution**:
- **Windows**: `taskkill /F /IM node.exe`
- **Linux/Mac**: `pkill -f node`

### Common Issues
1. **Search not working**: Check database connection and RLS policies
2. **Maps not loading**: Verify Google Maps API key and quotas
3. **Authentication errors**: Check Supabase configuration
4. **Performance issues**: Review database indexes and query optimization
5. **Port conflicts**: Use `npm run dev:reset` to auto-resolve

### Debug Tools
- Browser developer tools
- Supabase dashboard
- Vercel function logs
- Network monitoring

## Support

For technical support:
1. Check this documentation
2. Review error logs
3. Test with provided credentials
4. Contact development team

## Contributing

### Development Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run development server: `npm run dev`

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits for version control
