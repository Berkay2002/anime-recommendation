// /frontend/app/anime/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from 'next/image';
import Link from 'next/link';

interface Anime {
  anime_id: string;
  title: string;
  image_url?: string;
  Description?: string;
  Score?: number;
  Rank?: number;
  Popularity?: number;
  Genres?: string[];
  Demographic?: string;
  Rating?: string;
}

interface Recommendation {
  anime_id: string;
  title: string;
  similarity: number;
}

interface Review {
  review: string;
  votes: number;
}

export default function AnimeDetailPage() {
  const { id } = useParams();

  const [anime, setAnime] = useState<Anime | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchAnimeData() {
      try {
        const [animeRes, recRes, revRes] = await Promise.all([
          fetch(`/api/anime/features/${id}`),
          fetch(`/api/anime/recommendations/${id}`),
          fetch(`/api/anime/reviews/${id}`),
        ]);

        if (!animeRes.ok || !recRes.ok || !revRes.ok) {
          throw new Error("Failed to fetch some of the data.");
        }

        const animeData: Anime = await animeRes.json();
        setAnime(animeData);

        const recData: Recommendation[] = await recRes.json();
        setRecommendations(recData);

        const revData: Review[] = await revRes.json();
        setReviews(revData);
      } catch (error) {
        console.error('Failed to fetch anime data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchAnimeData();
  }, [id]);

  if (loading) {
    return <p className="container mx-auto p-4">Loading...</p>;
  }

  return (
    <div className="container mx-auto p-4">
      {anime ? (
        <>
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3">
              <Image
                src={anime.image_url || '/placeholder.jpg'}
                alt={anime.title}
                width={266}
                height={400}
                className="object-cover w-full h-full rounded-lg"
              />
            </div>
            <div className="md:w-2/3 md:pl-6">
              <h1 className="text-2xl font-bold text-blue-600">{anime.title}</h1>
              <p className="text-gray-700 mt-2">
                {anime.Description || 'No description available.'}
              </p>
              <div className="mt-4 space-y-2">
                <p><strong>Score:</strong> {anime.Score ?? 'N/A'}</p>
                <p><strong>Rank:</strong> {anime.Rank ?? 'N/A'}</p>
                <p><strong>Popularity:</strong> {anime.Popularity ?? 'N/A'}</p>
                <p><strong>Genres:</strong> {anime.Genres?.join(', ') || 'N/A'}</p>
                <p><strong>Demographic:</strong> {anime.Demographic || 'N/A'}</p>
                <p><strong>Rating:</strong> {anime.Rating || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Recommendations Section */}
          <h2 className="mt-8 text-xl font-semibold">Recommendations:</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {recommendations.map((rec) => (
              <div key={rec.anime_id} className="bg-white shadow rounded p-2">
                <Link href={`/anime/${rec.anime_id}`} className="text-blue-500 hover:underline">
                  <h3 className="text-lg font-semibold">{rec.title}</h3>
                </Link>
                <p className="text-sm text-gray-500">Similarity: {rec.similarity.toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Reviews Section */}
          <h2 className="mt-8 text-xl font-semibold">Reviews:</h2>
          <div className="mt-4 space-y-4">
            {reviews.length > 0 ? (
              reviews.map((review, index) => (
                <div key={index} className="bg-gray-100 p-4 rounded shadow">
                  <p className="text-gray-800">{review.review}</p>
                  <p className="text-sm text-gray-500">Votes: {review.votes}</p>
                </div>
              ))
            ) : (
              <p>No reviews available.</p>
            )}
          </div>
        </>
      ) : (
        <p>Anime not found.</p>
      )}
    </div>
  );
}
