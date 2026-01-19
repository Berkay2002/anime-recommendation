'use client'

import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

type GenreOption = 'Action' | 'Adventure' | 'Comedy' | 'Drama' | 'Fantasy' | 'Horror' | 'Romance' | 'Sci-Fi'

interface AnimeBrowseActiveFiltersProps {
  selectedGenres: GenreOption[]
  loading: boolean
  onRemoveGenre: (genre: GenreOption) => void
  onClearGenres: () => void
}

const badgeSkeletonPlaceholders = Array.from({ length: 3 })

const AnimeBrowseActiveFilters: React.FC<AnimeBrowseActiveFiltersProps> = ({
  selectedGenres,
  loading,
  onRemoveGenre,
  onClearGenres,
}) => {
  const hasSelection = selectedGenres.length > 0

  if (loading) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {badgeSkeletonPlaceholders.map((_, index) => (
          <Skeleton
            key={`selected-skeleton-${index}`}
            className="h-8 w-24 rounded-full border border-border/40 bg-background/60"
          />
        ))}
      </div>
    )
  }

  if (!hasSelection) {
    return null
  }

  return (
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
            onClick={() => onRemoveGenre(genre)}
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
        onClick={onClearGenres}
        className="text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        Clear all
      </Button>
    </div>
  )
}

export default AnimeBrowseActiveFilters
