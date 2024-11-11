from pymongo import MongoClient
import json
import os

# Replace with your actual MongoDB URI
MONGODB_URI = "mongodb+srv://Admin:Admin@recommendation-cluster.mza82o4.mongodb.net/?retryWrites=true&w=majority&appName=recommendation-cluster"

DATABASE_NAME = "animeDB"  # Your database name
COLLECTION_NAME = "anime"  # Collection to store anime data

# Connect to MongoDB
client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]
collection = db[COLLECTION_NAME]

# Load JSON data
json_file_path = "../data/anime_filtered_with_embeddings.json"
with open(json_file_path, "r") as json_file:
    anime_data = json.load(json_file)

# Insert data into MongoDB
try:
    result = collection.insert_many(anime_data)
    print(f"Inserted {len(result.inserted_ids)} documents into MongoDB.")
except Exception as e:
    print("Error inserting data:", e)
finally:
    client.close()
