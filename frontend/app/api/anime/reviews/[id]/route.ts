// /frontend/app/api/anime/reviews/[id]/route.ts

import clientPromise from '../../../../../lib/mongodb';
import { NextResponse } from 'next/server';

interface Review {
  review: string;
  votes: number;
}

interface AnimeReview {
  anime_id: number;
  title: string;
  reviews: Review[];
}

export async function GET({ params }: { params: { id: string } }): Promise<NextResponse> {
  const { id } = params;
  try {
    const client = await clientPromise;
    const db = client.db('animeDB');

    const review: AnimeReview | null = await db
      .collection('anime_reviews')
      .findOne({ anime_id: Number(id) }, {
        projection: {
          anime_id: 1,
          title: 1,
          reviews: 1,
        }
      });

    if (!review) {
      return NextResponse.json(
        { message: 'Reviews not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return NextResponse.json(
      { message: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}