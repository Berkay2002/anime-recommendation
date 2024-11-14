import Link from 'next/link';
import TrendingSection from '../components/TrendingSection';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="text-center">
        <h2 className="text-2xl font-bold text-blue-600">Welcome to Anime Recommender</h2>
        <p className="text-gray-700 mt-2">Discover new anime based on your preferences and recommendations.</p>
      </section>

      <TrendingSection />

      <section className="text-center mt-8">
        <Link href="/info" className="text-blue-500 hover:underline">Learn more about this project</Link>
      </section>
    </div>
  );
}
