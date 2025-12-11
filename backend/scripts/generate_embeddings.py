"""
Generate embeddings for all anime using Google's API and store in PostgreSQL
"""

import json
import psycopg2
from psycopg2.extras import execute_batch
import os
from dotenv import load_dotenv
from google_embeddings_service import get_embeddings_batch, prepare_text_for_embedding

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://neondb_owner:npg_YmL7qC0SevRu@ep-weathered-lake-agw2smd6-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require')

def generate_and_store_embeddings():
    """Generate embeddings for all anime and store in PostgreSQL"""
    
    print("🚀 Starting embedding generation...")
    
    # Connect to PostgreSQL
    print("🔌 Connecting to PostgreSQL...")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    # Fetch all anime with their metadata
    print("📊 Fetching anime data from PostgreSQL...")
    cur.execute("""
        SELECT 
            a.anime_id,
            a.description,
            STRING_AGG(DISTINCT g.name, ', ') as genres,
            a.demographic,
            a.rating,
            STRING_AGG(DISTINCT t.name, ', ') as themes
        FROM anime a
        LEFT JOIN anime_genres ag ON a.anime_id = ag.anime_id
        LEFT JOIN genres g ON ag.genre_id = g.id
        LEFT JOIN anime_themes at ON a.anime_id = at.anime_id
        LEFT JOIN themes t ON at.theme_id = t.id
        GROUP BY a.anime_id, a.description, a.demographic, a.rating
        ORDER BY a.anime_id;
    """)
    
    anime_data = cur.fetchall()
    print(f"✅ Loaded {len(anime_data)} anime entries")
    
    if not anime_data:
        print("❌ No anime data found. Please run migration script first.")
        return
    
    # Prepare texts for each field
    print("📝 Preparing texts for embedding generation...")
    
    descriptions = []
    genres_list = []
    demographics = []
    ratings = []
    themes_list = []
    anime_ids = []
    
    for row in anime_data:
        anime_id, description, genres, demographic, rating, themes = row
        
        anime_ids.append(anime_id)
        descriptions.append(prepare_text_for_embedding(description))
        genres_list.append(prepare_text_for_embedding(genres or ""))
        demographics.append(prepare_text_for_embedding(demographic or ""))
        ratings.append(prepare_text_for_embedding(rating or ""))
        themes_list.append(prepare_text_for_embedding(themes or ""))
    
    # Generate embeddings for each field
    print("\n🧠 Generating embeddings (this may take a while)...")
    
    print("\n1️⃣ Generating description embeddings...")
    description_embeddings = get_embeddings_batch(descriptions, batch_size=50)
    
    print("\n2️⃣ Generating genres embeddings...")
    genres_embeddings = get_embeddings_batch(genres_list, batch_size=50)
    
    print("\n3️⃣ Generating demographic embeddings...")
    demographic_embeddings = get_embeddings_batch(demographics, batch_size=50)
    
    print("\n4️⃣ Generating rating embeddings...")
    rating_embeddings = get_embeddings_batch(ratings, batch_size=50)
    
    print("\n5️⃣ Generating themes embeddings...")
    themes_embeddings = get_embeddings_batch(themes_list, batch_size=50)
    
    # Store embeddings in database
    print("\n💾 Storing embeddings in PostgreSQL...")
    
    # Clear existing embeddings
    print("🧹 Clearing existing embeddings from database...")
    cur.execute("SELECT COUNT(*) FROM anime_embeddings;")
    old_count_result = cur.fetchone()
    old_count = old_count_result[0] if old_count_result else 0
    print(f"   Found {old_count} existing records - removing all...")
    
    cur.execute("TRUNCATE anime_embeddings;")
    conn.commit()
    print("   ✅ Database cleared successfully!")
    
    # Prepare batch insert
    embedding_values = []
    for i, anime_id in enumerate(anime_ids):
        embedding_values.append((
            anime_id,
            description_embeddings[i],
            genres_embeddings[i],
            demographic_embeddings[i],
            rating_embeddings[i],
            themes_embeddings[i]
        ))
    
    # Batch insert embeddings
    execute_batch(cur, """
        INSERT INTO anime_embeddings 
        (anime_id, description_embedding, genres_embedding, demographic_embedding, rating_embedding, themes_embedding)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, embedding_values, page_size=100)
    
    conn.commit()
    
    # Verify
    cur.execute("SELECT COUNT(*) FROM anime_embeddings")
    count_result = cur.fetchone()
    count = count_result[0] if count_result else 0
    
    print(f"\n✨ Successfully stored {count} embedding records!")
    print("\n📊 Sample embedding check:")
    cur.execute("""
        SELECT anime_id, 
               vector_dims(description_embedding) as desc_dims,
               vector_dims(genres_embedding) as genre_dims
        FROM anime_embeddings 
        LIMIT 1
    """)
    sample = cur.fetchone()
    if sample:
        print(f"   Anime ID: {sample[0]}")
        print(f"   Description embedding dims: {sample[1]}")
        print(f"   Genres embedding dims: {sample[2]}")
    
    cur.close()
    conn.close()
    
    print("\n🎉 Embedding generation complete!")

if __name__ == "__main__":
    generate_and_store_embeddings()
