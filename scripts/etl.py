import logging
import time
from datetime import datetime
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from scripts.extract import extract_content, extract_users, extract_viewing_sessions
from scripts.transform import transform_movies, csv_to_json, json_to_csv
from scripts.validate import validate_movies, validate_content, validate_series
from scripts.load import load_tables, load_incremental
from scripts.monitor import log_event, send_alert
from scripts.logging_conf import configure_logging
from sqlalchemy.orm import sessionmaker
from database import engine

SessionLocal = sessionmaker(bind=engine)

logger = logging.getLogger(__name__)

def format_duration(seconds):
    """Format duration in seconds to human readable format"""
    if seconds < 1:
        return f"{seconds*1000:.2f}ms"
    elif seconds < 60:
        return f"{seconds:.2f}s"
    else:
        minutes = int(seconds // 60)
        secs = seconds % 60
        return f"{minutes}m {secs:.2f}s"

def run_etl():
    """
    Execute ETL pipeline for PostgreSQL database with performance metrics
    """
    session = SessionLocal()
    total_start_time = time.time()

    try:
        log_event("Starting ETL pipeline - PostgreSQL")
        log_event(f"Process initiated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # === EXTRACT PHASE ===
        extract_start = time.time()
        log_event("Phase 1: Data Extraction")

        df = extract_content("data/content.json")
        df2 = extract_users("data/users.csv")
        df3 = extract_viewing_sessions("data/viewing_sessions.csv")
        log_event(f"Extracted {len(df), len(df2), len(df3)} rows from JSON and CSVs")
        extract_duration = time.time() - extract_start

        # === TRANSFORM PHASE ===
        transform_start = time.time()
        log_event("Phase 2: Data Transformation")
        main_transform_start = time.time()
        csv_to_json("data/users.csv", "data/raw/users.json")
        csv_to_json("data/viewing_sessions.csv", "data/raw/viewing_sessions.json")
        tables = transform_movies(df)
        main_transform_duration = time.time() - main_transform_start
        log_event("Transformation completed (CSV→JSON + cleaning)")
        log_event("Back-conversion JSON→CSV done")

        # === VALIDATE PHASE ===
        validate_start = time.time()
        log_event("Phase 3: Data Validation")
    
        errors_content = validate_content(tables["content_df"])
        if errors_content:
            log_event(f"Validation failed: {errors}", level="error")
            send_alert("ETL Validation Errors", "\n".join(errors), "admin@example.com")
            return  # aborta el ETL

        errors_movies = validate_movies(tables["movies_df"])
        if errors_movies:
            log_event(f"Validation failed: {errors}", level="error")
            send_alert("ETL Validation Errors", "\n".join(errors), "admin@example.com")
            return  # aborta el ETL

        errors_series = validate_series(tables["series_df"])
        if errors_series:
            log_event(f"Validation failed: {errors}", level="error")
            send_alert("ETL Validation Errors", "\n".join(errors), "admin@example.com")
            return  # aborta el ETL

        log_event("Validation passed ✅")
        validate_duration = time.time() - validate_start

        # === LOAD PHASE - PostgreSQL ===
        sql_load_start = time.time()
        log_event("Phase 4: PostgreSQL Loading")
        load_incremental(tables, df2, df3, session)
        session.commit()
        sql_load_duration = time.time() - sql_load_start
        log_event("Incremental load completed")

        log_event("🎉 ETL pipeline finished successfully")

        # === PIPELINE SUMMARY ===
        total_duration = time.time() - total_start_time
        log_event("ETL Pipeline Completed Successfully")
        log_event("=" * 50)
        log_event("PERFORMANCE SUMMARY:")
        log_event(f"  Total pipeline duration: {format_duration(total_duration)}")
        log_event(f"  Extraction phase: {format_duration(extract_duration)} ({extract_duration/total_duration*100:.1f}%)")
        log_event(f"  Transformation phase: {format_duration(main_transform_duration)} ({main_transform_duration/total_duration*100:.1f}%)")
        log_event(f"  Validation phase: {format_duration(validate_duration)} ({validate_duration/total_duration*100:.1f}%)")
        log_event(f"  PostgreSQL load: {format_duration(sql_load_duration)} ({sql_load_duration/total_duration*100:.1f}%)")
        log_event(f"  Total records processed: {len(tables) + len(df2) + len(df3)}")
        log_event(f"  Overall throughput: {(len(tables) + len(df2) + len(df3))/total_duration:.1f} records/second")
        log_event("=" * 50)
        
        return tables, df2, df3
        
    except Exception as e:
        session.rollback()
        error_duration = time.time() - total_start_time
        log_event(f"ETL failed after {format_duration(error_duration)}: {str(e)}", level="error")
        send_alert("ETL Failure", f"Pipeline failed after {format_duration(error_duration)}\nError: {str(e)}", "admin@example.com")
        raise
    finally:
        session.close()

if __name__ == "__main__":
    configure_logging()
    run_etl()

