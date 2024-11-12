import json
import re

# Load the dataset
input_file = "C:/Users/berka/Masters/TNM108/project/anime-recommendation/backend/data/anime_bert_data.json"
output_file = "C:/Users/berka/Masters/TNM108/project/anime-recommendation/backend/data/anime_bert_data_clean.json"

# Function to remove duplicate words in genres and demographics
def clean_repeated_terms(text):
    if text:
        parts = text.split(',')
        cleaned_parts = []
        for part in parts:
            # Remove duplicates of the same word (e.g., "AdventureAdventure" -> "Adventure")
            fixed_part = re.sub(r'\b(\w+)(\1+)\b', r'\1', part.strip())
            cleaned_parts.append(fixed_part)
        return ', '.join(cleaned_parts)
    return text

# Process the JSON data
with open(input_file, "r") as f:
    anime_data = json.load(f)

# Iterate through each anime entry and clean genres and demographics
for anime in anime_data:
    anime["Genres"] = clean_repeated_terms(anime.get("Genres", ""))
    anime["Demographic"] = clean_repeated_terms(anime.get("Demographic", ""))

# Save the cleaned data back to JSON
with open(output_file, "w") as f:
    json.dump(anime_data, f, indent=2)

print(f"Cleaned data saved to {output_file}")
