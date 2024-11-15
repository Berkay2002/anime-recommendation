"use client";

import { useState } from 'react';
import AnimeCard from './AnimeCard';
import ScrollButton from './ScrollButton';
import SectionHeader from './SectionHeader';
import { useFetchData } from '../hooks/useFetchData';
import { useScroll } from '../hooks/useScroll';

interface Anime {
  anime_id: number;
  English?: string;
  Japanese?: string;
  image_url?: string;
  Popularity?: number;
}

interface TrendingSectionProps {
  onSelectAnime: (anime: Anime) => void;
  selectedAnimeIds: number[];
}

export default function TrendingSection({ onSelectAnime, selectedAnimeIds }: TrendingSectionProps) {
  const [trendingAnime, loading, error] = useFetchData<Anime[]>('/api/anime/features?sortBy=Popularity');
  const { containerRef, cardRef, showLeftArrow, showRightArrow, scrollLeft, scrollRight } = useScroll();

  const filteredAnime = trendingAnime?.filter(anime => !selectedAnimeIds.includes(anime.anime_id));

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;

  return (
    <section className="relative">
      <SectionHeader title="Trending" />
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
          {filteredAnime?.map((anime) => (
            <AnimeCard
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
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>
    </section>
  );
}