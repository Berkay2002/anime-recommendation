# Phase 5: API Optimization - Research

**Researched:** 2026-01-19
**Domain:** API optimization with React Query, database query optimization, caching strategies
**Confidence:** HIGH

## Summary

Phase 5 focuses on optimizing API calls and database queries for better performance. The research identified **TanStack Query v5** as the standard library for client-side data fetching with built-in caching, parallelization, and React Suspense support. The existing codebase shows sequential API calls in components that can be parallelized, and database queries that can benefit from indexing on frequently filtered columns.

**Primary recommendation:** Adopt TanStack Query v5 (`@tanstack/react-query`) with React Suspense for data fetching, parallelize independent API calls using `useQueries`, and add PostgreSQL indexes on filtered columns (genre, year, rating, popularity) to achieve target performance metrics.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tanstack/react-query` | ^5.x | Data fetching with caching, parallelization, and Suspense support | Industry standard for client-side data fetching in 2025, built-in deduplication, background refetching, cache management |
| `@tanstack/react-query-devtools` | ^5.x | Debugging and monitoring query state | Essential for development, visualizes query cache, stale data, loading states |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tanstack/react-query-next-experimental` | latest | Server-side React Query streaming with Next.js 15 | For streaming Suspense on server (experimental) |

### Database Layer
| Tool | Purpose | Why Standard |
|------|---------|--------------|
| PostgreSQL `EXPLAIN ANALYZE` | Query performance analysis | Built-in PostgreSQL tool for identifying bottlenecks |
| pgvector indexes (HNSW/IVFFlat) | Vector similarity search optimization | Already in use, can be tuned for better performance |

### Installation
```bash
cd frontend
npm install @tanstack/react-query @tanstack/react-query-devtools
```

**For server-side streaming (experimental):**
```bash
npm install @tanstack/react-query-next-experimental
```

## Architecture Patterns

### Recommended Project Structure
```
frontend/
├── app/
│   └── api/              # API routes (existing)
├── components/
│   └── providers/        # NEW: QueryClient provider setup
├── lib/
│   ├── queries/          # NEW: Query functions (separation of concerns)
│   └── query-client.ts   # NEW: Query client configuration
├── hooks/                # Custom hooks (existing)
└── services/             # Business logic (existing)
```

### Pattern 1: Query Client Provider Setup
**What:** Wrap application with QueryClientProvider for React Query access
**When to use:** Application root layout
**Example:**
```typescript
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute default
            gcTime: 5 * 60 * 1000, // 5 minutes cache retention
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

// Source: https://tanstack.com/query/latest/docs/react/installation
```

### Pattern 2: Query Functions Separation
**What:** Separate query logic from components for reusability and testability
**When to use:** All data fetching operations
**Example:**
```typescript
// lib/queries/anime.ts
import { useQuery, useQueries } from '@tanstack/react-query'

// Query key factory (Type-safe query keys)
export const animeKeys = {
  all: ['anime'] as const,
  lists: () => [...animeKeys.all, 'list'] as const,
  list: (filters: { sortBy?: string; genres?: string[]; page?: number }) =>
    [...animeKeys.lists(), filters] as const,
  details: () => [...animeKeys.all, 'detail'] as const,
  detail: (id: number) => [...animeKeys.details(), id] as const,
  recommendations: (id: number) => ['anime', id, 'recommendations'] as const,
  reviews: (id: number) => ['anime', id, 'reviews'] as const,
}

// Fetcher function
async function fetchAnime(params: {
  sortBy?: string
  genres?: string[]
  page?: number
  limit?: number
}) {
  const queryParams = new URLSearchParams()
  if (params.sortBy) queryParams.set('sortBy', params.sortBy)
  if (params.genres?.length) queryParams.set('genres', params.genres.join(','))
  if (params.page) queryParams.set('page', params.page.toString())
  if (params.limit) queryParams.set('limit', params.limit.toString())

  const response = await fetch(`/api/anime?${queryParams.toString()}`)
  if (!response.ok) throw new Error('Failed to fetch anime')
  return response.json()
}

// Query hook
export function useAnime(params: {
  sortBy?: string
  genres?: string[]
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: animeKeys.list(params),
    queryFn: () => fetchAnime(params),
    staleTime: 2 * 60 * 1000, // 2 minutes for browse results
  })
}

// Source: Pattern adapted from TanStack Query docs
```

### Pattern 3: Parallel Queries with useQueries
**What:** Execute multiple independent queries in parallel
**When to use:** Multiple independent data fetches in same component
**Example:**
```typescript
// app/anime/[id]/page.tsx (optimized version)
import { useQueries } from '@tanstack/react-query'
import { animeKeys } from '@/lib/queries/anime'

export default function AnimeDetailPage() {
  const { id } = useParams()
  const numericId = Number(id)

  // PARALLEL: Fetch recommendations and reviews simultaneously
  const [recommendationsQuery, reviewsQuery, detailsQuery] = useQueries({
    queries: [
      {
        queryKey: animeKeys.recommendations(numericId),
        queryFn: () => fetch(`/api/anime/recommendation/${numericId}`).then(r => r.json()),
        enabled: !!numericId,
        staleTime: 5 * 60 * 1000, // 5 minutes for anime details
      },
      {
        queryKey: animeKeys.reviews(numericId),
        queryFn: () => fetch(`/api/anime/reviews/${numericId}`).then(r => r.json()),
        enabled: !!numericId,
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: ['anime', numericId, 'jikan-details'],
        queryFn: () => fetch(`/api/anime/jikan/${numericId}`).then(r => r.json()),
        enabled: !!numericId,
        staleTime: 24 * 60 * 60 * 1000, // 24 hours for Jikan details (static)
      },
    ],
    combine: (results) => {
      return {
        recommendations: results[0].data,
        reviews: results[1].data,
        details: results[2].data,
        isLoading: results.some(r => r.isLoading),
        errors: results.filter(r => r.error).map(r => r.error),
      }
    }
  })

  // Render with data...

  // Source: https://tanstack.com/query/latest/docs/react/guides/parallel-queries
}

// BEFORE (Sequential): ~3 seconds total
// AFTER (Parallel): ~1 second total (3x faster)
```

### Pattern 4: React Suspense Integration
**What:** Use Suspense boundaries for loading states instead of manual loading flags
**When to use:** Cleaner loading state management across components
**Example:**
```typescript
// Using Suspense with React Query
import { useSuspenseQuery } from '@tanstack/react-query'
import { Suspense } from 'react'

function AnimeList() {
  const { data } = useSuspenseQuery({
    queryKey: animeKeys.list({ page: 1 }),
    queryFn: () => fetchAnime({ page: 1 }),
  })

  return <div>{/* render anime */}</div>
}

export default function AnimePage() {
  return (
    <Suspense fallback={<AnimeListSkeleton />}>
      <AnimeList />
    </Suspense>
  )
}

// Source: https://tanstack.com/query/latest/docs/react/guides/suspense
```

### Anti-Patterns to Avoid
- **Sequential async/await in useEffect:** Prevents parallelization. Use `useQueries` or `Promise.all` instead.
- **Fetching data in multiple useEffect hooks:** Causes waterfalls. Combine into single parallel fetch.
- **Ignoring cache invalidation:** Leads to stale data. Use `queryClient.invalidateQueries()` after mutations.
- **Over-fetching large payloads:** Use pagination and selective field fetching.
- **Not setting appropriate staleTime:** Causes unnecessary refetches. Set based on data volatility.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Data caching | Manual cache with useState/useEffect | React Query built-in cache | Handles cache invalidation, stale-while-revalidate, background refetch |
| Request deduplication | Custom deduplication logic | React Query automatic deduplication | Prevents duplicate requests for same query key automatically |
| Parallel execution | Manual Promise.all orchestration | React Query `useQueries` | Handles errors, loading states, caching for parallel queries |
| Loading state management | Manual isLoading flags per fetch | React Query status (isLoading, isError, data) | Unified status management, no need for custom hooks like useLoadingState |
| Retry logic | Custom retry with exponential backoff | React Query `retry` option | Built-in retry with configurable delays |
| Background refetching | Manual setInterval polling | React Query `refetchInterval` | Automatic background refetching with window focus detection |

**Key insight:** React Query provides a complete data fetching solution that replaces multiple custom patterns. The existing `useLoadingState` hook can be replaced or simplified with React Query's built-in status.

## Common Pitfalls

### Pitfall 1: Waterfalling Sequential Requests
**What goes wrong:** Fetching data in dependent useEffect hooks causes sequential execution (e.g., fetch anime details, then recommendations, then reviews).
**Why it happens:** React useEffect runs sequentially, and awaiting inside creates a waterfall.
**How to avoid:** Use `useQueries` for parallel execution of independent requests.
**Warning signs:** Multiple useEffect hooks each fetching data, total load time = sum of all request times.

### Pitfall 2: Over-fetching Data
**What goes wrong:** Fetching more data than needed (e.g., entire anime list to find one anime by ID).
**Why it happens:** Reusing general-purpose endpoints for specific needs.
**How to avoid:** Create specific API endpoints for common operations (e.g., `/api/anime/[id]`).
**Warning signs:** Fetching 1000+ items to display one, slow response times.

### Pitfall 3: Cache Staleness Issues
**What goes wrong:** Users see outdated data because cache isn't invalidated properly.
**Why it happens:** Not using React Query's invalidation API after mutations.
**How to avoid:** Call `queryClient.invalidateQueries()` after updates.
**Warning signs:** Data doesn't update after user actions, need to refresh page.

### Pitfall 4: Missing Database Indexes
**What goes wrong:** Queries take >100ms due to full table scans.
**Why it happens:** Filtering on columns without indexes causes sequential scans.
**How to avoid:** Add indexes on frequently filtered columns.
**Warning signs:** EXPLAIN ANALYZE shows "Seq Scan" on large tables, high execution time.

### Pitfall 5: Not Measuring Performance
**What goes wrong:** Optimizations don't improve performance because bottlenecks are elsewhere.
**Why it happens:** Guessing instead of measuring.
**How to avoid:** Use EXPLAIN ANALYZE before/after, measure API response times, use React Query DevTools.
**Warning signs:** Optimization work doesn't move metrics on success criteria.

## Code Examples

### Example 1: Setting up React Query with Next.js 15
```typescript
// app/providers.tsx (NEW file)
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental'
import { logger } from '@/lib/logger'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
          gcTime: 5 * 60 * 1000,
          refetchOnWindowFocus: false,
          retry: (failureCount, error) => {
            // Log retries
            if (failureCount > 0) {
              logger.warn({ error, failureCount }, 'Query retrying')
            }
            return failureCount < 2
          },
        },
      },
    })

    // Enable query logging in development
    if (process.env.NODE_ENV === 'development') {
      const queryCache = client.getQueryCache()
      queryCache.subscribe({
        onQueryAdded: (query) => {
          logger.debug({ queryKey: query.queryKey }, 'Query added')
        },
      })
    }

    return client
  })

  return (
    <QueryClientProvider client={queryClient}>
      <ReactQueryStreamedHydration>
        {children}
      </ReactQueryStreamedHydration>
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </QueryClientProvider>
  )
}

// app/layout.tsx (MODIFY)
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

// Source: https://tanstack.com/query/latest/docs/react/installation
```

### Example 2: Migrating Existing useEffect to useQuery
```typescript
// BEFORE (anime/page.tsx)
useEffect(() => {
  const fetchAnime = (page, sortBy, genres) => {
    setIsLoading(true)
    let apiUrl = `/api/anime?limit=50&page=${page}&sortBy=${sortBy}`
    if (genres.length > 0) apiUrl += `&genres=${genres.join(',')}`

    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => {
        setAnimeList(data.anime)
        setTotalPages(data.totalPages)
      })
      .catch((error) => setError(error.message))
      .finally(() => setIsLoading(false))
  }
  fetchAnime(currentPage, debouncedSortBy, debouncedSelectedGenres)
}, [currentPage, debouncedSortBy, debouncedSelectedGenres])

// AFTER (lib/queries/anime.ts)
export function useAnimeList(params: {
  page: number
  sortBy: string
  genres: string[]
  limit?: number
}) {
  return useQuery({
    queryKey: animeKeys.list(params),
    queryFn: async () => {
      const queryParams = new URLSearchParams({
        limit: params.limit || '50',
        page: params.page.toString(),
        sortBy: params.sortBy,
      })
      if (params.genres.length > 0) {
        queryParams.set('genres', params.genres.join(','))
      }

      const response = await fetch(`/api/anime?${queryParams}`)
      if (!response.ok) throw new Error('Failed to fetch anime')
      return response.json()
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Component usage
const { data, isLoading, error } = useAnimeList({
  page: currentPage,
  sortBy: debouncedSortBy,
  genres: debouncedSelectedGenres,
})

const animeList = data?.anime || []
const totalPages = data?.totalPages || 0
```

### Example 3: Parallel Queries on Anime Detail Page
```typescript
// BEFORE: Sequential (3+ seconds)
useEffect(() => { fetchRecommendations() }, [anime])
useEffect(() => { fetchReviews() }, [anime])
useEffect(() => { fetchDetails() }, [anime])

// AFTER: Parallel (~1 second)
const queries = useQueries({
  queries: [
    {
      queryKey: ['recommendations', anime.anime_id],
      queryFn: () => fetch(`/api/anime/recommendation/${anime.anime_id}`).then(r => r.json()),
      enabled: !!anime,
      staleTime: 5 * 60 * 1000,
    },
    {
      queryKey: ['reviews', anime.anime_id],
      queryFn: () => fetch(`/api/anime/reviews/${anime.anime_id}`).then(r => r.json()),
      enabled: !!anime,
      staleTime: 5 * 60 * 1000,
    },
    {
      queryKey: ['jikan-details', anime.anime_id],
      queryFn: () => fetch(`/api/anime/jikan/${anime.anime_id}`).then(r => r.json()),
      enabled: !!anime,
      staleTime: 24 * 60 * 60 * 1000,
    },
  ],
})
```

### Example 4: Database Indexing for Performance
```sql
-- Add indexes to improve query performance
-- Run EXPLAIN ANALYZE before and after to verify improvements

-- Index on frequently filtered columns
CREATE INDEX CONCURRENTLY idx_anime_popularity ON anime(popularity) WHERE popularity IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_anime_rank ON anime(rank) WHERE rank IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_anime_score ON anime(score) WHERE score IS NOT NULL;

-- Composite index for genre filtering (if needed)
-- CREATE INDEX CONCURRENTLY idx_anime_genres ON anime_genres(anime_id, genre_id);

-- Verify query is using index
EXPLAIN ANALYZE
SELECT a.anime_id, a.title, a.popularity
FROM anime a
WHERE a.popularity IS NOT NULL
ORDER BY a.popularity ASC
LIMIT 30;

-- Expected: "Index Scan using idx_anime_popularity" instead of "Seq Scan"

-- Source: PostgreSQL EXPLAIN ANALYZE documentation
```

### Example 5: Monitoring Performance with React Query DevTools
```typescript
// React Query DevTools automatically shows:
// - Query cache state
// - Stale vs fresh data
// - Loading states
// - Query observers
// - Background refetching

// Access in browser: TanStack Query icon in DevTools or bottom-right corner

// Programmatic logging (optional)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onSuccess: (data) => {
        logger.debug({ dataSize: data?.length || 0 }, 'Query succeeded')
      },
      onError: (error) => {
        logger.error({ error }, 'Query failed')
      },
    },
  },
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual caching with useState/useEffect | React Query automatic caching | 2023-2024 | Reduced boilerplate, automatic deduplication |
| Sequential async/await in useEffect | Parallel queries with `useQueries` | 2023 | 2-3x faster page loads |
| Manual loading state management | React Query status + Suspense | 2024 | Cleaner code, better UX |
| No query monitoring | React Query DevTools | 2023+ | Real-time debugging, performance insights |
| Axios cache interceptor | React Query built-in cache | 2024+ | Better integration, more control |

**Deprecated/outdated:**
- **SWR:** Still viable but React Query has larger ecosystem and more features
- **Custom useFetch hooks:** Unnecessary with React Query's comprehensive solution
- **Manual Promise.all for parallelism:** `useQueries` provides better error handling and caching
- **Class-based data fetching:** React Query hooks are the modern pattern

### Current Best Practices (2025)
1. **Use React Query v5** for all client-side data fetching
2. **Separate query logic** from components (queries folder)
3. **Parallelize independent requests** with `useQueries`
4. **Set appropriate staleTime** based on data volatility
5. **Monitor with DevTools** in development
6. **Use query key factories** for type safety and organization
7. **Leverage Suspense** for cleaner loading states (optional but recommended)

## Open Questions

1. **Should we use React Suspense with React Query?**
   - What we know: Suspense is fully supported in React Query v5, provides cleaner loading state management
   - What's unclear: Whether the existing progressive loading pattern (150ms delay) should be preserved or replaced with Suspense
   - Recommendation: Evaluate both approaches - Suspense for new features, consider migrating existing components if it simplifies code significantly

2. **Should we implement server-side streaming with `@tanstack/react-query-next-experimental`?**
   - What we know: This experimental package enables server-side React Query streaming with Next.js 15
   - What's unclear: Stability and production-readiness of the experimental package
   - Recommendation: Avoid in production until stable, stick to client-side React Query for now

3. **What specific database indexes are needed?**
   - What we know: EXPLAIN ANALYZE will identify bottlenecks, indexes on popularity/rank/score will help
   - What's unclear: Current query performance baseline, which specific queries are slowest
   - Recommendation: Run EXPLAIN ANALYZE on browse page queries first (highest traffic), add indexes incrementally based on measurements

4. **Should we migrate all data fetching at once or incrementally?**
   - What we know: Full migration avoids maintaining two patterns, but incremental is lower risk
   - What's unclear: Team preference and timeline constraints
   - Recommendation: Full migration as decided in CONTEXT.md - "Adopt React Query" with "Full migration (not gradual)"

## Sources

### Primary (HIGH confidence)
- [TanStack Query Installation Guide](https://tanstack.com/query/latest/docs/react/installation) - Installation and setup
- [TanStack Query Parallel Queries Guide](https://tanstack.com/query/latest/docs/react/guides/parallel-queries) - useQueries documentation
- [TanStack Query Suspense Guide](https://tanstack.com/query/latest/docs/react/guides/suspense) - Suspense integration
- [Next.js Caching Guide](https://nextjs.org/docs/app/guides/caching) - Next.js 15 caching mechanisms

### Secondary (MEDIUM confidence)
- [Mastering PostgreSQL EXPLAIN ANALYZE](https://prateekcodes.com/postgresql-explain-analyze-deep-dive/) - July 2025
- [How to Effectively Use PostgreSQL EXPLAIN for Query Optimization](https://chat2db.ai/resources/blog/postgresql-explain) - July 2025
- [PostgreSQL 18 Enhanced EXPLAIN with Automatic Buffers](https://neon.com/postgresql/postgresql-18/enhanced-explain) - June 2025
- [Optimizing PostgreSQL queries: 12 indexing pitfalls](https://medium.com/cubbit/optimizing-postgresql-queries-12-indexing-pitfalls-and-how-we-fixed-them-81c25615a84e) - Real-world indexing mistakes
- [AWS Blog: Optimize generative AI applications with pgvector indexing](https://aws.amazon.com/blogs/database/optimize-generative-ai-applications-with-pgvector-indexing-a-deep-dive-into-ivfflat-and-hnsw-techniques/) - pgvector optimization
- [Clarvo: Optimizing filtered vector queries](https://www.clarvo.ai/blog/optimizing-filtered-vector-queries-from-tens-of-seconds-to-single-digit-milliseconds-in-postgresql/) - Performance case study
- [TanStack Query DevTools Documentation](https://tanstack.com/query/v5/docs/react/devtools) - DevTools setup and usage

### Tertiary (LOW confidence)
- [React Query in the RSC Era (Next.js 15)](https://medium.com/@sureshdotariya/react-query-in-the-rsc-era-next-js-15-when-you-still-need-it-and-how-to-use-it-right-843bc9f5b719) - Community article on RSC integration
- [Next.js 15 in 2025: New Features & Performance Guide](https://medium.com/@mernstackdevbykevin/next-js-15-the-performance-revolution-every-react-developer-needs-in-2025-3dd5295ad993) - Performance optimization overview
- [TanStack Query v5 with React 19 tutorials](https://www.youtube.com/watch?v=0tKtNZzdZic) - Video tutorials for React 19 setup

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - TanStack Query is industry standard, well-documented
- Architecture: HIGH - Official docs and established patterns from TanStack
- Pitfalls: HIGH - Common issues documented in official guides and community resources
- Database optimization: MEDIUM - PostgreSQL indexing well-understood, but pgvector-specific optimization requires measurement

**Research date:** 2026-01-19
**Valid until:** 2026-02-18 (30 days - React Query v5 is stable, Next.js 15 is current LTS)

## Key Implementation Notes

### From CONTEXT.md Constraints
- **Decision:** Full migration to React Query (not gradual)
- **Decision:** Use `useQueries` for parallel execution (not vanilla Promise.all)
- **Decision:** Variable cache durations (anime details: 5min, browse: 2min, search: 1min)
- **Decision:** Optimize browse page queries with database indexes
- **Decision:** Use EXPLAIN ANALYZE before adding indexes
- **Discretion:** Loading state strategy (use existing progressive loading or adapt)
- **Discretion:** Timeout configuration (15-30s defaults based on operation type)
- **Discretion:** Monitoring depth (structured logging without excessive noise)

### Existing Infrastructure
- **Service layer:** Already uses child logger pattern (animeLogger, anilistLogger, cacheLogger)
- **External APIs:** Already wrapped with retry logic (exponential backoff with jitter)
- **Error handling:** Error boundaries and retry logic in place from Phase 3
- **Loading states:** Progressive loading pattern from Phase 4 (150ms delay)
- **Current caching:** Axios cache interceptor used for API responses (will be replaced by React Query)

### Files to Modify
1. `frontend/app/providers.tsx` (NEW) - QueryClient provider setup
2. `frontend/lib/queries/anime.ts` (NEW) - Query functions and hooks
3. `frontend/app/anime/page.tsx` - Migrate to useAnimeList
4. `frontend/app/anime/[id]/page.tsx` - Migrate to parallel queries
5. `frontend/app/layout.tsx` - Add Providers wrapper
6. Database migration scripts - Add indexes on filtered columns

### Success Metrics
- Page load time reduced by 25% (measure with React Query DevTools timing)
- No duplicate API calls for same data within cache duration
- Database query response time <100ms (measure with EXPLAIN ANALYZE)
- Vercel timeout errors eliminated for normal operations
- Independent API calls run in parallel (verify with network tab)
