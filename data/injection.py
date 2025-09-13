import os
from dotenv import load_dotenv
import pandas as pd
from sqlalchemy import create_engine
import json

# Load .env file
load_dotenv()

# Get variables
DB_USER = os.getenv("POSTGRES_USER")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")
DB_HOST = os.getenv("POSTGRES_HOST")
DB_PORT = os.getenv("POSTGRES_PORT")
DB_NAME = os.getenv("POSTGRES_DB")

# Build connection string
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL)

# Load CSV
df = pd.read_csv("data/users.csv")

# Write to DB
df.to_sql("users", engine, if_exists="append", index=False)

# Load raw JSON
with open("data/content.json") as f:
    data = json.load(f)

# Extract separate tables
movies_raw = pd.DataFrame(data["movies"])
series_raw = pd.DataFrame(data["series"])

# --- Build Content DataFrame ---
content_movies = movies_raw[["content_id", "title", "genre", "rating", "production_budget"]].copy()
content_movies["content_type"] = "Movie"

content_series = series_raw[["content_id", "title", "genre", "rating", "production_budget"]].copy()
content_series["content_type"] = "Series"

# Convert the genre column to JSON strings
content_df = pd.concat([content_movies, content_series], ignore_index=True)
content_df["genre"] = content_df["genre"].apply(json.dumps)

# --- Build Movies DataFrame ---
movies_df = movies_raw[["content_id", "duration_minutes", "views_count", "release_year"]].copy()

# --- Build Series DataFrame ---
series_df = series_raw[[
    "content_id",
    "avg_episode_duration",
    "episodes_per_season",
    "total_views"
]].copy()
series_df["episodes_per_season"] = series_df["episodes_per_season"].apply(json.dumps)

# Insert into tables
content_df.to_sql("content", engine, if_exists="append", index=False)
movies_df.to_sql("movies", engine, if_exists="append", index=False)
series_df.to_sql("series", engine, if_exists="append", index=False)

# Load CSV
df3 = pd.read_csv("data/viewing_sessions.csv")

print(df3.head())

# Write to DB
df3.to_sql("viewing_sessions", engine, if_exists="append", index=False)