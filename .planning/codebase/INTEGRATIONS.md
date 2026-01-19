# External Integrations

**Analysis Date:** 2025-01-19

## APIs & External Services

**Anime Data Sources:**
- Jikan API (MyAnimeList) - Primary anime data source
  - Endpoint: https://api.jikan.moe/v4
  - Usage: Anime details, characters, staff, statistics
  - Client: Custom fetch implementation in `frontend/app/api/anime/jikan/[id]/route.ts`

- AniList GraphQL API - Secondary anime data source
  - Endpoint: https://graphql.anilist.co
  - Usage: High-quality images (banners, covers)
  - Client: Custom GraphQL implementation in `frontend/services/anilistService.ts`

**AI/ML Services:**
- Google Generative AI - Text embeddings for recommendations
  - Model: text-embedding-004 (768 dimensions)
  - Usage: Generate embeddings for anime descriptions, genres, themes
  - Auth: GOOGLE_API_KEY environment variable

## Data Storage

**Databases:**
- Neon PostgreSQL - Primary database via Vercel Postgres
  - Connection: DATABASE_URL / POSTGRES_URL environment variables
  - Client: @vercel/postgres with sql template tags
  - Features: Vector embeddings storage with pgvector extension

**File Storage:**
- Local filesystem only - No external file storage detected

**Caching:**
- axios-cache-interceptor - HTTP response caching for API calls
- Next.js revalidation - Server-side cache with 1-hour revalidation for Jikan API

## Authentication & Identity

**Auth Provider:**
- Clerk - Complete authentication solution
  - SDK: @clerk/nextjs 6.36.8
  - Keys: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
  - Features: Theme integration with dark mode support
  - Implementation: Custom ClerkThemeProvider in `frontend/components/ClerkThemeProvider.tsx`

## Monitoring & Observability

**Error Tracking:**
- None detected - No Sentry, Bugsnag, or similar services

**Logs:**
- Console logging throughout application
- No structured logging service detected

## CI/CD & Deployment

**Hosting:**
- Vercel - Primary deployment platform
  - Optimized build script: `vercel-build`
  - Max duration: 10 seconds (free tier limit)

**CI Pipeline:**
- None detected - No GitHub Actions, CircleCI, etc.

## Environment Configuration

**Required env vars:**
- POSTGRES_URL / DATABASE_URL - Neon database connection
- GOOGLE_API_KEY - Google AI API access
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY - Clerk public key
- CLERK_SECRET_KEY - Clerk private key
- CRON_SECRET - Cron job authentication (not actively used)

**Secrets location:**
- .env.local file (gitignored)
- No additional secret management detected

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- Internal webhook: `/api/embeddings/process` - Triggered from search to generate embeddings

---

*Integration audit: 2025-01-19*