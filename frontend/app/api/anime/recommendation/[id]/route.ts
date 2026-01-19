// /frontend/app/api/anime/recommendation/[id]/route.ts

import { getRecommendations } from '../../../../../services/animeService';
import logger from '@/lib/logger';

export const runtime = 'nodejs';

interface SimilarAnime {
  anime_id: number;
  title: string;
  similarity: number;
}

interface Recommendation {
  _id: string;
  anime_id: number;
  title: string;
  similar_anime: SimilarAnime[];
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
    const { id } = await params;
    const numericId = Number(id);
    const log = logger.child({ route: '/api/anime/recommendation/[id]', method: 'GET', animeId: id })

    if (isNaN(numericId)) {
        log.warn({ animeId: id }, 'Invalid anime ID format');
        return new Response(JSON.stringify({ message: 'Invalid anime ID format' }), { status: 400 });
    }

    try {
        log.debug({ animeId: numericId }, 'Fetching recommendations');

        // Use PostgreSQL recommendations with pgvector
        const recommendations = await getRecommendations([numericId], 30);

        if (!recommendations || recommendations.length === 0) {
            log.warn({ animeId: numericId }, 'No recommendations found');
            return new Response(JSON.stringify({ message: 'Recommendations not found' }), { status: 404 });
        }

        log.info({ animeId: numericId, recommendationCount: recommendations[0]?.similar_anime?.length || 0 }, 'Successfully fetched recommendations');

        return new Response(JSON.stringify(recommendations[0]), { status: 200 });
    } catch (error) {
        log.error({ error, animeId: numericId }, 'Failed to fetch recommendations');
        return new Response(JSON.stringify({ message: 'Failed to fetch recommendations' }), { status: 500 });
    }
}