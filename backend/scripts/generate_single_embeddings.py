import pandas as pd
import torch
import json
from bert_service import get_embeddings  # Assumes you have a function for BERT embeddings

# Check if CUDA is available and print the device information
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
if torch.cuda.is_available():
    print(f"Using GPU: {torch.cuda.get_device_name(0)}")
else:
    print("Using CPU")

# Step 1: Load BERT-specified anime data
print("Loading anime data...")
with open("../data/anime_bert_data.json", "r") as f:
    anime_data = json.load(f)

# Step 2: Prepare text data for embeddings
texts = []
fields = ["Description", "Genres", "Demographic", "Rating"]
for anime in anime_data:
    text = " ".join(anime.get(field) or "" for field in fields)
    texts.append(text.strip())

# Step 3: Generate embeddings
print("Generating embeddings...")
embeddings = get_embeddings(texts)

# Step 4: Save embeddings back to the data
print("Saving embeddings...")
for anime, embedding in zip(anime_data, embeddings):
    anime["bert_embedding"] = embedding.tolist()  # Convert ndarray to list

# Step 5: Save updated data with embeddings
output_path = "../data/anime_filtered_with_embeddings.json"
with open(output_path, "w") as f:
    json.dump(anime_data, f, indent=2)
print(f"Embeddings saved to {output_path}")
