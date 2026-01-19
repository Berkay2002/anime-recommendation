import { useEffect, useState } from "react"
import { clientLogger } from "@/lib/client-logger"
import { useLoadingState } from "@/hooks/useLoadingState"

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

interface SimilarityResult {
  anime_id: number
  similarity: number
}

interface UseRecommendationsProps {
  selectedAnimeIds: number[]
}

export function useRecommendations({
  selectedAnimeIds,
}: UseRecommendationsProps) {
  const [recommendedAnime, setRecommendedAnime] = useState<Anime[]>([])
  const [allAnime, setAllAnime] = useState<Anime[]>([])
  const { isLoading, setIsLoading } = useLoadingState()
  const [error, setError] = useState<string | null>(null)
  const [worker, setWorker] = useState<Worker | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let isMounted = true

    async function fetchAllAnime() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(
          "/api/anime?withEmbeddings=true&limit=657&sortBy=Popularity",
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error(
            `Failed to fetch anime features: ${response.status} ${response.statusText}`
          )
        }

        const data = await response.json()

        if (!data || !Array.isArray(data.anime) || data.anime.length === 0) {
          throw new Error("No anime data received from API")
        }

        clientLogger.debug('[useRecommendations] Fetched anime count:', data.anime.length)
        clientLogger.debug('[useRecommendations] First anime sample:', {
          anime_id: data.anime[0]?.anime_id,
          title: data.anime[0]?.title,
          has_bert_description: !!data.anime[0]?.bert_description,
          bert_description_type: typeof data.anime[0]?.bert_description,
          bert_description_length: data.anime[0]?.bert_description?.length
        })

        if (isMounted) {
          setAllAnime(data.anime)
          setError(null)
        }
      } catch (err) {
        if (controller.signal.aborted) {
          // Ignore aborted requests triggered by client-side navigation
          return
        }

        clientLogger.error("Failed to fetch anime features:", err)
        if (isMounted) {
          if (err instanceof Error) {
            setError(err.message)
          } else {
            setError("An unknown error occurred while fetching anime features.")
          }
          setAllAnime([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchAllAnime()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [])

  useEffect(() => {
    if (!selectedAnimeIds.length) {
      setRecommendedAnime([])
      setError(null)
      setIsLoading(false)
      return
    }

    if (!allAnime.length) {
      setIsLoading(true)
      return
    }

    const selectedAnimeList = allAnime.filter((anime) =>
      selectedAnimeIds.includes(anime.anime_id)
    )

    if (!selectedAnimeList.length) {
      setRecommendedAnime([])
      setIsLoading(false)
      return
    }

    const newWorker = new Worker("/worker.js")
    setWorker(newWorker)
    setError(null)
    setIsLoading(true)

    newWorker.postMessage({
      selectedEmbeddings: selectedAnimeList.map((anime) => ({
        bert_description: anime.bert_description,
        bert_genres: anime.bert_genres,
        bert_demographic: anime.bert_demographic,
        bert_rating: anime.bert_rating,
        bert_themes: anime.bert_themes,
      })),
      allEmbeddings: allAnime,
      selectedTitles: selectedAnimeList.map((anime) => anime.title),
      selectedAnimeIds,
    })

    newWorker.onmessage = (event: MessageEvent<SimilarityResult[]>) => {
      const similarities = event.data || []
      const recommendations = similarities
        .slice(0, 30)
        .map((similarity) =>
          allAnime.find((anime) => anime.anime_id === similarity.anime_id)
        )
        .filter(Boolean) as Anime[]

      setRecommendedAnime(recommendations)
      setError(null)
      setIsLoading(false)
      setWorker(null)
      newWorker.terminate()
    }

    newWorker.onerror = (workerError) => {
      clientLogger.error("Recommendation worker error:", workerError)
      setError("Failed to generate recommendations")
      setRecommendedAnime([])
      setIsLoading(false)
      setWorker(null)
      newWorker.terminate()
    }

    return () => {
      newWorker.terminate()
    }
  }, [selectedAnimeIds, allAnime])

  const cancelRecommendations = () => {
    if (worker) {
      worker.terminate()
      setWorker(null)
      setIsLoading(false)
      setRecommendedAnime([])
    }
  }

  return { recommendedAnime, isLoading, error, cancelRecommendations }
}
