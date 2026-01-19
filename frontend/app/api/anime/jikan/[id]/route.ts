import { NextResponse } from "next/server"
import logger from "@/lib/logger"

export const runtime = "nodejs"

const JIKAN_BASE_URL = "https://api.jikan.moe/v4"

interface JikanVoiceActor {
  person?: {
    name?: string
  }
  language?: string
}

interface JikanCharacterItem {
  character?: {
    name?: string
    images?: {
      jpg?: {
        image_url?: string
      }
      webp?: {
        image_url?: string
      }
    }
  }
  role?: string
  voice_actors?: JikanVoiceActor[]
}

interface JikanCharactersResponse {
  data?: JikanCharacterItem[]
}

interface JikanStaffItem {
  person?: {
    name?: string
    images?: {
      jpg?: {
        image_url?: string
      }
      webp?: {
        image_url?: string
      }
    }
  }
  positions?: string[]
}

interface JikanStaffResponse {
  data?: JikanStaffItem[]
}

interface JikanStatisticsData {
  watching?: number
  completed?: number
  on_hold?: number
  dropped?: number
  plan_to_watch?: number
  total?: number
}

interface JikanStatisticsResponse {
  data?: JikanStatisticsData
}

type JikanCharacter = {
  name: string
  role: string
  voiceActors: { name: string; language: string }[]
  imageUrl?: string | null
}

type JikanStaff = {
  name: string
  positions: string[]
  imageUrl?: string | null
}

type JikanStatistic = {
  label: string
  value: number
}

async function fetchJikan<T>(path: string): Promise<T> {
  const response = await fetch(`${JIKAN_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    throw new Error(`Jikan request failed: ${response.status}`)
  }

  return (await response.json()) as T
}

function normalizeCharacters(payload: JikanCharactersResponse): JikanCharacter[] {
  const items = payload.data ?? []
  return items.map((item) => {
    const voiceActors = item.voice_actors ?? []
    const japaneseActor = voiceActors.find(
      (actor) => actor.language?.toLowerCase() === "japanese"
    )
    const englishActor = voiceActors.find(
      (actor) => actor.language?.toLowerCase() === "english"
    )
    const normalizedVoiceActors = [
      japaneseActor
        ? {
            name: japaneseActor.person?.name || "Unknown",
            language: "Japanese",
          }
        : null,
      englishActor
        ? {
            name: englishActor.person?.name || "Unknown",
            language: "English",
          }
        : null,
    ].filter(Boolean) as { name: string; language: string }[]

    return {
      name: item.character?.name || "Unknown",
      role: item.role || "Unknown",
      voiceActors: normalizedVoiceActors,
      imageUrl:
        item.character?.images?.jpg?.image_url ||
        item.character?.images?.webp?.image_url ||
        null,
    }
  })
}

function normalizeStaff(payload: JikanStaffResponse): JikanStaff[] {
  const items = payload.data ?? []
  return items.map((item) => ({
    name: item.person?.name || "Unknown",
    positions: item.positions ?? [],
    imageUrl:
      item.person?.images?.jpg?.image_url ||
      item.person?.images?.webp?.image_url ||
      null,
  }))
}

function normalizeStatistics(payload: JikanStatisticsResponse): JikanStatistic[] {
  const stats = payload.data
  if (!stats) return []

  const metrics = [
    { label: "Watching", value: stats.watching },
    { label: "Completed", value: stats.completed },
    { label: "On hold", value: stats.on_hold },
    { label: "Dropped", value: stats.dropped },
    { label: "Plan to watch", value: stats.plan_to_watch },
    { label: "Total", value: stats.total },
  ]

  return metrics
    .filter((metric) => metric.value !== null && metric.value !== undefined)
    .map((metric) => ({
      label: metric.label,
      value: Number(metric.value),
    }))
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params
  const numericId = Number(id)
  const log = logger.child({ route: '/api/anime/jikan/[id]', method: 'GET', animeId: id })

  try {
    log.debug({ animeId: id }, 'Fetching Jikan anime details')

    if (Number.isNaN(numericId)) {
      log.warn({ animeId: id }, 'Invalid anime ID format')
      return NextResponse.json(
        { message: "Invalid anime ID format" },
        { status: 400 }
      )
    }

    const [charactersResult, staffResult, statsResult] = await Promise.allSettled([
      fetchJikan<JikanCharactersResponse>(`/anime/${numericId}/characters`),
      fetchJikan<JikanStaffResponse>(`/anime/${numericId}/staff`),
      fetchJikan<JikanStatisticsResponse>(`/anime/${numericId}/statistics`),
    ])

    if (
      charactersResult.status === "rejected" &&
      staffResult.status === "rejected" &&
      statsResult.status === "rejected"
    ) {
      log.warn({ animeId: numericId }, 'All Jikan API calls failed')
      return NextResponse.json(
        { message: `Failed to fetch details for anime_id: ${numericId}` },
        { status: 502 }
      )
    }

    const characters =
      charactersResult.status === "fulfilled"
        ? normalizeCharacters(charactersResult.value)
        : []
    const staff =
      staffResult.status === "fulfilled"
        ? normalizeStaff(staffResult.value)
        : []
    const statistics =
      statsResult.status === "fulfilled"
        ? normalizeStatistics(statsResult.value)
        : []

    log.info({ animeId: numericId, charactersCount: characters.length, staffCount: staff.length }, 'Successfully fetched Jikan anime details')

    return NextResponse.json(
      {
        characters,
        staff,
        statistics,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
        },
      }
    )
  } catch (error) {
    log.error({ error, animeId: numericId }, "Failed to fetch Jikan anime details")
    return NextResponse.json(
      { message: "Failed to fetch anime details" },
      { status: 500 }
    )
  }
}
