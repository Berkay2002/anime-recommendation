import { NextResponse } from 'next/server';
import { searchAnime } from '../../../../services/animeService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query) {
      return NextResponse.json({ message: 'Query parameter "q" is required' }, { status: 400 });
    }

    const results = await searchAnime(query);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to search anime:', error);
    return NextResponse.json(
      { message: 'Failed to search anime' },
      { status: 500 }
    );
  }
}
