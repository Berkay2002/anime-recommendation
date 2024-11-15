// app/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import YourChoiceSection from '../components/YourChoiceSection';
import RecommendedSection from '../components/RecommendedSection';
import TrendingSection from '../components/TrendingSection';
import TopRankedSection from '../components/TopRankedSection';

interface Anime {
  anime_id: number;
  English?: string;
  Japanese?: string;
  image_url?: string;
}

const HomePage: React.FC = () => {
  const [selectedAnime, setSelectedAnime] = useState<Anime[]>([]);
  const [selectedAnimeIds, setSelectedAnimeIds] = useState<number[]>([]);

  useEffect(() => {
    // Load user choices from cookies on page load
    const savedChoices = Cookies.get('userChoices');
    if (savedChoices) {
      const parsedChoices = JSON.parse(savedChoices);
      console.log('Loaded user choices from cookies:', parsedChoices);
      setSelectedAnime(parsedChoices);
      setSelectedAnimeIds(parsedChoices.map((anime: Anime) => anime.anime_id));
    }
  }, []);

  const handleSelectAnime = (anime: Anime) => {
    const updatedSelectedAnime = [...selectedAnime, anime];
    setSelectedAnime(updatedSelectedAnime);
    setSelectedAnimeIds([...selectedAnimeIds, anime.anime_id]);
    Cookies.set('userChoices', JSON.stringify(updatedSelectedAnime), { expires: 7 });
  };

  const handleRemoveAnime = (anime: Anime) => {
    const updatedSelectedAnime = selectedAnime.filter((a) => a.anime_id !== anime.anime_id);
    setSelectedAnime(updatedSelectedAnime);
    setSelectedAnimeIds(updatedSelectedAnime.map((anime) => anime.anime_id));
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