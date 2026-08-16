-- Smart Queue Management System - Seed Data
-- Run after schema.sql
-- Password hashes are real bcrypt hashes generated with bcrypt.gensalt(12)

USE sqms;

-- ---------------------------------------------------------------------------
-- Services
-- ---------------------------------------------------------------------------
INSERT INTO services (name, token_prefix, avg_service_time, status) VALUES
  ('Admissions',         'ADM', 8,  'active'),
  ('Financial Aid',      'FIN', 10, 'active'),
  ('Registrar',          'REG', 6,  'active'),
  ('IT Help Desk',       'IT',  5,  'active'),
  ('Student Counseling', 'CNS', 15, 'active')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ---------------------------------------------------------------------------
-- Admin account
--    email: admin@sqms.local   password: admin123
-- ---------------------------------------------------------------------------
INSERT INTO users (name, email, password_hash, role, status) VALUES
  ('System Admin', 'admin@sqms.local', '$2b$12$ht/1VaSVJzzNFNC/qAVEsO/tKd6QN.COkKav5brQvEPnP7VFfiiEW', 'admin', 'active')
ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash);

-- ---------------------------------------------------------------------------
-- Staff account (counter assigned below)
--    email: staff@sqms.local   password: staff123
-- ---------------------------------------------------------------------------
INSERT INTO users (name, email, password_hash, role, status) VALUES
  ('Jane Staff', 'staff@sqms.local', '$2b$12$LYBPOYoNeexWZSBJMxonSO5eh2zZ/Bp.100MID8merCE9hBYRiHWm', 'staff', 'active')
ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash);

-- ---------------------------------------------------------------------------
-- Sample user account
--    email: user@sqms.local   password: user123
-- ---------------------------------------------------------------------------
INSERT INTO users (name, email, password_hash, role, status) VALUES
  ('John User', 'user@sqms.local', '$2b$12$nJo15hSgSMJ0JgnmC36Vwu4SlBhLGiTXwJv8Z.IkPz7Pdtmh49QFq', 'user', 'active')
ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash);

-- ---------------------------------------------------------------------------
-- Counters
-- ---------------------------------------------------------------------------
INSERT INTO counters (name, service_id, staff_id, status) VALUES
  ('Counter 1', 1, 2, 'active'),
  ('Counter 2', 2, NULL, 'active'),
  ('Counter 3', 3, NULL, 'active'),
  ('Counter 4', 4, NULL, 'inactive')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ---------------------------------------------------------------------------
-- Link staff to counter 1
-- ---------------------------------------------------------------------------
UPDATE users SET counter_id = 1 WHERE email = 'staff@sqms.local';
