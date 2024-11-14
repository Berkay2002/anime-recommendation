// /frontend/app/api/anime/trending/route.js
import clientPromise from '../../../../lib/mongodb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('animeDB');

    const trendingAnime = await db
      .collection('anime_general')
      .find({
        Popularity: { $exists: true },
        Rank: { $exists: true },
        Score: { $exists: true },
      })
      .project({
        _id: 1,
        English: 1,
        Japanese: 1,
        Synonyms: 1,
        image_url: 1,
        Popularity: 1,
        Rank: 1,
        Score: 1,
        Description: 1, // Include description
        score: 1, // Include score
      })
      .toArray();

    // Group titles
    const formattedAnime = trendingAnime.map(anime => ({
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
