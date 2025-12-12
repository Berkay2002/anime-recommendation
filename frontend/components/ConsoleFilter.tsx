"use client"

import { useEffect } from 'react'

export function ConsoleFilter() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const originalError = console.error
      const originalWarn = console.warn

      console.error = (...args: any[]) => {
        const message = args[0]?.toString() || ''
        
        // Suppress async params/searchParams warnings from React DevTools
        if (
          message.includes('params are being enumerated') ||
          message.includes('params is a Promise and must be unwrapped') ||
          (message.includes('searchParams') && message.includes('Promise and must be unwrapped'))
        ) {
          return
        }
        
        originalError.apply(console, args)
      }

      console.warn = (...args: any[]) => {
        const message = args[0]?.toString() || ''
        
        // Suppress async params/searchParams warnings from React DevTools
        if (
          message.includes('params are being enumerated') ||
          message.includes('params is a Promise and must be unwrapped') ||
          (message.includes('searchParams') && message.includes('Promise and must be unwrapped'))
        ) {
          return
        }
        
        originalWarn.apply(console, args)
      }

      return () => {
        console.error = originalError
        console.warn = originalWarn
      }
    }
  }, [])

  return null
}
