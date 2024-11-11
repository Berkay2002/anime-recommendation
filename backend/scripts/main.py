import json
import os
from bert_service import get_embeddings  # Import the batch processing function

# Step 1: Load anime data from JSON
json_file_path = "../data/anime_data.json"  # Path to your original JSON file
with open(json_file_path, "r") as json_file:
    anime_data = json.load(json_file)

# Step 2: Prepare Text Data for Embedding Generation
# Collect all descriptions, handling any missing values
descriptions = [anime.get("description", "") for anime in anime_data]

# Step 3: Generate BERT Embeddings in Batches
print("Generating embeddings in batches...")
batch_size = 8  # Set batch size (adjust based on memory capacity)

# Get embeddings for all descriptions using batch processing
embeddings = get_embeddings(descriptions, batch_size=batch_size)

# Step 4: Add Embeddings to the Anime Data
# Add the generated embeddings to each anime record in the original JSON data
for anime, embedding in zip(anime_data, embeddings):
    anime["bert_embedding"] = embedding.tolist()  # Convert np arrays to lists for JSON compatibility

# Step 5: Save Data with Embeddings to a New JSON File
output_json_file_path = "../data/anime_with_embeddings.json"  # Path to save JSON with embeddings

# Ensure the output directory exists
os.makedirs(os.path.dirname(output_json_file_path), exist_ok=True)

# Save the modified data to a new JSON file
with open(output_json_file_path, "w") as output_json_file:
    json.dump(anime_data, output_json_file, indent=2)

print(f"Data with embeddings successfully saved to {output_json_file_path}")
