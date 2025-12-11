import Image from "next/image"
import Link from "next/link"
import {
  memo,
  MutableRefObject,
  useCallback,
  useRef,
  useState,
} from "react"
import { Minus, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "./ui/button"
import { Card } from "./ui/card"

interface Anime {
  anime_id: number
  title?: string
  English?: string
  english_title?: string
  Japanese?: string
  japanese_title?: string
  image_url?: string
}

interface AnimeCardProps {
  anime: Anime
  cardRef?: MutableRefObject<HTMLDivElement | null>
  iconType: "plus" | "minus"
  onSelect?: (anime: Anime) => void
  onRemove?: (anime: Anime) => void
  showIcon?: boolean
}

const actionCopy: Record<"plus" | "minus", string> = {
  plus: "Add anime to your selection",
  minus: "Remove anime from your selection",
}

const AnimeCard: React.FC<AnimeCardProps> = ({
  anime,
  cardRef,
  iconType,
  onSelect,
  onRemove,
  showIcon = true,
}) => {
  const [isFading, setIsFading] = useState(false)
  const fallbackRef = useRef<HTMLDivElement>(null)
  const resolvedRef = cardRef ?? fallbackRef

  const handleAction = useCallback(() => {
    if (!iconType) return

    setIsFading(true)

    setTimeout(() => {
      if (iconType === "plus" && onSelect) {
        onSelect(anime)
      } else if (iconType === "minus" && onRemove) {
        onRemove(anime)
      }
    }, 220)
  }, [anime, iconType, onRemove, onSelect])

  const title = anime.title || anime.English || anime.english_title || anime.Japanese || anime.japanese_title || "Untitled"
  const ActionIcon = iconType === "plus" ? Plus : Minus

  return (
    <div
      ref={resolvedRef}
      className={cn(
        "min-w-[10rem] max-w-[10rem] shrink-0 transition duration-300 ease-out sm:min-w-[12rem] sm:max-w-[12rem] lg:min-w-[13rem] lg:max-w-[13rem]",
        isFading ? "opacity-0" : "opacity-100"
      )}
    >
      <Card className="group relative h-full overflow-hidden rounded-2xl border border-border/60 bg-card/90 p-0 text-card-foreground shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        {showIcon && iconType ? (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            aria-label={actionCopy[iconType]}
            className="absolute right-3 top-3 z-20 rounded-full border border-border/80 bg-background/80 text-foreground shadow-sm transition hover:border-primary/40 hover:bg-primary/15 hover:text-primary"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              handleAction()
            }}
          >
            <ActionIcon className="size-4" aria-hidden="true" />
          </Button>
        ) : null}

        <Link href={`/anime/${anime.anime_id}`} className="block h-full">
          <div className="relative h-full">
            <div className="aspect-[2/3] overflow-hidden">
              <Image
                src={anime.image_url || "/placeholder.jpg"}
                alt={title}
                width={320}
                height={480}
                className="size-full object-cover transition duration-500 group-hover:scale-105"
                quality={80}
              />
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/60 to-transparent px-4 pb-4 pt-8">
              <p className="text-sm font-semibold leading-tight tracking-tight text-card-foreground">
                {title}
              </p>
            </div>
          </div>
        </Link>
      </Card>
    </div>
  )
}

export default memo(AnimeCard)
