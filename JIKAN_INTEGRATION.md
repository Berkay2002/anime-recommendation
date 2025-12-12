# Jikan API Integration - Implementation Complete ✅

## Overview

This implementation provides intelligent caching and real-time anime data fetching using the Jikan API (MyAnimeList data), with a hybrid approach combining TypeScript (for real-time searches) and Python (for bulk syncing).

## Architecture

### Components

1. **TypeScript Services** (Frontend)
   - `jikanService.ts` - Jikan API wrapper with rate limiting
   - `animeCacheService.ts` - Smart caching layer with PostgreSQL
   - Enhanced search API route with automatic fallback

2. **Database Schema**
   - `anime` table: Added `mal_id`, `last_jikan_sync`, `sync_status` columns
   - `jikan_sync_queue` table: Queue for embedding generation

3. **Background Processing**
   - `process_jikan_queue.py` - Processes queue and generates embeddings
   - GitHub Actions workflow - Runs daily at 2 AM UTC

4. **Python Sync Scripts** (Updated)
   - `sync_seasonal_anime.py` - Fetches seasonal anime
   - `sync_new.py` - Fetches new popular anime

## How It Works

### Search Flow

```
1. User searches "Naruto"
   ↓
2. Check PostgreSQL first (FAST)
   ↓
3. If found AND fresh (< 30 days) → Return from DB
   ↓
4. If NOT found OR stale → Query Jikan API
   ↓
5. Store new anime in DB with sync_status='pending_embeddings'
   ↓
6. Add to jikan_sync_queue (priority='high', max 2 per search)
   ↓
7. Trigger background embedding generation (non-blocking)
   ↓
8. Return results immediately to user
```

### Caching Strategy

- **Fresh data**: < 30 days old
- **Stale data**: > 30 days old (returns stale data but queues refresh)
- **Missing data**: Fetches from Jikan and stores immediately

### Embedding Generation

**High Priority** (User-initiated searches):
- Max 2 anime per search
- Processed immediately via `/api/embeddings/process`
- Timeout: 10 seconds (Vercel free tier limit)

**Low Priority** (Bulk syncs):
- Daily GitHub Actions workflow at 2 AM UTC
- Batch size: 50-100 anime per run
- Processes `process_jikan_queue.py` script

## API Routes

### 1. Search with Caching

```bash
GET /api/anime/search?q=naruto&limit=10
```

**Response:**
```json
[
  {
    "anime_id": 1,
    "mal_id": 20,
    "title": "Naruto",
    "english_title": "Naruto",
    "description": "...",
    "image_url": "...",
    "score": 7.99,
    "genres": ["Action", "Adventure"],
    "sync_status": "fresh",
    "last_jikan_sync": "2025-12-11T23:00:00Z"
  }
]
```

### 2. Embedding Queue Status

```bash
GET /api/embeddings/process
```

**Response:**
```json
{
  "highPriority": 5,
  "lowPriority": 120,
  "nextHighPriority": [
    { "anime_id": 123, "mal_id": 456 }
  ]
}
```

### 3. Process Embeddings

```bash
POST /api/embeddings/process
Content-Type: application/json

{
  "animeIds": [123, 456]
}
```

## Database Schema

### anime table (additions)

```sql
ALTER TABLE anime 
  ADD COLUMN mal_id INTEGER UNIQUE,
  ADD COLUMN last_jikan_sync TIMESTAMP,
  ADD COLUMN sync_status TEXT DEFAULT 'fresh' 
    CHECK (sync_status IN ('fresh', 'stale', 'pending_embeddings'));
```

### jikan_sync_queue table

```sql
CREATE TABLE jikan_sync_queue (
  id SERIAL PRIMARY KEY,
  anime_id INTEGER REFERENCES anime(anime_id) ON DELETE CASCADE,
  mal_id INTEGER NOT NULL,
  priority TEXT DEFAULT 'low' CHECK (priority IN ('high', 'low')),
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  UNIQUE(anime_id)
);
```

## Rate Limiting

Jikan API limits:
- **3 requests/second**
- **60 requests/minute**

Implementation:
- Automatic throttling in `jikanService.ts`
- Request queue with exponential backoff
- 5-minute response caching via `axios-cache-interceptor`

## Python Scripts

### 1. Process Queue (New)

```bash
cd backend/scripts
python process_jikan_queue.py
```

Environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_API_KEY` - For embedding generation
- `BATCH_SIZE` (optional) - Default: 50
- `PRIORITY` (optional) - 'all', 'high', or 'low'

### 2. Sync Seasonal Anime (Updated)

```bash
cd backend/scripts
python sync_seasonal_anime.py
```

Changes:
- Now uses `mal_id` for deduplication
- Sets `sync_status='pending_embeddings'`
- Adds anime to `jikan_sync_queue` instead of generating embeddings immediately

### 3. Sync New Anime (Updated)

```bash
cd backend/scripts
python sync_new.py
```

Same changes as sync_seasonal_anime.py

## GitHub Actions

### Process Embeddings Queue

**File:** `.github/workflows/process-embeddings-queue.yml`

**Schedule:** Daily at 2 AM UTC

**Manual Trigger:**
```bash
# Via GitHub UI or CLI
gh workflow run process-embeddings-queue.yml \
  --field batch_size=100 \
  --field priority=all
```

## Environment Variables

### Frontend (.env.local)

```env
# Database
POSTGRES_URL=postgresql://...
POSTGRES_PRISMA_URL=postgresql://...
POSTGRES_URL_NON_POOLING=postgresql://...

# Google API (for embeddings)
GOOGLE_API_KEY=your_google_api_key

# App URL (for background requests)
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # or production URL
```

### Backend (.env)

```env
DATABASE_URL=postgresql://...
GOOGLE_API_KEY=your_google_api_key
```

## Installation

### 1. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
pip install -r requirements.txt
```

### 2. Run Database Migrations

The migrations have already been applied via Neon MCP:
- ✅ Added `mal_id`, `last_jikan_sync`, `sync_status` to anime table
- ✅ Created `jikan_sync_queue` table with indexes

### 3. Start Development

```bash
# Frontend
cd frontend
npm run dev

# Process queue manually (optional)
cd backend/scripts
python process_jikan_queue.py
```

## Usage Examples

### Search Anime

```javascript
// Frontend component
const SearchComponent = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const search = async () => {
    const res = await fetch(`/api/anime/search?q=${query}`);
    const data = await res.json();
    setResults(data);
  };

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <button onClick={search}>Search</button>
      
      {results.map(anime => (
        <div key={anime.anime_id}>
          <h3>{anime.title}</h3>
          <p>{anime.description}</p>
          <span>Status: {anime.sync_status}</span>
        </div>
      ))}
    </div>
  );
};
```

### Check Queue Status

```bash
curl http://localhost:3000/api/embeddings/process
```

### Manually Process Embeddings

```bash
curl -X POST http://localhost:3000/api/embeddings/process \
  -H "Content-Type: application/json" \
  -d '{"animeIds": [123, 456]}'
```

## Monitoring

### Queue Status

```sql
-- Check pending items
SELECT priority, COUNT(*) 
FROM jikan_sync_queue 
WHERE processed_at IS NULL 
GROUP BY priority;

-- Check recent processing
SELECT * 
FROM jikan_sync_queue 
WHERE processed_at > NOW() - INTERVAL '1 day' 
ORDER BY processed_at DESC;
```

### Sync Status

```sql
-- Check sync status distribution
SELECT sync_status, COUNT(*) 
FROM anime 
GROUP BY sync_status;

-- Find stale anime
SELECT anime_id, title, last_jikan_sync 
FROM anime 
WHERE last_jikan_sync < NOW() - INTERVAL '30 days' 
   OR last_jikan_sync IS NULL;
```

## Troubleshooting

### Issue: Embeddings not generating

**Solution:**
1. Check queue: `GET /api/embeddings/process`
2. Manually trigger: `python process_jikan_queue.py`
3. Check logs for errors
4. Verify `GOOGLE_API_KEY` is set

### Issue: Rate limiting errors

**Solution:**
- Jikan API has strict rate limits
- Wait 60 seconds if you hit 429 errors
- The implementation handles this automatically

### Issue: Duplicate anime

**Solution:**
- The `mal_id` column has a UNIQUE constraint
- Duplicates are automatically handled via `ON CONFLICT` clauses
- Check for anime without `mal_id` values

## Benefits

✅ **Fast user experience** - PostgreSQL returns results instantly

✅ **Always fresh** - Stale data gets updated automatically in background

✅ **Cost-effective embeddings** - Only generate for new/missing anime

✅ **Resilient** - Works even if Jikan API is down (uses cached data)

✅ **Scalable** - Background workers handle expensive operations

✅ **No duplicate anime** - MAL ID ensures uniqueness

## Next Steps

1. **Add monitoring dashboard** - Visualize queue status and sync health
2. **Implement webhook** - Get notified when embeddings complete
3. **Add retry logic** - For failed embedding generations
4. **Optimize batch sizes** - Based on API quotas and processing time
5. **Add caching layer** - Redis for frequently searched terms

## References

- [Jikan API Documentation](https://docs.api.jikan.moe/)
- [Jikan TypeScript Client](https://www.npmjs.com/package/@tutkli/jikan-ts)
- [Google Embeddings API](https://ai.google.dev/docs/embeddings_guide)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
