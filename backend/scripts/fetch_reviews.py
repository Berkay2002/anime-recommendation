import requests
from pymongo import MongoClient
import time

# MongoDB setup
MONGODB_URI = "mongodb+srv://Admin:Admin@recommendation-cluster.mza82o4.mongodb.net/?retryWrites=true&w=majority&appName=recommendation-cluster"
client = MongoClient(MONGODB_URI)
db = client["animeDB"]
anime_collection = db["anime_general"]
reviews_collection = db["anime_reviews"]

# Function to get MAL ID from title
def get_mal_id(title):
    try:
        response = requests.get("https://api.jikan.moe/v4/anime", params={"q": title}, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data["data"]:
                mal_id = data["data"][0]["mal_id"]
                return mal_id
            else:
                print(f"No results found for '{title}'.")
        else:
            print(f"Failed to search for anime '{title}': Status code {response.status_code}")
    except Exception as e:
        print(f"Error searching anime '{title}': {e}")
    return None

# Function to fetch the most helpful reviews
def fetch_reviews(mal_id, max_reviews=15):
    reviews = []
    page = 1
    try:
        while True:
            url = f"https://api.jikan.moe/v4/anime/{mal_id}/reviews"
            response = requests.get(url, params={"page": page}, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if not data.get("data"):
                    break
                # Collect review text and votes
                for review_entry in data["data"]:
                    review_text = review_entry.get("review")
                    votes = review_entry.get("votes", 0)
                    if review_text:
                        reviews.append({"review": review_text, "votes": votes})
                # Check if there are more pages
                if data.get("pagination", {}).get("has_next_page"):
                    page += 1
                    time.sleep(2)  # Respect rate limits
                else:
                    break
            else:
                print(f"Failed to fetch reviews for MAL ID {mal_id}: Status code {response.status_code}")
                break
            # Stop if enough reviews have been collected
            if len(reviews) >= max_reviews * 2:
                break
        # Sort reviews by votes in descending order
        sorted_reviews = sorted(reviews, key=lambda x: x["votes"], reverse=True)
        # Return top max_reviews reviews
        top_reviews = [review["review"] for review in sorted_reviews[:max_reviews]]
        return top_reviews
    except Exception as e:
        print(f"Error fetching reviews for MAL ID {mal_id}: {e}")
        return []

def main():
    # Clear existing reviews collection
    reviews_collection.delete_many({})
    print("Cleared existing 'anime_reviews' collection.")

    # Retrieve all anime titles
    anime_list = list(anime_collection.find({}, {"English": 1, "Japanese": 1, "Synonyms": 1, "title": 1}))
    print(f"Found {len(anime_list)} anime in 'anime_general' collection.")

    for anime in anime_list:
        # Try to get the title from multiple fields
        title = anime.get("English") or anime.get("Japanese") or anime.get("title") or anime.get("Synonyms")
        if not title:
            print("No title found for anime document:", anime)
            continue

        print(f"\nProcessing anime: {title}")

        # Get MAL ID
        mal_id = get_mal_id(title)
        if not mal_id:
            print(f"Skipping '{title}' due to missing MAL ID.")
            continue

        # Fetch the most helpful reviews
        reviews = fetch_reviews(mal_id, max_reviews=15)
        if reviews:
            # Store reviews in new collection
            review_doc = {
                "title": title,
                "mal_id": mal_id,
                "reviews": reviews
            }
            reviews_collection.insert_one(review_doc)
            print(f"Stored {len(reviews)} reviews for '{title}'.")
        else:
            print(f"No reviews found for '{title}'.")

        # Respect rate limits
        time.sleep(2)  # Wait 2 seconds before next anime to avoid rate limits

    print("\nFinished fetching reviews.")
    client.close()

if __name__ == "__main__":
    main()