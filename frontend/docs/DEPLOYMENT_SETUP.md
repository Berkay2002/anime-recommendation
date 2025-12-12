# Deployment Setup Guide

## Architecture Overview

Your anime recommendation system uses a **dual-processing architecture**:

### 1. Immediate Processing (Vercel API Routes)
- **Route**: `/api/embeddings/process`
- **Purpose**: Process HIGH priority anime from user searches
- **Limit**: Max 2 anime at a time
- **Trigger**: Called automatically after search API detects new anime
- **Timeout**: 10 seconds (Vercel free tier)

### 2. Bulk Processing (GitHub Actions)
- **Workflow**: `.github/workflows/process-embeddings-queue.yml`
- **Purpose**: Process LOW priority queue items in bulk
- **Batch Size**: 50-100 anime per run
- **Schedule**: Daily at 2 AM UTC
- **Timeout**: 30 minutes
- **Manual Trigger**: Available via GitHub Actions UI

## Required Environment Variables

### For Vercel (Frontend Deployment)

Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables

Add these variables for **Production, Preview, and Development**:

1. **`DATABASE_URL`**
   - Your Neon PostgreSQL connection string
   - Format: `postgres://[user]:[password]@[host]/[database]`
   - Used by: All API routes

2. **`GOOGLE_API_KEY`**
   - Google Generative AI API key for embeddings
   - Used by: `/api/embeddings/process` route
   - Get it from: [Google AI Studio](https://makersuite.google.com/app/apikey)

3. **`NEXT_PUBLIC_API_URL`** (Optional)
   - Your deployed frontend URL
   - Used by: Client-side API calls
   - Example: `https://your-app.vercel.app`

### For GitHub Actions (Bulk Processing)

Go to GitHub Repository → Settings → Secrets and Variables → Actions

Add these **Repository Secrets**:

1. **`DATABASE_URL`**
   - Same Neon PostgreSQL connection string as Vercel
   - Used by: Python bulk processing scripts

2. **`GOOGLE_API_KEY`**
   - Same Google API key as Vercel
   - Used by: `backend/scripts/process_jikan_queue.py`

## Local Development Setup

Create `frontend/.env.local` with:

```bash
# Database connection
DATABASE_URL=postgres://[user]:[password]@[host]/[database]

# Google API for embeddings
GOOGLE_API_KEY=your-google-api-key-here

# Local API URL (for development)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**⚠️ Never commit `.env.local` to git!**

## Deployment Checklist

### Initial Setup

- [ ] Add `DATABASE_URL` to Vercel environment variables
- [ ] Add `GOOGLE_API_KEY` to Vercel environment variables
- [ ] Add `DATABASE_URL` to GitHub Actions secrets
- [ ] Add `GOOGLE_API_KEY` to GitHub Actions secrets
- [ ] Push to GitHub (triggers auto-deployment on Vercel)

### Verify Deployment

- [ ] Visit your Vercel deployment URL
- [ ] Test search functionality
- [ ] Check Vercel deployment logs for errors
- [ ] Go to GitHub Actions tab and verify the workflow is scheduled

### Test Bulk Processing

- [ ] Go to GitHub → Actions → "Process Embeddings Queue"
- [ ] Click "Run workflow" button
- [ ] Select batch size and priority
- [ ] Monitor the workflow execution
- [ ] Check database for processed embeddings

## How It Works

### User Search Flow

1. User searches for "Naruto" on frontend
2. `/api/anime/search` checks PostgreSQL first
3. If not found or stale → Fetches from Jikan API
4. New anime added to database with `sync_status = 'pending_embeddings'`
5. Anime added to `jikan_sync_queue` table with priority `'high'`
6. API automatically calls `/api/embeddings/process` (max 2 anime)
7. Embeddings generated and stored
8. `sync_status` updated to `'fresh'`
9. User sees search results immediately

### Bulk Processing Flow

1. Daily at 2 AM UTC, GitHub Actions workflow triggers
2. Python script `process_jikan_queue.py` runs
3. Fetches up to 50 unprocessed anime from `jikan_sync_queue`
4. Processes LOW priority items (or HIGH priority items older than 1 hour)
5. Generates embeddings using Google API
6. Updates database and marks items as processed
7. Removes items from queue

## Priority System

### High Priority
- User-initiated searches
- Processed immediately via Vercel API route
- Max 2 anime per request to stay within timeout
- Fallback: If timeout occurs, processed by GitHub Actions

### Low Priority
- Background sync operations
- Seasonal anime updates
- Processed in bulk by GitHub Actions
- Large batch sizes (50-100 per run)

## Monitoring & Troubleshooting

### Check Queue Status

```bash
# Via API endpoint
curl https://your-app.vercel.app/api/embeddings/process
```

Response:
```json
{
  "highPriority": 5,
  "lowPriority": 20,
  "nextHighPriority": [...],
  "nextLowPriority": [...]
}
```

### Check Vercel Logs

1. Go to Vercel Dashboard → Your Project
2. Click on "Deployments"
3. Select latest deployment
4. View "Functions" tab for API route logs

### Check GitHub Actions Logs

1. Go to GitHub Repository → Actions
2. Select "Process Embeddings Queue" workflow
3. Click on latest run
4. View logs for each step

### Common Issues

#### "DATABASE_URL not set" error
- ✅ Verify environment variable is set in Vercel
- ✅ Redeploy after adding variables
- ✅ Check spelling (case-sensitive)

#### "GOOGLE_API_KEY not configured" error
- ✅ Verify API key is valid
- ✅ Check Google AI Studio quotas
- ✅ Ensure key has necessary permissions

#### GitHub Actions workflow not running
- ✅ Check if workflow is enabled (Actions tab)
- ✅ Verify secrets are set correctly
- ✅ Check Python script permissions
- ✅ Review workflow logs for errors

#### Embeddings taking too long
- ✅ Reduce batch size in API route (currently 2)
- ✅ Increase batch size in GitHub Actions (currently 50)
- ✅ Consider upgrading Vercel plan for longer timeouts

## Cost Optimization

### Google API Usage
- Text Embedding Model 004: ~$0.00001 per 1K characters
- 50 anime * ~1K chars each = $0.0005 per bulk run
- Daily processing: ~$0.18/month (very affordable!)

### Vercel Free Tier Limits
- 100GB bandwidth/month
- 100 hours function execution/month
- 10s function timeout
- Should be sufficient for moderate traffic

### GitHub Actions Free Tier
- 2,000 minutes/month (public repos: unlimited)
- 500MB storage
- More than enough for daily embeddings processing

## Resources

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Neon PostgreSQL](https://neon.tech/docs)
- [Google Generative AI](https://ai.google.dev/docs)
- [Jikan API](https://docs.api.jikan.moe/)
