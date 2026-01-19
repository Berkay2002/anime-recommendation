"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { useQueries } from "@tanstack/react-query"

import RecommendationList from "@/components/RecommendationList"
import AnimeDetailHeader from "@/components/AnimeDetailHeader"
import AnimeDetailStats from "@/components/AnimeDetailStats"
import AnimeDetailSkeleton from "@/components/AnimeDetailSkeleton"
import AnimeDetailExtraDetails from "@/components/AnimeDetailExtraDetails"
import SectionHeader from "@/components/SectionHeader"
import { ErrorMessage } from "@/components/ErrorMessage"
import { LoadingSpinner } from "@/components/loading"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { useErrorHandler } from "@/hooks/useErrorHandler"

interface Anime {
  anime_id: number
  mal_id?: number
  title: string
  image_url?: string
  description?: string
  Description?: string
  score?: number
  Score?: number
  rank?: number
  Rank?: number
  popularity?: number
  Popularity?: number
  genres?: string[]
  Genres?: string[]
  demographic?: string
  Demographic?: string
  rating?: string
  Rating?: string
  // Embeddings no longer needed on client
  bert_description?: number[]
  bert_genres?: number[]
  bert_demographic?: number[]
  bert_rating?: number[]
  bert_themes?: number[]
}

interface JikanDetails {
  characters: {
    name: string
    role: string
    voiceActors: { name: string; language: string }[]
    imageUrl?: string | null
  }[]
  staff: {
    name: string
    positions: string[]
    imageUrl?: string | null
  }[]
  statistics: {
    label: string
    value: number
  }[]
}

export default function AnimeDetailPage() {
  const { id } = useParams()
  const numericId = Number(id)

  // Error state management for Jikan extra details (still uses manual fetch)
  const { setError: setDetailsErrorState } = useErrorHandler()

  // BEFORE: 3 separate useEffect hooks (sequential)
  // useEffect(() => { fetchAnimeDetails() }, [numericId])
  // useEffect(() => { fetchRecommendations() }, [anime])
  // useEffect(() => { fetchReviews() }, [anime])

  // AFTER: Single useQueries call (parallel)
  const results = useQueries({
    queries: [
      {
        queryKey: ['anime', 'detail', numericId],
        queryFn: () => fetch(`/api/anime?limit=1000`).then(r => r.json()).then(data => {
          const animeList = data.anime || []
          return animeList.find((item: Anime) => item.anime_id === numericId) || null
        }),
        enabled: !!numericId,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
      {
        queryKey: ['anime', numericId, 'recommendations'],
        queryFn: () => fetch(`/api/anime/recommendation/${numericId}`).then(r => r.json()),
        enabled: !!numericId,
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: ['anime', numericId, 'reviews'],
        queryFn: () => fetch(`/api/anime/reviews/${numericId}`).then(r => r.json()),
        enabled: !!numericId,
        staleTime: 5 * 60 * 1000,
      },
    ],
    combine: (results) => ({
      anime: results[0].data,
      recommendations: results[1].data?.similar_anime || [],
      reviews: results[2].data?.reviews || [],
      isLoading: results.some(r => r.isLoading),
      reviewsLoading: results[2].isLoading,
      errors: results.filter(r => r.error).map(r => r.error),
    })
  })

  const { anime: animeFromQuery, recommendations: recommendationsFromQuery, reviews: reviewsFromQuery, isLoading: isLoadingFromQuery, reviewsLoading, errors: errorsFromQuery } = results

  const recommendedAnime = useMemo(() => {
    // API returns complete anime data, use it directly
    return recommendationsFromQuery.map(rec => ({
      anime_id: rec.anime_id,
      title: rec.title,
      image_url: rec.image_url,
      score: rec.score,
      popularity: rec.popularity,
      genres: rec.genres,
      // Add empty embeddings for compatibility with RecommendationList
      bert_description: [],
      bert_genres: [],
      bert_demographic: [],
      bert_rating: [],
      bert_themes: [],
    } as Anime))
  }, [recommendationsFromQuery])

  // Note: Anime details, recommendations, and reviews now fetched in parallel via useQueries above

  // Jikan extra details still uses manual fetch (not migrated to React Query)
  const [details, setDetails] = useState<JikanDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const anime = animeFromQuery // Alias for compatibility with existing code

  useEffect(() => {
    if (!anime) return

    const controller = new AbortController()
    const { signal } = controller

    async function fetchDetails() {
      try {
        setDetailsLoading(true)
        setDetailsError(null)
        setDetails(null)
        const detailId = anime.mal_id ?? anime.anime_id
        const response = await fetch(`/api/anime/jikan/${detailId}`, { signal })

        if (!response.ok) {
          throw new Error(`Failed to fetch details: ${response.statusText}`)
        }

        const data = await response.json()
        setDetails(data)
      } catch (fetchError: unknown) {
        if (fetchError instanceof Error) {
          if (fetchError.name !== "AbortError") {
            setDetailsErrorState(fetchError, 'Failed to fetch extra details')
            setDetailsError("Unable to load extra details right now.")
          }
        } else {
          setDetailsErrorState(new Error('Unknown error fetching details'), 'Failed to fetch extra details')
          setDetailsError("Unable to load extra details right now.")
        }
      } finally {
        setDetailsLoading(false)
      }
    }

    fetchDetails()

    return () => {
      controller.abort()
    }
  }, [anime, setDetailsErrorState])

  if (isLoadingFromQuery) {
    return <AnimeDetailSkeleton />
  }

  if (!anime) {
    return (
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:py-8">
        <Alert variant="destructive">
          <AlertTitle>Anime not found</AlertTitle>
          <AlertDescription>
            We could not locate the title you were looking for.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const stats = [
    { label: "Score", value: anime.score ?? anime.Score ?? "N/A" },
    { label: "Rank", value: anime.rank ?? anime.Rank ?? "N/A" },
    { label: "Popularity", value: anime.popularity ?? anime.Popularity ?? "N/A" },
    { label: "Demographic", value: anime.demographic ?? anime.Demographic ?? "N/A" },
    { label: "Rating", value: anime.rating ?? anime.Rating ?? "N/A" },
  ]

  return (
    <div className="container mx-auto flex flex-col gap-8 px-4 py-6 sm:gap-10 sm:px-6 lg:gap-12 lg:py-10">
      {errorsFromQuery.length > 0 && (
        <ErrorMessage
          error={{
            message: errorsFromQuery[0]?.message || 'Failed to load data',
            errorType: 'unknown',
            isRetryable: true
          }}
          onRetry={() => window.location.reload()}
        />
      )}

      <Card className="overflow-hidden border border-border/60 bg-card/80 shadow-sm">
        <CardContent className="grid gap-6 px-4 py-6 md:gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          <AnimeDetailHeader anime={anime} />

          <div className="lg:max-w-[420px]">
            <AnimeDetailStats stats={stats} />
          </div>
        </CardContent>
      </Card>

      <section
        className="space-y-4"
        id="recommendations"
        role="status"
        aria-live="polite"
        aria-busy={isLoadingFromQuery}
      >
        <SectionHeader
          title="Recommendations"
          description="Similar shows based on description, genres, demographics, and themes."
        />
        {isLoadingFromQuery ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" message="Loading recommendations..." />
          </div>
        ) : recommendedAnime.length ? (
          <RecommendationList recommendedAnime={recommendedAnime} showIcon={false} />
        ) : (
          <Alert>
            <AlertTitle>No recommendations yet</AlertTitle>
            <AlertDescription>
              We could not generate any similar titles for this show.
            </AlertDescription>
          </Alert>
        )}
      </section>

      <div className="flex flex-col gap-10 sm:gap-12">
        <AnimeDetailExtraDetails
          details={details}
          detailsLoading={detailsLoading}
          detailsError={detailsError}
          reviews={reviewsFromQuery.map(r => r.review_text)}
          reviewsLoading={reviewsLoading}
        />
      </div>
    </div>
  )
}
