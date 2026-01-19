"use client"

import { useCallback, useState } from "react"

import AnimeBrowseHeader from "@/components/AnimeBrowseHeader"
import AnimeBrowseFilters from "@/components/AnimeBrowseFilters"
import AnimeBrowseGrid from "@/components/AnimeBrowseGrid"
import AnimeBrowsePagination from "@/components/AnimeBrowsePagination"
import AnimeBrowseActiveFilters from "@/components/AnimeBrowseActiveFilters"
import { useDebounce } from "@/hooks/useDebounce"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useAnimeList } from "@/lib/queries/anime"

type GenreOption = "Action" | "Adventure" | "Comedy" | "Drama" | "Fantasy" | "Horror" | "Romance" | "Sci-Fi"

type SortOption = "Popularity" | "Score" | "Rank"


const AnimePage: React.FC = () => {
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true)
  const [selectedGenres, setSelectedGenres] = useLocalStorage<GenreOption[]>(
    "selectedGenres",
    []
  )
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useLocalStorage<SortOption>(
    "sortBy",
    "Popularity"
  )

  const debouncedSelectedGenres = useDebounce(selectedGenres, 300)
  const debouncedSortBy = useDebounce(sortBy, 300)

  // React Query hook for anime list
  const { data, isLoading, error } = useAnimeList({
    page: currentPage,
    sortBy: debouncedSortBy,
    genres: debouncedSelectedGenres,
    limit: 50,
  })

  const animeList = data?.anime || []
  const totalPages = data?.totalPages || 0
  const errorMessage = error?.message || null

  // Update initial load state after first successful fetch
  if (!isLoading && !error && isInitialLoad) {
    setIsInitialLoad(false)
  }

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
      <AnimeBrowseHeader loading={isLoading} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <AnimeBrowseFilters
          sortBy={sortBy}
          onSortChange={setSortBy}
          selectedGenres={selectedGenres}
          onGenreToggle={toggleGenre}
          onClearGenres={() => setSelectedGenres([])}
          loading={isLoading}
          isInitialLoad={isInitialLoad}
        />
      </div>

      <AnimeBrowseActiveFilters
        selectedGenres={selectedGenres}
        loading={isLoading}
        onRemoveGenre={removeGenre}
        onClearGenres={() => setSelectedGenres([])}
      />

      <AnimeBrowseGrid
        animeList={animeList}
        loading={isLoading}
        isInitialLoad={isInitialLoad}
        error={errorMessage}
      />

      {!isLoading && !error && totalPages > 1 && (
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
