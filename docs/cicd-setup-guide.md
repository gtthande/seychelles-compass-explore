# CI/CD Setup Guide

## Overview
This guide provides step-by-step instructions for setting up the complete CI/CD pipeline for the Seychelles Compass Explore project.

## Prerequisites
- GitHub repository: `https://github.com/gtthande/seychelles-compass-explore`
- Vercel account with project configured
- Supabase project with API keys
- Google Maps API key
- Stripe account (for payments)

## Step 1: GitHub Repository Secrets

### Required Secrets
Navigate to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

#### Supabase Configuration
```
VITE_SUPABASE_URL=https://bwlmlniotyrjttglbjrl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

#### Google Maps API
```
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

#### Stripe Configuration
```
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key-here
STRIPE_SECRET_KEY=your-stripe-secret-key-here
```

#### Site Configuration
```
VITE_SITE_URL=https://seychelles-compass-explore.vercel.app
```

#### Vercel Configuration
```
VERCEL_TOKEN=your-vercel-token-here
VERCEL_ORG_ID=your-vercel-org-id-here
VERCEL_PROJECT_ID=your-vercel-project-id-here
VERCEL_SCOPE=your-vercel-scope-here
```

## Step 2: Vercel Configuration

### Get Vercel Credentials
1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. Link project: `vercel link`
4. Get credentials:
   - **VERCEL_TOKEN**: From Vercel dashboard → Settings → Tokens
   - **VERCEL_ORG_ID**: From `vercel whoami` command
   - **VERCEL_PROJECT_ID**: From project settings
   - **VERCEL_SCOPE**: Your Vercel team/account scope

### Environment Variables in Vercel
Add the same environment variables in Vercel dashboard:
- Go to Project Settings → Environment Variables
- Add all `VITE_*` variables for Production, Preview, and Development

## Step 3: GitHub Actions Workflow

The workflow is already configured in `.github/workflows/deploy.yml`:

```yaml
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

## Step 4: Testing the Pipeline

### Local Testing
```bash
# Test the CI/CD setup
npx tsx scripts/setup-cicd.ts

# Test build process
npm run build

# Test linting
npm run lint

# Test test suite
npm test
```

### Trigger Deployment
1. Make a small change to any file
2. Commit and push to main branch:
   ```bash
   git add .
   git commit -m "test: trigger CI/CD pipeline"
   git push origin main
   ```
3. Monitor GitHub Actions tab for deployment status
4. Check Vercel dashboard for deployment progress

## Step 5: Monitoring and Maintenance

### GitHub Actions Monitoring
- Go to GitHub repository → Actions tab
- Monitor workflow runs for success/failure
- Check logs for any issues

### Vercel Monitoring
- Go to Vercel dashboard → Project → Deployments
- Monitor deployment status and performance
- Check function logs for any errors

### Health Checks
- Verify production site loads correctly
- Test key functionality (search, business registration, etc.)
- Monitor performance metrics

## Troubleshooting

### Common Issues

#### 1. Missing Environment Variables
**Error**: Build fails with "undefined" environment variables
**Solution**: Ensure all required secrets are set in GitHub repository

#### 2. Vercel Deployment Fails
**Error**: Vercel action fails with authentication error
**Solution**: Verify VERCEL_TOKEN and other Vercel credentials

#### 3. Build Failures
**Error**: npm run build fails
**Solution**: Check for TypeScript errors, missing dependencies, or linting issues

#### 4. Test Failures
**Error**: npm test fails
**Solution**: Fix failing tests or update test configuration

### Debug Commands
```bash
# Check environment variables
npx tsx scripts/setup-cicd.ts

# Test build locally
npm run build

# Run tests locally
npm test

# Check linting
npm run lint

# Verify Vercel connection
vercel whoami
```

## Best Practices

### Development Workflow
1. **Feature Development**: Create feature branches
2. **Pull Requests**: Use PRs for code review
3. **Testing**: Ensure all tests pass before merging
4. **Deployment**: Only merge to main for production deployment

### Security
- Never commit sensitive keys to repository
- Use GitHub Secrets for all sensitive data
- Regularly rotate API keys and tokens
- Monitor access logs and usage

### Performance
- Monitor build times and optimize if needed
- Use npm caching in GitHub Actions
- Optimize bundle size and loading times
- Monitor Vercel function performance

## Support

For issues with the CI/CD pipeline:
1. Check GitHub Actions logs
2. Verify all secrets are correctly set
3. Test locally with the same environment
4. Check Vercel deployment logs
5. Review this guide for troubleshooting steps

## Success Indicators

✅ **Pipeline Working Correctly When:**
- GitHub Actions runs successfully on every push
- Tests pass automatically
- Build completes without errors
- Vercel deployment succeeds
- Production site updates automatically
- All environment variables are properly configured
- No manual intervention required for deployments
