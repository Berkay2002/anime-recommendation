import json
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from pymongo import MongoClient

# Step 1: Connect to MongoDB and Fetch Data
MONGODB_URI = "mongodb+srv://Admin:Admin@recommendation-cluster.mza82o4.mongodb.net/?retryWrites=true&w=majority&appName=recommendation-cluster"
DATABASE_NAME = "animeDB"
COLLECTION_NAME = "anime_general"

client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]
collection = db[COLLECTION_NAME]

# Fetch all anime documents with necessary fields
anime_data = list(collection.find({}, {
    "Score": 1,
    "Rank": 1,
    "Popularity": 1,
    "_id": 1,
    "title": 1
}))

# Ensure the data list is not empty
if not anime_data:
    raise ValueError("No anime data found in the MongoDB collection.")

# Step 2: Extract Relevant Features
scores = np.array([anime.get('Score', 0) for anime in anime_data]).reshape(-1, 1)
ranks = np.array([anime.get('Rank', 0) for anime in anime_data]).reshape(-1, 1)
popularities = np.array([anime.get('Popularity', 0) for anime in anime_data]).reshape(-1, 1)

# Step 3: Normalize features
scaler = MinMaxScaler()
normalized_scores = scaler.fit_transform(scores)
normalized_popularities = scaler.fit_transform(popularities)

# Invert rank values and normalize
max_rank = max(ranks)
inverted_ranks = max_rank - ranks
normalized_inverted_ranks = scaler.fit_transform(inverted_ranks)

# Step 4: Calculate Trending Scores
# Define weights
w_score = 0
w_rank = 0.5
w_popularity = 0.5

trending_scores = (normalized_scores * w_score) + (normalized_inverted_ranks * w_rank) + (normalized_popularities * w_popularity)


# Step 5: Update MongoDB with Trending Scores
for anime, score in zip(anime_data, trending_scores):
    anime_id = anime.get('_id')
    if anime_id is not None:
        result = collection.update_one(
            {"_id": anime_id},
            {"$set": {"trending_score": float(score.item())}}  # Use .item() to extract scalar value
        )
        if result.modified_count > 0:
            print(f"Successfully updated trending score for anime ID {anime_id}")
        else:
            print(f"Failed to update trending score for anime ID {anime_id}")

client.close()

# Step 6: Fetch Top Trending Anime
def get_top_trending(n=10):
    client = MongoClient(MONGODB_URI)
    db = client[DATABASE_NAME]
    collection = db[COLLECTION_NAME]

    # Fetch documents sorted by trending_score in descending order, limit to 'n' results
    top_trending = list(collection.find({"trending_score": {"$exists": True}}).sort("trending_score", -1).limit(n))
    client.close()
    return top_trending

# Example Usage
if __name__ == "__main__":
    top_anime = get_top_trending(10)
    for anime in top_anime:
        print(f"Title: {anime.get('title')}, Trending Score: {anime.get('trending_score')}")
