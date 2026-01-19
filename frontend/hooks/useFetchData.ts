import { useEffect, useRef, useState } from "react"
import { useLoadingState } from "./useLoadingState"

const cache = new Map<string, unknown>()

export const useFetchData = <T,>(
  url: string
): [T | null, boolean, Error | null] => {
  const [data, setData] = useState<T | null>(null)
  const cacheRef = useRef(cache)
  const { isLoading: loading, setIsLoading } = useLoadingState(150)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!url) {
      setIsLoading(false)
      return
    }

    if (cacheRef.current.has(url)) {
      setData(cacheRef.current.get(url) as T)
      setIsLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        const response = await fetch(url)
        const result = await response.json()
        cacheRef.current.set(url, result)
        setData(result)
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to fetch data")
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [url, setIsLoading])

  return [data, loading, error]
}
