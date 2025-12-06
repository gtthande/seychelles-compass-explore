# Original Project State (Before MySQL Rebuild)

## Overview

The original project was a **Supabase-based** React application with a monolithic structure (no separate client/server directories).

## Project Structure (Before Cleanup)

```
/
├── src/                    # React frontend (Vite)
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── admin/         # Admin panel components
│   │   ├── business/      # Business portal components
│   │   └── [various].tsx   # Feature components
│   ├── pages/             # Route pages
│   │   ├── AdminPanel.tsx
│   │   ├── BusinessDetail.tsx
│   │   ├── Directory.tsx
│   │   ├── Index.tsx
│   │   └── [various].tsx
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities & Supabase client
│   └── integrations/     # Supabase integration
│       └── supabase/
├── supabase/              # Supabase backend
│   ├── functions/         # Edge functions
│   └── migrations/        # Database migrations
├── admin/                # Admin scripts (TypeScript)
├── scripts/              # Utility scripts
├── public/               # Static assets
├── package.json          # Root-level dependencies
├── vite.config.ts        # Vite configuration
└── [various config files]
```

## Tech Stack (Original)

### Frontend
- **Vite** + **React** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **React Router** for routing
- **Supabase JS Client** for backend

### Backend
- **Supabase** (PostgreSQL database)
- **Supabase Edge Functions** (Deno runtime)
- **Supabase Auth** for authentication
- **Row Level Security (RLS)** policies

### Key Features
- Business directory with search
- Product catalog system
- Admin panel with business management
- Business owner portal
- Google Maps integration
- Image upload system
- Payment processing (Stripe)
- Authentication system

## Key Files (Before)

### Root Level
- `package.json` - Single package.json for entire project
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration
- `.env` - Environment variables (Supabase keys)

### Source Code
- `src/App.tsx` - Main React app
- `src/main.tsx` - Entry point
- `src/integrations/supabase/client.ts` - Supabase client
- `src/lib/supabase.ts` - Supabase utilities

### Supabase
- `supabase/config.toml` - Supabase configuration
- `supabase/functions/` - Edge functions (AI search, geocoding, etc.)
- `supabase/migrations/` - Database migrations (PostgreSQL)

## What Went Wrong

1. **Mixed Structure**: Frontend and backend code were mixed in the same directory
2. **Supabase Dependency**: Entire project depended on Supabase cloud service
3. **No Local Backend**: No Express/Node.js server - everything went through Supabase
4. **Complex Setup**: Required Supabase CLI, cloud account, and complex RLS policies
5. **Migration Issues**: When trying to rebuild, old files conflicted with new structure

## Current State (After Cleanup)

- ✅ Clean root directory
- ✅ Only `docs/` and `README.md` remain
- ✅ Ready for fresh MySQL rebuild with separate `client/` and `server/` directories

## Next Steps

1. Create `client/` directory with Vite React TS
2. Create `server/` directory with Express + Prisma + MySQL
3. Build clean, local-first architecture
4. No Supabase dependencies


