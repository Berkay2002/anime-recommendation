'use client'

import AnimeBrowseCard from '@/components/AnimeBrowseCard'
import { LoadingState, ErrorState, EmptyState } from '@/components/DataLoadingStates'
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
        <LoadingState count={6} type="card" />
      ) : error ? (
        <ErrorState message={error} />
      ) : !loading && animeList.length === 0 ? (
        <EmptyState
          message="Try selecting different genres to discover more series."
          title="No matches found"
        />
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
