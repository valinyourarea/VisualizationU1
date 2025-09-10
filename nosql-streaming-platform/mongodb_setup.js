// Forzar a usar la base de datos streaming_platform
db = db.getSiblingDB("streaming_platform");

// =============================
// USERS
// =============================
db.createCollection("users");
db.users.insertMany([
  {
    user_id: "U001",
    age: 25,
    country: "Mexico",
    subscription_type: "Premium",
    registration_date: new Date("2023-01-15"),
    total_watch_time_hours: 245.5,
    status: "Active"
  },
  {
    user_id: "U002",
    age: 34,
    country: "Colombia",
    subscription_type: "Basic",
    registration_date: new Date("2023-02-20"),
    total_watch_time_hours: 156.2,
    status: "Active"
  },
  {
    user_id: "U003",
    age: 28,
    country: "Argentina",
    subscription_type: "Premium",
    registration_date: new Date("2023-01-22"),
    total_watch_time_hours: 189.7,
    status: "Active"
  },
  {
    user_id: "U004",
    age: 45,
    country: "Chile",
    subscription_type: "Basic",
    registration_date: new Date("2023-03-01"),
    total_watch_time_hours: 98.3,
    status: "Active"
  },
  {
    user_id: "U005",
    age: 32,
    country: "Peru",
    subscription_type: "Standard",
    registration_date: new Date("2023-02-14"),
    total_watch_time_hours: 167.9,
    status: "Active"
  }
]);

// =============================
// CONTENT
// =============================
db.createCollection("content");
db.content.insertMany([
  {
    content_id: "M001",
    title: "Data Adventures",
    content_type: "Movie",
    genres: ["Action", "Sci-Fi"],
    release_year: 2023,
    rating: 4.2,
    production_budget: 50000000,
    metrics: { views_count: 15420, total_watch_time_hours: 30840 }
  },
  {
    content_id: "M002",
    title: "Analytics Kingdom",
    content_type: "Movie",
    genres: ["Fantasy", "Adventure"],
    release_year: 2024,
    rating: 4.5,
    production_budget: 35000000,
    metrics: { views_count: 23150, total_watch_time_hours: 37840 }
  },
  {
    content_id: "S001",
    title: "Analytics Chronicles",
    content_type: "Series",
    genres: ["Drama", "Technology"],
    seasons: 3,
    episodes_per_season: [10, 12, 8],
    avg_episode_duration: 45,
    rating: 4.7,
    production_budget: 120000000,
    metrics: { total_views: 89650 }
  },
  {
    content_id: "S002",
    title: "Data Detectives",
    content_type: "Series",
    genres: ["Crime", "Mystery"],
    seasons: 2,
    episodes_per_season: [8, 10],
    avg_episode_duration: 52,
    rating: 4.3,
    production_budget: 85000000,
    metrics: { total_views: 67420 }
  }
]);

// =============================
// VIEWING_SESSIONS
// =============================
db.createCollection("viewing_sessions");
db.viewing_sessions.insertMany([
  {
    session_id: "S001",
    user_id: "U001",
    content_id: "M001",
    watch_date: new Date("2024-03-15"),
    watch_duration_minutes: 118,
    completion_percentage: 98.3,
    device_type: "Smart TV",
    quality_level: "4K"
  },
  {
    session_id: "S002",
    user_id: "U002",
    content_id: "S001",
    watch_date: new Date("2024-03-15"),
    watch_duration_minutes: 42,
    completion_percentage: 93.3,
    device_type: "Mobile",
    quality_level: "HD"
  },
  {
    session_id: "S003",
    user_id: "U003",
    content_id: "M002",
    watch_date: new Date("2024-03-16"),
    watch_duration_minutes: 95,
    completion_percentage: 96.9,
    device_type: "Tablet",
    quality_level: "HD"
  },
  {
    session_id: "S004",
    user_id: "U001",
    content_id: "S002",
    watch_date: new Date("2024-03-16"),
    watch_duration_minutes: 156,
    completion_percentage: 100,
    device_type: "Smart TV",
    quality_level: "4K"
  },
  {
    session_id: "S005",
    user_id: "U004",
    content_id: "M001",
    watch_date: new Date("2024-03-17"),
    watch_duration_minutes: 85,
    completion_percentage: 70.8,
    device_type: "Mobile",
    quality_level: "SD"
  }
]);
