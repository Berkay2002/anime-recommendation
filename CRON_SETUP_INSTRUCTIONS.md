# Cron Job Setup Instructions

## ✅ Files Created

1. **`frontend/app/api/cron/process-embeddings/route.ts`** - Cron endpoint that processes the embeddings queue
2. **`frontend/vercel.json`** - Vercel configuration with cron schedule

## 🔑 Your Generated CRON_SECRET

```
0b46eec9cb481f1a78eb175156c296de7864ad71578392bb4e24529cbb2337d0
```

**⚠️ IMPORTANT: Keep this secret secure! Do not commit it to git.**

## 📝 Setup Steps

### Step 1: Add Environment Variables Locally

Add the following to your `frontend/.env.local` file:

```bash
# Database connection (you already have this)
DATABASE_URL=postgres://[user]:[password]@[host]/[database]

# Cron job security
CRON_SECRET=0b46eec9cb481f1a78eb175156c296de7864ad71578392bb4e24529cbb2337d0

# Google API key for embeddings (if you don't have it yet)
GOOGLE_API_KEY=your-google-api-key-here
```

### Step 2: Add Environment Variables to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **anime-recommendation** project
3. Navigate to **Settings** → **Environment Variables**
4. Add these three variables:

   **Variable 1:**
   - Name: `DATABASE_URL`
   - Value: Your Neon PostgreSQL connection string
   - Environment: ✅ Production, ✅ Preview, ✅ Development

   **Variable 2:**
   - Name: `CRON_SECRET`
   - Value: `0b46eec9cb481f1a78eb175156c296de7864ad71578392bb4e24529cbb2337d0`
   - Environment: ✅ Production, ✅ Preview, ✅ Development

   **Variable 3:**
   - Name: `GOOGLE_API_KEY`
   - Value: Your Google API key for embeddings
   - Environment: ✅ Production, ✅ Preview, ✅ Development

5. Click **Save** for each variable

### Step 3: Deploy to Vercel

After adding the environment variables, deploy your changes:

```bash
# Option 1: Push to git (Vercel will auto-deploy)
git add .
git commit -m "feat: add Vercel cron job for embeddings processing"
git push origin master

# Option 2: Manual deployment via Vercel CLI
cd frontend
vercel --prod
```

### Step 4: Verify Cron Job Setup

After deployment:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Crons**
3. You should see: **`/api/cron/process-embeddings`** scheduled for `0 2 * * *` (Daily at 2 AM UTC)
4. You can manually trigger it for testing by clicking the "Run" button

## 🕐 Cron Schedule

The cron job is configured to run **daily at 2:00 AM UTC**

Schedule format: `0 2 * * *`
- `0` = Minute (0th minute)
- `2` = Hour (2 AM)
- `*` = Day of month (every day)
- `*` = Month (every month)
- `*` = Day of week (every day)

### Alternative Schedules

If you want to change the schedule, edit `frontend/vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-embeddings",
      "schedule": "0 2 * * *"  // Change this line
    }
  ]
}
```

**Common schedules:**
- `"0 2 * * *"` - Daily at 2 AM UTC (current setting)
- `"0 */6 * * *"` - Every 6 hours
- `"*/30 * * * *"` - Every 30 minutes
- `"0 0 * * 0"` - Weekly on Sunday at midnight
- `"0 0 1 * *"` - Monthly on the 1st at midnight

## 🎯 What the Cron Job Does

The cron job automatically:
1. Checks the `jikan_sync_queue` table for unprocessed anime
2. Prioritizes high-priority items first
3. Processes up to 10 anime per run (in batches of 2)
4. Generates embeddings for each anime (description, genres, themes, etc.)
5. Stores embeddings in the `anime_embeddings` table
6. Marks items as processed in the queue

## 🧪 Testing the Cron Job Locally

You can test the cron endpoint locally:

```bash
# Start your dev server
cd frontend
npm run dev

# In another terminal, test the endpoint
curl -X GET http://localhost:3000/api/cron/process-embeddings \
  -H "Authorization: Bearer 0b46eec9cb481f1a78eb175156c296de7864ad71578392bb4e24529cbb2337d0"
```

You should see a JSON response with the processing results.

## 📊 Monitoring

### Check Cron Job Execution

1. Go to Vercel Dashboard → Your Project
2. Click on **Deployments**
3. Look for cron job executions in the **Functions** tab
4. Check logs for any errors

### Check Queue Status

Visit this endpoint to see queue status:
```
https://your-app.vercel.app/api/embeddings/process
```

This GET endpoint returns:
```json
{
  "highPriority": 5,
  "lowPriority": 20,
  "nextHighPriority": [...],
  "nextLowPriority": [...]
}
```

## 🔒 Security

The cron endpoint is protected by the `CRON_SECRET`:
- Vercel automatically adds the `Authorization: Bearer ${CRON_SECRET}` header when calling cron jobs
- The endpoint rejects requests without the correct secret
- Never expose this secret in client-side code

## ⚠️ Limitations

- **Vercel Free Tier**: 10-second function timeout (upgrade for longer)
- **Pro Tier**: 60-second timeout
- **Enterprise**: Up to 900 seconds (15 minutes)

The current setup processes 2 anime at a time to stay within timeout limits.

## 🆘 Troubleshooting

### Cron job not running
- Verify `CRON_SECRET` is set correctly in Vercel
- Check that `vercel.json` is in the frontend directory
- Redeploy after changes

### "Unauthorized" error
- Ensure `CRON_SECRET` matches exactly in both `.env.local` and Vercel
- No extra spaces or quotes around the secret

### Timeout errors
- Reduce the batch size in the cron route (currently 2)
- Reduce the `LIMIT` in the SQL query (currently 10)
- Upgrade your Vercel plan for longer timeouts

### Database connection errors
- Verify `DATABASE_URL` is correct in Vercel
- Check Neon database is running and accessible
- Review connection pool settings

## 📚 Resources

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)
- [Vercel Functions Documentation](https://vercel.com/docs/functions)
- [Cron Expression Format](https://crontab.guru/)
