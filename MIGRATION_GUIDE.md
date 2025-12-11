# MongoDB to PostgreSQL Migration Guide

## 🎯 Overview
This guide walks you through migrating the anime recommendation system from MongoDB to PostgreSQL (Neon) with live recommendations using pgvector.

## 📋 Prerequisites

### 1. Environment Setup
Add to your `.env` file:
```bash
DATABASE_URL='postgresql://neondb_owner:...'
GOOGLE_API_KEY='your_google_api_key_here'
```

Get Google API key from: https://makersuite.google.com/app/apikey

### 2. Install Dependencies

**Frontend (Next.js):**
```bash
cd frontend
npm install
```

**Backend (Python):**
```bash
cd backend
pip install -r requirements.txt
```

## 🚀 Migration Steps

### Step 1: Database Schema (Already Completed ✅)
The PostgreSQL schema has been created with:
- `anime` table with metadata
- `anime_embeddings` table with pgvector
- Normalized `genres`, `studios`, `themes` tables
- `reviews` table
- Optimized indexes including IVFFlat for vector search

### Step 2: Migrate Data
Run the migration script to transfer anime data:

```bash
cd backend/scripts
python migrate_to_postgres.py
```

This will:
- Load data from `anime_data.json`
- Populate anime, genres, studios, themes tables
- Create relationships
- Generate full-text search vectors

### Step 3: Generate Embeddings
Generate new embeddings using Google's API:

```bash
cd backend/scripts
python generate_embeddings.py
```

This will:
- Fetch all anime from PostgreSQL
- Generate embeddings for descriptions, genres, demographics, ratings, themes
- Store embeddings in `anime_embeddings` table
- Takes ~20-30 minutes for ~16,000 anime (depends on API rate limits)

### Step 4: Update Frontend
The frontend has been updated to use PostgreSQL:
- ✅ New `postgres.ts` connection file
- ✅ Updated `animeService.ts` with SQL queries
- ✅ Live recommendations using pgvector
- ✅ Full-text search with PostgreSQL

### Step 5: Test the Application

**Start development server:**
```bash
cd frontend
npm run dev
```

**Test endpoints:**
1. Browse anime: http://localhost:3000/anime
2. Search: Use the search bar
3. Recommendations: Click any anime card

## 🔧 Key Changes

### Database Architecture
**Before (MongoDB):**
- Flat documents with embedded arrays
- Precomputed recommendations stored separately
- Regex-based search

**After (PostgreSQL):**
- Normalized schema with relations
- Live recommendations with pgvector similarity
- Full-text search with tsvector
- Proper indexing for performance

### Recommendations
**Before:**
- Offline: Computed with `compute_similarities.py`
- Stored in `recommendations` collection
- Static, needs regeneration

**After:**
- Online: Real-time with pgvector
- Weighted multi-field similarity:
  - Description: 25%
  - Genres: 25%
  - Themes: 25%
  - Demographic: 15%
  - Rating: 10%
- Always fresh, no precomputation needed

### Embeddings
**Before:**
- BERT model (local computation)
- 768 dimensions

**After:**
- Google Generative AI (`text-embedding-004`)
- 768 dimensions
- Cloud-based, no local GPU needed

## 📊 Performance Optimizations

### Indexes Created:
1. B-tree indexes on `popularity`, `rank`, `score`
2. GIN index for full-text search
3. IVFFlat index for vector similarity (fast approximate nearest neighbor)
4. Foreign key indexes for joins

### Query Optimizations:
- Batch operations with `execute_batch`
- JSON aggregation for arrays
- Efficient similarity calculation with weighted vectors

## 🧹 Cleanup Old Code

You can safely remove these MongoDB-related files:
- `backend/scripts/populate_database.py`
- `backend/scripts/compute_similarities.py`
- `backend/scripts/bert_service.py`
- `backend/scripts/generate_multifield_embeddings.py`
- `frontend/lib/mongodb.js`

## 🔍 Testing Checklist

- [ ] Run migration script successfully
- [ ] Generate embeddings without errors
- [ ] Browse anime with different sort options
- [ ] Search for anime titles
- [ ] Get recommendations for different anime
- [ ] Check page load times
- [ ] Verify search relevance
- [ ] Test recommendation accuracy

## 🐛 Troubleshooting

### Connection Issues
```bash
# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT version();"
```

### Google API Issues
```bash
# Test embeddings service
cd backend/scripts
python google_embeddings_service.py
```

### Frontend Build Issues
```bash
cd frontend
npm run build
```

## � Automatic Updates (Quarterly Sync)

The system now includes automatic quarterly updates using GitHub Actions (100% free):

### How It Works
1. **Scheduled**: Runs every quarter (Jan 1, Apr 1, Jul 1, Oct 1) at 2 AM UTC
2. **Smart Fetching**: Only fetches anime NOT already in your database
3. **Cost-Efficient**: ~500 new anime per quarter = minimal embedding costs
4. **Sources**: Current season + top popular anime from Jikan API

### Setup GitHub Actions
1. Go to your GitHub repository → Settings → Secrets and variables → Actions
2. Add secrets:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string
   - `GOOGLE_API_KEY`: Your Google API key for embeddings

3. Enable workflows:
   - Go to Actions tab
   - Enable workflows if prompted

### Manual Trigger
You can also run the sync manually:
- Go to Actions → "Quarterly Anime Sync" → Run workflow

### What Gets Synced
- Current season anime (Winter/Spring/Summer/Fall)
- Skips anime already in database (checks by title)
- Inserts new anime with all metadata (genres, themes, studios)
- **Automatically generates embeddings** for all 5 fields (description, genres, themes, demographic, rating)
- **Automatically stores embeddings** in anime_embeddings table
- 100% end-to-end automated - no manual steps needed!

### Cost Estimation
- **GitHub Actions**: FREE (2000 minutes/month on free tier)
- **Jikan API**: FREE (no auth needed)
- **Google Embeddings**: ~500 anime × 5 fields = 2,500 API calls/quarter
  - Well within free tier limits

## 📈 Next Steps

1. **Monitor syncs**: Check Actions tab after each quarterly run
2. **Optimize queries**: Add materialized views for popular queries
3. **Caching**: Implement Redis for frequently accessed data
4. **Monitoring**: Add query performance tracking
5. **Analytics**: Track recommendation click-through rates

## 🎉 Benefits

- ✅ **Live recommendations** - No more offline computation
- ✅ **Better search** - PostgreSQL full-text search
- ✅ **Scalability** - Neon's serverless architecture
- ✅ **Modern stack** - Industry-standard PostgreSQL
- ✅ **Cost-effective** - No local GPU needed for embeddings
- ✅ **Maintainable** - Cleaner normalized schema
- ✅ **Always up-to-date** - Automatic quarterly updates (100% free)
