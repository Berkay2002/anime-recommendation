'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { clientLogger } from '@/lib/client-logger'

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
              clientLogger.warn('Query retrying', { error, failureCount })
            }
            return failureCount < 2 // Max 2 retries
          },
        },
      },
    })

    return client
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} position="bottom" />
    </QueryClientProvider>
  )
}
