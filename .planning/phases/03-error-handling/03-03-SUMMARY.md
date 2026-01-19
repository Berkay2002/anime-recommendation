---
phase: 03-error-handling
plan: 03
subsystem: api-reliability
tags: [exponential-backoff, retry-logic, jikan-api, anilist-api, pino-logging]

# Dependency graph
requires:
  - phase: 03-error-handling
    plan: 02
    provides: Service layer with try-catch error handling and child loggers
provides:
  - Reusable retryWithBackoff utility with exponential backoff and jitter
  - Automatic retry logic for Jikan API calls (search, getById, currentSeason, upcoming)
  - Automatic retry logic for AniList GraphQL API calls
  - Smart error detection (5xx/network/429 retry, 4xx don't)
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Exponential backoff with jitter for external API calls
    - Retry utility with configurable options (maxRetries, delays, shouldRetry predicate)
    - Rate limiting + retry layering (rate limiter wraps retry logic)

key-files:
  created:
    - frontend/lib/retry.ts
  modified:
    - frontend/services/jikanService.ts
    - frontend/services/anilistService.ts

key-decisions:
  - "Retry strategy: 3 attempts by default with exponential backoff (1s → 2s → 4s, capped at 10s)"
  - "Jitter implementation: Random multiplier 0.5-1.0x to prevent thundering herd problem"
  - "Smart error detection: Retry 5xx/network/429 errors, skip 4xx client errors (except 429)"
  - "Layering: Rate limiter wraps retry logic in jikanService (both still needed)"
  - "Default parameters: maxRetries=3, baseDelay=1000ms, maxDelay=10000ms"

patterns-established:
  - "Import pattern: import { retryWithBackoff } from '@/lib/retry'"
  - "Retry wrapper: Wrap only the external API call, not entire function"
  - "onRetry callback: Always include for logging retry attempts with context"
  - "Rate limiting preservation: Keep rateLimiter.throttle wrapper outside retry logic"
  - "Error detection: Use shouldRetry predicate to control retry behavior"

# Metrics
duration: 3min
completed: 2026-01-19
---

# Phase 3: API Retry Logic Summary

**Exponential backoff retry utility integrated into Jikan and AniList API calls with smart error detection and jitter**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-19T15:13:22Z
- **Completed:** 2026-01-19T15:16:30Z
- **Tasks:** 3
- **Files modified:** 2 (1 created)

## Accomplishments

- Created reusable retryWithBackoff utility with exponential backoff, jitter, and smart error detection
- Integrated retry logic into all 4 Jikan API service functions (searchJikanAnime, getJikanAnimeById, getCurrentSeasonAnime, getUpcomingAnime)
- Integrated retry logic into AniList GraphQL API calls (getAniListImages)
- All retry attempts logged with full context using Pino child loggers

## Task Commits

Each task was committed atomically:

1. **Task 1: Create reusable retry utility with exponential backoff** - `6e67f1c` (feat)
2. **Task 2: Integrate retry logic into jikanService** - `48e8d54` (feat)
3. **Task 3: Integrate retry logic into anilistService** - `193cd7c` (feat)

**Plan metadata:** (to be committed after SUMMARY.md creation)

## Files Created/Modified

- `frontend/lib/retry.ts` (169 lines) - Reusable retry utility with exponential backoff, jitter, smart error detection
- `frontend/services/jikanService.ts` - Wrapped 4 API functions with retryWithBackoff, added onRetry logging
- `frontend/services/anilistService.ts` - Wrapped getAniListImages fetch call with retryWithBackoff

## Decisions Made

### Retry Configuration

- **Default maxRetries: 3** - Allows up to 4 total attempts (initial + 3 retries) for transient failures
- **Base delay: 1 second** - First retry waits 1s, then doubles each attempt (2s, 4s, 8s)
- **Max delay cap: 10 seconds** - Prevents excessively long waits even after many retries
- **Jitter: 0.5-1.0x random multiplier** - Prevents thundering herd problem when multiple requests fail simultaneously
- **Smart error detection:**
  - **Retry:** Network errors (no response), 5xx server errors, 429 rate limit errors
  - **Don't retry:** 4xx client errors (400-499 except 429) - these are permanent failures

### Service Layer Integration

- **Jikan API:** Retry logic wrapped inside rate limiter (rate limiting still needed for 3 req/sec limit)
- **AniList API:** Retry logic wrapped around GraphQL fetch call
- **Logging:** All retry attempts logged via onRetry callback with attempt number, error, delay, and request context
- **Error handling preservation:** Existing try-catch blocks and error throwing maintained from Plan 03-02

### Established Patterns

- Import: `import { retryWithBackoff } from '@/lib/retry'`
- Wrap only the API call, not entire function:
  ```typescript
  const result = await retryWithBackoff(async () => {
    return await externalApiCall();
  }, {
    maxRetries: 3,
    onRetry: (attempt, error, delay) => {
      logger.debug({ attempt, error, delay, context }, 'Retrying API call');
    }
  });
  ```
- Rate limiting layering: `rateLimiter.throttle(() => retryWithBackoff(...))`

## Deviations from Plan

None - plan executed exactly as written.

All requirements met:
- ✓ Reusable retry utility created with exponential backoff and jitter
- ✓ Smart error detection implemented (5xx/network/429 retry, 4xx don't)
- ✓ All 4 Jikan API functions wrapped with retry logic
- ✓ AniList API function wrapped with retry logic
- ✓ Retry attempts logged with full context
- ✓ Rate limiting preserved in jikanService
- ✓ TypeScript compilation successful with zero errors

## Issues Encountered

None - all tasks executed smoothly without issues.

## Authentication Gates

None - no external service authentication required for this plan.

## Next Phase Readiness

API retry logic complete. Ready for Plan 03-04 (User Feedback Error UI).

**Remaining work in Phase 3:**
- 03-04: User Feedback Error UI - Display user-friendly error messages and recovery options in UI

**Blockers/Concerns:**
- None identified

---
*Phase: 03-error-handling*
*Completed: 2026-01-19*
