# Technology Stack

**Analysis Date:** 2025-01-19

## Languages

**Primary:**
- TypeScript 5.7.2 - Main application language for all components and API routes

**Secondary:**
- JavaScript (ES modules) - Configuration files (next.config.mjs, postcss.config.mjs)

## Runtime

**Environment:**
- Node.js (latest) - Server-side runtime for Next.js

**Package Manager:**
- npm (implied) - Based on package-lock.json presence
- Lockfile: Present (package-lock.json)

## Frameworks

**Core:**
- Next.js 16.1.3 - React framework with App Router
- React 19.2.0 - UI library

**Testing:**
- Not configured - No testing framework detected

**Build/Dev:**
- Tailwind CSS 4.1.18 - Utility-first CSS framework
- PostCSS 8.5.6 - CSS processing
- ESLint 9.39.2 - Code linting with Next.js configuration

## Key Dependencies

**Critical:**
- @clerk/nextjs 6.36.8 - Authentication and user management
- @google/generative-ai 0.24.1 - AI embeddings for recommendations
- @neondatabase/serverless 1.0.2 - Neon PostgreSQL client
- @vercel/postgres 0.10.0 - Vercel Postgres integration
- @tutkli/jikan-ts 2.2.0 - Jikan API (MyAnimeList) client
- axios 1.13.2 - HTTP client with axios-cache-interceptor

**Infrastructure:**
- framer-motion 11.18.2 - Animation library
- react-hook-form 7.71.1 - Form management with Zod validation
- zod 4.3.5 - Schema validation
- date-fns 4.1.0 - Date utilities
- js-cookie 3.0.5 - Cookie management

**UI Components:**
- @radix-ui/react-* - Headless UI components (extensive usage)
- lucide-react 0.546.0 - Icon library
- next-themes 0.4.6 - Theme switching
- sonner 2.0.7 - Toast notifications

## Configuration

**Environment:**
- Environment variables via .env.local
- Required: POSTGRES_URL, DATABASE_URL, GOOGLE_API_KEY, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY

**Build:**
- next.config.mjs - Next.js configuration with image optimization
- tsconfig.json - TypeScript configuration with strict mode disabled
- eslint.config.mjs - ESLint configuration with Next.js rules
- postcss.config.mjs - PostCSS configuration for Tailwind CSS

## Platform Requirements

**Development:**
- Node.js 18+ (recommended for Next.js 16)
- npm or yarn package manager

**Production:**
- Vercel (optimized with vercel-build script)
- Neon PostgreSQL database
- Clerk authentication service
- Google AI API access

---

*Stack analysis: 2025-01-19*