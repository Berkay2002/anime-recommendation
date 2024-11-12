from pymongo import MongoClient
import json
import os

# MongoDB URI and Database/Collection Names
MONGODB_URI = "mongodb+srv://Admin:Admin@recommendation-cluster.mza82o4.mongodb.net/?retryWrites=true&w=majority&appName=recommendation-cluster"
DATABASE_NAME = "animeDB"
GENERAL_COLLECTION_NAME = "anime_general"
SINGLE_EMBEDDING_COLLECTION_NAME = "anime_single_embeddings"

# Connect to MongoDB
client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]
general_collection = db[GENERAL_COLLECTION_NAME]
embedding_collection = db[SINGLE_EMBEDDING_COLLECTION_NAME]

# Load the general anime data
with open("../data/anime_data.json", "r") as f:
    general_data = json.load(f)

# Load the embeddings data
with open("../data/anime_single_embedded.json", "r") as f:
    embeddings_data = json.load(f)

# Load the multi-field embeddings data
with open("../data/anime_multifield_embedded.json", "r") as f:
    multifield_embeddings_data = json.load(f)

# Load the individual BERT embeddings data
with open("../data/anime_individual_embeddings.json", "r") as f:
    individual_embeddings_data = json.load(f)

# Check data consistency
if len(general_data) != len(embeddings_data) != len(individual_embeddings_data):
    raise ValueError("Mismatch in number of entries between general_data, embeddings_data, and individual_embeddings_data.")

# Clear existing collections to prevent duplicates
general_collection.delete_many({})
embedding_collection.delete_many({})

# Create a new collection for multi-field embeddings
multifield_embedded_collection_NAME = "anime_multifield_embedded"
multifield_embedded_collection = db[multifield_embedded_collection_NAME]

# Insert data into MongoDB
for idx, (general, embedding, individual) in enumerate(zip(general_data, embeddings_data, individual_embeddings_data)):
    # Assign a unique identifier
    general["anime_id"] = idx

    # Add individual BERT embeddings
    general["bert_description"] = individual.get("bert_description")
    general["bert_genres"] = individual.get("bert_genres")
    general["bert_demographic"] = individual.get("bert_demographic")
    general["bert_rating"] = individual.get("bert_rating")
    
    # Insert general data with individual embeddings
    general_collection.insert_one(general)
    
    # Insert single embedding data
    bert_embedding = embedding.get("bert_embedding")
    if bert_embedding:
        title = general.get("English") or general.get("Synonyms") or general.get("Japanese") or ""
        embedding_doc = {
            "anime_id": idx,
            "title": title,
            "bert_embedding": bert_embedding
        }
        embedding_collection.insert_one(embedding_doc)
    else:
        print(f"Warning: Missing 'bert_embedding' for anime at index {idx}.")
    
    # Insert into multi-field embeddings collection
    multifield_doc = {
        "_id": idx,
        "anime_id": idx,
        "title": title,
        "bert_description": individual.get("bert_description"),
        "bert_genres": individual.get("bert_genres"),
        "bert_demographic": individual.get("bert_demographic"),
        "bert_rating": individual.get("bert_rating")
    }
    multifield_embedded_collection.insert_one(multifield_doc)

print(f"Inserted {len(general_data)} documents into '{GENERAL_COLLECTION_NAME}' and '{SINGLE_EMBEDDING_COLLECTION_NAME}' collections.")
print(f"Inserted {len(multifield_embeddings_data)} documents into '{multifield_embedded_collection_NAME}' collection.")

client.close()
