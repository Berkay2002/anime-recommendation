import Link from 'next/link';
import Image from 'next/image';
import { MutableRefObject } from 'react';

interface Anime {
  anime_id: number;
  English?: string;
  Japanese?: string;
  image_url?: string;
}

interface AnimeCardProps {
  anime: Anime;
  cardRef: MutableRefObject<HTMLDivElement>;
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime, cardRef }) => {
  return (
    <div key={anime.anime_id} className='ml-4'>
      <Link href={`/anime/${anime.anime_id}`} style={{ textDecoration: 'none' }}>
        <div
          ref={cardRef}
          className="min-w-[200px] h-[300px] relative cursor-pointer rounded-lg overflow-hidden hover:shadow-lg transition-transform duration-300 ease-in-out group mt-4 mb-4 mr-6"
          style={{
            transform: 'scale(1)',
            transition: 'transform 0.3s ease',
            color: 'black'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
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
    </div>
  );
};

export default AnimeCard;