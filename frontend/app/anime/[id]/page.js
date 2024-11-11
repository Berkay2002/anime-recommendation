// frontend/app/anime/[id]/page.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function AnimeDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [anime, setAnime] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    async function fetchAnimeData() {
      const animeResponse = await fetch(`/api/anime/${id}`);
      const animeData = await animeResponse.json();
      setAnime(animeData);

      const recommendationsResponse = await fetch(`/api/recommendations/${id}`);
      const recommendationsData = await recommendationsResponse.json();
      setRecommendations(recommendationsData);
    }

    if (id) fetchAnimeData();
  }, [id]);

  return (
    <div className="container mx-auto p-4">
      {anime && (
        <>
          <h1 className="text-2xl font-bold text-blue-600">{anime.title}</h1>
          <p className="text-gray-700 mt-2">{anime.description}</p>

          <h2 className="mt-4 text-xl font-semibold">Recommendations:</h2>
          <ul className="mt-2 space-y-1">
            {recommendations.map((rec) => (
              <li key={rec.anime_id} className="text-blue-500">
                {rec.title}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
