"use client"

import { useCallback, useRef, useSyncExternalStore } from "react"
import { clientLogger } from "@/lib/client-logger"

type StorageSnapshot = {
  raw: string | null
  parsed: unknown
}

const listeners = new Map<string, Set<() => void>>()
const cache = new Map<string, StorageSnapshot>()

const notify = (key: string) => {
  const keyListeners = listeners.get(key)
  if (!keyListeners) return
  keyListeners.forEach((listener) => listener())
}

const getSnapshot = <T,>(key: string, initialValue: T): T => {
  if (typeof window === "undefined") return initialValue

  try {
    const raw = window.localStorage.getItem(key)
    const cached = cache.get(key)
    if (cached && cached.raw === raw) {
      return cached.parsed as T
    }

    let parsed = initialValue

    if (raw !== null) {
      try {
        parsed = JSON.parse(raw) as T
      } catch (parseError) {
        clientLogger.error("Error reading from localStorage:", parseError)
        window.localStorage.removeItem(key)
      }
    }

    cache.set(key, { raw, parsed })
    return parsed
  } catch (error) {
    clientLogger.error("Error reading from localStorage:", error)
    cache.set(key, { raw: null, parsed: initialValue })
    return initialValue
  }
}

const subscribe = (key: string, callback: () => void) => {
  if (typeof window === "undefined") return () => {}

  const keyListeners = listeners.get(key) ?? new Set()
  keyListeners.add(callback)
  listeners.set(key, keyListeners)

  const handleStorage = (event: StorageEvent) => {
    if (event.storageArea !== window.localStorage || event.key !== key) return
    cache.delete(key)
    callback()
  }

  window.addEventListener("storage", handleStorage)

  return () => {
    keyListeners.delete(callback)
    if (keyListeners.size === 0) {
      listeners.delete(key)
    }
    window.removeEventListener("storage", handleStorage)
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const initialValueRef = useRef(initialValue)
  const keyRef = useRef(key)

  if (keyRef.current !== key) {
    keyRef.current = key
    initialValueRef.current = initialValue
  }

  const stableInitialValue = initialValueRef.current

  const storedValue = useSyncExternalStore(
    (callback) => subscribe(key, callback),
    () => getSnapshot<T>(key, stableInitialValue),
    () => stableInitialValue
  )

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      const serialized = JSON.stringify(valueToStore)

      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, serialized)
      }

      cache.set(key, { raw: serialized, parsed: valueToStore })
      notify(key)
    } catch (error) {
      clientLogger.error("Error writing to localStorage:", error)
    }
  }, [key, storedValue])

  return [storedValue, setValue]
}
