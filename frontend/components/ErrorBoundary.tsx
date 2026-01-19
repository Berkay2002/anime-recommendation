'use client'

import { Component, ReactNode } from 'react'
import { ErrorBoundary as ErrorBoundaryBase } from 'react-error-boundary'
import logger from '@/lib/logger'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: { componentStack: string }) => void
}

interface FallbackErrorProps {
  error: Error
  resetErrorBoundary: () => void
}

/**
 * FallbackError - Displayed when a component error is caught
 * @param error - The error that was thrown
 * @param resetErrorBoundary - Function to reset error state and retry
 */
function FallbackError({ error, resetErrorBoundary }: FallbackErrorProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription className="mt-2 space-y-4">
          <p>
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>

          {process.env.NODE_ENV === 'development' && error.stack && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold">
                Error details
              </summary>
              <pre className="mt-2 overflow-x-auto text-xs">
                {error.stack}
              </pre>
            </details>
          )}

          <Button
            onClick={resetErrorBoundary}
            variant="outline"
            className="mt-4"
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}

/**
 * ErrorBoundary - Catches component errors and displays fallback UI
 * @param children - Child components to wrap with error boundary
 * @param fallback - Optional custom fallback component
 * @param onError - Optional error callback (defaults to Pino logger)
 */
export default function ErrorBoundary({
  children,
  fallback,
  onError,
}: ErrorBoundaryProps) {
  const handleError = (error: unknown, info: { componentStack: string }) => {
    // Convert error to Error type if it's not already
    const errorObj = error instanceof Error ? error : new Error(String(error))

    // Log error with context
    logger.error(
      {
        error: {
          message: errorObj.message,
          stack: errorObj.stack,
          name: errorObj.name,
        },
        componentStack: info.componentStack,
      },
      'Component error caught by boundary'
    )

    // Call custom error handler if provided
    if (onError) {
      onError(errorObj as Error, info)
    }
  }

  // Use fallback prop if provided, otherwise use FallbackComponent
  if (fallback) {
    return (
      <ErrorBoundaryBase fallback={fallback} onError={handleError}>
        {children}
      </ErrorBoundaryBase>
    )
  }

  return (
    <ErrorBoundaryBase FallbackComponent={FallbackError} onError={handleError}>
      {children}
    </ErrorBoundaryBase>
  )
}
