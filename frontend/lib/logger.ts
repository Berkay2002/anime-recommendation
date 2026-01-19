import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: process.env.NODE_ENV || 'development',
  },
});

/**
 * Factory function to create child loggers with additional context
 * Useful for service-specific loggers with predefined context
 *
 * @param context - Additional context to include in all log entries
 * @returns A child logger instance with the provided context
 *
 * @example
 * ```typescript
 * import { createLogger } from '@/lib/logger';
 *
 * const log = createLogger({ service: 'AnimeService' });
 * log.info('Anime processed successfully');
 * ```
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

export default logger;