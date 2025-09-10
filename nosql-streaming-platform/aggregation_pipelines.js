// Pipeline 1: Top 3 contenidos más vistos
// Selecciona título y número de vistas, ordena y limita a 3 resultados.
db.content.aggregate([
  { $project: { title: 1, views: "$metrics.views_count" } },
  { $sort: { views: -1 } },
  { $limit: 3 }
]);

// Pipeline 2: Engagement promedio por país
// Une sesiones con usuarios, agrupa por país y calcula promedio de completitud.
db.viewing_sessions.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "user_id",
      foreignField: "user_id",
      as: "user_info"
    }
  },
  { $unwind: "$user_info" },
  {
    $group: {
      _id: "$user_info.country",
      avgCompletion: { $avg: "$completion_percentage" }
    }
  },
  { $sort: { avgCompletion: -1 } }
]);

// Pipeline 3: Distribución de dispositivos
// Agrupa sesiones por tipo de dispositivo, cuenta sesiones y ordena.
db.viewing_sessions.aggregate([
  { $group: { _id: "$device_type", sessions: { $sum: 1 } } },
  { $sort: { sessions: -1 } },
  { $project: { device: "$_id", sessions: 1, _id: 0 } }
]);