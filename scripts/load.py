from sqlalchemy import create_engine
import os
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from models import Content, Series, Movies, Users, Viewing_Sessions
import pandas as pd

load_dotenv()

# Build connection string
DB_USER = os.getenv("POSTGRES_USER")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")
DB_HOST = os.getenv("POSTGRES_HOST")
DB_PORT = os.getenv("POSTGRES_PORT")
DB_NAME = os.getenv("POSTGRES_DB")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL)

def load_tables(tables: dict):
    """Load transformed DataFrames into PostgreSQL."""
    for name, df in tables.items():
        df.to_sql(name, engine, if_exists="append", index=False)
        print(f"✅ Loaded {len(df)} rows into {name}")

def load_incremental(tables: dict, df2: dict, df3: dict, session: Session):

    content_df = tables["content_df"]
    movies_df = tables["movies_df"]
    series_df = tables["series_df"]
    users_df = df2
    viewing_sessions_df = df3

    # Bulk insert
    session.bulk_insert_mappings(Users, users_df.to_dict(orient="records"))
    session.bulk_insert_mappings(Content, content_df.to_dict(orient="records"))
    session.bulk_insert_mappings(Viewing_Sessions, viewing_sessions_df.to_dict(orient="records"))
    session.bulk_insert_mappings(Movies, movies_df.to_dict(orient="records"))
    session.bulk_insert_mappings(Series, series_df.to_dict(orient="records"))

