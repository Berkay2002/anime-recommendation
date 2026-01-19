"use client"

import { memo, useEffect } from "react"

import { useRecommendations } from "@/hooks/useRecommendations"
import { useProgress } from "@/hooks/useProgress"
import { ProgressBar } from "./loading/ProgressBar"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import AnimeCardSkeleton from "./AnimeCardSkeleton"
import RecommendationList from "./RecommendationList"
import SectionHeader from "./SectionHeader"

interface Anime {
  anime_id: number
  English?: string
  Japanese?: string
  image_url?: string
  bert_description: number[]
  bert_genres: number[]
  bert_demographic: number[]
  bert_rating: number[]
  bert_themes: number[]
  title: string
}

interface RecommendedSectionProps {
  onSelectAnime: (anime: Anime) => void
  selectedAnimeIds: number[]
}

const skeletonItems = Array.from({ length: 10 })

function RecommendedSection({
  onSelectAnime,
  selectedAnimeIds,
}: RecommendedSectionProps) {
  const { recommendedAnime, isLoading, error, cancelRecommendations } =
    useRecommendations({
      selectedAnimeIds,
    })

  const {
    progress: progressValue,
    message,
    isGenerating,
    startProgress,
    cancel,
    finishProgress,
  } = useProgress()

  useEffect(() => {
    if (isLoading) {
      startProgress("Generating recommendations...")
    } else if (error) {
      cancel()
    } else if (recommendedAnime.length > 0) {
      finishProgress()
    }
  }, [
    isLoading,
    error,
    recommendedAnime.length,
    startProgress,
    cancel,
    finishProgress,
  ])

  const handleCancel = () => {
    cancelRecommendations()
    cancel()
  }

  return (
    <section className="relative">
      <SectionHeader
        title="Recommended For You"
        description="Hand-picked matches powered by your latest selections."
      />

      {isGenerating ? (
        <div className="px-4 pb-6 sm:px-6">
          <ProgressBar
            progress={progressValue}
            message={message}
            onCancel={handleCancel}
          />
        </div>
      ) : isLoading ? (
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 pt-4 scroll-smooth sm:gap-4 sm:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {skeletonItems.map((_, index) => (
            <AnimeCardSkeleton key={`recommended-skeleton-${index}`} />
          ))}
        </div>
      ) : error ? (
        <div className="px-4 pb-6 sm:px-6">
          <Alert variant="destructive">
            <AlertTitle>Could not load recommendations</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      ) : recommendedAnime.length ? (
        <RecommendationList
          recommendedAnime={recommendedAnime}
          onSelectAnime={onSelectAnime}
        />
      ) : (
        <div className="px-4 pb-6 sm:px-6">
          <Alert>
            <AlertTitle>Pick a few favorites</AlertTitle>
            <AlertDescription>
              Add anime to your selection to unlock personalized
              recommendations.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </section>
  )
}

export default memo(RecommendedSection)
