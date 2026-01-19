"use client"

import Link from "next/link"
import { useCallback, useMemo } from "react"

import CurrentlyAiringSection from "@/components/CurrentlyAiringSection"
import HeroSection from "@/components/HeroSection"
import RecommendedSection from "@/components/RecommendedSection"
import TopRankedSection from "@/components/TopRankedSection"
import TrendingSection from "@/components/TrendingSection"
import UpcomingSection from "@/components/UpcomingSection"
import YourChoiceSection from "@/components/YourChoiceSection"
import { Button } from "@/components/ui/button"
import { useLocalStorage } from "@/hooks/useLocalStorage"

interface Anime {
  anime_id: number
  English?: string
  Japanese?: string
  image_url?: string
}

const HomePage = () => {
  const [selectedAnime, setSelectedAnime] = useLocalStorage<Anime[]>(
    "userChoices",
    []
  )

  const selectedAnimeIds = useMemo(
    () => selectedAnime.map((anime) => anime.anime_id),
    [selectedAnime]
  )

  const selectedAnimeIdSet = useMemo(
    () => new Set(selectedAnimeIds),
    [selectedAnimeIds]
  )

  const handleSelectAnime = useCallback(
    (anime: Anime) => {
      setSelectedAnime((prev) => {
        if (prev.some((item) => item.anime_id === anime.anime_id)) {
          return prev
        }
        return [...prev, anime]
      })
    },
    []
  )

  const handleRemoveAnime = useCallback(
    (anime: Anime) => {
      setSelectedAnime((prev) => {
        return prev.filter((item) => item.anime_id !== anime.anime_id)
      })
    },
    []
  )

  return (
    <div className="flex flex-col">
      <HeroSection />
      <div className="container mx-auto flex flex-col gap-8 px-4 py-6 sm:gap-10 sm:px-6 lg:gap-12 lg:py-10">
        <section className="order-1 space-y-4 md:order-1">
          <YourChoiceSection
            selectedAnime={selectedAnime}
            onRemoveAnime={handleRemoveAnime}
          />
        </section>

        <section className="order-2 md:order-2">
          <RecommendedSection
            selectedAnimeIds={selectedAnimeIds}
            onSelectAnime={handleSelectAnime}
          />
        </section>

        <section className="order-3 md:order-3">
          <TrendingSection
            onSelectAnime={handleSelectAnime}
            selectedAnimeIdSet={selectedAnimeIdSet}
          />
        </section>

        <section className="order-4 md:order-4">
          <CurrentlyAiringSection
            onSelectAnime={handleSelectAnime}
            selectedAnimeIdSet={selectedAnimeIdSet}
          />
        </section>

        <section className="order-5 md:order-5">
          <UpcomingSection
            onSelectAnime={handleSelectAnime}
            selectedAnimeIdSet={selectedAnimeIdSet}
          />
        </section>

        <section className="order-6 hidden md:block">
          <TopRankedSection
            onSelectAnime={handleSelectAnime}
            selectedAnimeIdSet={selectedAnimeIdSet}
          />
        </section>

        <div className="order-6 md:hidden">
          <Button asChild variant="outline" className="w-full">
            <Link href="/anime?sortBy=Rank">Browse top ranked picks</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default HomePage
