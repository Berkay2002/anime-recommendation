import { RefObject, useEffect } from 'react'

/**
 * Hook for detecting clicks outside a referenced element.
 *
 * @param ref - Reference to the container element
 * @param handler - Callback function to execute when click outside is detected
 * @param enabled - Optional flag to enable/disable detection (default: true)
 *
 * @example
 * ```ts
 * const containerRef = useRef<HTMLDivElement>(null)
 * useClickOutside(containerRef, () => setIsOpen(false), isOpen)
 * ```
 */
export function useClickOutside(
  ref: RefObject<HTMLElement>,
  handler: () => void,
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!ref.current) return

      // Check if the click target is outside the referenced element
      if (!ref.current.contains(event.target as Node)) {
        handler()
      }
    }

    // Listen for both mouse and touch events
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [ref, handler, enabled])
}
