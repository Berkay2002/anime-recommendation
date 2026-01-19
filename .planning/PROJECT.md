# Anime Recommendation App - Code Quality Improvements

## What This Is

An anime recommendation application built with Next.js, PostgreSQL with pgvector, and Clerk authentication. The app provides personalized anime recommendations based on user selections using AI embeddings. This project focuses on addressing code quality, reliability, and performance tech debt through incremental cleanup and improvements.

## Core Value

Users can discover anime they'll love through AI-powered recommendations based on their selections.

## Requirements

### Validated

- ✓ Anime search and discovery functionality - existing
- ✓ AI-powered recommendations using embeddings - existing
- ✓ User authentication via Clerk - existing
- ✓ Database integration with PostgreSQL and vector search - existing
- ✓ API routes for anime data, recommendations, and reviews - existing

### Active

- [ ] Remove excessive console logging from production code
- [ ] Implement error boundaries for graceful failure handling
- [ ] Add loading states and error recovery mechanisms
- [ ] Optimize API calls to run in parallel instead of sequentially
- [ ] Break up large component files (748+ lines) into smaller, focused components
- [ ] Add proper error handling and retry logic for failed API calls

### Out of Scope

- New features or functionality - focusing on quality improvements only
- Visual redesign or UI changes - keeping existing UI intact
- Database schema changes - working with current data model
- Authentication system changes - Clerk integration is working well

## Context

**Existing Tech Debt:**
- Codebase has accumulated tech debt including excessive console logging (15+ instances in production code)
- Missing error boundaries - component failures crash entire application
- Large monolithic components (748 lines in anime detail page)
- Blocking API calls causing performance issues
- No loading states during data fetching
- Missing error recovery mechanisms

**Technology Stack:**
- Next.js 16.1.3 with App Router and React 19
- TypeScript 5.7.2
- PostgreSQL with pgvector for embeddings
- Clerk for authentication
- Tailwind CSS + Radix UI for styling
- Google Generative AI for embeddings
- Jikan API for anime data

**Deployment:**
- Vercel platform with environment variable management for API keys
- Free tier limitations (10-second function timeout)

## Constraints

**Tech Stack:** Next.js/React/TypeScript with PostgreSQL - must work within existing stack
**Timeline:** Incremental improvements to maintain app stability during cleanup
**Compatibility:** No breaking changes to existing user experience
**Performance:** Must maintain or improve current performance, especially recommendation generation

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Incremental cleanup approach (services → components → API routes) | Lower risk, easier to review and verify each change | — Pending |
| Start with services layer | Foundation layer - improvements here benefit all consumers | — Pending |
| Keep existing UI/UX intact | Focus on code quality, not visual changes | — Pending |
| No database migrations | Current schema supports all needed functionality | — Pending |

---
*Last updated: 2025-01-19 after initialization*
