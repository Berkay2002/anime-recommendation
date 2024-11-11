import pandas as pd
import json
from bert_service import get_embeddings  # Import the batch processing function
import numpy as np
import os

# Step 1: Load anime data
csv_file_path = "../data/Top_Anime_data.csv"  # Adjust this path if necessary
df = pd.read_csv(csv_file_path)

# Step 2: Prepare Text Data for Embedding Generation
# Replace NaN with empty string to avoid errors in embedding generation
df["description"] = df["description"].fillna("")

# Step 3: Generate BERT Embeddings in Batches
print("Generating embeddings in batches...")
descriptions = df["description"].tolist()  # Get a list of all descriptions
batch_size = 8  # Set batch size (adjust based on memory capacity)

# Get embeddings for all descriptions using batch processing
embeddings = get_embeddings(descriptions, batch_size=batch_size)

# Step 4: Add Embeddings to DataFrame
# Convert the list of embeddings back into the DataFrame
df["bert_embedding"] = [embedding.tolist() for embedding in embeddings]  # Convert np arrays to lists for JSON compatibility

# Step 5: Save Data with Embeddings to JSON
json_file_path = "../data/anime_with_embeddings.json"  # Adjust this path if necessary

# Ensure the output directory exists
os.makedirs(os.path.dirname(json_file_path), exist_ok=True)

# Convert DataFrame to JSON format
anime_data_with_embeddings = df.to_dict(orient="records")

# Save the data with embeddings as a JSON file
with open(json_file_path, "w") as json_file:
    json.dump(anime_data_with_embeddings, json_file, indent=2)

print(f"Data with embeddings successfully saved to {json_file_path}")
