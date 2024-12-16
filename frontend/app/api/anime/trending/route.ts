
// /frontend/app/api/anime/trending/route.ts

import clientPromise from '../../../../lib/mongodb';
import { NextResponse } from 'next/server';

interface Anime {
  anime_id: number;
  English?: string;
  Synonyms?: string;
  Japanese?: string;
  image_url?: string;
  Popularity?: number;
  Rank?: number;
  Score?: number;
  Description?: string;
  // ...add other fields as necessary
}

export async function GET(): Promise<NextResponse> {
  try {
    const client = await clientPromise;
    const db = client.db('animeDB');

    const features: Anime[] = await db
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
      })
      .toArray();

    // Group titles
    const formattedAnime = features.map(anime => ({
      ...anime,
      title: anime.English || anime.Synonyms || anime.Japanese || "Unknown Title"
    }));

    return NextResponse.json(formattedAnime);
  } catch (error) {
    console.error('Failed to fetch trending anime:', error);
    return NextResponse.json(
      { message: 'Failed to fetch trending anime' },
      { status: 500 }
    );
  }
}