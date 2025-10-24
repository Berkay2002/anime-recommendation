"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

import RecommendationList from "@/components/RecommendationList"
import ReviewCard from "@/components/ReviewCard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchAnimeWithCache, DEFAULT_ANIME_LIMIT } from "@/lib/animeCache"

interface Anime {
  anime_id: number
  title: string
  image_url?: string
  Description?: string
  Score?: number
  Rank?: number
  Popularity?: number
  Genres?: string[]
  Demographic?: string
  Rating?: string
  bert_description: number[]
  bert_genres: number[]
  bert_demographic: number[]
  bert_rating: number[]
  bert_themes: number[]
}

interface Recommendation {
  anime_id: number
  title: string
  similarity: number
}

const skeletonPlaceholders = Array.from({ length: 3 })
const statSkeletonPlaceholders = Array.from({ length: 5 })

export default function AnimeDetailPage() {
  const { id } = useParams()
  const numericId = Number(id)

  const [anime, setAnime] = useState<Anime | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [reviews, setReviews] = useState<string[]>([])
  const [generalFeatures, setGeneralFeatures] = useState<Anime[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const REVIEWS_PER_PAGE = 3

  const recommendedAnime = useMemo(() => {
    if (!recommendations.length || !generalFeatures.length) {
      return []
    }
    const featureMap = new Map(
      generalFeatures.map((item) => [item.anime_id, item])
    )
    return recommendations
      .map((rec) => featureMap.get(rec.anime_id))
      .filter(Boolean) as Anime[]
  }, [generalFeatures, recommendations])

  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE
    const endIndex = startIndex + REVIEWS_PER_PAGE
    return reviews.slice(startIndex, endIndex)
  }, [reviews, currentPage, REVIEWS_PER_PAGE])

  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE)

  useEffect(() => {
    async function fetchGeneralFeatures() {
      let metadataLoaded = false

      try {
        const metadataResponse = await fetch(
          `/api/anime?limit=${DEFAULT_ANIME_LIMIT}`
        )

        if (!metadataResponse.ok) {
          throw new Error(`Failed to fetch metadata: ${metadataResponse.status}`)
        }

        const metadataPayload = await metadataResponse.json()
        const metadataList: Anime[] = metadataPayload.anime || []

        const selectedAnime = metadataList.find(
          (item) => item.anime_id === numericId
        )
        if (selectedAnime) {
          setAnime(selectedAnime)
          metadataLoaded = true
        }

        setLoading(false)

        try {
          const featuresData = await fetchAnimeWithCache()
          setGeneralFeatures(featuresData)

          const selectedWithEmbeddings = featuresData.find(
            (item) => item.anime_id === numericId
          )
          if (selectedWithEmbeddings) {
            setAnime(selectedWithEmbeddings)
          }
        } catch (embeddingError) {
          console.error(
            "Error fetching embeddings (recommendations will be unavailable):",
            embeddingError
          )
        }
      } catch (metadataError) {
        console.error("Error fetching anime metadata:", metadataError)
        if (!metadataLoaded) {
          setLoading(false)
        }
      }
    }

    fetchGeneralFeatures()
  }, [numericId])

  useEffect(() => {
    if (anime && generalFeatures.length > 0) {
      const worker = new Worker("/worker.js")

      worker.postMessage({
        selectedEmbeddings: [anime],
        allEmbeddings: generalFeatures,
        selectedTitles: [anime.title],
        selectedAnimeIds: [anime.anime_id],
        weights: {
          bert_description: 0.4,
          bert_genres: 0.35,
          bert_demographic: 0.15,
          bert_themes: 0.1,
        },
      })

      worker.onmessage = (event) => {
        setRecommendations(event.data)
        worker.terminate()
      }

      worker.onerror = (workerError) => {
        console.error("Worker error:", workerError)
        worker.terminate()
      }

      return () => worker.terminate()
    }
  }, [anime, generalFeatures])

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    async function fetchReviews() {
      try {
        const response = await fetch(`/api/anime/reviews/${id}`, { signal })
        if (!response.ok) {
          throw new Error(`Failed to fetch reviews: ${response.statusText}`)
        }
        const data = await response.json()
        setReviews(data.reviews || [])
        setCurrentPage(1) // Reset to first page when new reviews load
      } catch (reviewsError: any) {
        if (reviewsError.name === "AbortError") {
          console.debug("Reviews fetch aborted")
        } else {
          console.error("Error fetching reviews:", reviewsError)
        }
      }
    }

    fetchReviews()

    return () => {
      controller.abort()
    }
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto flex flex-col gap-6 px-6 py-8">
        <Card className="overflow-hidden border border-border/60 bg-card/80 shadow-sm">
          <CardContent className="flex flex-col gap-6 px-4 py-6 md:flex-row md:items-start md:gap-8">
            <div className="relative aspect-[2/3] w-full max-w-[450px] shrink-0 overflow-hidden rounded-2xl border border-border/40 bg-muted shadow-lg">
              <Skeleton className="h-full w-full" />
            </div>

            <div className="flex flex-1 flex-col gap-6">
              <div className="space-y-3">
                <Skeleton className="h-9 w-60" />
                <div className="flex flex-wrap items-center gap-2">
                  {skeletonPlaceholders.map((_, index) => (
                    <Skeleton
                      key={`genre-skeleton-${index}`}
                      className="h-7 w-24 rounded-full"
                    />
                  ))}
                </div>
              </div>

              <Skeleton className="h-24 w-full" />

              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {statSkeletonPlaceholders.map((_, index) => (
                  <div
                    key={`stat-skeleton-${index}`}
                    className="rounded-2xl border border-border/50 bg-background/60 p-4"
                  >
                    <Skeleton className="mb-2 h-4 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </dl>

              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-10 w-36 rounded-full" />
                <Skeleton className="h-10 w-36 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div className="space-y-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {skeletonPlaceholders.map((_, index) => (
              <Card
                key={`recommendation-skeleton-${index}`}
                className="border border-border/60 bg-card/80 shadow-sm"
              >
                <CardContent className="flex flex-col gap-3 px-4 py-4">
                  <Skeleton className="h-6 w-44" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="grid gap-4">
            {skeletonPlaceholders.map((_, index) => (
              <Card
                key={`review-skeleton-${index}`}
                className="border border-border/60 bg-card/80 shadow-sm"
              >
                <CardContent className="px-4 py-4">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    )
  }

  if (!anime) {
    return (
      <div className="container mx-auto px-6 py-8">
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
    { label: "Score", value: anime.Score ?? "N/A" },
    { label: "Rank", value: anime.Rank ?? "N/A" },
    { label: "Popularity", value: anime.Popularity ?? "N/A" },
    { label: "Demographic", value: anime.Demographic ?? "N/A" },
    { label: "Rating", value: anime.Rating ?? "N/A" },
  ]

  return (
    <div className="container mx-auto flex flex-col gap-10 px-6 py-8">
      <Card className="overflow-hidden border border-border/60 bg-card/80 shadow-sm">
        <CardContent className="flex flex-col gap-6 px-4 py-6 md:flex-row md:items-start md:gap-8">
          <div className="relative aspect-[2/3] w-full max-w-[450px] shrink-0 overflow-hidden rounded-2xl border border-border/40 bg-muted shadow-lg">
            <Image
              src={anime.image_url || "/placeholder.jpg"}
              alt={anime.title || "Anime artwork"}
              fill
              sizes="(max-width: 768px) 100vw, 450px"
              className="object-cover"
              priority
            />
          </div>

          <div className="flex flex-1 flex-col gap-6">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground">
                {anime.title || "Unknown Title"}
              </h1>
              {anime.Genres?.length ? (
                <div className="flex flex-wrap items-center gap-2">
                  {anime.Genres.map((genre) => (
                    <Badge
                      key={`${anime.anime_id}-${genre}`}
                      variant="outline"
                      className="rounded-full"
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>

            <p className="text-base leading-relaxed text-muted-foreground">
              {anime.Description || "No description available for this title."}
            </p>

            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border/50 bg-background/60 p-4"
                >
                  <dt className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {stat.label}
                  </dt>
                  <dd className="text-lg font-semibold text-foreground">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>

            <ButtonRow animeId={anime.anime_id} />
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4" id="recommendations">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Recommendations
          </h2>
          <p className="text-sm text-muted-foreground">
            Similar shows based on description, genres, demographics, and
            themes.
          </p>
        </div>
        {recommendedAnime.length ? (
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

      <section className="space-y-6" id="reviews">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Reviews
            {reviews.length > 0 && (
              <span className="ml-3 text-base font-normal text-muted-foreground">
                ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </span>
            )}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            What fans are saying about this anime.
          </p>
        </div>
        {reviews.length ? (
          <>
            <div className="grid gap-5">
              {paginatedReviews.map((review, index) => (
                <ReviewCard
                  key={`review-${(currentPage - 1) * REVIEWS_PER_PAGE + index}`}
                  review={review}
                  index={(currentPage - 1) * REVIEWS_PER_PAGE + index}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="gap-1.5"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="gap-1.5"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <Alert>
            <AlertTitle>No reviews available</AlertTitle>
            <AlertDescription>
              Be the first to share your thoughts on this title.
            </AlertDescription>
          </Alert>
        )}
      </section>
    </div>
  )
}

function ButtonRow({ animeId }: { animeId: number }) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild>
        <Link href={`/anime/${animeId}`}>View full details</Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="#reviews">Jump to reviews</Link>
      </Button>
    </div>
  )
}
