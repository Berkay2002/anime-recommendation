// /frontend/app/api/anime/features/[id]/route.ts
import clientPromise from '../../../../../lib/mongodb';
import { NextResponse } from 'next/server';

interface Params {
    id: string;
}

interface Anime {
    English?: string;
    Japanese?: string;
    Synonyms?: string[];
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
    anime_id: number;
}

export async function GET(
    request: Request,
    { params }: { params: Params }
): Promise<NextResponse> {
    const { id } = params;
    try {
        const client = await clientPromise;
        const db = client.db('animeDB');

        const anime: Anime | null = await db
            .collection('anime_general')
            .findOne(
                { anime_id: Number(id) },
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

        const formattedAnime = {
            ...anime,
            title:
                anime.English ||
                anime.Synonyms?.[0] ||
                anime.Japanese ||
                'Unknown Title',
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
