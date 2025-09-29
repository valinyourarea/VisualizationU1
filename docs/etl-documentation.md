# Comprehensive Data Analysis and Visualization: Phase 4 ETL and Pipeline

**Author(s):** [Isaias Lopez, Joaquin Murguia, Valeria Paredes, Damaris Pech and Krishna Sandoval]
**Date:** [Date]  
**Course:** Visual Modeling Information  
**Program:** Data Engineering  
**Institution:** Universidad Politécnica de Yucatán  

---

## AI Assistance Disclosure

This document was created with assistance from AI tools. The following outlines the nature and extent of AI involvement:

- **AI Tool Used:** ChatGPT.
- **Type of Assistance:** Code generation and Debugging.
- **Extent of Use:** Complete code generation with human review.
- **Human Contribution:** Once the code was generated with the help of artificial intelligence, my colleague began testing the code and modifying it with his knowledge to arrive at this final version.

- - **Prompt link:** The link does not find because my classmate delete the prompt.

- **AI Assistance:** 100%

**Academic Integrity Statement:** All AI-generated content has been reviewed, understood, and verified by the author. The author takes full responsibility for the accuracy and appropriateness of all content in this document.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Objectives](#objectives)
3. [Methodology](#methodology)
4. [Implementation](#implementation)
5. [Results](#results)
6. [Conclusions](#conclusions)
7. [References](#references)

---

## Project Overview

This project implements a Dual-Pipeline ETL (Extract, Transform, Load) system designed to process and aggregate data for a high-volume streaming service platform. The system is split into two distinct, parallel pipelines to handle different data types efficiently:

For Relational ETL Pipeline (MySQL/MariaDB): Processes streaming transactional data (Users, Viewing Sessions) from CSV files. This pipeline is orchestrate via a sequential Directed Acyclic Graph (DAG) structure for dependable and traceable execution. Its primary goal is to generate User Metrics for business intelligence.

For the Document ETL Pipeline (MongoDB): Handles static content metadata (Movies/Content) from a JSON file, focusing on fast, idempotent loading into a flexible NoSQL structure.

In addition, the system is developed using TypeScript for robust type safety across both the backend services and the frontend monitoring hook.

## Objectives

- [ ]  Establish a robust, traceable ETL pipeline for high-volume streaming transactional data into a relational database (MySQL/MariaDB).

- [ ] Implement data aggregation logic to transform raw session data into valuable business metrics (e.g., favorite device, total views).

- [ ] Develop a separate, highly efficient, and idempotent service for loading content metadata into a document database (MongoDB).

- [ ] Provide a real-time monitoring interface via a React hook (useETL.ts) to track the status, progress, and performance metrics of the MySQL DAG execution.

- [ ] Ensure data integrity and quality by implementing checks for non-zero record counts and handling missing values like `watch_date` `validation`.

## Methodology

### Data Sources

- **Dataset 1** Users: Analyze Device Usage Patterns and Geographic Viewing Preferences to identify trends in user access and regional content popularity.

- **Dataset 2** Content: JSON files (300 records: 200 Movies + 100 Series). Includes titles, genres, ratings, and production budgets.

- **Dataset 3** Viewing Sessions: CSV files (222,785 records). Contains viewing activity per user, content, duration, and device.

### Tools and Technologies
- **Database:** 

- PostgreSQL: It an open-source descendant of this original Berkeley code. It supports a large part of the SQL standard and offers many modern features: complex queries, foreign keys, triggers, updatable views, transactional integrity and multiversion concurrency control.

- MongoDB: It stores data in flexible JSON-like documents, so fields can vary between documents and the data structure can change over time. The document model is mapped to objects in your application code to make it easier to work with the data.

- **Programming Language:** 

- Python: It is an interpreted, object-oriented, high-level programming language with dynamic semantics. Its high-level built in data structures, combined with dynamic typing and dynamic binding, make it very attractive for Rapid Application Development, as well as for use as a scripting or glue language to connect existing 
components together.

- TypeScript: It is a statically typed superset of JavaScript, which means it adds additional features to JavaScript, including static typing. This allows for better tooling and improved error detection during development. On the other hand, JavaScript is dynamically typed, meaning the type of a variable is checked during runtime, which can lead to unexpected errors but also provides more flexibility.

- **Libraries:** 

- csv-parser: It is a tool or library designed to read, interpret, and process data stored in CSV (Comma-Separated Values) format. CSV files are widely used for storing tabular data, where each line represents a row, and fields within the row are separated by commas (or other delimiters like tabs or semicolons). A CSV parser extracts this data into a structured format, such as dictionaries, lists, or objects, for further manipulation or analysis.


### Approach
The solution involves a separation of concerns based on data usage:

1. MySQL ETL Pipeline (ETLService): Operates on a batch processing architecture, where data from CSV files is read in chunks (batch size 1000), transformed, and loaded. The entire process is modeled as an 8-step DAG to enforce correct execution order and dependency management.

2. MongoDB Content Loader (MongoDBETLService): Executes an idempotent load strategy. It performs a collection purge before loading the new content data from JSON. It uses `bulkWrite` with an upsert: true option for performance, processing data in batches of 100.

## Implementation

### Phase 1: MySQL DAG Execution (etl.service.ts)

The DAG orchestrates the transactional data load. Each step (DagNode) must succeed before its dependents can run.

![alt text](/img/image24.png)

### Phase 2: : MongoDB Content ETL (mongodb-etl.service.ts)

This service handles the content metadata load and collection analysis

```Typescript
// backend/src/services/mongodb-etl.service.ts (MongoDBETLService.runETL)
// ...
const operations = batch.map(movie => ({
  updateOne: {
    filter: { content_id: movie.content_id },
    update: { $set: movie },
    upsert: true // Ensures the content is inserted if not found, or updated if it exists
  }
}));

const result = await Content.bulkWrite(operations);
// ...
```
-  Uses Content.deleteMany({}) to clear the collection before loading, ensuring a fresh start.

- Employs Content.bulkWrite with upsert: true for efficient batch loading of data (batch size 100).

- Creates strategic indexes for query performance: content_id: 1, genre: 1, release_year: -1, rating: -1.

- Includes getCollectionStats method to provide analytical data using MongoDB's aggregation pipeline ($group, $unwind, $sort).


### Phase 3: Frontend Monitoring (useETL.ts)

The useETL React hook connects the frontend to the ETL process:

- State Management: Tracks the overall dag status (idle, running, success, error), loading status, and error messages.

- Polling: Automatically polls the /etl/status endpoint every 2000ms (2 seconds) when the DAG status is 'running' to provide near real-time updates.

- Actions: Exposes startETL(), resetETL(), and refresh() methods to control and update the pipeline state.

- Normalization: Includes a normalizeDag utility to handle various API response formats and ensure the data conforms to the ETLDag type.


## Results

### Key Findings
1. **Finding 1** Idempotency Achieved: Both ETL services utilize strategies for idempotent loads: `bulkWrite` with upsert: true in MongoDB and ON DUPLICATE KEY UPDATE in MySQL. This prevents duplicate data on re-runs. 
2. **Finding 2** Performance Optimization: The use of bulkWrite for MongoDB and batched inserts/updates for MySQL/CSV processing (batch size 1000 for MySQL, 100 for MongoDB) significantly improves loading performance.
3. **Finding 3** Complex Aggregation: The `create_aggregations` step successfully calculates the favorite_device per user using a sophisticated subquery within the main aggregation query in MySQL.

### Visualizations
![alt text](/img/image25.png)

### Performance Metrics
![alt text](/img/image26.png)

## Conclusions

### Summary
The project successfully established a robust, two-part data pipeline for a streaming service. The MySQL ETL, structured as a monitored DAG, ensures reliable and sequential processing of user and session data, concluding with valuable aggregate metrics. The MongoDB ETL provides a fast and indexed mechanism for managing static content metadata. The combination of relational (MySQL) and document (MongoDB) databases is leveraged effectively for their respective strengths (transactional data/metrics vs. flexible content metadata).

### Lessons Learned
- Database-Specific Optimizations: Leveraging `bulkWrite` (MongoDB) and `ON DUPLICATE KEY UPDATE`/batched inserts (MySQL) is crucial for efficient data loading in high-volume scenarios.

- Data Standardization in ETL: The CSV processing steps require extensive data normalization (e.g., handling various casings for header names, sanitizing numbers, date parsing) to ensure clean loading.

- Real-Time Monitoring: Implementing a frontend polling mechanism for DAG status significantly enhances the user experience by providing transparency into long-running ETL processes.

### Future Work
- Dynamic DAG Scheduling: Implement a scheduler using a library like Agenda or BullMQ, or a tool like Apache Airflow instead of sequential `await` calls to allow for parallel execution of non-dependent nodes.

- Schema Management: Implement a dedicated stepDropSchema or stepCreateSchema to dynamically manage table creation/deletion rather than relying only on existence checks and DELETE FROM/DROP TABLE where appropriate.

- Error Handling/Notifications: Add a mechanism to send error notifications as Slack, email when the DAG status transitions to 'error'.

## References

1. [JavaScript with syntax for types, A. (2025).]
2. [https://www.typescriptlang.org/]
3. [What is PostgreSQL?, A. (2025). “PostgreSQL Documentation,”]
4. [https://www.postgresql.org/docs/current/intro-whatis.html]
5. [MongoDB, A. (2025). “¿Qué es MongoDB?,” MongoDB.]
6. [https://www.mongodb.com/es/company/what-is-mongodb?msockid=36904fd7b86269e2111b59a7b9ec68fb]
7. [CSV Parse, A. (2025).usage.]
8. [https://csv.js.org/parse/]
9. [Users.csv]
10. [Content.json]
11. [viewing_Sessions.csv]
---

**Note:** This document is part of the academic portfolio for the Data Engineering program at Universidad Politécnica de Yucatán.
