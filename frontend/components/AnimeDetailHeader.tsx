'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Anime {
  anime_id: number
  title: string
  image_url?: string
  description?: string
  Description?: string
  genres?: string[]
  Genres?: string[]
}

interface AnimeDetailHeaderProps {
  anime: Anime
}

export default function AnimeDetailHeader({ anime }: AnimeDetailHeaderProps) {
  return (
    <div className='flex flex-col gap-6 md:flex-row md:items-start md:gap-8'>
      <div className='relative aspect-2/3 w-full max-w-[450px] shrink-0 overflow-hidden rounded-2xl border border-border/40 bg-muted shadow-lg'>
        <Image
          src={anime.image_url || '/placeholder.jpg'}
          alt={anime.title || 'Anime artwork'}
          fill
          sizes='(max-width: 768px) 100vw, 450px'
          className='object-cover'
          priority
        />
      </div>

      <div className='flex min-w-0 flex-1 flex-col gap-6'>
        <div className='space-y-3'>
          <h1 className='text-3xl font-semibold leading-tight tracking-tight text-foreground'>
            {anime.title || 'Unknown Title'}
          </h1>
          {(anime.genres || anime.Genres)?.length ? (
            <div className='flex flex-wrap items-center gap-2'>
              {(anime.genres || anime.Genres)?.map((genre) => (
                <Badge
                  key={`${anime.anime_id}-${genre}`}
                  variant='outline'
                  className='rounded-full'
                >
                  {genre}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <p className='text-base leading-relaxed text-muted-foreground'>
          {anime.description || anime.Description || 'No description available for this title.'}
        </p>

        <ButtonRow animeId={anime.anime_id} />
      </div>
    </div>
  )
}

function ButtonRow({ animeId }: { animeId: number }) {
  return (
    <div className='flex flex-wrap gap-3'>
      <Button asChild className='w-full sm:w-auto'>
        <Link href={`/anime/${animeId}`}>View full details</Link>
      </Button>
      <Button asChild variant='outline' className='w-full sm:w-auto'>
        <Link href='#reviews'>Jump to reviews</Link>
      </Button>
    </div>
  )
}
