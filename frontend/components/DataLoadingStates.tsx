import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'

interface LoadingStateProps {
  count?: number
  type?: 'default' | 'card'
}

interface ErrorStateProps {
  message: string
  title?: string
}

interface EmptyStateProps {
  message: string
  title?: string
}

/**
 * LoadingState - Displays skeleton loaders
 * @param count - Number of skeleton items to display (default: 6)
 * @param type - Type of skeleton: 'default' or 'card' (default: 'default')
 */
export function LoadingState({ count = 6, type = 'default' }: LoadingStateProps) {
  const skeletonPlaceholders = Array.from({ length: count })

  if (type === 'card') {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {skeletonPlaceholders.map((_, index) => (
          <Card key={`loading-card-${index}`} className="flex gap-4 p-4">
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
    )
  }

  return (
    <div className="space-y-3">
      {skeletonPlaceholders.map((_, index) => (
        <Skeleton key={`loading-skeleton-${index}`} className="h-8 w-full" />
      ))}
    </div>
  )
}

/**
 * ErrorState - Displays error alert
 * @param message - Error message to display
 * @param title - Optional error title (default: "Something went wrong")
 */
export function ErrorState({ message, title = "Something went wrong" }: ErrorStateProps) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}

/**
 * EmptyState - Displays empty state alert
 * @param message - Empty state message to display
 * @param title - Optional empty state title (default: "No results found")
 */
export function EmptyState({ message, title = "No results found" }: EmptyStateProps) {
  return (
    <Alert>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
