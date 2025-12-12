#!/usr/bin/env python3
"""
Process Jikan Sync Queue - Background worker for generating embeddings
Processes anime from the jikan_sync_queue table and generates embeddings
"""

import os
import sys
from datetime import datetime
from typing import List, Tuple
import psycopg2
from psycopg2.extras import execute_values
from google_embeddings_service import get_embeddings_batch, prepare_text_for_embedding
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

DATABASE_URL = os.getenv('DATABASE_URL')
BATCH_SIZE = int(os.getenv('BATCH_SIZE', '50'))
PRIORITY = os.getenv('PRIORITY', 'all')

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set")

def get_connection():
    """Get PostgreSQL database connection"""
    return psycopg2.connect(DATABASE_URL)

def fetch_queued_anime(conn, priority: str = 'all', limit: int = 50) -> List[Tuple]:
    """
    Fetch anime from the sync queue that need embeddings
    
    Args:
        conn: Database connection
        priority: 'low', 'high', or 'all'
        limit: Maximum number of anime to fetch
    
    Returns:
        List of tuples: (anime_id, mal_id, priority)
    """
    cursor = conn.cursor()
    
    if priority == 'all':
        # Process both high and low priority, but prioritize high
        query = """
            SELECT jq.anime_id, jq.mal_id, jq.priority
            FROM jikan_sync_queue jq
            WHERE jq.processed_at IS NULL
            ORDER BY 
                CASE jq.priority 
                    WHEN 'high' THEN 1 
                    WHEN 'low' THEN 2 
                END,
                jq.created_at ASC
            LIMIT %s
        """
        cursor.execute(query, (limit,))
    elif priority == 'low':
        # Only process low priority items
        query = """
            SELECT jq.anime_id, jq.mal_id, jq.priority
            FROM jikan_sync_queue jq
            WHERE jq.processed_at IS NULL AND jq.priority = 'low'
            ORDER BY jq.created_at ASC
            LIMIT %s
        """
        cursor.execute(query, (limit,))
    else:
        # Process specific priority
        query = """
            SELECT jq.anime_id, jq.mal_id, jq.priority
            FROM jikan_sync_queue jq
            WHERE jq.processed_at IS NULL AND jq.priority = %s
            ORDER BY jq.created_at ASC
            LIMIT %s
        """
        cursor.execute(query, (priority, limit))
    
    results = cursor.fetchall()
    cursor.close()
    
    return results

def fetch_anime_data(conn, anime_ids: List[int]) -> List[dict]:
    """
    Fetch anime data needed for embedding generation
    
    Args:
        conn: Database connection
        anime_ids: List of anime IDs to fetch
    
    Returns:
        List of anime data dictionaries
    """
    cursor = conn.cursor()
    
    query = """
        SELECT 
            a.anime_id,
            a.description,
            a.demographic,
            a.rating,
            COALESCE(
                STRING_AGG(DISTINCT g.name, ', ') FILTER (WHERE g.name IS NOT NULL),
                ''
            ) as genres,
            COALESCE(
                STRING_AGG(DISTINCT t.name, ', ') FILTER (WHERE t.name IS NOT NULL),
                ''
            ) as themes
        FROM anime a
        LEFT JOIN anime_genres ag ON a.anime_id = ag.anime_id
        LEFT JOIN genres g ON ag.genre_id = g.id
        LEFT JOIN anime_themes at ON a.anime_id = at.anime_id
        LEFT JOIN themes t ON at.theme_id = t.id
        WHERE a.anime_id = ANY(%s)
        GROUP BY a.anime_id
        ORDER BY a.anime_id
    """
    
    cursor.execute(query, (anime_ids,))
    
    columns = [desc[0] for desc in cursor.description]
    results = [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    cursor.close()
    
    return results

def generate_and_store_embeddings(conn, anime_data: List[dict]) -> int:
    """
    Generate embeddings for anime and store them in the database
    
    Args:
        conn: Database connection
        anime_data: List of anime data dictionaries
    
    Returns:
        Number of anime processed successfully
    """
    if not anime_data:
        return 0
    
    # Prepare texts for each field
    descriptions = [prepare_text_for_embedding(anime['description']) for anime in anime_data]
    genres_list = [prepare_text_for_embedding(anime['genres']) for anime in anime_data]
    themes_list = [prepare_text_for_embedding(anime['themes']) for anime in anime_data]
    demographics = [prepare_text_for_embedding(anime['demographic']) for anime in anime_data]
    ratings = [prepare_text_for_embedding(anime['rating']) for anime in anime_data]
    
    print(f"Generating embeddings for {len(anime_data)} anime...")
    
    # Generate embeddings for all fields
    print("  - Generating description embeddings...")
    description_embeddings = get_embeddings_batch(descriptions)
    
    print("  - Generating genres embeddings...")
    genres_embeddings = get_embeddings_batch(genres_list)
    
    print("  - Generating themes embeddings...")
    themes_embeddings = get_embeddings_batch(themes_list)
    
    print("  - Generating demographic embeddings...")
    demographic_embeddings = get_embeddings_batch(demographics)
    
    print("  - Generating rating embeddings...")
    rating_embeddings = get_embeddings_batch(ratings)
    
    # Prepare data for insertion
    embedding_data = []
    for i, anime in enumerate(anime_data):
        embedding_data.append((
            anime['anime_id'],
            description_embeddings[i],
            genres_embeddings[i],
            themes_embeddings[i],
            demographic_embeddings[i],
            rating_embeddings[i],
        ))
    
    # Insert embeddings into database
    cursor = conn.cursor()
    
    insert_query = """
        INSERT INTO anime_embeddings (
            anime_id,
            description_embedding,
            genres_embedding,
            themes_embedding,
            demographic_embedding,
            rating_embedding,
            created_at
        )
        VALUES %s
        ON CONFLICT (anime_id) DO UPDATE SET
            description_embedding = EXCLUDED.description_embedding,
            genres_embedding = EXCLUDED.genres_embedding,
            themes_embedding = EXCLUDED.themes_embedding,
            demographic_embedding = EXCLUDED.demographic_embedding,
            rating_embedding = EXCLUDED.rating_embedding,
            created_at = NOW()
    """
    
    try:
        execute_values(
            cursor,
            insert_query,
            embedding_data,
            template="(%s, %s::vector, %s::vector, %s::vector, %s::vector, %s::vector, NOW())"
        )
        conn.commit()
        cursor.close()
        
        print(f"✅ Successfully stored embeddings for {len(anime_data)} anime")
        return len(anime_data)
    except Exception as e:
        print(f"❌ Error storing embeddings: {e}")
        conn.rollback()
        cursor.close()
        return 0

def update_sync_status(conn, anime_ids: List[int]) -> None:
    """
    Update sync status for processed anime
    
    Args:
        conn: Database connection
        anime_ids: List of anime IDs to update
    """
    cursor = conn.cursor()
    
    # Update anime sync status
    update_anime_query = """
        UPDATE anime
        SET sync_status = 'fresh', updated_at = NOW()
        WHERE anime_id = ANY(%s)
    """
    cursor.execute(update_anime_query, (anime_ids,))
    
    # Mark as processed in queue
    update_queue_query = """
        UPDATE jikan_sync_queue
        SET processed_at = NOW()
        WHERE anime_id = ANY(%s)
    """
    cursor.execute(update_queue_query, (anime_ids,))
    
    conn.commit()
    cursor.close()

def cleanup_old_queue_entries(conn, days: int = 7) -> int:
    """
    Remove processed queue entries older than specified days
    
    Args:
        conn: Database connection
        days: Number of days to keep processed entries
    
    Returns:
        Number of entries deleted
    """
    cursor = conn.cursor()
    
    delete_query = """
        DELETE FROM jikan_sync_queue
        WHERE processed_at IS NOT NULL 
          AND processed_at < NOW() - INTERVAL '%s days'
    """
    cursor.execute(delete_query, (days,))
    deleted_count = cursor.rowcount
    
    conn.commit()
    cursor.close()
    
    return deleted_count

def main():
    """Main execution function"""
    print("=" * 60)
    print(f"Jikan Sync Queue Processor")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Batch size: {BATCH_SIZE}")
    print(f"Priority: {PRIORITY}")
    print("=" * 60)
    
    try:
        # Connect to database
        conn = get_connection()
        print("✅ Connected to database")
        
        # Fetch queued anime
        print(f"\nFetching up to {BATCH_SIZE} anime from queue...")
        queued_anime = fetch_queued_anime(conn, priority=PRIORITY, limit=BATCH_SIZE)
        
        if not queued_anime:
            print("ℹ️  No anime in queue to process")
            conn.close()
            return
        
        print(f"📝 Found {len(queued_anime)} anime to process")
        
        # Extract anime IDs
        anime_ids = [anime[0] for anime in queued_anime]
        
        # Fetch anime data
        print(f"\nFetching anime data...")
        anime_data = fetch_anime_data(conn, anime_ids)
        print(f"✅ Fetched data for {len(anime_data)} anime")
        
        # Generate and store embeddings
        print(f"\nGenerating embeddings...")
        processed_count = generate_and_store_embeddings(conn, anime_data)
        
        if processed_count > 0:
            # Update sync status
            print(f"\nUpdating sync status...")
            update_sync_status(conn, anime_ids[:processed_count])
            print(f"✅ Updated sync status for {processed_count} anime")
        
        # Cleanup old entries
        print(f"\nCleaning up old queue entries...")
        deleted_count = cleanup_old_queue_entries(conn, days=7)
        print(f"✅ Removed {deleted_count} old processed entries")
        
        # Close connection
        conn.close()
        
        print("\n" + "=" * 60)
        print(f"✅ Processing completed successfully!")
        print(f"   Processed: {processed_count} anime")
        print(f"   Remaining in queue: {len(queued_anime) - processed_count}")
        print(f"   Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
