import { type PointerEvent, useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Command as CommandPrimitive } from "cmdk"
import { Loader2, SearchIcon } from "lucide-react"

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
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Anime[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const focusInput = useCallback(() => {
    const input =
      inputRef.current ??
      containerRef.current?.querySelector<HTMLInputElement>(
        'input[data-slot="input-group-control"]'
      ) ??
      containerRef.current?.querySelector<HTMLInputElement>(
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

  const handleResultsPointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "mouse") {
        inputRef.current?.blur()
      }
    },
    []
  )

  return (
    <div ref={containerRef} className="relative">
      <Command
        shouldFilter={false}
        className="relative overflow-visible"
      >
        <InputGroup className="bg-background text-foreground shadow-xs transition-colors has-[[data-slot=input-group-control]:focus-visible]:border-primary has-[[data-slot=input-group-control]:focus-visible]:ring-0">
          <InputGroupAddon className="pl-3 text-muted-foreground">
            <SearchIcon className="size-4" />
          </InputGroupAddon>
          <CommandPrimitive.Input
            data-slot="input-group-control"
            value={query}
            onValueChange={(value) => {
              setQuery(value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search anime..."
            className="placeholder:text-muted-foreground flex-1 rounded-none border-0 bg-transparent py-1.5 text-sm shadow-none focus:outline-none focus-visible:outline-none focus-visible:ring-0"
            ref={inputRef}
          />
          <InputGroupAddon
            align="inline-end"
            className="hidden gap-1 text-muted-foreground sm:flex"
          >
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </InputGroupAddon>
        </InputGroup>

        {shouldShowResults && (
          <div
            className="absolute left-0 right-0 top-full z-50 mt-2 rounded-md border bg-popover text-popover-foreground shadow-lg"
            onPointerDown={handleResultsPointerDown}
          >
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
