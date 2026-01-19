/**
 * Client-side logger utility
 *
 * This is a simple logger for client-side components that respects the environment.
 * In development, logs are output to console. In production, only errors are logged.
 *
 * Usage:
 * import { clientLogger } from '@/lib/client-logger'
 * clientLogger.error('Error message', error)
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const clientLogger = {
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args)
    }
  },

  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args)
    }
  },

  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args)
  },

  error: (...args: unknown[]) => {
    if (isDevelopment) {
      // Avoid Next.js dev overlay for handled errors.
      console.warn('[ERROR]', ...args)
      return
    }

    console.error('[ERROR]', ...args)
  },
}
