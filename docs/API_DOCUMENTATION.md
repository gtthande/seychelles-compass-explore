# iCompass API Documentation

## Base URL

```
http://localhost:5055/api
```

## Endpoints

### Health Check

**GET** `/health`

Check if the API server is running.

**Response:**
```json
{
  "status": "ok"
}
```

**Status Codes:**
- `200 OK` - Server is running

---

### Categories

**GET** `/categories`

Get all categories, ordered by name.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Groceries",
    "icon": "store",
    "createdAt": "2025-01-20T10:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Restaurants",
    "icon": "utensils",
    "createdAt": "2025-01-20T10:00:00.000Z"
  }
]
```

**Status Codes:**
- `200 OK` - Success

---

### Businesses

**GET** `/businesses`

Get all businesses, optionally filtered by category.

**Query Parameters:**
- `categoryId` (optional, number) - Filter businesses that have products in this category

**Example:**
```
GET /api/businesses?categoryId=2
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Island Grocery Store",
    "description": "Fresh produce and local goods",
    "address": "Victoria, Mahé",
    "phone": "+248 4 123 456",
    "email": "info@islandgrocery.sc",
    "logoUrl": "https://example.com/logo.jpg",
    "createdAt": "2025-01-20T10:00:00.000Z"
  }
]
```

**Status Codes:**
- `200 OK` - Success

**Notes:**
- If `categoryId` is provided, only businesses with products in that category are returned
- Returns businesses with their basic information (products are not included in this endpoint)

---

### Products

**GET** `/products`

Get all products, optionally filtered by category and/or business.

**Query Parameters:**
- `categoryId` (optional, number) - Filter by category
- `businessId` (optional, number) - Filter by business

**Examples:**
```
GET /api/products
GET /api/products?categoryId=2
GET /api/products?businessId=1
GET /api/products?categoryId=2&businessId=1
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Fresh Coconut",
    "description": "Locally sourced coconuts",
    "imageUrl": "https://example.com/coconut.jpg",
    "businessId": 1,
    "categoryId": 1,
    "createdAt": "2025-01-20T10:00:00.000Z",
    "business": {
      "id": 1,
      "name": "Island Grocery Store",
      "address": "Victoria, Mahé",
      "phone": "+248 4 123 456"
    },
    "category": {
      "id": 1,
      "name": "Groceries",
      "icon": "store"
    }
  }
]
```

**Status Codes:**
- `200 OK` - Success

**Notes:**
- Products include related `business` and `category` objects
- Filters can be combined (AND logic)

---

### Search

**GET** `/search`

Search products by name, description, or business name.

**Query Parameters:**
- `q` (required, string) - Search query term

**Example:**
```
GET /api/search?q=coconut
```

**Response:**
```json
{
  "query": "coconut",
  "results": [
    {
      "id": 1,
      "name": "Fresh Coconut",
      "description": "Locally sourced coconuts",
      "imageUrl": "https://example.com/coconut.jpg",
      "businessId": 1,
      "categoryId": 1,
      "createdAt": "2025-01-20T10:00:00.000Z",
      "business": {
        "id": 1,
        "name": "Island Grocery Store",
        "address": "Victoria, Mahé"
      },
      "category": {
        "id": 1,
        "name": "Groceries",
        "icon": "store"
      }
    }
  ],
  "count": 1
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Missing `q` parameter

**Search Logic:**
- Case-insensitive search
- Searches in:
  - Product name
  - Product description
  - Business name
- Returns products with related `business` and `category` objects

---

### Photo Search (Stub)

**POST** `/photo`

Placeholder endpoint for future image-based product search.

**Request Body:**
```json
{
  "placeholder": true
}
```

**Or multipart/form-data:**
```
image: [binary file]
```

**Response:**
```json
{
  "message": "Photo search not implemented yet."
}
```

**Status Codes:**
- `501 Not Implemented` - Feature not yet available

**Future Implementation:**
- Accept image upload (multipart/form-data or base64)
- Process image with ML/AI service
- Match against product images in database
- Return matching products

---

## Error Responses

All endpoints may return error responses in this format:

```json
{
  "error": "Error message here",
  "statusCode": 500
}
```

**Common Status Codes:**
- `400 Bad Request` - Invalid request parameters
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error
- `501 Not Implemented` - Feature not available

## CORS

The API allows requests from:
- `http://localhost:5173` (default frontend dev server)

Configured via `CORS_ORIGIN` environment variable in backend `.env`.

## Rate Limiting

Not implemented in initial version. Consider adding for production.

## Authentication

Not implemented in initial version. Consider adding for:
- Admin endpoints
- Business owner endpoints
- User favorites/bookmarks

## Example Usage

### Fetch all categories
```typescript
const response = await fetch('http://localhost:5055/api/categories');
const categories = await response.json();
```

### Search products
```typescript
const query = 'coconut';
const response = await fetch(`http://localhost:5055/api/search?q=${encodeURIComponent(query)}`);
const { results } = await response.json();
```

### Get products by category
```typescript
const categoryId = 2;
const response = await fetch(`http://localhost:5055/api/products?categoryId=${categoryId}`);
const products = await response.json();
```


