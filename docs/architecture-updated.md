# Seychelles Compass Explore - Updated Architecture Documentation

## System Overview

Seychelles Compass Explore is a comprehensive business directory platform built with modern web technologies, designed to showcase local businesses and services across the Seychelles islands.

## Technology Stack

### Frontend
- **React 18** - Modern UI library with hooks and functional components
- **TypeScript** - Type-safe JavaScript for better development experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Shadcn/ui** - High-quality React component library
- **React Router** - Client-side routing
- **React Hook Form** - Form handling and validation
- **Zod** - Schema validation

### Backend & Database
- **Supabase** - Backend-as-a-Service providing:
  - PostgreSQL database
  - Authentication system
  - Row Level Security (RLS)
  - Edge Functions
  - Real-time subscriptions
  - File storage

### Deployment & Infrastructure
- **Vercel** - Frontend deployment and hosting
- **GitHub** - Version control and CI/CD
- **Supabase Cloud** - Database and backend services

## Database Schema

### Core Tables

#### `profiles`
User profiles with role-based access control:
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id),
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  business_name TEXT,
  is_business_owner BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'user', -- 'admin', 'business', 'user'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `businesses`
Business listings with comprehensive information:
```sql
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'active', 'pending', 'suspended'
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  youtube_url TEXT,
  address TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  island TEXT,
  services TEXT[],
  featured BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  logo_url TEXT,
  cover_image_url TEXT,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Development Workflow

### Watchdog System
Automated development server management with self-healing capabilities:
```javascript
// scripts/watchdog.js - Windows-optimized watchdog
const { exec } = require("child_process");

function runDevServer() {
  console.log("🚀 Starting Vite dev server...");
  const server = exec("npm run vite", { shell: true });
  
  server.on("close", (code) => {
    console.log(`⚠️ Dev server exited with code ${code}. Restarting in 3s...`);
    setTimeout(runDevServer, 3000);
  });
}

// Kill any existing process on port 5173
exec("for /f \"tokens=5\" %a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do taskkill /PID %a /F", 
  () => { runDevServer(); }
);
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "node scripts/watchdog.js",    // Watchdog-managed dev server
    "vite": "node scripts/vite.js",       // Direct Vite server
    "build": "vite build",                // Production build
    "deploy": "npm run build && vercel --prod"  // Deploy to production
  }
}
```

### Search Functionality Architecture
```typescript
// Enhanced search with proper button handling
interface SearchWithTypeaheadProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (result: SearchResult) => void;
  onSearch?: (searchTerm: string) => void;  // New search handler
  placeholder?: string;
}

// Search implementation with name and description fields
const { data: businesses } = await supabase
  .from('businesses')
  .select('id, name, category, description')
  .eq('status', 'active')
  .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
  .limit(5);
```

## Autopilot System Features

### Continuous Monitoring
- **Dev Server Health**: Automatic monitoring of port 5173
- **Process Management**: Automatic cleanup of conflicting processes
- **Self-Healing**: Automatic restart on server crashes
- **Error Detection**: Continuous error monitoring and reporting

### Automated Operations
- **Git Operations**: Automatic commit and push of changes
- **Documentation Updates**: Continuous documentation maintenance
- **Schema Management**: Automatic database schema updates
- **Testing**: Continuous functionality testing and validation

### Quality Assurance
- **Linting**: Continuous code quality checks
- **Error Handling**: Comprehensive error handling and recovery
- **Performance Monitoring**: Continuous performance optimization
- **Security**: Continuous security policy enforcement

## Role-Based Access Control (RBAC)

### User Roles

1. **Admin** (`role = 'admin'`)
   - Full system access
   - User management
   - Business approval and management
   - System settings configuration
   - Analytics and reporting

2. **Business** (`role = 'business'`)
   - Manage own business listings
   - Add/edit products and services
   - View business analytics
   - Manage business profile

3. **User** (`role = 'user'`)
   - Browse directory
   - Search businesses and products
   - Register new business (becomes business user)
   - View business details and contact information

### Access Control Implementation

#### Frontend Route Protection
```typescript
// RouteGuard component protects routes based on user role
<Route path="/admin" element={
  <RouteGuard requiredRole="admin">
    <AdminPanel />
  </RouteGuard>
} />

<Route path="/business" element={
  <RouteGuard requiredRole="business">
    <BusinessDashboard />
  </RouteGuard>
} />
```

#### Database Row Level Security (RLS)
```sql
-- Example: Only admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin());

-- Example: Business owners can manage their own businesses
CREATE POLICY "Business owners can manage their businesses" 
ON public.businesses 
FOR ALL 
USING (
  public.is_business_user() 
  AND owner_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);
```

## Security Functions

### Role Checking Functions
```sql
-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
    AND profiles.is_active = true
  );
$$;

-- Check if current user is business user
CREATE OR REPLACE FUNCTION public.is_business_user()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'business'
    AND profiles.is_active = true
  );
$$;
```

## API Architecture

### Supabase Edge Functions

#### `ai-search`
AI-powered search functionality using vector embeddings:
```typescript
// Search businesses and products using AI
const { data } = await supabase.functions.invoke('ai-search', {
  body: { query: searchTerm }
});
```

#### `geocode-address`
Convert addresses to coordinates using Google Geocoding API:
```typescript
// Get coordinates for an address
const { data } = await supabase.functions.invoke('geocode-address', {
  body: { address: address, island: island }
});
```

## Frontend Architecture

### Component Structure
```
src/
├── components/
│   ├── ui/                 # Shadcn/ui components
│   ├── admin/              # Admin-specific components
│   ├── business/           # Business management components
│   └── [shared components] # Reusable components
├── pages/                  # Route components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
├── types/                  # TypeScript type definitions
└── integrations/           # External service integrations
```

### State Management
- **React Context** for authentication state
- **React Query** for server state management
- **Local State** with useState/useReducer for component state

### Custom Hooks
```typescript
// Authentication hook
const { user, loading, signIn, signOut } = useAuth();

// Business authentication hook
const { businessUser, isBusinessOwner } = useBusinessAuth();

// Connection status monitoring
const { isOnline, isConnected } = useConnectionStatus();
```

## Deployment Pipeline

### GitHub Actions CI/CD
Automated deployment pipeline with comprehensive testing and deployment:

#### Interactive Google Maps Integration
Enhanced business detail pages with fully interactive Google Maps:
```typescript
// BusinessDetail component with embedded maps
const getEmbedMapUrl = () => {
  if (!business?.latitude || !business?.longitude) return null;
  
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${business.latitude},${business.longitude}&zoom=15`;
};

// Embedded iframe with full interactivity
<iframe
  src={getEmbedMapUrl()!}
  width="100%"
  height="300"
  style={{ border: 0 }}
  allowFullScreen
  loading="lazy"
  referrerPolicy="no-referrer-when-downgrade"
  className="rounded-lg"
/>
```

#### Enhanced Search Navigation
Fixed search functionality to properly navigate to business detail pages:
```typescript
// SearchWithTypeahead with proper navigation and timeout handling
const fetchSuggestions = async (searchTerm: string) => {
  setIsLoading(true);
  try {
    // Try AI-enhanced search with timeout
    const aiSearchPromise = supabase.functions.invoke('ai-search', {
      body: { query: searchTerm }
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AI search timeout')), 3000)
    );

    try {
      const { data: aiResults, error: aiError } = await Promise.race([
        aiSearchPromise,
        timeoutPromise
      ]) as any;

      if (!aiError && aiResults?.success && aiResults.results?.length > 0) {
        // Handle AI results
        return;
      }
    } catch (aiError) {
      console.log('AI search failed or timed out, falling back to basic search:', aiError);
    }

    // Fallback to basic search
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, name, category, description, address, island')
      .eq('status', 'active')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,category_text.ilike.%${searchTerm}%`)
      .order('name')
      .limit(10);
  } finally {
    setIsLoading(false);
  }
};
```

#### Google Maps Integration with Error Handling
Enhanced business detail pages with proper error handling:
```typescript
// BusinessDetail component with API key validation
const getEmbedMapUrl = () => {
  if (!business?.latitude || !business?.longitude) return null;
  
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('Google Maps API key not found. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file');
    return null;
  }

  return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${business.latitude},${business.longitude}&zoom=15`;
};

// Fallback display for missing API key
{getEmbedMapUrl() ? (
  <iframe src={getEmbedMapUrl()!} width="100%" height="300" />
) : (
  <div className="mt-4 p-4 bg-muted rounded-lg text-center">
    <p className="text-sm text-muted-foreground mb-2">
      Map not available - Google Maps API key required
    </p>
    <p className="text-xs text-muted-foreground">
      Please configure VITE_GOOGLE_MAPS_API_KEY in your environment
    </p>
  </div>
)}
```

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run linter
      run: npm run lint
      
    - name: Run tests
      run: npm test -- --coverage --watchAll=false
      
    - name: Build project
      run: npm run build
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        VITE_GOOGLE_MAPS_API_KEY: ${{ secrets.VITE_GOOGLE_MAPS_API_KEY }}
        VITE_STRIPE_PUBLISHABLE_KEY: ${{ secrets.VITE_STRIPE_PUBLISHABLE_KEY }}
        VITE_SITE_URL: ${{ secrets.VITE_SITE_URL }}
        
    - name: Deploy to Vercel
      if: github.ref == 'refs/heads/main'
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
        working-directory: ./
        scope: ${{ secrets.VERCEL_SCOPE }}
```

### GitHub Integration
1. **Code Push** → GitHub repository
2. **GitHub Actions** → Automated CI/CD pipeline
3. **Testing & Linting** → Quality assurance
4. **Build Process** → Production build
5. **Vercel Deployment** → Automatic deployment
6. **Environment Variables** → Secure configuration
7. **Domain Management** → Custom domain setup

### Environment Configuration
```bash
# Production Environment Variables (GitHub Secrets)
VITE_SUPABASE_URL=https://bwlmlniotyrjttglbjrl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
VITE_SITE_URL=https://seychelles-compass-explore.vercel.app
RESEND_API_KEY=your-resend-api-key-here

# Vercel Configuration (GitHub Secrets)
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
VERCEL_SCOPE=your-vercel-scope
```

### CI/CD Pipeline Steps
1. **Code Checkout** → Clone repository
2. **Node.js Setup** → Install Node.js 18 with npm caching
3. **Dependencies** → Install with `npm ci`
4. **Linting** → Run ESLint for code quality
5. **Testing** → Run test suite with coverage
6. **Building** → Create production build
7. **Deployment** → Deploy to Vercel production
8. **Monitoring** → Track deployment status

## Performance Optimizations

### Frontend
- **Code Splitting** with React.lazy()
- **Image Optimization** with Vite
- **Bundle Analysis** and tree shaking
- **Caching Strategies** with React Query

### Database
- **Indexes** on frequently queried columns
- **Connection Pooling** with Supabase
- **Query Optimization** with proper RLS policies
- **Real-time Subscriptions** for live updates

## Monitoring & Analytics

### Error Tracking
- **Error Boundaries** for React error handling
- **Console Logging** for development debugging
- **Toast Notifications** for user feedback

### Performance Monitoring
- **Vite Bundle Analyzer** for bundle size optimization
- **Supabase Dashboard** for database performance
- **Vercel Analytics** for production metrics

## Security Considerations

### Data Protection
- **Row Level Security** on all database tables
- **Input Validation** with Zod schemas
- **XSS Protection** with React's built-in sanitization
- **CSRF Protection** with Supabase's built-in security

### Authentication Security
- **JWT Tokens** managed by Supabase Auth
- **Session Management** with automatic refresh
- **Role-based Access** with database-level enforcement
- **Secure Password Policies** enforced by Supabase

## Future Enhancements

### Planned Features
1. **Mobile App** with React Native
2. **Advanced Analytics** dashboard
3. **Multi-language Support** for international users
4. **API Rate Limiting** and usage analytics
5. **Advanced Search** with filters and sorting
6. **Business Reviews** and rating system
7. **Event Management** for business events
8. **Newsletter System** for business updates

### Technical Improvements
1. **GraphQL API** for more efficient data fetching
2. **Microservices Architecture** for scalability
3. **Redis Caching** for improved performance
4. **CDN Integration** for global content delivery
5. **Automated Testing** with Jest and Cypress
6. **CI/CD Pipeline** with GitHub Actions
