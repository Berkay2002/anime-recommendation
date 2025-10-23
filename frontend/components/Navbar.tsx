"use client";

// components/Navbar.tsx

import Link from 'next/link';
import SearchBar from './SearchBar'; // Adjust the path as necessary

const Navbar: React.FC = () => {
  return (
    <nav className="bg-gray-800 p-4 pb-6">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-teal-500 text-5xl font-bold">
          <Link href="/">AniMatch</Link>
        </div>
        <div className="grow mx-6 max-w-xl">
          <SearchBar />
        </div>
        <div className="space-x-6">
          <Link href="/" className="text-white text-2xl hover:text-teal-500 transition-colors duration-200">Home</Link>
          <Link href="/anime" className="text-white text-2xl hover:text-teal-500 transition-colors duration-200">Anime</Link>
          {/* Add other links as necessary */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;