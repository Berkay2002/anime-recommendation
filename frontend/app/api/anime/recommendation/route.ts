import { NextResponse } from 'next/server';
import { getRecommendations } from '../../../../services/animeService';
import logger from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(request: Request): Promise<NextResponse> {
  const log = logger.child({ route: '/api/anime/recommendation', method: 'POST' })

  try {
    const { animeIds } = await request.json();

    log.debug({ animeIdCount: animeIds?.length }, 'Fetching recommendations');

    if (!Array.isArray(animeIds) || animeIds.length === 0) {
      log.warn('Invalid animeIds provided');
      return NextResponse.json({ message: 'animeIds must be a non-empty array' }, { status: 400 });
    }

    const recommendations = await getRecommendations(animeIds);

    log.info({ animeIdCount: animeIds.length, recommendationCount: recommendations.length }, 'Successfully fetched recommendations');

    return NextResponse.json(recommendations);
  } catch (error) {
    log.error({ error }, 'Failed to fetch recommendations');
    return NextResponse.json(
      { message: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
