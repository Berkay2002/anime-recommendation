// YourChoiceSection.tsx
"use client"

import { useScroll } from "@/hooks/useScroll"
import AnimatedAnimeCard from "./AnimatedAnimeCard"
import ScrollButton from "./ScrollButton"
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
  const {
    containerRef,
    cardRef,
    showLeftArrow,
    showRightArrow,
    scrollLeft,
    scrollRight,
  } = useScroll()

  if (selectedAnime.length === 0) return null

  return (
    <section className="relative">
      <SectionHeader
        title="Your Selection"
        description="Fine-tune your picks anytime — remove a show to explore new matches."
      />
      <div className="relative">
        <div
          ref={containerRef}
          className="flex gap-4 overflow-x-auto px-6 pb-2 pt-4 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {selectedAnime.map((anime) => (
            <AnimatedAnimeCard
              key={anime.anime_id}
              anime={anime}
              cardRef={cardRef}
              iconType="minus"
              onRemove={onRemoveAnime}
            />
          ))}
        </div>
        <ScrollButton
          direction="left"
          onClick={scrollLeft}
          show={showLeftArrow}
        />
        <ScrollButton
          direction="right"
          onClick={scrollRight}
          show={showRightArrow}
        />
      </div>
    </section>
  )
}
