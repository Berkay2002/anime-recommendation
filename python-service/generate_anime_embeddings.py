import pandas as pd
import torch
from bert_service import get_embedding  # Assumes you have a function for BERT embeddings

# Check if CUDA is available and print the device information
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
if torch.cuda.is_available():
    print("CUDA is available. Using GPU:", torch.cuda.get_device_name(0))
else:
    print("CUDA is not available. Using CPU instead.")

# Step 1: Load anime data
print("Loading anime data...")
anime_df = pd.read_csv('C:/Users/berka/Masters/TNM108/project/anime-recommendation/data/MAL-anime.csv')
print(f"Data loaded. Number of rows: {len(anime_df)}")

# Step 2: Apply BERT embedding on the 'Title' field
print("Generating embeddings...")
anime_df['embedding'] = anime_df['Title'].apply(lambda x: get_embedding(x) if pd.notnull(x) else None)
print("Embeddings generated.")

# Step 3: Check the embeddings column to ensure values are populated
print("Sample of embeddings column:")
print(anime_df['embedding'].head())  # Displays the first few embeddings

# Step 4: Save processed data with embeddings
output_path = 'C:/Users/berka/Masters/TNM108/project/anime-recommendation/data/anime_with_embeddings.csv'
print(f"Saving file to {output_path}...")
anime_df.to_csv(output_path, index=False)
print("File saved successfully.")
