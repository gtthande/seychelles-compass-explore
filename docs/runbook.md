# iCompass Seychelles - Development Runbook

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git
- Supabase CLI (optional, for local development)

### Initial Setup
```bash
# Clone the repository
git clone <repository-url>
cd seychelles-compass-explore

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your actual values

# Start development server
npm run dev
```

## Environment Variables

### Required Variables

#### Supabase Configuration
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Google Maps API
```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

#### AI Services
```env
OPENAI_API_KEY=your_openai_api_key
```

#### Email Services
```env
RESEND_API_KEY=your_resend_api_key
```

### Optional Variables
```env
NODE_ENV=development
VITE_APP_ENV=development
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=info
```

### Feature Flags
```env
VITE_ENABLE_AI_SEARCH=true
VITE_ENABLE_IMAGE_SEARCH=true
VITE_ENABLE_EMAIL_NOTIFICATIONS=true
VITE_ENABLE_GOOGLE_MAPS=true
```

## Available Scripts

### Development
```bash
# Start development server
npm run dev

# Start with specific port
npm run dev -- --port 3000

# Start with host binding
npm run dev -- --host
```

### Building
```bash
# Production build
npm run build

# Development build
npm run build:dev

# Preview production build
npm run preview
```

### Code Quality
```bash
# Run ESLint
npm run lint

# Run ESLint with auto-fix
npm run lint -- --fix

# Type checking (if available)
npm run typecheck
```

### Testing
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Local Development

### Supabase Local Development
```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Reset local database
supabase db reset

# Stop local Supabase
supabase stop
```

### Database Migrations
```bash
# Apply migrations to local database
supabase db push

# Generate new migration
supabase db diff --schema public > supabase/migrations/new_migration.sql

# Reset and apply all migrations
supabase db reset
```

### Edge Functions
```bash
# Deploy edge functions
supabase functions deploy

# Deploy specific function
supabase functions deploy ai-search

# Test edge function locally
supabase functions serve
```

## Environment-Specific Configuration

### Lovable Features (Production)
These features require specific environment variables and are managed by Lovable:

#### AI Search Features
- **Required**: `OPENAI_API_KEY`
- **Used by**: `supabase/functions/ai-search/`, `supabase/functions/image-search/`
- **Purpose**: Natural language and image-based business search

#### Email Notifications
- **Required**: `RESEND_API_KEY`
- **Used by**: `supabase/functions/send-business-email/`
- **Purpose**: Business registration and notification emails

#### Google Maps Integration
- **Required**: `VITE_GOOGLE_MAPS_API_KEY`
- **Used by**: `src/components/GoogleMap.tsx`
- **Purpose**: Interactive maps and geocoding

### Cursor Features (Development)
These features can be safely modified by Cursor:

#### Documentation
- **Files**: All files in `docs/` directory
- **Purpose**: Project documentation and guides

#### UI Components
- **Files**: `src/components/[feature].tsx` (excluding `ui/` folder)
- **Purpose**: Feature-specific components

#### Configuration
- **Files**: Environment variables, build configs
- **Purpose**: Development and deployment configuration

## Troubleshooting

### Common Build Errors

#### 1. Environment Variables Not Found
**Error**: `process.env.VITE_SUPABASE_URL is undefined`
**Solution**:
```bash
# Check if .env.local exists
ls -la .env.local

# Verify environment variables are loaded
npm run dev
# Check console for environment variable values
```

#### 2. Google Maps API Key Issues
**Error**: "Google Maps API Key Required" prompt
**Solution**:
```bash
# Add to .env.local
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key

# Restart development server
npm run dev
```

#### 3. Supabase Connection Issues
**Error**: Supabase client connection failed
**Solution**:
```bash
# Verify Supabase URL and key
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Test connection
curl -H "apikey: $VITE_SUPABASE_ANON_KEY" $VITE_SUPABASE_URL/rest/v1/
```

#### 4. TypeScript Errors
**Error**: Type errors in components
**Solution**:
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Update type definitions if needed
npm install @types/google.maps
```

### Common Runtime Errors

#### 1. RLS Policy Violations
**Error**: "Row Level Security policy violation"
**Solution**:
- Check user authentication status
- Verify user has appropriate permissions
- Review RLS policies in `docs/rls.md`

#### 2. File Upload Failures
**Error**: "Storage bucket access denied"
**Solution**:
- Verify user is authenticated
- Check storage bucket policies
- Ensure proper file permissions

#### 3. Real-time Connection Issues
**Error**: "Supabase real-time connection failed"
**Solution**:
- Check network connectivity
- Verify Supabase project status
- Review real-time configuration

### Performance Issues

#### 1. Slow Page Loads
**Solutions**:
- Enable code splitting
- Optimize images
- Check bundle size
- Review database queries

#### 2. Slow Search Performance
**Solutions**:
- Check database indexes
- Optimize search queries
- Implement caching
- Review AI search API limits

## Development Workflow

### Feature Development
1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow existing code patterns
   - Add proper TypeScript types
   - Include error handling
   - Add tests if applicable

3. **Test Changes**
   ```bash
   npm run lint
   npm run build
   npm test
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Create Pull Request**
   - Include detailed description
   - Reference any related issues
   - Add screenshots if UI changes

### Database Changes
1. **Create Migration**
   ```bash
   supabase db diff --schema public > supabase/migrations/your_migration.sql
   ```

2. **Test Migration**
   ```bash
   supabase db reset
   supabase db push
   ```

3. **Update Types**
   ```bash
   supabase gen types typescript --local > src/integrations/supabase/types.ts
   ```

### Deployment
1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Test Production Build**
   ```bash
   npm run preview
   ```

3. **Deploy**
   - Push to main branch (Lovable handles deployment)
   - Or deploy manually to your hosting platform

## Monitoring and Debugging

### Development Tools
- **React DevTools**: Browser extension for React debugging
- **Supabase Dashboard**: Monitor database and API usage
- **Browser DevTools**: Network, console, and performance monitoring

### Logging
```javascript
// Development logging
if (import.meta.env.DEV) {
  console.log('Debug info:', data);
}

// Error logging
console.error('Error occurred:', error);
```

### Performance Monitoring
- **Bundle Analyzer**: `npm run build -- --analyze`
- **Lighthouse**: Browser performance auditing
- **Supabase Metrics**: Database and API performance

## Security Considerations

### Environment Variables
- Never commit `.env.local` to version control
- Use different API keys for development and production
- Rotate API keys regularly
- Monitor API key usage

### Database Security
- Review RLS policies regularly
- Monitor audit logs
- Test security policies with different user roles
- Keep Supabase client updated

### Code Security
- Validate all user inputs
- Use TypeScript for type safety
- Implement proper error handling
- Follow security best practices

## Getting Help

### Documentation
- **README.md**: Project overview and setup
- **docs/schema.md**: Database schema documentation
- **docs/rls.md**: Security policies documentation
- **docs/feature-map.md**: Feature implementation guide

### Support Channels
- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Check existing docs first
- **Code Comments**: Review inline documentation

### Common Resources
- **Supabase Docs**: https://supabase.com/docs
- **React Docs**: https://react.dev
- **TypeScript Docs**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs