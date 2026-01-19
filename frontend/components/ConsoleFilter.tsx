"use client"

import { useEffect } from 'react'

export function ConsoleFilter() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const originalError = console.error
      const originalWarn = console.warn

      const getMessage = (args: unknown[]) => {
        const first = args[0]
        return first == null ? '' : String(first)
      }

      console.error = (...args: unknown[]) => {
        const message = getMessage(args)
        
        // Suppress async params/searchParams warnings from React DevTools
        if (
          message.includes('params are being enumerated') ||
          message.includes('params is a Promise and must be unwrapped') ||
          (message.includes('searchParams') && message.includes('Promise and must be unwrapped'))
        ) {
          return
        }
        
        originalError(...(args as Parameters<typeof console.error>))
      }

      console.warn = (...args: unknown[]) => {
        const message = getMessage(args)
        
        // Suppress async params/searchParams warnings from React DevTools
        if (
          message.includes('params are being enumerated') ||
          message.includes('params is a Promise and must be unwrapped') ||
          (message.includes('searchParams') && message.includes('Promise and must be unwrapped'))
        ) {
          return
        }
        
        originalWarn(...(args as Parameters<typeof console.warn>))
      }

      return () => {
        console.error = originalError
        console.warn = originalWarn
      }
    }
  }, [])

  return null
}
