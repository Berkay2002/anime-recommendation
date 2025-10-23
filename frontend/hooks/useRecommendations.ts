import { useState, useEffect } from 'react';

interface Anime {
    anime_id: number;
    English?: string;
    Japanese?: string;
    image_url?: string;
    bert_description: number[];
    bert_genres: number[];
    bert_demographic: number[];
    bert_rating: number[];
    bert_themes: number[];
    title: string;
  }

interface Recommendation {
  anime_id: number;
  title: string;
  similarity: number;
}

interface UseRecommendationsProps {
  selectedAnimeIds: number[];
}

export function useRecommendations({ selectedAnimeIds }: UseRecommendationsProps) {
  const [recommendedAnime, setRecommendedAnime] = useState<Anime[]>([]);
  const [allAnime, setAllAnime] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAllAnime() {
      try {
        setIsLoading(true);
        // Use metadata endpoint first for lighter initial load
        // Then fetch full features with embeddings for recommendations
        const response = await fetch('/api/anime/features?limit=657&sortBy=Popularity');

        if (!response.ok) {
          throw new Error(`Failed to fetch anime features: ${response.status} ${response.statusText}`);
        }

        const data: Anime[] = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('No anime data received from API');
        }

        setAllAnime(data);
      } catch (err: any) {
        console.error('Failed to fetch anime features:', err);
        setError(err?.message || 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    fetchAllAnime();
  }, []);

  useEffect(() => {
    if (selectedAnimeIds.length > 0 && allAnime.length > 0) {
      // Get ALL selected anime instead of just the first one
      const selectedAnimeList = allAnime.filter(anime => selectedAnimeIds.includes(anime.anime_id));

      // Return early if no valid selected anime found
      if (selectedAnimeList.length === 0) return;

      // Extract embeddings and titles from all selected anime
      const selectedEmbeddings = selectedAnimeList.map(anime => ({
        bert_description: anime.bert_description,
        bert_genres: anime.bert_genres,
        bert_demographic: anime.bert_demographic,
        bert_rating: anime.bert_rating,
        bert_themes: anime.bert_themes,
      }));

      const selectedTitles = selectedAnimeList.map(anime => anime.title);

      const worker = new Worker('/worker.js');
      worker.postMessage({
        selectedEmbeddings,  // Array of embeddings
        allEmbeddings: allAnime,
        selectedTitles,      // Array of titles
        selectedAnimeIds,
      });

      worker.onmessage = function (e) {
        const similarities = e.data;
        const recommendations = similarities
          .slice(0, 30)
          .map(sim => allAnime.find(anime => anime.anime_id === sim.anime_id))
          .filter(Boolean) as Anime[];
        setRecommendedAnime(recommendations);
        worker.terminate();
      };
    }
  }, [selectedAnimeIds, allAnime]);

  return { recommendedAnime, isLoading, error };
}