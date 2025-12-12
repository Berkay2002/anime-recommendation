---
name: Jikan API Integration
overview: Implement hybrid Jikan API integration using TypeScript wrapper for real-time frontend searches and Python scripts for bulk syncing, with intelligent PostgreSQL caching that prioritizes data freshness. Uses hybrid embedding generation - immediate processing via API routes for urgent requests, bulk processing via GitHub Actions for queue.
todos:
  - id: db_schema_update
    content: Use Neon MCP to add last_jikan_sync, sync_status columns to anime table and create jikan_sync_queue table
    status: pending
  - id: install_deps
    content: Install @tutkli/jikan-ts and related dependencies in frontend
    status: pending
  - id: jikan_service
    content: Create jikanService.ts wrapper for TypeScript Jikan client with rate limiting
    status: pending
  - id: cache_service
    content: Create animeCacheService.ts for intelligent caching logic with freshness checks
    status: pending
  - id: search_route
    content: Update search API route to use hybrid DB + Jikan approach with smart caching
    status: pending
  - id: immediate_embeddings_route
    content: Create API route for immediate embedding generation (1-2 anime, for high-priority searches)
    status: pending
  - id: github_actions_worker
    content: Create GitHub Actions workflow for bulk queue processing (runs daily/weekly)
    status: pending
  - id: update_sync_script
    content: Update sync_seasonal_anime.py to track last_jikan_sync and sync_status
    status: pending
---

# Jikan API Integration with Intelligent Caching

## Architecture Decision

**Use BOTH wrappers in a hybrid approach:**

- **TypeScript (`@tutkli/jikan-ts`)** - For Next.js API routes handling real-time user searches
- **Python (direct requests)** - Keep existing bulk sync scripts for quarterly updates

This leverages your existing Python infrastructure while enabling real-time data fetching.

## Implementation Strategy

### 1. Install TypeScript Jikan Wrapper

Install `@tutkli/jikan-ts` in the frontend:

```bash
npm install @tutkli/jikan-ts axios axios-cache-interceptor
```

### 2. Create Jikan Service Layer (`frontend/services/jikanService.ts`)

Create a new service that:

- Wraps `@tutkli/jikan-ts` client
- Provides methods for searching anime by name
- Returns standardized anime data matching your database schema
- Handles rate limiting (Jikan allows 3 requests/second, 60 requests/minute)

Key methods:

- `searchJikanAnime(query: string)` - Search anime on Jikan
- `getJikanAnimeById(malId: number)` - Get full anime details
- `normalizeJikanData(jikanResponse)` - Convert Jikan format to your DB schema

### 3. Create Smart Caching Layer (`frontend/services/animeCacheService.ts`)

Implement intelligent caching that:

- **Checks PostgreSQL first** before querying Jikan
- **Tracks data freshness** with `last_updated` timestamp column
- **Updates stale data** (configurable threshold, e.g., 30 days)
- **Deduplicates by MAL ID** (MyAnimeList ID) which is Jikan's primary key

Cache strategy:

```
1. User searches "Naruto"
2. Check PostgreSQL for matching anime
3. If found AND fresh (< 30 days old) → Return from DB
4. If found BUT stale → Queue background refresh + Return DB data
5. If NOT found → Fetch from Jikan + Store in DB + Return
```

### 4. Database Schema Updates (Using Neon MCP)

**Use Neon MCP Server to:**

Add caching metadata to `anime` table:

- `mal_id` (already exists, ensure UNIQUE constraint)
- `last_jikan_sync` TIMESTAMP - When this anime was last fetched from Jikan
- `sync_status` TEXT CHECK (sync_status IN ('fresh', 'stale', 'pending_embeddings'))

Create new table `jikan_sync_queue`:

```sql
CREATE TABLE jikan_sync_queue (
  id SERIAL PRIMARY KEY,
  anime_id INTEGER REFERENCES anime(id) ON DELETE CASCADE,
  mal_id INTEGER NOT NULL,
  priority TEXT DEFAULT 'low' CHECK (priority IN ('high', 'low')),
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  UNIQUE(anime_id)
);
CREATE INDEX idx_sync_queue_priority ON jikan_sync_queue(priority, created_at);
```

**Priority levels:**

- `high` - User-initiated search, process immediately via API route (max 2 at a time)
- `low` - Bulk processing via GitHub Actions (process in batches)

### 5. Enhanced Search API Route (`frontend/app/api/anime/search/route.ts`)

Update the search route to:

1. Query local PostgreSQL first (fast)
2. If no results OR results are stale → Query Jikan API
3. For new anime from Jikan:

   - Insert into PostgreSQL immediately (without embeddings)
   - Add to `jikan_sync_queue` with priority `'high'` (max 2 per search)
   - Mark with `sync_status = 'pending_embeddings'`

4. Trigger immediate embedding generation for high-priority items (non-blocking)
5. Return combined results (DB + Jikan) to user
6. Anime without embeddings won't appear in recommendations until processed

### 6. Immediate Embedding API Route (`frontend/app/api/embeddings/process/route.ts`)

Create a new API route for immediate processing:

- Called automatically after search (for high-priority anime)
- Processes max 2 anime at a time (to stay under Vercel 10s timeout on free tier)
- Uses Google Embeddings API (same as Python scripts)
- Updates `sync_status` to 'fresh' when complete
- Removes from `jikan_sync_queue`

**Implementation:**

- Use `@google/generative-ai` npm package
- Match embedding logic from `backend/scripts/google_embeddings_service.py`
- Handle errors gracefully (if timeout, queue stays for GitHub Actions)

### 7. GitHub Actions Bulk Worker (`.github/workflows/process-embeddings-queue.yml`)

Create new workflow that:

- Runs daily at 2 AM UTC (or weekly)
- Uses existing Python embedding generation code
- Processes `jikan_sync_queue` where priority = 'low' OR created_at > 1 hour ago
- Batch size: 50-100 anime per run
- Updates `sync_status` and removes from queue
- Can be manually triggered via GitHub UI

### 7. Update Existing Python Sync Scripts

Modify `sync_seasonal_anime.py` to:

- Update `last_jikan_sync` timestamp
- Set `sync_status` appropriately
- Check for existing `mal_id` to avoid duplicates

### 8. Rate Limiting & Error Handling

Implement:

- **Exponential backoff** for Jikan API errors
- **Request queuing** to respect rate limits (3 req/sec)
- **Graceful fallback** to DB-only results if Jikan is down
- **Cache Jikan responses** in Redis/memory for identical searches within 5 minutes

## Key Files to Create/Modify

**New Files:**

- `frontend/services/jikanService.ts` - Jikan API client wrapper
- `frontend/services/animeCacheService.ts` - Smart caching logic
- `backend/scripts/process_jikan_queue.py` - Background worker
- `backend/migrate_add_jikan_sync.py` - Database migration

**Modified Files:**

- `frontend/app/api/anime/search/route.ts` - Enhanced search with Jikan fallback
- `frontend/services/animeService.ts` - Add cache freshness checks
- `backend/scripts/sync_seasonal_anime.py` - Update sync status tracking

## Data Freshness Strategy

**Freshness Thresholds:**

- **Core metadata** (title, genres, score) - Refresh if > 30 days old
- **Images/themes** - Refresh if > 90 days old
- **Reviews** - Refresh if > 7 days old

When returning stale data to users, queue a background refresh but don't block the response.

## Deduplication Logic

Use MAL ID as the primary deduplication key:

```sql
INSERT INTO anime (mal_id, title, ..., last_jikan_sync)
VALUES ($1, $2, ..., NOW())
ON CONFLICT (mal_id) DO UPDATE SET
  title = EXCLUDED.title,
  score = EXCLUDED.score,
  last_jikan_sync = NOW()
RETURNING id;
```

## Benefits of This Approach

✅ **Fast user experience** - PostgreSQL returns results instantly

✅ **Always fresh** - Stale data gets updated automatically

✅ **Cost-effective embeddings** - Only generate for new/missing anime

✅ **Resilient** - Works even if Jikan API is down (uses cached data)

✅ **Scalable** - Background workers handle expensive operations

✅ **No duplicate anime** - MAL ID ensures uniqueness

## No Streaming Capability

**Important:** Jikan API does NOT provide streaming links. It only provides anime metadata from MyAnimeList. If you need streaming, you would need to:

- Integrate with legal streaming APIs (Crunchyroll, Funimation, etc.)
- Or display links to external streaming sites (requires their APIs/partnerships)