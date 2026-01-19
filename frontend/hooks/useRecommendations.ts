import { useEffect, useState } from "react"
import { clientLogger } from "@/lib/client-logger"
import { useLoadingState } from "@/hooks/useLoadingState"
import { useAllAnimeWithEmbeddings } from '@/lib/queries/anime'

interface Anime {
  anime_id: number
  English?: string
  Japanese?: string
  image_url?: string
  title: string
  Description?: string
  // BERT embedding fields
  bert_description?: number[]
  bert_genres?: number[]
  bert_demographic?: number[]
  bert_rating?: number[]
  bert_themes?: number[]
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
  const { data: allAnime = [], isLoading: isAllAnimeLoading, error: allAnimeError } = useAllAnimeWithEmbeddings()
  const { isLoading, setIsLoading } = useLoadingState()
  const [error, setError] = useState<string | null>(null)
  const [worker, setWorker] = useState<Worker | null>(null)

  useEffect(() => {
    if (!selectedAnimeIds.length) {
      setRecommendedAnime([])
      setError(null)
      setIsLoading(false)
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
    // setIsLoading is stable (wrapped in useCallback) and not needed in deps
    // allAnime is stable from React Query, not needed in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAnimeIds])

  const cancelRecommendations = () => {
    if (worker) {
      worker.terminate()
      setWorker(null)
      setIsLoading(false)
      setRecommendedAnime([])
    }
  }

  return {
    recommendedAnime,
    isLoading: isLoading || isAllAnimeLoading,
    error: error || allAnimeError?.message || null,
    cancelRecommendations
  }
}
