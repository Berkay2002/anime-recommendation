import { type PointerEvent, useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Command as CommandPrimitive } from 'cmdk'
import { SearchIcon } from 'lucide-react'

import {
  Command,
  CommandEmpty,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  InputGroup,
  InputGroupAddon,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import { LoadingSpinner } from "@/components/loading"
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut"
import { useClickOutside } from "@/hooks/useClickOutside"
import { useAnimeSearch } from '@/lib/queries/anime'

const SEARCH_DEBOUNCE_MS = 150

export default function SearchBar() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const { data: searchResults = [], isLoading, error } = useAnimeSearch(debouncedQuery)

  const focusInput = useCallback(() => {
    const input =
      inputRef.current ??
      containerRef.current?.querySelector<HTMLInputElement>(
        'input[data-slot="input-group-control"]'
      ) ??
      containerRef.current?.querySelector<HTMLInputElement>(
        'input[data-slot="command-input"]'
      )
    input?.focus()
    setIsOpen(true)
  }, [])

  useKeyboardShortcut('k', focusInput, {
    ctrlOrCmd: true,
    preventDefault: true
  })

  useClickOutside(containerRef, () => setIsOpen(false), isOpen)

  // Debounce search query
  useEffect(() => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery) {
      setDebouncedQuery('')
      return
    }
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(trimmedQuery)
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timeout)
  }, [query])

  const shouldShowResults = isOpen && debouncedQuery.trim().length > 0 && (isLoading || searchResults.length > 0 || !!error)

  const handleResultsPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "mouse") {
        inputRef.current?.blur()
      }
    },
    [inputRef]
  )

  return (
    <div ref={containerRef} className="relative">
      <Command
        shouldFilter={false}
        className="relative overflow-visible"
      >
        <InputGroup className="bg-background text-foreground shadow-xs transition-colors has-[[data-slot=input-group-control]:focus-visible]:border-primary has-[[data-slot=input-group-control]:focus-visible]:ring-0">
          <InputGroupAddon className="pl-3 text-muted-foreground"><SearchIcon className="size-4" /></InputGroupAddon>
          <CommandPrimitive.Input
            data-slot="input-group-control"
            value={query}
            onValueChange={(value) => { setQuery(value); setIsOpen(true) }}
            onFocus={() => setIsOpen(true)}
            placeholder='Search anime...'
            className="placeholder:text-muted-foreground flex-1 rounded-none border-0 bg-transparent py-1.5 text-sm shadow-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
            ref={inputRef}
          />
          <InputGroupAddon align="inline-end" className="hidden gap-1 text-muted-foreground sm:flex">
            <Kbd>Ctrl</Kbd><Kbd>K</Kbd>
          </InputGroupAddon>
        </InputGroup>

        {shouldShowResults && (
          <div
            role="status"
            aria-live="polite"
            aria-busy={isLoading}
            className="absolute left-0 right-0 top-full z-50 mt-2 rounded-md border bg-popover text-popover-foreground shadow-lg"
            onPointerDown={handleResultsPointerDown}
          >
            <CommandList className="max-h-64">
              {isLoading ? (
                <div className="flex items-center justify-center px-3 py-4">
                  <LoadingSpinner size="sm" message="Searching..." />
                </div>
              ) : searchResults.length === 0 ? (
                <CommandEmpty className="py-6 text-sm text-muted-foreground">No anime found</CommandEmpty>
              ) : (
                searchResults.map((anime) => (
                  <CommandItem
                    key={anime.anime_id}
                    value={anime.title}
                    onSelect={() => {
                      setIsOpen(false)
                      setQuery('')
                      router.push(`/anime/${anime.anime_id}`)
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {anime.image_url ? (
                        <Image
                          src={anime.image_url}
                          alt={anime.title}
                          width={56}
                          height={80}
                          className="h-20 w-14 rounded-sm object-cover"
                          quality={80}
                        />
                      ) : (
                        <div className="bg-muted flex h-20 w-14 items-center justify-center rounded-sm text-xs text-muted-foreground">N/A</div>
                      )}
                      <span className="text-base font-medium">{anime.title}</span>
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandList>
          </div>
        )}
      </Command>
    </div>
  )
}
