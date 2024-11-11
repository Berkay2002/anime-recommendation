// frontend/app/api/recommendations/[id]/route.js
import { NextResponse } from "next/server";
import clientPromise from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  const client = await clientPromise;
  const db = client.db("animeDB");
  const { id } = params;

  try {
    const recommendations = await db.collection("recommendations").findOne({ anime_id: new ObjectId(id) });
    if (recommendations) {
      return NextResponse.json(recommendations.similar_anime);
    } else {
      return NextResponse.json({ message: "Recommendations not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Failed to fetch recommendations:", error);
    return NextResponse.json({ message: "Failed to fetch recommendations" }, { status: 500 });
  }
}
