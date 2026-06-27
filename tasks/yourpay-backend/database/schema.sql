-- ============================================================
-- YourPay Database Schema
-- Version: 1.0.0
-- Engine: MySQL 8.0+ / MariaDB 10.5+
-- ============================================================

CREATE DATABASE IF NOT EXISTS yourpay_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE yourpay_db;

-- ─── Users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            VARCHAR(36)  NOT NULL DEFAULT (UUID()),
    email         VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    dob           DATE         NOT NULL,
    profile_pic   TEXT,
    wallet_number VARCHAR(20)  NOT NULL,
    upi_id        VARCHAR(100) NOT NULL,
    pin_hash      VARCHAR(255) NOT NULL,
    referral_code VARCHAR(20)  NOT NULL,
    is_verified   TINYINT(1)   NOT NULL DEFAULT 0,
    is_frozen     TINYINT(1)   NOT NULL DEFAULT 0,
    pin_attempts  TINYINT      NOT NULL DEFAULT 0,
    pin_locked_until DATETIME  DEFAULT NULL,
    member_since  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email         (email),
    UNIQUE KEY uq_users_wallet_number (wallet_number),
    UNIQUE KEY uq_users_upi_id        (upi_id),
    UNIQUE KEY uq_users_referral_code (referral_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Wallets ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wallets (
    id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
    user_id       VARCHAR(36)   NOT NULL,
    type          ENUM('main','savings','rewards') NOT NULL,
    balance       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    wallet_number VARCHAR(20)   NOT NULL,
    upi_id        VARCHAR(100)  NOT NULL,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_wallets_user_type    (user_id, type),
    UNIQUE KEY uq_wallets_number       (wallet_number),
    UNIQUE KEY uq_wallets_upi_id       (upi_id),
    FOREIGN KEY fk_wallets_user        (user_id) REFERENCES users(id) ON DELETE CASCADE,
    -- Enforce non-negative balance at DB level
    CONSTRAINT chk_wallets_balance CHECK (balance >= 0.00)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Virtual Cards ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS virtual_cards (
    id            VARCHAR(36)  NOT NULL DEFAULT (UUID()),
    user_id       VARCHAR(36)  NOT NULL,
    card_number   VARCHAR(19)  NOT NULL,  -- "XXXX XXXX XXXX XXXX"
    cvv_hash      VARCHAR(255) NOT NULL,
    expiry_month  CHAR(2)      NOT NULL,
    expiry_year   CHAR(2)      NOT NULL,
    holder_name   VARCHAR(255) NOT NULL,
    theme         ENUM('midnight','ocean','sunset') NOT NULL DEFAULT 'midnight',
    is_frozen     TINYINT(1)   NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_virtual_cards_number (card_number),
    FOREIGN KEY fk_virtual_cards_user  (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Transactions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
    id             VARCHAR(36)   NOT NULL DEFAULT (UUID()),
    txn_id         VARCHAR(50)   NOT NULL,
    reference_id   VARCHAR(50)   NOT NULL,
    sender_id      VARCHAR(36)   NOT NULL,
    receiver_id    VARCHAR(36)   NOT NULL,
    sender_wallet  VARCHAR(36)   NOT NULL,
    receiver_wallet VARCHAR(36)  NOT NULL,
    amount         DECIMAL(15,2) NOT NULL,
    method         ENUM('upi','wallet','card','qr') NOT NULL,
    status         ENUM('pending','awaiting_approval','processing','success','failed','rejected','refunded','cancelled','expired') NOT NULL DEFAULT 'pending',
    wallet_type    ENUM('main','savings','rewards') NOT NULL DEFAULT 'main',
    note           TEXT,
    created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_transactions_txn_id  (txn_id),
    UNIQUE KEY uq_transactions_ref_id  (reference_id),
    FOREIGN KEY fk_txn_sender          (sender_id)   REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY fk_txn_receiver        (receiver_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY fk_txn_sender_wallet   (sender_wallet)   REFERENCES wallets(id) ON DELETE RESTRICT,
    FOREIGN KEY fk_txn_receiver_wallet (receiver_wallet) REFERENCES wallets(id) ON DELETE RESTRICT,
    CONSTRAINT chk_txn_amount CHECK (amount > 0),
    INDEX idx_txn_sender   (sender_id),
    INDEX idx_txn_receiver (receiver_id),
    INDEX idx_txn_status   (status),
    INDEX idx_txn_date     (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Notifications ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id         VARCHAR(36) NOT NULL DEFAULT (UUID()),
    user_id    VARCHAR(36) NOT NULL,
    type       ENUM('money_received','money_sent','card_request','card_approved','card_declined',
                    'refund','admin_credit','admin_debit','offer','announcement','security','login') NOT NULL,
    title      VARCHAR(255) NOT NULL,
    message    TEXT         NOT NULL,
    amount     DECIMAL(15,2) DEFAULT NULL,
    txn_id     VARCHAR(50)   DEFAULT NULL,
    is_read    TINYINT(1)   NOT NULL DEFAULT 0,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY fk_notif_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user_read (user_id, is_read),
    INDEX idx_notif_date      (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Payment Requests (Card) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_requests (
    id            VARCHAR(36)   NOT NULL DEFAULT (UUID()),
    requester_id  VARCHAR(36)   NOT NULL,
    card_owner_id VARCHAR(36)   NOT NULL,
    card_number   VARCHAR(19)   NOT NULL,
    amount        DECIMAL(15,2) NOT NULL,
    status        ENUM('pending','accepted','rejected','expired') NOT NULL DEFAULT 'pending',
    expires_at    DATETIME      NOT NULL,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY fk_pr_requester  (requester_id)  REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY fk_pr_card_owner (card_owner_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_pr_amount CHECK (amount > 0),
    INDEX idx_pr_card_owner (card_owner_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── OTP Store ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_store (
    id         VARCHAR(36)  NOT NULL DEFAULT (UUID()),
    email      VARCHAR(255) NOT NULL,
    otp_hash   VARCHAR(255) NOT NULL,
    expires_at DATETIME     NOT NULL,
    used       TINYINT(1)   NOT NULL DEFAULT 0,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_otp_email   (email),
    INDEX idx_otp_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Savings Goals ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS savings_goals (
    id          VARCHAR(36)   NOT NULL DEFAULT (UUID()),
    user_id     VARCHAR(36)   NOT NULL,
    name        VARCHAR(255)  NOT NULL,
    target      DECIMAL(15,2) NOT NULL,
    current     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    deadline    DATE          DEFAULT NULL,
    is_complete TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY fk_goals_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_goals_target  CHECK (target > 0),
    CONSTRAINT chk_goals_current CHECK (current >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Login History ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_history (
    id         VARCHAR(36)  NOT NULL DEFAULT (UUID()),
    user_id    VARCHAR(36)  NOT NULL,
    ip_address VARCHAR(45)  NOT NULL,
    user_agent VARCHAR(500) NOT NULL,
    status     ENUM('success','failed','frozen') NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    FOREIGN KEY fk_lh_user (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_lh_user (user_id),
    INDEX idx_lh_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Audit Logs ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id         VARCHAR(36)  NOT NULL DEFAULT (UUID()),
    user_id    VARCHAR(36)  DEFAULT NULL,
    user_name  VARCHAR(255) DEFAULT NULL,
    action     VARCHAR(100) NOT NULL,
    details    TEXT         NOT NULL,
    ip_address VARCHAR(45)  NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_audit_user   (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_date   (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Admin Users ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
    id            VARCHAR(36)  NOT NULL DEFAULT (UUID()),
    username      VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('superadmin','admin') NOT NULL DEFAULT 'admin',
    is_active     TINYINT(1)   NOT NULL DEFAULT 1,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_admin_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Offers / Coupons ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offers (
    id          VARCHAR(36)  NOT NULL DEFAULT (UUID()),
    title       VARCHAR(255) NOT NULL,
    description TEXT         NOT NULL,
    coupon_code VARCHAR(50)  NOT NULL,
    discount    DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    valid_from  DATE         NOT NULL,
    valid_until DATE         NOT NULL,
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_offers_coupon (coupon_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── Seed: Admin Users ───────────────────────────────────────
INSERT INTO admin_users (id, username, password_hash, role) VALUES
  (UUID(), 'admin',  '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'superadmin'),
  -- admin password: admin11 (bcrypt)
  (UUID(), 'manager','$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE username = VALUES(username);
