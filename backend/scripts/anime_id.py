from pymongo import MongoClient

# Connect to your MongoDB
client = MongoClient("mongodb+srv://Admin:Admin@recommendation-cluster.mza82o4.mongodb.net/?retryWrites=true&w=majority&appName=recommendation-cluster")
db = client["animeDB"]
collection = db["anime_reviews"]

def update_anime_ids():
    try:
        collection.create_index([("rank", 1)])  # Create index on "rank" field
        # Run aggregation with sorting and allowDiskUse explicitly enabled
        cursor = collection.aggregate([
            {"$sort": {"rank": 1}}  # Adjust "rank" to the field you are sorting on
        ], allowDiskUse=True)  # Explicitly enabling disk use for sorting

        anime_id = 0

        for doc in cursor:
            collection.update_one(
                {"_id": doc["_id"]},
                {"$set": {"anime_id": anime_id}}
            )
            anime_id += 1

        print("Anime IDs updated successfully.")
    
    except Exception as e:
        print("Error updating anime IDs:", e)
    
    finally:
        client.close()

# Run the function
update_anime_ids()