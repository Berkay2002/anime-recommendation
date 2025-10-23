import { memo } from "react"

import { Card } from "./ui/card"
import { Skeleton } from "./ui/skeleton"

interface AnimeCardSkeletonProps {
  showAction?: boolean
}

const AnimeCardSkeleton: React.FC<AnimeCardSkeletonProps> = ({
  showAction = true,
}) => {
  return (
    <div className="min-w-[13rem] max-w-[13rem] shrink-0">
      <Card className="relative h-full overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-0 shadow-sm">
        <div className="relative h-full">
          {showAction ? (
            <div className="absolute right-3 top-3 z-10">
              <Skeleton className="h-9 w-9 rounded-full border border-border/60 bg-background/70" />
            </div>
          ) : null}
          <Skeleton className="aspect-[2/3] w-full" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/60 to-transparent px-4 pb-4 pt-8">
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </Card>
    </div>
  )
}

export default memo(AnimeCardSkeleton)
