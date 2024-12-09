// app/api/anime/search/route.ts

import clientPromise from '../../../../lib/mongodb';
import { NextResponse } from 'next/server';

interface Anime {
  anime_id: number;
  English?: string;
  Synonyms?: string;
  Japanese?: string;
  title: string;
  image_url?: string;
  // Add other fields as necessary
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const client = await clientPromise;
    const db = client.db('animeDB');
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';

    // Build regex pattern for case-insensitive partial matching
    const regexPattern = new RegExp(query, 'i');

    // Search in English, Synonyms, Japanese, and title fields
    const animeList: Anime[] = await db
      .collection('sorted_anime')
      .find({
        $or: [
          { English: { $regex: regexPattern } },
          { Synonyms: { $regex: regexPattern } },
          { Japanese: { $regex: regexPattern } },
          { title: { $regex: regexPattern } },
        ],
      })
      .project({
        anime_id: 1,
        English: 1,
        Synonyms: 1,
        Japanese: 1,
        title: 1,
        image_url: 1,
      })
      .toArray();

    // Map the results to include a 'title' field
    const results = animeList.map((anime) => ({
      ...anime,
      title: anime.English || anime.Synonyms || anime.Japanese || 'Unknown Title',
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to search anime:', error);
    return NextResponse.json(
      { message: 'Failed to search anime' },
      { status: 500 }
    );
  }
}