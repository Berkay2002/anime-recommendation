"""
Migration script to transfer anime data from MongoDB/JSON to PostgreSQL (Neon)
This script populates the anime, genres, studios, themes, and related tables.
"""

import json
import psycopg2
from psycopg2.extras import execute_batch
import os
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

# PostgreSQL connection string from .env
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://neondb_owner:npg_YmL7qC0SevRu@ep-weathered-lake-agw2smd6-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require')

# Parse genres/studios from string format
def parse_comma_separated(value):
    """Parse comma-separated string into list, handling None values"""
    if not value or value == "null":
        return []
    # Remove duplicate word patterns like "ActionAction" -> "Action"
    cleaned = value.replace("ActionAction", "Action").replace("DramaDrama", "Drama")
    cleaned = cleaned.replace("AdventureAdventure", "Adventure").replace("FantasyFantasy", "Fantasy")
    cleaned = cleaned.replace("ComedyComedy", "Comedy").replace("RomanceRomance", "Romance")
    cleaned = cleaned.replace("Sci-FiSci-Fi", "Sci-Fi").replace("SuspenseSuspense", "Suspense")
    cleaned = cleaned.replace("ShounenShounen", "Shounen").replace("SeinenSeinen", "Seinen")
    cleaned = cleaned.replace("ShoujoShoujo", "Shoujo")
    
    return [item.strip() for item in cleaned.split(',') if item.strip()]

def migrate_data():
    print("🚀 Starting migration from JSON to PostgreSQL...")
    
    # Load anime data
    data_path = "C:/Users/berka/Masters/TNM108/project/anime-recommendation/backend/data/anime_data.json"
    print(f"📂 Loading anime data from {data_path}...")
    
    with open(data_path, 'r', encoding='utf-8') as f:
        anime_data = json.load(f)
    
    print(f"✅ Loaded {len(anime_data)} anime entries")
    
    # Connect to PostgreSQL
    print("🔌 Connecting to PostgreSQL (Neon)...")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    # Clear existing data (be careful!)
    print("🧹 Clearing existing data...")
    cur.execute("TRUNCATE anime, genres, studios, themes, anime_genres, anime_studios, anime_themes CASCADE;")
    conn.commit()
    
    # Collect all unique genres, studios, themes
    all_genres = set()
    all_studios = set()
    all_themes = set()
    
    for anime in anime_data:
        genres = parse_comma_separated(anime.get('Genres'))
        studios = parse_comma_separated(anime.get('Studios'))
        themes = parse_comma_separated(anime.get('themes', ''))
        
        all_genres.update(genres)
        all_studios.update(studios)
        all_themes.update(themes)
    
    # Insert genres
    print(f"📊 Inserting {len(all_genres)} genres...")
    genre_map = {}
    for genre in sorted(all_genres):
        cur.execute("INSERT INTO genres (name) VALUES (%s) ON CONFLICT (name) DO NOTHING RETURNING id;", (genre,))
        result = cur.fetchone()
        if result:
            genre_map[genre] = result[0]
        else:
            cur.execute("SELECT id FROM genres WHERE name = %s;", (genre,))
            fetched = cur.fetchone()
            if fetched:
                genre_map[genre] = fetched[0]
    
    # Insert studios
    print(f"🎬 Inserting {len(all_studios)} studios...")
    studio_map = {}
    for studio in sorted(all_studios):
        cur.execute("INSERT INTO studios (name) VALUES (%s) ON CONFLICT (name) DO NOTHING RETURNING id;", (studio,))
        result = cur.fetchone()
        if result:
            studio_map[studio] = result[0]
        else:
            cur.execute("SELECT id FROM studios WHERE name = %s;", (studio,))
            fetched = cur.fetchone()
            if fetched:
                studio_map[studio] = fetched[0]
    
    # Insert themes
    print(f"🎨 Inserting {len(all_themes)} themes...")
    theme_map = {}
    for theme in sorted(all_themes):
        cur.execute("INSERT INTO themes (name) VALUES (%s) ON CONFLICT (name) DO NOTHING RETURNING id;", (theme,))
        result = cur.fetchone()
        if result:
            theme_map[theme] = result[0]
        else:
            cur.execute("SELECT id FROM themes WHERE name = %s;", (theme,))
            fetched = cur.fetchone()
            if fetched:
                theme_map[theme] = fetched[0]
    
    conn.commit()
    
    # Insert anime and relationships
    print(f"🎌 Inserting {len(anime_data)} anime entries...")
    anime_values = []
    anime_genres_values = []
    anime_studios_values = []
    anime_themes_values = []
    
    for idx, anime in enumerate(anime_data):
        # Determine title
        title = (anime.get("English") or 
                anime.get("Japanese") or 
                anime.get("Synonyms") or 
                anime.get("Title") or 
                f"Unknown Anime {idx}")
        
        anime_values.append((
            idx,  # anime_id
            title,
            anime.get("English"),
            anime.get("Japanese"),
            anime.get("Synonyms"),
            anime.get("Description"),
            anime.get("image_url"),
            anime.get("Score"),
            anime.get("Popularity"),
            anime.get("Rank"),
            anime.get("Rating"),
            anime.get("Status"),
            anime.get("Premiered"),
            anime.get("Demographic"),
            anime.get("Producers")
        ))
        
        # Relationships
        genres = parse_comma_separated(anime.get('Genres'))
        for genre in genres:
            if genre in genre_map:
                anime_genres_values.append((idx, genre_map[genre]))
        
        studios = parse_comma_separated(anime.get('Studios'))
        for studio in studios:
            if studio in studio_map:
                anime_studios_values.append((idx, studio_map[studio]))
        
        themes = parse_comma_separated(anime.get('themes', ''))
        for theme in themes:
            if theme in theme_map:
                anime_themes_values.append((idx, theme_map[theme]))
    
    # Batch insert anime
    execute_batch(cur, """
        INSERT INTO anime (anime_id, title, english_title, japanese_title, synonyms, 
                          description, image_url, score, popularity, rank, rating, 
                          status, premiered, demographic, producers)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, anime_values)
    
    # Batch insert relationships
    if anime_genres_values:
        execute_batch(cur, "INSERT INTO anime_genres (anime_id, genre_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", anime_genres_values)
    
    if anime_studios_values:
        execute_batch(cur, "INSERT INTO anime_studios (anime_id, studio_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", anime_studios_values)
    
    if anime_themes_values:
        execute_batch(cur, "INSERT INTO anime_themes (anime_id, theme_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", anime_themes_values)
    
    conn.commit()
    
    # Update search vectors
    print("🔍 Updating full-text search vectors...")
    cur.execute("""
        UPDATE anime 
        SET search_vector = to_tsvector('english', 
            coalesce(title, '') || ' ' || 
            coalesce(english_title, '') || ' ' ||
            coalesce(japanese_title, '') || ' ' ||
            coalesce(synonyms, '') || ' ' ||
            coalesce(description, '')
        );
    """)
    conn.commit()
    
    # Get counts
    cur.execute("SELECT COUNT(*) FROM anime")
    anime_result = cur.fetchone()
    anime_count = anime_result[0] if anime_result else 0
    cur.execute("SELECT COUNT(*) FROM genres")
    genres_result = cur.fetchone()
    genres_count = genres_result[0] if genres_result else 0
    cur.execute("SELECT COUNT(*) FROM studios")
    studios_result = cur.fetchone()
    studios_count = studios_result[0] if studios_result else 0
    
    print(f"\n✨ Migration complete!")
    print(f"   📺 Anime: {anime_count}")
    print(f"   📊 Genres: {genres_count}")
    print(f"   🎬 Studios: {studios_count}")
    print(f"   🎨 Themes: {len(all_themes)}")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    migrate_data()
