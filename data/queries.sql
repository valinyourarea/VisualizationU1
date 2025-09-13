-- Primera Query (Top 5 most-watched content by country)
SELECT country, 
       content_id, 
       title, 
       total_watch_minutes
FROM (
    SELECT u.country,
           c.content_id,
           c.title,
           SUM(vs.watch_duration_minutes) AS total_watch_minutes,
           RANK() OVER (PARTITION BY u.country ORDER BY SUM(vs.watch_duration_minutes) DESC) AS rank
    FROM content c
    JOIN viewing_sessions vs
        ON c.content_id = vs.content_id
    JOIN users u
        ON vs.user_id = u.user_id
    GROUP BY u.country, c.content_id, c.title
) ranked
WHERE rank <= 5
ORDER BY country, rank;
-- Segunda Query (User retention analysis by subscription type)
SELECT u.subscription_type,
       COUNT(DISTINCT u.user_id) AS total_users,
       COUNT(DISTINCT v.user_id) AS active_users,
       ROUND(COUNT(DISTINCT v.user_id)::decimal / COUNT(DISTINCT u.user_id) * 100, 2) AS retention_rate
FROM users u
LEFT JOIN viewing_sessions v ON u.user_id = v.user_id
GROUP BY u.subscription_type;
-- Tercera Query (Revenue analysis by content genre)
SELECT g.genre, 
       SUM(v.watch_duration_minutes * 0.05) AS estimated_revenue
FROM content c
JOIN viewing_sessions v 
    ON c.content_id = v.content_id
CROSS JOIN LATERAL jsonb_array_elements_text(c.genre) AS g(genre)
GROUP BY g.genre
ORDER BY estimated_revenue DESC;
-- Cuarta Query (Seasonal viewing patterns)
SELECT EXTRACT(MONTH FROM v.watch_date) AS month, COUNT(*) AS total_views
FROM viewing_sessions v
GROUP BY month
ORDER BY month; 
-- Quinta Query (Device preference correlation with completion rates)
SELECT v.device_type,
       ROUND(AVG(v.completion_percentage)::numeric, 2) AS avg_completion_rate_percent
FROM viewing_sessions v
LEFT JOIN movies m ON v.content_id = m.content_id
LEFT JOIN series s ON v.content_id = s.content_id
GROUP BY v.device_type
ORDER BY avg_completion_rate_percent DESC;

