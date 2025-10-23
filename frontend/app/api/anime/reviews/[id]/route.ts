import clientPromise from '../../../../../lib/mongodb';

// Ensure route is dynamically rendered (no caching)
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    const numericId = Number(id);

    if (isNaN(numericId)) {
      console.error("Invalid anime ID format:", id);
      return new Response(JSON.stringify({ message: "Invalid anime ID format" }), { status: 400 });
    }

    console.log("Fetching reviews for anime_id:", numericId);

    const client = await clientPromise;
    const db = client.db("animeDB");

    const review = await db.collection("anime_reviews").findOne(
      { anime_id: numericId },
      {
        projection: {
          anime_id: 1,
          title: 1,
          reviews: 1, // Just fetch reviews as strings
        },
      }
    );

    if (!review) {
      console.error("No reviews found for anime_id:", numericId);
      return new Response(JSON.stringify({ message: `Reviews not found for anime_id: ${numericId}` }), { status: 404 });
    }

    return new Response(JSON.stringify(review), { status: 200 });
  } catch (error) {
    console.error("Failed to fetch reviews for anime_id:", error);
    return new Response(JSON.stringify({ message: "Failed to fetch reviews", error: error.message }), { status: 500 });
  }
}
