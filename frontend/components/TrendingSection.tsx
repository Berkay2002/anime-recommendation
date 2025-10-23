"use client"

import { memo, useMemo } from "react"

import { useFetchData } from "@/hooks/useFetchData"
import { useScroll } from "@/hooks/useScroll"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Empty, EmptyDescription, EmptyTitle } from "./ui/empty"
import AnimatedAnimeCard from "./AnimatedAnimeCard"
import AnimeCardSkeleton from "./AnimeCardSkeleton"
import ScrollButton from "./ScrollButton"
import SectionHeader from "./SectionHeader"

interface Anime {
  anime_id: number
  English?: string
  Japanese?: string
  image_url?: string
  Popularity?: number
}

interface TrendingSectionProps {
  onSelectAnime: (anime: Anime) => void
  selectedAnimeIdSet: Set<number>
}

const skeletonItems = Array.from({ length: 10 })

function TrendingSection({
  onSelectAnime,
  selectedAnimeIdSet,
}: TrendingSectionProps) {
  const [trendingAnime, loading, error] = useFetchData<Anime[]>(
    "/api/anime/trending"
  )
  const {
    containerRef,
    cardRef,
    showLeftArrow,
    showRightArrow,
    scrollLeft,
    scrollRight,
  } = useScroll()

  const filteredAnime = useMemo(() => {
    if (!Array.isArray(trendingAnime)) return []
    return trendingAnime.filter(
      (anime) => !selectedAnimeIdSet.has(anime.anime_id)
    )
  }, [selectedAnimeIdSet, trendingAnime])

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex gap-4 overflow-x-auto px-6 pb-2 pt-4 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {skeletonItems.map((_, index) => (
            <AnimeCardSkeleton key={`trending-skeleton-${index}`} />
          ))}
        </div>
      )
    }

    if (error) {
      const message =
        typeof error === "string"
          ? error
          : error?.message ?? "Please try again in a moment."

      return (
        <div className="px-6 pb-6">
          <Alert variant="destructive">
            <AlertTitle>Could not load trending anime</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        </div>
      )
    }

    if (!filteredAnime.length) {
      return (
        <div className="px-6 pb-6">
          <Empty>
            <EmptyTitle>No new trending anime</EmptyTitle>
            <EmptyDescription>
              You have already added all the currently trending anime. Check
              back later for more!
            </EmptyDescription>
          </Empty>
        </div>
      )
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
        title="Trending"
        description="See what other fans cannot stop watching right now."
      />
      {content}
    </section>
  )
}

export default memo(TrendingSection)
