# iCompass Quick Reference

## 🚀 Quick Commands

### Start Everything
```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend  
cd client && npm run dev
```

### Database Commands
```bash
cd server

# View database
npx prisma studio

# Create migration
npm run prisma:migrate -- --name migration_name

# Reset & reseed
npx prisma migrate reset && npm run seed
```

## 📍 URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5055/api
- **Prisma Studio**: http://localhost:5555 (when running)

## 🔗 API Endpoints

```
GET  /api/health
GET  /api/categories
GET  /api/businesses?categoryId=1
GET  /api/products?categoryId=1&businessId=2
GET  /api/search?q=term
POST /api/photo (stub - returns 501)
```

## 📁 Key Files

### Backend
- `server/src/app.ts` - Express app setup
- `server/src/routes/*.ts` - API routes
- `server/prisma/schema.prisma` - Database schema
- `server/prisma/seed.ts` - Seed data

### Frontend
- `client/src/App.tsx` - Routes & layout
- `client/src/pages/*.tsx` - Page components
- `client/src/lib/api.ts` - API client
- `client/src/index.css` - Global styles

## 🗄️ Database Models

- `Business` - Business entities
- `Category` - Product categories
- `Product` - Products (linked to Business & Category)
- `ProductImage` - Additional product images

## 🎨 UI Components

- `HomeHero` - Hero section with search
- `CategoryGrid` - Category cards
- `BusinessCard` - Business display card
- `ProductCard` - Product display card
- `SearchBar` - Search input component

## 🔧 Common Tasks

### Add New Category
```bash
cd server
npx prisma studio
# Add record in Categories table
```

### Add New Business
```bash
cd server
npx prisma studio
# Add record in Businesses table
```

### Test Search
```bash
curl "http://localhost:5055/api/search?q=coconut"
```

### Check Health
```bash
curl http://localhost:5055/api/health
```

## 🐛 Troubleshooting

### MySQL Not Connecting
- Check XAMPP MySQL is running
- Verify `DATABASE_URL` in `server/.env`
- Default: `mysql://root:@127.0.0.1:3306/icompass`

### Port Conflicts
- Backend: Change `PORT` in `server/.env`
- Frontend: Change port in `client/vite.config.ts`

### CORS Errors
- Check `CORS_ORIGIN` in `server/.env` matches frontend URL
- Default: `http://localhost:5173`

### Prisma Issues
```bash
cd server
npm run prisma:generate
npm run prisma:migrate
```

## 📚 Full Documentation

- [Setup Guide](SETUP_GUIDE.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Database Schema](DATABASE_SCHEMA.md)
- [Development Guide](DEVELOPMENT_GUIDE.md)





