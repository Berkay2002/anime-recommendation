import { useState } from 'react';
import AnimeCard from './AnimeCard';
import SectionHeader from './SectionHeader';

interface Anime {
  anime_id: number;
  English?: string;
  Japanese?: string;
  image_url?: string;
}

interface YourChoiceSectionProps {
  selectedAnime: Anime[];
}

export default function YourChoiceSection({ selectedAnime }: YourChoiceSectionProps) {
  return (
    <section className="relative">
      <SectionHeader title="Your Choice" />
      <div className="flex space-x-4 overflow-hidden pl-6 h-350">
        {selectedAnime.map((anime) => (
          <AnimeCard key={anime.anime_id} anime={anime} cardRef={{ current: null }} onSelect={() => {}} />
        ))}
      </div>
    </section>
  );
}