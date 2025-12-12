import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { sql } from '@vercel/postgres';
import {
  getQueuedAnimeForProcessing,
  markAnimeAsProcessed,
  updateAnimeSyncStatus,
} from '../../../../services/animeCacheService';

export const runtime = 'nodejs';
export const maxDuration = 10; // Vercel free tier timeout limit

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

/**
 * Generate embeddings for a single text using Google's embedding model
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    
    // Prepare text (handle empty strings)
    const processedText = text && text.trim() ? text : 'unknown';
    
    const result = await model.embedContent(processedText);
    
    return result.embedding.values || [];
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Return zero vector on error (768 dimensions for text-embedding-004)
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
  
  // Truncate if too long
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  
  return text.trim();
}

/**
 * Process embeddings for queued anime
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { animeIds } = await request.json();

    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json(
        { message: 'Google API key not configured' },
        { status: 500 }
      );
    }

    // Get anime to process (either from request or from queue)
    let animeToProcess: Array<{ anime_id: number; mal_id: number }> = [];
    
    if (animeIds && animeIds.length > 0) {
      // Process specific anime IDs from request
      animeToProcess = animeIds.slice(0, 2).map((id: number) => ({ anime_id: id, mal_id: 0 }));
    } else {
      // Get from queue (high priority first)
      animeToProcess = await getQueuedAnimeForProcessing('high', 2);
    }

    if (animeToProcess.length === 0) {
      return NextResponse.json({ message: 'No anime to process', processed: 0 });
    }

    const processedAnimeIds: number[] = [];
    const errors: Array<{ anime_id: number; error: string }> = [];

    // Process each anime
    for (const { anime_id } of animeToProcess) {
      try {
        // Fetch anime data
        const animeResult = await sql`
          SELECT 
            a.anime_id,
            a.description,
            a.demographic,
            a.rating,
            ARRAY_AGG(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL) as genres,
            ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as themes
          FROM anime a
          LEFT JOIN anime_genres ag ON a.anime_id = ag.anime_id
          LEFT JOIN genres g ON ag.genre_id = g.genre_id
          LEFT JOIN anime_themes at ON a.anime_id = at.anime_id
          LEFT JOIN themes t ON at.theme_id = t.theme_id
          WHERE a.anime_id = ${anime_id}
          GROUP BY a.anime_id
        `;

        if (animeResult.rows.length === 0) {
          console.error(`Anime ${anime_id} not found`);
          continue;
        }

        const anime = animeResult.rows[0];

        // Prepare texts for embedding
        const descriptionText = prepareTextForEmbedding(anime.description);
        const genresText = prepareTextForEmbedding(anime.genres?.join(', ') || '');
        const themesText = prepareTextForEmbedding(anime.themes?.join(', ') || '');
        const demographicText = prepareTextForEmbedding(anime.demographic);
        const ratingText = prepareTextForEmbedding(anime.rating);

        // Generate embeddings
        console.log(`Generating embeddings for anime ${anime_id}...`);
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
        const formatVector = (embedding: number[]) => 
          `[${embedding.join(',')}]`;

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
        await updateAnimeSyncStatus(anime_id, 'fresh');

        // Mark as processed in queue
        await markAnimeAsProcessed(anime_id);

        processedAnimeIds.push(anime_id);
        console.log(`Successfully processed embeddings for anime ${anime_id}`);
      } catch (error) {
        console.error(`Error processing anime ${anime_id}:`, error);
        errors.push({
          anime_id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      message: 'Embedding generation completed',
      processed: processedAnimeIds.length,
      processedAnimeIds,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Failed to process embeddings:', error);
    return NextResponse.json(
      {
        message: 'Failed to process embeddings',
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
  try {
    const highPriorityQueue = await getQueuedAnimeForProcessing('high', 10);
    const lowPriorityQueue = await getQueuedAnimeForProcessing('low', 10);

    return NextResponse.json({
      highPriority: highPriorityQueue.length,
      lowPriority: lowPriorityQueue.length,
      nextHighPriority: highPriorityQueue.slice(0, 2),
      nextLowPriority: lowPriorityQueue.slice(0, 2),
    });
  } catch (error) {
    console.error('Failed to get queue status:', error);
    return NextResponse.json(
      { message: 'Failed to get queue status' },
      { status: 500 }
    );
  }
}
