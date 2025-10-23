import clientPromise from '../../../../lib/mongodb';
import { NextResponse } from 'next/server';

interface AnimeMetadata {
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
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sortBy = url.searchParams.get('sortBy') || 'Popularity';
    const limit = parseInt(url.searchParams.get('limit') || '30', 10);

    const sortOptions: Record<string, 1 | -1> = {
      Popularity: 1,
      Score: -1,
      Rank: 1,
    };

    const sortOrder = sortOptions[sortBy] || -1;

    const client = await clientPromise;
    const db = client.db('animeDB');

    // Fetch only metadata, excluding heavy BERT embeddings
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
        // Explicitly exclude BERT embeddings
        bert_description: 0,
        bert_genres: 0,
        bert_demographic: 0,
        bert_themes: 0,
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

    // Cache for 5 minutes
    return NextResponse.json(formattedFeatures, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Failed to fetch anime metadata:', error);
    return NextResponse.json(
      { message: 'Failed to fetch anime metadata' },
      { status: 500 }
    );
  }
}
