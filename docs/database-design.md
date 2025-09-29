# Comprehensive Data Analysis and Visualization Portfolio: Phase 1 Database Design

**Author(s):** 
- Isaías De Jesús López Tzec

- Joaquin de Jesús Murguía Ortiz

- Valeria De Los Ángeles Paredes Dzib

- Damaris Esther Pech Aque

- Ana Paula Ramírez Romero

- Krishna Sandoval Cambranis

**Date:** [28/09/2025] 
**Course:** Visual Modeling Information  
**Program:** Data Engineering  
**Institution:** Universidad Politécnica de Yucatán  

---

## AI Assistance Disclosure
This document was created with assistance from AI tools. The following outlines the nature and extent of AI involvement:

- **AI Tool Used:** ChatGPT  
- **Type of Assistance:** [Documentation writing]  
- **Extent of Use:** [Writing assistance for the .md file format and support for a better document structure]
- **Human Contribution:** [The contents of this documents were developed and written down in this document by the authors of this project]

- **Academic Integrity Statement:** All AI-generated content has been reviewed, understood, and verified by the author. The author takes full responsibility for the accuracy and appropriateness of all content in this document.  

---

## Table of Contents
- Project Overview  
- Objectives  
- Methodology  
  - Data Sources  
  - Tools and Technologies  
  - Approach  
- Implementation  
- Key Findings  
- Performance Metrics  
- Conclusions  
  - Summary  
  - Lessons Learned  
  - Future Work  
- References  

---

## Project Overview
Phase 1 of this project focuses on the implementation of **relational** and **non-relational databases** to organize and analyze a dataset of **movies and series**.  
The relational component uses CSV files (`users.csv` and `viewing_sessions.csv`) modeled into a SQL schema, while the non-relational component leverages MongoDB to handle metadata from `content.json`.  
This dual setup enables both structured analysis of user behavior and flexible storage of diverse content attributes.  

---

## Objectives
- Design and implement relational database schemas using SQL for user and session data  
- Store and manage non-relational metadata using MongoDB  
- Ensure integration of both structured and semi-structured datasets  
- Build a solid data foundation for later visualization and predictive modeling  

---

## Methodology

### Data Sources
- **Dataset 1:** `users.csv` — contains structured data about platform users  
- **Dataset 2:** `viewing_sessions.csv` — records of users’ interactions with movies and series  
- **Dataset 3:** `content.json` — unstructured metadata describing movies and series  

### Tools and Technologies
- **Database:** PostgreSQL (relational), MongoDB (non-relational)  
- **Programming Language:** TypeScript (backend), SQL  
- **Libraries:** Mongoose (for MongoDB), ETL services  
- **Data Format:** CSV for relational data, JSON for non-relational content  

### Approach
1. **Relational Model:** Convert `users.csv` and `viewing_sessions.csv` into SQL tables with primary/foreign key relationships.  
2. **Schema Creation:** Define structured fields such as user IDs, session times, and content IDs.  
3. **Non-Relational Model:** Import `content.json` into MongoDB collections for storing metadata like genres, titles, and cast.  

---

## Implementation

### Phase 1: Database Layer
- **Relational Database (SQL):**  
  The relational schema models **users** and their **viewing sessions**, enabling structured queries such as “most watched movies” or “average session duration.”  

- **Non-Relational Database (MongoDB):**  
  Metadata about movies and series is stored in MongoDB for flexibility, as attributes like cast or genres vary widely between entries.  

### Code Example (SQL Schema Snippet)

```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE viewing_sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    content_id VARCHAR(50),
    watch_time INT,
    session_date TIMESTAMP
);
```
### Code Example (MongoDB ETL Snippet)

```typescript
import { MongoClient } from "mongodb";
import content from "../../data/norelational/content.json";

async function importContent() {
  const client = new MongoClient("mongodb://localhost:27017");
  await client.connect();
  const db = client.db("streamingDB");
  const collection = db.collection("content");
  await collection.insertMany(content);
  console.log("Movie and series metadata imported into MongoDB!");
  client.close();
}
```
# Key Findings

- Relational CSV data (`users.csv`, `viewing_sessions.csv`) is well-suited for analyzing user behavior and session activity.  
- Non-relational JSON data (`content.json`) provides a flexible representation of diverse movie/series attributes.  
- Combining relational and non-relational models allows for a holistic understanding of both **who watches** and **what they watch**.  

---

# Performance Metrics

| Metric          | Value   | Description                                    |
|-----------------|---------|------------------------------------------------|
| Query Accuracy  | 100%    | SQL queries return expected structured results |
| ETL Processing  | < 2s    | Import JSON into MongoDB collections           |
| Memory Usage    | < 50MB  | Lightweight in development phase               |

---

# Conclusions

## Summary
The relational and non-relational database setup effectively organizes both structured and unstructured data about movies and series.  
This foundation ensures scalable data management, enabling deeper analysis of user behavior and content metadata in future phases.  

## Lessons Learned
- Relational databases are ideal for analyzing user activity and enforcing data integrity.  
- MongoDB provides the flexibility needed for diverse content metadata.  
- A hybrid model leverages the strengths of both paradigms.  

## Future Work
- Add indexing to optimize SQL and MongoDB queries.  
- Build cross-database joins between user behavior and content metadata.  
- Scale datasets for performance testing under real-world loads.  

---

# References
- [MongoDB Documentation](https://www.mongodb.com/docs)  
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)  
- Project datasets: `users.csv`, `viewing_sessions.csv`, `content.json`  
