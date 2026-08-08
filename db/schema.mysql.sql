-- =============================================================================
-- TMS Driver Portal - MySQL Schema
-- =============================================================================
-- Run against a MySQL 8+ server:
--   mysql -u root -e "CREATE DATABASE IF NOT EXISTS tms_driver_portal
--     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
--   mysql -u root tms_driver_portal < db/schema.mysql.sql
--
-- Idempotent: every statement is safe to re-run against a database that
-- already has some or all of these tables/columns (uses IF NOT EXISTS /
-- MODIFY COLUMN throughout), so this also acts as the migration script when
-- new columns are added later.
--
-- Field names are snake_case; the backend repositories (backend/src/data/
-- repositories/*.js) translate to/from the camelCase shape the rest of the
-- app already uses.
-- =============================================================================

SET NAMES utf8mb4;

-- -----------------------------------------------------------------------------
-- users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    employee_id     VARCHAR(20)  NULL UNIQUE,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(190) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    department      VARCHAR(100) NULL,
    role            ENUM('Requester','Processor','Operations','Operations Manager','AD Team','Admin') NOT NULL,
    manager_id      INT NULL,
    is_active       TINYINT(1) NOT NULL DEFAULT 1,
    auth_provider   ENUM('local','adfs') NOT NULL DEFAULT 'local',
    -- Transporter self-registration (see backend/src/controllers/authController.js
    -- registerTransporter): company_name/contract_number are the evidence a
    -- transporter submits, account_status gates login until Operations
    -- Manager review.
    company_name    VARCHAR(150) NULL,
    contract_number VARCHAR(50)  NULL,
    account_status  ENUM('Active','Pending','Rejected') NOT NULL DEFAULT 'Active',
    rejection_reason TEXT NULL,
    reviewed_by     INT NULL,
    reviewed_at     DATETIME NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_manager FOREIGN KEY (manager_id) REFERENCES users(id),
    CONSTRAINT fk_users_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bring an older copy of this table (created before Operations Manager /
-- the registration columns existed) up to date. No-ops if already applied.
-- `ADD COLUMN IF NOT EXISTS` isn't supported by every MySQL build, so these
-- go through information_schema + a prepared statement instead.
ALTER TABLE users MODIFY COLUMN employee_id VARCHAR(20) NULL;
ALTER TABLE users MODIFY COLUMN role ENUM('Requester','Processor','Operations','Operations Manager','AD Team','Admin') NOT NULL;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'company_name');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN company_name VARCHAR(150) NULL AFTER auth_provider', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'contract_number');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN contract_number VARCHAR(50) NULL AFTER company_name', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'account_status');
SET @sql := IF(@col_exists = 0, "ALTER TABLE users ADD COLUMN account_status ENUM('Active','Pending','Rejected') NOT NULL DEFAULT 'Active' AFTER contract_number", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'rejection_reason');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN rejection_reason TEXT NULL AFTER account_status', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'reviewed_by');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN reviewed_by INT NULL AFTER rejection_reason', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'reviewed_at');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE users ADD COLUMN reviewed_at DATETIME NULL AFTER reviewed_by', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND CONSTRAINT_NAME = 'fk_users_reviewed_by');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE users ADD CONSTRAINT fk_users_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- requests
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS requests (
    id                          INT AUTO_INCREMENT PRIMARY KEY,
    request_number              VARCHAR(20) NOT NULL UNIQUE,
    requester_id                INT NOT NULL,
    request_type                ENUM('Create Driver','Modify Driver','Disable Driver') NOT NULL,
    status                      ENUM('Submitted','Under Review – Operations Team','Returned to Requester','Processing – Operations Team','AD Team Review','Completed','Rejected') NOT NULL DEFAULT 'Submitted',
    description                 TEXT NULL,
    business_justification      TEXT NOT NULL,
    entry_method                ENUM('Manual','Excel Upload') NOT NULL DEFAULT 'Manual',
    current_processor_id        INT NULL,
    driver_profiles_completed_at DATETIME NULL,
    rpa_triggered_at            DATETIME NULL,
    ad_completed_at             DATETIME NULL,
    ad_completed_by             INT NULL,
    effective_date              DATE NULL,
    submitted_date              DATETIME NULL,
    completed_date              DATETIME NULL,
    created_at                  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at                  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_requests_requester FOREIGN KEY (requester_id) REFERENCES users(id),
    CONSTRAINT fk_requests_processor FOREIGN KEY (current_processor_id) REFERENCES users(id),
    CONSTRAINT fk_requests_ad_completed_by FOREIGN KEY (ad_completed_by) REFERENCES users(id),
    INDEX idx_requests_requester (requester_id),
    INDEX idx_requests_status (status),
    INDEX idx_requests_type (request_type),
    INDEX idx_requests_processor (current_processor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bring an older copy up to date: retired 'RPA Triggered' status, added the
-- "– Operations Team" suffixed names, and three columns that didn't exist yet.
ALTER TABLE requests MODIFY COLUMN status ENUM('Submitted','Under Review – Operations Team','Returned to Requester','Processing – Operations Team','AD Team Review','Completed','Rejected') NOT NULL DEFAULT 'Submitted';
ALTER TABLE requests MODIFY COLUMN entry_method ENUM('Manual','Excel Upload') NOT NULL DEFAULT 'Manual';

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'requests' AND COLUMN_NAME = 'rpa_triggered_at');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE requests ADD COLUMN rpa_triggered_at DATETIME NULL AFTER driver_profiles_completed_at', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'requests' AND COLUMN_NAME = 'ad_completed_at');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE requests ADD COLUMN ad_completed_at DATETIME NULL AFTER rpa_triggered_at', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'requests' AND COLUMN_NAME = 'ad_completed_by');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE requests ADD COLUMN ad_completed_by INT NULL AFTER ad_completed_at', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'requests' AND CONSTRAINT_NAME = 'fk_requests_ad_completed_by');
SET @sql := IF(@col_exists = 0, 'ALTER TABLE requests ADD CONSTRAINT fk_requests_ad_completed_by FOREIGN KEY (ad_completed_by) REFERENCES users(id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- -----------------------------------------------------------------------------
-- drivers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS drivers (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    request_id      INT NOT NULL,
    username        VARCHAR(190) NULL,
    first_name      VARCHAR(50)  NOT NULL,
    last_name       VARCHAR(50)  NOT NULL,
    email           VARCHAR(100) NOT NULL,
    phone           VARCHAR(10)  NOT NULL,
    role            VARCHAR(50)  NOT NULL DEFAULT 'Privileged User',
    customer_group  VARCHAR(50)  NULL,
    driver_class    VARCHAR(50)  NULL,
    operating_hours VARCHAR(100) NULL,
    po_number       VARCHAR(30)  NOT NULL DEFAULT '',
    po_expiry       DATE NULL,
    city            VARCHAR(50)  NULL,
    license_number  VARCHAR(20)  NULL,
    license_expiry  DATE NULL,
    id_expiry       DATE NULL,
    has_insurance   ENUM('Yes','No') NULL,
    change_summary  TEXT NULL,
    driver_status   ENUM('Disable Requested','Disabled') NULL,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_drivers_request FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    INDEX idx_drivers_request (request_id),
    INDEX idx_drivers_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- history
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS history (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    request_id  INT NOT NULL,
    old_status  ENUM('Submitted','Under Review – Operations Team','Returned to Requester','Processing – Operations Team','AD Team Review','Completed','Rejected') NULL,
    new_status  ENUM('Submitted','Under Review – Operations Team','Returned to Requester','Processing – Operations Team','AD Team Review','Completed','Rejected') NOT NULL,
    changed_by  INT NOT NULL,
    remarks     TEXT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_history_request FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_changed_by FOREIGN KEY (changed_by) REFERENCES users(id),
    INDEX idx_history_request (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE history MODIFY COLUMN old_status ENUM('Submitted','Under Review – Operations Team','Returned to Requester','Processing – Operations Team','AD Team Review','Completed','Rejected') NULL;
ALTER TABLE history MODIFY COLUMN new_status ENUM('Submitted','Under Review – Operations Team','Returned to Requester','Processing – Operations Team','AD Team Review','Completed','Rejected') NOT NULL;

-- -----------------------------------------------------------------------------
-- attachments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attachments (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    request_id     INT NOT NULL,
    file_name      VARCHAR(255) NOT NULL,
    file_path      VARCHAR(500) NOT NULL,
    mime_type      VARCHAR(100) NULL,
    file_size      INT NULL,
    uploaded_by    INT NOT NULL,
    uploaded_date  DATETIME DEFAULT CURRENT_TIMESTAMP,
    driver_index   INT NULL,
    doc_type       ENUM('licenseFile','idFile','photoFile') NULL,

    CONSTRAINT fk_attachments_request FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_attachments_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id),
    INDEX idx_attachments_request (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    request_id  INT NULL,
    title       VARCHAR(255) NOT NULL,
    message     TEXT NOT NULL,
    is_read     TINYINT(1) NOT NULL DEFAULT 0,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_notifications_request FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    INDEX idx_notifications_user_unread (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Least-privilege application user
-- -----------------------------------------------------------------------------
-- The backend should connect as this user, not root. Change the password
-- below and put the real one in backend/.env (DB_PASSWORD), never in source
-- control.
CREATE USER IF NOT EXISTS 'tms_app'@'localhost' IDENTIFIED BY 'ChangeThisPassword!123';
GRANT SELECT, INSERT, UPDATE, DELETE ON tms_driver_portal.* TO 'tms_app'@'localhost';
FLUSH PRIVILEGES;
