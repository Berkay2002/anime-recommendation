// /frontend/app/api/anime/recommendation/[id]/route.ts

import clientPromise from '../../../../../lib/mongodb';

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

export async function GET(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    const numericId = Number(id);

    if (isNaN(numericId)) {
        console.error('Invalid anime ID format:', id);
        return new Response(JSON.stringify({ message: 'Invalid anime ID format' }), { status: 400 });
    }

    try {
        const client = await clientPromise;
        const db = client.db('animeDB');

        const recommendation: Recommendation | null = await db
            .collection('recommendations')
            .findOne(
                { anime_id: numericId },
                {
                    projection: {
                        _id: 1,
                        anime_id: 1,
                        title: 1,
                        'similar_anime.anime_id': 1,
                        'similar_anime.title': 1,
                        'similar_anime.similarity': 1,
                    },
                }
            );

        if (!recommendation) {
            console.error('No recommendations found for anime_id:', numericId);
            return new Response(JSON.stringify({ message: 'Recommendations not found' }), { status: 404 });
        }

        return new Response(JSON.stringify(recommendation), { status: 200 });
    } catch (error) {
        console.error('Failed to fetch recommendations for anime_id:', numericId, error);
        return new Response(JSON.stringify({ message: 'Failed to fetch recommendations', error: error.message }), { status: 500 });
    }
}