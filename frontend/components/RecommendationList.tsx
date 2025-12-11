import { memo } from "react"

import { useScroll } from "@/hooks/useScroll"
import AnimatedAnimeCard from "./AnimatedAnimeCard"
import ScrollButton from "./ScrollButton"

interface Anime {
  anime_id: number
  English?: string
  Japanese?: string
  image_url?: string
  bert_description?: number[]
  bert_genres?: number[]
  bert_demographic?: number[]
  bert_rating?: number[]
  bert_themes?: number[]
  title: string
}

interface RecommendationListProps {
  recommendedAnime: Anime[]
  onSelectAnime?: (anime: Anime) => void
  showIcon?: boolean
}

function RecommendationList({
  recommendedAnime,
  onSelectAnime,
  showIcon = true,
}: RecommendationListProps) {
  const {
    containerRef,
    cardRef,
    showLeftArrow,
    showRightArrow,
    scrollLeft,
    scrollRight,
  } = useScroll()

  if (!recommendedAnime.length) {
    return null
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="flex gap-3 overflow-x-auto px-4 pb-2 pt-4 transition-[scroll-snap-type] scroll-smooth sm:gap-4 sm:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {recommendedAnime.map((anime) => (
          <AnimatedAnimeCard
            key={anime.anime_id}
            anime={anime}
            cardRef={cardRef}
            iconType="plus"
            onSelect={onSelectAnime}
            showIcon={showIcon}
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
  )
}

export default memo(RecommendationList)
