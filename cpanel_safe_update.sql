-- ============================================================================
-- WB CREDIT FINANCE - TARGETED CPANEL MYSQL DATABASE UPDATE SCRIPT
-- ============================================================================
SET FOREIGN_KEY_CHECKS = 0;

-- 1. UPSERT USERS
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `transaction_pin`, `status`, `kyc_status`)
VALUES
('usr-prof-mvcaj68v', 'debeluemmanuel', 'debeluemmanuel@mail.com', 'MemberPass123!', 'user', '1526', 'active', 'verified'),
('wb-usr-y4rfbph', 'debeluemmanuel', 'debeluemmanuel@gmail.com', 'yeshuah.com', 'user', '4004', 'active', 'verified'),
('usr-prof-mvb5wo7j', 'debstarnetwork', 'debstarnetwork@gmail.com', 'Password123!', 'user', '4495', 'active', 'verified'),
('usr-admin-01', 'admin', 'admin@wbcu.net', '12345', 'super_admin', '8869', 'active', 'verified'),
('usr-101', 'mizbrymo', 'mizbrymo@gmail.com', '12345', 'super_admin', '8869', 'active', 'verified'),
('usr-34400', 'kwillis', 'kwillis.member@wbcu-reserve.ch', 'MemberPass123!', 'user', '8869', 'active', 'verified'),
('usr-659', 'ollerobertrstrm52', 'olle.rastrom@swissprivatevault.ch', 'Password123!', 'user', '8869', 'active', 'verified'),
('usr-corp-01', 'erostova', 'elena.rostova@vanguardlogistics.ch', 'Password123!', 'user', '8869', 'active', 'verified'),
('usr-corp-02', 'msterling', 'treasury@sterlingmerchant.com', 'Password123!', 'user', '8869', 'active', 'verified'),
('usr-alex-01', 'amorgan', 'alexander.morgan@wbcu.net', 'Password123!', 'user', '1234', 'active', 'verified')
ON DUPLICATE KEY UPDATE
  `password_hash` = VALUES(`password_hash`),
  `role` = VALUES(`role`),
  `transaction_pin` = VALUES(`transaction_pin`),
  `status` = VALUES(`status`),
  `kyc_status` = VALUES(`kyc_status`);

-- 2. UPSERT ADMINS
INSERT INTO `admins` (`id`, `username`, `email`, `password_hash`, `full_name`, `role`, `status`)
VALUES
('usr-admin-01', 'admin', 'admin@wbcu.net', '12345', 'Chief Treasury Auditor', 'super_admin', 'active'),
('usr-101', 'mizbrymo', 'mizbrymo@gmail.com', '12345', 'Miz Brymo', 'super_admin', 'active')
ON DUPLICATE KEY UPDATE
  `password_hash` = VALUES(`password_hash`),
  `full_name` = VALUES(`full_name`),
  `role` = VALUES(`role`),
  `status` = VALUES(`status`);

-- 3. UPSERT PROFILES
INSERT INTO `profiles` (`id`, `user_id`, `first_name`, `last_name`, `full_name`, `phone_number`)
VALUES
('prof-usr-prof-mvcaj68v', 'usr-prof-mvcaj68v', 'DEBELU', 'EMMANUEL', 'DEBELU EMMANUEL', '+2347065096181'),
('prof-wb-usr-y4rfbph', 'wb-usr-y4rfbph', 'DEBELU', 'EMMANUEL', 'DEBELU EMMANUEL', '+2347065096181'),
('prof-usr-prof-mvb5wo7j', 'usr-prof-mvb5wo7j', 'Brian', 'Adams', 'Brian Adams', '+41 44 915 7666'),
('prof-usr-admin-01', 'usr-admin-01', 'Chief', 'Auditor', 'Chief Treasury Auditor', '+41 44 915 8900'),
('prof-usr-101', 'usr-101', 'Miz', 'Brymo', 'Miz Brymo', '+41 44 915 8901'),
('prof-usr-34400', 'usr-34400', 'Kristin', 'Willis', 'Kristin Willis', '9377334076'),
('prof-usr-659', 'usr-659', 'Olle Robert Christer', 'Råström', 'Olle Robert Christer Råström', '+46702813441'),
('prof-usr-corp-01', 'usr-corp-01', 'Elena', 'Rostova', 'Elena Rostova', '+41 22 819 4001'),
('prof-usr-corp-02', 'usr-corp-02', 'Marcus', 'Sterling', 'Marcus Sterling', '+44 20 7946 0912'),
('prof-usr-alex-01', 'usr-alex-01', 'Alexander', 'Morgan', 'Alexander Morgan', '+41 44 915 9920')
ON DUPLICATE KEY UPDATE
  `full_name` = VALUES(`full_name`),
  `phone_number` = VALUES(`phone_number`);

-- 4. UPSERT ACCOUNTS
INSERT INTO `accounts` (`id`, `user_id`, `account_number`, `account_type`, `account_name`, `currency`, `balance`, `available_balance`, `routing_number`, `swift_bic`, `is_primary`, `status`)
VALUES
('acct-usr-prof-mvcaj68v-USD', 'usr-prof-mvcaj68v', '9482-5635', 'Checking', 'US Dollar Primary Vault', 'USD', 0.00, 0.00, '251480576', 'WBCUUS33', 0, 'active'),
('acct-usd-wb-usr-y4rfbph', 'wb-usr-y4rfbph', '9482-1049-55', 'Checking', 'US Dollar Primary Vault', 'USD', 100000.00, 100000.00, '251480576', 'WBCUUS33', 1, 'active'),
('acct-eur-wb-usr-y4rfbph', 'wb-usr-y4rfbph', 'WB-EUR-8841', 'Offshore', 'Euro Global Holding Vault', 'EUR', 0.00, 0.00, '251480576', 'WBCUUS33', 0, 'active'),
('acct-usr-prof-mvb5wo7j-USD', 'usr-prof-mvb5wo7j', '09372996993', 'Checking', 'Primary Checking Vault', 'USD', 100000.00, 100000.00, '251480576', 'WBCUUS33', 1, 'active'),
('acct-usr-admin-01-USD', 'usr-admin-01', '09331164002', 'Checking', 'Executive Reserve Vault', 'USD', 500000.00, 500000.00, '251480576', 'WBCUUS33', 1, 'active'),
('acct-usr-101-USD', 'usr-101', 'WB-9482-1049-55', 'Checking', 'Premier Checking Vault', 'USD', 248500.00, 248500.00, '251480576', 'WBCUUS33', 1, 'active'),
('acct-usr-101-CHF', 'usr-101', 'WB-9482-1049-56', 'Savings', 'Swiss Franc Reserve Vault', 'CHF', 1450000.00, 1450000.00, '251480576', 'WBCUUS33', 0, 'active'),
('acct-usr-34400-USD', 'usr-34400', '2514809281', 'Checking', 'Primary Member Vault', 'USD', 145000.00, 145000.00, '251480576', 'WBCUUS33', 1, 'active'),
('acct-usr-659-USD', 'usr-659', '09372996993', 'Checking', 'Primary Checking Vault', 'USD', 100000.00, 100000.00, '251480576', 'WBCUUS33', 1, 'active'),
('acct-usr-corp-01-USD', 'usr-corp-01', '2514801192', 'Checking', 'Corporate Logistics Vault', 'USD', 312000.00, 312000.00, '251480576', 'WBCUUS33', 1, 'active'),
('acct-usr-corp-02-USD', 'usr-corp-02', '2514808821', 'Checking', 'Merchant Treasury Vault', 'USD', 850000.00, 850000.00, '251480576', 'WBCUUS33', 1, 'active'),
('acct-usr-alex-01-USD', 'usr-alex-01', '2514809901', 'Checking', 'Private Depository Vault', 'USD', 1250000.00, 1250000.00, '251480576', 'WBCUUS33', 1, 'active')
ON DUPLICATE KEY UPDATE
  `balance` = VALUES(`balance`),
  `available_balance` = VALUES(`available_balance`),
  `account_number` = VALUES(`account_number`);

-- 5. UPSERT WIRE TRANSFER CLEARANCE CODES
INSERT INTO `wire_transfer_codes` (`id`, `user_id`, `code_type`, `code_value`, `display_name`, `description`, `is_active`, `applies_to_amount_above`)
VALUES
('code-wb-usr-y4rfbph-COT', 'wb-usr-y4rfbph', 'COT', 'CT-26985', 'Cost of Transfer Clearance', 'Cost of Transfer clearance token', 1, 0.00),
('code-wb-usr-y4rfbph-TAX', 'wb-usr-y4rfbph', 'TAX', 'TX-50308', 'Federal Tax Clearance Certificate', 'Federal Tax clearance token', 1, 0.00),
('code-wb-usr-y4rfbph-IMF', 'wb-usr-y4rfbph', 'IMF', 'IMF-16483', 'IMF Sovereign Clearance Certificate', 'IMF sovereign clearance token', 1, 0.00),
('code-wb-usr-y4rfbph-AML', 'wb-usr-y4rfbph', 'AML', 'AML-12087', 'Anti-Money Laundering Compliance', 'AML compliance token', 1, 0.00),
('code-wb-usr-y4rfbph-PAP', 'wb-usr-y4rfbph', 'PAP', 'PAP-38560', 'Permanent Access Passcode', 'PAP clearance token', 1, 0.00),
('code-wb-usr-y4rfbph-OTP', 'wb-usr-y4rfbph', 'OTP', '139791', 'Transaction Authorization OTP', '2FA Transaction OTP', 1, 0.00),
('code-wb-usr-ysm2set-COT', 'wb-usr-ysm2set', 'COT', 'CT-26985', 'Cost of Transfer Clearance', 'Cost of Transfer clearance token', 1, 0.00),
('code-wb-usr-ysm2set-TAX', 'wb-usr-ysm2set', 'TAX', 'TX-50308', 'Federal Tax Clearance Certificate', 'Federal Tax clearance token', 1, 0.00),
('code-wb-usr-ysm2set-IMF', 'wb-usr-ysm2set', 'IMF', 'IMF-16483', 'IMF Sovereign Clearance Certificate', 'IMF sovereign clearance token', 1, 0.00),
('code-wb-usr-ysm2set-AML', 'wb-usr-ysm2set', 'AML', 'AML-12087', 'Anti-Money Laundering Compliance', 'AML compliance token', 1, 0.00),
('code-wb-usr-ysm2set-PAP', 'wb-usr-ysm2set', 'PAP', 'PAP-38560', 'Permanent Access Passcode', 'PAP clearance token', 1, 0.00),
('code-wb-usr-ysm2set-OTP', 'wb-usr-ysm2set', 'OTP', '139791', 'Transaction Authorization OTP', '2FA Transaction OTP', 1, 0.00),
('code-usr-101-COT', 'usr-101', 'COT', 'CT-26985', 'Cost of Transfer Clearance', 'Cost of Transfer clearance token', 1, 0.00),
('code-usr-101-TAX', 'usr-101', 'TAX', 'TX-50308', 'Federal Tax Clearance Certificate', 'Federal Tax clearance token', 1, 0.00),
('code-usr-101-IMF', 'usr-101', 'IMF', 'IMF-16483', 'IMF Sovereign Clearance Certificate', 'IMF sovereign clearance token', 1, 0.00),
('code-usr-101-AML', 'usr-101', 'AML', 'AML-12087', 'Anti-Money Laundering Compliance', 'AML compliance token', 1, 0.00),
('code-usr-101-PAP', 'usr-101', 'PAP', 'PAP-38560', 'Permanent Access Passcode', 'PAP clearance token', 1, 0.00),
('code-usr-101-OTP', 'usr-101', 'OTP', '139791', 'Transaction Authorization OTP', '2FA Transaction OTP', 1, 0.00)
ON DUPLICATE KEY UPDATE
  `code_value` = VALUES(`code_value`),
  `is_active` = VALUES(`is_active`),
  `applies_to_amount_above` = VALUES(`applies_to_amount_above`);

SET FOREIGN_KEY_CHECKS = 1;
