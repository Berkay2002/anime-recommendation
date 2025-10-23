"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import RecommendationList from '../../../components/RecommendationList';

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
  bert_rating: number[];
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

  const [anime, setAnime] = useState<Anime | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [reviews, setReviews] = useState<string[]>([]);
  const [generalFeatures, setGeneralFeatures] = useState<Anime[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Memoize the recommended anime mapping to avoid recalculation on every render
  const recommendedAnime = useMemo(() => {
    if (recommendations.length === 0 || generalFeatures.length === 0) {
      return [];
    }
    const featureMap = new Map(generalFeatures.map((anime) => [anime.anime_id, anime]));
    return recommendations
      .map((rec) => featureMap.get(rec.anime_id))
      .filter(Boolean) as Anime[];
  }, [recommendations, generalFeatures]);

  useEffect(() => {
    async function fetchGeneralFeatures() {
      try {
        // Använd en relativ sökväg som pekar mot dina API-routes
        const response = await fetch(`/api/anime/features?limit=657`);
        const featuresData: Anime[] = await response.json();

        setGeneralFeatures(featuresData);

        const selectedAnime = featuresData.find((anime) => anime.anime_id === numericId);
        if (selectedAnime) setAnime(selectedAnime);
      } catch (error) {
        console.error("Error fetching general features:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchGeneralFeatures();
  }, [id, numericId]);

  useEffect(() => {
    if (anime && generalFeatures.length > 0) {
      const worker = new Worker("/worker.js");

      worker.postMessage({
        selectedEmbedding: anime,
        allEmbeddings: generalFeatures,
        weights: { bert_description: 0.4, bert_genres: 0.35, bert_demographic: 0.15, bert_themes: 0.1 },
      });

      worker.onmessage = (e) => {
        setRecommendations(e.data);
        worker.terminate();
      };

      worker.onerror = (error) => {
        console.error('Worker error:', error);
        worker.terminate();
      };

      return () => worker.terminate(); // Cleanup to avoid memory leaks
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anime?.anime_id, generalFeatures]); // Only trigger when anime ID or features change

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    async function fetchReviews() {
      try {
        const response = await fetch(`/api/anime/reviews/${id}`, { signal });
        if (!response.ok) {
          throw new Error(`Failed to fetch reviews: ${response.statusText}`);
        }
        const data = await response.json();
        setReviews(data.reviews || []);
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Fetch aborted");
        } else {
          console.error("Error fetching reviews:", error);
        }
      }
    }

    fetchReviews();

    // Rensa upp om id ändras eller om komponenten avmonteras
    return () => {
      controller.abort();
    };
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
                width={200}
                height={300}
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
          {recommendedAnime.length > 0 ? (
            <RecommendationList
              recommendedAnime={recommendedAnime}
              showIcon={false}
            />
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
