"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, SlidersHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
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

interface AnimeBrowseFiltersProps {
  sortBy: SortOption
  onSortChange: (value: SortOption) => void
  selectedGenres: GenreOption[]
  onGenreToggle: (genre: GenreOption) => void
  onGenreRemove: (genre: GenreOption) => void
  onClearGenres: () => void
  loading: boolean
  isInitialLoad: boolean
}

export default function AnimeBrowseFilters({
  sortBy,
  onSortChange,
  selectedGenres,
  onGenreToggle,
  onGenreRemove,
  onClearGenres,
  loading,
  isInitialLoad,
}: AnimeBrowseFiltersProps) {
  const [genrePopoverOpen, setGenrePopoverOpen] = useState(false)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  const hasSelection = selectedGenres.length > 0

  return (
    <>
      <div className="hidden flex-col gap-2 md:flex md:flex-row">
        {loading && isInitialLoad ? (
          <Skeleton className="h-11 w-48 rounded-xl border border-border/60 bg-background/60" />
        ) : (
          <>
            <Select value={sortBy} onValueChange={onSortChange}>
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
                            onSelect={() => onGenreToggle(genre)}
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
                <Select value={sortBy} onValueChange={onSortChange}>
                  <SelectTrigger id="mobile-sort" className="w-full">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem
                        key={`mobile-${option.value}`}
                        value={option.value}
                      >
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
                      onClick={onClearGenres}
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
                            onCheckedChange={() => onGenreToggle(genre)}
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
    </>
  )
}
