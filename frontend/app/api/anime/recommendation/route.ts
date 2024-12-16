// /frontend/app/api/anime/recommendations/route.ts

import clientPromise from '../../../../lib/mongodb';
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

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { animeIds } = await request.json();
    const client = await clientPromise;
    const db = client.db('animeDB');

    const recommendations: Recommendation[] = await db
      .collection('recommendations')
      .find({ anime_id: { $in: animeIds } })
      .toArray();

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Failed to fetch recommendations:', error);
    return NextResponse.json(
      { message: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}