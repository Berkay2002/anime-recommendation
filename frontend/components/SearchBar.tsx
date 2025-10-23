import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"

type Anime = {
  anime_id: number
  title: string
  image_url?: string
}

const SEARCH_DEBOUNCE_MS = 300
const SEARCH_ENDPOINT = "/api/anime/search"

export default function SearchBar() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Anime[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const focusInput = useCallback(() => {
    const input = containerRef.current?.querySelector<HTMLInputElement>(
      'input[data-slot="command-input"]'
    )
    if (input) {
      input.focus()
      setIsOpen(true)
    }
  }, [])

  useEffect(() => {
    const handleGlobalShortcut = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "k" ||
        !(event.metaKey || event.ctrlKey) ||
        event.altKey ||
        event.shiftKey
      ) {
        return
      }

      const target = event.target as HTMLElement | null
      if (!target) return

      const isEditable =
        target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)

      if (isEditable) return

      event.preventDefault()
      focusInput()
    }

    window.addEventListener("keydown", handleGlobalShortcut)
    return () => window.removeEventListener("keydown", handleGlobalShortcut)
  }, [focusInput])

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick)
    document.addEventListener("touchstart", closeOnOutsideClick)

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick)
      document.removeEventListener("touchstart", closeOnOutsideClick)
    }
  }, [])

  useEffect(() => {
    if (query.trim() === "") {
      setResults([])
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    const searchTimeout = window.setTimeout(async () => {
      try {
        setIsLoading(true)
        const response = await fetch(
          `${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`)
        }

        const data: Anime[] = await response.json()
        setResults(data)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
        console.error("Error performing search:", error)
      } finally {
        setIsLoading(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(searchTimeout)
      controller.abort()
    }
  }, [query])

  const handleSelect = (animeId: number) => {
    setIsOpen(false)
    setQuery("")
    setResults([])
    router.push(`/anime/${animeId}`)
  }

  const shouldShowResults = isOpen && query.trim().length > 0

  return (
    <div ref={containerRef} className="relative">
      <Command
        shouldFilter={false}
        className="bg-background text-foreground relative mb-0.5 rounded-md border shadow-xs overflow-visible"
      >
        <CommandInput
          value={query}
          onValueChange={(value) => {
            setQuery(value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search anime..."
        />
        <div className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 transform items-center gap-1 sm:flex">
          <Kbd>Ctrl</Kbd>
          <span className="text-xs text-muted-foreground">+</span>
          <Kbd>K</Kbd>
        </div>

        {shouldShowResults && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-md border bg-popover text-popover-foreground shadow-lg">
            <CommandList className="max-h-64">
              {!isLoading && (
                <CommandEmpty className="py-6 text-sm text-muted-foreground">
                  No anime found
                </CommandEmpty>
              )}

              {isLoading ? (
                <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Searching...
                </div>
              ) : (
                results.map((anime) => (
                  <CommandItem
                    key={anime.anime_id}
                    value={anime.title}
                    onSelect={() => handleSelect(anime.anime_id)}
                  >
                    <div className="flex items-center gap-3">
                      {anime.image_url ? (
                        <Image
                          src={anime.image_url}
                          alt={anime.title}
                          width={56}
                          height={80}
                          className="h-20 w-14 rounded-sm object-cover"
                        />
                      ) : (
                        <div className="bg-muted flex h-20 w-14 items-center justify-center rounded-sm text-xs text-muted-foreground">
                          N/A
                        </div>
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
