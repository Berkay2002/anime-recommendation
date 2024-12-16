import clientPromise from '../../../../../lib/mongodb';
import { NextResponse } from 'next/server';

interface Anime {
  English?: string;
  Japanese?: string;
  Synonyms?: string | string[];
  image_url?: string;
  Popularity?: number;
  Rank?: number;
  Score?: number;
  Description?: string;
  themes?: string | string[];
  Rating?: string;
  Status?: string;
  Premiered?: string;
  Studios?: string | string[];
  Genres?: string | string[];
  Demographic?: string;
  anime_id: number;
}

export async function GET(
    request: Request,
    context: { params: { id: string } }
  ): Promise<NextResponse> {
    try {
      // Access and validate params asynchronously
      const params = await context.params;
      const { id } = params; // Destructure after `await`
      const numericId = Number(id);

    if (isNaN(numericId)) {
      console.error('Invalid ID format:', id);
      return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('animeDB');

    const anime: Anime | null = await db.collection('anime_general').findOne(
      { anime_id: numericId },
      {
        projection: {
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
        },
      }
    );

    if (!anime) {
      return NextResponse.json(
        { message: 'Anime not found' },
        { status: 404 }
      );
    }

    // Ensure fields are standardized and handle missing values
    const formattedAnime = {
        ...anime,
        title: anime.English || anime.Synonyms?.[0] || anime.Japanese || 'Unknown Title',
        Genres:
          typeof anime.Genres === 'string'
            ? anime.Genres.split(',').map((g) => g.trim())
            : Array.isArray(anime.Genres)
            ? anime.Genres
            : [],
        Studios:
          typeof anime.Studios === 'string'
            ? anime.Studios.split(',').map((s) => s.trim())
            : Array.isArray(anime.Studios)
            ? anime.Studios
            : [],
        themes: Array.isArray(anime.themes) ? anime.themes : [],
      };

    return NextResponse.json(formattedAnime);
  } catch (error) {
    console.error('Failed to fetch anime features:', error);
    return NextResponse.json(
      { message: 'Failed to fetch anime features' },
      { status: 500 }
    );
  }
}
