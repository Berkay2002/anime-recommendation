// Dynamic route for anime detail pages

// app/anime/[id]/page.js
import { useRouter } from "next/router";
import Link from "next/link";

export default function AnimeDetailPage() {
  const router = useRouter();
  const { id } = router.query; // Capture the anime ID from the URL

  // Placeholder data - Replace with actual data fetching logic
  const animeData = {
    title: "Sample Anime Title",
    description: "This is a placeholder description for the anime.",
    genres: ["Action", "Adventure"],
    rating: "PG-13",
  };

  return (
    <div className="container mx-auto p-4">
        <Link href="/" className="text-blue-500 hover:underline">← Back to Home</Link>


      <div className="mt-4 bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold text-blue-600">{animeData.title}</h1>
        <p className="text-gray-700 mt-2">{animeData.description}</p>

        <div className="mt-4">
          <h3 className="font-semibold">Genres:</h3>
          <ul className="list-disc list-inside text-gray-600">
            {animeData.genres.map((genre, index) => (
              <li key={index}>{genre}</li>
            ))}
          </ul>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold">Rating:</h3>
          <p className="text-gray-600">{animeData.rating}</p>
        </div>
      </div>
    </div>
  );
}
