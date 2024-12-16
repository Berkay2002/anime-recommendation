// components/SearchBar.tsx

import { useState, useEffect } from 'react';

type Anime = {
  anime_id: number;
  title: string;
  image_url?: string;
  // Add other fields as necessary
};

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Anime[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim() === '') {
        setResults([]);
        return;
      }
      try {
        const response = await fetch(`/api/anime/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`);
        }
        const data: Anime[] = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Error performing search:', error);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchResults();
    }, 300); // Debounce delay

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowDropdown(true);
  };

  const handleSelect = () => {
    setShowDropdown(false);
    setQuery('');
    setResults([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim() === '') {
      e.preventDefault();
      // Optionally, display a message to the user to type something
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search anime..."
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}

        className="border p-2 rounded w-full text-black placeholder-black"
      />
      {showDropdown && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
          {results.map((anime) => (
            <li key={anime.anime_id}>
              <a
                href={`/anime/${anime.anime_id}`}
                className="flex items-center px-4 py-2 hover:bg-gray-100"
                onClick={handleSelect}
              >
                {anime.image_url && (
                  <img src={anime.image_url} alt={anime.title} className="w-8 h-8 mr-2 rounded" />
                )}
                <span className="text-lg font-semibold text-black">{anime.title}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}