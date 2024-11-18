"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface Anime {
  anime_id: number;
  title: string;
  image_url?: string;
  Description?: string;
  Score?: number;
  Rank?: number;
  Popularity?: number;
  Genres?: string[];
  Demographic?: string;
  Rating?: string;
  bert_description: number[];
  bert_genres: number[];
  bert_demographic: number[];
  bert_themes: number[];
}

interface Recommendation {
  anime_id: number;
  title: string;
  similarity: number;
}

export default function AnimeDetailPage() {
  const { id } = useParams();
  const numericId = Number(id);

  if (isNaN(numericId) || numericId < 0) {
    console.error("Invalid anime ID:", id);
    return <p>Error: Invalid anime ID</p>;
  }

  const [anime, setAnime] = useState<Anime | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [reviews, setReviews] = useState<string[]>([]);
  const [generalFeatures, setGeneralFeatures] = useState<Anime[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchGeneralFeatures() {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
      try {
        // Fetch all general features
        const response = await fetch(`${apiBase}/api/anime/features`);
        if (!response.ok) {
          throw new Error(`Failed to fetch general features: ${response.statusText}`);
        }

        const featuresData: Anime[] = await response.json();
        setGeneralFeatures(featuresData);

        // Find the specific anime by ID
        const selectedAnime = featuresData.find((anime) => anime.anime_id === numericId);
        if (selectedAnime) {
          setAnime(selectedAnime);
        } else {
          console.error(`Anime with ID ${numericId} not found in general features`);
        }
      } catch (error) {
        console.error("Error fetching general features:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchGeneralFeatures();
  }, [id]);

  useEffect(() => {
    if (anime && generalFeatures.length > 0) {
      // Use a worker to calculate recommendations
      const worker = new Worker("/worker.js");
      worker.postMessage({
        selectedEmbedding: anime,
        allEmbeddings: generalFeatures,
        selectedTitle: anime.title,
        selectedAnimeIds: [numericId],
        weights: {
          bert_description: 0.4,
          bert_genres: 0.35,
          bert_demographic: 0.15,
          bert_themes: 0.1,
        },
      });

      worker.onmessage = (e) => {
        const recommendations = e.data;
        if (Array.isArray(recommendations) && recommendations.length > 0) {
          setRecommendations(recommendations);
        } else {
          console.warn("No valid recommendations received.");
        }
        worker.terminate();
      };
    }
  }, [anime, generalFeatures]);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch(`/api/anime/reviews/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch reviews: ${response.statusText}`);
        }
        const data = await response.json();
        setReviews(data.reviews || []);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    }

    fetchReviews();
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
                src={anime.image_url || "/placeholder.jpg"}
                alt={anime.title || "Anime Image"}
                width={266}
                height={400}
                className="object-cover w-full h-full rounded-lg"
              />
            </div>
            <div className="md:w-2/3 md:pl-6">
              <h1 className="text-2xl font-bold text-blue-600">{anime.title || "Unknown Title"}</h1>
              <p className="text-gray-700 mt-2">
                {anime.Description || "No description available."}
              </p>
              <div className="mt-4 space-y-2">
                <p><strong>Score:</strong> {anime.Score ?? "N/A"}</p>
                <p><strong>Rank:</strong> {anime.Rank ?? "N/A"}</p>
                <p><strong>Popularity:</strong> {anime.Popularity ?? "N/A"}</p>
                <p><strong>Genres:</strong> {anime.Genres?.join(", ") || "N/A"}</p>
                <p><strong>Demographic:</strong> {anime.Demographic || "N/A"}</p>
                <p><strong>Rating:</strong> {anime.Rating || "N/A"}</p>
              </div>
            </div>
          </div>
          <h2 className="mt-8 text-xl font-semibold">Recommendations:</h2>
          {recommendations && recommendations.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              {recommendations.map((rec) => (
                <div key={rec.anime_id} className="bg-white shadow rounded p-2">
                  <Link href={`/anime/${rec.anime_id}`} className="text-blue-500 hover:underline">
                    <h3 className="text-lg font-semibold">{rec.title || "Untitled"}</h3>
                  </Link>
                  <p className="text-sm text-gray-500">
                    Similarity: {rec.similarity !== undefined ? rec.similarity.toFixed(2) : "N/A"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No recommendations available.</p>
          )}
          <h2 className="mt-8 text-xl font-semibold">Reviews:</h2>
          <div className="mt-4 space-y-4">
            {reviews && reviews.length > 0 ? (
              reviews.map((review, index) => (
                <div key={index} className="bg-gray-100 p-4 rounded shadow">
                  <p className="text-gray-800">{review}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No reviews available.</p>
            )}
          </div>
        </>
      ) : (
        <p className="text-gray-500">Anime not found.</p>
      )}
    </div>
  );
}
