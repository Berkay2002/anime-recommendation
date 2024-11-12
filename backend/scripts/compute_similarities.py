from pymongo import MongoClient
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import os
import re

# MongoDB Connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://Admin:Admin@recommendation-cluster.mza82o4.mongodb.net/?retryWrites=true&w=majority&appName=recommendation-cluster")
DATABASE_NAME = "animeDB"
ANIME_COLLECTION = "anime_multifield_embedded"  # Updated collection name
RECOMMENDATION_COLLECTION = "recommendations"  # Collection to store precomputed recommendations

# Connect to MongoDB
client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]
anime_collection = db[ANIME_COLLECTION]
recommendation_collection = db[RECOMMENDATION_COLLECTION]

# Step 1: Retrieve All Anime Embeddings and Attributes
print("Fetching anime data from MongoDB...")

# If using multi-field embeddings, ensure to include the new fields
anime_data = list(anime_collection.find({}, {
    "anime_id": 1, 
    "title": 1, 
    "bert_description": 1, 
    "bert_genres": 1, 
    "bert_demographic": 1, 
    "bert_rating": 1, 
    "Genres": 1, 
    "Demographic": 1, 
    "Rating": 1
}))
print(f"Fetched {len(anime_data)} anime records.")

if not anime_data:
    raise ValueError("No anime data found in the collection.")

# Convert individual embeddings to a single vector per anime
embeddings = np.array([
    np.concatenate([
        anime["bert_description"],
        anime["bert_genres"],
        anime["bert_demographic"],
        anime["bert_rating"]
    ]) for anime in anime_data
])

titles = [anime["title"] for anime in anime_data]
anime_ids = [anime["anime_id"] for anime in anime_data]
genres = [anime.get("Genres") for anime in anime_data]
demographics = [anime.get("Demographic") for anime in anime_data]
ratings = [anime.get("Rating") for anime in anime_data]

# Function to extract base title
def extract_base_title(title):
    """
    Extracts the base title by removing season numbers, subtitles, parentheticals, and other variations.
    Examples:
        "Attack on Titan Season 3" -> "Attack on Titan"
        "Attack on Titan: The Final Season" -> "Attack on Titan"
        "Hunter x Hunter (2011)" -> "Hunter x Hunter"
        "Gintama: The Final Chapter - Be Forever Yorozuya" -> "Gintama"
    """
    # Remove content after common separators and keywords
    # This pattern splits the title at 'Season', 'Saison', 'Part', ':', '-', '(', etc.
    split_pattern = r'(?:Season|Saison|Part|:|-|\()'

    base_title = re.split(split_pattern, title, flags=re.IGNORECASE)[0]
    base_title = base_title.strip().rstrip('.')  # Remove trailing spaces and periods

    # Additional cleanup: remove any trailing non-alphanumeric characters
    base_title = re.sub(r'[^\w\s]', '', base_title)

    return base_title.strip()

# Precompute base titles for all anime
base_titles = [extract_base_title(title) for title in titles]

# Step 2: Compute Similarity Matrix
print("Calculating cosine similarity matrix...")
similarity_matrix = cosine_similarity(embeddings)

# Step 3: Store Recommendations Based on Final Score
recommendations = []
for idx, anime_id in enumerate(anime_ids):
    target_genre = genres[idx]
    target_demographic = demographics[idx]
    target_base_title = base_titles[idx]  # Use base title for comparison

    similarity_scores = list(enumerate(similarity_matrix[idx]))

    # Calculate Final Score and Combined Similarity for each similar anime
    scored_recommendations = []
    for sim_idx, bert_similarity in similarity_scores:
        if sim_idx == idx:
            continue  # Skip self-comparison

        # Genre and Demographic Matches
        genre_match = 1 if genres[sim_idx] == target_genre else 0
        demographic_match = 1 if demographics[sim_idx] == target_demographic else 0

        # Combined Genre and Demographic Similarity
        combined_similarity = cosine_similarity(
            [embeddings[idx][len(embeddings[idx])//4:len(embeddings[idx])//2] + embeddings[idx][len(embeddings[idx])//2:3*len(embeddings[idx])//4]],
            [embeddings[sim_idx][len(embeddings[sim_idx])//4:len(embeddings[sim_idx])//2] + embeddings[sim_idx][len(embeddings[sim_idx])//2:3*len(embeddings[sim_idx])//4]]
        )[0][0]

        # Calculate final score with weighted formula
        final_score = (bert_similarity * 0.7) + (combined_similarity * 0.3)

        # Check for same base title to exclude
        recommendation_base_title = base_titles[sim_idx]
        if recommendation_base_title.lower() == target_base_title.lower():
            continue  # Skip recommendations with the same base title

        scored_recommendations.append({
            "anime_id": anime_ids[sim_idx],
            "title": titles[sim_idx],
            "bert_similarity": bert_similarity,
            "final_score": final_score
        })

    # Sort by final score in descending order and take top 5
    top_recommendations = sorted(scored_recommendations, key=lambda x: x["final_score"], reverse=True)[:5]

    # Append top recommendations for each anime
    recommendations.append({
        "anime_id": anime_id,
        "title": titles[idx],
        "similar_anime": top_recommendations
    })

# Step 4: Insert Recommendations into MongoDB
print("Inserting recommendations into MongoDB...")
try:
    # Clear the existing collection to avoid duplicates
    recommendation_collection.delete_many({})

    # Insert new recommendations
    recommendation_collection.insert_many(recommendations)
    print(f"Inserted {len(recommendations)} recommendation documents into MongoDB.")
except Exception as e:
    print("Error inserting recommendations:", e)
finally:
    client.close()
