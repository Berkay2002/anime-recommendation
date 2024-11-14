// /frontend/components/TrendingSection.tsx

"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Anime {
  anime_id: number;
  English?: string;
  Synonyms?: string;
  Japanese?: string;
  image_url?: string;
  Popularity?: number;
  Rank?: number;
  Score?: number;
  Description?: string;
  // ...add other fields as necessary
}

export default function TrendingSection() {
  const [trendingAnime, setTrendingAnime] = useState<Anime[]>([]);
  const [showLeftArrow, setShowLeftArrow] = useState<boolean>(true);
  const [showRightArrow, setShowRightArrow] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchTrendingAnime() {
      try {
        const response = await fetch('/api/anime/features?sortBy=Popularity'); // Updated fetch URL with sortBy
        const data = await response.json();

        // Remove frontend sorting
        // const sortedData = data.sort((a: Anime, b: Anime) => a.Popularity - b.Popularity);
        setTrendingAnime(data); // Set data as already sorted by the API
      } catch (error) {
        console.error('Failed to fetch trending anime:', error);
      }
    }
    fetchTrendingAnime();
  }, []);

  const calculateScrollAmount = () => {
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const cardWidth = cardRef.current ? cardRef.current.offsetWidth : 200;
    const visibleCards = Math.floor(containerWidth / cardWidth);
    return visibleCards * cardWidth;
  };

  const scrollLeft = () => {
    const scrollAmount = calculateScrollAmount();
    containerRef.current?.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  };

  const scrollRight = () => {
    const scrollAmount = calculateScrollAmount();
    containerRef.current?.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (container) {
      const scrollLeft = container.scrollLeft;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;

      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < maxScrollLeft - 1);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    container?.addEventListener('scroll', handleScroll);

    handleScroll();

    return () => container?.removeEventListener('scroll', handleScroll);
  }, [trendingAnime]);

  return (
    <section className="relative">
        <h3 className="text-xl font-semibold text-white mt-4 ml-9">Trending</h3>
        <div className="relative flex items-center overflow-visible">

            <div
                className="flex space-x-4 overflow-hidden scrollbar-hide pl-6 h-350"
                ref={containerRef}
                style={{
                    display: 'flex',
                    gap: '0.3rem',
                    overflowX: 'auto',
                    scrollBehavior: 'smooth',
                }}
            >
                {trendingAnime.map((anime) => (
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
                ))}
            </div>

            {showLeftArrow && (
                <button
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white rounded-full p-3 z-10 hover:bg-gray-700 transition-shadow duration-200 shadow-md"
                    onClick={scrollLeft}
                >
                    &larr;
                </button>
            )}
            {showRightArrow && (
                <button
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white rounded-full p-3 z-10 hover:bg-gray-700 transition-shadow duration-200 shadow-md"
                    onClick={scrollRight}
                >
                    &rarr;
                </button>
            )}
        </div>

        <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
                display: none;
            }
            .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
        `}</style>
    </section>
  );
}