import { Skeleton } from "@/components/ui/skeleton"

interface AnimeBrowseHeaderProps {
  loading: boolean
}

export default function AnimeBrowseHeader({
  loading,
}: AnimeBrowseHeaderProps) {
  return (
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
    </div>
  )
}
