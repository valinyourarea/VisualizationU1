import 'dotenv/config';
import type { PoolOptions } from 'mysql2'; // <- tipo correcto para el pool

export const dbConfig: PoolOptions = {
  host: process.env.MYSQL_HOST || 'etl_mysql',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root123',
  database: process.env.MYSQL_DB || 'streaming_db',
  port: Number(process.env.MYSQL_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
};
