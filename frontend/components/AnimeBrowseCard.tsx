"use client"

import Image from "next/image"
import Link from "next/link"
import { Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Anime {
  anime_id: number
  title: string
  image_url?: string
  Genres?: string[]
  Score?: number
  Rank?: number
  Description?: string
}

interface AnimeBrowseCardProps {
  anime: Anime
}

const formatScore = (score?: number) => {
  if (typeof score !== "number" || !Number.isFinite(score)) return "N/A"
  return score.toFixed(2)
}

const AnimeBrowseCard: React.FC<AnimeBrowseCardProps> = ({ anime }) => {
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:gap-4 sm:p-5">
        <Link
          href={`/anime/${anime.anime_id}`}
          className="relative aspect-[2/3] w-full shrink-0 overflow-hidden rounded-lg sm:w-36 md:w-40"
        >
          <Image
            src={anime.image_url || "/placeholder.jpg"}
            alt={anime.title || "Anime poster"}
            fill
            sizes="(max-width: 640px) 100vw, 160px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            quality={80}
          />
        </Link>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <Link
              href={`/anime/${anime.anime_id}`}
              className="text-base font-semibold text-foreground transition-colors hover:text-primary"
            >
              {anime.title}
            </Link>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 self-start rounded-full bg-amber-400/20 px-2 py-0.5 text-xs font-semibold text-amber-600 sm:self-auto">
                    <Star className="size-3 fill-current" />
                    <span>{formatScore(anime.Score)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Score</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {anime.Description && (
            <p className="line-clamp-3 text-sm text-muted-foreground">
              {anime.Description}
            </p>
          )}

          {anime.Genres?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {anime.Genres.slice(0, 3).map((genre) => (
                <Badge key={genre} variant="outline" className="text-xs">
                  {genre}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

export default AnimeBrowseCard
