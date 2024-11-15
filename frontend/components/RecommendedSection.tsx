// frontend/components/RecommendedSection.tsx

import { useState, useEffect } from 'react';
import AnimeCard from './AnimeCard';
import SectionHeader from './SectionHeader';

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

interface RecommendedSectionProps {
  selectedAnimeIds: number[];
}

export default function RecommendedSection({ selectedAnimeIds }: RecommendedSectionProps) {
  const [recommendedAnime, setRecommendedAnime] = useState<Anime[]>([]);
  const [visible, setVisible] = useState(false);
  const [allAnime, setAllAnime] = useState<Anime[]>([]);

  useEffect(() => {
    // Fetch all anime features including BERT embeddings
    fetch('/api/anime/features')
      .then((res) => res.json())
      .then((data: Anime[]) => setAllAnime(data))
      .catch((error) => console.error('Failed to fetch anime features:', error));
  }, []);

  useEffect(() => {
    if (selectedAnimeIds.length > 0 && allAnime.length > 0) {
      setVisible(true);

      const selectedAnime = allAnime.find(anime => selectedAnimeIds.includes(anime.anime_id));
      if (!selectedAnime) return;

      const selectedEmbedding = {
        bert_description: selectedAnime.bert_description,
        bert_genres: selectedAnime.bert_genres,
        bert_demographic: selectedAnime.bert_demographic,
        bert_rating: selectedAnime.bert_rating,
        bert_themes: selectedAnime.bert_themes,
      };

      const worker = new Worker(new URL('./worker.js', import.meta.url));
      worker.postMessage({
        selectedEmbedding,
        allEmbeddings: allAnime,
        selectedTitle: selectedAnime.title,
        selectedAnimeIds, // Pass selectedAnimeIds to the worker
      });

      worker.onmessage = function (e) {
        const similarities = e.data;
        const recommendedAnime = similarities.slice(0, 10).map(sim => allAnime.find(anime => anime.anime_id === sim.anime_id)).filter(Boolean) as Anime[];
        setRecommendedAnime(recommendedAnime);
        worker.terminate();
      };
    }
  }, [selectedAnimeIds, allAnime]);

  return (
    <section className={`relative ${visible ? 'fade-in' : 'hidden'}`}>
      <SectionHeader title="Recommended" />
      <div className="flex space-x-4 overflow-hidden pl-6 h-350">
        {recommendedAnime.map((anime) => (
          <AnimeCard key={anime.anime_id} anime={anime} cardRef={{ current: null }} onSelect={() => {}} />
        ))}
      </div>
    </section>
  );
}