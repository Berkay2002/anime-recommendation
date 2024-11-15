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
  // Add other necessary fields
}

interface RecommendedSectionProps {
  selectedAnimeIds: number[];
  onSelectAnime: (anime: Anime) => void;
}

export default function RecommendedSection({ selectedAnimeIds, onSelectAnime }: RecommendedSectionProps) {
  const [recommendedAnime, setRecommendedAnime] = useState<Anime[]>([]);
  const { containerRef, cardRef, showLeftArrow, showRightArrow, scrollLeft, scrollRight } = useScroll();

  useEffect(() => {
    if (selectedAnimeIds.length > 0) {
      fetch(`/api/anime/recommendation?ids=${selectedAnimeIds.join(',')}`)
        .then((res) => res.json())
        .then((data: Anime[]) => setRecommendedAnime(data))
        .catch((error) => console.error('Failed to fetch recommendations:', error));
    } else {
      setRecommendedAnime([]);
    }
  }, [selectedAnimeIds]);

  if (recommendedAnime.length === 0) return null;

  return (
    <section className="relative fade-in">
      <SectionHeader title="Recommended" />
      <div className="relative flex items-center overflow-visible">
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
      `}</style>
    </section>
  );
}