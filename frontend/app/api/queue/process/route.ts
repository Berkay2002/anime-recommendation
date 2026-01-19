import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sql } from '@vercel/postgres';
import logger from '@/lib/logger';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

/**
 * Generate embeddings for a single text using Google's embedding model
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const processedText = text && text.trim() ? text : 'unknown';
    const result = await model.embedContent(processedText);
    return result.embedding.values || [];
  } catch (error) {
    logger.error({ error, textLength: text.length }, 'Error generating embedding');
    return new Array(768).fill(0);
  }
}

/**
 * Prepare text for embedding by cleaning and truncating
 */
function prepareTextForEmbedding(text: string | null | undefined, maxLength: number = 10000): string {
  if (!text || text === 'null' || text === 'None') {
    return '';
  }
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text.trim();
}

/**
 * Manually trigger queue processing
 */
export async function POST(request: Request): Promise<NextResponse> {
  const log = logger.child({ route: '/api/queue/process', method: 'POST' })

  try {
    const { limit = 5 } = await request.json().catch(() => ({}));

    if (!process.env.GOOGLE_API_KEY) {
      log.error('Google API key not configured');
      return NextResponse.json(
        { message: 'Google API key not configured' },
        { status: 500 }
      );
    }

    // Get anime from queue (high priority first)
    const queueResult = await sql`
      SELECT anime_id, mal_id, priority
      FROM jikan_sync_queue
      WHERE processed_at IS NULL
      ORDER BY
        CASE priority WHEN 'high' THEN 1 WHEN 'low' THEN 2 END,
        created_at ASC
      LIMIT ${limit}
    `;

    if (queueResult.rows.length === 0) {
      log.debug('No anime in queue to process');
      return NextResponse.json({
        message: 'No anime in queue to process',
        processed: 0
      });
    }

    log.info({ count: queueResult.rows.length }, 'Processing anime from queue');

    const processedAnimeIds: number[] = [];
    const errors: Array<{ anime_id: number; error: string }> = [];

    // Process each anime
    for (const { anime_id } of queueResult.rows) {
      try {
        // Fetch anime data
        const animeResult = await sql`
          SELECT
            a.anime_id,
            a.description,
            a.demographic,
            a.rating,
            STRING_AGG(DISTINCT g.name, ', ') FILTER (WHERE g.name IS NOT NULL) as genres,
            STRING_AGG(DISTINCT t.name, ', ') FILTER (WHERE t.name IS NOT NULL) as themes
          FROM anime a
          LEFT JOIN anime_genres ag ON a.anime_id = ag.anime_id
          LEFT JOIN genres g ON ag.genre_id = g.id
          LEFT JOIN anime_themes at ON a.anime_id = at.anime_id
          LEFT JOIN themes t ON at.theme_id = t.id
          WHERE a.anime_id = ${anime_id}
          GROUP BY a.anime_id, a.description, a.demographic, a.rating
        `;

        if (animeResult.rows.length === 0) {
          log.warn({ anime_id }, 'Anime not found in database');
          continue;
        }

        const anime = animeResult.rows[0];

        // Prepare texts for embedding
        const descriptionText = prepareTextForEmbedding(anime.description);
        const genresText = prepareTextForEmbedding(anime.genres || '');
        const themesText = prepareTextForEmbedding(anime.themes || '');
        const demographicText = prepareTextForEmbedding(anime.demographic);
        const ratingText = prepareTextForEmbedding(anime.rating);

        // Generate embeddings
        log.debug({ anime_id }, 'Generating embeddings');
        const [
          descriptionEmbedding,
          genresEmbedding,
          themesEmbedding,
          demographicEmbedding,
          ratingEmbedding,
        ] = await Promise.all([
          generateEmbedding(descriptionText),
          generateEmbedding(genresText),
          generateEmbedding(themesText),
          generateEmbedding(demographicText),
          generateEmbedding(ratingText),
        ]);

        // Convert embeddings to PostgreSQL vector format
        const formatVector = (embedding: number[]) => `[${embedding.join(',')}]`;

        // Insert/update embeddings in database
        await sql`
          INSERT INTO anime_embeddings (
            anime_id,
            description_embedding,
            genres_embedding,
            themes_embedding,
            demographic_embedding,
            rating_embedding,
            created_at
          )
          VALUES (
            ${anime_id},
            ${formatVector(descriptionEmbedding)}::vector,
            ${formatVector(genresEmbedding)}::vector,
            ${formatVector(themesEmbedding)}::vector,
            ${formatVector(demographicEmbedding)}::vector,
            ${formatVector(ratingEmbedding)}::vector,
            NOW()
          )
          ON CONFLICT (anime_id) DO UPDATE SET
            description_embedding = EXCLUDED.description_embedding,
            genres_embedding = EXCLUDED.genres_embedding,
            themes_embedding = EXCLUDED.themes_embedding,
            demographic_embedding = EXCLUDED.demographic_embedding,
            rating_embedding = EXCLUDED.rating_embedding,
            created_at = NOW()
        `;

        // Update sync status to 'fresh'
        await sql`
          UPDATE anime
          SET sync_status = 'fresh', updated_at = NOW()
          WHERE anime_id = ${anime_id}
        `;

        // Mark as processed in queue
        await sql`
          UPDATE jikan_sync_queue
          SET processed_at = NOW()
          WHERE anime_id = ${anime_id}
        `;

        processedAnimeIds.push(anime_id);
        log.debug({ anime_id }, 'Successfully processed embeddings');
      } catch (error) {
        log.error({ error, anime_id }, 'Error processing anime embeddings');
        errors.push({
          anime_id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      message: 'Queue processing completed',
      processed: processedAnimeIds.length,
      processedAnimeIds,
      total: queueResult.rows.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    log.error({ error }, 'Failed to process queue');
    return NextResponse.json(
      {
        message: 'Failed to process queue',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check queue status
 */
export async function GET(): Promise<NextResponse> {
  const log = logger.child({ route: '/api/queue/process', method: 'GET' })

  try {
    const result = await sql`
      SELECT
        COUNT(*) FILTER (WHERE processed_at IS NULL AND priority = 'high') as high_priority,
        COUNT(*) FILTER (WHERE processed_at IS NULL AND priority = 'low') as low_priority,
        COUNT(*) FILTER (WHERE processed_at IS NOT NULL) as processed,
        COUNT(*) as total
      FROM jikan_sync_queue
    `;

    const stats = result.rows[0];

    // Get next few items to process
    const nextItems = await sql`
      SELECT anime_id, mal_id, priority, a.title
      FROM jikan_sync_queue jsq
      LEFT JOIN anime a ON jsq.anime_id = a.anime_id
      WHERE processed_at IS NULL
      ORDER BY
        CASE priority WHEN 'high' THEN 1 WHEN 'low' THEN 2 END,
        created_at ASC
      LIMIT 5
    `;

    return NextResponse.json({
      stats: {
        high_priority: parseInt(stats.high_priority || '0'),
        low_priority: parseInt(stats.low_priority || '0'),
        processed: parseInt(stats.processed || '0'),
        total: parseInt(stats.total || '0'),
      },
      next_to_process: nextItems.rows,
    });
  } catch (error) {
    log.error({ error }, 'Failed to get queue status');
    return NextResponse.json(
      { message: 'Failed to get queue status' },
      { status: 500 }
    );
  }
}
