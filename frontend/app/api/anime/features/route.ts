import clientPromise from '../../../../lib/mongodb';
import { NextResponse } from 'next/server';

interface Anime {
  English?: string;
  Japanese?: string;
  Synonyms?: string;
  image_url?: string;
  Popularity?: number;
  Rank?: number;
  Score?: number;
  Description?: string;
  themes?: string[];
  Rating?: string;
  Status?: string;
  Premiered?: string;
  Studios?: string[];
  Genres?: string[];
  Demographic?: string;
  anime_id?: number;
  title?: string;
  bert_description: number[];
  bert_themes: number[];
  bert_genres: number[];
  bert_demographic: number[];
  bert_rating: number[];
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sortBy = url.searchParams.get('sortBy') || 'Popularity'; // Default sort
    const limit = parseInt(url.searchParams.get('limit') || '30', 10); // Default limit to 30

    const sortOptions: Record<string, 1 | -1> = {
      Popularity: 1,
      Score: -1,
      Rank: 1, // Assuming lower rank is better
    };

    const sortOrder = sortOptions[sortBy] || -1;

    const client = await clientPromise;
    const db = client.db('animeDB');

    const features = await db
      .collection('anime_general')
      .find({
        Popularity: { $exists: true },
        Rank: { $exists: true },
        Score: { $exists: true },
        anime_id: { $exists: true },
      })
      .project({
        English: 1,
        Japanese: 1,
        Synonyms: 1,
        image_url: 1,
        Popularity: 1,
        Rank: 1,
        Score: 1,
        Description: 1,
        themes: 1,
        Rating: 1,
        Status: 1,
        Premiered: 1,
        Studios: 1,
        Genres: 1,
        Demographic: 1,
        anime_id: 1,
        bert_description: 1,
        bert_genres: 1,
        bert_demographic: 1,
        bert_rating: 1,
        bert_themes: 1,
      })
      .sort({ [sortBy]: sortOrder })
      .limit(limit)
      .allowDiskUse(true)
      .toArray();

    // Standardize fields for all anime
    const formattedFeatures = features.map((anime) => ({
      ...anime,
      title: anime.English || anime.Synonyms || anime.Japanese || 'Unknown Title',
      Genres: typeof anime.Genres === 'string' ? anime.Genres.split(',').map((g) => g.trim()) : anime.Genres,
      Studios: typeof anime.Studios === 'string' ? anime.Studios.split(',').map((s) => s.trim()) : anime.Studios,
      themes: Array.isArray(anime.themes) ? anime.themes : [],
    }));

    // Add cache headers for better performance
    // Cache for 5 minutes, serve stale content while revalidating
    return NextResponse.json(formattedFeatures, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Failed to fetch trending anime:', error);
    return NextResponse.json(
      { message: 'Failed to fetch trending anime' },
      { status: 500 }
    );
  }
}
