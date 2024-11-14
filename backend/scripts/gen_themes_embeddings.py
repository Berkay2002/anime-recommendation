import json
from pymongo import MongoClient
from bert_service import get_embeddings  # Assumes you have this function defined
import numpy as np

# MongoDB Connection Details
MONGODB_URI = "mongodb+srv://Admin:Admin@recommendation-cluster.mza82o4.mongodb.net/?retryWrites=true&w=majority"
DATABASE_NAME = "animeDB"
COLLECTIONS_TO_UPDATE = ["anime_general", "anime_collection"]

# Connect to MongoDB
client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]

def process_collection(collection_name):
    collection = db[collection_name]
    print(f"Processing collection: {collection_name}")

    # Fetch all anime documents
    anime_documents = list(collection.find({}, {"_id": 1, "themes": 1}))

    # Prepare data for embeddings
    anime_ids = []
    themes_texts = []

    for anime in anime_documents:
        anime_id = anime["_id"]
        themes = anime.get("themes", [])
        if themes:
            # Join themes into a single string
            themes_text = " ".join(themes)
        else:
            themes_text = ""
        anime_ids.append(anime_id)
        themes_texts.append(themes_text)

    # Generate embeddings for themes
    print("Generating BERT embeddings for themes...")
    embeddings = get_embeddings(themes_texts, batch_size=8)  # Adjust batch_size as needed

    # Update documents with embeddings
    print("Updating documents with bert_themes...")
    for anime_id, embedding in zip(anime_ids, embeddings):
        # Convert embedding to list for JSON serialization
        embedding_list = embedding.tolist()
        # Update the document
        collection.update_one(
            {"_id": anime_id},
            {"$set": {"bert_themes": embedding_list}}
        )

    print(f"Finished updating {collection_name}.")

def main():
    for collection_name in COLLECTIONS_TO_UPDATE:
        process_collection(collection_name)

    client.close()
    print("All collections have been updated with bert_themes.")

if __name__ == "__main__":
    main()