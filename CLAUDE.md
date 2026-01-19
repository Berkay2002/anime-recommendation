# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Anime Recommendation System with a Next.js frontend and Python backend for data processing. The application uses AI-powered embeddings for recommendations, PostgreSQL with pgvector for vector similarity search, and Clerk for authentication.

## Key Commands

### Frontend Development
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
```

### Backend Data Processing
```bash
cd backend
pip install -r requirements.txt    # Install Python dependencies
python migrate.py                  # Run migration scripts (MongoDB to PostgreSQL)
```

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 15 with App Router, TypeScript, React 19.2.0
- **Database**: PostgreSQL with Neon (serverless) and pgvector extension
- **Authentication**: Clerk (@clerk/nextjs)
- **Styling**: Tailwind CSS v4.1.18 with shadcn/ui components
- **AI/ML**: Google Generative AI for anime embeddings
- **External APIs**: Jikan API (MyAnimeList), AniList API

### Project Structure
```
frontend/
├── app/              # Next.js App Router (pages and API routes)
├── components/       # React components (PascalCase naming)
├── hooks/           # Custom React hooks (camelCase with "use" prefix)
├── lib/             # Utility functions and database connection
├── services/        # Business logic and external API integrations
└── public/          # Static assets

backend/
├── scripts/         # Python data processing and migration scripts
└── data/            # Supporting datasets
```

### Key Architectural Patterns

1. **API Routes**: Located in `frontend/app/api/`, handle HTTP requests and database operations
2. **Service Layer**: Business logic in `frontend/services/` for data transformation and caching
3. **Vector Embeddings**: Uses Google Generative AI to create embeddings stored in PostgreSQL with pgvector
4. **Recommendation Flow**: User selections → localStorage → API call → vector similarity search → recommendations

### Database Schema
- **anime**: Main anime data with embeddings
- **users**: Clerk-managed user data
- **user_anime**: User-anime relationships (watchlist, ratings)
- **reviews**: User reviews with ratings

## Code Conventions

### Naming Patterns
- Components: PascalCase (e.g., `AnimeCard.tsx`)
- Services: camelCase with Service suffix (e.g., `animeService.ts`)
- Hooks: camelCase with "use" prefix (e.g., `useDebounce.ts`)
- API routes: All use `route.ts` filename

### Code Style
- TypeScript with strict mode disabled
- Semicolons always used
- Double quotes for JSX, single quotes for TS/JS
- 2 spaces indentation
- ESLint configured with Next.js rules

### Import Order
1. React and Next.js imports
2. Third-party libraries
3. Internal components (`@/components`)
4. Utilities/services (`@/lib`, `@/hooks`)
5. Relative imports

## Important Implementation Notes

1. **No Test Suite**: Project currently has no automated tests
2. **Direct SQL Queries**: Uses @neondatabase/serverless instead of an ORM
3. **Vector Operations**: PostgreSQL pgvector extension handles similarity searches
4. **Caching**: Axios cache interceptor used for API responses
5. **Theme Support**: next-themes provides dark/light mode switching
6. **Form Validation**: React Hook Form with Zod schemas

## Environment Variables
Key variables needed in `.env.local`:
- `DATABASE_URL`: PostgreSQL connection string
- `GOOGLE_API_KEY`: For AI embeddings generation
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk public key
- `CLERK_SECRET_KEY`: Clerk private key
- `CRON_SECRET`: For scheduled background tasks