# iCompass Seychelles - Architecture Documentation

## System Overview

The iCompass Seychelles platform is built as a modern web application using React, TypeScript, and Supabase. The architecture follows a client-server pattern with real-time capabilities and AI-powered features.

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Side"
        A[React App] --> B[TanStack Query]
        A --> C[React Router]
        A --> D[shadcn/ui Components]
        A --> E[Custom Hooks]
    end
    
    subgraph "Backend Services"
        F[Supabase Auth] --> G[PostgreSQL Database]
        H[Supabase Storage] --> I[File Buckets]
        J[Edge Functions] --> K[AI Services]
        J --> L[Email Services]
        J --> M[Geocoding API]
    end
    
    subgraph "External APIs"
        N[Google Maps API]
        O[OpenAI API]
        P[Resend API]
    end
    
    A --> F
    A --> H
    A --> J
    A --> N
    J --> O
    J --> P
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Supabase
    participant DB as PostgreSQL
    participant ST as Storage
    participant AI as OpenAI
    participant GM as Google Maps
    
    Note over C,GM: User Authentication Flow
    C->>S: Login Request
    S->>DB: Validate Credentials
    DB-->>S: User Data
    S-->>C: Auth Token
    
    Note over C,GM: Business Registration Flow
    C->>S: Submit Registration
    S->>DB: Store Appointment
    S->>ST: Upload Documents
    S->>AI: Send Email Notification
    
    Note over C,GM: AI Search Flow
    C->>S: Search Query
    S->>AI: Process Query
    AI-->>S: Search Analysis
    S->>DB: Execute Search
    DB-->>S: Results
    S-->>C: Formatted Results
    
    Note over C,GM: Map Integration Flow
    C->>S: Business Location Request
    S->>GM: Geocode Address
    GM-->>S: Coordinates
    S-->>C: Map Data
```

## Component Architecture

```mermaid
graph TD
    A[App.tsx] --> B[Router]
    B --> C[Public Routes]
    B --> D[Protected Routes]
    B --> E[Admin Routes]
    
    C --> F[Index Page]
    C --> G[Directory Page]
    C --> H[Products Page]
    
    D --> I[Dashboard]
    D --> J[Business Portal]
    D --> K[Onboarding]
    
    E --> L[Admin Panel]
    
    F --> M[Hero Component]
    F --> N[Category Grid]
    F --> O[Featured Listings]
    
    G --> P[Search Filter]
    G --> Q[Business Cards]
    G --> R[Google Map]
    
    J --> S[Business Dashboard]
    J --> T[Product Manager]
    J --> U[Registration Form]
```

## Database Architecture

```mermaid
erDiagram
    PROFILES ||--o{ BUSINESSES : owns
    PROFILES ||--o{ REVIEWS : writes
    PROFILES ||--o{ BOOKINGS : makes
    
    BUSINESSES ||--o{ PRODUCTS : offers
    BUSINESSES ||--o{ REVIEWS : receives
    BUSINESSES ||--o{ BOOKINGS : provides
    
    CATEGORIES ||--o{ BUSINESSES : categorizes
    CATEGORIES ||--o{ PRODUCTS : categorizes
    
    APPOINTMENTS ||--|| PROFILES : requests
    
    PROFILES {
        uuid id PK
        uuid user_id FK
        text full_name
        text phone
        text business_name
        boolean is_admin
        boolean is_business_owner
    }
    
    BUSINESSES {
        uuid id PK
        uuid owner_id FK
        text name
        text category
        text status
        text description
        text address
        text island
        numeric latitude
        numeric longitude
    }
    
    PRODUCTS {
        uuid id PK
        uuid business_id FK
        text name
        text category
        numeric price
        text currency
        boolean in_stock
    }
    
    REVIEWS {
        uuid id PK
        uuid business_id FK
        uuid user_id FK
        integer rating
        text comment
    }
    
    BOOKINGS {
        uuid id PK
        uuid business_id FK
        uuid user_id FK
        text service_type
        date check_in_date
        date check_out_date
    }
    
    APPOINTMENTS {
        uuid id PK
        text business_name
        text contact_person
        text phone
        text email
        text status
    }
    
    CATEGORIES {
        uuid id PK
        text name
        text slug
        text description
        boolean is_active
    }
```

## Security Architecture

```mermaid
graph TB
    subgraph "Authentication Layer"
        A[Supabase Auth] --> B[JWT Tokens]
        B --> C[Session Management]
    end
    
    subgraph "Authorization Layer"
        D[RLS Policies] --> E[Row-Level Security]
        F[Role-Based Access] --> G[Admin/Business Owner/User]
    end
    
    subgraph "Data Protection"
        H[Encrypted Storage] --> I[File Uploads]
        J[Input Validation] --> K[Zod Schemas]
        L[API Security] --> M[CORS & Headers]
    end
    
    C --> D
    E --> F
    G --> H
    I --> J
    K --> L
```

## Real-time Architecture

```mermaid
graph LR
    A[Client] --> B[Supabase Client]
    B --> C[WebSocket Connection]
    C --> D[PostgreSQL]
    D --> E[Real-time Engine]
    E --> F[Channel Subscriptions]
    F --> G[Live Updates]
    G --> A
    
    subgraph "Subscribed Tables"
        H[businesses]
        I[products]
        J[profiles]
        K[reviews]
    end
    
    E --> H
    E --> I
    E --> J
    E --> K
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Frontend Deployment"
        A[Vite Build] --> B[Static Files]
        B --> C[CDN Distribution]
    end
    
    subgraph "Backend Services"
        D[Supabase Cloud] --> E[PostgreSQL]
        D --> F[Edge Functions]
        D --> G[Storage Buckets]
        D --> H[Auth Service]
    end
    
    subgraph "External Services"
        I[Google Maps API]
        J[OpenAI API]
        K[Resend API]
    end
    
    C --> D
    F --> I
    F --> J
    F --> K
```

## Performance Considerations

### Frontend Optimization
- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: Lazy loading and responsive images
- **Caching**: React Query for API response caching
- **Bundle Size**: Tree shaking and dead code elimination

### Backend Optimization
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Supabase managed connection pooling
- **Edge Functions**: Serverless functions for scalability
- **CDN**: Global content delivery for static assets

### Real-time Optimization
- **Selective Subscriptions**: Only subscribe to necessary data
- **Debounced Updates**: Prevent excessive re-renders
- **Connection Management**: Automatic reconnection handling
- **Bandwidth Optimization**: Minimal data transfer
