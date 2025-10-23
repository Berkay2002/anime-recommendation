"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Anime {
  anime_id: number;
  title: string;
  image_url?: string;
  Genres: string[];
  rating: number;
  Description: string; // Assuming Description is part of the anime data
}

const AnimePage: React.FC = () => {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Use metadata endpoint for faster loading (no heavy embeddings needed for list view)
    const apiUrl = '/api/anime/metadata?limit=500';

    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        setAnimeList(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching anime list:', error);
        setError(`Failed to load anime list. Please try again later. Error: ${error.message}`);
        setLoading(false);
      });
  }, []);

  // Memoize the filtered and sorted list to avoid recalculating on every render
  const filteredAnimeList = useMemo(() => {
    if (selectedGenres.length === 0) {
      return animeList;
    }

    // Pre-convert selected genres to lowercase for efficient comparison
    const lowerSelectedGenres = selectedGenres.map(g => g.toLowerCase());

    const filtered = animeList.filter(anime => {
      if (!anime.Genres) return false;
      const lowerAnimeGenres = anime.Genres.map(g => g.toLowerCase());
      return lowerSelectedGenres.every(selectedGenre =>
        lowerAnimeGenres.includes(selectedGenre)
      );
    });

    // Sort by rating (descending)
    return filtered.sort((a, b) => b.rating - a.rating);
  }, [selectedGenres, animeList]);

  const handleGenreChange = useCallback((genre: string) => {
    setSelectedGenres(prevSelectedGenres =>
      prevSelectedGenres.includes(genre)
        ? prevSelectedGenres.filter(g => g !== genre)
        : [...prevSelectedGenres, genre]
    );
  }, []);

  const handleDropdownToggle = useCallback(() => {
    setDropdownOpen(prev => !prev);
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: 1 }}>
        <h1>Anime List</h1>
        <div>
          <label htmlFor="genres">Select Genres:</label>
          <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button onClick={handleDropdownToggle} style={{ width: '200px', color: 'lightblue' }}>
              {selectedGenres.length > 0 ? selectedGenres.join(', ') : 'Select Genres'}
            </button>
            {dropdownOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, width: '200px', border: '1px solid #ccc', backgroundColor: 'white', zIndex: 1, color: 'black' }}>
                {['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Romance', 'Sci-Fi'].map(genre => (
                  <div key={genre} style={{ padding: '5px' }}>
                    <input
                      type="checkbox"
                      value={genre}
                      checked={selectedGenres.includes(genre)}
                      onChange={() => handleGenreChange(genre)}
                    />
                    <label style={{ marginLeft: '5px' }}>{genre}</label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredAnimeList.map(anime => (
            <div key={anime.anime_id} style={{ display: 'flex', marginBottom: '10px' }}>
              <div style={{ flex: 1, cursor: 'pointer' }}>
                {anime.title}
              </div>
              <div style={{ flex: 2, marginLeft: '20px', display: 'flex', alignItems: 'center' }}>
                <Link href={`/anime/${anime.anime_id}`}>
                  <Image
                    src={anime.image_url || "/placeholder.jpg"}
                    alt={anime.title || "Anime Image"}
                    width={200}
                    height={300}
                    className="object-cover w-full h-full rounded-lg"
                  />                  
                </Link>
                <p style={{ color: 'white', marginLeft: '20px' }}>{anime.Description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnimePage;