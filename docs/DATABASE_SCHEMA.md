# iCompass Database Schema (MySQL/Prisma)

## Overview

The iCompass database uses MySQL (MariaDB) via Prisma ORM. All tables are created through Prisma migrations.

## Prisma Configuration

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

## Models

### Business

Represents a business entity in the directory.

```prisma
model Business {
  id          Int       @id @default(autoincrement())
  name        String
  description String?
  address     String?
  phone       String?
  email       String?
  logoUrl     String?
  createdAt   DateTime  @default(now())

  products    Product[]

  @@map("businesses")
}
```

**Fields:**
- `id`: Primary key (auto-increment)
- `name`: Business name (required)
- `description`: Optional business description
- `address`: Physical address
- `phone`: Contact phone number
- `email`: Contact email
- `logoUrl`: URL to business logo image
- `createdAt`: Timestamp of creation

**Relations:**
- `products`: One-to-many with Product

### Category

Product/business categories for organization.

```prisma
model Category {
  id        Int       @id @default(autoincrement())
  name      String
  icon      String?   // e.g. "store", "utensils", "wrench", etc.
  createdAt DateTime  @default(now())

  products  Product[]

  @@map("categories")
}
```

**Fields:**
- `id`: Primary key (auto-increment)
- `name`: Category name (required)
- `icon`: Icon identifier (e.g., for lucide-react icons)
- `createdAt`: Timestamp of creation

**Relations:**
- `products`: One-to-many with Product

### Product

Products offered by businesses.

```prisma
model Product {
  id          Int       @id @default(autoincrement())
  business    Business  @relation(fields: [businessId], references: [id])
  businessId  Int
  category    Category? @relation(fields: [categoryId], references: [id])
  categoryId  Int?
  name        String
  description String?
  imageUrl    String?
  createdAt   DateTime  @default(now())

  images      ProductImage[]

  @@map("products")
}
```

**Fields:**
- `id`: Primary key (auto-increment)
- `businessId`: Foreign key to Business (required)
- `categoryId`: Foreign key to Category (optional)
- `name`: Product name (required)
- `description`: Product description
- `imageUrl`: Primary product image URL
- `createdAt`: Timestamp of creation

**Relations:**
- `business`: Many-to-one with Business
- `category`: Many-to-one with Category (optional)
- `images`: One-to-many with ProductImage

### ProductImage

Additional images for products (for future photo search feature).

```prisma
model ProductImage {
  id        Int      @id @default(autoincrement())
  product   Product  @relation(fields: [productId], references: [id])
  productId Int
  url       String
  createdAt DateTime @default(now())

  @@map("product_images")
}
```

**Fields:**
- `id`: Primary key (auto-increment)
- `productId`: Foreign key to Product (required)
- `url`: Image URL (required)
- `createdAt`: Timestamp of creation

**Relations:**
- `product`: Many-to-one with Product

## Database Relationships

```
Business (1) ────< (N) Product
Category (1) ────< (N) Product
Product (1) ────< (N) ProductImage
```

## Seed Data

The seed script (`prisma/seed.ts`) should create:

1. **Categories** (5-7 examples):
   - Groceries
   - Electronics
   - Hardware
   - Restaurants
   - Services
   - Tourism
   - Retail

2. **Businesses** (3-5 examples):
   - Various businesses across different categories
   - With complete contact information

3. **Products** (10-15 examples):
   - Products assigned to businesses and categories
   - Mix of products across different categories

## Indexes

Prisma automatically creates indexes for:
- Primary keys (`id`)
- Foreign keys (`businessId`, `categoryId`, `productId`)

For performance, consider adding indexes on:
- `Business.name` (for search)
- `Product.name` (for search)
- `Category.name` (for sorting)

Add to schema:
```prisma
model Business {
  // ... fields ...
  @@index([name])
}

model Product {
  // ... fields ...
  @@index([name])
}
```

## Migration Commands

```bash
# Create a new migration
npm run prisma:migrate -- --name migration_name

# Apply migrations
npm run prisma:migrate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

## Example Queries

### Get all businesses with products
```typescript
const businesses = await prisma.business.findMany({
  include: {
    products: {
      include: {
        category: true
      }
    }
  }
});
```

### Search products by name
```typescript
const products = await prisma.product.findMany({
  where: {
    name: {
      contains: searchTerm,
      mode: 'insensitive'
    }
  },
  include: {
    business: true,
    category: true
  }
});
```

### Get products by category
```typescript
const products = await prisma.product.findMany({
  where: {
    categoryId: categoryId
  },
  include: {
    business: true,
    category: true
  }
});
```

## Future Enhancements

Potential additions:
- User authentication (users table)
- Reviews/ratings
- Favorites/bookmarks
- Business hours
- Location/geocoding fields
- Search history
- Analytics/statistics

















