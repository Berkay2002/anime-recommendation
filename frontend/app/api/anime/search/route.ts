import { NextResponse } from 'next/server';
import { searchAnimeWithCache } from '../../../../services/animeCacheService';
import logger from '@/lib/logger';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const log = logger.child({ route: '/api/anime/search', method: 'GET', query })

  try {
    log.debug({ query, limit: searchParams.get('limit') }, 'Searching for anime')

    const limitParam = searchParams.get('limit');
    const limit = limitParam !== null ? parseInt(limitParam, 10) : 10;

    if (!query) {
      log.warn('Search query missing')
      return NextResponse.json({ message: 'Query parameter "q" is required' }, { status: 400 });
    }

    // Use smart cache search (checks DB first, falls back to Jikan)
    const results = await searchAnimeWithCache(query, limit);

    // Trigger immediate embedding generation for high-priority items (non-blocking)
    // This happens in the background and won't delay the response
    const pendingEmbeddings = results
      .filter(anime => anime.sync_status === 'pending_embeddings')
      .slice(0, 2); // Max 2 per search

    if (pendingEmbeddings.length > 0) {
      // Trigger embedding generation in the background (fire and forget)
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/embeddings/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animeIds: pendingEmbeddings.map(a => a.anime_id),
        }),
      }).catch(err => {
        log.warn({ err, animeIds: pendingEmbeddings.map(a => a.anime_id) }, 'Failed to trigger embedding generation');
      });
    }

    log.info({ query, resultCount: results.length, pendingEmbeddings: pendingEmbeddings.length }, 'Successfully searched anime')

    // Return results immediately (don't wait for embeddings)
    return NextResponse.json(results);
  } catch (error) {
    log.error({ error, query }, 'Failed to search anime');
    return NextResponse.json(
      { message: 'Failed to search anime' },
      { status: 500 }
    );
  }
}
