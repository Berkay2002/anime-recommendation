"use client"

import Link from "next/link"
import { useCallback, useMemo, useState } from "react"

import RecommendedSection from "@/components/RecommendedSection"
import TopRankedSection from "@/components/TopRankedSection"
import TrendingSection from "@/components/TrendingSection"
import YourChoiceSection from "@/components/YourChoiceSection"
import { Button } from "@/components/ui/button"

interface Anime {
  anime_id: number
  English?: string
  Japanese?: string
  image_url?: string
}

const HomePage = () => {
  const [selectedAnime, setSelectedAnime] = useState<Anime[]>(() => {
    if (typeof window !== "undefined") {
      const savedChoices = localStorage.getItem("userChoices")
      if (savedChoices) {
        try {
          return JSON.parse(savedChoices)
        } catch (parseError) {
          console.error(
            "Failed to parse saved choices from localStorage:",
            parseError
          )
          localStorage.removeItem("userChoices")
        }
      }
    }
    return []
  })

  const [selectedAnimeIds, setSelectedAnimeIds] = useState<number[]>(() =>
    selectedAnime.map((anime) => anime.anime_id)
  )

  const selectedAnimeIdSet = useMemo(
    () => new Set(selectedAnimeIds),
    [selectedAnimeIds]
  )

  const syncSelections = useCallback((nextSelections: Anime[]) => {
    setSelectedAnimeIds(nextSelections.map((item) => item.anime_id))
    localStorage.setItem("userChoices", JSON.stringify(nextSelections))
  }, [])

  const handleSelectAnime = useCallback(
    (anime: Anime) => {
      setSelectedAnime((prev) => {
        if (prev.some((item) => item.anime_id === anime.anime_id)) {
          return prev
        }
        const nextSelections = [...prev, anime]
        syncSelections(nextSelections)
        return nextSelections
      })
    },
    [syncSelections]
  )

  const handleRemoveAnime = useCallback(
    (anime: Anime) => {
      setSelectedAnime((prev) => {
        const nextSelections = prev.filter(
          (item) => item.anime_id !== anime.anime_id
        )
        syncSelections(nextSelections)
        return nextSelections
      })
    },
    [syncSelections]
  )

  return (
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

      <section className="order-4 hidden md:block">
        <TopRankedSection
          onSelectAnime={handleSelectAnime}
          selectedAnimeIdSet={selectedAnimeIdSet}
        />
      </section>

      <div className="order-4 md:hidden">
        <Button asChild variant="outline" className="w-full">
          <Link href="/anime?sortBy=Rank">Browse top ranked picks</Link>
        </Button>
      </div>
    </div>
  )
}

export default HomePage
