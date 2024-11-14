"use client";

import { useState } from 'react';
import Navbar from '../components/Navbar';
import TrendingSection from '../components/TrendingSection';
import TopRankedSection from '../components/TopRankedSection';
import YourChoiceSection from '../components/YourChoiceSection';
import RecommendedSection from '../components/RecommendedSection';

interface Anime {
  anime_id: number;
  English?: string;
  Japanese?: string;
  image_url?: string;
}

const HomePage: React.FC = () => {
  const [selectedAnime, setSelectedAnime] = useState<Anime[]>([]);
  const [selectedAnimeIds, setSelectedAnimeIds] = useState<number[]>([]);

  const handleSelectAnime = (anime: Anime) => {
    setSelectedAnime([...selectedAnime, anime]);
    setSelectedAnimeIds([...selectedAnimeIds, anime.anime_id]);
  };

  return (
    <div>
      <div className="space-y-8">
        <YourChoiceSection selectedAnime={selectedAnime} />
        <RecommendedSection selectedAnimeIds={selectedAnimeIds} />
        <TrendingSection onSelectAnime={handleSelectAnime} selectedAnimeIds={selectedAnimeIds} />
        <TopRankedSection onSelectAnime={handleSelectAnime} selectedAnimeIds={selectedAnimeIds} />

      </div>
    </div>
  );
};

export default HomePage;