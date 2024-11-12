import requests
from pymongo import MongoClient
import time

# MongoDB setup
MONGODB_URI = "mongodb+srv://Admin:Admin@recommendation-cluster.mza82o4.mongodb.net/?retryWrites=true&w=majority&appName=recommendation-cluster"
client = MongoClient(MONGODB_URI)
db = client["animeDB"]
anime_collection = db["anime_general"]

# Function to fetch image URL from Jikan API
def fetch_image_url(title):
    try:
        response = requests.get(f"https://api.jikan.moe/v4/anime", params={"q": title})
        if response.status_code == 200:
            data = response.json()
            if data["data"]:
                # Extract the image URL
                return data["data"][0]["images"]["jpg"]["image_url"]
        return None
    except Exception as e:
        print(f"Error fetching image for {title}: {e}")
        return None

# Main function to update MongoDB with image URLs
def update_anime_images():
    for anime in anime_collection.find():
        # Try fetching the image using English title, Japanese title, then Synonyms
        title_options = [anime.get("English"), anime.get("Japanese"), anime.get("Synonyms")]
        image_url = None

        for title in title_options:
            if title:
                image_url = fetch_image_url(title)
                if image_url:
                    break  # Stop searching once an image is found

        # Update MongoDB with the image URL
        if image_url:
            anime_collection.update_one(
                {"_id": anime["_id"]},
                {"$set": {"image_url": image_url}}
            )
            print(f"Updated image URL for {anime.get('English') or anime.get('Japanese')}")
        else:
            print(f"No image found for {anime.get('English') or anime.get('Japanese')}")
        
        # Respect Jikan's rate limit
        time.sleep(1)  # Jikan suggests a 1-second delay to avoid rate limits

update_anime_images()
