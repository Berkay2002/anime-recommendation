import pandas as pd
import torch
import json
from bert_service import get_embedding  # Assumes you have a function for BERT embeddings

# Check if CUDA is available and print the device information
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
if torch.cuda.is_available():
    print("CUDA is available. Using GPU:", torch.cuda.get_device_name(0))
else:
    print("CUDA is not available. Using CPU instead.")

# Step 1: Load anime data
print("Loading anime data...")
csv_file_path = "../data/Top_Anime_data.csv"  # Path to your CSV file
df = pd.read_csv(csv_file_path)

# Step 2: Process and Add Embeddings
print("Generating embeddings for anime descriptions...")
df["bert_embedding"] = df["description"].apply(lambda x: get_embedding(x) if pd.notna(x) else None)

# Step 3: Save Data with Embeddings to JSON
json_file_path = "../data/anime_with_embeddings.json"  # Path to save JSON with embeddings

# Convert DataFrame to JSON-friendly format (list of dictionaries)
anime_data_with_embeddings = df.to_dict(orient="records")

# Save to JSON file
with open(json_file_path, "w") as json_file:
    json.dump(anime_data_with_embeddings, json_file, indent=2)

print(f"Data with embeddings successfully saved to {json_file_path}")
