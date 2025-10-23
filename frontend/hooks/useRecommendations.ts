import { useEffect, useState } from "react"

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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let isMounted = true

    async function fetchAllAnime() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(
          "/api/anime/features?limit=657&sortBy=Popularity",
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error(
            `Failed to fetch anime features: ${response.status} ${response.statusText}`
          )
        }

        const data: Anime[] = await response.json()

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No anime data received from API")
        }

        if (isMounted) {
          setAllAnime(data)
          setError(null)
        }
      } catch (err: any) {
        if (controller.signal.aborted) {
          // Ignore aborted requests triggered by client-side navigation
          return
        }

        console.error("Failed to fetch anime features:", err)
        if (isMounted) {
          setError(err?.message || "Unknown error occurred")
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
      return
    }

    if (!allAnime.length) {
      return
    }

    const selectedAnimeList = allAnime.filter((anime) =>
      selectedAnimeIds.includes(anime.anime_id)
    )

    if (!selectedAnimeList.length) {
      setRecommendedAnime([])
      return
    }

    const worker = new Worker("/worker.js")
    setError(null)

    worker.postMessage({
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

    worker.onmessage = (event: MessageEvent<SimilarityResult[]>) => {
      const similarities = event.data || []
      const recommendations = similarities
        .slice(0, 30)
        .map((similarity) =>
          allAnime.find((anime) => anime.anime_id === similarity.anime_id)
        )
        .filter(Boolean) as Anime[]

      setRecommendedAnime(recommendations)
      setError(null)
      worker.terminate()
    }

    worker.onerror = (workerError) => {
      console.error("Recommendation worker error:", workerError)
      setError("Failed to generate recommendations")
      setRecommendedAnime([])
      worker.terminate()
    }

    return () => {
      worker.terminate()
    }
  }, [selectedAnimeIds, allAnime])

  return { recommendedAnime, isLoading, error }
}
