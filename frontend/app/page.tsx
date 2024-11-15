// frontend/app/page.tsx
"use client";

import YourChoiceSection from '../components/YourChoiceSection';
import RecommendedSection from '../components/RecommendedSection';
import TrendingSection from '../components/TrendingSection';
import TopRankedSection from '../components/TopRankedSection';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

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

  useEffect(() => {
    const savedChoices = Cookies.get('userChoices');
    if (savedChoices) {
      const parsedChoices: Anime[] = JSON.parse(savedChoices);
      setSelectedAnime(parsedChoices);
      setSelectedAnimeIds(parsedChoices.map((anime) => anime.anime_id));
    }
  }, []);

  const handleSelectAnime = (anime: Anime) => {
    if (!selectedAnimeIds.includes(anime.anime_id)) {
      const updatedSelectedAnime = [...selectedAnime, anime];
      setSelectedAnime(updatedSelectedAnime);
      setSelectedAnimeIds([...selectedAnimeIds, anime.anime_id]);
      Cookies.set('userChoices', JSON.stringify(updatedSelectedAnime), { expires: 7 });
    }
  };

  const handleRemoveAnime = (anime: Anime) => {
    const updatedSelectedAnime = selectedAnime.filter((a) => a.anime_id !== anime.anime_id);
    setSelectedAnime(updatedSelectedAnime);
    setSelectedAnimeIds(updatedSelectedAnime.map((a) => a.anime_id));
    Cookies.set('userChoices', JSON.stringify(updatedSelectedAnime), { expires: 7 });
  };

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
          selectedAnimeIds={selectedAnimeIds} 
        />
        <TopRankedSection 
          onSelectAnime={handleSelectAnime} 
          selectedAnimeIds={selectedAnimeIds} 
        />
      </div>
    </div>
  );
};

export default HomePage;