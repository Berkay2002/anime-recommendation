// /frontend/components/TrendingSection.js
"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function TrendingSection() {
  const [trendingAnime, setTrendingAnime] = useState([]);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const containerRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    async function fetchTrendingAnime() {
      try {
        const response = await fetch('/api/anime/trending');
        const data = await response.json();
        setTrendingAnime(data);
      } catch (error) {
        console.error('Failed to fetch trending anime:', error);
      }
    }
    fetchTrendingAnime();
  }, []);

  const calculateScrollAmount = () => {
    const containerWidth = containerRef.current.offsetWidth;
    const cardWidth = cardRef.current ? cardRef.current.offsetWidth : 200;
    const visibleCards = Math.floor(containerWidth / cardWidth);
    return visibleCards * cardWidth;
  };

  const scrollLeft = () => {
    const scrollAmount = calculateScrollAmount();
    containerRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  };

  const scrollRight = () => {
    const scrollAmount = calculateScrollAmount();
    containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleScroll = () => {
    const container = containerRef.current;
    const scrollLeft = container.scrollLeft;
    const maxScrollLeft = container.scrollWidth - container.clientWidth;

    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < maxScrollLeft - 1);
  };

  useEffect(() => {
    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);

    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [trendingAnime]);

return (
    <section className="relative">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Trending</h3>
        <div className="relative flex items-center">
            {showLeftArrow && (
                <button
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white rounded-full p-3 z-10 hover:bg-gray-700 transition-shadow duration-200 shadow-md"
                    onClick={scrollLeft}
                >
                    &larr;
                </button>
            )}

            <div
                className="flex space-x-4 overflow-hidden scrollbar-hide"
                ref={containerRef}
                style={{
                    display: 'flex',
                    gap: '1rem',
                    overflowX: 'auto',
                    scrollBehavior: 'smooth',
                }}
            >
                {trendingAnime.map((anime) => (
                    <div key={anime._id} className='ml-4'>
                        <Link href={`/anime/${anime._id}`} style={{ textDecoration: 'none' }}>
                            <div
                                ref={cardRef}
                                className="min-w-[200px] h-[300px] relative cursor-pointer rounded-lg overflow-hidden hover:shadow-lg transition-transform duration-300 ease-in-out group"
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
                                    src={anime.image_url}
                                    alt={anime.title}
                                    width={266}
                                    height={400}
                                    className="object-cover w-full h-full rounded-lg"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-50 text-black p-2">
                                    <div className="text-lg font-bold">{anime.title}</div>
                                    <div className="text-sm">{anime.Score}</div>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>

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
