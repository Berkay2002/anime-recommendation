import clientPromise from '../lib/mongodb';
import { Collection, Db } from 'mongodb';

// Comprehensive Anime Interface
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
  themes?: string[];
  Rating?: string;
  Status?: string;
  Premiered?: string;
  Studios?: string[];
  Genres?: string[];
  Demographic?: string;
  title?: string;
  bert_description?: number[];
  bert_themes?: number[];
  bert_genres?: number[];
  bert_demographic?: number[];
  bert_rating?: number[];
}

// --- DATABASE HELPER ---
async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db('animeDB');
}

// --- DATA FORMATTING HELPER ---
function formatAnime(anime: any): Anime {
  return {
    ...anime,
    title: anime.English || anime.Synonyms || anime.Japanese || 'Unknown Title',
    Genres: typeof anime.Genres === 'string' ? anime.Genres.split(',').map((g: string) => g.trim()) : anime.Genres,
    Studios: typeof anime.Studios === 'string' ? anime.Studios.split(',').map((s: string) => s.trim()) : anime.Studios,
    themes: Array.isArray(anime.themes) ? anime.themes : [],
  };
}

// --- CORE ANIME FETCHING LOGIC ---
interface GetAnimeParams {
  sortBy?: string;
  limit?: number;
  page?: number;
  projection?: Record<string, 1 | 0>;
  filter?: Record<string, any>;
  withEmbeddings?: boolean;
}

export async function getAnime(params: GetAnimeParams = {}) {
  const {
    sortBy = 'Popularity',
    limit = 30,
    page = 1,
    filter = {},
    withEmbeddings = false,
  } = params;

  const db = await getDb();
  const collection: Collection<Anime> = db.collection('anime_general');

  const skip = (page - 1) * limit;

  const sortOptions: Record<string, 1 | -1> = {
    Popularity: 1,
    Score: -1,
    Rank: 1,
  };
  const sortOrder = sortOptions[sortBy] || 1;

  const baseQuery = {
    Popularity: { $exists: true },
    Rank: { $exists: true },
    Score: { $exists: true },
    anime_id: { $exists: true },
    ...filter,
  };

  const baseProjection = {
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
  };

  if (withEmbeddings) {
    Object.assign(baseProjection, {
      bert_description: 1,
      bert_genres: 1,
      bert_demographic: 1,
      bert_rating: 1,
      bert_themes: 1,
    });
  }

  const totalAnime = await collection.countDocuments(baseQuery);
  const totalPages = Math.ceil(totalAnime / limit);

  const animeList = await collection
    .find(baseQuery)
    .project(baseProjection)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit)
    .toArray();

  const formattedAnime = animeList.map(formatAnime);

  return {
    anime: formattedAnime,
    totalPages,
    currentPage: page,
  };
}

// --- SEARCH ANIME LOGIC ---
export async function searchAnime(query: string) {
  const db = await getDb();
  const collection: Collection<Anime> = db.collection('sorted_anime');
  const regexPattern = new RegExp(query, 'i');

  const animeList = await collection
    .aggregate([
      {
        $match: {
          $or: [
            { English: { $regex: regexPattern } },
            { Synonyms: { $regex: regexPattern } },
            { Japanese: { $regex: regexPattern } },
            { title: { $regex: regexPattern } },
            { Description: { $regex: regexPattern } },
            { Genres: { $regex: regexPattern } },
          ],
        },
      },
      {
        $addFields: {
          score: {
            $cond: {
              if: {
                $or: [
                  { $regexMatch: { input: '$English', regex: query, options: 'i' } },
                  { $regexMatch: { input: '$Synonyms', regex: query, options: 'i' } },
                  { $regexMatch: { input: '$Japanese', regex: query, options: 'i' } },
                  { $regexMatch: { input: '$title', regex: query, options: 'i' } },
                ],
              },
              then: 2,
              else: 1,
            },
          },
        },
      },
      {
        $sort: {
          score: -1,
          Popularity: 1,
        },
      },
      {
        $project: {
          anime_id: 1,
          English: 1,
          Synonyms: 1,
          Japanese: 1,
          title: 1,
          image_url: 1,
          score: 1,
          Popularity: 1,
        },
      },
    ])
    .toArray();

  return animeList.map(formatAnime);
}

// --- RECOMMENDATIONS LOGIC ---
export async function getRecommendations(animeIds: number[]) {
  const db = await getDb();
  const collection = db.collection('recommendations');

  const recommendations = await collection
    .find({ anime_id: { $in: animeIds } })
    .toArray();

  return recommendations;
}

// --- REVIEWS LOGIC ---
export async function getReviews(animeId: number) {
  const db = await getDb();
  const collection = db.collection('anime_reviews');

  const review = await collection.findOne(
    { anime_id: animeId },
    {
      projection: {
        anime_id: 1,
        title: 1,
        reviews: 1,
      },
    }
  );

  return review;
}
