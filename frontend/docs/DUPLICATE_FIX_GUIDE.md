# Duplicate Anime Entries - Fix Guide

## Problem Summary

Your database contains **duplicate anime entries** due to how the UNIQUE constraint and upsert logic work:

### Current Stats (from Neon database):
- **Total anime entries**: 1,073
- **With MAL IDs**: 69 (from Jikan API syncs)
- **Without MAL IDs**: 1,004 (from original migration)
- **Duplicate titles found**: At least 16 (likely more)

### Example Duplicate:
- `anime_id 1000`: "One Punch Man 3", `mal_id=NULL` (old entry, never synced with Jikan)
- `anime_id 1007`: "One Punch Man 3", `mal_id=52807` (new entry, synced from Jikan API on 2025-12-12)

## Root Cause

1. **UNIQUE constraint is only on `mal_id`, not on `title`**
   - PostgreSQL's UNIQUE constraint allows multiple NULL values
   - NULL ≠ NULL in SQL (NULLs are not considered equal)

2. **Upsert logic uses `ON CONFLICT (mal_id)`**
   - This only works when `mal_id` is NOT NULL
   - When Jikan API syncs anime with MAL IDs, it can't match existing entries that have NULL `mal_id`
   - Result: New row is inserted instead of updating existing entry

3. **Original migration didn't populate MAL IDs**
   - 1,004 entries have NULL `mal_id` values
   - When Jikan syncs these same anime (by title), it creates duplicates

## Affected Duplicates

Here are some of the duplicate titles found:

| Title | Count | Anime IDs | MAL IDs |
|-------|-------|-----------|---------|
| One Punch Man 3 | 2 | 1000, 1007 | NULL, 52807 |
| Spy x Family Season 3 | 2 | 1001, 1005 | NULL, 59027 |
| Boku no Hero Academia: Final Season | 2 | 1002, 1006 | NULL, 60098 |
| Fumetsu no Anata e Season 3 | 2 | 1003, 1004 | NULL, 54703 |
| One Piece | 2 | 50, 1453 | NULL, 21 |
| One Punch Man | 2 | 132, 1451 | NULL, 30276 |
| Mob Psycho 100 | 2 | 134, 1455 | NULL, 32182 |
| Mob Psycho 100 II | 2 | 33, 1459 | NULL, 37510 |

## Solution Implemented

### 1. **Duplicate Fixing Script** (`backend/scripts/fix_duplicates.py`)

Run this script to merge existing duplicates:

```bash
cd backend/scripts
python fix_duplicates.py
```

**What it does:**
- Finds all anime titles that appear more than once
- For each duplicate set:
  - Keeps the entry with a MAL ID (more authoritative data from Jikan API)
  - Migrates all relationships from duplicates to the kept entry:
    - Genres
    - Studios
    - Themes
    - Embeddings
    - Queue entries
  - Deletes the duplicate entries

**Safe to run:**
- Uses transactions (rollback on error)
- Logs all actions
- Won't delete data without migrating relationships first

### 2. **Prevention Logic** (Already Implemented)

Updated both frontend and backend upsert logic to prevent future duplicates:

#### Frontend (`frontend/services/animeCacheService.ts`):
```typescript
// Before inserting, check if title exists with NULL mal_id
const existingCheck = await sql`
  SELECT anime_id FROM anime 
  WHERE title = ${anime.title} AND mal_id IS NULL
  LIMIT 1
`;

if (existingCheck.rows.length > 0 && anime.mal_id) {
  // Update existing entry with the MAL ID instead of creating duplicate
  // ...
}
```

#### Backend (`backend/scripts/sync_seasonal_anime.py`):
```python
# Check for duplicate with same title but NULL mal_id
cur.execute("""
    SELECT anime_id FROM anime 
    WHERE title = %s AND mal_id IS NULL
    LIMIT 1
""", (anime['title'],))

existing = cur.fetchone()

if existing:
    # Update existing entry instead of inserting
    # ...
```

## How to Fix

### Step 1: Run the Fix Script

```bash
# Navigate to backend scripts directory
cd backend/scripts

# Run the duplicate fixer
python fix_duplicates.py
```

**Expected output:**
```
============================================================
Fix Duplicate Anime Entries
============================================================
✅ Connected to database

Searching for duplicates...
📝 Found 16 duplicate titles

============================================================
Title: One Punch Man 3
Count: 2
Anime IDs: 1000, 1007
MAL IDs: NULL, 52807

  Keep: anime_id=1007, mal_id=52807
  Remove: anime_id=1000, mal_id=None
    ✅ Merged anime_id 1000 into 1007

... (continues for all duplicates) ...

============================================================
✅ Duplicate fixing completed!
   Merged: 16 duplicates
============================================================
```

### Step 2: Verify Results

Check that duplicates are gone:

```bash
# Count anime before and after
SELECT COUNT(*) FROM anime;

# Check for remaining duplicates
SELECT title, COUNT(*) as count 
FROM anime 
GROUP BY title 
HAVING COUNT(*) > 1;
```

### Step 3: Monitor Future Syncs

The prevention logic is now in place. Future Jikan API syncs will:
- Check if anime title exists with NULL mal_id
- Update that entry instead of creating a new one
- No more duplicates will be created

## Database Schema Improvements (Optional)

Consider adding a UNIQUE constraint on title to enforce uniqueness at the database level:

```sql
-- Option 1: Add UNIQUE constraint on title (prevents any duplicate titles)
ALTER TABLE anime ADD CONSTRAINT anime_title_unique UNIQUE (title);

-- Option 2: Add partial UNIQUE index (allows NULLs for mal_id but prevents duplicate titles)
CREATE UNIQUE INDEX anime_title_unique_idx ON anime(title);
```

**⚠️ Warning:** Only add these constraints AFTER running the fix script to remove existing duplicates.

## Testing

After running the fix script, test the prevention logic:

1. Try syncing an anime that exists (should update, not create duplicate)
2. Check that relationships are preserved
3. Verify embeddings are maintained

## Summary

- ✅ **Fixed:** Created script to merge existing duplicates
- ✅ **Prevented:** Updated upsert logic to check for title+NULL mal_id before inserting
- ✅ **Documented:** This guide explains the issue and solution
- 🔄 **Next:** Run `fix_duplicates.py` to clean up existing duplicates

## Need Help?

If you encounter issues:
1. Check the script logs for specific error messages
2. Verify database connectivity
3. Ensure you have necessary permissions (INSERT, UPDATE, DELETE)
4. The script uses transactions, so errors won't corrupt data
