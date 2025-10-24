"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import RecommendedSection from "@/components/RecommendedSection"
import TopRankedSection from "@/components/TopRankedSection"
import TrendingSection from "@/components/TrendingSection"
import YourChoiceSection from "@/components/YourChoiceSection"

interface Anime {
  anime_id: number
  English?: string
  Japanese?: string
  image_url?: string
}

const HomePage = () => {
  const [selectedAnime, setSelectedAnime] = useState<Anime[]>([])
  const [selectedAnimeIds, setSelectedAnimeIds] = useState<number[]>([])

  const selectedAnimeIdSet = useMemo(
    () => new Set(selectedAnimeIds),
    [selectedAnimeIds]
  )

  const syncSelections = useCallback((nextSelections: Anime[]) => {
    setSelectedAnimeIds(nextSelections.map((item) => item.anime_id))
    localStorage.setItem("userChoices", JSON.stringify(nextSelections))
  }, [])

  useEffect(() => {
    const savedChoices = localStorage.getItem("userChoices")
    if (savedChoices) {
      try {
        const parsedChoices: Anime[] = JSON.parse(savedChoices)
        setSelectedAnime(parsedChoices)
        setSelectedAnimeIds(parsedChoices.map((anime) => anime.anime_id))
      } catch (parseError) {
        console.error("Failed to parse saved choices from localStorage:", parseError)
        localStorage.removeItem("userChoices")
      }
    }
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
      <YourChoiceSection
        selectedAnime={selectedAnime}
        onRemoveAnime={handleRemoveAnime}
      />
      <RecommendedSection
        selectedAnimeIds={selectedAnimeIds}
        onSelectAnime={handleSelectAnime}
      />
      <TrendingSection
        onSelectAnime={handleSelectAnime}
        selectedAnimeIdSet={selectedAnimeIdSet}
      />
      <TopRankedSection
        onSelectAnime={handleSelectAnime}
        selectedAnimeIdSet={selectedAnimeIdSet}
      />
    </div>
  )
}

export default HomePage
