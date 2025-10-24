import { motion } from "framer-motion"
import { memo, type RefObject } from "react"

import AnimeCard from "./AnimeCard"

interface Anime {
  anime_id: number
  English?: string
  Japanese?: string
  image_url?: string
}

interface AnimatedAnimeCardProps {
  anime: Anime
  cardRef: RefObject<HTMLDivElement | null>
  iconType?: "plus" | "minus"
  onSelect?: (anime: Anime) => void
  onRemove?: (anime: Anime) => void
  showIcon?: boolean
}

const AnimatedAnimeCard: React.FC<AnimatedAnimeCardProps> = ({
  anime,
  cardRef,
  iconType = "plus",
  onSelect,
  onRemove,
  showIcon = true,
}) => {
  return (
    <motion.div
      key={anime.anime_id}
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 32 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <AnimeCard
        anime={anime}
        cardRef={cardRef}
        iconType={iconType}
        onSelect={onSelect}
        onRemove={onRemove}
        showIcon={showIcon}
      />
    </motion.div>
  )
}

export default memo(AnimatedAnimeCard)
