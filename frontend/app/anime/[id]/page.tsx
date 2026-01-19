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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

interface JikanCharacter {
  name: string
  role: string
  voiceActors: string[]
}

interface JikanStaff {
  name: string
  positions: string[]
}

interface JikanStatistic {
  label: string
  value: number
}

interface JikanDetails {
  characters: JikanCharacter[]
  staff: JikanStaff[]
  statistics: JikanStatistic[]
}

const skeletonPlaceholders = Array.from({ length: 3 })
const statSkeletonPlaceholders = Array.from({ length: 5 })
const detailSkeletonPlaceholders = Array.from({ length: 6 })

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
  const [currentPage, setCurrentPage] = useState<number>(1)

  const REVIEWS_PER_PAGE = 3

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

  const paginatedReviews = useMemo(() => {
    const startIndex = (currentPage - 1) * REVIEWS_PER_PAGE
    const endIndex = startIndex + REVIEWS_PER_PAGE
    return reviews.slice(startIndex, endIndex)
  }, [reviews, currentPage, REVIEWS_PER_PAGE])

  const totalPages = Math.ceil(reviews.length / REVIEWS_PER_PAGE)
  const detailsSkeleton = (
    <div className="space-y-3">
      {detailSkeletonPlaceholders.map((_, index) => (
        <Skeleton
          key={`detail-skeleton-${index}`}
          className="h-8 w-full"
        />
      ))}
    </div>
  )

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
        clientLogger.error("Error fetching anime:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnimeDetails()
  }, [numericId])

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
          clientLogger.error('Error fetching recommendations:', error)
        }
      }
    }

    fetchRecommendations()

    return () => controller.abort()
  }, [anime])

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
        setCurrentPage(1) // Reset to first page when new reviews load
      } catch (reviewsError: unknown) {
        if (reviewsError instanceof Error) {
          if (reviewsError.name !== "AbortError") {
            clientLogger.error("Error fetching reviews:", reviewsError)
          }
        } else {
          clientLogger.error("An unknown error occurred:", reviewsError)
        }
      }
    }

    fetchReviews()

    return () => {
      controller.abort()
    }
  }, [anime])

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
      } catch (detailsError: unknown) {
        if (detailsError instanceof Error) {
          if (detailsError.name !== "AbortError") {
            clientLogger.error("Error fetching details:", detailsError)
            setDetailsError("Unable to load extra details right now.")
          }
        } else {
          clientLogger.error("An unknown error occurred:", detailsError)
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
  }, [anime])

  if (loading) {
    return (
      <div className="container mx-auto flex flex-col gap-6 px-4 py-6 sm:px-6 lg:gap-8 lg:py-8">
        <Card className="overflow-hidden border border-border/60 bg-card/80 shadow-sm">
          <CardContent className="flex flex-col gap-6 px-4 py-6 md:flex-row md:items-start md:gap-8">
            <div className="relative aspect-2/3 w-full max-w-[450px] shrink-0 overflow-hidden rounded-2xl border border-border/40 bg-muted shadow-lg">
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
      <Card className="overflow-hidden border border-border/60 bg-card/80 shadow-sm">
        <CardContent className="flex flex-col gap-6 px-4 py-6 md:flex-row md:items-start md:gap-8">
          <div className="relative aspect-2/3 w-full max-w-[450px] shrink-0 overflow-hidden rounded-2xl border border-border/40 bg-muted shadow-lg">
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
              {(anime.genres || anime.Genres)?.length ? (
                <div className="flex flex-wrap items-center gap-2">
                  {(anime.genres || anime.Genres)?.map((genre) => (
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
              {anime.description || anime.Description || "No description available for this title."}
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

      <section className="space-y-4" id="details">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Extra details
          </h2>
          <p className="text-sm text-muted-foreground">
            Characters, staff, and community stats pulled from Jikan (MAL).
          </p>
        </div>
        <Card className="border border-border/60 bg-card/80 shadow-sm">
          <CardContent className="px-4 py-5 sm:px-6">
            <Tabs defaultValue="characters" className="gap-4">
              <TabsList className="flex flex-wrap gap-2">
                <TabsTrigger value="characters">Characters</TabsTrigger>
                <TabsTrigger value="staff">Staff</TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
              </TabsList>

              <TabsContent value="characters">
                {detailsLoading ? (
                  detailsSkeleton
                ) : detailsError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Details unavailable</AlertTitle>
                    <AlertDescription>{detailsError}</AlertDescription>
                  </Alert>
                ) : details?.characters?.length ? (
                  <div className="rounded-2xl border border-border/60 bg-background/50">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Character</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Voice actors</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {details.characters.slice(0, 12).map((character) => (
                          <TableRow
                            key={`${character.name}-${character.role}`}
                          >
                            <TableCell className="font-medium text-foreground">
                              {character.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {character.role}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {character.voiceActors.length
                                ? character.voiceActors.join(", ")
                                : "TBA"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <Alert>
                    <AlertTitle>No characters found</AlertTitle>
                    <AlertDescription>
                      Jikan did not return any character data for this title.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="staff">
                {detailsLoading ? (
                  detailsSkeleton
                ) : detailsError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Details unavailable</AlertTitle>
                    <AlertDescription>{detailsError}</AlertDescription>
                  </Alert>
                ) : details?.staff?.length ? (
                  <div className="rounded-2xl border border-border/60 bg-background/50">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Staff member</TableHead>
                          <TableHead>Role</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {details.staff.slice(0, 12).map((member) => (
                          <TableRow
                            key={`${member.name}-${member.positions.join("-")}`}
                          >
                            <TableCell className="font-medium text-foreground">
                              {member.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {member.positions.length
                                ? member.positions.join(", ")
                                : "TBA"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <Alert>
                    <AlertTitle>No staff details found</AlertTitle>
                    <AlertDescription>
                      Jikan did not return staff data for this title.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="stats">
                {detailsLoading ? (
                  detailsSkeleton
                ) : detailsError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Details unavailable</AlertTitle>
                    <AlertDescription>{detailsError}</AlertDescription>
                  </Alert>
                ) : details?.statistics?.length ? (
                  <div className="rounded-2xl border border-border/60 bg-background/50">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Metric</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {details.statistics.map((stat) => (
                          <TableRow key={stat.label}>
                            <TableCell className="font-medium text-foreground">
                              {stat.label}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {stat.value.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <Alert>
                    <AlertTitle>No statistics available</AlertTitle>
                    <AlertDescription>
                      Jikan did not return stats for this title.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
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
      <Button asChild className="w-full sm:w-auto">
        <Link href={`/anime/${animeId}`}>View full details</Link>
      </Button>
      <Button asChild variant="outline" className="w-full sm:w-auto">
        <Link href="#reviews">Jump to reviews</Link>
      </Button>
    </div>
  )
}
