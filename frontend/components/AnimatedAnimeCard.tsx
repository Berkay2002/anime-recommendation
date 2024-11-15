// frontend/components/AnimatedAnimeCard.tsx

import { motion } from 'framer-motion';
import AnimeCard from './AnimeCard';

interface Anime {
  anime_id: number;
  English?: string;
  Japanese?: string;
  image_url?: string;
}

interface AnimatedAnimeCardProps {
  anime: Anime;
  cardRef: React.RefObject<HTMLDivElement>;
  iconType: 'plus' | 'minus';
  onSelect: (anime: Anime) => void;
}

const AnimatedAnimeCard: React.FC<AnimatedAnimeCardProps> = ({ anime, cardRef, iconType, onSelect }) => {
  return (
    <motion.div
      key={anime.anime_id}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AnimeCard
        anime={anime}
        cardRef={cardRef}
        iconType={iconType}
        onSelect={onSelect}
      />
    </motion.div>
  );
};

export default AnimatedAnimeCard;