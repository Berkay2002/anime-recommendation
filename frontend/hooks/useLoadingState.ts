import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Custom hook for managing loading state with delay to prevent flicker
 *
 * Introduces a configurable delay before showing loading state to prevent
 * flashing on fast operations (< 150ms default)
 *
 * @param initialDelay - Delay in milliseconds before showing loading (default: 150ms)
 * @returns Object with isLoading (display state) and setIsLoading (control function)
 *
 * @example
 * const { isLoading, setIsLoading } = useLoadingState(150);
 * setIsLoading(true); // Loading won't show for 150ms
 * setIsLoading(false); // If called before 150ms, loading never appears
 */
export function useLoadingState(initialDelay = 150) {
  const [showLoading, setShowLoading] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLoadingRef = useRef(false)

  const clearPending = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Wrap setIsLoading in useCallback to ensure stability for React Hook dependencies
  const stableSetIsLoading = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      const next =
        typeof value === "function" ? value(isLoadingRef.current) : value
      isLoadingRef.current = next

      if (next) {
        clearPending()
        timeoutRef.current = setTimeout(() => {
          setShowLoading(true)
          timeoutRef.current = null
        }, initialDelay)
      } else {
        clearPending()
        setShowLoading(false)
      }
    },
    [clearPending, initialDelay]
  )

  useEffect(() => {
    return () => {
      clearPending()
    }
  }, [clearPending])

  return { isLoading: showLoading, setIsLoading: stableSetIsLoading }
}
