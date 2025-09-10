import json
import csv

with open("content.json", "r", encoding="utf-8") as f:
    data = json.load(f)

movies = data.get("movies", [])
series = data.get("series", [])

with open("content.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow([
        "content_id", "title", "content_type", "genre",
        "release_year", "rating", "production_budget", "views_count"
    ])

    # Procesar películas
    for item in movies:
        writer.writerow([
            item["content_id"],
            item["title"],
            "Movie",
            json.dumps(item["genre"]),
            item["release_year"],
            item["rating"],
            item["production_budget"],
            item["views_count"]
        ])

    # Procesar series
    for item in series:
        writer.writerow([
            item["content_id"],
            item["title"],
            "Series",
            json.dumps(item["genre"]),
            item.get("release_year", 2020),   # default si no existe
            item["rating"],
            item["production_budget"],
            item["total_views"]               # en series no se llama views_count
        ])