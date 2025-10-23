// IndexedDB cache for anime embeddings
// This provides fast, offline-capable storage for anime data

const DB_NAME = 'AnimeRecommendationDB';
const STORE_NAME = 'animeEmbeddings';
const DB_VERSION = 1;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Default number of anime with embeddings to load for recommendation computation.
 * This represents the complete dataset of anime with BERT embeddings available
 * in the database for client-side cosine similarity calculations.
 */
export const DEFAULT_ANIME_LIMIT = 657;

interface CacheMetadata {
  version: number;
  timestamp: number;
  count: number;
}

interface AnimeWithEmbeddings {
  anime_id: number;
  title: string;
  image_url?: string;
  Description?: string;
  Score?: number;
  Rank?: number;
  Popularity?: number;
  Genres?: string[];
  Demographic?: string;
  Rating?: string;
  bert_description: number[];
  bert_genres: number[];
  bert_demographic: number[];
  bert_rating: number[];
  bert_themes: number[];
  English?: string;
  Japanese?: string;
  Synonyms?: string;
  themes?: string[];
  Status?: string;
  Premiered?: string;
  Studios?: string[];
}

/**
 * Open the IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'anime_id' });
        objectStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Create metadata store for cache info
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    };
  });
}

/**
 * Get cache metadata (version, timestamp, etc.)
 */
async function getCacheMetadata(): Promise<CacheMetadata | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['metadata'], 'readonly');
    const store = transaction.objectStore('metadata');
    const request = store.get('cache_info');

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update cache metadata
 */
async function setCacheMetadata(metadata: CacheMetadata): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['metadata'], 'readwrite');
    const store = transaction.objectStore('metadata');
    const request = store.put({ key: 'cache_info', ...metadata });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if cache is valid and not expired
 */
export async function isCacheValid(): Promise<boolean> {
  try {
    const metadata = await getCacheMetadata();
    if (!metadata) return false;

    const now = Date.now();
    const isExpired = (now - metadata.timestamp) > CACHE_DURATION;

    return !isExpired && metadata.count > 0;
  } catch (error) {
    console.error('Error checking cache validity:', error);
    return false;
  }
}

/**
 * Get all anime with embeddings from cache
 */
export async function getCachedAnime(): Promise<AnimeWithEmbeddings[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting cached anime:', error);
    return [];
  }
}

/**
 * Cache anime data with embeddings
 */
export async function cacheAnime(animeList: AnimeWithEmbeddings[]): Promise<void> {
  try {
    const db = await openDB();

    // Use a single transaction for all writes
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Clear existing data
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Add all anime
    for (const anime of animeList) {
      store.put(anime);
    }

    // Wait for transaction to complete
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    // Update metadata
    await setCacheMetadata({
      version: DB_VERSION,
      timestamp: Date.now(),
      count: animeList.length,
    });

    console.log(`Cached ${animeList.length} anime with embeddings`);
  } catch (error) {
    console.error('Error caching anime:', error);
    throw error;
  }
}

/**
 * Clear the cache
 */
export async function clearCache(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME, 'metadata'], 'readwrite');

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore(STORE_NAME).clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('metadata').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
    ]);

    console.log('Cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Fetch anime with embeddings, using cache when available
 */
export async function fetchAnimeWithCache(limit: number = DEFAULT_ANIME_LIMIT): Promise<AnimeWithEmbeddings[]> {
  try {
    // Check if cache is valid
    const cacheValid = await isCacheValid();

    if (cacheValid) {
      console.log('Loading anime from IndexedDB cache');
      const cachedData = await getCachedAnime();
      if (cachedData.length > 0) {
        return cachedData;
      }
    }

    // Cache miss or expired - fetch from API
    console.log('Cache miss - fetching anime from API');
    const response = await fetch(`/api/anime/features?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch anime: ${response.status}`);
    }

    const animeList: AnimeWithEmbeddings[] = await response.json();

    // Cache the data in the background (don't await)
    cacheAnime(animeList).catch(err =>
      console.error('Failed to cache anime data:', err)
    );

    return animeList;
  } catch (error) {
    console.error('Error in fetchAnimeWithCache:', error);

    // Try to return cached data even if expired as fallback
    const cachedData = await getCachedAnime();
    if (cachedData.length > 0) {
      console.log('Returning stale cache data due to fetch error');
      return cachedData;
    }

    throw error;
  }
}
