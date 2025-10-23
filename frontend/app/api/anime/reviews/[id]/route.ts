import { NextResponse } from 'next/server';
import { getReviews } from '../../../../../services/animeService';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const numericId = Number(id);

    if (isNaN(numericId)) {
      return NextResponse.json({ message: 'Invalid anime ID format' }, { status: 400 });
    }

    const review = await getReviews(numericId);

    if (!review) {
      return NextResponse.json({ message: `Reviews not found for anime_id: ${numericId}` }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error('Failed to fetch reviews for anime_id:', error);
    return NextResponse.json(
      { message: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
