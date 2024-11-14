"use client";

import Link from 'next/link';
import TrendingSection from '../components/TrendingSection';
import TopRankedSection from '../components/TopRankedSection';
import SearchBar from '../components/SearchBar';

const HomePage: React.FC = () => {
  const handleSearch = (query: string) => {
    // Implement search functionality here
    console.log(`Searching for: ${query}`);
    // Fetch or filter data based on search query
  };

  return (
    <div className="space-y-8">
      <SearchBar onSearch={handleSearch} />
      <TrendingSection />
      <TopRankedSection />
      {/* You can add more sections here if needed */}
    </div>
  );
};

export default HomePage;