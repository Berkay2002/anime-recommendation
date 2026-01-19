import { sql } from '@vercel/postgres';
import logger from '@/lib/logger';
import {
  searchJikanAnime,
  getJikanAnimeById,
  getCurrentSeasonAnime,
  getUpcomingAnime,
  isDataStale,
  NormalizedAnimeData,
} from './jikanService';

const cacheLogger = logger.child({ service: 'AnimeCacheService' });

// Cache freshness thresholds (in days)
const FRESHNESS_THRESHOLDS = {
  CORE_METADATA: 30, // title, genres, score, etc.
  IMAGES: 90,
  REVIEWS: 7,
};

export interface CachedAnimeData extends NormalizedAnimeData {
  anime_id?: number;
  last_jikan_sync?: Date;
  sync_status?: 'fresh' | 'stale' | 'pending_embeddings';
}

/**
 * Smart cache search: checks PostgreSQL first, then falls back to Jikan
 */
export async function searchAnimeWithCache(
  query: string,
  limit: number = 10
): Promise<CachedAnimeData[]> {
  try {
    // Step 1: Check PostgreSQL first
    const dbResults = await searchAnimeInDatabase(query, limit);

    // Step 2: If we have enough fresh results, return them
    const freshResults = dbResults.filter(
      anime => !isDataStale(anime.last_jikan_sync || null, FRESHNESS_THRESHOLDS.CORE_METADATA)
    );

    if (freshResults.length >= limit) {
      return freshResults.slice(0, limit);
    }

    // Step 3: Query Jikan for additional/fresh results
    try {
      const jikanResults = await searchJikanAnime(query, limit);
      
      // Step 4: Merge and deduplicate results (prioritize fresh data)
      const mergedResults = await mergeAndStoreResults(jikanResults, dbResults);
      
      return mergedResults.slice(0, limit);
    } catch (jikanError) {
      cacheLogger.error({ error: jikanError, query, limit }, 'Jikan API error, falling back to DB results');
      // If Jikan fails, return DB results even if stale
      return dbResults.slice(0, limit);
    }
  } catch (error) {
    cacheLogger.error({ error, query, limit }, 'Error in searchAnimeWithCache');
    throw error;
  }
}

/**
 * Get anime by MAL ID with intelligent caching
 */
export async function getAnimeByMalIdWithCache(malId: number): Promise<CachedAnimeData | null> {
  try {
    // Step 1: Check PostgreSQL first
    const dbAnime = await getAnimeByMalIdFromDatabase(malId);

    // Step 2: If found and fresh, return it
    if (dbAnime && !isDataStale(dbAnime.last_jikan_sync || null, FRESHNESS_THRESHOLDS.CORE_METADATA)) {
      return dbAnime;
    }

    // Step 3: If stale or not found, fetch from Jikan
    try {
      const jikanAnime = await getJikanAnimeById(malId);
      
      // Step 4: Store/update in database
      const updatedAnime = await upsertAnimeToDatabase(jikanAnime);
      
      // Step 5: Queue for embedding generation if new
      if (!dbAnime) {
        await queueForEmbeddingGeneration(updatedAnime.anime_id!, malId, 'high');
      }
      
      return updatedAnime;
    } catch (jikanError) {
      cacheLogger.error({ error: jikanError, malId }, 'Jikan API error for MAL ID, returning cached data');
      // Return stale data if Jikan fails
      return dbAnime;
    }
  } catch (error) {
    cacheLogger.error({ error, malId }, 'Error in getAnimeByMalIdWithCache for MAL ID');
    return null;
  }
}

/**
 * Search anime in PostgreSQL database
 */
async function searchAnimeInDatabase(query: string, limit: number): Promise<CachedAnimeData[]> {
  try {
    const result = await sql`
      SELECT 
        a.anime_id,
        a.mal_id,
        a.title,
        a.english_title,
        a.japanese_title,
        a.synonyms,
        a.description,
        a.image_url,
        a.score,
        a.popularity,
        a.rank,
        a.rating,
        a.status,
        a.premiered,
        a.demographic,
        a.producers,
        a.last_jikan_sync,
        a.sync_status,
        ARRAY_AGG(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL) as genres,
        ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as studios,
        ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as themes
      FROM anime a
      LEFT JOIN anime_genres ag ON a.anime_id = ag.anime_id
      LEFT JOIN genres g ON ag.genre_id = g.id
      LEFT JOIN anime_studios ast ON a.anime_id = ast.anime_id
      LEFT JOIN studios s ON ast.studio_id = s.id
      LEFT JOIN anime_themes at ON a.anime_id = at.anime_id
      LEFT JOIN themes t ON at.theme_id = t.id
      WHERE 
        a.title ILIKE ${`%${query}%`}
        OR a.english_title ILIKE ${`%${query}%`}
        OR a.japanese_title ILIKE ${`%${query}%`}
        OR a.synonyms ILIKE ${`%${query}%`}
      GROUP BY a.anime_id, a.mal_id, a.title, a.english_title, a.japanese_title, 
        a.synonyms, a.description, a.image_url, a.score, a.popularity, a.rank, 
        a.rating, a.status, a.premiered, a.demographic, a.producers, 
        a.last_jikan_sync, a.sync_status
      ORDER BY 
        CASE WHEN a.popularity IS NOT NULL THEN 0 ELSE 1 END,
        a.popularity ASC,
        a.score DESC NULLS LAST
      LIMIT ${limit}
    `;

    return result.rows.map(row => ({
      anime_id: row.anime_id,
      mal_id: row.mal_id,
      title: row.title,
      english_title: row.english_title,
      japanese_title: row.japanese_title,
      synonyms: row.synonyms,
      description: row.description,
      image_url: row.image_url,
      score: row.score ? parseFloat(row.score) : null,
      popularity: row.popularity,
      rank: row.rank,
      rating: row.rating,
      status: row.status,
      premiered: row.premiered,
      demographic: row.demographic,
      producers: row.producers,
      last_jikan_sync: row.last_jikan_sync ? new Date(row.last_jikan_sync) : null,
      sync_status: row.sync_status || 'fresh',
      genres: row.genres || [],
      studios: row.studios || [],
      themes: row.themes || [],
    }));
  } catch (error) {
    cacheLogger.error({ error, query, limit }, 'Error searching anime in database');
    return [];
  }
}

/**
 * Get anime by MAL ID from PostgreSQL
 */
async function getAnimeByMalIdFromDatabase(malId: number): Promise<CachedAnimeData | null> {
  try {
    const result = await sql`
      SELECT 
        a.anime_id,
        a.mal_id,
        a.title,
        a.english_title,
        a.japanese_title,
        a.synonyms,
        a.description,
        a.image_url,
        a.score,
        a.popularity,
        a.rank,
        a.rating,
        a.status,
        a.premiered,
        a.demographic,
        a.producers,
        a.last_jikan_sync,
        a.sync_status,
        ARRAY_AGG(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL) as genres,
        ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as studios,
        ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as themes
      FROM anime a
      LEFT JOIN anime_genres ag ON a.anime_id = ag.anime_id
      LEFT JOIN genres g ON ag.genre_id = g.id
      LEFT JOIN anime_studios ast ON a.anime_id = ast.anime_id
      LEFT JOIN studios s ON ast.studio_id = s.id
      LEFT JOIN anime_themes at ON a.anime_id = at.anime_id
      LEFT JOIN themes t ON at.theme_id = t.id
      WHERE a.mal_id = ${malId}
      GROUP BY a.anime_id, a.mal_id, a.title, a.english_title, a.japanese_title, 
        a.synonyms, a.description, a.image_url, a.score, a.popularity, a.rank, 
        a.rating, a.status, a.premiered, a.demographic, a.producers, 
        a.last_jikan_sync, a.sync_status
    `;

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      anime_id: row.anime_id,
      mal_id: row.mal_id,
      title: row.title,
      english_title: row.english_title,
      japanese_title: row.japanese_title,
      synonyms: row.synonyms,
      description: row.description,
      image_url: row.image_url,
      score: row.score ? parseFloat(row.score) : null,
      popularity: row.popularity,
      rank: row.rank,
      rating: row.rating,
      status: row.status,
      premiered: row.premiered,
      demographic: row.demographic,
      producers: row.producers,
      last_jikan_sync: row.last_jikan_sync ? new Date(row.last_jikan_sync) : null,
      sync_status: row.sync_status || 'fresh',
      genres: row.genres || [],
      studios: row.studios || [],
      themes: row.themes || [],
    };
  } catch (error) {
    cacheLogger.error({ error, malId }, 'Error fetching anime by MAL ID from database');
    return null;
  }
}

/**
 * Upsert anime to database (insert or update)
 */
async function upsertAnimeToDatabase(anime: NormalizedAnimeData): Promise<CachedAnimeData> {
  try {
    cacheLogger.debug({ mal_id: anime.mal_id, title: anime.title }, 'Processing anime upsert');

    // Verify anime object doesn't have anime_id (it shouldn't)
    if ('anime_id' in anime) {
      cacheLogger.warn({ anime }, 'WARNING: anime object has anime_id property');
    }
    
    // Check if an entry with same title but NULL mal_id exists (potential duplicate)
    // If so, update it with the MAL ID to prevent duplicates
    const existingCheck = await sql`
      SELECT anime_id FROM anime 
      WHERE title = ${anime.title} AND mal_id IS NULL
      LIMIT 1
    `;
    
    let result;
    
    if (existingCheck.rows.length > 0 && anime.mal_id) {
      // Update existing entry with NULL mal_id
      cacheLogger.debug({ anime_id: existingCheck.rows[0].anime_id, mal_id: anime.mal_id }, 'Found duplicate with NULL mal_id, updating');
      result = await sql`
        UPDATE anime SET
          mal_id = ${anime.mal_id},
          title = ${anime.title},
          english_title = ${anime.english_title},
          japanese_title = ${anime.japanese_title},
          synonyms = ${anime.synonyms},
          description = ${anime.description},
          image_url = ${anime.image_url},
          score = ${anime.score},
          popularity = ${anime.popularity},
          rank = ${anime.rank},
          rating = ${anime.rating},
          status = ${anime.status},
          premiered = ${anime.premiered},
          demographic = ${anime.demographic},
          producers = ${anime.producers},
          last_jikan_sync = NOW(),
          sync_status = 'pending_embeddings',
          updated_at = NOW()
        WHERE anime_id = ${existingCheck.rows[0].anime_id}
        RETURNING anime_id, mal_id, last_jikan_sync, sync_status
      `;
    } else {
      // Normal insert/update with mal_id conflict resolution
      result = await sql`
        INSERT INTO anime (
          mal_id, title, english_title, japanese_title, synonyms, 
          description, image_url, score, popularity, rank, rating, 
          status, premiered, demographic, producers, 
          last_jikan_sync, sync_status, created_at, updated_at
        )
        VALUES (
          ${anime.mal_id}, ${anime.title}, ${anime.english_title}, ${anime.japanese_title}, 
          ${anime.synonyms}, ${anime.description}, ${anime.image_url}, ${anime.score}, 
          ${anime.popularity}, ${anime.rank}, ${anime.rating}, ${anime.status}, 
          ${anime.premiered}, ${anime.demographic}, ${anime.producers}, 
          NOW(), 'pending_embeddings', NOW(), NOW()
        )
        ON CONFLICT (mal_id) DO UPDATE SET
          title = EXCLUDED.title,
          english_title = EXCLUDED.english_title,
          japanese_title = EXCLUDED.japanese_title,
          synonyms = EXCLUDED.synonyms,
          description = EXCLUDED.description,
          image_url = EXCLUDED.image_url,
          score = EXCLUDED.score,
          popularity = EXCLUDED.popularity,
          rank = EXCLUDED.rank,
          rating = EXCLUDED.rating,
          status = EXCLUDED.status,
          premiered = EXCLUDED.premiered,
          demographic = EXCLUDED.demographic,
          producers = EXCLUDED.producers,
          last_jikan_sync = NOW(),
          sync_status = CASE 
            WHEN anime.sync_status = 'pending_embeddings' THEN 'pending_embeddings'
            ELSE 'fresh'
          END,
          updated_at = NOW()
        RETURNING anime_id, mal_id, last_jikan_sync, sync_status
      `;
    }

    cacheLogger.debug({ anime_id: result.rows[0]?.anime_id, mal_id: result.rows[0]?.mal_id }, 'Anime upsert successful');

    const insertedAnime = result.rows[0];

    // Handle genres
    if (anime.genres && anime.genres.length > 0) {
      await upsertGenresAndRelations(insertedAnime.anime_id, anime.genres);
    }

    // Handle studios
    if (anime.studios && anime.studios.length > 0) {
      await upsertStudiosAndRelations(insertedAnime.anime_id, anime.studios);
    }

    // Handle themes
    if (anime.themes && anime.themes.length > 0) {
      await upsertThemesAndRelations(insertedAnime.anime_id, anime.themes);
    }

    return {
      ...anime,
      anime_id: insertedAnime.anime_id,
      last_jikan_sync: new Date(insertedAnime.last_jikan_sync),
      sync_status: insertedAnime.sync_status,
    };
  } catch (error) {
    cacheLogger.error({ error, mal_id: anime.mal_id, title: anime.title }, 'Error upserting anime to database');
    throw error;
  }
}

/**
 * Upsert genres and their relations
 */
async function upsertGenresAndRelations(animeId: number, genres: string[]): Promise<void> {
  for (const genreName of genres) {
    try {
      // Insert genre if not exists
      const genreResult = await sql`
        INSERT INTO genres (name)
        VALUES (${genreName})
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `;
      
      const genreId = genreResult.rows[0].id;

      // Insert anime-genre relation
      await sql`
        INSERT INTO anime_genres (anime_id, genre_id)
        VALUES (${animeId}, ${genreId})
        ON CONFLICT (anime_id, genre_id) DO NOTHING
      `;
    } catch (error) {
      cacheLogger.error({ error, animeId, genreName }, 'Error upserting genre');
    }
  }
}

/**
 * Upsert studios and their relations
 */
async function upsertStudiosAndRelations(animeId: number, studios: string[]): Promise<void> {
  for (const studioName of studios) {
    try {
      // Insert studio if not exists
      const studioResult = await sql`
        INSERT INTO studios (name)
        VALUES (${studioName})
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `;
      
      const studioId = studioResult.rows[0].id;

      // Insert anime-studio relation
      await sql`
        INSERT INTO anime_studios (anime_id, studio_id)
        VALUES (${animeId}, ${studioId})
        ON CONFLICT (anime_id, studio_id) DO NOTHING
      `;
    } catch (error) {
      cacheLogger.error({ error, animeId, studioName }, 'Error upserting studio');
    }
  }
}

/**
 * Upsert themes and their relations
 */
async function upsertThemesAndRelations(animeId: number, themes: string[]): Promise<void> {
  for (const themeName of themes) {
    try {
      // Insert theme if not exists
      const themeResult = await sql`
        INSERT INTO themes (name)
        VALUES (${themeName})
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `;
      
      const themeId = themeResult.rows[0].id;

      // Insert anime-theme relation
      await sql`
        INSERT INTO anime_themes (anime_id, theme_id)
        VALUES (${animeId}, ${themeId})
        ON CONFLICT (anime_id, theme_id) DO NOTHING
      `;
    } catch (error) {
      cacheLogger.error({ error, animeId, themeName }, 'Error upserting theme');
    }
  }
}

/**
 * Merge Jikan results with DB results, store new ones, and deduplicate
 */
async function mergeAndStoreResults(
  jikanResults: NormalizedAnimeData[],
  dbResults: CachedAnimeData[]
): Promise<CachedAnimeData[]> {
  const dbMalIds = new Set(dbResults.map(a => a.mal_id));
  const merged: CachedAnimeData[] = [...dbResults];

  // Store new anime from Jikan and add to merged results
  for (const jikanAnime of jikanResults) {
    if (!dbMalIds.has(jikanAnime.mal_id)) {
      try {
        const storedAnime = await upsertAnimeToDatabase(jikanAnime);
        merged.push(storedAnime);
        
        // Queue for embedding generation (high priority, max 2 per search)
        if (merged.filter(a => a.sync_status === 'pending_embeddings').length <= 2) {
          await queueForEmbeddingGeneration(storedAnime.anime_id!, jikanAnime.mal_id, 'high');
        }
      } catch (error) {
        cacheLogger.error({ error, mal_id: jikanAnime.mal_id }, 'Error storing anime');
      }
    }
  }

  return deduplicateAnime(merged);
}

/**
 * Add anime to embedding generation queue
 */
export async function queueForEmbeddingGeneration(
  animeId: number,
  malId: number,
  priority: 'high' | 'low' = 'low'
): Promise<void> {
  try {
    await sql`
      INSERT INTO jikan_sync_queue (anime_id, mal_id, priority)
      VALUES (${animeId}, ${malId}, ${priority})
      ON CONFLICT (anime_id) DO UPDATE SET
        priority = CASE 
          WHEN jikan_sync_queue.priority = 'low' AND EXCLUDED.priority = 'high' 
          THEN 'high'
          ELSE jikan_sync_queue.priority
        END
    `;
  } catch (error) {
    cacheLogger.error({ error, animeId, priority }, 'Error queueing anime for embeddings');
  }
}

/**
 * Get anime from queue for processing
 */
export async function getQueuedAnimeForProcessing(
  priority: 'high' | 'low' = 'high',
  limit: number = 2
): Promise<Array<{ anime_id: number; mal_id: number }>> {
  try {
    const result = await sql`
      SELECT anime_id, mal_id
      FROM jikan_sync_queue
      WHERE priority = ${priority} AND processed_at IS NULL
      ORDER BY created_at ASC
      LIMIT ${limit}
    `;

    return result.rows as Array<{ anime_id: number; mal_id: number }>;
  } catch (error) {
    cacheLogger.error({ error, priority, limit }, 'Error getting queued anime');
    return [];
  }
}

/**
 * Mark anime as processed in queue
 */
export async function markAnimeAsProcessed(animeId: number): Promise<void> {
  try {
    await sql`
      UPDATE jikan_sync_queue
      SET processed_at = NOW()
      WHERE anime_id = ${animeId}
    `;
  } catch (error) {
    cacheLogger.error({ error, animeId }, 'Error marking anime as processed');
  }
}

/**
 * Update anime sync status
 */
export async function updateAnimeSyncStatus(
  animeId: number,
  status: 'fresh' | 'stale' | 'pending_embeddings'
): Promise<void> {
  try {
    await sql`
      UPDATE anime
      SET sync_status = ${status}, updated_at = NOW()
      WHERE anime_id = ${animeId}
    `;
  } catch (error) {
    cacheLogger.error({ error, animeId, status }, 'Error updating sync status for anime');
  }
}

/**
 * Deduplicate anime array by anime_id
 */
function deduplicateAnime(anime: CachedAnimeData[]): CachedAnimeData[] {
  const seen = new Set<number>();
  return anime.filter(item => {
    if (seen.has(item.anime_id!)) {
      cacheLogger.warn({ anime_id: item.anime_id }, 'Duplicate anime_id detected and removed');
      return false;
    }
    seen.add(item.anime_id!);
    return true;
  });
}

/**
 * Get currently airing anime with intelligent caching
 */
export async function getCurrentSeasonAnimeWithCache(limit: number = 25): Promise<CachedAnimeData[]> {
  try {
    // Check database first for anime marked as currently airing
    const dbResults = await sql`
      SELECT 
        a.anime_id,
        a.mal_id,
        a.title,
        a.english_title,
        a.japanese_title,
        a.synonyms,
        a.description,
        a.image_url,
        a.score,
        a.popularity,
        a.rank,
        a.rating,
        a.status,
        a.premiered,
        a.demographic,
        a.producers,
        a.last_jikan_sync,
        a.sync_status,
        ARRAY_AGG(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL) as genres,
        ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as studios,
        ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as themes
      FROM anime a
      LEFT JOIN anime_genres ag ON a.anime_id = ag.anime_id
      LEFT JOIN genres g ON ag.genre_id = g.id
      LEFT JOIN anime_studios ast ON a.anime_id = ast.anime_id
      LEFT JOIN studios s ON ast.studio_id = s.id
      LEFT JOIN anime_themes at ON a.anime_id = at.anime_id
      LEFT JOIN themes t ON at.theme_id = t.id
      WHERE a.status = 'Currently Airing'
        AND a.last_jikan_sync > NOW() - INTERVAL '1 day'
      GROUP BY a.anime_id, a.mal_id, a.title, a.english_title, a.japanese_title, 
        a.synonyms, a.description, a.image_url, a.score, a.popularity, a.rank, 
        a.rating, a.status, a.premiered, a.demographic, a.producers, 
        a.last_jikan_sync, a.sync_status
      ORDER BY 
        CASE WHEN a.popularity IS NOT NULL THEN 0 ELSE 1 END,
        a.popularity ASC,
        a.score DESC NULLS LAST
      LIMIT ${limit}
    `;

    const cachedData = deduplicateAnime(dbResults.rows.map(row => ({
      anime_id: row.anime_id,
      mal_id: row.mal_id,
      title: row.title,
      english_title: row.english_title,
      japanese_title: row.japanese_title,
      synonyms: row.synonyms,
      description: row.description,
      image_url: row.image_url,
      score: row.score ? parseFloat(row.score) : null,
      popularity: row.popularity,
      rank: row.rank,
      rating: row.rating,
      status: row.status,
      premiered: row.premiered,
      demographic: row.demographic,
      producers: row.producers,
      last_jikan_sync: row.last_jikan_sync ? new Date(row.last_jikan_sync) : null,
      sync_status: row.sync_status || 'fresh',
      genres: row.genres || [],
      studios: row.studios || [],
      themes: row.themes || [],
    })));

    if (cachedData.length >= limit) {
      return cachedData;
    }

    // Try to fetch fresh data from Jikan
    try {
      const jikanResults = await getCurrentSeasonAnime(limit);
      
      // Store and return
      const stored = await Promise.all(
        jikanResults.map(anime => upsertAnimeToDatabase(anime))
      );
      
      // Queue newly added anime for embedding generation (high priority for currently airing)
      await Promise.all(
        stored.map(anime => {
          if (anime.anime_id && anime.mal_id) {
            return queueForEmbeddingGeneration(anime.anime_id, anime.mal_id, 'high');
          }
          return Promise.resolve();
        })
      );
      
      return deduplicateAnime(stored).slice(0, limit);
    } catch (jikanError) {
      cacheLogger.error({ error: jikanError, limit }, 'Jikan API error, falling back to cached data');
      
      // If we have some cached data, return it
      if (cachedData.length > 0) {
        return cachedData;
      }
      
      // Try to get older cached data as last resort
      try {
        const olderResults = await sql`
          SELECT 
            a.anime_id,
            a.mal_id,
            a.title,
            a.english_title,
            a.japanese_title,
            a.synonyms,
            a.description,
            a.image_url,
            a.score,
            a.popularity,
            a.rank,
            a.rating,
            a.status,
            a.premiered,
            a.demographic,
            a.producers,
            a.last_jikan_sync,
            a.sync_status,
            ARRAY_AGG(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL) as genres,
            ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as studios,
            ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as themes
          FROM anime a
          LEFT JOIN anime_genres ag ON a.anime_id = ag.anime_id
          LEFT JOIN genres g ON ag.genre_id = g.id
          LEFT JOIN anime_studios ast ON a.anime_id = ast.anime_id
          LEFT JOIN studios s ON ast.studio_id = s.id
          LEFT JOIN anime_themes at ON a.anime_id = at.anime_id
          LEFT JOIN themes t ON at.theme_id = t.id
          WHERE a.status = 'Currently Airing'
          GROUP BY a.anime_id, a.mal_id, a.title, a.english_title, a.japanese_title, 
            a.synonyms, a.description, a.image_url, a.score, a.popularity, a.rank, 
            a.rating, a.status, a.premiered, a.demographic, a.producers, 
            a.last_jikan_sync, a.sync_status
          ORDER BY 
            CASE WHEN a.popularity IS NOT NULL THEN 0 ELSE 1 END,
            a.popularity ASC,
            a.score DESC NULLS LAST
          LIMIT ${limit}
        `;
        
        if (olderResults.rows.length > 0) {
          return deduplicateAnime(olderResults.rows.map(row => ({
            anime_id: row.anime_id,
            mal_id: row.mal_id,
            title: row.title,
            english_title: row.english_title,
            japanese_title: row.japanese_title,
            synonyms: row.synonyms,
            description: row.description,
            image_url: row.image_url,
            score: row.score ? parseFloat(row.score) : null,
            popularity: row.popularity,
            rank: row.rank,
            rating: row.rating,
            status: row.status,
            premiered: row.premiered,
            demographic: row.demographic,
            producers: row.producers,
            last_jikan_sync: row.last_jikan_sync ? new Date(row.last_jikan_sync) : null,
            sync_status: row.sync_status || 'stale',
            genres: row.genres || [],
            studios: row.studios || [],
            themes: row.themes || [],
          })));
        }
      } catch (dbError) {
        cacheLogger.error({ error: dbError, limit }, 'Failed to fetch older cached data');
      }

      // If no cached data at all, throw the Jikan error
      throw jikanError;
    }
  } catch (error) {
    cacheLogger.error({ error, limit }, 'Error in getCurrentSeasonAnimeWithCache');
    throw error;
  }
}

/**
 * Get upcoming anime with intelligent caching
 */
export async function getUpcomingAnimeWithCache(limit: number = 25): Promise<CachedAnimeData[]> {
  try {
    // Check database first for anime marked as not yet aired
    const dbResults = await sql`
      SELECT 
        a.anime_id,
        a.mal_id,
        a.title,
        a.english_title,
        a.japanese_title,
        a.synonyms,
        a.description,
        a.image_url,
        a.score,
        a.popularity,
        a.rank,
        a.rating,
        a.status,
        a.premiered,
        a.demographic,
        a.producers,
        a.last_jikan_sync,
        a.sync_status,
        ARRAY_AGG(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL) as genres,
        ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as studios,
        ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as themes
      FROM anime a
      LEFT JOIN anime_genres ag ON a.anime_id = ag.anime_id
      LEFT JOIN genres g ON ag.genre_id = g.id
      LEFT JOIN anime_studios ast ON a.anime_id = ast.anime_id
      LEFT JOIN studios s ON ast.studio_id = s.id
      LEFT JOIN anime_themes at ON a.anime_id = at.anime_id
      LEFT JOIN themes t ON at.theme_id = t.id
      WHERE a.status = 'Not yet aired'
        AND a.last_jikan_sync > NOW() - INTERVAL '1 day'
      GROUP BY a.anime_id, a.mal_id, a.title, a.english_title, a.japanese_title, 
        a.synonyms, a.description, a.image_url, a.score, a.popularity, a.rank, 
        a.rating, a.status, a.premiered, a.demographic, a.producers, 
        a.last_jikan_sync, a.sync_status
      ORDER BY 
        CASE WHEN a.popularity IS NOT NULL THEN 0 ELSE 1 END,
        a.popularity ASC,
        a.score DESC NULLS LAST
      LIMIT ${limit}
    `;

    const cachedData = deduplicateAnime(dbResults.rows.map(row => ({
      anime_id: row.anime_id,
      mal_id: row.mal_id,
      title: row.title,
      english_title: row.english_title,
      japanese_title: row.japanese_title,
      synonyms: row.synonyms,
      description: row.description,
      image_url: row.image_url,
      score: row.score ? parseFloat(row.score) : null,
      popularity: row.popularity,
      rank: row.rank,
      rating: row.rating,
      status: row.status,
      premiered: row.premiered,
      demographic: row.demographic,
      producers: row.producers,
      last_jikan_sync: row.last_jikan_sync ? new Date(row.last_jikan_sync) : null,
      sync_status: row.sync_status || 'fresh',
      genres: row.genres || [],
      studios: row.studios || [],
      themes: row.themes || [],
    })));

    if (cachedData.length >= limit) {
      return cachedData;
    }

    // Try to fetch fresh data from Jikan
    try {
      const jikanResults = await getUpcomingAnime(limit);
      
      // Store and return
      const stored = await Promise.all(
        jikanResults.map(anime => upsertAnimeToDatabase(anime))
      );
      
      // Queue newly added anime for embedding generation (high priority for upcoming)
      await Promise.all(
        stored.map(anime => {
          if (anime.anime_id && anime.mal_id) {
            return queueForEmbeddingGeneration(anime.anime_id, anime.mal_id, 'high');
          }
          return Promise.resolve();
        })
      );
      
      return deduplicateAnime(stored).slice(0, limit);
    } catch (jikanError) {
      cacheLogger.error({ error: jikanError, limit }, 'Jikan API error, falling back to cached data');
      
      // If we have some cached data, return it
      if (cachedData.length > 0) {
        return cachedData;
      }
      
      // Try to get older cached data as last resort
      try {
        const olderResults = await sql`
          SELECT 
            a.anime_id,
            a.mal_id,
            a.title,
            a.english_title,
            a.japanese_title,
            a.synonyms,
            a.description,
            a.image_url,
            a.score,
            a.popularity,
            a.rank,
            a.rating,
            a.status,
            a.premiered,
            a.demographic,
            a.producers,
            a.last_jikan_sync,
            a.sync_status,
            ARRAY_AGG(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL) as genres,
            ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as studios,
            ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as themes
          FROM anime a
          LEFT JOIN anime_genres ag ON a.anime_id = ag.anime_id
          LEFT JOIN genres g ON ag.genre_id = g.id
          LEFT JOIN anime_studios ast ON a.anime_id = ast.anime_id
          LEFT JOIN studios s ON ast.studio_id = s.id
          LEFT JOIN anime_themes at ON a.anime_id = at.anime_id
          LEFT JOIN themes t ON at.theme_id = t.id
          WHERE a.status = 'Not yet aired'
          GROUP BY a.anime_id, a.mal_id, a.title, a.english_title, a.japanese_title, 
            a.synonyms, a.description, a.image_url, a.score, a.popularity, a.rank, 
            a.rating, a.status, a.premiered, a.demographic, a.producers, 
            a.last_jikan_sync, a.sync_status
          ORDER BY 
            CASE WHEN a.popularity IS NOT NULL THEN 0 ELSE 1 END,
            a.popularity ASC,
            a.score DESC NULLS LAST
          LIMIT ${limit}
        `;
        
        if (olderResults.rows.length > 0) {
          return deduplicateAnime(olderResults.rows.map(row => ({
            anime_id: row.anime_id,
            mal_id: row.mal_id,
            title: row.title,
            english_title: row.english_title,
            japanese_title: row.japanese_title,
            synonyms: row.synonyms,
            description: row.description,
            image_url: row.image_url,
            score: row.score ? parseFloat(row.score) : null,
            popularity: row.popularity,
            rank: row.rank,
            rating: row.rating,
            status: row.status,
            premiered: row.premiered,
            demographic: row.demographic,
            producers: row.producers,
            last_jikan_sync: row.last_jikan_sync ? new Date(row.last_jikan_sync) : null,
            sync_status: row.sync_status || 'stale',
            genres: row.genres || [],
            studios: row.studios || [],
            themes: row.themes || [],
          })));
        }
      } catch (dbError) {
        cacheLogger.error({ error: dbError, limit }, 'Failed to fetch older cached data');
      }

      // If no cached data at all, throw the Jikan error
      throw jikanError;
    }
  } catch (error) {
    cacheLogger.error({ error, limit }, 'Error in getUpcomingAnimeWithCache');
    throw error;
  }
}
