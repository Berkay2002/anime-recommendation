# Phase 5: API Optimization - Context

**Gathered:** 2026-01-19
**Status:** Ready for planning

## Phase Boundary

Optimize API calls and database queries for better performance and user experience. Focus on parallel execution, caching layer, and database query improvements. Error recovery and offline support are handled in Phase 6.

## Implementation Decisions

### Parallelization Strategy
- **Comprehensive parallelization** - Optimize all pages equally (browse, detail, search, recommendations)
- **Aggressiveness** - You decide based on operation dependencies and complexity
- **Implementation** - Use React Query's `useQueries` hook for parallel calls (not vanilla Promise.all)
- **Timeout handling** - You decide based on operation type (15-30s reasonable defaults)
- **Loading states** - You decide (use existing progressive loading pattern)
- **Error handling** - You decide (fail fast vs complete all based on data criticality)
- **Monitoring** - You decide (structured logging with reasonable detail)

### Data Fetching Library
- **Adopt React Query** - Use for built-in caching, parallelization, refetching, and React Suspense support
- **Migration approach** - Full migration (not gradual) - rewrite all data fetching to use React Query
- **React Suspense integration** - Yes, use Suspense for cleaner loading state management
- **Cache duration (staleTime)** - Varies by data type:
  - Anime details: 5 minutes
  - Browse results: 2 minutes
  - Search results: 1 minute

### Database Optimization Targets
- **Primary target** - Browse page queries (filtering, pagination, sorting)
- **Optimization approach** - Add database indexes on frequently filtered columns (genre, year, rating)
- **Query analysis** - Use EXPLAIN ANALYZE to identify bottlenecks before optimization
- **Connection handling** - You decide (connection pooling vs prepared statements based on measurement)
- **Performance monitoring** - Yes - add detailed query timing logs before optimization

### Claude's Discretion
- **Parallelization aggressiveness** - Balance parallelization benefits with complexity
- **Timeout configuration** - Set reasonable defaults (15-30s) based on operation type
- **Loading state strategy** - Use existing progressive loading pattern or adapt as needed
- **Error isolation** - Decide when to fail fast vs complete all parallel calls
- **Monitoring depth** - Structured logging without excessive noise
- **Connection optimization** - Choose connection pooling or prepared statements based on measurement

## Specific Ideas

- React Query adoption enables parallelization AND caching in one library
- Full migration avoids maintaining two data fetching patterns simultaneously
- React Suspense simplifies loading state management compared to manual hooks
- Variable cache durations match data freshness requirements (details stable, search volatile)
- Browse page optimization targets user-facing pain point (filtering is slow)

## Deferred Ideas

- None - discussion stayed within phase scope

---

*Phase: 05-api-optimization*
*Context gathered: 2026-01-19*
