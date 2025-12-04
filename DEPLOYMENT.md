# Deployment Guide - Seychelles Business Directory

## 🚀 Vercel Deployment

### Prerequisites
- Vercel account (free tier available)
- GitHub repository connected to Vercel
- Environment variables configured

### Environment Variables
Configure these in Vercel dashboard under Project Settings > Environment Variables:

**⚠️ Security:** Never commit real API keys. Get your keys from the respective dashboards and add them via Vercel's environment variable interface.

```
VITE_SUPABASE_URL=https://bwlmlniotyrjttglbjrl.supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
VITE_SITE_URL=https://your-domain.vercel.app
```

**Where to get your Supabase Anon Key:**
- Go to https://supabase.com/dashboard/project/bwlmlniotyrjttglbjrl/settings/api
- Copy the `anon` `public` key

### Optional Environment Variables (for enhanced features)
```
OPENAI_API_KEY=[YOUR_OPENAI_API_KEY] # For AI search features
RESEND_API_KEY=[YOUR_RESEND_API_KEY] # For reliable password reset emails (recommended)
GOOGLE_MAPS_API_KEY=[YOUR_GOOGLE_MAPS_API_KEY] # For maps integration
STRIPE_SECRET_KEY=[YOUR_STRIPE_SECRET_KEY] # For payment processing
```

### Password Reset Configuration

The app supports multiple email delivery methods for password resets:

1. **Resend (Recommended)**: Set `RESEND_API_KEY` for reliable email delivery
2. **Supabase Default**: Falls back to Supabase's built-in email service
3. **Development Preview**: Use `/dev/email-preview` for local testing

#### Setting up Resend (Production)
1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add `RESEND_API_KEY` to your Vercel environment variables
4. The app will automatically use Resend for password reset emails

#### Testing Password Reset
- **Local**: Visit `/dev/email-preview` to see reset emails and copy links
- **Production**: Check your email inbox for reset instructions
- **Fallback**: If Resend fails, Supabase will handle email delivery automatically

### Deployment Steps

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import from GitHub: `gtthande/seychelles-compass-explore`

2. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables**
   - Add all required environment variables
   - Ensure they're set for Production, Preview, and Development

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be available at `https://your-project.vercel.app`

### Post-Deployment Setup

1. **Seed Demo Data**
   ```bash
   # Run the demo data seeding script
   npx tsx admin/seed-demo-data.ts
   ```

2. **Configure Admin User**
   - Create an admin account through the app
   - Or use the admin creation script:
   ```bash
   npx tsx admin/create-admin.ts
   ```

3. **Test Features**
   - Visit the deployed URL
   - Check business directory
   - Test admin panel
   - Verify payment system

### Custom Domain (Optional)

1. **Add Domain in Vercel**
   - Go to Project Settings > Domains
   - Add your custom domain
   - Update DNS records as instructed

2. **Update Environment Variables**
   - Update `VITE_SITE_URL` to your custom domain
   - Redeploy the project

## 🔧 Local Development

### Quick Start
```bash
# Clone repository
git clone https://github.com/gtthande/seychelles-compass-explore.git
cd seychelles-compass-explore

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your values

# Start development server
npm run dev
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run seed         # Seed demo data
npm run seed:payments # Seed payment data
```

## 📊 Demo Data

The project includes comprehensive demo data:

### Demo Businesses (8 total)
- **Restaurants**: Café des Arts
- **Tourism**: Paradise Diving Center, Praslin Island Tours
- **Hotels**: Le Nautique Hotel
- **Transport**: Island Transport Services, La Digue Bike Rentals
- **Retail**: Coco de Mer Souvenirs
- **Services**: Seychelles Wellness Spa

### Demo Payments (10 total)
- Mixed statuses: completed, pending, failed
- Multiple payment providers: Visa/Mastercard, Stripe
- Various amounts and currencies

### Demo Assets
- Location: `/public/assets/demo/`
- Includes logos, cover images, and gallery photos
- Specifications documented in `/public/assets/demo/README.md`

## 🛠️ Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables are set
   - Ensure all dependencies are installed
   - Verify Node.js version (18+ recommended)

2. **Database Connection Issues**
   - Verify Supabase URL and API key
   - Check RLS policies
   - Ensure database is accessible

3. **Payment Issues**
   - Verify Stripe keys (if using Stripe)
   - Check payment provider configuration
   - Test with demo payment data

### Support
- Check the DEVLOG.md for recent changes
- Review README.md for setup instructions
- Check GitHub issues for known problems

## 🔒 Security Notes

- Never commit API keys to version control
- Use environment variables for sensitive data
- Regularly update dependencies
- Monitor for security vulnerabilities

## 📈 Performance Optimization

- Images are optimized for web delivery
- Code splitting implemented
- Lazy loading for components
- CDN delivery via Vercel

---

**Ready for Production**: ✅ All systems configured and tested
