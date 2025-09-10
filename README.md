# NoSQL Model - Streaming Platform Project

## Activity 1.2 Deliverables

### 1. Collection/document design for MongoDB
We transformed the relational model (ERD) into collections in MongoDB:
- **users**: stores user information (age, country, subscription type, registration date, total watch time).
- **content**: stores movies and series with metadata (title, genres, release year, rating, production budget, metrics).
- **viewing_sessions**: stores each viewing session (user, content, device, quality, duration, completion percentage).

This design replaces relational tables with flexible JSON-like documents, fitting the NoSQL approach.

---

### 2. Data insertion scripts with proper indexing
- Data was inserted with **dummy/example records** using `insertMany()` in `mongodb_setup.js`.  
  Example:
  ```js
  db.users.insertMany([
    { user_id: "U001", age: 25, country: "Mexico", subscription_type: "Premium", ... }
  ]);
  ```
  These records simulate real users, content, and sessions.

- Proper indexing ensures query optimization:
  ```js
  db.users.createIndex({ country: 1, subscription_type: 1 });
  db.content.createIndex({ "metrics.views_count": -1 });
  db.viewing_sessions.createIndex({ user_id: 1, watch_date: -1 });
  ```

Indexes improve performance on filtering, sorting, and aggregation queries.

---

### 3. Aggregation pipelines (minimum 3 stages each)
Three pipelines were created in `aggregation_pipelines.js`:

1. **Top 3 most viewed content**
   - Stages: `$project`, `$sort`, `$limit`  
   - Returns the 3 most popular movies/series by views.

2. **Average engagement per country**
   - Stages: `$lookup`, `$unwind`, `$group`, `$sort`  
   - Joins users with sessions and calculates average completion percentage grouped by country.

3. **Device usage distribution**
   - Stages: `$group`, `$sort`, `$project`  
   - Shows the number of sessions by device type.

Each pipeline has at least 3 stages, fulfilling the requirement.

---

### 4. Performance comparison between relational and NoSQL approaches
- **Relational (SQL)**: Requires `JOIN` and `GROUP BY` operations to combine tables (e.g., users + viewing_sessions). Queries are more rigid but ensure strong consistency.
- **NoSQL (MongoDB)**: Uses `aggregate` pipelines with `$lookup`, `$group`, etc. Queries are more flexible, scale better horizontally, and are optimized for analytical workloads.

**Conclusion**:  
- SQL is better for strong constraints and integrity.  
- NoSQL is better for analytics, scalability, and flexible data structures.

---

##  Summary
This project fulfills all deliverables from Activity 1.2:
- Collection/document design ✔️
- Data insertion with indexing ✔️
- Aggregation pipelines with ≥3 stages ✔️
- Relational vs NoSQL performance comparison ✔️
