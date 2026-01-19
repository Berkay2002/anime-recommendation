import { useQuery } from '@tanstack/react-query'
import { clientLogger } from '@/lib/client-logger'

// Type definitions (matching existing interfaces)
export interface Anime {
  anime_id: number
  title: string
  image_url?: string
  Genres?: string[]
  Score?: number
  Description?: string
  Rank?: number
  popularity?: number
  demographic?: string
  rating?: string
  // BERT embedding fields (when withEmbeddings=true)
  bert_description?: number[]
  bert_genres?: number[]
  bert_demographic?: number[]
  bert_rating?: number[]
  bert_themes?: number[]
}

export interface AnimeListResponse {
  anime: Anime[]
  totalPages: number
  currentPage: number
}

export interface Recommendation {
  anime_id: number
  title: string
  image_url?: string
  score?: number
  popularity?: number
  genres?: string[]
  similarity: number
}

export interface Review {
  review_text: string
}

// Query key factory (type-safe query keys)
export const animeKeys = {
  all: ['anime'] as const,
  lists: () => [...animeKeys.all, 'list'] as const,
  list: (filters: { sortBy?: string; genres?: string[]; page?: number; limit?: number }) =>
    [...animeKeys.lists(), filters] as const,
  details: () => [...animeKeys.all, 'detail'] as const,
  detail: (id: number) => [...animeKeys.details(), id] as const,
  recommendations: (id: number) => ['anime', id, 'recommendations'] as const,
  reviews: (id: number) => ['anime', id, 'reviews'] as const,
  search: (query: string) => ['anime', 'search', query] as const,
  allWithEmbeddings: () => ['anime', 'all', 'embeddings'] as const,
}

// Fetcher functions
async function fetchAnimeList(params: {
  sortBy?: string
  genres?: string[]
  page?: number
  limit?: number
}): Promise<AnimeListResponse> {
  const queryParams = new URLSearchParams()
  if (params.sortBy) queryParams.set('sortBy', params.sortBy)
  if (params.genres && params.genres.length > 0) {
    queryParams.set('genres', params.genres.join(','))
  }
  if (params.page) queryParams.set('page', params.page.toString())
  if (params.limit) queryParams.set('limit', params.limit.toString())

  const response = await fetch(`/api/anime?${queryParams.toString()}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch anime: ${response.status}`)
  }
  return response.json()
}

async function fetchAnimeDetail(id: number): Promise<Anime[]> {
  const response = await fetch(`/api/anime?limit=1000`)
  if (!response.ok) {
    throw new Error(`Failed to fetch anime: ${response.status}`)
  }
  const payload = await response.json()
  const animeList: Anime[] = payload.anime || []
  return animeList.filter((item) => item.anime_id === id)
}

async function fetchRecommendations(id: number): Promise<{ similar_anime?: Recommendation[] }> {
  const response = await fetch(`/api/anime/recommendation/${id}`)
  if (!response.ok) {
    if (response.status === 404) {
      clientLogger.debug({ animeId: id }, 'No recommendations found for this anime')
      return { similar_anime: [] }
    }
    throw new Error(`Failed to fetch recommendations: ${response.status}`)
  }
  return response.json()
}

async function fetchReviews(id: number): Promise<{ reviews?: Review[] }> {
  const response = await fetch(`/api/anime/reviews/${id}`)
  if (!response.ok) {
    if (response.status === 404) {
      clientLogger.debug({ animeId: id }, 'No reviews found for this anime')
      return { reviews: [] }
    }
    throw new Error(`Failed to fetch reviews: ${response.status}`)
  }
  return response.json()
}

async function fetchAnimeSearch(query: string): Promise<Anime[]> {
  if (!query.trim()) return []
  const response = await fetch(`/api/anime/search?q=${encodeURIComponent(query)}`)
  if (!response.ok) {
    throw new Error(`Failed to search anime: ${response.status}`)
  }
  const data = await response.json()
  return data.anime || []
}

async function fetchAllAnimeWithEmbeddings(): Promise<Anime[]> {
  const response = await fetch('/api/anime?withEmbeddings=true&limit=657&sortBy=Popularity')
  if (!response.ok) {
    throw new Error(`Failed to fetch anime with embeddings: ${response.status}`)
  }
  const data = await response.json()
  return data.anime || []
}

// Query hooks
export function useAnimeList(params: {
  sortBy?: string
  genres?: string[]
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: animeKeys.list(params),
    queryFn: () => fetchAnimeList(params),
    staleTime: 2 * 60 * 1000, // 2 minutes for browse results (CONTEXT.md decision)
  })
}

export function useAnimeDetail(id: number) {
  return useQuery({
    queryKey: animeKeys.detail(id),
    queryFn: () => fetchAnimeDetail(id),
    enabled: !!id, // Only run query if id is provided
    staleTime: 5 * 60 * 1000, // 5 minutes for anime details (CONTEXT.md decision)
  })
}

export function useRecommendations(id: number) {
  return useQuery({
    queryKey: animeKeys.recommendations(id),
    queryFn: () => fetchRecommendations(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useReviews(id: number) {
  return useQuery({
    queryKey: animeKeys.reviews(id),
    queryFn: () => fetchReviews(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useAnimeSearch(query: string) {
  return useQuery({
    queryKey: animeKeys.search(query),
    queryFn: () => fetchAnimeSearch(query),
    enabled: query.trim().length > 0, // Only run if query is not empty
    staleTime: 1 * 60 * 1000, // 1 minute for search results (CONTEXT.md decision)
  })
}

export function useAllAnimeWithEmbeddings() {
  return useQuery({
    queryKey: animeKeys.allWithEmbeddings(),
    queryFn: fetchAllAnimeWithEmbeddings,
    staleTime: 10 * 60 * 1000, // 10 minutes for full anime list with embeddings
  })
}
