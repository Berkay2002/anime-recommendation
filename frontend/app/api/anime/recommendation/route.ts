import { NextResponse } from 'next/server';
import { getRecommendations } from '../../../../services/animeService';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { animeIds } = await request.json();

    if (!Array.isArray(animeIds) || animeIds.length === 0) {
      return NextResponse.json({ message: 'animeIds must be a non-empty array' }, { status: 400 });
    }

    const recommendations = await getRecommendations(animeIds);

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Failed to fetch recommendations:', error);
    return NextResponse.json(
      { message: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
