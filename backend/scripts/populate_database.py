from pymongo import MongoClient
import json

# MongoDB Connection Details
MONGODB_URI = "mongodb+srv://Admin:Admin@recommendation-cluster.mza82o4.mongodb.net/?retryWrites=true&w=majority&appName=recommendation-cluster"
DATABASE_NAME = "animeDB"
ANIME_COLLECTION_NAME = "anime_collection"

# Connect to MongoDB
client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]
anime_collection = db[ANIME_COLLECTION_NAME]

# Load the anime data that contains titles and other fields
with open("C:/Users/berka/Masters/TNM108/project/anime-recommendation/backend/data/anime_data.json", "r") as f:
    anime_data = json.load(f)

# Load the individual BERT embeddings data
with open("C:/Users/berka/Masters/TNM108/project/anime-recommendation/backend/data/anime_individual_embeddings.json", "r") as f:
    individual_embeddings_data = json.load(f)

# Ensure both data lists have the same length
if len(anime_data) != len(individual_embeddings_data):
    raise ValueError("Mismatch in number of entries between 'anime_data.json' and 'anime_individual_embeddings.json'.")

# Clear existing collection to prevent duplicates
anime_collection.delete_many({})

# Insert data into MongoDB
for idx, (anime, embeddings) in enumerate(zip(anime_data, individual_embeddings_data)):
    # Retrieve the title from 'anime_data'
    title = (anime.get("English") or
             anime.get("Japanese") or
             anime.get("Synonyms") or
             anime.get("Title") or
             "")
    
    if not title:
        print(f"Warning: Missing 'title' for anime at index {idx}.")
        continue  # Skip this anime due to missing title

    # Check for missing embeddings
    if not all([
        embeddings.get("bert_description"),
        embeddings.get("bert_genres"),
        embeddings.get("bert_demographic"),
        embeddings.get("bert_rating")
    ]):
        print(f"Warning: Missing embeddings for anime at index {idx}.")
        continue  # Skip this anime due to missing embeddings

    # Prepare the document to insert
    anime_doc = {
        "anime_id": idx,
        "title": title,
        # Embeddings for each field
        "bert_description": embeddings["bert_description"],
        "bert_genres": embeddings["bert_genres"],
        "bert_demographic": embeddings["bert_demographic"],
        "bert_rating": embeddings["bert_rating"],
    }

    anime_collection.insert_one(anime_doc)

print(f"Inserted {anime_collection.count_documents({})} documents into '{ANIME_COLLECTION_NAME}' collection.")

client.close()
