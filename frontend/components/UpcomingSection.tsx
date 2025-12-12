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

interface UpcomingSectionProps {
  initialData?: Anime[]
  onSelectAnime: (anime: Anime) => void
  selectedAnimeIdSet: Set<number>
}

const skeletonItems = Array.from({ length: 10 })

function UpcomingSection({
  initialData,
  onSelectAnime,
  selectedAnimeIdSet,
}: UpcomingSectionProps) {
  const [clientData, loading, error] = useFetchData<Anime[]>(
    initialData ? null : "/api/anime?type=upcoming&limit=25"
  )
  const upcomingAnime = initialData || clientData
  const {
    containerRef,
    cardRef,
    showLeftArrow,
    showRightArrow,
    scrollLeft,
    scrollRight,
  } = useScroll()

  const filteredAnime = useMemo(() => {
    if (!Array.isArray(upcomingAnime)) return []
    return upcomingAnime.filter(
      (anime) => !selectedAnimeIdSet.has(anime.anime_id)
    )
  }, [selectedAnimeIdSet, upcomingAnime])

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 pt-4 scroll-smooth sm:gap-4 sm:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {skeletonItems.map((_, index) => (
            <AnimeCardSkeleton key={`upcoming-skeleton-${index}`} />
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
            <AlertTitle>Could not load upcoming anime</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        </div>
      )
    }

    if (!filteredAnime.length) {
      return (
        <div className="px-4 pb-6 sm:px-6">
          <Empty>
            <EmptyTitle>No new upcoming anime</EmptyTitle>
            <EmptyDescription>
              You have already added all the upcoming anime. Check
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
        title="Coming Soon"
        description="Get ready for next season's most anticipated releases."
      />
      {content}
    </section>
  )
}

export default memo(UpcomingSection)
