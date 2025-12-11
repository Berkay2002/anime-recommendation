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
                "INSERT INTO genres (name) VALUES (%s) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id, name",
                (genre,)
            )
            gid, gname = cur.fetchone()
            genre_map[gname] = gid
        
        studio_map = {}
        for studio in all_studios:
            cur.execute(
                "INSERT INTO studios (name) VALUES (%s) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id, name",
                (studio,)
            )
            sid, sname = cur.fetchone()
            studio_map[sname] = sid
        
        theme_map = {}
        for theme in all_themes:
            cur.execute(
                "INSERT INTO themes (name) VALUES (%s) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id, name",
                (theme,)
            )
            tid, tname = cur.fetchone()
            theme_map[tname] = tid
        
        demographic_map = {}
        for demo in all_demographics:
            cur.execute(
                "INSERT INTO demographics (name) VALUES (%s) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id, name",
                (demo,)
            )
            did, dname = cur.fetchone()
            demographic_map[dname] = did
        
        conn.commit()
        print(f"Prepared {len(genre_map)} genres, {len(studio_map)} studios, {len(theme_map)} themes, {len(demographic_map)} demographics")
        
        # Insert anime
        anime_ids = []
        for anime in anime_list:
            cur.execute("""
                INSERT INTO anime (
                    mal_id, title, title_english, title_japanese, type, episodes,
                    status, aired_from, aired_to, duration, rating, score, scored_by,
                    rank, popularity, members, favorites, synopsis, background,
                    season, year, source, image_url
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (mal_id) DO NOTHING
                RETURNING id
            """, (
                anime['mal_id'], anime['title'], anime.get('title_english'),
                anime.get('title_japanese'), anime.get('type'), anime.get('episodes'),
                anime.get('status'), anime.get('aired_from'), anime.get('aired_to'),
                anime.get('duration'), anime.get('rating'), anime.get('score'),
                anime.get('scored_by'), anime.get('rank'), anime.get('popularity'),
                anime.get('members'), anime.get('favorites'), anime.get('synopsis'),
                anime.get('background'), anime.get('season'), anime.get('year'),
                anime.get('source'), anime.get('image_url')
            ))
            
            result = cur.fetchone()
            if result:
                anime_id = result[0]
                anime_ids.append(anime_id)
                
                # Insert relationships
                for genre in anime.get('genres', []):
                    if genre in genre_map:
                        cur.execute(
                            "INSERT INTO anime_genres (anime_id, genre_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                            (anime_id, genre_map[genre])
                        )
                
                for studio in anime.get('studios', []):
                    if studio in studio_map:
                        cur.execute(
                            "INSERT INTO anime_studios (anime_id, studio_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                            (anime_id, studio_map[studio])
                        )
                
                for theme in anime.get('themes', []):
                    if theme in theme_map:
                        cur.execute(
                            "INSERT INTO anime_themes (anime_id, theme_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                            (anime_id, theme_map[theme])
                        )
                
                for demo in anime.get('demographics', []):
                    if demo in demographic_map:
                        cur.execute(
                            "INSERT INTO anime_demographics (anime_id, demographic_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                            (anime_id, demographic_map[demo])
                        )
        
        conn.commit()
        print(f"Inserted {len(anime_ids)} new anime")
        
        # Generate embeddings only for new anime
        if anime_ids:
            print("\nGenerating embeddings for new anime...")
            generate_embeddings_for_anime(cur, conn, anime_ids)
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error inserting anime: {e}")
        conn.rollback()
        cur.close()
        conn.close()
        raise

def generate_embeddings_for_anime(cur, conn, anime_ids):
    """Generate embeddings only for specified anime IDs"""
    # Fetch anime data
    cur.execute("""
        SELECT 
            a.id,
            a.synopsis,
            STRING_AGG(DISTINCT g.name, ', ') as genres,
            STRING_AGG(DISTINCT t.name, ', ') as themes,
            STRING_AGG(DISTINCT d.name, ', ') as demographics,
            a.rating
        FROM anime a
        LEFT JOIN anime_genres ag ON a.id = ag.anime_id
        LEFT JOIN genres g ON ag.genre_id = g.id
        LEFT JOIN anime_themes at ON a.id = at.anime_id
        LEFT JOIN themes t ON at.theme_id = t.id
        LEFT JOIN anime_demographics ad ON a.id = ad.anime_id
        LEFT JOIN demographics d ON ad.demographic_id = d.id
        WHERE a.id = ANY(%s)
        GROUP BY a.id
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
