// =============================
// PIPELINE 1: User engagement by demographics
// =============================
db.viewing_sessions.aggregate([
  { $lookup: { from: "users", localField: "user_id", foreignField: "user_id", as: "user" } },
  { $unwind: "$user" },
  { $group: {
      _id: { country: "$user.country", subscription: "$user.subscription_type" },
      avg_completion: { $avg: "$completion_percentage" },
      total_watch: { $sum: "$watch_duration_minutes" }
  }},
  { $sort: { total_watch: -1 } }
]);

// =============================
// PIPELINE 2: Content performance
// =============================
db.viewing_sessions.aggregate([
  { $lookup: { from: "content", localField: "content_id", foreignField: "content_id", as: "content" } },
  { $unwind: "$content" },
  { $group: {
      _id: "$content.title",
      total_views: { $sum: 1 },
      avg_completion: { $avg: "$completion_percentage" }
  }},
  { $sort: { total_views: -1 } }
]);

// =============================
// PIPELINE 3: Geographic distribution of users
// =============================
db.users.aggregate([
  { $group: {
      _id: "$country",
      total_users: { $sum: 1 },
      avg_watch_time: { $avg: "$total_watch_time_hours" }
  }},
  { $sort: { total_users: -1 } }
]);

// =============================
// PIPELINE 4: Device preference correlation
// =============================
db.viewing_sessions.aggregate([
  { $group: {
      _id: "$device_type",
      avg_completion: { $avg: "$completion_percentage" },
      total_sessions: { $sum: 1 }
  }},
  { $sort: { total_sessions: -1 } }
]);
