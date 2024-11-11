// frontend/app/api/anime/[id]/route.js
import { NextResponse } from "next/server";
import clientPromise from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  const client = await clientPromise;
  const db = client.db("animeDB");
  const { id } = params;

  try {
    const anime = await db.collection("anime").findOne({ _id: new ObjectId(id) });
    if (anime) {
      return NextResponse.json(anime);
    } else {
      return NextResponse.json({ message: "Anime not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Failed to fetch anime details:", error);
    return NextResponse.json({ message: "Failed to fetch anime details" }, { status: 500 });
  }
}
