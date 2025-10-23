// YourChoiceSection.tsx
"use client";

import AnimatedAnimeCard from "./AnimatedAnimeCard"
import SectionHeader from "./SectionHeader"

interface Anime {
  anime_id: number
  English?: string
  Japanese?: string
  image_url?: string
}

interface YourChoiceSectionProps {
  selectedAnime: Anime[]
  onRemoveAnime: (anime: Anime) => void
}

export default function YourChoiceSection({
  selectedAnime,
  onRemoveAnime,
}: YourChoiceSectionProps) {
  if (selectedAnime.length === 0) return null

  return (
    <section className="relative">
      <SectionHeader
        title="Your Selection"
        description="Fine-tune your picks anytime — remove a show to explore new matches."
      />
      <div className="flex gap-4 overflow-x-auto px-6 pb-2 pt-4 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {selectedAnime.map((anime) => (
          <AnimatedAnimeCard
            key={anime.anime_id}
            anime={anime}
            iconType="minus"
            onRemove={onRemoveAnime}
          />
        ))}
      </div>
    </section>
  )
}
