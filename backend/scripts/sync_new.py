"""
Quarterly sync - fetches only NEW anime and generates embeddings
"""
import os, sys, time, requests, psycopg2
from psycopg2.extras import execute_batch
from dotenv import load_dotenv
from google_embeddings_service import get_embeddings_batch, prepare_text_for_embedding
from datetime import datetime

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
DATABASE_URL = os.getenv('DATABASE_URL')

def get_existing_titles():
    """Get existing titles to avoid duplicates"""
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("SELECT LOWER(title) FROM anime")
    existing = {row[0].strip() for row in cur.fetchall() if row[0]}
    cur.close()
    conn.close()
    print(f"Found {len(existing)} anime in database")
    return existing

def fetch_seasonal(year, season, existing):
    """Fetch season anime, skip existing"""
    anime_list, page = [], 1
    print(f"\nFetching {season} {year}...")
    
    while page < 10:  # Max 10 pages (250 anime)
        try:
            r = requests.get(f"https://api.jikan.moe/v4/seasons/{year}/{season}", 
                           params={"page": page, "limit": 25})
            if r.status_code != 200:
                break
            
            items = r.json().get('data', [])
            if not items:
                break
            
            for item in items:
                title = item.get('title')
                if not title or title.lower().strip() in existing:
                    continue
                
                premiered = f"{season.capitalize()} {year}"
                anime_list.append({
                    'title': title,
                    'english_title': item.get('title_english'),
                    'japanese_title': item.get('title_japanese'),
                    'description': item.get('synopsis'),
                    'image_url': item.get('images', {}).get('jpg', {}).get('large_image_url'),
                    'score': item.get('score'),
                    'popularity': item.get('popularity'),
                    'rank': item.get('rank'),
                    'rating': item.get('rating'),
                    'status': item.get('status'),
                    'premiered': premiered,
                    'demographic': item.get('demographics', [{}])[0].get('name') if item.get('demographics') else None,
                    'genres': [g['name'] for g in item.get('genres', [])],
                    'themes': [t['name'] for t in item.get('themes', [])],
                    'studios': [s['name'] for s in item.get('studios', [])]
                })
            
            print(f"Page {page}: {len(anime_list)} new anime")
            page += 1
            time.sleep(0.4)
        except Exception as e:
            print(f"Error: {e}")
            break
    
    return anime_list

def fetch_top_anime(existing, target_new=9000):
    """Fetch top anime by popularity to reach 10k total"""
    anime_list, page = [], 1
    print(f"\nFetching top popular anime (target: {target_new} new ones)...")
    
    while len(anime_list) < target_new and page < 500:  # Max 500 pages = 12,500 anime
        try:
            r = requests.get("https://api.jikan.moe/v4/top/anime",
                           params={"page": page, "limit": 25})
            
            if r.status_code != 200:
                if r.status_code == 429:  # Rate limited
                    print("Rate limited, waiting 60s...")
                    time.sleep(60)
                    continue
                break
            
            items = r.json().get('data', [])
            if not items:
                break
            
            for item in items:
                title = item.get('title')
                if not title or title.lower().strip() in existing:
                    continue
                
                # Determine premiered
                premiered = None
                if item.get('aired', {}).get('from'):
                    aired = item.get('aired', {}).get('from')
                    try:
                        year = aired[:4]
                        premiered = year
                    except:
                        pass
                
                anime_list.append({
                    'title': title,
                    'english_title': item.get('title_english'),
                    'japanese_title': item.get('title_japanese'),
                    'description': item.get('synopsis'),
                    'image_url': item.get('images', {}).get('jpg', {}).get('large_image_url'),
                    'score': item.get('score'),
                    'popularity': item.get('popularity'),
                    'rank': item.get('rank'),
                    'rating': item.get('rating'),
                    'status': item.get('status'),
                    'premiered': premiered,
                    'demographic': item.get('demographics', [{}])[0].get('name') if item.get('demographics') else None,
                    'genres': [g['name'] for g in item.get('genres', [])],
                    'themes': [t['name'] for t in item.get('themes', [])],
                    'studios': [s['name'] for s in item.get('studios', [])]
                })
                
                if len(anime_list) >= target_new:
                    break
            
            if page % 10 == 0:
                print(f"Page {page}: {len(anime_list)} new anime found")
            page += 1
            time.sleep(0.4)
            
        except Exception as e:
            print(f"Error: {e}")
            break
    
    print(f"Fetched {len(anime_list)} new anime from top lists")
    return anime_list

def insert_anime(anime_list):
    """Insert anime and generate embeddings"""
    if not anime_list:
        print("No new anime")
        return
    
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        # Prepare lookups
        all_genres = set()
        all_themes = set()
        all_studios = set()
        for a in anime_list:
            all_genres.update(a.get('genres', []))
            all_themes.update(a.get('themes', []))
            all_studios.update(a.get('studios', []))
        
        # Insert/get IDs
        genre_map = {}
        for g in all_genres:
            cur.execute("INSERT INTO genres (name) VALUES (%s) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id", (g,))
            genre_map[g] = cur.fetchone()[0]
        
        theme_map = {}
        for t in all_themes:
            cur.execute("INSERT INTO themes (name) VALUES (%s) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id", (t,))
            theme_map[t] = cur.fetchone()[0]
        
        studio_map = {}
        for s in all_studios:
            cur.execute("INSERT INTO studios (name) VALUES (%s) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id", (s,))
            studio_map[s] = cur.fetchone()[0]
        
        conn.commit()
        print(f"Prepared {len(genre_map)} genres, {len(theme_map)} themes, {len(studio_map)} studios")
        
        # Get next ID
        cur.execute("SELECT COALESCE(MAX(anime_id), 0) + 1 FROM anime")
        next_id = cur.fetchone()[0]
        
        # Insert anime
        anime_ids = []
        for anime in anime_list:
            cur.execute("""
                INSERT INTO anime (
                    anime_id, title, english_title, japanese_title,
                    description, image_url, score, popularity, rank,
                    rating, status, premiered, demographic
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING anime_id
            """, (
                next_id, anime['title'], anime.get('english_title'),
                anime.get('japanese_title'), anime.get('description'),
                anime.get('image_url'), anime.get('score'), anime.get('popularity'),
                anime.get('rank'), anime.get('rating'), anime.get('status'),
                anime.get('premiered'), anime.get('demographic')
            ))
            
            anime_id = cur.fetchone()[0]
            anime_ids.append(anime_id)
            
            # Relationships
            for g in anime.get('genres', []):
                if g in genre_map:
                    cur.execute("INSERT INTO anime_genres (anime_id, genre_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                              (anime_id, genre_map[g]))
            
            for t in anime.get('themes', []):
                if t in theme_map:
                    cur.execute("INSERT INTO anime_themes (anime_id, theme_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                              (anime_id, theme_map[t]))
            
            for s in anime.get('studios', []):
                if s in studio_map:
                    cur.execute("INSERT INTO anime_studios (anime_id, studio_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                              (anime_id, studio_map[s]))
            
            next_id += 1
        
        conn.commit()
        print(f"Inserted {len(anime_ids)} anime")
        
        # Generate embeddings
        print("\nGenerating embeddings...")
        cur.execute("""
            SELECT a.anime_id, a.description,
                   STRING_AGG(DISTINCT g.name, ', ') as genres,
                   STRING_AGG(DISTINCT t.name, ', ') as themes,
                   a.demographic, a.rating
            FROM anime a
            LEFT JOIN anime_genres ag ON a.anime_id = ag.anime_id
            LEFT JOIN genres g ON ag.genre_id = g.id
            LEFT JOIN anime_themes at ON a.anime_id = at.anime_id
            LEFT JOIN themes t ON at.theme_id = t.id
            WHERE a.anime_id = ANY(%s)
            GROUP BY a.anime_id
        """, (anime_ids,))
        
        rows = cur.fetchall()
        
        # Prepare texts
        desc_list = [prepare_text_for_embedding(r[1]) for r in rows]
        genre_list = [prepare_text_for_embedding(r[2]) for r in rows]
        theme_list = [prepare_text_for_embedding(r[3]) for r in rows]
        demo_list = [prepare_text_for_embedding(r[4]) for r in rows]
        rating_list = [prepare_text_for_embedding(r[5]) for r in rows]
        
        # Get embeddings
        print("Calling Google API...")
        desc_emb = get_embeddings_batch(desc_list)
        genre_emb = get_embeddings_batch(genre_list)
        theme_emb = get_embeddings_batch(theme_list)
        demo_emb = get_embeddings_batch(demo_list)
        rating_emb = get_embeddings_batch(rating_list)
        
        # Insert embeddings
        emb_data = [(rows[i][0], desc_emb[i], genre_emb[i], theme_emb[i], demo_emb[i], rating_emb[i]) 
                    for i in range(len(rows))]
        
        execute_batch(cur, """
            INSERT INTO anime_embeddings (
                anime_id, description_embedding, genres_embedding,
                themes_embedding, demographic_embedding, rating_embedding
            ) VALUES (%s, %s, %s, %s, %s, %s)
        """, emb_data)
        
        conn.commit()
        print(f"✅ Embeddings saved for {len(emb_data)} anime")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
        raise

def main():
    print("=" * 60)
    print("QUARTERLY SYNC - NEW ANIME ONLY")
    print("=" * 60)
    
    import sys
    mode = sys.argv[1] if len(sys.argv) > 1 else "seasonal"
    
    existing = get_existing_titles()
    current_count = len(existing)
    target_total = 2000  # Conservative target: 2k total
    
    anime = []
    
    if mode == "populate":
        # One-time: add 1000 more top anime
        print(f"\n🎯 MODE: Populate to {target_total} anime")
        print(f"Current: {current_count} anime")
        target_new = target_total - current_count
        
        if target_new > 0:
            print(f"Need to fetch: {target_new} new anime")
            anime = fetch_top_anime(existing, target_new)
        else:
            print(f"Already have {current_count} anime (target: {target_total})")
    
    else:
        # Regular quarterly: just current season
        print(f"\n🎯 MODE: Quarterly seasonal update")
        print(f"Current: {current_count} anime")
        
        now = datetime.now()
        year = now.year
        month = now.month
        season = ['winter', 'spring', 'summer', 'fall'][(month - 1) // 3]
        
        anime = fetch_seasonal(year, season, existing)
    
    print(f"\n{'=' * 60}")
    print(f"NEW ANIME TO ADD: {len(anime)}")
    print(f"{'=' * 60}")
    
    if anime:
        insert_anime(anime)
        print(f"\n✅ Sync complete! Database now has {current_count + len(anime)} anime")
    else:
        print("\n✅ No new anime - database up to date!")

if __name__ == "__main__":
    main()
