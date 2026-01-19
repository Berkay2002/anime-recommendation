# Codebase Concerns

**Analysis Date:** 2025-01-19

## Tech Debt

**Duplicate Anime Entries:**
- Issue: Database has duplicate anime with same titles but different mal_id values
- Files: `frontend/services/animeCacheService.ts`, `frontend/docs/DUPLICATE_FIX_GUIDE.md`
- Impact: 1,073 total entries with 16+ confirmed duplicates (e.g., "One Punch Man 3" appears twice)
- Fix approach: Prevention logic implemented but existing duplicates remain; requires running `backend/scripts/fix_duplicates.py`

**Excessive Console Logging:**
- Issue: Production code contains verbose console.log statements
- Files: `frontend/services/animeCacheService.ts` (15+ instances), `frontend/services/jikanService.ts`
- Impact: Exposes internal debugging info, potential performance overhead
- Fix approach: Replace with proper logging framework or remove debug logs

**Missing Error Boundaries:**
- Issue: Components lack React error boundaries for graceful failure handling
- Files: Multiple component files throughout frontend
- Impact: Single component failure can crash entire application
- Fix approach: Implement error boundary wrapper components

## Security Considerations

**Hardcoded API Keys in Environment:**
- Issue: `.env.local` contains exposed API keys in plain text
- Files: `frontend/.env.local`
- Current mitigation: File is gitignored but keys are visible locally
- Recommendations: Use secret management service or encrypted environment variables

**Missing Input Validation:**
- Issue: API routes lack comprehensive input sanitization
- Files: `frontend/app/api/anime/jikan/[id]/route.ts`, `frontend/app/api/anime/reviews/[id]/route.ts`
- Risk: Potential SQL injection or XSS vulnerabilities
- Recommendations: Implement Zod schemas or similar validation library

**No Rate Limiting:**
- Issue: API endpoints lack rate limiting protection
- Files: All API routes in `frontend/app/api/`
- Risk: Vulnerable to abuse and DDoS attacks
- Recommendations: Implement rate limiting middleware

## Performance Bottlenecks

**Large Component Files:**
- Issue: Components exceed 200+ lines without proper decomposition
- Files: `frontend/app/anime/[id]/page.tsx` (748 lines), `frontend/components/ui/sidebar.tsx` (726 lines)
- Cause: Monolithic components handling multiple concerns
- Improvement path: Extract sub-components and implement composition patterns

**Blocking API Calls:**
- Issue: Sequential API calls instead of parallel execution
- Files: `frontend/app/anime/[id]/page.tsx` - multiple useEffect hooks
- Cause: Dependencies between data fetches
- Improvement path: Use Promise.all() or React Suspense with parallel data fetching

**Vercel Timeout Limits:**
- Issue: Embedding processing limited to 10 seconds (Vercel free tier)
- Files: `frontend/app/api/embeddings/process/route.ts`
- Current capacity: Single anime embedding generation per request
- Scaling path: Implement queue-based processing or upgrade Vercel plan

## Fragile Areas

**Type Inconsistencies:**
- Issue: Multiple interface definitions for same data structure
- Files: `frontend/app/anime/[id]/page.tsx` (lines 26-50), `frontend/services/animeService.ts` (lines 6-37)
- Why fragile: Duplicate type definitions can diverge, causing runtime errors
- Safe modification: Consolidate types into shared interfaces

**Null Return Patterns:**
- Issue: 30+ instances of returning null/empty arrays without error context
- Files: Throughout service files and components
- Test coverage: Limited error case testing
- Risk: Silent failures make debugging difficult

**Hardcoded API Endpoints:**
- Issue: Jikan API base URL hardcoded in multiple places
- Files: `frontend/app/api/anime/jikan/[id]/route.ts`, `frontend/app/api/anime/reviews/[id]/route.ts`
- Risk: API changes require updates in multiple locations
- Safe modification: Centralize API configuration

## Missing Critical Features

**No Offline Support:**
- Problem: Application fails when network is unavailable
- Blocks: User experience degradation
- Solution: Implement service worker with caching strategy

**No Error Recovery:**
- Problem: Failed API calls don't retry or provide recovery options
- Blocks: User retention during service disruptions
- Solution: Implement exponential backoff retry logic

**No Loading States:**
- Problem: Users see empty content during data fetching
- Blocks: Perceived performance issues
- Solution: Implement skeleton loaders and progress indicators

## Test Coverage Gaps

**No Unit Tests:**
- What's not tested: Service layer functions in `frontend/services/`
- Risk: Business logic changes can introduce regressions
- Priority: High - Core recommendation algorithm untested

**No API Integration Tests:**
- What's not tested: API route handlers and external service integration
- Risk: API changes or failures go undetected
- Priority: High - Critical user paths depend on external APIs

**No Component Tests:**
- What's not tested: React component rendering and interaction
- Risk: UI regressions and broken user flows
- Priority: Medium - Visual regression risk

## Dependencies at Risk

**Google Generative AI:**
- Risk: Experimental API with potential breaking changes
- Impact: Embedding generation failures break recommendation system
- Migration plan: Consider OpenAI or local embedding models as backup

**Jikan API:**
- Risk: Third-party API with rate limits and availability constraints
- Impact: Anime data unavailable, breaking core functionality
- Migration plan: Implement comprehensive caching and fallback strategies

**Vercel Platform Limits:**
- Risk: Free tier limitations on function duration and requests
- Impact: Embedding processing fails, API timeouts
- Migration plan: Optimize for edge runtime or upgrade plan

---

*Concerns audit: 2025-01-19*