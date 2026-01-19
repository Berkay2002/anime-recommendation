import logger from '@/lib/logger';
import { retryWithBackoff } from '@/lib/retry';

const ANILIST_ENDPOINT = "https://graphql.anilist.co"

const anilistLogger = logger.child({ service: 'AniListService' });

const MEDIA_QUERY = `
  query ($idMal: Int, $search: String) {
    Media(idMal: $idMal, search: $search, type: ANIME) {
      bannerImage
      coverImage {
        extraLarge
        large
      }
    }
  }
`

interface AniListMediaResponse {
  data?: {
    Media?: {
      bannerImage?: string | null
      coverImage?: {
        extraLarge?: string | null
        large?: string | null
      } | null
    } | null
  }
  errors?: Array<{ message?: string }>
}

interface AniListImageResult {
  bannerImage: string | null
  coverImage: string | null
}

interface AniListLookupParams {
  malId?: number | null
  search?: string | null
}

export async function getAniListImages({
  malId,
  search,
}: AniListLookupParams): Promise<AniListImageResult> {
  if (!malId && !search) {
    return { bannerImage: null, coverImage: null }
  }

  try {
    const response = await retryWithBackoff(async () => {
      return await fetch(ANILIST_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: MEDIA_QUERY,
          variables: {
            idMal: malId ?? undefined,
            search: search ?? undefined,
          },
        }),
      })
    }, {
      maxRetries: 3,
      onRetry: (attempt, error, delay) => {
        anilistLogger.debug({ attempt, error, delay, malId, search }, 'Retrying AniList API call');
      }
    });

    if (!response.ok) {
      return { bannerImage: null, coverImage: null }
    }

    const payload = (await response.json()) as AniListMediaResponse
    const media = payload?.data?.Media
    const coverImage =
      media?.coverImage?.extraLarge || media?.coverImage?.large || null

    return {
      bannerImage: media?.bannerImage ?? null,
      coverImage,
    }
  } catch (error) {
    anilistLogger.error({ error, malId, search }, 'Failed to fetch AniList images');
    return { bannerImage: null, coverImage: null }
  }
}
