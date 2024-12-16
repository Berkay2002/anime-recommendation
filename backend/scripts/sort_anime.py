# Python

from pymongo import MongoClient

# MongoDB connection details
MONGODB_URI = "mongodb+srv://Admin:Admin@recommendation-cluster.mza82o4.mongodb.net/?retryWrites=true&w=majority&appName=recommendation-cluster"
DATABASE_NAME = "animeDB"
SOURCE_COLLECTION = "anime_general"
TARGET_COLLECTION = "sorted_anime"

# Connect to MongoDB
client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]
source_collection = db[SOURCE_COLLECTION]
target_collection = db[TARGET_COLLECTION]

# Clear the target collection if it exists
target_collection.delete_many({})

# Retrieve all documents from the source collection
anime_list = list(source_collection.find())

# Function to get the sorting title
def get_sort_title(anime):
    return anime.get("English") or anime.get("Synonyms") or anime.get("Japanese") or ""

# Sort the anime list based on the sorting title
sorted_anime_list = sorted(anime_list, key=get_sort_title)

# Insert sorted documents into the target collection
if sorted_anime_list:
    target_collection.insert_many(sorted_anime_list)
    print(f"Inserted {len(sorted_anime_list)} documents into '{TARGET_COLLECTION}' collection.")
else:
    print("No anime data found to insert.")

# Close the connection
client.close()