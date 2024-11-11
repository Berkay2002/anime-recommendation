from pymongo import MongoClient
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import os

# MongoDB Connection
MONGODB_URI = os.getenv("MONGODB_URI", "your_mongodb_uri_here")  # Replace with your actual MongoDB URI
DATABASE_NAME = "animeDB"  # Database name
ANIME_COLLECTION = "anime"  # Collection with main anime data
RECOMMENDATION_COLLECTION = "recommendations"  # Collection to store precomputed recommendations

# Connect to MongoDB
client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]
anime_collection = db[ANIME_COLLECTION]
recommendation_collection = db[RECOMMENDATION_COLLECTION]

# Step 1: Retrieve All Anime Embeddings
anime_data = list(anime_collection.find({}, {"_id": 1, "title": 1, "bert_embedding": 1}))

# Convert embeddings to a numpy array for similarity calculation
embeddings = np.array([anime["bert_embedding"] for anime in anime_data])
titles = [anime["title"] for anime in anime_data]
anime_ids = [anime["_id"] for anime in anime_data]

# Step 2: Compute Similarity Matrix
similarity_matrix = cosine_similarity(embeddings)

# Step 3: Store Recommendations Based on Similarity
recommendations = []
for idx, anime_id in enumerate(anime_ids):
    # Get similarity scores for this anime, excluding self-comparison
    similarity_scores = list(enumerate(similarity_matrix[idx]))
    similarity_scores = sorted(similarity_scores, key=lambda x: x[1], reverse=True)

    # Get top 5 most similar anime (excluding itself)
    top_similar = [
        {
            "anime_id": str(anime_ids[i[0]]),
            "title": titles[i[0]],
            "similarity_score": i[1],
        }
        for i in similarity_scores[1:6]
    ]

    # Create a recommendation entry for this anime
    recommendations.append({
        "anime_id": anime_id,
        "title": titles[idx],
        "similar_anime": top_similar,
    })

# Step 4: Insert Recommendations into MongoDB
try:
    recommendation_collection.insert_many(recommendations)
    print(f"Inserted {len(recommendations)} recommendation documents into MongoDB.")
except Exception as e:
    print("Error inserting recommendations:", e)
finally:
    client.close()
