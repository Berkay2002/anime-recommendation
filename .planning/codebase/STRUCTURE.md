# Codebase Structure

**Analysis Date:** 2025-01-19

## Directory Layout

```
frontend/
├── app/                    # Next.js App Router pages and API routes
├── components/             # React components and UI components
├── services/               # Business logic and external service integrations
├── lib/                    # Utilities, database connections, helpers
├── hooks/                  # Custom React hooks
├── styles/                 # Global CSS and theme files
├── public/                 # Static assets
├── docs/                   # Documentation
└── scripts/                # Build and utility scripts
```

## Directory Purposes

**app/:**
- Purpose: Next.js App Router structure
- Contains: Page components, API routes, layouts
- Key files: `layout.tsx`, `page.tsx`, `api/anime/route.ts`

**components/:**
- Purpose: Reusable React components
- Contains: UI components, feature components, Radix UI wrappers
- Key files: `AnimeCard.tsx`, `Navbar.tsx`, `SearchBar.tsx`, `ui/` directory

**services/:**
- Purpose: Business logic and data fetching
- Contains: Anime service, caching logic, external API integrations
- Key files: `animeService.ts`, `animeCacheService.ts`, `jikanService.ts`

**lib/:**
- Purpose: Core utilities and configurations
- Contains: Database connections, caching logic, utilities
- Key files: `postgres.ts`, `animeCache.ts`, `utils.ts`

**hooks/:**
- Purpose: Custom React hooks for shared logic
- Contains: Data fetching, local storage, debouncing, recommendations
- Key files: `useRecommendations.ts`, `useLocalStorage.ts`, `useDebounce.ts`

## Key File Locations

**Entry Points:**
- `frontend/app/layout.tsx`: Root layout with providers
- `frontend/app/page.tsx`: Home page component
- `frontend/app/anime/page.tsx`: Browse anime page
- `frontend/app/anime/[id]/page.tsx`: Individual anime details

**Configuration:**
- `frontend/package.json`: Dependencies and scripts
- `frontend/next.config.mjs`: Next.js configuration
- `frontend/tsconfig.json`: TypeScript configuration
- `frontend/tailwind.config.js`: Tailwind CSS configuration

**Core Logic:**
- `frontend/services/animeService.ts`: Main anime data operations
- `frontend/lib/postgres.ts`: Database connection
- `frontend/components/AnimeCard.tsx`: Primary anime display component

**Testing:**
- Not detected in current codebase

## Naming Conventions

**Files:**
- Components: PascalCase (e.g., `AnimeCard.tsx`)
- Utilities: camelCase (e.g., `useDebounce.ts`)
- API routes: `route.ts` (Next.js convention)

**Directories:**
- kebab-case for multi-word directories (not applicable, all single words)
- API route directories use brackets for params: `[id]`, `[...slug]`

## Where to Add New Code

**New Feature Component:**
- Implementation: `frontend/components/FeatureName.tsx`
- If complex: Create subdirectory `frontend/components/FeatureName/index.tsx`

**New API Route:**
- Route: `frontend/app/api/feature/route.ts`
- Follow existing pattern with NextResponse

**New Service:**
- Location: `frontend/services/featureService.ts`
- Export functions for use in API routes

**New Hook:**
- Location: `frontend/hooks/useFeature.ts`
- Follow naming convention: `use` + PascalCase

**New UI Component:**
- Location: `frontend/components/ui/ComponentName.tsx`
- Follow Radix UI patterns if interactive

## Special Directories

**app/api/:**
- Purpose: Next.js API routes
- Generated: No (manual)
- Committed: Yes

**components/ui/:**
- Purpose: Radix UI based components
- Generated: No (manual)
- Committed: Yes

**node_modules/:**
- Purpose: Dependencies
- Generated: Yes (`npm install`)
- Committed: No (in .gitignore)

**.next/:**
- Purpose: Next.js build output
- Generated: Yes (`next build`)
- Committed: No (in .gitignore)

---

*Structure analysis: 2025-01-19*