# Architecture

**Analysis Date:** 2025-01-19

## Pattern Overview

**Overall:** Next.js App Router with Server-Side Rendering (SSR) and API Routes

**Key Characteristics:**
- React Server Components with client-side hydration
- API routes for data fetching and external service integration
- PostgreSQL (Neon) with pgvector for embeddings-based recommendations
- Clerk for authentication and theme management
- Tailwind CSS + Radix UI for styling

## Layers

**API Layer (Next.js API Routes):**
- Purpose: Handles HTTP requests, external service integration, and database operations
- Location: `frontend/app/api/`
- Contains: Route handlers for anime data, recommendations, search, reviews
- Depends on: Service layer, database layer
- Used by: Frontend components via fetch/axios

**Service Layer:**
- Purpose: Business logic, data transformation, caching
- Location: `frontend/services/`
- Contains: Anime service, cache service, AniList service, Jikan service
- Depends on: Database layer, external APIs
- Used by: API routes and components

**Components Layer:**
- Purpose: UI components and state management
- Location: `frontend/components/`
- Contains: React components, UI components (Radix + custom), hooks
- Depends on: Service layer (via API calls), hooks
- Used by: Pages and other components

**Database Layer:**
- Purpose: Data persistence and vector similarity search
- Location: `frontend/lib/postgres.ts`
- Contains: PostgreSQL connection wrapper, SQL query execution
- Depends on: Neon/Vercel Postgres
- Used by: Service layer

## Data Flow

**Recommendation Flow:**

1. User selects anime → Stored in localStorage
2. Frontend sends anime IDs to `/api/anime/recommendation`
3. API route calls `getRecommendations()` from animeService
4. Service queries PostgreSQL with pgvector for similarity search
5. Weighted embeddings calculation returns similar anime
6. Results formatted and returned to frontend

**Search Flow:**

1. User enters search query → Debounced input
2. Frontend calls `/api/anime/search`
3. API route uses PostgreSQL full-text search with ranking
4. Results include relevance scoring and matching
5. Formatted anime data returned

**State Management:**
- localStorage for user anime selections
- React hooks for component state
- Server-side data fetching with caching

## Key Abstractions

**Anime Interface:**
- Purpose: Standardized anime data structure
- Examples: `frontend/services/animeService.ts` (lines 6-37)
- Pattern: TypeScript interface with optional fields for flexibility

**Vector Embeddings:**
- Purpose: AI-powered similarity matching
- Examples: `frontend/services/animeService.ts` (lines 318-391)
- Pattern: pgvector cosine similarity with weighted dimensions

**Caching Strategy:**
- Purpose: Performance optimization
- Examples: `frontend/services/animeCacheService.ts`
- Pattern: React cache + Redis-ready implementation

## Entry Points

**Main Application:**
- Location: `frontend/app/layout.tsx`
- Triggers: Next.js root layout
- Responsibilities: Theme provider, Clerk auth, navbar

**Home Page:**
- Location: `frontend/app/page.tsx`
- Triggers: Route "/"
- Responsibilities: Anime sections, user selections, recommendations

**API Routes:**
- Location: `frontend/app/api/anime/route.ts`
- Triggers: HTTP requests
- Responsibilities: CRUD operations for anime data

## Error Handling

**Strategy:** Try-catch blocks with NextResponse error formatting

**Patterns:**
- API routes return `{ message: string }` with appropriate status codes
- Console.error for server-side logging
- Graceful fallbacks for missing data

## Cross-Cutting Concerns

**Logging:** Console.error for server errors, ConsoleFilter component for client
**Validation:** Zod schemas for form validation, manual validation in API routes
**Authentication:** Clerk integration with middleware protection

---

*Architecture analysis: 2025-01-19*