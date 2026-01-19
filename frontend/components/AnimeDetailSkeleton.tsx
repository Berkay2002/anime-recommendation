import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const skeletonPlaceholders = Array.from({ length: 3 })
const statSkeletonPlaceholders = Array.from({ length: 5 })
const detailSkeletonPlaceholders = Array.from({ length: 6 })

const detailsSkeleton = (
  <div className='space-y-3'>
    {detailSkeletonPlaceholders.map((_, index) => (
      <Skeleton
        key={`detail-skeleton-${index}`}
        className='h-8 w-full'
      />
    ))}
  </div>
)

export default function AnimeDetailSkeleton() {
  return (
    <div className='container mx-auto flex flex-col gap-6 px-4 py-6 sm:px-6 lg:gap-8 lg:py-8'>
      <Card className='overflow-hidden border border-border/60 bg-card/80 shadow-sm'>
        <CardContent className='flex flex-col gap-6 px-4 py-6 md:flex-row md:items-start md:gap-8'>
          <div className='relative aspect-2/3 w-full max-w-[450px] shrink-0 overflow-hidden rounded-2xl border border-border/40 bg-muted shadow-lg'>
            <Skeleton className='h-full w-full' />
          </div>

          <div className='flex flex-1 flex-col gap-6'>
            <div className='space-y-3'>
              <Skeleton className='h-9 w-60' />
              <div className='flex flex-wrap items-center gap-2'>
                {skeletonPlaceholders.map((_, index) => (
                  <Skeleton
                    key={`genre-skeleton-${index}`}
                    className='h-7 w-24 rounded-full'
                  />
                ))}
              </div>
            </div>

            <Skeleton className='h-24 w-full' />

            <dl className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {statSkeletonPlaceholders.map((_, index) => (
                <div
                  key={`stat-skeleton-${index}`}
                  className='rounded-2xl border border-border/50 bg-background/60 p-4'
                >
                  <Skeleton className='mb-2 h-4 w-20' />
                  <Skeleton className='h-6 w-16' />
                </div>
              ))}
            </dl>

            <div className='flex flex-wrap gap-3'>
              <Skeleton className='h-10 w-36 rounded-full' />
              <Skeleton className='h-10 w-36 rounded-full' />
            </div>
          </div>
        </CardContent>
      </Card>

      <section className='space-y-4'>
        <div className='space-y-1'>
          <Skeleton className='h-7 w-48' />
          <Skeleton className='h-4 w-64' />
        </div>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {skeletonPlaceholders.map((_, index) => (
            <Card
              key={`recommendation-skeleton-${index}`}
              className='border border-border/60 bg-card/80 shadow-sm'
            >
              <CardContent className='flex flex-col gap-3 px-4 py-4'>
                <Skeleton className='h-6 w-44' />
                <Skeleton className='h-4 w-28' />
                <Skeleton className='h-16 w-full' />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className='space-y-4'>
        <div className='space-y-1'>
          <Skeleton className='h-7 w-32' />
          <Skeleton className='h-4 w-56' />
        </div>
        <div className='grid gap-4'>
          {skeletonPlaceholders.map((_, index) => (
            <Card
              key={`review-skeleton-${index}`}
              className='border border-border/60 bg-card/80 shadow-sm'
            >
              <CardContent className='px-4 py-4'>
                <Skeleton className='h-20 w-full' />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
