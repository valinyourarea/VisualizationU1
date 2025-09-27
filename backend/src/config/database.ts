// ============= backend/src/config/database.ts =============
import mysql from 'mysql2/promise';

export const dbConfig = {
  host: process.env.DB_HOST || 'mysql',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'etluser',
  password: process.env.DB_PASSWORD || 'etlpass',
  database: process.env.DB_NAME || 'streaming_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

export const createConnection = async () => {
  try {
    const pool = mysql.createPool(dbConfig);
    console.log('Database connection pool created');
    return pool;
  } catch (error) {
    console.error('Failed to create database connection:', error);
    throw error;
  }
};
