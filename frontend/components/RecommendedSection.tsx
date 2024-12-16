// frontend/components/RecommendedSection.tsx

import SectionHeader from './SectionHeader';
import { useRecommendations } from '../hooks/useRecommendations';
import RecommendationList from './RecommendationList';

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

interface RecommendedSectionProps {
  onSelectAnime: (anime: Anime) => void;
  selectedAnimeIds: number[];
}

export default function RecommendedSection({ onSelectAnime, selectedAnimeIds }: RecommendedSectionProps) {
  const { recommendedAnime, isLoading, error } = useRecommendations({ selectedAnimeIds });

  if (!recommendedAnime.length && !isLoading) {
    return null; // Hide the section if there are no recommendations
  }

  return (
    <section className="relative fade-in">
      <SectionHeader title="Recommended" />
      {isLoading ? (
        <p className="text-gray-500">Loading recommendations...</p>
      ) : error ? (
        <p className="text-red-500">Error loading recommendations: {error}</p>
      ) : (
        <RecommendationList recommendedAnime={recommendedAnime} onSelectAnime={onSelectAnime} />
      )}
    </section>
  );
}