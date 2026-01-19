import { useCallback, useEffect } from 'react'

interface UseKeyboardShortcutOptions {
  ctrlOrCmd?: boolean
  alt?: boolean
  shift?: boolean
  preventDefault?: boolean
}

/**
 * Hook for handling keyboard shortcuts.
 *
 * @param keys - The key(s) to listen for (e.g., "k", "Escape")
 * @param handler - Callback function to execute when shortcut is triggered
 * @param options - Optional configuration for modifier keys and behavior
 *
 * @example
 * ```ts
 * useKeyboardShortcut('k', focusInput, {
 *   ctrlOrCmd: true,
 *   preventDefault: true
 * })
 * ```
 */
export function useKeyboardShortcut(
  keys: string,
  handler: () => void,
  options?: UseKeyboardShortcutOptions
): void {
  const {
    ctrlOrCmd = false,
    alt = false,
    shift = false,
    preventDefault = false
  } = options || {}

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check if the pressed key matches
      const keyArray = keys.toLowerCase().split('+')
      const pressedKey = event.key.toLowerCase()

      if (!keyArray.includes(pressedKey)) {
        return
      }

      // Verify all required modifiers are present
      const modifiersCorrect =
        (!ctrlOrCmd || (event.metaKey || event.ctrlKey)) &&
        (!alt || event.altKey) &&
        (!shift || event.shiftKey)

      // Check for unwanted modifiers
      const hasUnwantedModifiers =
        (ctrlOrCmd && !(event.metaKey || event.ctrlKey)) ||
        (!ctrlOrCmd && (event.metaKey || event.ctrlKey)) ||
        (alt && !event.altKey) ||
        (!alt && event.altKey) ||
        (shift && !event.shiftKey) ||
        (!shift && event.shiftKey)

      if (hasUnwantedModifiers || !modifiersCorrect) {
        return
      }

      // Check if target is editable (skip if input/textarea/contentEditable)
      const target = event.target as HTMLElement | null
      if (!target) return

      const isEditable =
        target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)

      if (isEditable) return

      // Execute handler
      if (preventDefault) {
        event.preventDefault()
      }

      handler()
    },
    [keys, handler, ctrlOrCmd, alt, shift, preventDefault]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
