import pandas as pd
import json
import numpy as np
import os

# Load CSV into a DataFrame
csv_file_path = "../data/Top_Anime_data.csv"  # Adjust the path if necessary
df = pd.read_csv(csv_file_path)

# Replace NaN values with None, which will become null in JSON
df = df.replace({np.nan: None})

# Fields for the general dataset
general_fields = [
    "Score", "Popularity", "Rank", "Description", "Synonyms", "Japanese", "English",
    "Status", "Premiered", "Producers", "Studios", "Genres", "Demographic", "Rating"
]

# Create general dataset
general_df = df[general_fields]
general_data = general_df.to_dict(orient="records")

# Save general dataset as JSON
general_json_path = "../data/anime_data.json"
os.makedirs(os.path.dirname(general_json_path), exist_ok=True)
with open(general_json_path, "w") as json_file:
    json.dump(general_data, json_file, indent=2)
print(f"Data successfully saved to {general_json_path}")

# Fields for the BERT dataset
bert_fields = ["Description", "Genres", "Demographic", "Rating"]

# Create BERT-specified dataset
bert_df = df[bert_fields]
bert_data = bert_df.to_dict(orient="records")

# Save BERT dataset as JSON
bert_json_path = "../data/anime_bert_data.json"
os.makedirs(os.path.dirname(bert_json_path), exist_ok=True)
with open(bert_json_path, "w") as json_file:
    json.dump(bert_data, json_file, indent=2)
print(f"BERT data successfully saved to {bert_json_path}")
