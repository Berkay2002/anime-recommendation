'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { logger } from '@/lib/logger'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minute default
          gcTime: 5 * 60 * 1000, // 5 minutes cache retention
          refetchOnWindowFocus: false,
          retry: (failureCount, error) => {
            // Log retries
            if (failureCount > 0) {
              logger.warn({ error, failureCount }, 'Query retrying')
            }
            return failureCount < 2 // Max 2 retries
          },
        },
      },
    })

    // Enable query logging in development
    if (process.env.NODE_ENV === 'development') {
      const queryCache = client.getQueryCache()
      queryCache.subscribe({
        onQueryAdded: (query) => {
          logger.debug({ queryKey: query.queryKey }, 'Query added')
        },
      })
    }

    return client
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </QueryClientProvider>
  )
}
