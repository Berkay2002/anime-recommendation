import { cache } from 'react';
import { sql } from '../lib/postgres';
import { revalidateTag } from 'next/cache';
import logger from '@/lib/logger';

const animeLogger = logger.child({ service: 'AnimeService' });

// Comprehensive Anime Interface
interface Anime {
  anime_id: number;
  mal_id?: number;
  title: string;
  english_title?: string;
  japanese_title?: string;
  synonyms?: string;
  image_url?: string;
  popularity?: number;
  rank?: number;
  score?: number;
  description?: string;
  themes?: string[];
  rating?: string;
  status?: string;
  premiered?: string;
  studios?: string[];
  genres?: string[];
  demographic?: string;
  // Embeddings (optional, only included when withEmbeddings=true)
  description_embedding?: number[];
  genres_embedding?: number[];
  demographic_embedding?: number[];
  rating_embedding?: number[];
  themes_embedding?: number[];
  // Legacy field names for backward compatibility
  bert_description?: number[];
  bert_genres?: number[];
  bert_demographic?: number[];
  bert_rating?: number[];
  bert_themes?: number[];
}

interface Review {
  id: number;
  anime_id: number;
  review_text: string;
  author: string;
  score?: number;
  helpful_count?: number;
  created_at: string;
}

// Helper function to parse pgvector to array
function parseVector(vector: any): number[] | undefined {
  if (!vector) return undefined;
  
  // If it's already an array, return it
  if (Array.isArray(vector)) return vector;
  
  // If it's a string like "[1.0,2.0,...]", parse it
  if (typeof vector === 'string') {
    try {
      const parsed = JSON.parse(vector);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      // Try parsing without JSON if it's a pgvector format
      const match = vector.match(/^\[(.*)\]$/);
      if (match) {
        return match[1].split(',').map(v => parseFloat(v.trim()));
      }
      return undefined;
    }
  }
  
  return undefined;
}

// --- DATA FORMATTING HELPER ---
function formatAnime(anime: any): Anime {
  return {
    anime_id: anime.anime_id,
    mal_id: anime.mal_id,
    title: anime.title,
    english_title: anime.english_title,
    japanese_title: anime.japanese_title,
    synonyms: anime.synonyms,
    description: anime.description,
    image_url: anime.image_url,
    score: anime.score ? parseFloat(anime.score) : undefined,
    popularity: anime.popularity,
    rank: anime.rank,
    rating: anime.rating,
    status: anime.status,
    premiered: anime.premiered,
    demographic: anime.demographic,
    genres: anime.genres || [],
    studios: anime.studios || [],
    themes: anime.themes || [],
    // Include embeddings if present (with backward compatibility)
    description_embedding: parseVector(anime.description_embedding),
    genres_embedding: parseVector(anime.genres_embedding),
    demographic_embedding: parseVector(anime.demographic_embedding),
    rating_embedding: parseVector(anime.rating_embedding),
    themes_embedding: parseVector(anime.themes_embedding),
    // Legacy field names for backward compatibility with frontend hooks
    bert_description: parseVector(anime.description_embedding),
    bert_genres: parseVector(anime.genres_embedding),
    bert_demographic: parseVector(anime.demographic_embedding),
    bert_rating: parseVector(anime.rating_embedding),
    bert_themes: parseVector(anime.themes_embedding),
  };
}

// --- CORE ANIME FETCHING LOGIC ---
interface GetAnimeParams {
  sortBy?: string
  limit?: number
  page?: number
  filter?: {
    genres?: string[]
  }
  withEmbeddings?: boolean
}

export const getAnime = cache(async (params: GetAnimeParams = {}) => {
  try {
      const {
        sortBy = 'popularity',
        limit = 30,
        page = 1,
        filter = {},
        withEmbeddings = false,
      } = params;

      const offset = (page - 1) * limit;

    // Build WHERE clause for genre filtering
    let whereClause = 'WHERE a.popularity IS NOT NULL AND a.rank IS NOT NULL AND a.score IS NOT NULL';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (filter.genres && filter.genres.length > 0) {
      const genreConditions = filter.genres.map((genre) => {
        queryParams.push(genre);
        return `g.name ILIKE $${paramIndex++}`;
      }).join(' OR ');
      
      whereClause += ` AND a.anime_id IN (
        SELECT ag.anime_id FROM anime_genres ag
        JOIN genres g ON ag.genre_id = g.id
        WHERE ${genreConditions}
        GROUP BY ag.anime_id
        HAVING COUNT(DISTINCT g.id) = ${filter.genres.length}
      )`;
    }

  // Determine sort column and direction
  const sortMap: Record<string, string> = {
    'popularity': 'a.popularity ASC',
    'Popularity': 'a.popularity ASC',
    'score': 'a.score DESC',
    'Score': 'a.score DESC',
    'rank': 'a.rank ASC',
    'Rank': 'a.rank ASC',
  };
  const orderBy = sortMap[sortBy] || 'a.popularity ASC';

  // Build SELECT clause - cast vectors to text arrays for proper JSON serialization
  const embeddingFields = withEmbeddings ? `, 
    ae.description_embedding::text as description_embedding,
    ae.genres_embedding::text as genres_embedding,
    ae.demographic_embedding::text as demographic_embedding,
    ae.rating_embedding::text as rating_embedding,
    ae.themes_embedding::text as themes_embedding` : '';

  const embeddingJoin = withEmbeddings ? 
    'LEFT JOIN anime_embeddings ae ON a.anime_id = ae.anime_id' : '';

  // Main query
  const query = `
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
      COALESCE(
        json_agg(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL),
        '[]'
      ) as genres,
      COALESCE(
        json_agg(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL),
        '[]'
      ) as studios,
      COALESCE(
        json_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL),
        '[]'
      ) as themes
      ${embeddingFields}
    FROM anime a
    LEFT JOIN anime_genres ag ON a.anime_id = ag.anime_id
    LEFT JOIN genres g ON ag.genre_id = g.id
    LEFT JOIN anime_studios ast ON a.anime_id = ast.anime_id
    LEFT JOIN studios s ON ast.studio_id = s.id
    LEFT JOIN anime_themes at ON a.anime_id = at.anime_id
    LEFT JOIN themes t ON at.theme_id = t.id
    ${embeddingJoin}
    ${whereClause}
    GROUP BY a.anime_id, a.mal_id ${withEmbeddings ? ', ae.description_embedding, ae.genres_embedding, ae.demographic_embedding, ae.rating_embedding, ae.themes_embedding, ae.anime_id' : ''}
    ORDER BY ${orderBy}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(limit, offset);

  // Get total count
  const countQuery = `
    SELECT COUNT(DISTINCT a.anime_id) as count
    FROM anime a
    ${filter.genres && filter.genres.length > 0 ? `
      LEFT JOIN anime_genres ag ON a.anime_id = ag.anime_id
      LEFT JOIN genres g ON ag.genre_id = g.id
    ` : ''}
    ${whereClause}
  `;

  const [animeList, countResult] = await Promise.all([
    sql(query, queryParams),
    sql(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
  ]);

  const totalAnime = parseInt(countResult[0]?.count || '0');
  const totalPages = Math.ceil(totalAnime / limit);

  const formattedAnime = animeList.map(formatAnime);

  return {
    anime: formattedAnime,
    totalPages,
    currentPage: page,
  };
  } catch (error) {
    animeLogger.error({ error, params }, 'Failed to fetch anime list');
    throw new Error('Failed to fetch anime list');
  }
});

// --- SEARCH ANIME LOGIC ---
export const searchAnime = cache(async (query: string) => {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

  // Use PostgreSQL full-text search with ranking
  const searchQuery = `
    SELECT 
      a.anime_id,
      a.title,
      a.english_title,
      a.japanese_title,
      a.synonyms,
      a.image_url,
      a.score,
      a.popularity,
      a.rank,
      COALESCE(
        json_agg(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL),
        '[]'
      ) as genres,
      -- Ranking: title matches score higher than description matches
      CASE
        WHEN a.title ILIKE $1 THEN 100
        WHEN a.english_title ILIKE $1 THEN 95
        WHEN a.japanese_title ILIKE $1 THEN 90
        WHEN a.synonyms ILIKE $1 THEN 85
        ELSE ts_rank(a.search_vector, plainto_tsquery('english', $2)) * 50
      END as relevance_score
    FROM anime a
    LEFT JOIN anime_genres ag ON a.anime_id = ag.anime_id
    LEFT JOIN genres g ON ag.genre_id = g.id
    WHERE 
      a.title ILIKE $1 OR
      a.english_title ILIKE $1 OR
      a.japanese_title ILIKE $1 OR
      a.synonyms ILIKE $1 OR
      a.search_vector @@ plainto_tsquery('english', $2) OR
      EXISTS (
        SELECT 1 FROM anime_genres ag2
        JOIN genres g2 ON ag2.genre_id = g2.id
        WHERE ag2.anime_id = a.anime_id AND g2.name ILIKE $1
      )
    GROUP BY a.anime_id, a.title, a.english_title, a.japanese_title, 
             a.synonyms, a.image_url, a.score, a.popularity, a.rank, a.search_vector
    ORDER BY relevance_score DESC, a.popularity ASC
    LIMIT 50
  `;

  const searchPattern = `%${query}%`;
  const animeList = await sql(searchQuery, [searchPattern, query]);

  return animeList.map(formatAnime);
  } catch (error) {
    animeLogger.error({ error, query }, 'Failed to search anime');
    throw new Error('Failed to search anime');
  }
});

// --- RECOMMENDATIONS LOGIC (Live with pgvector) ---
export const getRecommendations = cache(async (animeIds: number[], limit: number = 10) => {
  try {
    if (!animeIds || animeIds.length === 0) {
      return [];
    }

  // Weighted similarity calculation:
  // - Description: 25%
  // - Genres: 25%
  // - Themes: 25%
  // - Demographic: 15%
  // - Rating: 10%
  
  const recommendationQuery = `
    WITH target_anime AS (
      SELECT 
        anime_id,
        description_embedding,
        genres_embedding,
        demographic_embedding,
        rating_embedding,
        themes_embedding
      FROM anime_embeddings
      WHERE anime_id = ANY($1)
    ),
    avg_embeddings AS (
      SELECT
        AVG(description_embedding) as avg_desc,
        AVG(genres_embedding) as avg_genres,
        AVG(demographic_embedding) as avg_demo,
        AVG(rating_embedding) as avg_rating,
        AVG(themes_embedding) as avg_themes
      FROM target_anime
    ),
    similarities AS (
      SELECT 
        a.anime_id,
        a.title,
        a.english_title,
        a.image_url,
        a.score,
        a.popularity,
        COALESCE(
          json_agg(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL),
          '[]'
        ) as genres,
        -- Weighted similarity (lower is better for cosine distance)
        (
          0.25 * (ae.description_embedding <=> (SELECT avg_desc FROM avg_embeddings)) +
          0.25 * (ae.genres_embedding <=> (SELECT avg_genres FROM avg_embeddings)) +
          0.25 * (ae.themes_embedding <=> (SELECT avg_themes FROM avg_embeddings)) +
          0.15 * (ae.demographic_embedding <=> (SELECT avg_demo FROM avg_embeddings)) +
          0.10 * (ae.rating_embedding <=> (SELECT avg_rating FROM avg_embeddings))
        ) as similarity_distance,
        -- Convert distance to similarity score (0-1 range, higher is better)
        (1 - (
          0.25 * (ae.description_embedding <=> (SELECT avg_desc FROM avg_embeddings)) +
          0.25 * (ae.genres_embedding <=> (SELECT avg_genres FROM avg_embeddings)) +
          0.25 * (ae.themes_embedding <=> (SELECT avg_themes FROM avg_embeddings)) +
          0.15 * (ae.demographic_embedding <=> (SELECT avg_demo FROM avg_embeddings)) +
          0.10 * (ae.rating_embedding <=> (SELECT avg_rating FROM avg_embeddings))
        )) as similarity_score
      FROM anime a
      JOIN anime_embeddings ae ON a.anime_id = ae.anime_id
      LEFT JOIN anime_genres ag ON a.anime_id = ag.anime_id
      LEFT JOIN genres g ON ag.genre_id = g.id
      WHERE a.anime_id != ALL($1)
        AND ae.description_embedding IS NOT NULL
        AND ae.genres_embedding IS NOT NULL
      GROUP BY a.anime_id, a.title, a.english_title, a.image_url, a.score, 
               a.popularity, ae.description_embedding, ae.genres_embedding,
               ae.themes_embedding, ae.demographic_embedding, ae.rating_embedding
      ORDER BY similarity_distance ASC
      LIMIT $2
    )
    SELECT 
      anime_id,
      title,
      english_title,
      image_url,
      score,
      popularity,
      genres,
      ROUND(similarity_score::numeric, 4) as similarity
    FROM similarities
    ORDER BY similarity_score DESC;
  `;

  const recommendations = await sql(recommendationQuery, [animeIds, limit]);

  return [{
    anime_id: animeIds[0],
    title: '', // We'll get this from a separate query if needed
    similar_anime: recommendations.map((rec: any) => ({
      anime_id: rec.anime_id,
      title: rec.title || rec.english_title,
      image_url: rec.image_url,
      score: rec.score,
      popularity: rec.popularity,
      genres: rec.genres,
      similarity: rec.similarity
    }))
  }];
  } catch (error) {
    animeLogger.error({ error, animeIds, limit }, 'Failed to get recommendations');
    throw new Error('Failed to get recommendations');
  }
});

// --- REVIEWS LOGIC ---
export const getReviews = cache(async (animeId: number) => {
  try {
    const reviewQuery = `
    SELECT 
      r.id,
      r.anime_id,
      r.review_text,
      r.author,
      r.score,
      r.helpful_count,
      r.created_at,
      a.title
    FROM reviews r
    JOIN anime a ON r.anime_id = a.anime_id
    WHERE r.anime_id = $1
    ORDER BY r.helpful_count DESC, r.created_at DESC
  `;

  const reviews = await sql(reviewQuery, [animeId]);

  if (reviews.length === 0) {
    return null;
  }

  return {
    anime_id: animeId,
    title: reviews[0].title,
    reviews: reviews.map((r: any) => ({
      id: r.id,
      review_text: r.review_text,
      author: r.author,
      score: r.score,
      helpful_count: r.helpful_count,
      created_at: r.created_at
    }))
  };
  } catch (error) {
    animeLogger.error({ error, animeId }, 'Failed to get reviews');
    throw new Error('Failed to get reviews');
  }
});
