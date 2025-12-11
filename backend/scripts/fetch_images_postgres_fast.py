"""
Fast async anime image fetcher using concurrent requests
Respects Jikan API rate limits: 3 requests/second (60/minute)
"""

import asyncio
import aiohttp
import psycopg2
from psycopg2.extras import execute_batch
import os
from dotenv import load_dotenv
from datetime import datetime
import time

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print("Error: DATABASE_URL not found in environment variables")
    exit(1)

JIKAN_API_URL = "https://api.jikan.moe/v4/anime"
REQUESTS_PER_SECOND = 1  # 1 req/sec to stay under 60/min limit
REQUESTS_PER_MINUTE = 55  # 55 req/min (below 60 limit)
BATCH_SIZE = 50  # Process in batches
DELAY_BETWEEN_REQUESTS = 1.1  # 1.1 seconds between requests (safe)

class RateLimiter:
    """Token bucket rate limiter with per-second and per-minute tracking"""
    def __init__(self, rate_per_second=1, rate_per_minute=55):
        self.rate_per_second = rate_per_second
        self.rate_per_minute = rate_per_minute
        self.tokens_second = rate_per_second
        self.tokens_minute = rate_per_minute
        self.updated_at = time.monotonic()
        self.minute_started_at = time.monotonic()
        self.lock = asyncio.Lock()
    
    async def acquire(self):
        async with self.lock:
            # Reset minute counter if a minute has passed
            now = time.monotonic()
            if now - self.minute_started_at >= 60:
                self.tokens_minute = self.rate_per_minute
                self.minute_started_at = now
            
            # Refill per-second tokens based on elapsed time
            elapsed = now - self.updated_at
            self.tokens_second = min(self.rate_per_second, self.tokens_second + elapsed * self.rate_per_second)
            self.updated_at = now
            
            # Wait if no tokens available (check both limits)
            while self.tokens_second < 1 or self.tokens_minute < 1:
                await asyncio.sleep(0.2)
                now = time.monotonic()
                
                # Reset minute counter if needed
                if now - self.minute_started_at >= 60:
                    self.tokens_minute = self.rate_per_minute
                    self.minute_started_at = now
                
                # Refill per-second tokens
                elapsed = now - self.updated_at
                self.tokens_second = min(self.rate_per_second, self.tokens_second + elapsed * self.rate_per_second)
                self.updated_at = now
            
            self.tokens_second -= 1
            self.tokens_minute -= 1
            # Add small delay between requests
            await asyncio.sleep(DELAY_BETWEEN_REQUESTS)
    
async def fetch_anime_image(session, rate_limiter, anime_id, title_options):
    """Fetch image URL from Jikan API with rate limiting"""
    
    for search_title in title_options:
        if not search_title:
            continue
        
        try:
            await rate_limiter.acquire()
            
            async with session.get(
                JIKAN_API_URL,
                params={"q": search_title, "limit": 1},
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    if data.get("data") and len(data["data"]) > 0:
                        anime_data = data["data"][0]
                        image_url = anime_data.get("images", {}).get("jpg", {}).get("image_url")
                        
                        if image_url:
                            return anime_id, image_url, search_title
                
                elif response.status == 429:
                    # Rate limit hit - skip this anime
                    print(f"⚠ Rate limit (429) for anime {anime_id} - skipping")
                    break
        
        except asyncio.TimeoutError:
            continue
        except Exception as e:
            continue
    
    return anime_id, None, None

async def fetch_batch(anime_batch):
    """Fetch images for a batch of anime with controlled concurrency"""
    rate_limiter = RateLimiter(rate_per_second=REQUESTS_PER_SECOND, rate_per_minute=REQUESTS_PER_MINUTE)
    
    connector = aiohttp.TCPConnector(limit=1)  # Only 1 connection at a time
    timeout = aiohttp.ClientTimeout(total=60)
    
    async with aiohttp.ClientSession(connector=connector, timeout=timeout) as session:
        # Use semaphore to ensure truly sequential requests
        semaphore = asyncio.Semaphore(1)  # Strictly sequential - one at a time
        
        async def fetch_with_semaphore(anime_data):
            async with semaphore:
                anime_id, title, english_title, japanese_title = anime_data
                title_options = [english_title, title, japanese_title]
                return await fetch_anime_image(session, rate_limiter, anime_id, title_options)
        
        tasks = [fetch_with_semaphore(anime) for anime in anime_batch]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions and failed fetches
        successful = []
        failed = []
        
        for result in results:
            if isinstance(result, Exception):
                failed.append(None)
            elif result[1] is not None:  # Has image_url
                successful.append(result)
            else:
                failed.append(result[0])
        
        return successful, failed

def update_database(updates):
    """Batch update database with fetched images"""
    if not updates:
        return 0
    
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        execute_batch(
            cur,
            "UPDATE anime SET image_url = %s WHERE anime_id = %s",
            [(image_url, anime_id) for anime_id, image_url, _ in updates]
        )
        conn.commit()
        return len(updates)
    except Exception as e:
        print(f"Database error: {str(e)}")
        conn.rollback()
        return 0
    finally:
        cur.close()
        conn.close()

async def process_all_anime(limit=None):
    """Main processing function"""
    # Get anime without images
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
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
    cur.close()
    conn.close()
    
    total = len(anime_list)
    print(f"\n{'='*70}")
    print(f"Fast Anime Image Fetcher (Conservative Mode)")
    print(f"{'='*70}")
    print(f"Total anime without images: {total}")
    print(f"Batch size: {BATCH_SIZE}")
    print(f"Rate limit: {REQUESTS_PER_SECOND} req/sec | {REQUESTS_PER_MINUTE} req/min")
    print(f"Delay between requests: {DELAY_BETWEEN_REQUESTS}s")
    print(f"Estimated time: {(total * DELAY_BETWEEN_REQUESTS) / 60:.1f} minutes")
    print(f"{'='*70}\n")
    
    start_time = datetime.now()
    total_updated = 0
    total_failed = 0
    
    # Process in batches
    for i in range(0, total, BATCH_SIZE):
        batch = anime_list[i:i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        total_batches = (total + BATCH_SIZE - 1) // BATCH_SIZE
        
        print(f"\n[Batch {batch_num}/{total_batches}] Processing {len(batch)} anime...")
        batch_start = datetime.now()
        
        successful, failed = await fetch_batch(batch)
        
        # Update database
        updated = update_database(successful)
        total_updated += updated
        total_failed += len(failed)
        
        batch_time = (datetime.now() - batch_start).total_seconds()
        
        print(f"  ✓ Updated: {updated}")
        print(f"  ✗ Failed: {len(failed)}")
        print(f"  ⏱ Time: {batch_time:.1f}s")
        
        # Show some examples
        if successful:
            for anime_id, image_url, title in successful[:3]:
                print(f"    • {title[:50]}")
    
    elapsed = (datetime.now() - start_time).total_seconds()
    
    print(f"\n{'='*70}")
    print(f"Summary:")
    print(f"  Total processed: {total}")
    print(f"  Successfully updated: {total_updated}")
    print(f"  Failed: {total_failed}")
    print(f"  Total time: {elapsed / 60:.1f} minutes")
    print(f"  Average: {total / elapsed:.1f} anime/second")
    print(f"{'='*70}\n")

if __name__ == "__main__":
    try:
        # Remove limit to process all anime, or set a number for testing
        asyncio.run(process_all_anime(limit=None))  # Process ALL anime
        
    except KeyboardInterrupt:
        print("\n\n⚠ Interrupted by user")
    except Exception as e:
        print(f"\n❌ Fatal error: {str(e)}")
        import traceback
        traceback.print_exc()
