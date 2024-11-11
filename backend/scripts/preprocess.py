import json
import os
from bert_service import get_embeddings  # Import the batch processing function

# Define the columns to keep
columns_to_keep = [
    "Score",
    "Popularity",
    "Rank",
    "Description",
    "Synonyms",
    "Japanese",
    "English",
    "Status",
    "Premiered",
    "Broadcast",
    "Producers",
    "Studios",
    "Genres",
    "Demographic",
    "Rating"
]

# Step 1: Load anime data from JSON
input_json_file_path = "../data/anime_data.json"  # Path to your original JSON file
with open(input_json_file_path, "r") as json_file:
    anime_data = json.load(json_file)

# Step 2: Filter the data to keep only the necessary columns
filtered_anime_data = []
for anime in anime_data:
    filtered_anime = {key: anime.get(key, None) for key in columns_to_keep}
    filtered_anime_data.append(filtered_anime)

# Step 3: Prepare Text Data for Embedding Generation
# Collect all descriptions, handling any missing values
descriptions = [anime.get("Description", "") for anime in filtered_anime_data]

# Step 4: Generate BERT Embeddings in Batches
print("Generating embeddings in batches...")
batch_size = 8  # Set batch size (adjust based on memory capacity)

# Get embeddings for all descriptions using batch processing
embeddings = get_embeddings(descriptions, batch_size=batch_size)

# Step 5: Add Embeddings to the Filtered Anime Data
for anime, embedding in zip(filtered_anime_data, embeddings):
    anime["bert_embedding"] = embedding.tolist()  # Convert np arrays to lists for JSON compatibility

# Step 6: Save the Filtered Data with Embeddings to a New JSON File
output_json_file_path = "../data/anime_filtered_with_embeddings.json"  # Path to save JSON with embeddings

# Ensure the output directory exists
os.makedirs(os.path.dirname(output_json_file_path), exist_ok=True)

# Save the filtered data with embeddings as a new JSON file
with open(output_json_file_path, "w") as output_json_file:
    json.dump(filtered_anime_data, output_json_file, indent=2)

print(f"Filtered data with embeddings successfully saved to {output_json_file_path}")
