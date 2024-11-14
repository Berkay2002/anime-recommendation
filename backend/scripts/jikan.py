import requests
from pymongo import MongoClient
import time

# MongoDB setup
MONGODB_URI = "mongodb+srv://Admin:Admin@recommendation-cluster.mza82o4.mongodb.net/?retryWrites=true&w=majority&appName=recommendation-cluster"
client = MongoClient(MONGODB_URI)
db = client["animeDB"]
anime_collection = db["anime_general"]

# Function to fetch image URL and themes from Jikan API
def fetch_anime_details(title):
    try:
        response = requests.get(f"https://api.jikan.moe/v4/anime", params={"q": title})
        if response.status_code == 200:
            data = response.json()
            if data["data"]:
                # Extract the image URL and themes
                image_url = data["data"][0]["images"]["jpg"]["image_url"]
                themes = [theme["name"] for theme in data["data"][0]["themes"]]
                return image_url, themes
        return None, None
    except Exception as e:
        print(f"Error fetching details for {title}: {e}")
        return None, None

# Main function to update MongoDB with image URLs and themes
def update_anime_details():
    for anime in anime_collection.find():
        if anime.get("image_url"):
            if anime.get("themes"):
                print(f"image_url and themes already exist for {anime.get('English') or anime.get('Japanese')} - Skipping.")
                continue  # Skip if both image_url and themes are present
            else:
                print(f"image_url exists but themes missing for {anime.get('English') or anime.get('Japanese')} - Fetching themes.")
        else:
            print(f"Fetching image_url and themes for {anime.get('English') or anime.get('Japanese')}")

        # Try fetching the details using English title, Japanese title, then Synonyms
        title_options = [anime.get("English"), anime.get("Japanese"), anime.get("Synonyms")]
        image_url = None
        themes = None

        for title in title_options:
            if title:
                image_url, themes = fetch_anime_details(title)
                if themes:
                    break  # Stop searching once themes are found

        update_fields = {}
        if not anime.get("image_url") and image_url:
            update_fields["image_url"] = image_url

        update_fields["themes"] = themes if themes else []

        anime_collection.update_one(
            {"_id": anime["_id"]},
            {"$set": update_fields}
        )

        print(f"Updated details for {anime.get('English') or anime.get('Japanese')}")

        # Respect Jikan's rate limit
        time.sleep(1)  # Jikan suggests a 1-second delay to avoid rate limits

update_anime_details()
