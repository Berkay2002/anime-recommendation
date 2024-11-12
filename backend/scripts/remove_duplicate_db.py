from pymongo import MongoClient
import re

# MongoDB setup
MONGODB_URI = "mongodb+srv://Admin:Admin@recommendation-cluster.mza82o4.mongodb.net/?retryWrites=true&w=majority&appName=recommendation-cluster"
client = MongoClient(MONGODB_URI)
db = client["animeDB"]

# Function to remove repeated genres or demographic terms based on consecutive capitalized word detection
def fix_repeated_terms(text):
    if text:
        # Split the text by commas to handle each genre/demographic separately
        parts = text.split(',')
        cleaned_parts = []
        for part in parts:
            # Remove repeated words like AdventureAdventure by matching a word followed immediately by itself
            # This regex pattern matches words that appear twice consecutively
            fixed_part = re.sub(r'\b([A-Z][a-z]+)\1\b', r'\1', part.strip())
            cleaned_parts.append(fixed_part)
        # Join cleaned parts back into a comma-separated string
        return ', '.join(cleaned_parts)
    return text

# List of collections to process
collections = ["anime_general", "anime_single_embeddings", "anime_multifield_embedded"]

# Iterate over each collection and apply the cleaning function
for collection_name in collections:
    collection = db[collection_name]
    print(f"Processing collection: {collection_name}")

    for anime in collection.find():
        # Retrieve the current values
        genres = anime.get("Genres")
        demographic = anime.get("Demographic")

        # Apply the function to fix duplicates
        fixed_genres = fix_repeated_terms(genres)
        fixed_demographic = fix_repeated_terms(demographic)

        # Check if any changes are needed
        update_needed = False
        update_fields = {}

        if genres != fixed_genres:
            update_needed = True
            update_fields["Genres"] = fixed_genres

        if demographic != fixed_demographic:
            update_needed = True
            update_fields["Demographic"] = fixed_demographic

        # Update the document in MongoDB if there were any changes
        if update_needed:
            collection.update_one({"_id": anime["_id"]}, {"$set": update_fields})
            print(f"Updated genres and/or demographic for anime ID {anime.get('anime_id')} in {collection_name}")
        else:
            print(f"No update needed for anime ID {anime.get('anime_id')} in {collection_name}")

print("Finished updating duplicated genres and demographics in all collections.")
