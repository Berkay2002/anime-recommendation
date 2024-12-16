"use client";

import React, { useEffect, useState, useRef } from 'react';
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
  const [filteredAnimeList, setFilteredAnimeList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apiUrl = '/api/anime/features?limit=500'; // Ensure this URL is correct
    console.log(`Fetching data from ${apiUrl}`);

    fetch(apiUrl)
      .then(response => {
        console.log(`Response status: ${response.status}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Data fetched successfully:', data);
        // Log each anime item to check the data structure
        data.forEach((anime: Anime) => {
          console.log('Fetched anime:', anime);
          console.log('Description:', anime.Description); // Debugging Description
        });
        setAnimeList(data);
        setFilteredAnimeList(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching anime list:', error);
        setError(`Failed to load anime list. Please try again later. Error: ${error.message}`);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    console.log('Selected Genres:', selectedGenres);
    console.log('Anime List:', animeList);

    if (selectedGenres.length > 0) {
      const filtered = animeList.filter(anime => {
        console.log('Checking anime:', anime.title, 'Genres:', anime.Genres);
        return anime.Genres && selectedGenres.every(selectedGenre =>
          anime.Genres.some(genre => genre.toLowerCase() === selectedGenre.toLowerCase())
        );
      });
      console.log('Filtered List:', filtered);
      const sorted = filtered.sort((a, b) => b.rating - a.rating);
      console.log('Sorted List:', sorted);
      setFilteredAnimeList(sorted);
    } else {
      setFilteredAnimeList(animeList);
    }
  }, [selectedGenres, animeList]);

  const handleGenreChange = (genre: string) => {
    setSelectedGenres(prevSelectedGenres =>
      prevSelectedGenres.includes(genre)
        ? prevSelectedGenres.filter(g => g !== genre)
        : [...prevSelectedGenres, genre]
    );
  };

  const handleDropdownToggle = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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