import pandas as pd
import torch
import json
from bert_service import get_embeddings  # Assumes you have a function for BERT embeddings

# Check if CUDA is available
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
if torch.cuda.is_available():
    print(f"Using GPU: {torch.cuda.get_device_name(0)}")
else:
    print("Using CPU")

# Step 1: Load Anime Data
print("Loading anime data...")
with open("../data/anime_bert_data.json", "r") as f:
    anime_data = json.load(f)

# Fields to generate embeddings for
fields = ["Description", "Genres", "Demographic", "Rating"]

# Step 2: Generate Embeddings by Field
def generate_field_embedding(texts, field_name):
    print(f"Generating embeddings for {field_name}...")
    return get_embeddings(texts)

# Step 3: Prepare Text Data by Field
field_texts = {field: [] for field in fields}

# Populate each field with its respective text data
for anime in anime_data:
    for field in fields:
        text = anime.get(field) or ""
        field_texts[field].append(text.strip())

# Step 4: Generate and Store Embeddings
embeddings = {}
for field in fields:
    embeddings[field] = generate_field_embedding(field_texts[field], field_name=field)

# Step 5: Add Individual BERT Embeddings to Anime Data
for idx, anime in enumerate(anime_data):
    anime["bert_description"] = embeddings["Description"][idx].tolist()
    anime["bert_genres"] = embeddings["Genres"][idx].tolist()
    anime["bert_demographic"] = embeddings["Demographic"][idx].tolist()
    anime["bert_rating"] = embeddings["Rating"][idx].tolist()

# Step 6: Save Updated Anime Data with Individual BERT Embeddings
output_path = "../data/anime_individual_embeddings.json"
with open(output_path, "w") as f:
    json.dump(anime_data, f, indent=2)
print(f"Individual BERT embeddings saved to {output_path}")
