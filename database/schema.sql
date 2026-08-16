-- Smart Queue Management System - MySQL Schema
-- Database: sqms

CREATE DATABASE IF NOT EXISTS sqms
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sqms;

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(180)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('user','staff','admin') NOT NULL DEFAULT 'user',
  status        ENUM('active','inactive')   NOT NULL DEFAULT 'active',
  counter_id    INT           DEFAULT NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(120)  NOT NULL,
  token_prefix     VARCHAR(4)    NOT NULL,
  avg_service_time INT          NOT NULL DEFAULT 5,
  status           ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_service_prefix (token_prefix),
  INDEX idx_services_status (status)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Counters
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS counters (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120)  NOT NULL,
  service_id  INT           DEFAULT NULL,
  staff_id    INT           DEFAULT NULL,
  status      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_counters_service (service_id),
  INDEX idx_counters_staff (staff_id),
  CONSTRAINT fk_counters_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
  CONSTRAINT fk_counters_staff FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Tokens
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tokens (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  token_number    VARCHAR(20)   NOT NULL,
  user_id         INT           DEFAULT NULL,
  service_id      INT           NOT NULL,
  counter_id      INT           DEFAULT NULL,
  status          ENUM('waiting','called','serving','completed','skipped','cancelled')
                                NOT NULL DEFAULT 'waiting',
  queue_position  INT           NOT NULL DEFAULT 0,
  people_ahead    INT           NOT NULL DEFAULT 0,
  estimated_wait  INT           NOT NULL DEFAULT 0,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  called_at       DATETIME      DEFAULT NULL,
  started_at      DATETIME      DEFAULT NULL,
  completed_at    DATETIME      DEFAULT NULL,
  INDEX idx_tokens_service (service_id),
  INDEX idx_tokens_user (user_id),
  INDEX idx_tokens_status (status),
  INDEX idx_tokens_counter (counter_id),
  INDEX idx_tokens_created (created_at),
  CONSTRAINT fk_tokens_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  CONSTRAINT fk_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_tokens_counter FOREIGN KEY (counter_id) REFERENCES counters(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Foreign key: users.counter_id -> counters.id (added after counters exists)
-- ---------------------------------------------------------------------------
ALTER TABLE users
  ADD CONSTRAINT fk_users_counter FOREIGN KEY (counter_id) REFERENCES counters(id) ON DELETE SET NULL;
