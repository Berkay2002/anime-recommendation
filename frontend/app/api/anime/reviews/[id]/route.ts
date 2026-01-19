import { NextResponse } from "next/server"
import logger from "@/lib/logger"

export const runtime = "nodejs"

const JIKAN_BASE_URL = "https://api.jikan.moe/v4"

interface JikanReviewUser {
  username?: string
}

interface JikanReviewReactions {
  overall?: number
}

interface JikanReviewItem {
  mal_id?: number
  review?: string
  user?: JikanReviewUser
  score?: number
  reactions?: JikanReviewReactions
  date?: string
}

interface JikanReviewResponse {
  data?: JikanReviewItem[]
}

interface NormalizedReview {
  id: number
  review_text: string
  author: string
  score: number | null
  helpful_count: number
  created_at: string | null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const numericId = Number(id)
  const log = logger.child({ route: '/api/anime/reviews/[id]', method: 'GET', animeId: id })

  try {
    log.debug({ animeId: id }, 'Fetching Jikan anime reviews')

    if (Number.isNaN(numericId)) {
      log.warn({ animeId: id }, 'Invalid anime ID format')
      return NextResponse.json(
        { message: "Invalid anime ID format" },
        { status: 400 }
      )
    }

    const url = new URL(`${JIKAN_BASE_URL}/anime/${numericId}/reviews`)
    url.searchParams.set("spoilers", "false")
    url.searchParams.set("preliminary", "false")

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      return NextResponse.json(
        { message: `Failed to fetch reviews for anime_id: ${numericId}` },
        { status: response.status }
      )
    }

    const payload = (await response.json()) as JikanReviewResponse
    const reviewItems = payload.data ?? []

    if (reviewItems.length === 0) {
      return NextResponse.json(
        { message: `Reviews not found for anime_id: ${numericId}` },
        { status: 404 }
      )
    }

    const reviews = reviewItems
      .map((review, index): NormalizedReview => ({
        id: review.mal_id ?? index,
        review_text: review.review || "",
        author: review.user?.username || "Unknown",
        score: review.score ?? null,
        helpful_count: review.reactions?.overall ?? 0,
        created_at: review.date || null,
      }))
      .filter((review) => review.review_text)

    log.info({ animeId: numericId, reviewCount: reviews.length }, 'Successfully fetched Jikan anime reviews')

    return NextResponse.json(
      {
        anime_id: numericId,
        title: "",
        reviews,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
        },
      }
    )
  } catch (error) {
    log.error({ error, animeId: numericId }, "Failed to fetch Jikan anime reviews")
    return NextResponse.json(
      { message: "Failed to fetch reviews" },
      { status: 500 }
    )
  }
}
