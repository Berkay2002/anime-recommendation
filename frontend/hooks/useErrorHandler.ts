'use client'

import { useCallback, useState } from 'react'
import { clientLogger } from '@/lib/client-logger'

export interface ErrorState {
  hasError: boolean
  error: Error | null
  errorType: 'network' | 'timeout' | 'server' | 'client' | 'unknown'
  message: string
  isRetryable: boolean
}

export interface UseErrorHandlerReturn {
  error: ErrorState
  setError: (error: Error | string, context?: string) => void
  clearError: () => void
  retry: (retryCallback?: () => void | Promise<void>) => void
}

const defaultErrorState: ErrorState = {
  hasError: false,
  error: null,
  errorType: 'unknown',
  message: '',
  isRetryable: false,
}

function determineErrorType(error: Error | string): ErrorState['errorType'] {
  const errorMessage = typeof error === 'string' ? error : error.message.toLowerCase()

  if (errorMessage.includes('network') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('econnrefused') ||
      errorMessage.includes('failed to fetch')) {
    return 'network'
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return 'timeout'
  }

  if (errorMessage.includes('500') ||
      errorMessage.includes('502') ||
      errorMessage.includes('503') ||
      errorMessage.includes('504')) {
    return 'server'
  }

  if (errorMessage.includes('400') ||
      errorMessage.includes('401') ||
      errorMessage.includes('403') ||
      errorMessage.includes('404') ||
      errorMessage.includes('validation') ||
      errorMessage.includes('invalid')) {
    return 'client'
  }

  return 'unknown'
}

function getUserFriendlyMessage(errorType: ErrorState['errorType']): string {
  switch (errorType) {
    case 'network':
      return 'Unable to connect. Please check your internet connection.'
    case 'timeout':
      return 'Request timed out. Please try again.'
    case 'server':
      return 'Server error. Please try again later.'
    case 'client':
      return 'Invalid request. Please refresh and try again.'
    case 'unknown':
    default:
      return 'Something went wrong. Please try again.'
  }
}

function isRetryableError(errorType: ErrorState['errorType']): boolean {
  return errorType === 'network' || errorType === 'timeout' || errorType === 'server'
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setErrorState] = useState<ErrorState>(defaultErrorState)

  const setError = useCallback((errorInput: Error | string, context?: string) => {
    const errorObj = typeof errorInput === 'string'
      ? new Error(errorInput)
      : errorInput

    const errorType = determineErrorType(errorInput)
    const userMessage = getUserFriendlyMessage(errorType)
    const retryable = isRetryableError(errorType)

    clientLogger.error(
      {
        error: errorObj,
        context,
        errorType,
      },
      'Component error'
    )

    setErrorState({
      hasError: true,
      error: errorObj,
      errorType,
      message: userMessage,
      isRetryable: retryable,
    })
  }, [])

  const clearError = useCallback(() => {
    setErrorState(defaultErrorState)
  }, [])

  const retry = useCallback((retryCallback?: () => void | Promise<void>) => {
    setErrorState(defaultErrorState)

    if (retryCallback) {
      retryCallback()
    }
  }, [])

  return {
    error,
    setError,
    clearError,
    retry,
  }
}
