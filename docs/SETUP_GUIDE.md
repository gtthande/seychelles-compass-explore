# iCompass MySQL Setup Guide

## Prerequisites

1. **XAMPP** installed and running
   - Download from: https://www.apachefriends.org/
   - Ensure MySQL service is running in XAMPP Control Panel

2. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/

3. **Code Editor** (VS Code or Cursor recommended)

## Step 1: Clean Repository

Before starting, ensure the repository is clean:

```bash
# Remove old Supabase-related code (if any exists)
# Keep only: .git, .gitignore, README.md, editor configs
```

## Step 2: Create Database

1. Open **phpMyAdmin** (usually at `http://localhost/phpmyadmin`)
2. Create a new database named `icompass`
3. Leave it empty (Prisma will create tables via migrations)

## Step 3: Backend Setup

### 3.1 Create Server Directory

```bash
mkdir server
cd server
```

### 3.2 Initialize Node Project

```bash
npm init -y
```

### 3.3 Install Dependencies

```bash
npm install express cors dotenv
npm install -D typescript @types/node @types/express @types/cors ts-node-dev
npm install -D prisma
npm install @prisma/client
```

### 3.4 Initialize TypeScript

```bash
npx tsc --init
```

Update `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 3.5 Initialize Prisma

```bash
npx prisma init
```

This creates:
- `prisma/schema.prisma`
- `.env` file

### 3.6 Configure Environment

Create `.env`:
```env
DATABASE_URL="mysql://root:@127.0.0.1:3306/icompass"
PORT=5055
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

Create `.env.example`:
```env
DATABASE_URL="mysql://root:@127.0.0.1:3306/icompass"
PORT=5055
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### 3.7 Add npm Scripts

Update `package.json`:
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "seed": "ts-node prisma/seed.ts"
  }
}
```

### 3.8 Create Database Schema

Edit `prisma/schema.prisma` (see `DATABASE_SCHEMA.md` for full schema).

### 3.9 Generate Prisma Client & Run Migrations

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init_icompass
```

### 3.10 Seed Database

```bash
npm run seed
```

### 3.11 Test Backend

```bash
npm run dev
```

Visit `http://localhost:5055/api/health` - should return `{ status: "ok" }`

## Step 4: Frontend Setup

### 4.1 Create Client Directory

```bash
cd ..
mkdir client
cd client
```

### 4.2 Initialize Vite Project

```bash
npm create vite@latest . -- --template react-ts
```

### 4.3 Install Dependencies

```bash
npm install
npm install axios react-router-dom
npm install lucide-react
npm install -D tailwindcss postcss autoprefixer
```

### 4.4 Initialize Tailwind

```bash
npx tailwindcss init -p
```

### 4.5 Configure Tailwind

Update `tailwind.config.cjs`:
```js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 4.6 Add Tailwind to CSS

Update `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4.7 Create API Client

Create `src/lib/api.ts` with base URL:
```typescript
const API_BASE_URL = 'http://localhost:5055/api';
```

### 4.8 Test Frontend

```bash
npm run dev
```

Visit `http://localhost:5173` - should see the app

## Step 5: Verify Setup

### Backend Health Check
```bash
curl http://localhost:5055/api/health
# Expected: {"status":"ok"}
```

### Database Connection
```bash
cd server
npx prisma studio
# Should open Prisma Studio showing your tables
```

### Frontend Connection
1. Open browser DevTools
2. Check Network tab
3. Navigate to home page
4. Verify API calls to `http://localhost:5055/api/*` succeed

## Troubleshooting

### MySQL Connection Issues
- Verify XAMPP MySQL is running
- Check `DATABASE_URL` in `.env` matches your XAMPP setup
- Default XAMPP MySQL user is `root` with no password

### Port Conflicts
- Backend default: `5055`
- Frontend default: `5173`
- Change ports in `.env` (backend) or `vite.config.ts` (frontend) if needed

### Prisma Issues
- Run `npm run prisma:generate` after schema changes
- Run `npm run prisma:migrate` to apply migrations
- Use `npx prisma studio` to inspect database

### CORS Errors
- Ensure `CORS_ORIGIN` in backend `.env` matches frontend URL
- Default: `http://localhost:5173`

## Next Steps

- See `DATABASE_SCHEMA.md` for database structure
- See `API_DOCUMENTATION.md` for API endpoints
- See `DEVELOPMENT_GUIDE.md` for development workflow

















