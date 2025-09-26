import pandas as pd
from pathlib import Path
import json

def extract_content(path: str = "data/content.json") -> pd.DataFrame:
    """Extract content dataset from JSON."""
    json_path = Path(path)
    with open(json_path) as f:
        data = json.load(f)
    if not json_path.exists():
        raise FileNotFoundError(f"JSON file not found: {path}")
    return data

def extract_users(path: str = "data/users.csv") -> pd.DataFrame:
    """Extract users dataset from CSV."""
    csv_path = Path(path)
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {path}")
    return pd.read_csv(csv_path, encoding="utf-8")

def extract_viewing_sessions(path: str = "data/viewing_sessions.csv") -> pd.DataFrame:
    """Extract viewing sessions dataset from CSV."""
    csv_path = Path(path)
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {path}")
    return pd.read_csv(csv_path, encoding="utf-8")
