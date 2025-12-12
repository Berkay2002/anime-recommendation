"""
Quarterly sync script for fetching new popular/seasonal anime
Only fetches anime not already in the database to minimize embedding costs
"""

import os
import sys
import time
import requests
import psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv
from google_embeddings_service import get_embeddings_batch, prepare_text_for_embedding

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in environment variables")

JIKAN_BASE_URL = "https://api.jikan.moe/v4"

def get_existing_mal_ids():
    """Get all MAL IDs already in the database to avoid duplicates"""
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    cur.execute("SELECT mal_id FROM anime WHERE mal_id IS NOT NULL")
    existing_ids = set(row[0] for row in cur.fetchall())
    
    cur.close()
    conn.close()
    
    print(f"Found {len(existing_ids)} anime already in database")
    return existing_ids

def get_existing_titles():
    """Get all anime titles already in the database to avoid duplicates"""
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    cur.execute("SELECT LOWER(title), LOWER(english_title), LOWER(japanese_title) FROM anime")
    existing_titles = set()
    for row in cur.fetchall():
        for title in row:
            if title:
                existing_titles.add(title.strip())
    
    cur.close()
    conn.close()
    
    print(f"Found {len(existing_titles)} unique titles already in database")
    return existing_titles

def fetch_top_anime(limit=10000):
    """Fetch top anime from Jikan API (by popularity/score)"""
    anime_list = []
    existing_ids = get_existing_mal_ids()
    page = 1
    fetched = 0
    new_count = 0
    
    print(f"\nFetching top anime from Jikan (target: {limit} total, skipping existing)...")
    
    while fetched < limit:
        try:
            # Fetch by popularity (most relevant for recommendations)
            response = requests.get(
                f"{JIKAN_BASE_URL}/top/anime",
                params={
                    "page": page,
                    "limit": 25  # Max per page
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                items = data.get('data', [])
                
                if not items:
                    print("No more anime available")
                    break
                
                for item in items:
                    fetched += 1
                    mal_id = item.get('mal_id')
                    
                    # Skip if already in database
                    if mal_id in existing_ids:
                        continue
                    
                    # Skip if no title
                    title = item.get('title') or item.get('title_english')
                    if not title:
                        continue
                    
                    anime_data = {
                        'mal_id': mal_id,
                        'title': title,
                        'title_english': item.get('title_english'),
                        'title_japanese': item.get('title_japanese'),
                        'type': item.get('type'),
                        'episodes': item.get('episodes'),
                        'status': item.get('status'),
                        'aired_from': item.get('aired', {}).get('from'),
                        'aired_to': item.get('aired', {}).get('to'),
                        'duration': item.get('duration'),
                        'rating': item.get('rating'),
                        'score': item.get('score'),
                        'scored_by': item.get('scored_by'),
                        'rank': item.get('rank'),
                        'popularity': item.get('popularity'),
                        'members': item.get('members'),
                        'favorites': item.get('favorites'),
                        'synopsis': item.get('synopsis'),
                        'background': item.get('background'),
                        'season': item.get('season'),
                        'year': item.get('year'),
                        'source': item.get('source'),
                        'image_url': item.get('images', {}).get('jpg', {}).get('large_image_url'),
                        'genres': [g['name'] for g in item.get('genres', [])],
                        'themes': [t['name'] for t in item.get('themes', [])],
                        'demographics': [d['name'] for d in item.get('demographics', [])],
                        'studios': [s['name'] for s in item.get('studios', [])]
                    }
                    
                    anime_list.append(anime_data)
                    new_count += 1
                
                print(f"Page {page}: Fetched {len(items)} anime, {new_count} new ones added")
                page += 1
                
                # Respect rate limit (3 req/sec)
                time.sleep(0.4)
            else:
                print(f"Error fetching page {page}: {response.status_code}")
                if response.status_code == 429:  # Rate limited
                    print("Rate limited, waiting 60 seconds...")
                    time.sleep(60)
                else:
                    break
                    
        except Exception as e:
            print(f"Error on page {page}: {e}")
            break
    
    print(f"\nFetched {new_count} new anime (skipped {fetched - new_count} existing)")
    return anime_list

def fetch_seasonal_anime(year, season):
    """Fetch anime from a specific season"""
    anime_list = []
    existing_ids = get_existing_mal_ids()
    page = 1
    new_count = 0
    
    print(f"\nFetching {season} {year} anime...")
    
    while True:
        try:
            response = requests.get(
                f"{JIKAN_BASE_URL}/seasons/{year}/{season}",
                params={"page": page, "limit": 25}
            )
            
            if response.status_code == 200:
                data = response.json()
                items = data.get('data', [])
                
                if not items:
                    break
                
                for item in items:
                    mal_id = item.get('mal_id')
                    
                    if mal_id in existing_ids:
                        continue
                    
                    title = item.get('title') or item.get('title_english')
                    if not title:
                        continue
                    
                    anime_data = {
                        'mal_id': mal_id,
                        'title': title,
                        'title_english': item.get('title_english'),
                        'title_japanese': item.get('title_japanese'),
                        'type': item.get('type'),
                        'episodes': item.get('episodes'),
                        'status': item.get('status'),
                        'aired_from': item.get('aired', {}).get('from'),
                        'aired_to': item.get('aired', {}).get('to'),
                        'duration': item.get('duration'),
                        'rating': item.get('rating'),
                        'score': item.get('score'),
                        'scored_by': item.get('scored_by'),
                        'rank': item.get('rank'),
                        'popularity': item.get('popularity'),
                        'members': item.get('members'),
                        'favorites': item.get('favorites'),
                        'synopsis': item.get('synopsis'),
                        'background': item.get('background'),
                        'season': season,
                        'year': year,
                        'source': item.get('source'),
                        'image_url': item.get('images', {}).get('jpg', {}).get('large_image_url'),
                        'genres': [g['name'] for g in item.get('genres', [])],
                        'themes': [t['name'] for t in item.get('themes', [])],
                        'demographics': [d['name'] for d in item.get('demographics', [])],
                        'studios': [s['name'] for s in item.get('studios', [])]
                    }
                    
                    anime_list.append(anime_data)
                    new_count += 1
                
                print(f"Page {page}: Found {new_count} new anime")
                page += 1
                time.sleep(0.4)
            else:
                break
                
        except Exception as e:
            print(f"Error fetching seasonal anime: {e}")
            break
    
    print(f"Fetched {new_count} new seasonal anime")
    return anime_list

def insert_anime_batch(anime_list):
    """Insert new anime into database and generate embeddings"""
    if not anime_list:
        print("No new anime to insert")
        return
    
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        # Get or create genres, studios, themes, demographics
        all_genres = set()
        all_studios = set()
        all_themes = set()
        all_demographics = set()
        
        for anime in anime_list:
            all_genres.update(anime.get('genres', []))
            all_studios.update(anime.get('studios', []))
            all_themes.update(anime.get('themes', []))
            all_demographics.update(anime.get('demographics', []))
        
        # Insert and get IDs
        genre_map = {}
        for genre in all_genres:
            cur.execute(
                "INSERT INTO genres (name) VALUES (%s) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING genre_id, name",
                (genre,)
            )
            gid, gname = cur.fetchone()
            genre_map[gname] = gid
        
        studio_map = {}
        for studio in all_studios:
            cur.execute(
                "INSERT INTO studios (name) VALUES (%s) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING studio_id, name",
                (studio,)
            )
            sid, sname = cur.fetchone()
            studio_map[sname] = sid
        
        theme_map = {}
        for theme in all_themes:
            cur.execute(
                "INSERT INTO themes (name) VALUES (%s) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING theme_id, name",
                (theme,)
            )
            tid, tname = cur.fetchone()
            theme_map[tname] = tid
        
        conn.commit()
        print(f"Prepared {len(genre_map)} genres, {len(studio_map)} studios, {len(theme_map)} themes")
        
        # Insert anime
        anime_ids = []
        for anime in anime_list:
            # Prepare premiered field (season + year)
            premiered = None
            if anime.get('season') and anime.get('year'):
                premiered = f"{anime['season'].capitalize()} {anime['year']}"
            
            # Prepare synonyms (title_synonyms joined)
            synonyms = ', '.join(anime.get('title_synonyms', []))
            
            # Check for duplicate with same title but NULL mal_id
            cur.execute("""
                SELECT anime_id FROM anime 
                WHERE title = %s AND mal_id IS NULL
                LIMIT 1
            """, (anime['title'],))
            
            existing = cur.fetchone()
            
            if existing:
                # Update existing entry with NULL mal_id to prevent duplicates
                anime_id = existing[0]
                cur.execute("""
                    UPDATE anime SET
                        mal_id = %s,
                        english_title = %s,
                        japanese_title = %s,
                        synonyms = %s,
                        description = %s,
                        image_url = %s,
                        score = %s,
                        popularity = %s,
                        rank = %s,
                        rating = %s,
                        status = %s,
                        premiered = %s,
                        demographic = %s,
                        last_jikan_sync = NOW(),
                        sync_status = 'pending_embeddings',
                        updated_at = NOW()
                    WHERE anime_id = %s
                    RETURNING anime_id
                """, (
                    anime['mal_id'],
                    anime.get('title_english'),
                    anime.get('title_japanese'),
                    synonyms or None,
                    anime.get('synopsis'),
                    anime.get('image_url'),
                    anime.get('score'),
                    anime.get('popularity'),
                    anime.get('rank'),
                    anime.get('rating'),
                    anime.get('status'),
                    premiered,
                    anime.get('demographics', [None])[0] if anime.get('demographics') else None,
                    anime_id
                ))
                result = cur.fetchone()
            else:
                # Insert/update anime normally
                cur.execute("""
                    INSERT INTO anime (
                        mal_id, title, english_title, japanese_title, synonyms,
                        description, image_url, score, popularity, rank, rating,
                        status, premiered, demographic, 
                        last_jikan_sync, sync_status, created_at, updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), 'pending_embeddings', NOW(), NOW())
                    ON CONFLICT (mal_id) DO UPDATE SET
                        title = EXCLUDED.title,
                        english_title = EXCLUDED.english_title,
                        japanese_title = EXCLUDED.japanese_title,
                        synonyms = EXCLUDED.synonyms,
                        description = EXCLUDED.description,
                        image_url = EXCLUDED.image_url,
                        score = EXCLUDED.score,
                        popularity = EXCLUDED.popularity,
                        rank = EXCLUDED.rank,
                        rating = EXCLUDED.rating,
                        status = EXCLUDED.status,
                        premiered = EXCLUDED.premiered,
                        demographic = EXCLUDED.demographic,
                        last_jikan_sync = NOW(),
                        updated_at = NOW()
                    RETURNING anime_id
                """, (
                    anime['mal_id'], 
                    anime['title'], 
                    anime.get('title_english'),
                    anime.get('title_japanese'),
                    synonyms or None,
                    anime.get('synopsis'),  # description
                    anime.get('image_url'),
                    anime.get('score'),
                    anime.get('popularity'),
                    anime.get('rank'),
                    anime.get('rating'),
                    anime.get('status'),
                    premiered,
                    anime.get('demographics', [None])[0] if anime.get('demographics') else None  # First demographic
                ))
                
                result = cur.fetchone()
            
            if result:
                anime_id = result[0]
                anime_ids.append(anime_id)
                
                # Insert relationships
                for genre in anime.get('genres', []):
                    if genre in genre_map:
                        cur.execute(
                            "INSERT INTO anime_genres (anime_id, genre_id) VALUES (%s, %s) ON CONFLICT (anime_id, genre_id) DO NOTHING",
                            (anime_id, genre_map[genre])
                        )
                
                for studio in anime.get('studios', []):
                    if studio in studio_map:
                        cur.execute(
                            "INSERT INTO anime_studios (anime_id, studio_id) VALUES (%s, %s) ON CONFLICT (anime_id, studio_id) DO NOTHING",
                            (anime_id, studio_map[studio])
                        )
                
                for theme in anime.get('themes', []):
                    if theme in theme_map:
                        cur.execute(
                            "INSERT INTO anime_themes (anime_id, theme_id) VALUES (%s, %s) ON CONFLICT (anime_id, theme_id) DO NOTHING",
                            (anime_id, theme_map[theme])
                        )
                
                # Add to sync queue for embedding generation (low priority for bulk sync)
                cur.execute("""
                    INSERT INTO jikan_sync_queue (anime_id, mal_id, priority, created_at)
                    VALUES (%s, %s, 'low', NOW())
                    ON CONFLICT (anime_id) DO NOTHING
                """, (anime_id, anime['mal_id']))
        
        conn.commit()
        print(f"Inserted {len(anime_ids)} new anime")
        print(f"Added {len(anime_ids)} anime to sync queue for embedding generation")
        print("Note: Embeddings will be generated by the queue processor (run process_jikan_queue.py or wait for daily GitHub Actions)")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error inserting anime: {e}")
        conn.rollback()
        cur.close()
        conn.close()
        raise

def generate_embeddings_for_anime(cur, conn, anime_ids):
    """
    Generate embeddings only for specified anime IDs
    Note: This function is kept for backward compatibility but the new workflow
    uses the jikan_sync_queue table and process_jikan_queue.py script
    """
    # Fetch anime data
    cur.execute("""
        SELECT 
            a.anime_id,
            a.description,
            STRING_AGG(DISTINCT g.name, ', ') as genres,
            STRING_AGG(DISTINCT t.name, ', ') as themes,
            a.demographic,
            a.rating
        FROM anime a
        LEFT JOIN anime_genres ag ON a.anime_id = ag.anime_id
        LEFT JOIN genres g ON ag.genre_id = g.id
        LEFT JOIN anime_themes at ON a.anime_id = at.anime_id
        LEFT JOIN themes t ON at.theme_id = t.id
        WHERE a.anime_id = ANY(%s)
        GROUP BY a.anime_id, a.description, a.demographic, a.rating
    """, (anime_ids,))
    
    anime_data = cur.fetchall()
    print(f"Generating embeddings for {len(anime_data)} anime...")
    
    # Prepare texts for each field
    descriptions = []
    genres_texts = []
    themes_texts = []
    demographics_texts = []
    ratings = []
    
    for row in anime_data:
        descriptions.append(prepare_text_for_embedding(row[1]))
        genres_texts.append(prepare_text_for_embedding(row[2]))
        themes_texts.append(prepare_text_for_embedding(row[3]))
        demographics_texts.append(prepare_text_for_embedding(row[4]))
        ratings.append(prepare_text_for_embedding(row[5]))
    
    # Generate embeddings
    desc_embeddings = get_embeddings_batch(descriptions)
    genre_embeddings = get_embeddings_batch(genres_texts)
    theme_embeddings = get_embeddings_batch(themes_texts)
    demo_embeddings = get_embeddings_batch(demographics_texts)
    rating_embeddings = get_embeddings_batch(ratings)
    
    # Insert embeddings
    embedding_data = []
    for i, row in enumerate(anime_data):
        embedding_data.append((
            row[0],  # anime_id
            desc_embeddings[i],
            genre_embeddings[i],
            theme_embeddings[i],
            demo_embeddings[i],
            rating_embeddings[i]
        ))
    
    execute_batch(cur, """
        INSERT INTO anime_embeddings (
            anime_id, description_embedding, genres_embedding,
            themes_embedding, demographic_embedding, rating_embedding
        ) VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (anime_id) DO UPDATE SET
            description_embedding = EXCLUDED.description_embedding,
            genres_embedding = EXCLUDED.genres_embedding,
            themes_embedding = EXCLUDED.themes_embedding,
            demographic_embedding = EXCLUDED.demographic_embedding,
            rating_embedding = EXCLUDED.rating_embedding
    """, embedding_data)
    
    conn.commit()
    print(f"Embeddings generated and stored for {len(embedding_data)} anime")

def main():
    """Main sync function"""
    print("=" * 60)
    print("QUARTERLY ANIME SYNC - NEW ANIME ONLY")
    print("=" * 60)
    
    # Fetch new anime
    all_anime = []
    
    # Option 1: Fetch current season
    from datetime import datetime
    current_year = datetime.now().year
    current_month = datetime.now().month
    
    # Determine season
    if current_month in [1, 2, 3]:
        season = "winter"
    elif current_month in [4, 5, 6]:
        season = "spring"
    elif current_month in [7, 8, 9]:
        season = "summer"
    else:
        season = "fall"
    
    print(f"\n1. Fetching {season} {current_year} anime...")
    seasonal_anime = fetch_seasonal_anime(current_year, season)
    all_anime.extend(seasonal_anime)
    
    # Option 2: Fetch top popular anime (fill up to 500 new ones)
    if len(all_anime) < 500:
        print(f"\n2. Fetching top popular anime to reach ~500 new entries...")
        top_anime = fetch_top_anime(limit=2000)  # Fetch more, filter down
        all_anime.extend(top_anime[:500 - len(all_anime)])
    
    print(f"\n{'=' * 60}")
    print(f"TOTAL NEW ANIME TO ADD: {len(all_anime)}")
    print(f"{'=' * 60}")
    
    if all_anime:
        insert_anime_batch(all_anime)
        print("\n✅ Sync complete!")
    else:
        print("\n✅ No new anime to add - database is up to date!")

if __name__ == "__main__":
    main()
