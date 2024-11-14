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

export async function GET({ params }: { params: { id: string } }): Promise<NextResponse> {
  const { id } = params;
  try {
    const client = await clientPromise;
    const db = client.db('animeDB');

    const recommendation: Recommendation | null = await db
      .collection('recommendations')
      .findOne({ anime_id: Number(id) }, {
        projection: {
          _id: 1,
          anime_id: 1,
          title: 1,
          'similar_anime.anime_id': 1,
          'similar_anime.title': 1,
          'similar_anime.similarity': 1
        }
      });

    if (!recommendation) {
      return NextResponse.json(
        { message: 'Recommendations not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error('Failed to fetch recommendations:', error);
    return NextResponse.json(
      { message: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}