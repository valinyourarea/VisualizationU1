-- =====================================================================
-- Base de datos y tablas
-- =====================================================================

CREATE DATABASE IF NOT EXISTS streaming_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE streaming_db;

-- ---------------------------------------------------------------------
-- Tipos de suscripción (dimensión)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_types (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(50) NOT NULL UNIQUE,
  price     DECIMAL(10,2) DEFAULT 0
) ENGINE=InnoDB;

INSERT INTO subscription_types (name, price) VALUES
  ('Basic', 5.99), ('Standard', 9.99), ('Premium', 14.99)
ON DUPLICATE KEY UPDATE price = VALUES(price);

-- ---------------------------------------------------------------------
-- Tipos de dispositivo (dimensión)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS device_types (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT INTO device_types (name) VALUES
  ('Desktop'), ('Mobile'), ('Smart TV'), ('Tablet'), ('Other')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ---------------------------------------------------------------------
-- Usuarios
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id               VARCHAR(20) PRIMARY KEY,
  age                   INT NULL,
  country               VARCHAR(100) NULL,
  subscription_type_id  INT NULL,
  INDEX idx_users_sub (subscription_type_id),
  CONSTRAINT fk_users_sub
    FOREIGN KEY (subscription_type_id) REFERENCES subscription_types(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Sesiones de visualización
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS viewing_sessions (
  session_id             VARCHAR(30) PRIMARY KEY,
  user_id                VARCHAR(20) NOT NULL,
  content_id             VARCHAR(30) NULL,
  watch_date             DATETIME NULL,
  duration_minutes       INT NULL,
  completion_percentage  DECIMAL(5,2) NULL,
  device_type_id         INT NULL,
  INDEX idx_vs_user (user_id),
  INDEX idx_vs_date (watch_date),
  INDEX idx_vs_device (device_type_id),
  CONSTRAINT fk_vs_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_vs_device
    FOREIGN KEY (device_type_id) REFERENCES device_types(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Métricas agregadas por usuario
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_metrics (
  user_id         VARCHAR(20) PRIMARY KEY,
  total_sessions  INT DEFAULT 0,
  total_minutes   DECIMAL(12,2) DEFAULT 0,          -- <== agregada
  avg_completion  DECIMAL(6,2) DEFAULT 0,
  favorite_device VARCHAR(50) NULL,
  last_activity   DATETIME NULL,
  CONSTRAINT fk_um_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;
