// app/info/page.js
import Link from "next/link";

export default function InfoPage() {
  return (
    <div className="container mx-auto p-4">
        <Link href="/" className="text-blue-500 hover:underline">← Back to Home</Link>


      <div className="mt-4 bg-white p-6 rounded-sm shadow-sm">
        <h1 className="text-2xl font-bold text-blue-600">About This Project</h1>
        <p className="text-gray-700 mt-2">
          This Anime Recommendation System is a university project aimed at
          helping users discover anime based on their preferences and similar content.
          Using a static dataset of popular anime, we employ advanced
          recommendation algorithms to suggest anime titles that might interest you.
        </p>

        <h2 className="text-xl font-semibold mt-6">Dataset</h2>
        <p className="text-gray-700 mt-2">
          The dataset used in this project is the Top Anime Dataset 2024, which includes
          details like anime scores, genres, studios, and ratings. All recommendations are generated
          based on this information.
        </p>

        <h2 className="text-xl font-semibold mt-6">Compliance</h2>
        <p className="text-gray-700 mt-2">
          This project respects user privacy and does not collect personal data.
          We comply with GDPR regulations and ensure that any user interactions are handled responsibly.
        </p>
      </div>
    </div>
  );
}
