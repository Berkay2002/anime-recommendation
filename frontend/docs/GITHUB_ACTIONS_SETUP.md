# GitHub Actions Setup for Embedding Generation

## Overview

This project uses GitHub Actions to automatically process anime from the `jikan_sync_queue` table and generate embeddings in the background.

## Required Secrets

You need to add the following secrets to your GitHub repository:

### 1. `DATABASE_URL`
Your PostgreSQL connection string from Neon.

**Format:**
```
postgresql://username:password@host/database?sslmode=require
```

**Get it from Neon:**
1. Go to https://console.neon.tech
2. Select your `anime-recommendation` project
3. Click "Connection Details"
4. Copy the connection string (make sure it includes the password)

### 2. `GOOGLE_API_KEY`
Your Google Generative AI API key for generating embeddings.

**Get it from:**
1. Go to https://aistudio.google.com/apikey
2. Create or copy your API key

## Adding Secrets to GitHub

### Step-by-Step Instructions:

1. **Go to your repository on GitHub**
   ```
   https://github.com/YOUR_USERNAME/anime-recommendation
   ```

2. **Navigate to Settings**
   - Click the "Settings" tab at the top of your repository

3. **Go to Secrets and Variables**
   - In the left sidebar, find "Secrets and variables"
   - Click "Actions"

4. **Add New Repository Secret**
   - Click the "New repository secret" button
   
5. **Add `DATABASE_URL`**
   - **Name:** `DATABASE_URL`
   - **Value:** Your Neon PostgreSQL connection string
   - Click "Add secret"

6. **Add `GOOGLE_API_KEY`**
   - Click "New repository secret" again
   - **Name:** `GOOGLE_API_KEY`
   - **Value:** Your Google API key
   - Click "Add secret"

## Verify Setup

After adding the secrets:

1. Go to the "Actions" tab in your repository
2. Find the "Process Embeddings Queue" workflow
3. Click "Run workflow" to manually trigger it
4. Monitor the execution to ensure it works

## How It Works

### Automatic Processing (Daily)
- **Schedule:** Runs daily at 2 AM UTC
- **What it does:** Processes up to 50 anime from the queue
- **Priority:** High-priority items first, then low-priority

### Manual Trigger
You can manually run the workflow anytime:

1. Go to GitHub Actions tab
2. Select "Process Embeddings Queue"
3. Click "Run workflow"
4. Optionally adjust:
   - **Batch size:** Number of anime to process (default: 50)
   - **Priority:** Which priority to process (all/low)

## Queue Flow

When users interact with Currently Airing or Upcoming anime:

1. **User selects anime** → Anime is inserted into database
2. **Anime is queued** → Added to `jikan_sync_queue` with priority
3. **GitHub Actions processes** → Daily job generates embeddings
4. **Embeddings stored** → Anime becomes available for recommendations
5. **User gets recommendations** → System can now recommend similar anime

### Priority Levels

- **High Priority:** Currently Airing, Upcoming anime, user-requested items
- **Low Priority:** Bulk imports, seasonal anime

## Monitoring

### Check Queue Status

Use the API endpoint to check queue status:
```bash
curl http://localhost:3000/api/queue/process
```

Or in production:
```bash
curl https://your-app.vercel.app/api/queue/process
```

### View Processing Logs

1. Go to GitHub Actions tab
2. Click on a workflow run
3. View detailed logs for each step

## Troubleshooting

### Workflow Fails

**Check secrets:**
```bash
# The workflow will fail if secrets are missing or invalid
```

**Common issues:**
- DATABASE_URL doesn't include password
- DATABASE_URL is missing `?sslmode=require`
- GOOGLE_API_KEY is invalid or expired
- Neon database is paused (free tier auto-pauses)

### No Anime Being Processed

**Check the queue:**
```sql
SELECT COUNT(*) FROM jikan_sync_queue WHERE processed_at IS NULL;
```

**Manually add to queue:**
```sql
INSERT INTO jikan_sync_queue (anime_id, mal_id, priority)
VALUES (1007, 52807, 'high');
```

## Alternative: Vercel Cron Jobs

If you prefer to use Vercel Cron Jobs instead of GitHub Actions:

1. **Create `vercel.json` in the root:**
```json
{
  "crons": [
    {
      "path": "/api/queue/process",
      "schedule": "0 2 * * *"
    }
  ]
}
```

2. **Add environment variables to Vercel:**
   - Go to your Vercel project settings
   - Add `DATABASE_URL` and `GOOGLE_API_KEY`

3. **Deploy to production**

**Note:** Vercel Cron Jobs are only available on Pro plans and only work in production.

## Current Queue Status

Check your current queue:

```sql
-- View pending items
SELECT 
  jsq.id,
  jsq.anime_id,
  jsq.mal_id,
  jsq.priority,
  jsq.created_at,
  a.title,
  a.sync_status
FROM jikan_sync_queue jsq
LEFT JOIN anime a ON jsq.anime_id = a.anime_id
WHERE jsq.processed_at IS NULL
ORDER BY 
  CASE jsq.priority WHEN 'high' THEN 1 WHEN 'low' THEN 2 END,
  jsq.created_at ASC;
```

## Summary

✅ **Queue is working** - Anime from Currently Airing/Upcoming are now automatically queued
✅ **GitHub Actions workflow exists** - Ready to process the queue
⚠️ **Secrets needed** - Add `DATABASE_URL` and `GOOGLE_API_KEY` to GitHub
🚀 **Manual trigger available** - Use `/api/queue/process` endpoint or GitHub Actions UI

Once secrets are added, the system will automatically generate embeddings for newly added anime!
