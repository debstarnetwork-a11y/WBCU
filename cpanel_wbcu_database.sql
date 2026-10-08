-- ============================================================================
-- WB CREDIT UNION (www.wbcu.net) - COMPLETE CPANEL / MySQL DATABASE SCHEMA
-- ============================================================================
-- Compatible with: cPanel phpMyAdmin, MySQL 5.7 / 8.0+, MariaDB 10.3+
-- Target Database: glolbka_wbcu_db
-- Target User: glolbka_wbcu_user
-- Target Domain: wbcu.net
-- Charset: utf8mb4 / utf8mb4_unicode_ci
-- Engine: InnoDB
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- ----------------------------------------------------------------------------
-- 1. USERS & AUTHENTICATION TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` VARCHAR(64) NOT NULL,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('user', 'admin', 'super_admin', 'auditor') NOT NULL DEFAULT 'user',
  `transaction_pin` VARCHAR(10) DEFAULT '1234',
  `two_factor_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `two_factor_secret` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('active', 'inactive', 'suspended', 'frozen', 'pending_approval') NOT NULL DEFAULT 'active',
  `status_reason` TEXT DEFAULT NULL,
  `kyc_status` ENUM('unverified', 'pending', 'verified', 'rejected') NOT NULL DEFAULT 'verified',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_username` (`username`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. MEMBER PROFILES (Extended Identity & Compliance)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `profiles`;
CREATE TABLE `profiles` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `middle_name` VARCHAR(100) DEFAULT '',
  `last_name` VARCHAR(100) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `phone_number` VARCHAR(50) DEFAULT NULL,
  `date_of_birth` DATE DEFAULT NULL,
  `gender` VARCHAR(20) DEFAULT 'Not Specified',
  `nationality` VARCHAR(100) DEFAULT 'Switzerland',
  `occupation` VARCHAR(150) DEFAULT 'Executive Private Client',
  `address_line1` TEXT DEFAULT NULL,
  `address_line2` TEXT DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT 'Zurich',
  `state` VARCHAR(100) DEFAULT 'Zurich',
  `postal_code` VARCHAR(30) DEFAULT '8706',
  `country` VARCHAR(100) DEFAULT 'Switzerland',
  `profile_photo_url` TEXT DEFAULT NULL,
  `avatar_color` VARCHAR(100) DEFAULT 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
  `id_type` VARCHAR(50) DEFAULT 'Passport',
  `id_number` VARCHAR(100) DEFAULT NULL,
  `id_card_front_url` TEXT DEFAULT NULL,
  `id_card_back_url` TEXT DEFAULT NULL,
  `proof_of_address_url` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_profiles_user_id` (`user_id`),
  CONSTRAINT `fk_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. BANK VAULT ACCOUNTS (Multi-Currency Ledgers)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `accounts`;
CREATE TABLE `accounts` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `account_number` VARCHAR(30) NOT NULL UNIQUE,
  `account_type` ENUM('Checking', 'Savings', 'Business', 'Offshore', 'Fixed Deposit', 'Money Market') NOT NULL DEFAULT 'Checking',
  `account_name` VARCHAR(150) NOT NULL DEFAULT 'Primary Checking Vault',
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `balance` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
  `available_balance` DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
  `routing_number` VARCHAR(30) NOT NULL DEFAULT '251480576',
  `swift_bic` VARCHAR(30) NOT NULL DEFAULT 'WBCUUS33',
  `iban` VARCHAR(50) DEFAULT NULL,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('active', 'inactive', 'frozen', 'closed', 'dormant') NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_accounts_user_id` (`user_id`),
  INDEX `idx_accounts_number` (`account_number`),
  INDEX `idx_accounts_currency` (`currency`),
  CONSTRAINT `fk_accounts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. TRANSACTIONS & TRANSFERS LEDGER
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `account_id` VARCHAR(64) DEFAULT NULL,
  `reference_number` VARCHAR(100) NOT NULL UNIQUE,
  `session_id` VARCHAR(100) DEFAULT NULL,
  `transaction_type` ENUM('credit', 'debit', 'transfer', 'wire', 'crypto', 'deposit', 'bill_pay', 'fee') NOT NULL DEFAULT 'debit',
  `category` VARCHAR(50) DEFAULT 'Transfer',
  `amount` DECIMAL(18, 2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `exchange_rate` DECIMAL(18, 6) DEFAULT 1.000000,
  `fee` DECIMAL(18, 2) DEFAULT 0.00,
  `description` TEXT NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `sender_name` VARCHAR(150) DEFAULT 'WB Credit Union',
  `sender_account` VARCHAR(50) DEFAULT NULL,
  `sender_bank` VARCHAR(150) DEFAULT 'WB Credit Union',
  `sender_routing` VARCHAR(50) DEFAULT '251480576',
  `sender_iban` VARCHAR(50) DEFAULT NULL,
  `recipient_name` VARCHAR(150) DEFAULT NULL,
  `recipient_account` VARCHAR(50) DEFAULT NULL,
  `recipient_bank` VARCHAR(150) DEFAULT NULL,
  `recipient_routing` VARCHAR(50) DEFAULT NULL,
  `recipient_swift` VARCHAR(50) DEFAULT NULL,
  `recipient_iban` VARCHAR(50) DEFAULT NULL,
  `recipient_country` VARCHAR(100) DEFAULT NULL,
  `hash_code` VARCHAR(64) DEFAULT NULL,
  `status` ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'on_hold') NOT NULL DEFAULT 'completed',
  `requires_otp` TINYINT(1) NOT NULL DEFAULT 0,
  `otp_verified` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tx_user` (`user_id`),
  INDEX `idx_tx_ref` (`reference_number`),
  INDEX `idx_tx_status` (`status`),
  INDEX `idx_tx_created` (`created_at`),
  CONSTRAINT `fk_tx_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. WIRE TRANSFER & REGULATORY CLEARANCE CODES (COT, TAX, IMF, AML, PAP)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `wire_transfer_codes`;
CREATE TABLE `wire_transfer_codes` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `code_type` ENUM('COT', 'TAX', 'IMF', 'AML', 'PAP', 'OTP') NOT NULL,
  `code_value` VARCHAR(100) NOT NULL,
  `display_name` VARCHAR(150) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `is_used` TINYINT(1) NOT NULL DEFAULT 0,
  `max_attempts` INT NOT NULL DEFAULT 5,
  `attempts_used` INT NOT NULL DEFAULT 0,
  `applies_to_amount_above` DECIMAL(18, 2) DEFAULT 0.00,
  `expires_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_wire_codes_user` (`user_id`),
  INDEX `idx_wire_codes_type` (`code_type`),
  CONSTRAINT `fk_wire_codes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. ATM / DEBIT & CREDIT CARDS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `cards`;
CREATE TABLE `cards` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `account_number` VARCHAR(30) DEFAULT NULL,
  `card_holder` VARCHAR(150) NOT NULL,
  `card_number` VARCHAR(25) NOT NULL UNIQUE,
  `card_masked` VARCHAR(25) NOT NULL,
  `card_type` VARCHAR(100) NOT NULL DEFAULT 'Sovereign Visa Platinum Debit',
  `card_tier` VARCHAR(50) DEFAULT 'platinum',
  `theme` VARCHAR(50) DEFAULT 'obsidian',
  `design_finish` VARCHAR(50) DEFAULT 'Obsidian Dark',
  `expiry_month` VARCHAR(2) NOT NULL DEFAULT '09',
  `expiry_year` VARCHAR(2) NOT NULL DEFAULT '31',
  `expiry_display` VARCHAR(10) NOT NULL DEFAULT '09/31',
  `cvv` VARCHAR(4) NOT NULL,
  `pin` VARCHAR(6) NOT NULL DEFAULT '1234',
  `status` ENUM('active', 'inactive', 'locked', 'pending_approval', 'reported_lost') NOT NULL DEFAULT 'active',
  `is_frozen` TINYINT(1) NOT NULL DEFAULT 0,
  `daily_atm_limit` DECIMAL(18, 2) NOT NULL DEFAULT 5000.00,
  `daily_pos_limit` DECIMAL(18, 2) NOT NULL DEFAULT 25000.00,
  `monthly_limit` DECIMAL(18, 2) NOT NULL DEFAULT 50000.00,
  `allow_online` TINYINT(1) NOT NULL DEFAULT 1,
  `allow_international` TINYINT(1) NOT NULL DEFAULT 1,
  `allow_contactless` TINYINT(1) NOT NULL DEFAULT 1,
  `print_status` ENUM('requested', 'printing', 'shipped', 'delivered') DEFAULT 'requested',
  `tracking_number` VARCHAR(100) DEFAULT NULL,
  `shipping_address` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_cards_user` (`user_id`),
  INDEX `idx_cards_num` (`card_number`),
  CONSTRAINT `fk_cards_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. CRYPTO VAULT WALLETS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `crypto_wallets`;
CREATE TABLE `crypto_wallets` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `symbol` VARCHAR(20) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `wallet_address` VARCHAR(255) NOT NULL,
  `balance` DECIMAL(28, 8) NOT NULL DEFAULT 0.00000000,
  `network` VARCHAR(100) DEFAULT 'Mainnet',
  `price_usd` DECIMAL(18, 2) DEFAULT 0.00,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_crypto_user` (`user_id`),
  INDEX `idx_crypto_symbol` (`symbol`),
  CONSTRAINT `fk_crypto_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. CRYPTO TRANSACTIONS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `crypto_transactions`;
CREATE TABLE `crypto_transactions` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `wallet_id` VARCHAR(64) NOT NULL,
  `symbol` VARCHAR(20) NOT NULL,
  `type` ENUM('deposit', 'withdrawal', 'swap', 'internal_transfer') NOT NULL,
  `amount` DECIMAL(28, 8) NOT NULL,
  `amount_usd` DECIMAL(18, 2) DEFAULT 0.00,
  `fee` DECIMAL(28, 8) DEFAULT 0.00000000,
  `from_address` VARCHAR(255) DEFAULT NULL,
  `to_address` VARCHAR(255) NOT NULL,
  `tx_hash` VARCHAR(255) DEFAULT NULL,
  `network` VARCHAR(100) DEFAULT 'Mainnet',
  `memo` VARCHAR(255) DEFAULT NULL,
  `confirmations` INT DEFAULT 0,
  `status` ENUM('pending', 'confirming', 'completed', 'failed') NOT NULL DEFAULT 'completed',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_cryptotx_user` (`user_id`),
  INDEX `idx_cryptotx_hash` (`tx_hash`),
  CONSTRAINT `fk_cryptotx_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cryptotx_wallet` FOREIGN KEY (`wallet_id`) REFERENCES `crypto_wallets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. NOTIFICATIONS & EMAIL AUDIT LOGS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `email_logs`;
CREATE TABLE `email_logs` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) DEFAULT NULL,
  `recipient_email` VARCHAR(255) NOT NULL,
  `recipient_name` VARCHAR(150) DEFAULT NULL,
  `email_type` VARCHAR(50) NOT NULL DEFAULT 'transaction',
  `subject` VARCHAR(255) NOT NULL,
  `body_preview` TEXT DEFAULT NULL,
  `status` ENUM('sent', 'failed', 'pending') NOT NULL DEFAULT 'sent',
  `error_message` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_email_recipient` (`recipient_email`),
  INDEX `idx_email_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. SYSTEM ACTIVITY & SECURITY AUDIT LOGS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) DEFAULT NULL,
  `action` VARCHAR(255) NOT NULL,
  `details` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(50) DEFAULT '127.0.0.1',
  `user_agent` TEXT DEFAULT NULL,
  `officer_name` VARCHAR(100) DEFAULT 'SYSTEM',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_act_user` (`user_id`),
  INDEX `idx_act_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. HELP & SUPPORT TICKETS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `support_tickets`;
CREATE TABLE `support_tickets` (
  `id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `ticket_number` VARCHAR(50) NOT NULL UNIQUE,
  `subject` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'General Inquiry',
  `priority` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  `status` ENUM('open', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'open',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_tickets_user` (`user_id`),
  INDEX `idx_tickets_status` (`status`),
  CONSTRAINT `fk_tickets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `support_ticket_messages`;
CREATE TABLE `support_ticket_messages` (
  `id` VARCHAR(64) NOT NULL,
  `ticket_id` VARCHAR(64) NOT NULL,
  `sender_id` VARCHAR(64) DEFAULT NULL,
  `sender_name` VARCHAR(150) NOT NULL,
  `is_staff` TINYINT(1) NOT NULL DEFAULT 0,
  `message` TEXT NOT NULL,
  `attachment_url` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_msg_ticket` (`ticket_id`),
  CONSTRAINT `fk_msg_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. INSTITUTIONAL SETTINGS & CORRESPONDENT RAILS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `key_name` VARCHAR(100) NOT NULL,
  `value_json` LONGTEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 13. SEED DATA FOR PRODUCTION DEPLOYMENT
-- ============================================================================

-- 1. Insert Initial System Administrator & Demo Member Accounts
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `transaction_pin`, `two_factor_enabled`, `status`, `kyc_status`) VALUES
('usr-admin-01', 'chief_auditor', 'admin@wbcu.net', '$2a$12$e8F0l1u4dY.7c5N2WwYgfe8L19e4zVl9aI5C8.sE8q5D1a1f0z9W', 'super_admin', '8869', 1, 'active', 'verified'),
('usr-101', 'mizbrymo', 'mizbrymo@gmail.com', '$2a$12$K1J8e.eY7uW2C3f4v5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x', 'user', '8869', 1, 'active', 'verified');

-- 2. Insert Profile Data
INSERT INTO `profiles` (`id`, `user_id`, `first_name`, `middle_name`, `last_name`, `full_name`, `phone_number`, `date_of_birth`, `nationality`, `occupation`, `address_line1`, `city`, `state`, `postal_code`, `country`) VALUES
('prof-admin-01', 'usr-admin-01', 'Chief', 'Treasury', 'Auditor', 'Chief Treasury Auditor', '001 (207) 613-1332', '1980-01-01', 'Switzerland', 'Chief Operating Officer', '109, Feldgüetliweg Meilen', 'Zurich', 'Zurich', '8706', 'Switzerland'),
('prof-101', 'usr-101', 'Miz', '', 'Brymo', 'Miz Brymo', '001 (207) 613-1332', '1984-06-14', 'Switzerland', 'Executive Director', '109, Feldgüetliweg, Meilen', 'Zurich', 'Zurich', '8706', 'Switzerland');

-- 3. Insert Vault Accounts
INSERT INTO `accounts` (`id`, `user_id`, `account_number`, `account_type`, `account_name`, `currency`, `balance`, `available_balance`, `routing_number`, `is_primary`, `status`) VALUES
('acct-101-usd', 'usr-101', '09372996993', 'Checking', 'US Dollar Primary Vault', 'USD', 248500.00, 248500.00, '251480576', 1, 'active'),
('acct-101-chf', 'usr-101', 'WB-9482-1049-56', 'Savings', 'Swiss Franc Reserve Vault', 'CHF', 1450000.00, 1450000.00, '251480576', 0, 'active'),
('acct-101-eur', 'usr-101', 'WB-9482-1049-57', 'Offshore', 'Euro Global Holding Vault', 'EUR', 890000.00, 890000.00, '251480576', 0, 'active'),
('acct-101-gbp', 'usr-101', 'WB-9482-1049-58', 'Offshore', 'British Pound Sterling Vault', 'GBP', 320000.00, 320000.00, '251480576', 0, 'active');

-- 4. Insert Unique Regulatory Wire Transfer Codes
INSERT INTO `wire_transfer_codes` (`id`, `user_id`, `code_type`, `code_value`, `display_name`, `description`, `is_active`, `max_attempts`) VALUES
('wc-101-cot', 'usr-101', 'COT', '0467799', 'COT Code (Cost of Transfer)', 'Mandated interbank liquidity settlement token for SWIFT clearing.', 1, 5),
('wc-101-tax', 'usr-101', 'TAX', 'TX-88392', 'Tax Clearance Code (TCC)', 'Cross-border tax compliance verification key.', 1, 5),
('wc-101-imf', 'usr-101', 'IMF', '9498779', 'IMF Clearance Code', 'International Monetary Fund sovereign anti-money laundering clearance certificate.', 1, 5),
('wc-101-aml', 'usr-101', 'AML', 'AML-86902', 'AML Code (Anti-Money Laundering)', 'FATF anti-terrorist financing verification key.', 1, 5),
('wc-101-pap', 'usr-101', 'PAP', 'PAP-70216', 'PAP Code (Proof of Anti-Piracy)', 'Dual-custody treasury asset authorization code.', 1, 5),
('wc-101-otp', 'usr-101', 'OTP', '806158', '2FA Authorization Passcode', 'Single-use transaction verification token.', 1, 5);

-- 5. Insert Primary Debit Card
INSERT INTO `cards` (`id`, `user_id`, `account_number`, `card_holder`, `card_number`, `card_masked`, `card_type`, `theme`, `design_finish`, `expiry_month`, `expiry_year`, `expiry_display`, `cvv`, `pin`, `status`) VALUES
('crd-101-1', 'usr-101', '09372996993', 'MIZ BRYMO', '4532714031143230', '•••• •••• •••• 3230', 'Sovereign Visa Platinum Debit', 'obsidian', 'Obsidian Dark', '09', '31', '09/31', '775', '8869', 'active');

-- 6. Insert System Default Configuration
INSERT INTO `system_settings` (`key_name`, `value_json`) VALUES
('institution_info', '{"bankName":"WB Credit Union","domain":"wbcu.net","routingNumber":"251480576","swiftCode":"WBCUUS33","supportEmail":"support@wbcu.net","headquarters":"109, Feldgüetliweg Meilen, Zurich 8706, Switzerland"}'),
('exchange_rates', '{"USD":1.0,"EUR":0.92,"GBP":0.78,"CHF":0.88,"CAD":1.36,"AUD":1.52,"JPY":154.2,"NGN":1650.0}');

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;
