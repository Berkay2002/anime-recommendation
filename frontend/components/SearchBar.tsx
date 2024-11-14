// /frontend/components/SearchBar.tsx
"use client";

import React, { useState } from 'react';

interface SearchBarProps {
    onSearch: (searchTerm: string) => void;
    }

export default function SearchBar({ onSearch }: SearchBarProps) {
    const [searchText, setSearchText] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(searchText);
    };

    return (
      <form onSubmit={handleSearch} className="flex justify-center items-center mt-4">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search"
          className="w-3/4 md:w-1/2 p-2 rounded-lg outline-none bg-gray-100 text-black placeholder-gray-500 text-center text-xl"
        />
        {/* Remove the search button if it exists */}
        {/* <button type="submit" className="hidden">Search</button> */}
      </form>
    )
}