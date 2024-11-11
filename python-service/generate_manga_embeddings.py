import pandas as pd
import torch
from bert_service import get_embedding 

# Check if CUDA is available and print the device information
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
if torch.cuda.is_available():
    print("CUDA is available. Using GPU:", torch.cuda.get_device_name(0))
else:
    print("CUDA is not available. Using CPU instead.")

# Step 1: Load manga data
print("Loading manga data...")
manga_df = pd.read_csv('c:/Users/berka/Masters/TNM108/project/anime-recommendation/data/MAL-manga.csv')
print(f"Data loaded. Number of rows: {len(manga_df)}")

# Step 2: Apply BERT embedding on the 'Title' field (or 'Description' if available)
print("Generating embeddings for manga...")
manga_df['embedding'] = manga_df['Title'].apply(lambda x: get_embedding(x) if pd.notnull(x) else None)
print("Embeddings generated.")

# Step 3: Save processed data with embeddings
output_path = 'c:/Users/berka/Masters/TNM108/project/anime-recommendation/data/manga_with_embeddings.csv'
manga_df.to_csv(output_path, index=False)
print(f"Embeddings saved to {output_path}")
