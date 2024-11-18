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
        const response = await fetch('/api/anime/features');
        if (!response.ok) {
          throw new Error(`Failed to fetch anime features: ${response.statusText}`);
        }
        const data: Anime[] = await response.json();
        setAllAnime(data);
      } catch (err) {
        console.error('Failed to fetch anime features:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAllAnime();
  }, []);

  useEffect(() => {
    if (selectedAnimeIds.length > 0 && allAnime.length > 0) {
      const selectedAnime = allAnime.find(anime => selectedAnimeIds.includes(anime.anime_id));
      if (!selectedAnime) return;

      const selectedEmbedding = {
        bert_description: selectedAnime.bert_description,
        bert_genres: selectedAnime.bert_genres,
        bert_demographic: selectedAnime.bert_demographic,
        bert_rating: selectedAnime.bert_rating,
        bert_themes: selectedAnime.bert_themes,
      };

      const worker = new Worker('/worker.js');
      worker.postMessage({
        selectedEmbedding,
        allEmbeddings: allAnime,
        selectedTitle: selectedAnime.title,
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