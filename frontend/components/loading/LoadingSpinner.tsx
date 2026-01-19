import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}

export function LoadingSpinner({ size = 'md', message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex items-center gap-2"
    >
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  )
}
