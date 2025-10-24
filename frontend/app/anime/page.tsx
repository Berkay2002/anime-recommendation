"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, ChevronsUpDown, SlidersHorizontal, X } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import AnimeBrowseCard from "@/components/AnimeBrowseCard"
import { Card, CardContent } from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useDebounce } from "@/hooks/useDebounce"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { cn } from "@/lib/utils"

const genreOptions = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Romance",
  "Sci-Fi",
] as const

type GenreOption = (typeof genreOptions)[number]

const sortOptions = [
  { value: "Popularity", label: "Popularity" },
  { value: "Score", label: "Score" },
  { value: "Rank", label: "Rank" },
] as const

type SortOption = (typeof sortOptions)[number]["value"]

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

const skeletonPlaceholders = Array.from({ length: 6 })
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
  const [genrePopoverOpen, setGenrePopoverOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [sortBy, setSortBy] = useLocalStorage<SortOption>(
    "sortBy",
    "Popularity"
  )
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  const debouncedSelectedGenres = useDebounce(selectedGenres, 300)
  const debouncedSortBy = useDebounce(sortBy, 300)

  const fetchAnime = useCallback(
    (page: number, sortByValue: SortOption, genres: GenreOption[]) => {
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
          console.error("Error fetching anime list:", fetchError)
          setError(
            `Failed to load anime list. Please try again later. (${fetchError.message})`
          )
          setLoading(false)
        })
    },
    []
  )

  useEffect(() => {
    fetchAnime(currentPage, debouncedSortBy, debouncedSelectedGenres)
  }, [fetchAnime, currentPage, debouncedSortBy, debouncedSelectedGenres])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
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

  const hasSelection = selectedGenres.length > 0

  return (
    <div className="container mx-auto flex flex-col gap-6 px-4 py-6 sm:px-6 lg:gap-8 lg:py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
        ) : (
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Explore Anime
            </h1>
            <p className="text-muted-foreground">
              Browse the catalog and filter by genres you love.
            </p>
          </div>
        )}

        <div className="hidden flex-col gap-2 md:flex md:flex-row">
          {loading && isInitialLoad ? (
            <Skeleton className="h-11 w-48 rounded-xl border border-border/60 bg-background/60" />
          ) : (
            <>
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover open={genrePopoverOpen} onOpenChange={setGenrePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={genrePopoverOpen}
                    className="w-full justify-between sm:w-72"
                  >
                    <span className="truncate">
                      {hasSelection
                        ? `${selectedGenres.length} genre${
                            selectedGenres.length > 1 ? "s" : ""
                          } selected`
                        : "Select genres"}
                    </span>
                    <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="end">
                  <Command>
                    <CommandInput placeholder="Search genres..." />
                    <CommandList>
                      <CommandEmpty>No genres found.</CommandEmpty>
                      <CommandGroup>
                        {genreOptions.map((genre) => {
                          const isSelected = selectedGenres.includes(genre)
                          return (
                            <CommandItem
                              key={genre}
                              value={genre}
                              onSelect={() => toggleGenre(genre)}
                            >
                              <Check
                                className={cn(
                                  "mr-2 size-4",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {genre}
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>

        <div className="md:hidden">
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
              >
                <span className="font-medium">Filters</span>
                <span className="flex items-center gap-2">
                  {hasSelection ? (
                    <Badge
                      variant="secondary"
                      className="rounded-full px-2 py-0 text-xs"
                    >
                      {selectedGenres.length}
                    </Badge>
                  ) : null}
                  <SlidersHorizontal className="size-4" aria-hidden="true" />
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="flex h-[80vh] flex-col gap-6 overflow-hidden rounded-t-3xl border-border/60 bg-background/95 px-6 py-6 backdrop-blur"
            >
              <SheetHeader className="space-y-2 text-left">
                <SheetTitle className="text-2xl font-semibold tracking-tight">
                  Refine results
                </SheetTitle>
                <SheetDescription>
                  Adjust sorting and genres to personalize your browse list.
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 space-y-6 overflow-y-auto">
                <div className="space-y-3">
                  <Label htmlFor="mobile-sort" className="text-sm font-medium">
                    Sort by
                  </Label>
                  <Select
                    value={sortBy}
                    onValueChange={(value) => setSortBy(value as SortOption)}
                  >
                    <SelectTrigger id="mobile-sort" className="w-full">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={`mobile-${option.value}`} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Genres</span>
                    {hasSelection ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => setSelectedGenres([])}
                      >
                        Clear all
                      </Button>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {genreOptions.map((genre) => {
                      const isSelected = selectedGenres.includes(genre)
                      return (
                        <div
                          key={`mobile-genre-${genre}`}
                          className={cn(
                            "rounded-lg border px-3 py-2",
                            isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/60 bg-background/80 text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`mobile-genre-checkbox-${genre}`}
                              checked={isSelected}
                              onCheckedChange={() => toggleGenre(genre)}
                            />
                            <Label
                              htmlFor={`mobile-genre-checkbox-${genre}`}
                              className="text-sm font-medium"
                            >
                              {genre}
                            </Label>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <SheetFooter className="gap-2 sm:flex-row sm:justify-end">
                <SheetClose asChild>
                  <Button type="button" className="w-full sm:w-auto">
                    Apply filters
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
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

      <div
        className={cn(
          "transition-opacity",
          loading && !isInitialLoad ? "opacity-50" : "opacity-100"
        )}
      >
        {isInitialLoad && loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {skeletonPlaceholders.map((_, index) => (
              <Card key={`anime-skeleton-${index}`} className="flex gap-4 p-4">
                <Skeleton className="h-60 w-40 shrink-0 rounded-lg" />
                <div className="flex w-full flex-1 flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                  <div className="mt-auto flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : !loading && animeList.length === 0 ? (
          <Alert>
            <AlertTitle>No matches found</AlertTitle>
            <AlertDescription>
              Try selecting different genres to discover more series.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {animeList.map((anime) => (
              <AnimeBrowseCard key={anime.anime_id} anime={anime} />
            ))}
          </div>
        )}
      </div>

      {!loading && !error && totalPages > 1 && (
        <Pagination>
          <PaginationContent className="flex-wrap justify-center gap-1.5 sm:gap-2">
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  handlePageChange(currentPage - 1)
                }}
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handlePageChange(page)
                  }}
                  isActive={currentPage === page}
                  size="default"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  handlePageChange(currentPage + 1)
                }}
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

export default AnimePage
