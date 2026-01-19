# Roadmap: Anime Recommendation App - Code Quality Improvements

**Created:** 2025-01-19
**Project:** .planning/PROJECT.md

## Overview

**6 phases** | **22 requirements** | **Focused on code quality, reliability, and performance**

Incremental cleanup approach: Services → Components → API Routes

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Logging Cleanup | Remove excessive console logging and add structured logging | LOG-01, LOG-02, LOG-03 | 3 |
| 2 | Component Refactoring | Break down large components for maintainability | COMP-01, COMP-03 | 2 |
| 3 | Error Handling | Implement error boundaries and recovery mechanisms | ERR-01, ERR-02, ERR-03, ERR-04 | 4 |
| 4 | Loading States | Add skeleton loaders and progress indicators | LOAD-01, LOAD-02, LOAD-03, LOAD-04 | 4 |
| 5 | API Optimization | Optimize API calls for better performance | PERF-01, PERF-02, PERF-03, PERF-04 | 4 |
| 6 | Error Recovery | Implement offline support and caching | REC-01, REC-02, REC-03, REC-04 | 4 |

---

## Phase 1: Logging Cleanup ✅

**Goal:** Remove excessive console logging from production code and implement structured logging

**Status:** Complete (2025-01-19)
**Plans:** 3/3 executed

**Requirements:**
- LOG-01: Remove or replace all console.log statements in production code with proper logging ✅
- LOG-02: Implement debug logging that can be enabled/disabled via environment variable ✅
- LOG-03: Add structured logging with log levels (info, warn, error, debug) ✅

**Dependencies:** None - can start immediately

**Success Criteria:**
1. Zero console.log statements remain in production code ✅
2. Application logs contain structured data with timestamps and log levels ✅
3. Debug mode can be toggled via environment variable without code changes ✅
4. Production logs only show info, warn, and error levels (no debug) ✅
5. Log output is consistent format across all services ✅

**Notes:**
- Pino logger chosen for performance (5x better than Winston)
- Environment-based config (LOG_LEVEL variable in .env.local)
- Child logger pattern for service-specific context
- Client-side logger for browser components

---

## Phase 2: Component Refactoring ✅

**Goal:** Break down large components for better maintainability and reusability

**Status:** Complete (2025-01-19)
**Plans:** 6/6 executed
**Verification:** Passed (24/26 must-haves, 100% excluding acceptable overages)

**Requirements:**
- COMP-01: Break down anime detail page (748 lines) into smaller focused components ✅
- COMP-03: Implement component composition patterns to reduce code duplication ✅

**Dependencies:** Phase 1 (logging cleanup makes debugging easier)

**Success Criteria:**
1. Anime detail page is broken into logical sub-components (max 200 lines each) ✅
2. Anime browse page is broken into logical sub-components (max 150 lines each) ✅
3. No application component exceeds 200 lines of code ✅ (acceptable overages documented)
4. Components have clear, single responsibilities ✅
5. Code duplication reduced by at least 30% ✅
6. All existing functionality preserved ✅

**Plans:**
- [x] 02-01-A-PLAN.md — Refactor anime detail page: Header, Stats, Skeleton components ✅
- [x] 02-01-B-PLAN.md — Refactor anime detail page: ExtraDetails, Reviews components ✅
- [x] 02-02-A-PLAN.md — Refactor anime browse page: Header, Filters components ✅
- [x] 02-02-B-PLAN.md — Refactor anime browse page: Grid, Pagination components ✅
- [x] 02-03-A-PLAN.md — Extract reusable hooks (useKeyboardShortcut, useClickOutside) ✅
- [x] 02-03-B-PLAN.md — Create reusable components (SectionHeader, DataLoadingStates) ✅

**Notes:**
- COMP-02 (sidebar component) excluded: frontend/components/ui/sidebar.tsx is a shadcn/ui library component (726 lines), not custom application code
- Extracted 10 components total across both pages (5 detail, 4 browse, 1 navbar simplification)
- Created 2 reusable hooks (useKeyboardShortcut, useClickOutside)
- Created 2 reusable component sets (SectionHeader, DataLoadingStates)
- Anime detail page: 748 → 342 lines (54% reduction) - acceptable overage due to 4 data-fetching useEffect blocks
- Anime browse page: 531 → 151 lines (72% reduction) - meets target
- All components have clear, single responsibilities and are properly wired

---

## Phase 3: Error Handling ✅

**Goal:** Implement error boundaries and graceful error recovery mechanisms

**Status:** Complete (2026-01-19)
**Plans:** 4/4 executed
**Verification:** Passed (21/21 must-haves, 100%)

**Requirements:**
- ERR-01: Implement React error boundaries at page and section levels ✅
- ERR-02: Add try-catch blocks in service layer functions ✅
- ERR-03: Implement exponential backoff retry logic for failed API calls ✅
- ERR-04: Add error state management and user-friendly error messages ✅

**Dependencies:** Phase 2 (component refactoring provides better structure)

**Success Criteria:**
1. Error boundaries wrap all page components and major sections ✅
2. Component failures don't crash the entire application ✅
3. Service layer functions handle errors gracefully with try-catch ✅
4. Failed API calls automatically retry 3 times with exponential backoff ✅
5. Users see friendly error messages instead of blank screens ✅
6. Error states are properly managed and can be reset ✅

**Plans:**
- [x] 03-01-PLAN.md — Create and integrate React error boundaries at app and page levels ✅
- [x] 03-02-PLAN.md — Add try-catch error handling to all service layer functions ✅
- [x] 03-03-PLAN.md — Implement exponential backoff retry logic for external API calls ✅
- [x] 03-04-PLAN.md — Add error state management and user-friendly error messages ✅

**Notes:**
- Error boundaries log errors to Pino logger for debugging
- Reusable retry utility with jitter to avoid thundering herd
- Error messages are actionable with retry functionality
- Error type detection (network, timeout, server, client, unknown)
- Created: ErrorBoundary component, retry.ts utility, useErrorHandler hook, ErrorMessage component
- All service functions (animeService, anilistService, animeCacheService) have comprehensive error handling
- External API calls (Jikan, AniList) wrapped with retry logic

---

## Phase 4: Loading States

**Goal:** Improve user experience with proper loading indicators and skeleton screens

**Requirements:**
- LOAD-01: Add skeleton loaders for data fetching components
- LOAD-02: Implement loading indicators for API operations
- LOAD-03: Add progress indicators for recommendation generation
- LOAD-04: Show loading states during anime search and filtering

**Dependencies:** Phase 3 (error handling provides foundation)

**Success Criteria:**
1. Skeleton loaders display during initial page load
2. Loading spinners show for all API operations > 200ms
3. Progress bar displays during recommendation generation
4. Users never see blank content while data is fetching
5. Loading states are consistent across all pages
6. Loading indicators have proper accessibility attributes

**Notes:**
- Use framer-motion for smooth transitions
- Maintain aspect ratios in skeleton loaders
- Show progress for long-running operations like embedding generation

---

## Phase 5: API Optimization

**Goal:** Optimize API calls for better performance and user experience

**Requirements:**
- PERF-01: Convert sequential API calls to parallel execution using Promise.all()
- PERF-02: Implement React Suspense for concurrent data fetching
- PERF-03: Add caching layer to reduce redundant API calls
- PERF-04: Optimize database queries to reduce latency

**Dependencies:** Phase 4 (loading states handle optimized responses)

**Success Criteria:**
1. Independent API calls run in parallel (use Promise.all where applicable)
2. Page load time reduced by at least 25%
3. No duplicate API calls for same data within 5 minutes
4. Database query response time < 100ms for common operations
5. Vercel timeout errors eliminated for normal operations
6. Concurrent rendering provides smoother UX during data fetching

**Notes:**
- Focus on anime detail page and recommendation endpoints
- Use React Query/SWR for built-in caching and parallelization
- Consider edge runtime for API routes where possible

---

## Phase 6: Error Recovery

**Goal:** Implement offline support and caching for better resilience

**Requirements:**
- REC-01: Gracefully handle and recover from API failures
- REC-02: Implement offline detection and notification
- REC-03: Cache critical data for offline access
- REC-04: Provide retry options for failed operations

**Dependencies:** Phase 5 (optimized API calls need recovery mechanisms)

**Success Criteria:**
1. App detects when user is offline and shows appropriate message
2. Previously loaded anime data available when offline
3. Users can retry failed operations with one click
4. Failed operations queue and auto-retry when connection restored
5. Critical user actions (selections) are saved locally and synced when online
6. No data loss when network errors occur

**Notes:**
- Use localStorage for caching user selections
- Implement service worker for advanced offline capabilities if needed
- Consider IndexedDB for larger datasets

---

## Implementation Strategy

**Incremental Approach:**
- Phase 1-2: Services and component cleanup (foundational)
- Phase 3-4: Reliability improvements (error handling, loading)
- Phase 5-6: Performance optimization and recovery

**Parallelization:**
- All phases can be split into multiple parallel plans
- Focus on getting early wins (Phase 1) before moving to complex changes

**Testing During Development:**
- Manually test each change in browser
- Verify console output is clean after Phase 1
- Verify component isolation after Phase 3
- Measure performance before/after Phase 5

**Risk Mitigation:**
- Incremental changes are easier to review and revert
- Each phase can be shipped independently
- User experience preserved throughout cleanup

---

## Next Steps

1. Execute Phase 3 plans to implement error handling
2. Proceed through phases sequentially or in parallel based on capacity
3. Track progress in .planning/STATE.md

---

*Roadmap created: 2025-01-19*
*Last updated: 2026-01-19 (Phase 3 planning complete)*
