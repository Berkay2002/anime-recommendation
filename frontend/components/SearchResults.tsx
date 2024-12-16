// components/SearchResults.tsx

interface Anime {
    anime_id: number;
    title: string;
    image_url?: string;
  }
  
  interface SearchResultsProps {
    results: Anime[];
  }
  
  export default function SearchResults({ results }: SearchResultsProps) {
    return (
      <div className="mt-4">
        {results.length > 0 ? (
          <ul className="space-y-4">
            {results.map((anime) => (
              <li key={anime.anime_id}>
                <a href={`/anime/${anime.anime_id}`} className="flex items-center">
                  {anime.image_url && (
                    <img src={anime.image_url} alt={anime.title} className="w-12 h-12 mr-4 rounded" />
                  )}
                  <span className="text-lg font-semibold">{anime.title}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No results found.</p>
        )}
      </div>
    );
  }