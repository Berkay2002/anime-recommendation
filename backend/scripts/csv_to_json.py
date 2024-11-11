import pandas as pd
import json
import numpy as np
import os

# Load CSV into a DataFrame
csv_file_path = "../data/Top_Anime_data.csv"  # Adjusted the path
df = pd.read_csv(csv_file_path)

# Replace NaN values with None, which will become null in JSON
df = df.replace({np.nan: None})

# Convert DataFrame to list of dictionaries for JSON format
anime_data = df.to_dict(orient="records")

# Save as JSON
json_file_path = "../data/anime_data.json"  # Adjusted the path

# Ensure the output directory exists
os.makedirs(os.path.dirname(json_file_path), exist_ok=True)

with open(json_file_path, "w") as json_file:
    json.dump(anime_data, json_file, indent=2)

print(f"Data successfully converted to {json_file_path} with NaN values replaced by null.")
