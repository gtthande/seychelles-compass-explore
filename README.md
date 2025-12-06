# iCompass Seychelles - Business Directory Platform

A comprehensive business directory platform for the beautiful islands of Seychelles, featuring business listings, product catalogs, appointment booking, and integrated payment processing.

## 🌴 Features

- **Business Directory** - Complete business listings with verification system
- **Business Search & Details** - Advanced search with detailed business pages
- **Product Catalog** - Searchable product inventory with images and pricing
- **Appointment Booking** - Streamlined appointment request system
- **Payment Processing** - Visa/Mastercard (default) + Stripe (optional) + PayPal (optional)
- **Admin Panel** - Complete management dashboard
- **AI-Enhanced Search** - Intelligent search with OpenAI integration
- **Google Maps Integration** - Interactive location services with static maps
- **Real-time Statistics** - Live counters and analytics
- **Mobile Responsive** - Optimized for all devices
- **Seychelles Theme** - Island-inspired design with authentic photography

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git
- Supabase account (for backend services)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd seychelles-compass-explore

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your actual values (see Environment Variables section)

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Start with port reset (kills stuck processes)
npm run dev:reset

# Generate Supabase types
npm run gen:types

# Build for production
npm run build

# Preview production build
npm run preview

# Seed admin user
npm run seed:admin
```

## 📁 Project Structure

```
seychelles-compass-explore/
├── src/
│   ├── components/          # React components
│   │   ├── admin/          # Admin panel components
│   │   ├── business/       # Business portal components
│   │   ├── products/       # Product components
│   │   └── ui/             # shadcn/ui components
│   ├── pages/              # Route components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and API helpers
│   │   └── api/           # API route handlers
│   ├── types/              # TypeScript type definitions
│   ├── integrations/       # External service integrations
│   │   └── supabase/      # Supabase client configuration
│   └── utils/              # Helper utilities
├── supabase/
│   ├── migrations/         # Database migrations
│   └── functions/         # Edge functions
├── public/                 # Static assets
├── scripts/                # Utility scripts
└── admin/                  # Admin utility scripts
```

## 🔐 Environment Variables

Create a `.env` file in the project root with the following variables:

### Required Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://bwlmlniotyrjttglbjrl.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
VITE_SITE_URL=http://localhost:5173
```

### Optional Variables (for enhanced features)

```bash
# Google Maps API (for maps and geocoding)
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here

# OpenAI API (for AI search features)
OPENAI_API_KEY=your-openai-api-key-here

# Resend API (for email notifications - recommended)
RESEND_API_KEY=your-resend-api-key-here

# Stripe (for payment processing)
STRIPE_SECRET_KEY=your-stripe-secret-key-here
```

### Getting Your API Keys

1. **Supabase Keys:**
   - Go to https://supabase.com/dashboard/project/bwlmlniotyrjttglbjrl/settings/api
   - Copy the `anon` `public` key for `VITE_SUPABASE_ANON_KEY`

2. **Google Maps API Key:**
   - Go to https://console.cloud.google.com/
   - Create a project and enable Maps JavaScript API and Geocoding API
   - Create credentials (API Key) and restrict to your domain

3. **OpenAI API Key:**
   - Go to https://platform.openai.com/api-keys
   - Create a new API key

4. **Resend API Key:**
   - Sign up at https://resend.com
   - Get your API key from the dashboard

⚠️ **Security Note:** Never commit real API keys to the repository. Always use `.env` file (which is gitignored).

## 🗄️ Database Schema

The application uses Supabase (PostgreSQL) with the following core tables:

- **profiles** - User profiles with admin/business owner flags
- **businesses** - Business listings with verification workflow
- **categories** - Business/product categories
- **business_categories** - Many-to-many relationship between businesses and categories
- **products** - Master product catalogue
- **business_products** - Business-specific product instances with pricing
- **appointments** - Appointment booking requests
- **payments** - Payment transaction records
- **reviews** - Business reviews and ratings

For detailed schema information, see [SCHEMA_LOCK.md](./supabase/SCHEMA_LOCK.md).

## 🔄 Database Migrations

### Applying Migrations

1. **Via Supabase Dashboard (Recommended):**
   - Go to https://supabase.com/dashboard/project/bwlmlniotyrjttglbjrl/sql/new
   - Open the migration file from `supabase/migrations/`
   - Copy and paste the SQL content
   - Click "Run" to execute

2. **Via Supabase CLI:**
   ```bash
   supabase db push
   ```

### Migration Order

1. Apply schema migrations first
2. Run type generation: `npm run gen:types`
3. Test the application

For detailed migration instructions, see [MIGRATION_APPLICATION_GUIDE.md](./MIGRATION_APPLICATION_GUIDE.md).

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository:**
   - Push your code to GitHub
   - Connect repository to Vercel

2. **Configure Environment Variables:**
   - Add all required environment variables in Vercel dashboard
   - Set `VITE_SITE_URL` to your production domain

3. **Deploy:**
   - Vercel will automatically build and deploy
   - The build command is: `npm run build`
   - Output directory: `dist`

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## 🧪 Testing

### Payment Testing

Visit `/payments/test` to test mock payment flows with demo businesses.

### Password Reset Testing

- **Development:** Visit `/dev/email-preview` to see reset emails and copy links
- **Production:** Check your email inbox for reset instructions

## 📚 Documentation

- [SCHEMA_LOCK.md](./supabase/SCHEMA_LOCK.md) - Database schema reference
- [MIGRATION_APPLICATION_GUIDE.md](./MIGRATION_APPLICATION_GUIDE.md) - How to apply migrations
- [DEVLOG.md](./DEVLOG.md) - Development log and change history
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide

## 🔒 Security Features

- **Row Level Security (RLS)** - All tables have appropriate RLS policies
- **Authentication** - Supabase Auth integration with email/password and OAuth
- **Data Protection** - Encrypted sensitive data, audit logging
- **Secure File Uploads** - File validation and secure storage
- **Payment Data Tokenization** - Secure payment processing

## 🛠️ Troubleshooting

### Port Conflicts

If port 5173 is already in use:

```bash
# Use the reset script
npm run dev:reset

# Or manually kill the process
# Windows:
taskkill /F /IM node.exe
# Linux/Mac:
pkill -f node
```

### Environment Variables Not Loading

1. Ensure `.env` file exists in project root
2. Restart the development server after changing `.env`
3. Check that variable names start with `VITE_` for client-side access

### Database Connection Issues

1. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
2. Check Supabase dashboard for service status
3. Verify RLS policies are correctly configured

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📝 License

This project is private and proprietary.

---

Built with ❤️ for the beautiful islands of Seychelles 🌴
