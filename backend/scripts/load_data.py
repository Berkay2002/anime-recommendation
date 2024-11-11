import pandas as pd

# Load anime data
anime_df = pd.read_csv('data/MAL-anime.csv')
print(anime_df.head())  # Preview data to see available fields

# Load manga data (optional)
manga_df = pd.read_csv('data/MAL-manga.csv')
print(manga_df.head())
