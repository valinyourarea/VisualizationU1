-- Schema SQL para referencia
CREATE DATABASE IF NOT EXISTS streaming_db;
USE streaming_db;

-- Tablas del ETL
CREATE TABLE IF NOT EXISTS subscription_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE,
  price DECIMAL(10, 2)
);

CREATE TABLE IF NOT EXISTS device_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE,
  category VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS users (
  user_id VARCHAR(20) PRIMARY KEY,
  age INT,
  country VARCHAR(100),
  subscription_type_id INT,
  registration_date DATE,
  total_watch_hours DECIMAL(10, 2),
  FOREIGN KEY (subscription_type_id) REFERENCES subscription_types(id)
);

CREATE TABLE IF NOT EXISTS viewing_sessions (
  session_id VARCHAR(20) PRIMARY KEY,
  user_id VARCHAR(20),
  content_id VARCHAR(20),
  device_type_id INT,
  quality VARCHAR(10),
  watch_date DATE,
  duration_minutes INT,
  completion_percentage DECIMAL(5, 2),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (device_type_id) REFERENCES device_types(id)
);

CREATE TABLE IF NOT EXISTS user_metrics (
  user_id VARCHAR(20) PRIMARY KEY,
  total_sessions INT,
  avg_completion DECIMAL(5, 2),
  favorite_device VARCHAR(50),
  last_activity DATE,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);