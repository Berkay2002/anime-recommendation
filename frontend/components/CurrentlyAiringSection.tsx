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

interface CurrentlyAiringSectionProps {
  initialData?: Anime[]
  onSelectAnime: (anime: Anime) => void
  selectedAnimeIdSet: Set<number>
}

const skeletonItems = Array.from({ length: 10 })

function CurrentlyAiringSection({
  initialData,
  onSelectAnime,
  selectedAnimeIdSet,
}: CurrentlyAiringSectionProps) {
  const [clientData, loading, error] = useFetchData<Anime[]>(
    initialData ? null : "/api/anime?type=currently-airing&limit=25"
  )
  const airingAnime = initialData || clientData
  const {
    containerRef,
    cardRef,
    showLeftArrow,
    showRightArrow,
    scrollLeft,
    scrollRight,
  } = useScroll()

  const filteredAnime = useMemo(() => {
    if (!Array.isArray(airingAnime)) return []
    return airingAnime.filter(
      (anime) => !selectedAnimeIdSet.has(anime.anime_id)
    )
  }, [selectedAnimeIdSet, airingAnime])

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 pt-4 scroll-smooth sm:gap-4 sm:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {skeletonItems.map((_, index) => (
            <AnimeCardSkeleton key={`airing-skeleton-${index}`} />
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
        <div className="px-4 pb-6 sm:px-6">
          <Alert variant="destructive">
            <AlertTitle>Could not load currently airing anime</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        </div>
      )
    }

    if (!filteredAnime.length) {
      return (
        <div className="px-4 pb-6 sm:px-6">
          <Empty>
            <EmptyTitle>No new currently airing anime</EmptyTitle>
            <EmptyDescription>
              You have already added all the currently airing anime. Check
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
          className="flex gap-3 overflow-x-auto px-4 pb-2 pt-4 scroll-smooth sm:gap-4 sm:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
        title="Currently Airing"
        description="Watch what's broadcasting this season."
      />
      {content}
    </section>
  )
}

export default memo(CurrentlyAiringSection)
