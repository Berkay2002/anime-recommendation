import type { getAnime } from '@/services/animeService'

export type GetAnimeResult = Awaited<ReturnType<typeof getAnime>>
export type AnimeListItem = GetAnimeResult['anime'][number]
