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
import { Check, ChevronsUpDown, X } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
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

interface Anime {
  anime_id: number
  title: string
  image_url?: string
  Genres?: string[]
  Score?: number
  Description?: string
}

interface ApiResponse {
  anime: Anime[]
  totalPages: number
  currentPage: number
}

const skeletonPlaceholders = Array.from({ length: 6 })
const badgeSkeletonPlaceholders = Array.from({ length: 3 })

const formatScore = (score?: number) => {
  if (typeof score !== "number" || !Number.isFinite(score)) return "N/A"
  return score.toFixed(1)
}

const AnimePage: React.FC = () => {
  const [animeList, setAnimeList] = useState<Anime[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedGenres, setSelectedGenres] = useState<GenreOption[]>([])
  const [genrePopoverOpen, setGenrePopoverOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  const fetchAnime = useCallback((page: number) => {
    setLoading(true)
    const apiUrl = `/api/anime?limit=50&page=${page}`

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
      })
      .catch((fetchError: Error) => {
        console.error("Error fetching anime list:", fetchError)
        setError(
          `Failed to load anime list. Please try again later. (${fetchError.message})`
        )
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchAnime(currentPage)
  }, [fetchAnime, currentPage])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const toggleGenre = useCallback((genre: GenreOption) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    )
  }, [])

  const removeGenre = useCallback((genre: GenreOption) => {
    setSelectedGenres((prev) => prev.filter((g) => g !== genre))
  }, [])

  const filteredAnimeList = useMemo(() => {
    if (!selectedGenres.length) {
      return animeList
    }

    const lowerSelectedGenres = selectedGenres.map((genre) =>
      genre.toLowerCase()
    )

    return [...animeList]
      .filter((anime) => {
        if (!anime?.Genres?.length) return false
        const lowerAnimeGenres = anime.Genres.map((genre) =>
          genre.toLowerCase()
        )
        return lowerSelectedGenres.every((genre) =>
          lowerAnimeGenres.includes(genre)
        )
      })
      .sort((a, b) => (b.Score ?? 0) - (a.Score ?? 0))
  }, [animeList, selectedGenres])

  const hasSelection = selectedGenres.length > 0

  let content: ReactNode = null

  if (loading) {
    content = (
      <div className="grid gap-6">
        {skeletonPlaceholders.map((_, index) => (
          <Card
            key={`anime-skeleton-${index}`}
            className="overflow-hidden border border-border/60 bg-card/80 shadow-sm"
          >
            <CardContent className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start sm:gap-6">
              <div className="relative aspect-[2/3] w-full max-w-[180px] shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-muted sm:w-40">
                <Skeleton className="h-full w-full" />
              </div>

              <div className="flex flex-1 flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-9 w-28" />
                </div>

                <Skeleton className="h-20 w-full" />

                <div className="flex flex-wrap gap-2">
                  {badgeSkeletonPlaceholders.map((_, badgeIndex) => (
                    <Skeleton
                      key={`badge-skeleton-${badgeIndex}`}
                      className="h-6 w-20 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  } else if (error) {
    content = (
      <Alert variant="destructive">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  } else if (!filteredAnimeList.length) {
    content = (
      <Alert>
        <AlertTitle>No matches found</AlertTitle>
        <AlertDescription>
          Try selecting different genres to discover more series.
        </AlertDescription>
      </Alert>
    )
  } else {
    content = (
      <div className="grid gap-6">
        {filteredAnimeList.map((anime) => (
          <Card
            key={anime.anime_id}
            className="overflow-hidden border border-border/60 bg-card/80 shadow-sm"
          >
            <CardContent className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-start sm:gap-6">
              <Link
                href={`/anime/${anime.anime_id}`}
                className="relative aspect-[2/3] w-full max-w-[180px] shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-muted sm:w-40"
              >
                <Image
                  src={anime.image_url || "/placeholder.jpg"}
                  alt={anime.title || "Anime poster"}
                  fill
                  sizes="160px"
                  className="object-cover transition duration-500 hover:scale-105"
                />
              </Link>

              <div className="flex flex-1 flex-col gap-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <Link
                      href={`/anime/${anime.anime_id}`}
                      className="text-xl font-semibold tracking-tight text-foreground transition hover:text-primary"
                    >
                      {anime.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Score:{" "}
                      <span className="font-medium text-foreground">
                        {formatScore(anime.Score)}
                      </span>
                    </p>
                  </div>

                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/anime/${anime.anime_id}`}>
                      View details
                    </Link>
                  </Button>
                </div>

                {anime.Description ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {anime.Description}
                  </p>
                ) : null}

                {anime.Genres?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {anime.Genres.map((genre) => (
                      <Badge key={`${anime.anime_id}-${genre}`} variant="outline">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto flex flex-col gap-6 px-6 py-8">
      {loading ? (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl border border-border/60 bg-background/60 sm:w-72" />
        </div>
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Explore Anime
            </h1>
            <p className="text-muted-foreground">
              Browse the catalog and filter by genres you love.
            </p>
          </div>

          <Popover open={genrePopoverOpen} onOpenChange={setGenrePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={genrePopoverOpen}
                className="w-full justify-between border-border/60 bg-background/80 backdrop-blur sm:w-72"
              >
                <span className="text-sm font-medium">
                  {hasSelection
                    ? `${selectedGenres.length} genre${
                        selectedGenres.length > 1 ? "s" : ""
                      } selected`
                    : "Select genres"}
                </span>
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-60" />
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
                          className="gap-2"
                        >
                          <Check
                            className={cn(
                              "size-4",
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
        </div>
      )}

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
              variant="secondary"
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
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      ) : null}

      {content}

      {!loading && !error && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
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
