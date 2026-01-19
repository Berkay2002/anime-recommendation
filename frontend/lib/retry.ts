import logger from '@/lib/logger';

const retryLogger = logger.child({ service: 'RetryUtility' });

/**
 * Configuration options for retry behavior
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds before first retry (default: 1000ms) */
  baseDelay?: number;
  /** Maximum delay cap in milliseconds (default: 10000ms) */
  maxDelay?: number;
  /** Function to determine if an error is retryable (default: retries network errors and 5xx/429 status codes) */
  shouldRetry?: (error: any) => boolean;
  /** Callback called before each retry attempt with attempt number and error */
  onRetry?: (attempt: number, error: any, delay: number) => void;
}

/**
 * Default error detection function that determines if an error is retryable
 *
 * Retries on:
 * - Network errors (no response object)
 * - 5xx server errors
 * - 429 rate limit errors
 *
 * Does not retry:
 * - 4xx client errors (400-499 except 429)
 */
function defaultShouldRetry(error: any): boolean {
  // Network error (no response object) - retry
  if (!error?.response) {
    return true;
  }

  // Check HTTP status code
  const status = error.response?.status;

  // Rate limit error (429) - retry
  if (status === 429) {
    return true;
  }

  // 5xx server errors - retry
  if (status && status >= 500 && status < 600) {
    return true;
  }

  // 4xx client errors - don't retry
  if (status && status >= 400 && status < 500) {
    return false;
  }

  // Unknown error - don't retry
  return false;
}

/**
 * Calculates exponential backoff delay with jitter
 *
 * Formula: baseDelay * 2^attempt
 * Capped at maxDelay
 * With jitter: delay * (0.5 + Math.random() * 0.5)
 *
 * @param attempt - Current retry attempt (0-indexed)
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay cap in milliseconds
 * @returns Delay in milliseconds
 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  // Calculate exponential backoff: 1s, 2s, 4s, 8s, ...
  const exponentialDelay = baseDelay * Math.pow(2, attempt);

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, maxDelay);

  // Add jitter to avoid thundering herd problem
  // Random multiplier between 0.5 and 1.0
  const jitter = 0.5 + Math.random() * 0.5;

  return Math.floor(cappedDelay * jitter);
}

/**
 * Retries an async function with exponential backoff and jitter
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration options
 * @returns Promise that resolves with the function result or rejects with the last error
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   async () => {
 *     return await axios.get('/api/data');
 *   },
 *   {
 *     maxRetries: 3,
 *     onRetry: (attempt, error, delay) => {
 *       console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms`);
 *     }
 *   }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000, // 1 second
    maxDelay = 10000, // 10 seconds
    shouldRetry = defaultShouldRetry,
    onRetry,
  } = options || {};

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Try to execute the function
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if this is the last attempt or error is not retryable
      const isLastAttempt = attempt === maxRetries;
      const retryable = shouldRetry(error);

      if (isLastAttempt || !retryable) {
        // Don't retry - throw the error immediately
        const reason = isLastAttempt ? 'Max retries exceeded' : 'Non-retryable error';
        retryLogger.debug({
          attempt: attempt + 1,
          maxRetries: maxRetries + 1,
          retryable,
          error: lastError.message || lastError,
        }, `${reason} - throwing error`);
        throw error;
      }

      // Calculate delay for next retry
      const delay = calculateDelay(attempt, baseDelay, maxDelay);

      // Log retry attempt
      retryLogger.debug({
        attempt: attempt + 1,
        maxRetries: maxRetries + 1,
        error: lastError.message || lastError,
        delay,
        nextAttemptIn: `${delay}ms`,
      }, 'Retrying request after exponential backoff');

      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, error, delay);
      }

      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError;
}
