// /frontend/app/api/anime/recommendation/[id]/route.ts

import clientPromise from '../../../../../lib/mongodb';
import { NextResponse } from 'next/server';

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
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    console.log('Params received:', params); // Log params to verify
    const { id } = params;
    const numericId = Number(id);

    if (isNaN(numericId)) {
        console.error('Invalid anime ID format:', id);
        return NextResponse.json(
            { message: 'Invalid anime ID format' },
            { status: 400 }
        );
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
            return NextResponse.json(
                { message: 'Recommendations not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(recommendation);
    } catch (error) {
        console.error('Failed to fetch recommendations for anime_id:', numericId, error);
        return NextResponse.json(
            { message: 'Failed to fetch recommendations', error: error.message },
            { status: 500 }
        );
    }
}