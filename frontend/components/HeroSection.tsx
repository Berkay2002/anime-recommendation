"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useRef, useSyncExternalStore } from "react"

import { useFetchData } from "@/hooks/useFetchData"
import { Button } from "@/components/ui/button"

interface Anime {
  anime_id: number
  title?: string
  English?: string
  english_title?: string
  Japanese?: string
  japanese_title?: string
  image_url?: string
  banner_image?: string | null
  cover_image?: string | null
}

const AUTO_ROTATE_MS = 7000

const useIntervalNow = (intervalMs: number) => {
  const lastSnapshotRef = useRef(0)

  return useSyncExternalStore(
    (onStoreChange) => {
      lastSnapshotRef.current = Date.now()
      onStoreChange()
      const intervalId = setInterval(() => {
        lastSnapshotRef.current = Date.now()
        onStoreChange()
      }, intervalMs)
      return () => clearInterval(intervalId)
    },
    () => lastSnapshotRef.current,
    () => 0
  )
}

const resolveAnimeTitle = (anime?: Anime | null) =>
  anime?.title ||
  anime?.English ||
  anime?.english_title ||
  anime?.Japanese ||
  anime?.japanese_title ||
  "Untitled anime"

const HeroSection = () => {
  const [data, loading] = useFetchData<Anime[]>(
    "/api/anime?type=trending&limit=5&includeBanner=true"
  )
  const heroList = useMemo(
    () => (Array.isArray(data) ? data.slice(0, 5) : []),
    [data]
  )
  const now = useIntervalNow(AUTO_ROTATE_MS)
  const activeIndex = heroList.length
    ? Math.floor(now / AUTO_ROTATE_MS) % heroList.length
    : 0
  const heroAnime = heroList[activeIndex] ?? null
  const heroTitle = resolveAnimeTitle(heroAnime)
  const heroBanner = heroAnime?.banner_image ?? null
  const canLink = Boolean(heroAnime?.anime_id)

  return (
    <section className="relative h-[55vh] overflow-hidden bg-background">
      <div className="absolute inset-0">
        {heroBanner ? (
          <Image
            src={heroBanner}
            alt={heroTitle}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <div className="relative">
        <div className="container mx-auto px-4 pb-20 pt-10 sm:px-6 lg:pb-24 lg:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <div className="space-y-5">
              {loading && !heroAnime ? (
                <div className="space-y-4">
                  <div className="h-10 w-3/4 animate-pulse rounded-full bg-foreground/10" />
                  <div className="h-10 w-28 animate-pulse rounded-md bg-foreground/10" />
                </div>
              ) : (
                <>
                  <h1 className="max-w-xl text-3xl font-semibold tracking-tight text-foreground drop-shadow-sm sm:text-4xl lg:text-5xl">
                    {heroTitle}
                  </h1>
                  {canLink ? (
                    <Button
                      asChild
                      variant="outline"
                      className="border-border/70 bg-background/70 text-foreground hover:bg-background/90"
                    >
                      <Link href={`/anime/${heroAnime?.anime_id}`}>Detail</Link>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      disabled
                      className="border-border/70 bg-background/70 text-foreground"
                    >
                      Detail
                    </Button>
                  )}
                </>
              )}
            </div>

            <div className="hidden lg:block" />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-background" />
    </section>
  )
}

export default HeroSection
