// frontend/app/page.tsx
"use client";

import YourChoiceSection from '../components/YourChoiceSection';
import RecommendedSection from '../components/RecommendedSection';
import TrendingSection from '../components/TrendingSection';
import TopRankedSection from '../components/TopRankedSection';
import { useState, useEffect, useMemo, useCallback } from 'react';

interface Anime {
  anime_id: number;
  English?: string;
  Japanese?: string;
  image_url?: string;
  // Add other necessary fields
}

const HomePage: React.FC = () => {
  const [selectedAnime, setSelectedAnime] = useState<Anime[]>([]);
  const [selectedAnimeIds, setSelectedAnimeIds] = useState<number[]>([]);

  // Create a Set for O(1) lookup performance
  const selectedAnimeIdSet = useMemo(() => new Set(selectedAnimeIds), [selectedAnimeIds]);

  // Load saved choices from localStorage on mount
  useEffect(() => {
    const savedChoices = localStorage.getItem('userChoices');
    if (savedChoices) {
      try {
        const parsedChoices: Anime[] = JSON.parse(savedChoices);
        setSelectedAnime(parsedChoices);
        setSelectedAnimeIds(parsedChoices.map((anime) => anime.anime_id));
      } catch (error) {
        console.error('Failed to parse saved choices from localStorage:', error);
        localStorage.removeItem('userChoices'); // Clear invalid data
      }
    }
  }, []);

  const handleSelectAnime = useCallback((anime: Anime) => {
    if (!selectedAnimeIdSet.has(anime.anime_id)) {
      const updatedSelectedAnime = [...selectedAnime, anime];
      setSelectedAnime(updatedSelectedAnime);
      setSelectedAnimeIds([...selectedAnimeIds, anime.anime_id]);
      // Save to localStorage
      localStorage.setItem('userChoices', JSON.stringify(updatedSelectedAnime));
    }
  }, [selectedAnime, selectedAnimeIds, selectedAnimeIdSet]);

  const handleRemoveAnime = useCallback((anime: Anime) => {
    const updatedSelectedAnime = selectedAnime.filter((a) => a.anime_id !== anime.anime_id);
    setSelectedAnime(updatedSelectedAnime);
    setSelectedAnimeIds(updatedSelectedAnime.map((a) => a.anime_id));
    // Save to localStorage
    localStorage.setItem('userChoices', JSON.stringify(updatedSelectedAnime));
  }, [selectedAnime]);

  return (
    <div>
      <div className="space-y-8">
        <YourChoiceSection
          selectedAnime={selectedAnime}
          onRemoveAnime={handleRemoveAnime}
        />
        <RecommendedSection
          selectedAnimeIds={selectedAnimeIds}
          onSelectAnime={handleSelectAnime}
        />
        <TrendingSection
          onSelectAnime={handleSelectAnime}
          selectedAnimeIdSet={selectedAnimeIdSet}
        />
        <TopRankedSection
          onSelectAnime={handleSelectAnime}
          selectedAnimeIdSet={selectedAnimeIdSet}
        />
      </div>
    </div>
  );
};

export default HomePage;