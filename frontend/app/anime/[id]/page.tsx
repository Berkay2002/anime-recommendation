"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"

import RecommendationList from "@/components/RecommendationList"
import AnimeDetailHeader from "@/components/AnimeDetailHeader"
import AnimeDetailStats from "@/components/AnimeDetailStats"
import AnimeDetailSkeleton from "@/components/AnimeDetailSkeleton"
import AnimeDetailExtraDetails from "@/components/AnimeDetailExtraDetails"
import AnimeDetailReviews from "@/components/AnimeDetailReviews"
import SectionHeader from "@/components/SectionHeader"
import { ErrorMessage } from "@/components/ErrorMessage"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { useErrorHandler } from "@/hooks/useErrorHandler"
import { clientLogger } from "@/lib/client-logger"

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

interface Recommendation {
  anime_id: number
  title: string
  image_url?: string
  score?: number
  popularity?: number
  genres?: string[]
  similarity: number
}

interface RecommendationResponseItem {
  anime_id: number
  title: string
  image_url?: string
  score?: number
  popularity?: number
  genres?: string[]
  similarity: number
}

interface RecommendationResponse {
  similar_anime?: RecommendationResponseItem[]
}

interface ReviewResponseItem {
  review_text: string
}

interface ReviewResponse {
  reviews?: ReviewResponseItem[]
}

interface JikanDetails {
  characters: {
    name: string
    role: string
    voiceActors: string[]
  }[]
  staff: {
    name: string
    positions: string[]
  }[]
  statistics: {
    label: string
    value: number
  }[]
}

export default function AnimeDetailPage() {
  const { id } = useParams()
  const numericId = Number(id)

  const [anime, setAnime] = useState<Anime | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [reviews, setReviews] = useState<string[]>([])
  const [details, setDetails] = useState<JikanDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // Error state management for main data fetch
  const mainError = useErrorHandler()
  const recommendationsError = useErrorHandler()
  const reviewsErrorHandler = useErrorHandler()
  const detailsErrorState = useErrorHandler()

  const recommendedAnime = useMemo(() => {
    // API returns complete anime data, use it directly
    return recommendations.map(rec => ({
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
  }, [recommendations])

  useEffect(() => {
    async function fetchAnimeDetails() {
      try {
        // Fetch just this anime's metadata - no embeddings needed
        const response = await fetch(`/api/anime?limit=1000`)

        if (!response.ok) {
          throw new Error(`Failed to fetch anime: ${response.status}`)
        }

        const payload = await response.json()
        const animeList: Anime[] = payload.anime || []

        const selectedAnime = animeList.find(
          (item) => item.anime_id === numericId
        )

        if (selectedAnime) {
          setAnime(selectedAnime)
        }
      } catch (error) {
        mainError.setError(error, 'Failed to fetch anime details')
      } finally {
        setLoading(false)
      }
    }

    fetchAnimeDetails()
  }, [numericId, mainError])

  useEffect(() => {
    if (!anime) return

    const controller = new AbortController()
    const { signal } = controller

    async function fetchRecommendations() {
      try {
        const response = await fetch(`/api/anime/recommendation/${anime.anime_id}`, { signal })

        if (!response.ok) {
          if (response.status === 404) {
            clientLogger.debug('No recommendations found for this anime')
            setRecommendations([])
            return
          }
          throw new Error(`Failed to fetch recommendations: ${response.statusText}`)
        }

        const data = (await response.json()) as RecommendationResponse
        // Transform server response to match existing Recommendation interface
        const transformedRecs = (data.similar_anime ?? []).map((rec) => ({
          anime_id: rec.anime_id,
          title: rec.title,
          image_url: rec.image_url,
          score: rec.score,
          popularity: rec.popularity,
          genres: rec.genres,
          similarity: rec.similarity
        })) || []

        setRecommendations(transformedRecs)
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
          recommendationsError.setError(error, 'Failed to fetch recommendations')
        }
      }
    }

    fetchRecommendations()

    return () => controller.abort()
  }, [anime, recommendationsError])

  useEffect(() => {
    if (!anime) return

    const controller = new AbortController()
    const { signal } = controller

    async function fetchReviews() {
      try {
        const reviewId = anime.mal_id ?? anime.anime_id
        setReviews([])
        const response = await fetch(`/api/anime/reviews/${reviewId}`, { signal })
        if (!response.ok) {
          // 404 is expected when there are no reviews, silently handle it
          if (response.status === 404) {
            setReviews([])
            return
          }
          throw new Error(`Failed to fetch reviews: ${response.statusText}`)
        }
        const data = (await response.json()) as ReviewResponse
        // Handle the response which has {anime_id, title, reviews: [...]} structure
        const reviewsList = data.reviews ?? []
        setReviews(reviewsList.map((review) => review.review_text))
      } catch (fetchError: unknown) {
        if (fetchError instanceof Error) {
          if (fetchError.name !== "AbortError") {
            reviewsErrorHandler.setError(fetchError, 'Failed to fetch reviews')
          }
        } else {
          reviewsErrorHandler.setError(new Error('Unknown error fetching reviews'), 'Failed to fetch reviews')
        }
      }
    }

    fetchReviews()

    return () => {
      controller.abort()
    }
  }, [anime, reviewsErrorHandler])

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
            detailsErrorState.setError(fetchError, 'Failed to fetch extra details')
            setDetailsError("Unable to load extra details right now.")
          }
        } else {
          detailsErrorState.setError(new Error('Unknown error fetching details'), 'Failed to fetch extra details')
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
  }, [anime, detailsErrorState])

  if (loading) {
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
      {mainError.error.hasError && (
        <ErrorMessage
          error={mainError.error}
          onRetry={() => mainError.retry(() => window.location.reload())}
        />
      )}

      <Card className="overflow-hidden border border-border/60 bg-card/80 shadow-sm">
        <CardContent className="flex flex-col gap-6 px-4 py-6 md:flex-row md:items-start md:gap-8">
          <AnimeDetailHeader anime={anime} />

          <AnimeDetailStats stats={stats} />
        </CardContent>
      </Card>

      <section className="space-y-4" id="recommendations">
        <SectionHeader
          title="Recommendations"
          description="Similar shows based on description, genres, demographics, and themes."
        />
        {recommendationsError.error.hasError ? (
          <ErrorMessage
            error={recommendationsError.error}
            onRetry={() => recommendationsError.retry()}
          />
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

      <AnimeDetailExtraDetails
        details={details}
        detailsLoading={detailsLoading}
        detailsError={detailsError}
      />

      <AnimeDetailReviews reviews={reviews} />
    </div>
  )
}
