# iCompass Development Guide

## Development Workflow

### Starting Development

1. **Start XAMPP MySQL**
   - Open XAMPP Control Panel
   - Start MySQL service

2. **Start Backend**
   ```bash
   cd server
   npm run dev
   ```
   - Server runs on `http://localhost:5055`
   - Auto-reloads on file changes

3. **Start Frontend**
   ```bash
   cd client
   npm run dev
   ```
   - App runs on `http://localhost:5173`
   - Hot module replacement enabled

### Making Changes

#### Backend Changes

1. **Add a new route:**
   - Create file in `server/src/routes/`
   - Import and mount in `server/src/app.ts`
   - Test with curl or Postman

2. **Modify database schema:**
   ```bash
   cd server
   # Edit prisma/schema.prisma
   npm run prisma:generate
   npm run prisma:migrate -- --name your_migration_name
   ```

3. **Update seed data:**
   - Edit `server/prisma/seed.ts`
   - Run: `npm run seed`

#### Frontend Changes

1. **Add a new page:**
   - Create component in `client/src/pages/`
   - Add route in `client/src/App.tsx`
   - Create link in navigation

2. **Add a new component:**
   - Create file in `client/src/components/`
   - Import and use in pages

3. **Update API calls:**
   - Modify `client/src/lib/api.ts`
   - Update components using the API

## Code Style

### TypeScript

- Use strict TypeScript settings
- Define types/interfaces for all data structures
- Avoid `any` type
- Use async/await for async operations

### React

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use TypeScript for props

### Naming Conventions

- **Files**: PascalCase for components (`BusinessCard.tsx`), camelCase for utilities (`api.ts`)
- **Components**: PascalCase (`BusinessCard`)
- **Functions**: camelCase (`getBusinesses`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`Business`, `ProductData`)

## Project Structure Guidelines

### Backend (`/server`)

```
server/
├── src/
│   ├── index.ts          # Entry point, starts server
│   ├── app.ts            # Express app configuration
│   ├── routes/           # Route handlers (one file per resource)
│   └── lib/              # Utilities (prisma client, helpers)
└── prisma/
    ├── schema.prisma     # Database schema
    └── seed.ts           # Seed script
```

**Route Organization:**
- One route file per resource (categories, businesses, products)
- Each route file exports a router
- Mount routers in `app.ts`

### Frontend (`/client`)

```
client/
├── src/
│   ├── pages/            # Route pages (one per route)
│   ├── components/       # Reusable components
│   │   ├── layout/       # Layout components (Header, Footer)
│   │   ├── cards/        # Card components
│   │   ├── search/       # Search-related components
│   │   └── categories/   # Category-related components
│   └── lib/              # Utilities (API client, helpers)
```

**Component Organization:**
- Group related components in subdirectories
- Keep components focused (single responsibility)
- Extract shared logic into hooks or utilities

## Database Management

### Creating Migrations

```bash
cd server
# 1. Edit prisma/schema.prisma
# 2. Generate migration
npm run prisma:migrate -- --name descriptive_name
# 3. Migration is applied automatically
```

### Viewing Database

```bash
cd server
npx prisma studio
# Opens browser at http://localhost:5555
```

### Resetting Database

```bash
cd server
npx prisma migrate reset
# WARNING: Deletes all data and reapplies migrations
```

### Seeding Data

```bash
cd server
npm run seed
```

## Testing

### Manual Testing Checklist

- [ ] Backend health endpoint responds
- [ ] Categories load on homepage
- [ ] Businesses display correctly
- [ ] Products show with business/category info
- [ ] Search returns relevant results
- [ ] Category filtering works
- [ ] Business filtering works
- [ ] Navigation between pages works
- [ ] Responsive design on mobile/tablet/desktop

### API Testing

Use curl or Postman:

```bash
# Health check
curl http://localhost:5055/api/health

# Get categories
curl http://localhost:5055/api/categories

# Search
curl "http://localhost:5055/api/search?q=coconut"

# Get products by category
curl "http://localhost:5055/api/products?categoryId=1"
```

## Common Tasks

### Add a New Category

1. **Via Prisma Studio:**
   ```bash
   cd server
   npx prisma studio
   # Navigate to Categories table, click "Add record"
   ```

2. **Via Seed Script:**
   - Edit `server/prisma/seed.ts`
   - Add category to seed data
   - Run `npm run seed` (resets and reseeds)

3. **Via API (future):**
   - Create POST endpoint in `server/src/routes/categories.ts`
   - Add form in frontend

### Add a New Business

Same as categories - use Prisma Studio or seed script initially.

### Add a New Product

1. Ensure business and category exist
2. Use Prisma Studio or seed script
3. Link product to business and optional category

## Debugging

### Backend Issues

1. **Check server logs:**
   - Look at terminal running `npm run dev`
   - Check for TypeScript errors
   - Check for Prisma errors

2. **Database connection:**
   ```bash
   cd server
   npx prisma studio
   # If this fails, check DATABASE_URL in .env
   ```

3. **Type errors:**
   ```bash
   cd server
   npm run build
   # Fix any TypeScript errors shown
   ```

### Frontend Issues

1. **Check browser console:**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed API calls

2. **API connection:**
   - Verify backend is running on port 5055
   - Check CORS settings in backend
   - Verify API_BASE_URL in `client/src/lib/api.ts`

3. **Type errors:**
   ```bash
   cd client
   npm run build
   # Fix any TypeScript errors shown
   ```

## Performance Tips

1. **Database Queries:**
   - Use Prisma `include` to fetch related data in one query
   - Add indexes for frequently searched fields
   - Limit results with `take` and `skip` for pagination

2. **Frontend:**
   - Lazy load images
   - Use React.memo for expensive components
   - Implement pagination for large lists

3. **API:**
   - Add caching headers for static data
   - Implement pagination for large result sets
   - Consider rate limiting for production

## Git Workflow

### Before Committing

1. **Backend:**
   ```bash
   cd server
   npm run build  # Check for TypeScript errors
   ```

2. **Frontend:**
   ```bash
   cd client
   npm run build  # Check for build errors
   ```

3. **Database:**
   - Ensure migrations are up to date
   - Don't commit `.env` files
   - Commit migration files in `prisma/migrations/`

### Commit Messages

Use clear, descriptive messages:
- `feat: add product search endpoint`
- `fix: correct category filtering logic`
- `style: update homepage hero design`
- `docs: update API documentation`

## Environment Variables

### Backend (`.env`)

```env
DATABASE_URL="mysql://root:@127.0.0.1:3306/icompass"
PORT=5055
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**Never commit `.env`** - only commit `.env.example`

### Frontend

No environment variables needed initially. API URL is hardcoded in `src/lib/api.ts`.

For production, consider:
- `VITE_API_URL` environment variable
- Update `vite.config.ts` to use it

## Next Steps

- Add authentication (JWT tokens)
- Add admin panel
- Add image upload functionality
- Implement photo search
- Add pagination
- Add caching
- Add error logging
- Add unit tests








