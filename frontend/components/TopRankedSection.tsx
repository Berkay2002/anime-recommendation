"use client"

import { memo, useMemo } from "react"

import { useFetchData } from "@/hooks/useFetchData"
import { useScroll } from "@/hooks/useScroll"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import AnimatedAnimeCard from "./AnimatedAnimeCard"
import AnimeCardSkeleton from "./AnimeCardSkeleton"
import ScrollButton from "./ScrollButton"
import SectionHeader from "./SectionHeader"

interface Anime {
  anime_id: number
  English?: string
  Japanese?: string
  image_url?: string
  Rank?: number
}

interface TopRankedSectionProps {
  initialData?: Anime[]
  onSelectAnime: (anime: Anime) => void
  selectedAnimeIdSet: Set<number>
}

const skeletonItems = Array.from({ length: 10 })

function TopRankedSection({
  initialData,
  onSelectAnime,
  selectedAnimeIdSet,
}: TopRankedSectionProps) {
  const [clientData, loading, error] = useFetchData<Anime[]>(
    initialData ? null : "/api/anime?type=top-ranked"
  )
  const topRankedAnime = initialData || clientData
  const {
    containerRef,
    cardRef,
    showLeftArrow,
    showRightArrow,
    scrollLeft,
    scrollRight,
  } = useScroll()

  const filteredAnime = useMemo(() => {
    if (!Array.isArray(topRankedAnime)) return []
    return topRankedAnime.filter(
      (anime) => !selectedAnimeIdSet.has(anime.anime_id)
    )
  }, [selectedAnimeIdSet, topRankedAnime])

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex gap-4 overflow-x-auto px-6 pb-2 pt-4 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {skeletonItems.map((_, index) => (
            <AnimeCardSkeleton key={`top-ranked-skeleton-${index}`} />
          ))}
        </div>
      )
    }

    if (error) {
      const message =
        typeof error === "string"
          ? error
          : error?.message ?? "Please try again soon."

      return (
        <div className="px-6 pb-6">
          <Alert variant="destructive">
            <AlertTitle>Could not load top ranked anime</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        </div>
      )
    }

    if (!filteredAnime.length) {
      return null
    }

    return (
      <div className="relative">
        <div
          ref={containerRef}
          className="flex gap-4 overflow-x-auto px-6 pb-2 pt-4 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {filteredAnime.map((anime) => (
            <AnimatedAnimeCard
              key={anime.anime_id}
              anime={anime}
              cardRef={cardRef}
              iconType="plus"
              onSelect={onSelectAnime}
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

  const content = renderContent()

  if (!content) {
    return null
  }

  return (
    <section className="relative">
      <SectionHeader
        title="Top Ranked"
        description="All-time greats according to the community."
      />
      {content}
    </section>
  )
}

export default memo(TopRankedSection)
