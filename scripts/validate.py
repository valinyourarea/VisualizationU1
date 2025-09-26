import pandas as pd

def validate_content(df: pd.DataFrame):
    errors = []

    # Example rules
    if df["content_id"].isnull().any():
        errors.append("Missing values in 'content_id' column")
    if df["title"].isnull().any():
        errors.append("Missing values in 'title' column")

    return errors

def validate_movies(df: pd.DataFrame):
    errors = []

    # Example rules
    if df["content_id"].isnull().any():
        errors.append("Missing values in 'content_id' column")

    return errors

def validate_series(df: pd.DataFrame):
    errors = []

    # Example rules
    if df["content_id"].isnull().any():
        errors.append("Missing values in 'content_id' column")
    if df["episodes_per_season"].isnull().any():
        errors.append("Missing values in 'episodes_per_season' column")

    return errors
