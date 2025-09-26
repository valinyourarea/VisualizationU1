import pandas as pd
import json
import os

def transform_movies(data) -> dict:
    """Transform raw dataframe into multiple cleaned tables."""

    df = data

    # Extract separate tables
    movies_raw = pd.DataFrame(df["movies"])
    series_raw = pd.DataFrame(df["series"])

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
    # Save the DataFrame to a CSV file
    content_df.to_csv("data/processed/processed_content.csv", index=False)
    movies_df.to_csv("data/processed/processed_movies.csv", index=False)
    series_df.to_csv("data/processed/processed_series.csv", index=False)

    return {
        "content_df": content_df,
        "movies_df": movies_df,
        "series_df": series_df
    }

def csv_to_json(csv_path: str, json_path: str):
    df = pd.read_csv(csv_path, encoding="utf-8")
    os.makedirs(os.path.dirname(json_path), exist_ok=True)
    df.to_json(json_path, orient="records", lines=True, force_ascii=False)

def json_to_csv(json_path: str, csv_path: str):
    df = pd.read_json(json_path)
    os.makedirs(os.path.dirname(csv_path), exist_ok=True)
    df.to_csv(csv_path, index=False, encoding="utf-8")