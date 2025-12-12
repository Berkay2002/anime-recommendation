// /frontend/app/api/anime/recommendation/[id]/route.ts

import { getRecommendations } from '../../../../../services/animeService';

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

    if (isNaN(numericId)) {
        console.error('Invalid anime ID format:', id);
        return new Response(JSON.stringify({ message: 'Invalid anime ID format' }), { status: 400 });
    }

    try {
        // Use PostgreSQL recommendations with pgvector
        const recommendations = await getRecommendations([numericId], 30);

        if (!recommendations || recommendations.length === 0) {
            console.error('No recommendations found for anime_id:', numericId);
            return new Response(JSON.stringify({ message: 'Recommendations not found' }), { status: 404 });
        }

        return new Response(JSON.stringify(recommendations[0]), { status: 200 });
    } catch (error) {
        console.error('Failed to fetch recommendations for anime_id:', numericId, error);
        return new Response(JSON.stringify({ message: 'Failed to fetch recommendations' }), { status: 500 });
    }
}