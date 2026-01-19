import { JikanClient } from '@tutkli/jikan-ts';
import { setupCache } from 'axios-cache-interceptor';
import axios from 'axios';
import logger from '@/lib/logger';
import { retryWithBackoff } from '@/lib/retry';

const jikanLogger = logger.child({ service: 'JikanService' });

// Create axios instance with caching
const axiosInstance = setupCache(
  axios.create({
    baseURL: 'https://api.jikan.moe/v4',
    timeout: 10000,
  }),
  {
    ttl: 5 * 60 * 1000, // Cache for 5 minutes
    methods: ['get'],
  }
);

// Initialize Jikan client with caching
const jikanClient = new JikanClient({
  axiosInstance,
});

// Rate limiter to respect Jikan's 3 requests/second, 60 requests/minute limit
class RateLimiter {
  private queue: Array<() => void> = [];
  private requestTimestamps: number[] = [];
  private processing = false;

  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          // Remove timestamps older than 1 minute
          let now = Date.now();
          this.requestTimestamps = this.requestTimestamps.filter(
            ts => now - ts < 60000
          );

          // Check if we've hit the rate limit
          if (this.requestTimestamps.length >= 60) {
            // Wait until the oldest request is more than 1 minute old
            const oldestTimestamp = this.requestTimestamps[0];
            const waitTime = 60000 - (now - oldestTimestamp);
            if (waitTime > 0) {
              await new Promise(r => setTimeout(r, waitTime));
              // Recalculate now after waiting
              now = Date.now();
            }
          }

          // Wait for at least 334ms between requests (3 requests/second)
          if (this.requestTimestamps.length > 0) {
            const lastRequest = this.requestTimestamps[this.requestTimestamps.length - 1];
            const timeSinceLastRequest = now - lastRequest;
            if (timeSinceLastRequest < 334) {
              await new Promise(r => setTimeout(r, 334 - timeSinceLastRequest));
            }
          }

          this.requestTimestamps.push(Date.now());
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    this.processing = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
      }
    }
    this.processing = false;
  }
}

const rateLimiter = new RateLimiter();

// Normalized anime data structure matching our database schema
export interface NormalizedAnimeData {
  mal_id: number;
  title: string;
  english_title?: string | null;
  japanese_title?: string | null;
  synonyms?: string | null;
  description?: string | null;
  image_url?: string | null;
  score?: number | null;
  popularity?: number | null;
  rank?: number | null;
  rating?: string | null;
  status?: string | null;
  premiered?: string | null;
  demographic?: string | null;
  producers?: string | null;
  genres?: string[];
  studios?: string[];
  themes?: string[];
}

interface JikanNamedResource {
  name: string
}

interface JikanImages {
  jpg?: {
    image_url?: string | null
    large_image_url?: string | null
  } | null
}

interface JikanAired {
  prop?: {
    from?: unknown
  } | null
}

interface JikanAnime {
  mal_id: number
  title?: string | null
  title_english?: string | null
  title_japanese?: string | null
  title_synonyms?: string[] | null
  synopsis?: string | null
  images?: JikanImages | null
  score?: number | null
  popularity?: number | null
  rank?: number | null
  rating?: string | null
  status?: string | null
  season?: string | null
  year?: number | null
  aired?: JikanAired | null
  demographics?: JikanNamedResource[] | null
  producers?: JikanNamedResource[] | null
  genres?: JikanNamedResource[] | null
  studios?: JikanNamedResource[] | null
  themes?: JikanNamedResource[] | null
}

/**
 * Search anime on Jikan by name
 */
export async function searchJikanAnime(query: string, limit: number = 10): Promise<NormalizedAnimeData[]> {
  try {
    const result = await rateLimiter.throttle(async () => {
      return await retryWithBackoff(async () => {
        return await jikanClient.anime.getAnimeSearch({
          q: query,
          limit,
          order_by: 'popularity',
        });
      }, {
        maxRetries: 3,
        onRetry: (attempt, error, delay) => {
          jikanLogger.debug({ attempt, error, delay, query, limit }, 'Retrying Jikan API search call');
        }
      });
    });

    const data = result.data as JikanAnime[]
    return data.map((anime) => normalizeJikanData(anime));
  } catch (error) {
    jikanLogger.error({ error, query, limit }, 'Error searching Jikan anime');
    throw new Error('Failed to search anime on Jikan');
  }
}

/**
 * Get full anime details from Jikan by MAL ID
 */
export async function getJikanAnimeById(malId: number): Promise<NormalizedAnimeData> {
  try {
    const result = await rateLimiter.throttle(async () => {
      return await retryWithBackoff(async () => {
        return await jikanClient.anime.getAnimeById(malId);
      }, {
        maxRetries: 3,
        onRetry: (attempt, error, delay) => {
          jikanLogger.debug({ attempt, error, delay, malId }, 'Retrying Jikan API getAnimeById call');
        }
      });
    });

    return normalizeJikanData(result.data as JikanAnime);
  } catch (error) {
    jikanLogger.error({ error, malId }, 'Error fetching anime from Jikan');
    throw new Error(`Failed to fetch anime ${malId} from Jikan`);
  }
}

/**
 * Get multiple anime by MAL IDs (batch operation)
 */
export async function getJikanAnimeByIds(malIds: number[]): Promise<NormalizedAnimeData[]> {
  const results = await Promise.allSettled(
    malIds.map(id => getJikanAnimeById(id))
  );

  return results
    .filter((result): result is PromiseFulfilledResult<NormalizedAnimeData> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value);
}

/**
 * Get currently airing anime (current season)
 */
export async function getCurrentSeasonAnime(limit: number = 25): Promise<NormalizedAnimeData[]> {
  try {
    const result = await rateLimiter.throttle(async () => {
      return await retryWithBackoff(async () => {
        return await jikanClient.seasons.getSeasonNow({
          limit,
        });
      }, {
        maxRetries: 3,
        onRetry: (attempt, error, delay) => {
          jikanLogger.debug({ attempt, error, delay, limit }, 'Retrying Jikan API getSeasonNow call');
        }
      });
    });

    const data = result.data as JikanAnime[]
    return data.map((anime) => normalizeJikanData(anime));
  } catch (error) {
    jikanLogger.error({ error, limit }, 'Error fetching current season anime');
    throw new Error('Failed to fetch current season anime');
  }
}

/**
 * Get upcoming anime (next season)
 */
export async function getUpcomingAnime(limit: number = 25): Promise<NormalizedAnimeData[]> {
  try {
    const result = await rateLimiter.throttle(async () => {
      return await retryWithBackoff(async () => {
        return await jikanClient.seasons.getSeasonUpcoming({
          limit,
        });
      }, {
        maxRetries: 3,
        onRetry: (attempt, error, delay) => {
          jikanLogger.debug({ attempt, error, delay, limit }, 'Retrying Jikan API getSeasonUpcoming call');
        }
      });
    });

    const data = result.data as JikanAnime[]
    return data.map((anime) => normalizeJikanData(anime));
  } catch (error) {
    jikanLogger.error({ error, limit }, 'Error fetching upcoming anime');
    throw new Error('Failed to fetch upcoming anime');
  }
}

/**
 * Convert Jikan API response to our normalized database schema
 */
function normalizeJikanData(jikanAnime: JikanAnime): NormalizedAnimeData {
  return {
    mal_id: jikanAnime.mal_id,
    title: jikanAnime.title || jikanAnime.title_english || 'Unknown',
    english_title: jikanAnime.title_english || null,
    japanese_title: jikanAnime.title_japanese || null,
    synonyms: jikanAnime.title_synonyms?.join(', ') || null,
    description: jikanAnime.synopsis || null,
    image_url: jikanAnime.images?.jpg?.large_image_url || jikanAnime.images?.jpg?.image_url || null,
    score: jikanAnime.score || null,
    popularity: jikanAnime.popularity || null,
    rank: jikanAnime.rank || null,
    rating: jikanAnime.rating || null,
    status: jikanAnime.status || null,
    premiered: jikanAnime.aired?.prop?.from 
      ? `${jikanAnime.season || ''} ${jikanAnime.year || ''}`.trim()
      : null,
    demographic: jikanAnime.demographics?.[0]?.name || null,
    producers: jikanAnime.producers?.map(p => p.name).join(', ') || null,
    genres: jikanAnime.genres?.map(g => g.name) || [],
    studios: jikanAnime.studios?.map(s => s.name) || [],
    themes: jikanAnime.themes?.map(t => t.name) || [],
  };
}

/**
 * Check if data is stale (older than threshold)
 */
export function isDataStale(lastSync: Date | null, thresholdDays: number = 30): boolean {
  if (!lastSync) return true;
  
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastSync.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > thresholdDays;
}
