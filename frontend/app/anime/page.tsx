"use client"

import { useCallback, useEffect, useState } from "react"
import { X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import AnimeBrowseHeader from "@/components/AnimeBrowseHeader"
import AnimeBrowseFilters from "@/components/AnimeBrowseFilters"
import AnimeBrowseGrid from "@/components/AnimeBrowseGrid"
import AnimeBrowsePagination from "@/components/AnimeBrowsePagination"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebounce } from "@/hooks/useDebounce"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { cn } from "@/lib/utils"
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

const badgeSkeletonPlaceholders = Array.from({ length: 3 })


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

  const hasSelection = selectedGenres.length > 0

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

      {loading ? (
        <div className="flex flex-wrap items-center gap-2">
          {badgeSkeletonPlaceholders.map((_, index) => (
            <Skeleton
              key={`selected-skeleton-${index}`}
              className="h-8 w-24 rounded-full border border-border/40 bg-background/60"
            />
          ))}
        </div>
      ) : hasSelection ? (
        <div className="flex flex-wrap items-center gap-2">
          {selectedGenres.map((genre) => (
            <Badge
              key={`selected-${genre}`}
              variant="default"
              className="flex items-center gap-1.5 pr-0"
            >
              {genre}
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="h-6 w-6 rounded-full text-muted-foreground hover:text-destructive"
                onClick={() => removeGenre(genre)}
              >
                <X className="size-3" aria-hidden="true" />
                <span className="sr-only">Remove {genre}</span>
              </Button>
            </Badge>
          ))}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setSelectedGenres([])}
            className="text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      ) : null}

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
