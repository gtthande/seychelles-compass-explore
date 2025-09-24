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

## Business Search System

### BusinessSearch Component
**Location**: `src/components/BusinessSearch.tsx`

**Features**:
- Real-time autocomplete with 300ms debounce
- Keyboard navigation (arrow keys, enter, escape)
- Click-to-navigate functionality
- Responsive design with Tailwind CSS
- Error handling and loading states

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
