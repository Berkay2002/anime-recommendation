#!/usr/bin/env python3
"""
Fix duplicate anime entries in the database
Merges duplicates, keeping entries with MAL IDs and removing entries without MAL IDs
"""

import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable not set")

def get_connection():
    """Get PostgreSQL database connection"""
    return psycopg2.connect(DATABASE_URL)

def find_duplicates(conn):
    """Find duplicate anime titles"""
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = """
        SELECT 
            title,
            COUNT(*) as count,
            STRING_AGG(anime_id::text, ', ' ORDER BY anime_id) as anime_ids,
            STRING_AGG(COALESCE(mal_id::text, 'NULL'), ', ' ORDER BY anime_id) as mal_ids
        FROM anime
        GROUP BY title
        HAVING COUNT(*) > 1
        ORDER BY count DESC, title
    """
    
    cursor.execute(query)
    duplicates = cursor.fetchall()
    cursor.close()
    
    return duplicates

def get_anime_by_title(conn, title):
    """Get all anime entries with the same title"""
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = """
        SELECT anime_id, mal_id, title, last_jikan_sync, sync_status
        FROM anime
        WHERE title = %s
        ORDER BY 
            CASE WHEN mal_id IS NOT NULL THEN 0 ELSE 1 END,
            last_jikan_sync DESC NULLS LAST,
            anime_id
    """
    
    cursor.execute(query, (title,))
    entries = cursor.fetchall()
    cursor.close()
    
    return entries

def merge_duplicate(conn, keep_id, remove_id):
    """
    Merge duplicate anime entries
    - Keep the entry with keep_id
    - Move relationships from remove_id to keep_id
    - Delete remove_id entry
    """
    cursor = conn.cursor()
    
    try:
        # Move genre relationships
        cursor.execute("""
            INSERT INTO anime_genres (anime_id, genre_id)
            SELECT %s, genre_id
            FROM anime_genres
            WHERE anime_id = %s
            ON CONFLICT (anime_id, genre_id) DO NOTHING
        """, (keep_id, remove_id))
        
        # Move studio relationships
        cursor.execute("""
            INSERT INTO anime_studios (anime_id, studio_id)
            SELECT %s, studio_id
            FROM anime_studios
            WHERE anime_id = %s
            ON CONFLICT (anime_id, studio_id) DO NOTHING
        """, (keep_id, remove_id))
        
        # Move theme relationships
        cursor.execute("""
            INSERT INTO anime_themes (anime_id, theme_id)
            SELECT %s, theme_id
            FROM anime_themes
            WHERE anime_id = %s
            ON CONFLICT (anime_id, theme_id) DO NOTHING
        """, (keep_id, remove_id))
        
        # Move embeddings (if any)
        cursor.execute("""
            INSERT INTO anime_embeddings (
                anime_id, description_embedding, genres_embedding, 
                themes_embedding, demographic_embedding, rating_embedding, created_at
            )
            SELECT 
                %s, description_embedding, genres_embedding,
                themes_embedding, demographic_embedding, rating_embedding, created_at
            FROM anime_embeddings
            WHERE anime_id = %s
            ON CONFLICT (anime_id) DO NOTHING
        """, (keep_id, remove_id))
        
        # Update queue entries
        cursor.execute("""
            UPDATE jikan_sync_queue
            SET anime_id = %s
            WHERE anime_id = %s AND NOT EXISTS (
                SELECT 1 FROM jikan_sync_queue WHERE anime_id = %s
            )
        """, (keep_id, remove_id, keep_id))
        
        # Delete old relationships
        cursor.execute("DELETE FROM anime_genres WHERE anime_id = %s", (remove_id,))
        cursor.execute("DELETE FROM anime_studios WHERE anime_id = %s", (remove_id,))
        cursor.execute("DELETE FROM anime_themes WHERE anime_id = %s", (remove_id,))
        cursor.execute("DELETE FROM anime_embeddings WHERE anime_id = %s", (remove_id,))
        cursor.execute("DELETE FROM jikan_sync_queue WHERE anime_id = %s", (remove_id,))
        
        # Delete the duplicate anime entry
        cursor.execute("DELETE FROM anime WHERE anime_id = %s", (remove_id,))
        
        conn.commit()
        return True
        
    except Exception as e:
        print(f"Error merging anime_id {remove_id} into {keep_id}: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()

def main():
    """Main execution function"""
    print("=" * 60)
    print("Fix Duplicate Anime Entries")
    print("=" * 60)
    
    conn = get_connection()
    print("✅ Connected to database\n")
    
    # Find duplicates
    print("Searching for duplicates...")
    duplicates = find_duplicates(conn)
    
    if not duplicates:
        print("✅ No duplicates found!")
        conn.close()
        return
    
    print(f"📝 Found {len(duplicates)} duplicate titles\n")
    
    # Process each duplicate
    merged_count = 0
    skipped_count = 0
    
    for dup in duplicates:
        title = dup['title']
        print(f"\n{'='*60}")
        print(f"Title: {title}")
        print(f"Count: {dup['count']}")
        print(f"Anime IDs: {dup['anime_ids']}")
        print(f"MAL IDs: {dup['mal_ids']}")
        
        # Get all entries for this title
        entries = get_anime_by_title(conn, title)
        
        # The first entry (with MAL ID if available) is the one to keep
        keep_entry = entries[0]
        remove_entries = entries[1:]
        
        print(f"\n  Keep: anime_id={keep_entry['anime_id']}, mal_id={keep_entry['mal_id']}")
        
        for remove_entry in remove_entries:
            print(f"  Remove: anime_id={remove_entry['anime_id']}, mal_id={remove_entry['mal_id']}")
            
            # Merge and delete
            if merge_duplicate(conn, keep_entry['anime_id'], remove_entry['anime_id']):
                print(f"    ✅ Merged anime_id {remove_entry['anime_id']} into {keep_entry['anime_id']}")
                merged_count += 1
            else:
                print(f"    ❌ Failed to merge anime_id {remove_entry['anime_id']}")
                skipped_count += 1
    
    conn.close()
    
    print("\n" + "=" * 60)
    print(f"✅ Duplicate fixing completed!")
    print(f"   Merged: {merged_count} duplicates")
    if skipped_count > 0:
        print(f"   Skipped: {skipped_count} duplicates (check errors above)")
    print("=" * 60)

if __name__ == "__main__":
    main()
