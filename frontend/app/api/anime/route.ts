import { NextResponse } from 'next/server';
import { getAnime } from '../../../services/animeService';
import { getAniListImages } from '../../../services/anilistService';
import { getCurrentSeasonAnimeWithCache, getUpcomingAnimeWithCache } from '../../../services/animeCacheService';

export const runtime = 'nodejs';

interface GetAnimeParams {
  sortBy?: string;
  limit?: number;
  page?: number;
  filter?: {
    genres?: string[];
  };
  withEmbeddings?: boolean;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const sortBy = searchParams.get('sortBy') || 'Popularity';
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const withEmbeddings = searchParams.get('withEmbeddings') === 'true';
    const includeBanner = searchParams.get('includeBanner') === 'true';
    const genres = searchParams.get('genres')?.split(',').filter(Boolean);

    const params: GetAnimeParams = { sortBy, limit, page, withEmbeddings };
    if (genres && genres.length > 0) {
      params.filter = { genres };
    }

    // Handle specific list types like 'trending' or 'top-ranked'
    if (type === 'trending') {
      params.sortBy = 'Popularity';
    } else if (type === 'top-ranked') {
      params.sortBy = 'Rank';
    } else if (type === 'currently-airing') {
      const data = await getCurrentSeasonAnimeWithCache(limit);
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      });
    } else if (type === 'upcoming') {
      const data = await getUpcomingAnimeWithCache(limit);
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      });
    }

    const data = await getAnime(params);

    // The old trending/top-ranked routes returned a simple array
    if (type === 'trending' || type === 'top-ranked') {
      let anime = data.anime;

      if (includeBanner) {
        anime = await Promise.all(
          anime.map(async (item: any) => {
            const search =
              item.english_title || item.title || item.japanese_title || null;
            const images = await getAniListImages({
              malId: item.mal_id,
              search,
            });

            return {
              ...item,
              banner_image: images.bannerImage,
              cover_image: images.coverImage,
            };
          })
        );
      }

      return NextResponse.json(anime, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    // The metadata/features routes returned a paginated object
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });

  } catch (error) {
    console.error('Failed to fetch anime data:', error);
    return NextResponse.json(
      { message: 'Failed to fetch anime data' },
      { status: 500 }
    );
  }
}
