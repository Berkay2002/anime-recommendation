import { NextResponse } from 'next/server';
import { getAnime } from '../../../services/animeService';

interface GetAnimeParams {
  sortBy: string;
  limit: number;
  page: number;
  withEmbeddings: boolean;
  filter?: {
    $and: {
      Genres: {
        $regex: RegExp;
      };
    }[];
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const sortBy = searchParams.get('sortBy') || 'Popularity';
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const withEmbeddings = searchParams.get('withEmbeddings') === 'true';
    const genres = searchParams.get('genres')?.split(',');

    const params: GetAnimeParams = { sortBy, limit, page, withEmbeddings };
    if (genres && genres.length > 0) {
      const regexConditions = genres.map((genre) => ({
        Genres: {
          $regex: new RegExp(
            `\\b${genre.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`,
            "i"
          ),
        },
      }));
      params.filter = { $and: regexConditions };
    }

    // Handle specific list types like 'trending' or 'top-ranked'
    if (type === 'trending') {
      params.sortBy = 'Popularity';
    } else if (type === 'top-ranked') {
      params.sortBy = 'Rank';
    }

    const data = await getAnime(params);

    // The old trending/top-ranked routes returned a simple array
    if (type === 'trending' || type === 'top-ranked') {
        return NextResponse.json(data.anime, {
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
