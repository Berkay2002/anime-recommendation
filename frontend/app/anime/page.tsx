"use client"

import { useCallback, useEffect, useState } from "react"

import AnimeBrowseHeader from "@/components/AnimeBrowseHeader"
import AnimeBrowseFilters from "@/components/AnimeBrowseFilters"
import AnimeBrowseGrid from "@/components/AnimeBrowseGrid"
import AnimeBrowsePagination from "@/components/AnimeBrowsePagination"
import AnimeBrowseActiveFilters from "@/components/AnimeBrowseActiveFilters"
import { useDebounce } from "@/hooks/useDebounce"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { clientLogger } from "@/lib/client-logger"

type GenreOption = "Action" | "Adventure" | "Comedy" | "Drama" | "Fantasy" | "Horror" | "Romance" | "Sci-Fi"

type SortOption = "Popularity" | "Score" | "Rank"

interface Anime {
  anime_id: number
  title: string
  image_url?: string
  Genres?: string[]
  Score?: number
  Description?: string
  Rank?: number
}

interface ApiResponse {
  anime: Anime[]
  totalPages: number
  currentPage: number
}


const AnimePage: React.FC = () => {
  const [animeList, setAnimeList] = useState<Anime[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGenres, setSelectedGenres] = useLocalStorage<GenreOption[]>(
    "selectedGenres",
    []
  )
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [sortBy, setSortBy] = useLocalStorage<SortOption>(
    "sortBy",
    "Popularity"
  )

  const debouncedSelectedGenres = useDebounce(selectedGenres, 300)
  const debouncedSortBy = useDebounce(sortBy, 300)

  useEffect(() => {
    const fetchAnime = (
      page: number,
      sortByValue: SortOption,
      genres: GenreOption[]
    ) => {
      setLoading(true)
      let apiUrl = `/api/anime?limit=50&page=${page}&sortBy=${sortByValue}`
      if (genres.length > 0) {
        apiUrl += `&genres=${genres.join(",")}`
      }

      fetch(apiUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          return response.json()
        })
        .then((data: ApiResponse) => {
          setAnimeList(data.anime)
          setTotalPages(data.totalPages)
          setCurrentPage(data.currentPage)
          setLoading(false)
          setIsInitialLoad((prev) => (prev ? false : prev))
        })
        .catch((fetchError: Error) => {
          clientLogger.error("Error fetching anime list:", fetchError)
          setError(
            `Failed to load anime list. Please try again later. (${fetchError.message})`
          )
          setLoading(false)
        })
    }
    fetchAnime(currentPage, debouncedSortBy, debouncedSelectedGenres)
  }, [currentPage, debouncedSortBy, debouncedSelectedGenres])

  const toggleGenre = useCallback(
    (genre: GenreOption) => {
      setSelectedGenres((prev) =>
        prev.includes(genre)
          ? prev.filter((g) => g !== genre)
          : [...prev, genre]
      )
    },
    [setSelectedGenres]
  )

  const removeGenre = useCallback(
    (genre: GenreOption) => {
      setSelectedGenres((prev) => prev.filter((g) => g !== genre))
    },
    [setSelectedGenres]
  )

  return (
    <div className="container mx-auto flex flex-col gap-6 px-4 py-6 sm:px-6 lg:gap-8 lg:py-8">
      <AnimeBrowseHeader loading={loading} isInitialLoad={isInitialLoad} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <AnimeBrowseFilters
          sortBy={sortBy}
          onSortChange={setSortBy}
          selectedGenres={selectedGenres}
          onGenreToggle={toggleGenre}
          onGenreRemove={removeGenre}
          onClearGenres={() => setSelectedGenres([])}
          loading={loading}
          isInitialLoad={isInitialLoad}
        />
      </div>

      <AnimeBrowseActiveFilters
        selectedGenres={selectedGenres}
        loading={loading}
        onRemoveGenre={removeGenre}
        onClearGenres={() => setSelectedGenres([])}
      />

      <AnimeBrowseGrid
        animeList={animeList}
        loading={loading}
        isInitialLoad={isInitialLoad}
        error={error}
      />

      {!loading && !error && totalPages > 1 && (
        <AnimeBrowsePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}

export default AnimePage
