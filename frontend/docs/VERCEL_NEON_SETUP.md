# Vercel + Neon Database Setup

## Overview
This project uses **Vercel** for hosting (serverless functions, edge runtime, cron jobs) and **Neon** as the PostgreSQL database.

## Database Connection

### Environment Variable
All database connections use `DATABASE_URL` from `.env.local`:
```
DATABASE_URL=postgres://[user]:[password]@[host]/[database]
```

### Database Client
The project uses `@vercel/postgres` which:
- ✅ Connects to Neon via `DATABASE_URL`
- ✅ Supports serverless functions
- ✅ Supports edge runtime
- ✅ Works with Vercel cron jobs
- ✅ Provides connection pooling
- ✅ Handles serverless timeout management

### Usage Patterns

#### Pattern 1: Tagged Template (New Code)
```typescript
import { sql } from '@vercel/postgres';

const result = await sql`
  SELECT * FROM anime 
  WHERE anime_id = ${animeId}
`;
```

#### Pattern 2: Function-based (Legacy Code - Still Supported)
```typescript
import { sql } from '../lib/postgres';

const result = await sql(
  'SELECT * FROM anime WHERE anime_id = $1',
  [animeId]
);
```

## Vercel Cron Jobs

### Setup
1. Create a cron job API route in `app/api/cron/[job-name]/route.ts`
2. Configure schedule in `vercel.json`

### Example: Daily Embeddings Queue Processor

**File: `app/api/cron/process-embeddings/route.ts`**
```typescript
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const runtime = 'nodejs'; // or 'edge' for edge runtime
export const maxDuration = 300; // 5 minutes (adjust based on your Vercel plan)

export async function GET(request: Request) {
  // Verify cron secret (Vercel sends this)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get pending items from queue
    const pending = await sql`
      SELECT anime_id, mal_id 
      FROM jikan_sync_queue 
      WHERE processed_at IS NULL 
      AND priority = 'high'
      ORDER BY created_at ASC 
      LIMIT 10
    `;

    // Process each item
    let processed = 0;
    for (const item of pending.rows) {
      // Call your processing logic
      await fetch(`${process.env.VERCEL_URL}/api/embeddings/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animeIds: [item.anime_id] }),
      });
      processed++;
    }

    return NextResponse.json({ 
      success: true, 
      processed,
      message: `Processed ${processed} anime embeddings` 
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ 
      error: 'Failed to process embeddings',
      details: error.message 
    }, { status: 500 });
  }
}
```

**File: `vercel.json`**
```json
{
  "crons": [
    {
      "path": "/api/cron/process-embeddings",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Cron Schedule Format
- `"0 2 * * *"` - Daily at 2 AM UTC
- `"0 */6 * * *"` - Every 6 hours
- `"*/30 * * * *"` - Every 30 minutes
- `"0 0 * * 0"` - Weekly on Sunday at midnight

### Security
Add to `.env.local`:
```
CRON_SECRET=your-random-secret-key
```

And in Vercel dashboard, add the same `CRON_SECRET` environment variable.

## Edge Runtime Support

For API routes that need edge runtime (faster cold starts, global distribution):

```typescript
export const runtime = 'edge';

export async function GET() {
  const result = await sql`SELECT * FROM anime LIMIT 10`;
  return Response.json(result.rows);
}
```

**Note:** Edge runtime has some limitations:
- No Node.js APIs (fs, crypto, etc.)
- Limited npm packages
- But it's much faster and globally distributed!

## Current Setup Summary

### Files Using Database
- ✅ `services/animeService.ts` - Main anime data service
- ✅ `services/animeCacheService.ts` - Jikan API cache layer
- ✅ `app/api/embeddings/process/route.ts` - Embedding generation
- ✅ All API routes in `app/api/anime/*`

### Runtime Configuration
- API routes use `runtime = 'nodejs'` for full Node.js support
- Database connections are lazy-loaded (no build-time errors)
- Connection pooling handled by `@vercel/postgres`

## Benefits of This Setup

1. **Serverless-first**: No persistent connections needed
2. **Auto-scaling**: Handles traffic spikes automatically
3. **Global edge**: Can deploy to edge locations
4. **Cost-effective**: Pay only for what you use
5. **Neon integration**: Automatic connection pooling and scaling
6. **Cron jobs**: Built-in scheduled tasks support

## Troubleshooting

### "DATABASE_URL not set" during build
✅ **Fixed** - Database connections are now lazy-loaded

### Connection timeout errors
- Increase `maxDuration` in route config
- Check Neon connection pool settings
- Verify DATABASE_URL is correct

### Cron jobs not running
- Verify `CRON_SECRET` matches in both places
- Check Vercel deployment logs
- Ensure cron path matches exactly

## Resources
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Neon Documentation](https://neon.tech/docs)
- [Edge Runtime](https://vercel.com/docs/functions/edge-functions)
