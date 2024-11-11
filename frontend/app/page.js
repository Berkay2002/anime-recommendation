// app/page.js
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="text-center">
        <h2 className="text-2xl font-bold text-blue-600">Welcome to Anime Recommender</h2>
        <p className="text-gray-700 mt-2">Discover new anime based on your preferences and recommendations.</p>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-gray-800">Recommended for You</h3>
        {/* Placeholder for recommendation cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {/* Example anime card */}
          <div className="p-4 bg-white rounded shadow">
            <h4 className="font-semibold text-lg">Anime Title</h4>
            <p className="text-gray-600">Description of the anime...</p>
            <Link href="/anime/1" className="text-blue-500 hover:underline mt-2 block">View Details</Link>
          </div>
          {/* Add more cards here dynamically */}
        </div>
      </section>

      <section className="text-center mt-8">
        <Link href="/info" className="text-blue-500 hover:underline">Learn more about this project</Link>
      </section>
    </div>
  );
}
