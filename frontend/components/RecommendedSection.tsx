// frontend/components/RecommendedSection.tsx

import { useState, useEffect } from 'react';
import SectionHeader from './SectionHeader';
import { useScroll } from '../hooks/useScroll';
import ScrollButton from './ScrollButton';
import AnimatedAnimeCard from './AnimatedAnimeCard';

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
  onSelectAnime: (anime: Anime) => void;
  selectedAnimeIds: number[];
}

export default function RecommendedSection({ onSelectAnime, selectedAnimeIds }: RecommendedSectionProps) {
  const [recommendedAnime, setRecommendedAnime] = useState<Anime[]>([]);
  const [visible, setVisible] = useState(false);
  const [allAnime, setAllAnime] = useState<Anime[]>([]);
  const { containerRef, cardRef, showLeftArrow, showRightArrow, scrollLeft, scrollRight } = useScroll();


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

      const worker = new Worker('/worker.js');
      worker.postMessage({
        selectedEmbedding,
        allEmbeddings: allAnime,
        selectedTitle: selectedAnime.title,
        selectedAnimeIds, // Pass selectedAnimeIds to the worker
      });

      worker.onmessage = function (e) {
        const similarities = e.data;
        const recommendedAnime = similarities
          .slice(0, 30) // Increase to 30 recommendations
          .map(sim => allAnime.find(anime => anime.anime_id === sim.anime_id))
          .filter(Boolean) as Anime[];
        setRecommendedAnime(recommendedAnime);
        worker.terminate();
      };
    }
  }, [selectedAnimeIds, allAnime]);

  return (
    <section className="relative fade-in">
      <SectionHeader title="Recommended" />
      <div className="relative flex items-center">
        <div
          className="flex space-x-4 overflow-hidden scrollbar-hide pl-6 h-350"
          ref={containerRef}
          style={{
            display: 'flex',
            gap: '0.3rem',
            overflowX: 'auto',
            scrollBehavior: 'smooth',
          }}
        >
          {recommendedAnime.map((anime) => (
            <AnimatedAnimeCard
              key={anime.anime_id}
              anime={anime}
              cardRef={cardRef}
              iconType="plus"
              onSelect={onSelectAnime}
            />
          ))}
        </div>

        {/* Position ScrollButtons absolutely within the parent div */}
        <ScrollButton direction="left" onClick={scrollLeft} show={showLeftArrow} />
        <ScrollButton direction="right" onClick={scrollRight} show={showRightArrow} />
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .fade-in {
          animation: fadeIn 0.5s;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .relative {
          position: relative;
        }
      `}</style>
    </section>
  );
}