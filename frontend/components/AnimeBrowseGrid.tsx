'use client'

import { Card } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import AnimeBrowseCard from '@/components/AnimeBrowseCard'
import { cn } from '@/lib/utils'

interface Anime {
  anime_id: number
  title: string
  image_url?: string
  Genres?: string[]
  Score?: number
  Description?: string
  Rank?: number
}

interface AnimeBrowseGridProps {
  animeList: Anime[]
  loading: boolean
  isInitialLoad: boolean
  error: string | null
}

const skeletonPlaceholders = Array.from({ length: 6 })

const AnimeBrowseGrid: React.FC<AnimeBrowseGridProps> = ({
  animeList,
  loading,
  isInitialLoad,
  error,
}) => {
  return (
    <div
      className={cn(
        'transition-opacity',
        loading && !isInitialLoad ? 'opacity-50' : 'opacity-100'
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
  )
}

export default AnimeBrowseGrid
