import { getAnime } from "@/services/animeService";
import TopRankedSection from "./TopRankedSection";
import TrendingSection from "./TrendingSection";

interface Anime {
    anime_id: number;
    English?: string;
    Japanese?: string;
    image_url?: string;
    Popularity?: number;
}

interface AnimeSectionsProps {
    onSelectAnime: (anime: Anime) => void;
    selectedAnimeIdSet: Set<number>;
}

export default async function AnimeSections({ onSelectAnime, selectedAnimeIdSet }: AnimeSectionsProps) {
    const trendingAnime = await getAnime({ sortBy: 'Popularity', limit: 30, page: 1, withEmbeddings: false });
    const topRankedAnime = await getAnime({ sortBy: 'Rank', limit: 30, page: 1, withEmbeddings: false });

    return (
        <>
            <TrendingSection
                initialData={trendingAnime.anime}
                onSelectAnime={onSelectAnime}
                selectedAnimeIdSet={selectedAnimeIdSet}
            />
            <TopRankedSection
                initialData={topRankedAnime.anime}
                onSelectAnime={onSelectAnime}
                selectedAnimeIdSet={selectedAnimeIdSet}
            />
        </>
    );
}
