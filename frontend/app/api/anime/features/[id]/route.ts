import clientPromise from '../../../../../lib/mongodb';

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
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    // Access and validate params
    const { id } = params; // No need to `await` params
    const numericId = Number(id);

    if (isNaN(numericId)) {
      console.error('Invalid ID format:', id);
      return new Response(JSON.stringify({ message: 'Invalid ID format' }), { status: 400 });
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
      return new Response(JSON.stringify({ message: 'Anime not found' }), { status: 404 });
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

    return new Response(JSON.stringify(formattedAnime), { status: 200 });
  } catch (error) {
    console.error('Failed to fetch anime features:', error);
    return new Response(JSON.stringify({ message: 'Failed to fetch anime features' }), { status: 500 });
  }
}
