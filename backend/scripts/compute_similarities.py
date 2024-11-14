import re
from pymongo import MongoClient
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


# MongoDB Connection Details
MONGODB_URI = "mongodb+srv://Admin:Admin@recommendation-cluster.mza82o4.mongodb.net/?retryWrites=true&w=majority&appName=recommendation-cluster"
DATABASE_NAME = "animeDB"
ANIME_COLLECTION_NAME = "anime_collection"
RECOMMENDATION_COLLECTION_NAME = "recommendations"

# Connect to MongoDB
client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]
anime_collection = db[ANIME_COLLECTION_NAME]
recommendation_collection = db[RECOMMENDATION_COLLECTION_NAME]

# Fetch anime data from MongoDB
anime_data = list(anime_collection.find({}, {
    "anime_id": 1,
    "title": 1,
    "bert_description": 1,
    "bert_genres": 1,
    "bert_demographic": 1,
    "bert_rating": 1,
    "bert_themes": 1
}))

if not anime_data:
    raise ValueError("No anime data found in the collection.")

# Prepare embeddings and other data
titles = [anime.get("title", "") for anime in anime_data]
anime_ids = [anime.get("anime_id") for anime in anime_data]

# Define weights for each embedding field
weights = {
    "bert_description": 0.25,
    "bert_genres": 0.25,
    "bert_demographic": 0.15,
    "bert_rating": 0.10,
    "bert_themes": 0.25
}

# Combine embeddings with weights
embeddings = []
for anime in anime_data:
    combined_embedding = (
        np.array(anime["bert_description"]) * weights["bert_description"] +
        np.array(anime["bert_genres"]) * weights["bert_genres"] +
        np.array(anime["bert_demographic"]) * weights["bert_demographic"] +
        np.array(anime["bert_rating"]) * weights["bert_rating"] + 
        np.array(anime["bert_themes"]) * weights["bert_themes"]
    )
    embeddings.append(combined_embedding)

embeddings = np.array(embeddings)

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
    split_pattern = (
        r'(?:Season|Gaiden|Film|OVA|OAD|Saison|Part|:|-|\()'  # Added missing closing parenthesis
    )
    # Remove trailing numbers (e.g., "Bungo Stray Dogs 2" -> "Bungo Stray Dogs")
    title = re.sub(r'\s+\d+(st|nd|rd|th)?\s*season', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\s+\d+$', '', title)
    # Remove trailing Roman numerals (e.g., "Frieren IV" -> "Frieren")
    title = re.sub(r'\s+[IVXLCDM]+$', '', title, flags=re.IGNORECASE)

    base_title = re.split(split_pattern, title, flags=re.IGNORECASE)[0]
    base_title = base_title.strip().rstrip('.')  # Remove trailing spaces and periods

    # Additional cleanup: remove any trailing non-alphanumeric characters
    base_title = re.sub(r'[^\w\s]', '', base_title)

    return base_title.strip()

# Precompute base titles
base_titles = [extract_base_title(title) for title in titles]

# Compute similarity matrix
print("Calculating cosine similarity matrix...")
similarity_matrix = cosine_similarity(embeddings)

# Store recommendations
recommendations = []
for idx, anime_id in enumerate(anime_ids):
    target_base_title = base_titles[idx].lower()

    similarity_scores = list(enumerate(similarity_matrix[idx]))
    scored_recommendations = {}
    for sim_idx, similarity in similarity_scores:
        if sim_idx == idx:
            continue  # Skip self-comparison

        recommendation_base_title = base_titles[sim_idx].lower()
        if recommendation_base_title == target_base_title:
            continue  # Exclude same base title as the target anime

        # If this base title is not yet in recommendations or has a higher similarity, add/update it
        if (recommendation_base_title not in scored_recommendations or
                similarity > scored_recommendations[recommendation_base_title]['similarity']):
            scored_recommendations[recommendation_base_title] = {
                "anime_id": anime_ids[sim_idx],
                "title": titles[sim_idx],
                "similarity": similarity
            }

    # Sort the recommendations by similarity score
    sorted_recommendations = sorted(
        scored_recommendations.values(),
        key=lambda x: x["similarity"],
        reverse=True
    )

    # Get top N recommendations (e.g., top 5)
    top_recommendations = sorted_recommendations[:10]

    recommendations.append({
        "anime_id": anime_id,
        "title": titles[idx],
        "similar_anime": top_recommendations
    })

# Insert recommendations into MongoDB
print("Inserting recommendations into MongoDB...")
recommendation_collection.delete_many({})
recommendation_collection.insert_many(recommendations)
print(f"Inserted {len(recommendations)} recommendation documents into MongoDB.")

client.close()
