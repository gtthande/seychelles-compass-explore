# iCompass – MySQL Rebuild Overview

## Project Vision

Complete rebuild of iCompass from scratch using **MySQL (XAMPP)** instead of Supabase. This is a clean, local-first development environment with a modern tech stack.

## Tech Stack

### Backend (`/server`)
- **Runtime**: Node.js + Express
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: MySQL (MariaDB via XAMPP on `127.0.0.1:3306`)

### Frontend (`/client`)
- **Build Tool**: Vite
- **Framework**: React + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: lucide-react
- **HTTP Client**: axios or fetch

### Package Manager
- Use **npm** consistently (or pnpm if preferred)

## Project Structure

```
/
├── server/                 # Backend application
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                # Database & server config (NOT committed)
│   ├── .env.example        # Template for .env
│   ├── src/
│   │   ├── index.ts        # Entry point
│   │   ├── app.ts          # Express app setup
│   │   ├── routes/         # API route handlers
│   │   │   ├── health.ts
│   │   │   ├── categories.ts
│   │   │   ├── businesses.ts
│   │   │   ├── products.ts
│   │   │   ├── search.ts
│   │   │   └── photo.ts
│   │   └── lib/
│   │       └── prisma.ts   # Prisma client singleton
│   └── prisma/
│       ├── schema.prisma   # Database schema
│       └── seed.ts         # Seed script
│
└── client/                 # Frontend application
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.cjs
    ├── postcss.config.cjs
    ├── index.html
    ├── src/
    │   ├── main.tsx        # React entry point
    │   ├── App.tsx         # Root component with routing
    │   ├── index.css       # Global styles + Tailwind
    │   ├── pages/          # Route pages
    │   │   ├── Home.tsx
    │   │   ├── SearchResults.tsx
    │   │   ├── CategoryPage.tsx
    │   │   ├── BusinessPage.tsx
    │   │   └── ProductPage.tsx
    │   ├── components/     # Reusable components
    │   │   ├── layout/
    │   │   │   ├── Header.tsx
    │   │   │   └── Footer.tsx
    │   │   ├── search/
    │   │   │   └── SearchBar.tsx
    │   │   ├── cards/
    │   │   │   ├── BusinessCard.tsx
    │   │   │   └── ProductCard.tsx
    │   │   ├── categories/
    │   │   │   └── CategoryGrid.tsx
    │   │   └── hero/
    │   │       └── HomeHero.tsx
    │   └── lib/
    │       └── api.ts      # API client functions
    └── public/             # Static assets
```

## Key Principles

1. **No Supabase**: Zero references to Supabase, PostgreSQL, RLS, or edge functions
2. **Local Development**: XAMPP MySQL on localhost
3. **Clean Architecture**: Separation of concerns (server/client)
4. **Type Safety**: Full TypeScript coverage
5. **Modern UI**: Maintain the previous iCompass look & feel with Tailwind

## Database Connection

- **Host**: `127.0.0.1`
- **Port**: `3306`
- **Default User**: `root` (no password by default in XAMPP)
- **Database Name**: `icompass`

Connection string format:
```
DATABASE_URL="mysql://root:@127.0.0.1:3306/icompass"
```

## Development Workflow

1. **Start XAMPP**: Ensure MySQL is running
2. **Backend**: `cd server && npm run dev` (runs on port 5055)
3. **Frontend**: `cd client && npm run dev` (runs on port 5173)
4. **Database**: Use Prisma migrations and seed scripts

## Next Steps

See the following documentation:
- `SETUP_GUIDE.md` - Step-by-step setup instructions
- `DATABASE_SCHEMA.md` - Complete database schema documentation
- `API_DOCUMENTATION.md` - API endpoints reference
- `DEVELOPMENT_GUIDE.md` - Development workflow and best practices








