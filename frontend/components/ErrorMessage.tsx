'use client'

import { useEffect } from 'react'
import {
  WifiOff,
  Clock,
  Server,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { clientLogger } from '@/lib/client-logger'

export interface ErrorMessageProps {
  error: {
    message: string
    errorType: 'network' | 'timeout' | 'server' | 'client' | 'unknown'
    isRetryable: boolean
  }
  onRetry?: () => void
  className?: string
}

function getErrorIcon(errorType: ErrorMessageProps['error']['errorType']) {
  switch (errorType) {
    case 'network':
      return <WifiOff className="h-4 w-4" />
    case 'timeout':
      return <Clock className="h-4 w-4" />
    case 'server':
      return <Server className="h-4 w-4" />
    case 'client':
      return <AlertCircle className="h-4 w-4" />
    case 'unknown':
    default:
      return <HelpCircle className="h-4 w-4" />
  }
}

function getErrorTitle(errorType: ErrorMessageProps['error']['errorType']): string {
  switch (errorType) {
    case 'network':
      return 'Network Error'
    case 'timeout':
      return 'Request Timeout'
    case 'server':
      return 'Server Error'
    case 'client':
      return 'Request Error'
    case 'unknown':
    default:
      return 'Something Went Wrong'
  }
}

export function ErrorMessage({
  error,
  onRetry,
  className,
}: ErrorMessageProps) {
  const { message, errorType, isRetryable } = error
  const icon = getErrorIcon(errorType)
  const title = getErrorTitle(errorType)

  useEffect(() => {
    clientLogger.debug(
      { errorType, message, isRetryable },
      'Rendering error message'
    )
  }, [errorType, message, isRetryable])

  return (
    <Alert variant="destructive" className={className}>
      {icon}
      <div className="flex flex-col gap-2">
        <div>
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </div>
        {isRetryable && onRetry && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-8 text-xs"
            >
              Try Again
            </Button>
          </div>
        )}
      </div>
    </Alert>
  )
}
