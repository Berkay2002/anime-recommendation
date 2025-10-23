// AnimeCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { MutableRefObject, useState, useCallback, memo } from 'react';
import { FaPlus, FaMinus } from 'react-icons/fa';

interface Anime {
  anime_id: number;
  English?: string;
  Japanese?: string;
  image_url?: string;
}

interface AnimeCardProps {
  anime: Anime;
  cardRef: MutableRefObject<HTMLDivElement | null>;
  iconType: 'plus' | 'minus';
  onSelect?: (anime: Anime) => void;
  onRemove?: (anime: Anime) => void;
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime, cardRef, iconType, onSelect, onRemove }) => {
  const [visible, setVisible] = useState(true);

  const handleClick = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      if (iconType === 'plus' && onSelect) {
        onSelect(anime);
      } else if (iconType === 'minus' && onRemove) {
        onRemove(anime);
      }
    }, 300);
  }, [iconType, onSelect, onRemove, anime]);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'scale(1.05)';
  }, []);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'scale(1)';
  }, []);

  return (
    <div key={anime.anime_id} className={`ml-4 anime-card ${visible ? 'fade-in' : 'fade-out'}`} ref={cardRef}>
      <div
        className="min-w-[200px] h-[300px] relative rounded-lg overflow-hidden hover:shadow-lg transition-transform duration-300 ease-in-out group mt-4 mb-4 mr-6"
        style={{
          transform: 'scale(1)',
          transition: 'transform 0.3s ease',
          color: 'black',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Link href={`/anime/${anime.anime_id}`} style={{ textDecoration: 'none' }}>
          <div className="cursor-pointer">
            <Image
              src={anime.image_url || '/placeholder.png'}
              alt={anime.English || anime.Japanese || 'No title'}
              width={200}
              height={300}
              className="object-cover w-full h-full rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
              <div className="text-lg font-bold">{anime.English || anime.Japanese || 'No title'}</div>
            </div>
          </div>
        </Link>
        <div
          className="absolute top-2 right-2 bg-white p-1 rounded-full cursor-pointer z-10"
          onClick={(e) => {
            e.stopPropagation(); // Prevent the link from being triggered
            handleClick();
          }}
        >
          {iconType === 'plus' ? (
            <FaPlus color="black" />
          ) : (
            <FaMinus color="black" />
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(AnimeCard);