// /frontend/app/api/anime/top-ranked/route.ts

import clientPromise from '../../../../lib/mongodb';
import { NextResponse } from 'next/server';

interface Anime {
  anime_id: number;
  English?: string;
  Synonyms?: string;
  Japanese?: string;
  image_url?: string;
  Rank?: number;
}

export async function GET(): Promise<NextResponse> {
  try {
    const client = await clientPromise;
    const db = client.db('animeDB');

    const features: Anime[] = await db
      .collection('anime_general')
      .find({
        Rank: { $exists: true },
        anime_id: { $exists: true },
      })
      .project({
        English: 1,
        Japanese: 1,
        Synonyms: 1,
        image_url: 1,
        Rank: 1,
        anime_id: 1,
      })
      .sort({ Rank: 1 })
      .limit(30)
      .toArray();

    const formattedAnime = features.map(anime => ({
      ...anime,
      title: anime.English || anime.Synonyms || anime.Japanese || "Unknown Title"
    }));

    return NextResponse.json(formattedAnime, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Failed to fetch top ranked anime:', error);
    return NextResponse.json(
      { message: 'Failed to fetch top ranked anime' },
      { status: 500 }
    );
  }
}
