// /frontend/app/api/anime/features/route.ts

import clientPromise from '../../../../lib/mongodb';
import { NextResponse } from 'next/server';
import { Db, MongoClient } from 'mongodb';

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
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const sortBy = url.searchParams.get('sortBy') || 'Popularity'; // Default sort

        const sortOptions: Record<string, 1 | -1> = {
            Popularity: 1,
            Score: -1,
            Rank: 1, // Assuming lower rank is better
        };

        const sortOrder = sortOptions[sortBy] || -1;

        const client: MongoClient = await clientPromise;
        const db: Db = client.db('animeDB');

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
            .sort({ [sortBy]: sortOrder } as { [key: string]: 1 | -1 }) // Apply dynamic sort
            .limit(30)
            .toArray();

        const formattedAnime: Anime[] = features.map(anime => ({
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