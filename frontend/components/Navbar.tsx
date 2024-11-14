"use client";

import Link from 'next/link';
import SearchBar from './SearchBar'; // Adjust the path as necessary

const Navbar: React.FC = () => {
  async function handleSearch(searchTerm: string): Promise<void> {
    if (!searchTerm) return;

    try {
      const response = await fetch(`/api/search?query=${searchTerm}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log('Search results:', data);
      // You can add further logic to handle the search results here
    } catch (error) {
      console.error('Error during search:', error);
    }
  }

  return (
    <nav className="bg-gray-800 p-4 pb-6">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-teal-500 text-5xl font-bold">
          <Link href="/">AniMatch</Link>
        </div>
        <div className="flex-grow mx-6 max-w-xl">
          <SearchBar onSearch={handleSearch} />
        </div>
        <div className="space-x-6">
          <Link href="/" className="text-white text-2xl hover:text-teal-500 transition-colors duration-200">Home</Link>
          <Link href="/anime" className="text-white text-2xl hover:text-teal-500 transition-colors duration-200">Anime</Link>
          <Link href="/info" className="text-white text-2xl hover:text-teal-500 transition-colors duration-200">Info</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;