"use client";

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
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
  Score?: number;
  Popularity?: number;
  Rank?: number;
  Description?: string;
}

const HomePage: React.FC = () => {
  const [selectedAnime, setSelectedAnime] = useState<Anime[]>([]);
  const [selectedAnimeIds, setSelectedAnimeIds] = useState<number[]>([]);
  const [isLoadedFromCookies, setIsLoadedFromCookies] = useState(false);

  useEffect(() => {
    // Load user choices from cookies on page load
    const savedChoices = Cookies.get('userChoices');
    if (savedChoices) {
      const parsedChoices = JSON.parse(savedChoices);
      console.log('Loaded user choices from cookies:', parsedChoices);
      setSelectedAnime(parsedChoices);
      setSelectedAnimeIds(parsedChoices.map((anime: Anime) => anime.anime_id));
      setIsLoadedFromCookies(true);
    }
  }, []);

  const handleSelectAnime = (anime: Anime) => {
    const updatedSelectedAnime = [...selectedAnime, anime];
    setSelectedAnime(updatedSelectedAnime);
    setSelectedAnimeIds([...selectedAnimeIds, anime.anime_id]);
    Cookies.set('userChoices', JSON.stringify(updatedSelectedAnime), { expires: 7 });
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