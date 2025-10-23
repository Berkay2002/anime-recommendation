import AnimatedAnimeCard from './AnimatedAnimeCard';
import { useScroll } from '../hooks/useScroll';
import ScrollButton from './ScrollButton';
import { memo } from 'react';

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

interface RecommendationListProps {
  recommendedAnime: Anime[];
  onSelectAnime?: (anime: Anime) => void;
  showIcon?: boolean;
}

function RecommendationList({ recommendedAnime, onSelectAnime, showIcon = true }: RecommendationListProps) {
  const { containerRef, cardRef, showLeftArrow, showRightArrow, scrollLeft, scrollRight } = useScroll();

  return (
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
            showIcon={showIcon}
          />
        ))}
      </div>

      <ScrollButton direction="left" onClick={scrollLeft} show={showLeftArrow} />
      <ScrollButton direction="right" onClick={scrollRight} show={showRightArrow} />

      {/* Styles can be moved to a separate CSS file if preferred */}
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
    </div>
  );
}

export default memo(RecommendationList);