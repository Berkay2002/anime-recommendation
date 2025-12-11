"""
Fetch anime images from Jikan API and update PostgreSQL database
This script fetches image URLs for anime that don't have them yet.
"""

import requests
import time
import psycopg2
from psycopg2.extras import execute_batch
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# PostgreSQL connection
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print("Error: DATABASE_URL not found in environment variables")
    exit(1)

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Jikan API base URL
JIKAN_API_URL = "https://api.jikan.moe/v4/anime"

def fetch_anime_image(title, anime_id):
    """Fetch image URL from Jikan API for a given anime title"""
    try:
        # Search by title
        response = requests.get(JIKAN_API_URL, params={"q": title, "limit": 1}, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("data") and len(data["data"]) > 0:
                anime_data = data["data"][0]
                image_url = anime_data.get("images", {}).get("jpg", {}).get("image_url")
                
                if image_url:
                    print(f"✓ Found image for: {title}")
                    return image_url
                else:
                    print(f"✗ No image URL in response for: {title}")
            else:
                print(f"✗ No results found for: {title}")
        elif response.status_code == 429:
            print("⚠ Rate limit hit, waiting 60 seconds...")
            time.sleep(60)
            return fetch_anime_image(title, anime_id)  # Retry
        else:
            print(f"✗ API error {response.status_code} for: {title}")
            
    except requests.exceptions.Timeout:
        print(f"✗ Timeout fetching: {title}")
    except Exception as e:
        print(f"✗ Error fetching {title}: {str(e)}")
    
    return None

def update_anime_images(limit=None):
    """Fetch and update images for anime without image_url"""
    
    # Get anime without images
    query = """
        SELECT anime_id, title, english_title, japanese_title
        FROM anime
        WHERE image_url IS NULL
        ORDER BY popularity ASC
    """
    
    if limit:
        query += f" LIMIT {limit}"
    
    cur.execute(query)
    anime_list = cur.fetchall()
    
    total = len(anime_list)
    print(f"\nFound {total} anime without images")
    print("=" * 60)
    
    updated_count = 0
    failed_count = 0
    
    for idx, (anime_id, title, english_title, japanese_title) in enumerate(anime_list, 1):
        print(f"\n[{idx}/{total}] Processing anime_id={anime_id}")
        
        # Try titles in order: English, Title, Japanese
        title_options = [
            english_title,
            title,
            japanese_title
        ]
        
        image_url = None
        for search_title in title_options:
            if search_title:
                print(f"  Searching: {search_title}")
                image_url = fetch_anime_image(search_title, anime_id)
                if image_url:
                    break
                time.sleep(1)  # Rate limit: 1 request per second
        
        if image_url:
            # Update database
            try:
                cur.execute(
                    "UPDATE anime SET image_url = %s WHERE anime_id = %s",
                    (image_url, anime_id)
                )
                conn.commit()
                updated_count += 1
                print(f"  ✓ Updated database for anime_id={anime_id}")
            except Exception as e:
                print(f"  ✗ Database error: {str(e)}")
                conn.rollback()
                failed_count += 1
        else:
            print(f"  ✗ No image found for any title variant")
            failed_count += 1
        
        # Be nice to the API - wait between requests
        if idx < total:
            time.sleep(1)
    
    print("\n" + "=" * 60)
    print(f"Summary:")
    print(f"  Updated: {updated_count}")
    print(f"  Failed:  {failed_count}")
    print(f"  Total:   {total}")

if __name__ == "__main__":
    try:
        print("Anime Image Fetcher for PostgreSQL")
        print("=" * 60)
        
        # You can change the limit or remove it to process all
        # For testing, start with a small number like 10
        update_anime_images(limit=50)  # Start with 50 anime
        
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
    except Exception as e:
        print(f"\nFatal error: {str(e)}")
    finally:
        cur.close()
        conn.close()
        print("\nConnection closed")
