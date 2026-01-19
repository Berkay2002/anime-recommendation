import { useState, useEffect } from 'react';

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
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isLoading) {
      // Delay showing loading state to prevent flicker
      timeoutId = setTimeout(() => {
        setShowLoading(true);
      }, initialDelay);
    } else {
      // Hide loading immediately when state changes to false
      setShowLoading(false);
    }

    // Cleanup timeout on unmount or state change
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading, initialDelay]);

  return { isLoading: showLoading, setIsLoading };
}
