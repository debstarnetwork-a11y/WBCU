-- ============================================================================
-- WB CREDIT UNION - COMPLETE SUPABASE DATABASE SCHEMA
-- ============================================================================
-- Description: Production-ready PostgreSQL schema for WB Credit Union digital banking.
-- Includes custom ENUM types, 14 relational tables, auto-generation generators for
-- 10-digit account numbers and transaction references, Row Level Security (RLS)
-- policies, automated updated_at triggers, auth.users onboarding trigger, and seed data.
--
-- Target Platform: Supabase / PostgreSQL 15+
-- ============================================================================

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. ENUM TYPE DEFINITIONS
-- ============================================================================

-- Profile & Account Status Enums
DO $$ BEGIN
  CREATE TYPE account_type_enum AS ENUM ('savings', 'checking', 'business', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE account_status_enum AS ENUM ('active', 'suspended', 'frozen', 'closed', 'pending_verification');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE kyc_status_enum AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('user', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ledger Account Types & Currencies (Fiat & Crypto)
DO $$ BEGIN
  CREATE TYPE ledger_account_type_enum AS ENUM ('savings', 'checking', 'business', 'premium', 'crypto');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ledger_account_status_enum AS ENUM ('active', 'frozen', 'closed', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE currency_code_enum AS ENUM (
    'USD', 'EUR', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'NGN',
    'BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'XRP', 'SOL', 'ADA'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Transactions & Clearances
DO $$ BEGIN
  CREATE TYPE transaction_type_enum AS ENUM (
    'credit', 'debit', 'transfer', 'wire_transfer', 'crypto_transfer',
    'deposit', 'withdrawal', 'fee', 'interest', 'refund', 'reversal'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_status_enum AS ENUM (
    'pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed', 'on_hold', 'awaiting_codes'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Wire Transfer & Regulatory Clearance Code Types
DO $$ BEGIN
  CREATE TYPE wire_code_type_enum AS ENUM ('COT', 'TAX', 'IMF', 'AML', 'PAP');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE admin_code_type_enum AS ENUM ('COT', 'TAX', 'IMF', 'AML', 'PAP', 'OTP');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ATM & Debit Cards
DO $$ BEGIN
  CREATE TYPE card_type_enum AS ENUM (
    'visa_classic', 'visa_gold', 'visa_platinum', 'visa_infinite',
    'mastercard_standard', 'mastercard_gold', 'mastercard_platinum', 'mastercard_world'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE card_status_enum AS ENUM (
    'active', 'inactive', 'blocked', 'expired', 'pending_print', 'printed', 'shipped', 'delivered'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE card_print_status_enum AS ENUM (
    'not_requested', 'requested', 'printing', 'printed', 'shipped', 'delivered'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Crypto Wallets
DO $$ BEGIN
  CREATE TYPE crypto_symbol_enum AS ENUM (
    'BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'XRP', 'SOL', 'ADA'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Notifications, Communication & Security
DO $$ BEGIN
  CREATE TYPE notification_type_enum AS ENUM (
    'transaction', 'security', 'account', 'promotion', 'system', 'wire_code', 'card'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE email_type_enum AS ENUM (
    'welcome', 'transaction', 'security_alert', 'wire_code', 'otp', 'card_issued', 'account_update', 'statement'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE email_status_enum AS ENUM ('sent', 'failed', 'pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE otp_type_enum AS ENUM ('transaction', 'login', 'transfer', 'card_activation');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- 2. CORE HELPER FUNCTIONS (ID & NUMBER GENERATION, SECURITY CHECKS)
-- ============================================================================

-- Auto-update updated_at timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Generate unique 10-digit account number (format: 2000000000 to 9999999999)
CREATE OR REPLACE FUNCTION generate_unique_account_number()
RETURNS VARCHAR(10) AS $$
DECLARE
  candidate VARCHAR(10);
  is_collision BOOLEAN;
BEGIN
  LOOP
    candidate := (floor(random() * (9999999999 - 2000000000 + 1)) + 2000000000)::VARCHAR;
    
    SELECT EXISTS (
      SELECT 1 FROM profiles WHERE account_number = candidate
      UNION ALL
      SELECT 1 FROM accounts WHERE account_number = candidate
    ) INTO is_collision;
    
    IF NOT is_collision THEN
      RETURN candidate;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Generate unique transaction reference (e.g., WB-TX-20260925-A1B2C3D4)
CREATE OR REPLACE FUNCTION generate_unique_transaction_reference()
RETURNS VARCHAR(50) AS $$
DECLARE
  candidate VARCHAR(50);
  is_collision BOOLEAN;
BEGIN
  LOOP
    candidate := 'WB-TX-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
    
    SELECT EXISTS (
      SELECT 1 FROM transactions WHERE reference_number = candidate
    ) INTO is_collision;
    
    IF NOT is_collision THEN
      RETURN candidate;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ============================================================================
-- 3. TABLE DEFINITIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROFILES (Extends Supabase auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  middle_name VARCHAR(100),
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  date_of_birth DATE,
  gender VARCHAR(20),
  address_line1 TEXT,
  address_line2 TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(30),
  country VARCHAR(100) DEFAULT 'United States',
  profile_photo_url TEXT,
  account_number VARCHAR(10) UNIQUE DEFAULT generate_unique_account_number(),
  routing_number VARCHAR(20) DEFAULT '251480576',
  account_type account_type_enum DEFAULT 'checking',
  account_status account_status_enum DEFAULT 'active',
  kyc_status kyc_status_enum DEFAULT 'pending',
  pin_hash TEXT,
  fingerprint_enabled BOOLEAN DEFAULT FALSE,
  fingerprint_data TEXT,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  role user_role_enum DEFAULT 'user',
  welcome_email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  last_login_at TIMESTAMPTZ,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ
);

-- Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_account_number ON profiles(account_number);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- ----------------------------------------------------------------------------
-- 2. ACCOUNTS (Multiple fiat & crypto sub-accounts per user)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_name VARCHAR(120) NOT NULL,
  account_number VARCHAR(10) UNIQUE NOT NULL DEFAULT generate_unique_account_number(),
  account_type ledger_account_type_enum NOT NULL DEFAULT 'checking',
  currency currency_code_enum NOT NULL DEFAULT 'USD',
  balance DECIMAL(20,8) DEFAULT 0.00000000 NOT NULL,
  available_balance DECIMAL(20,8) DEFAULT 0.00000000 NOT NULL,
  pending_balance DECIMAL(20,8) DEFAULT 0.00000000 NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  status ledger_account_status_enum DEFAULT 'active' NOT NULL,
  interest_rate DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT chk_positive_balances CHECK (balance >= -50000.00000000) -- allows controlled overdraft
);

-- Accounts Indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_account_number ON accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_accounts_currency ON accounts(currency);
CREATE INDEX IF NOT EXISTS idx_accounts_status ON accounts(status);
CREATE INDEX IF NOT EXISTS idx_accounts_is_primary ON accounts(is_primary);

-- ----------------------------------------------------------------------------
-- 3. TRANSACTIONS (Financial Ledger & Wire Activity)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_type transaction_type_enum NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  description TEXT,
  reference_number VARCHAR(50) UNIQUE NOT NULL DEFAULT generate_unique_transaction_reference(),
  sender_name VARCHAR(150),
  sender_account VARCHAR(50),
  sender_bank VARCHAR(150),
  sender_routing VARCHAR(50),
  recipient_name VARCHAR(150),
  recipient_account VARCHAR(50),
  recipient_bank VARCHAR(150),
  recipient_routing VARCHAR(50),
  recipient_crypto_address VARCHAR(120),
  status transaction_status_enum DEFAULT 'pending' NOT NULL,
  transaction_fee DECIMAL(10,2) DEFAULT 0.00,
  exchange_rate DECIMAL(20,8) DEFAULT 1.00000000,
  notes TEXT,
  admin_notes TEXT,
  ip_address VARCHAR(45),
  device_info TEXT,
  receipt_generated BOOLEAN DEFAULT FALSE,
  email_notification_sent BOOLEAN DEFAULT FALSE,
  requires_otp BOOLEAN DEFAULT FALSE,
  otp_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Transactions Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference_number);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- ----------------------------------------------------------------------------
-- 4. WIRE_TRANSFER_CODES (Regulatory Clearance Verification)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wire_transfer_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code_type wire_code_type_enum NOT NULL,
  code_value VARCHAR(50) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  is_required BOOLEAN DEFAULT TRUE,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  expires_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Wire Transfer Codes Indexes
CREATE INDEX IF NOT EXISTS idx_wire_codes_tx_id ON wire_transfer_codes(transaction_id);
CREATE INDEX IF NOT EXISTS idx_wire_codes_user_id ON wire_transfer_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_wire_codes_type ON wire_transfer_codes(code_type);
CREATE INDEX IF NOT EXISTS idx_wire_codes_verified ON wire_transfer_codes(is_verified);

-- ----------------------------------------------------------------------------
-- 5. ADMIN_CODE_SETTINGS (Global Configuration for Verification Codes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_code_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_type admin_code_type_enum UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  display_name VARCHAR(120) NOT NULL,
  description TEXT,
  default_code VARCHAR(50),
  applies_to_amount_above DECIMAL(15,2) DEFAULT 0.00,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------------------------------
-- 6. USER_ASSIGNED_CODES (Overrides / Codes Specifically Issued to Users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_assigned_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code_type wire_code_type_enum NOT NULL,
  code_value VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT uq_user_code_type UNIQUE (user_id, code_type)
);

CREATE INDEX IF NOT EXISTS idx_user_assigned_codes_user ON user_assigned_codes(user_id);

-- ----------------------------------------------------------------------------
-- 7. ATM_CARDS (Debit & Metal Cards)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS atm_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  card_number VARCHAR(19) NOT NULL, -- Masked: **** **** **** 1234
  card_number_full VARCHAR(255),    -- Encrypted storage string
  card_type card_type_enum NOT NULL DEFAULT 'visa_platinum',
  cardholder_name VARCHAR(120) NOT NULL,
  expiry_date DATE NOT NULL,
  cvv_hash VARCHAR(255) NOT NULL,
  billing_address TEXT,
  daily_limit DECIMAL(10,2) DEFAULT 5000.00,
  monthly_limit DECIMAL(12,2) DEFAULT 50000.00,
  atm_withdrawal_limit DECIMAL(10,2) DEFAULT 1000.00,
  pos_enabled BOOLEAN DEFAULT TRUE,
  online_enabled BOOLEAN DEFAULT TRUE,
  international_enabled BOOLEAN DEFAULT FALSE,
  contactless_enabled BOOLEAN DEFAULT TRUE,
  status card_status_enum DEFAULT 'active' NOT NULL,
  pin_hash VARCHAR(255),
  design_template VARCHAR(50) DEFAULT 'classic_blue',
  is_virtual BOOLEAN DEFAULT FALSE,
  print_requested BOOLEAN DEFAULT FALSE,
  print_status card_print_status_enum DEFAULT 'not_requested' NOT NULL,
  shipping_address TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  activated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_atm_cards_user_id ON atm_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_atm_cards_account_id ON atm_cards(account_id);
CREATE INDEX IF NOT EXISTS idx_atm_cards_status ON atm_cards(status);

-- ----------------------------------------------------------------------------
-- 8. CRYPTO_WALLETS (Cryptocurrency Vault Wallets)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crypto_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  wallet_address VARCHAR(120) UNIQUE NOT NULL,
  wallet_type crypto_symbol_enum NOT NULL,
  private_key_encrypted TEXT,
  label VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crypto_wallets_user_id ON crypto_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_wallets_type ON crypto_wallets(wallet_type);

-- ----------------------------------------------------------------------------
-- 9. NOTIFICATIONS (In-app alerts and security notices)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type_enum NOT NULL DEFAULT 'system',
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ----------------------------------------------------------------------------
-- 10. EMAIL_LOGS (Transactional & Security Mail Records)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email_type email_type_enum NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status email_status_enum DEFAULT 'pending' NOT NULL,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- 11. ADMIN_AUDIT_LOG (Regulatory & Internal Operations Audit Trail)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action VARCHAR(150) NOT NULL,
  target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON admin_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON admin_audit_log(created_at DESC);

-- ----------------------------------------------------------------------------
-- 12. OTP_CODES (One-Time Security Passcodes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  otp_code VARCHAR(10) NOT NULL,
  otp_type otp_type_enum NOT NULL DEFAULT 'transaction',
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_lookup ON otp_codes(user_id, otp_code, is_used);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires ON otp_codes(expires_at);

-- ----------------------------------------------------------------------------
-- 13. EXCHANGE_RATES (Live FX and Crypto Rates)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(10) NOT NULL,
  to_currency VARCHAR(10) NOT NULL,
  rate DECIMAL(20,8) NOT NULL,
  source VARCHAR(50) DEFAULT 'admin',
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT uq_currency_pair UNIQUE (from_currency, to_currency)
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_pair ON exchange_rates(from_currency, to_currency);

-- ----------------------------------------------------------------------------
-- 14. SYSTEM_SETTINGS (Global Bank Configuration)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- ============================================================================
-- 4. AUTOMATED TRIGGERS (TIMESTAMP UPDATES)
-- ============================================================================

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_admin_code_settings_updated_at
  BEFORE UPDATE ON admin_code_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_assigned_codes_updated_at
  BEFORE UPDATE ON user_assigned_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_atm_cards_updated_at
  BEFORE UPDATE ON atm_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_crypto_wallets_updated_at
  BEFORE UPDATE ON crypto_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_exchange_rates_updated_at
  BEFORE UPDATE ON exchange_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. NEW USER ONBOARDING TRIGGER (AUTOMATIC PROFILE & DEFAULT ACCOUNTS)
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name VARCHAR(100);
  v_last_name VARCHAR(100);
  v_account_type account_type_enum;
  v_new_account_number VARCHAR(10);
  v_checking_account_id UUID;
  v_role user_role_enum := 'user';
  v_is_admin BOOLEAN := FALSE;
BEGIN
  -- Extract user metadata if provided during sign-up
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', SPLIT_PART(NEW.email, '@', 1));
  v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', 'Member');
  
  -- Check if admin email domain or metadata flag exists
  IF NEW.email LIKE '%admin@wbcredit.org' OR (NEW.raw_user_meta_data->>'is_admin')::BOOLEAN IS TRUE THEN
    v_role := 'admin';
    v_is_admin := TRUE;
  END IF;

  -- 1. Create corresponding profile
  v_new_account_number := generate_unique_account_number();
  
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    email,
    phone_number,
    account_number,
    routing_number,
    account_type,
    account_status,
    kyc_status,
    is_admin,
    role
  ) VALUES (
    NEW.id,
    v_first_name,
    v_last_name,
    NEW.email,
    NEW.phone,
    v_new_account_number,
    '251480576',
    'checking',
    'active',
    'pending',
    v_is_admin,
    v_role
  );

  -- 2. Create default Primary Checking Account in USD
  INSERT INTO public.accounts (
    user_id,
    account_name,
    account_number,
    account_type,
    currency,
    balance,
    available_balance,
    pending_balance,
    is_primary,
    status,
    interest_rate
  ) VALUES (
    NEW.id,
    'Primary Checking',
    v_new_account_number,
    'checking',
    'USD',
    0.00000000,
    0.00000000,
    0.00000000,
    TRUE,
    'active',
    0.05
  ) RETURNING id INTO v_checking_account_id;

  -- 3. Create default Global High-Yield Savings Account in USD
  INSERT INTO public.accounts (
    user_id,
    account_name,
    account_number,
    account_type,
    currency,
    balance,
    available_balance,
    pending_balance,
    is_primary,
    status,
    interest_rate
  ) VALUES (
    NEW.id,
    'High-Yield Savings',
    generate_unique_account_number(),
    'savings',
    'USD',
    0.00000000,
    0.00000000,
    0.00000000,
    FALSE,
    'active',
    4.85
  );

  -- 4. Create default Euro Multi-Currency Wallet
  INSERT INTO public.accounts (
    user_id,
    account_name,
    account_number,
    account_type,
    currency,
    balance,
    available_balance,
    pending_balance,
    is_primary,
    status,
    interest_rate
  ) VALUES (
    NEW.id,
    'Euro Holding Wallet',
    generate_unique_account_number(),
    'checking',
    'EUR',
    0.00000000,
    0.00000000,
    0.00000000,
    FALSE,
    'active',
    2.10
  );

  -- 5. Send initial welcome notification
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    action_url
  ) VALUES (
    NEW.id,
    'account',
    'Welcome to WB Credit Union',
    'Your digital multi-currency vault has been provisioned. Review your accounts and deposit funds to begin.',
    '/pages/dashboard.html'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger attached to Supabase auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 6. SECURITY DEFINER HELPER FUNCTIONS FOR ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Fast, recursion-safe check to determine if the current caller is an Admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
  v_role user_role_enum;
  v_is_admin BOOLEAN;
BEGIN
  -- Check user metadata first for speed
  IF (auth.jwt()->'user_metadata'->>'is_admin')::BOOLEAN IS TRUE THEN
    RETURN TRUE;
  END IF;

  SELECT role, is_admin INTO v_role, v_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  RETURN (v_role IN ('admin', 'super_admin') OR v_is_admin IS TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS across all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wire_transfer_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_code_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assigned_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE atm_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- PROFILES POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR is_admin_user());

CREATE POLICY "Users can update own non-security profile fields"
  ON profiles FOR UPDATE
  USING (auth.uid() = id OR is_admin_user())
  WITH CHECK (auth.uid() = id OR is_admin_user());

CREATE POLICY "Admins have full profile access"
  ON profiles FOR ALL
  USING (is_admin_user());

-- ----------------------------------------------------------------------------
-- ACCOUNTS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT
  USING (auth.uid() = user_id OR is_admin_user());

CREATE POLICY "Users can create personal sub-accounts"
  ON accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_admin_user());

CREATE POLICY "Users can update own accounts"
  ON accounts FOR UPDATE
  USING (auth.uid() = user_id OR is_admin_user())
  WITH CHECK (auth.uid() = user_id OR is_admin_user());

CREATE POLICY "Admins have full account management"
  ON accounts FOR ALL
  USING (is_admin_user());

-- ----------------------------------------------------------------------------
-- TRANSACTIONS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id OR is_admin_user());

CREATE POLICY "Users can initiate transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_admin_user());

CREATE POLICY "Users can update pending transactions (e.g. OTP verification)"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id OR is_admin_user());

CREATE POLICY "Admins have full transaction control"
  ON transactions FOR ALL
  USING (is_admin_user());

-- ----------------------------------------------------------------------------
-- WIRE_TRANSFER_CODES POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view and verify own wire codes"
  ON wire_transfer_codes FOR SELECT
  USING (auth.uid() = user_id OR is_admin_user());

CREATE POLICY "Users can update own wire code attempts"
  ON wire_transfer_codes FOR UPDATE
  USING (auth.uid() = user_id OR is_admin_user());

CREATE POLICY "Admins have full wire transfer code control"
  ON wire_transfer_codes FOR ALL
  USING (is_admin_user());

-- ----------------------------------------------------------------------------
-- ADMIN_CODE_SETTINGS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Anyone authenticated can view enabled code settings"
  ON admin_code_settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can modify code settings"
  ON admin_code_settings FOR ALL
  USING (is_admin_user());

-- ----------------------------------------------------------------------------
-- USER_ASSIGNED_CODES POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view assigned clearance codes"
  ON user_assigned_codes FOR SELECT
  USING (auth.uid() = user_id OR is_admin_user());

CREATE POLICY "Only admins can assign or modify clearance codes"
  ON user_assigned_codes FOR ALL
  USING (is_admin_user());

-- ----------------------------------------------------------------------------
-- ATM_CARDS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own debit cards"
  ON atm_cards FOR SELECT
  USING (auth.uid() = user_id OR is_admin_user());

CREATE POLICY "Users can manage limits and freeze own cards"
  ON atm_cards FOR UPDATE
  USING (auth.uid() = user_id OR is_admin_user());

CREATE POLICY "Users can request new debit cards"
  ON atm_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_admin_user());

CREATE POLICY "Admins have full card access"
  ON atm_cards FOR ALL
  USING (is_admin_user());

-- ----------------------------------------------------------------------------
-- CRYPTO_WALLETS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own crypto wallets"
  ON crypto_wallets FOR SELECT
  USING (auth.uid() = user_id OR is_admin_user());

CREATE POLICY "Users can manage own crypto wallets"
  ON crypto_wallets FOR ALL
  USING (auth.uid() = user_id OR is_admin_user());

-- ----------------------------------------------------------------------------
-- NOTIFICATIONS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id OR is_admin_user());

CREATE POLICY "Users can mark own notifications as read"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id OR is_admin_user());

CREATE POLICY "Admins can insert system notifications"
  ON notifications FOR ALL
  USING (is_admin_user());

-- ----------------------------------------------------------------------------
-- EMAIL_LOGS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view own email history"
  ON email_logs FOR SELECT
  USING (auth.uid() = user_id OR is_admin_user());

CREATE POLICY "Admins have full access to email logs"
  ON email_logs FOR ALL
  USING (is_admin_user());

-- ----------------------------------------------------------------------------
-- ADMIN_AUDIT_LOG POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Only admins can view audit log"
  ON admin_audit_log FOR SELECT
  USING (is_admin_user());

CREATE POLICY "Admins can append audit records"
  ON admin_audit_log FOR INSERT
  WITH CHECK (is_admin_user());

-- ----------------------------------------------------------------------------
-- OTP_CODES POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view and consume own OTP codes"
  ON otp_codes FOR ALL
  USING (auth.uid() = user_id OR is_admin_user());

-- ----------------------------------------------------------------------------
-- EXCHANGE_RATES POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "Exchange rates are readable by all users"
  ON exchange_rates FOR SELECT
  USING (TRUE);

CREATE POLICY "Only admins can modify exchange rates"
  ON exchange_rates FOR ALL
  USING (is_admin_user());

-- ----------------------------------------------------------------------------
-- SYSTEM_SETTINGS POLICIES
-- ----------------------------------------------------------------------------
CREATE POLICY "System settings are readable by authenticated users"
  ON system_settings FOR SELECT
  USING (auth.role() = 'authenticated' OR TRUE);

CREATE POLICY "Only admins can modify system settings"
  ON system_settings FOR ALL
  USING (is_admin_user());

-- ============================================================================
-- 8. DEFAULT SEED DATA
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ADMIN CODE SETTINGS (COT, TAX, IMF, AML, PAP, OTP)
-- ----------------------------------------------------------------------------
INSERT INTO admin_code_settings (code_type, is_enabled, display_name, description, default_code, applies_to_amount_above)
VALUES 
  (
    'COT', 
    TRUE, 
    'Cost of Transfer (COT) Code', 
    'Mandatory interbank clearing certification fee required for high-volume cross-border SWIFT settlement.', 
    'COT-99482', 
    5000.00
  ),
  (
    'TAX', 
    TRUE, 
    'Tax Clearance Certificate (TCC) Code', 
    'Federal Revenue and International Withholding Tax clearance code for offshore outbound liquidations.', 
    'TAX-77291', 
    10000.00
  ),
  (
    'IMF', 
    TRUE, 
    'International Monetary Fund (IMF) Clearance Code', 
    'Sovereign international liquidity clearance verifying non-sanctioned sovereign destination routing.', 
    'IMF-55104', 
    25000.00
  ),
  (
    'AML', 
    TRUE, 
    'Anti-Money Laundering (AML) Compliance Stamp', 
    'FinCEN / FATF regulatory validation token confirming source-of-wealth compliance.', 
    'AML-88302', 
    10000.00
  ),
  (
    'PAP', 
    TRUE, 
    'Pre-Authorized Payment (PAP) Release Token', 
    'Final dual-custody treasury clearance code authorizing immediate clearing on central bank rails.', 
    'PAP-44190', 
    50000.00
  ),
  (
    'OTP', 
    TRUE, 
    'One-Time Security Verification (2FA OTP)', 
    'Standard dynamic SMS/Email second-factor security code required for transactions exceeding threshold.', 
    NULL, 
    1000.00
  )
ON CONFLICT (code_type) DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  default_code = EXCLUDED.default_code,
  applies_to_amount_above = EXCLUDED.applies_to_amount_above;

-- ----------------------------------------------------------------------------
-- 2. LIVE BENCHMARK EXCHANGE RATES (FIAT & CRYPTO)
-- ----------------------------------------------------------------------------
INSERT INTO exchange_rates (from_currency, to_currency, rate, source)
VALUES
  -- Base USD
  ('USD', 'EUR', 0.92000000, 'system_benchmark'),
  ('USD', 'GBP', 0.79000000, 'system_benchmark'),
  ('USD', 'CHF', 0.89500000, 'system_benchmark'),
  ('USD', 'CAD', 1.36000000, 'system_benchmark'),
  ('USD', 'AUD', 1.52000000, 'system_benchmark'),
  ('USD', 'JPY', 154.20000000, 'system_benchmark'),
  ('USD', 'NGN', 1580.00000000, 'system_benchmark'),
  ('USD', 'BTC', 0.00001550, 'system_benchmark'),
  ('USD', 'ETH', 0.00029500, 'system_benchmark'),
  ('USD', 'USDT', 1.00000000, 'system_benchmark'),
  ('USD', 'USDC', 1.00000000, 'system_benchmark'),
  ('USD', 'SOL', 0.00685000, 'system_benchmark'),

  -- Inverses to USD
  ('EUR', 'USD', 1.08695652, 'system_benchmark'),
  ('GBP', 'USD', 1.26582278, 'system_benchmark'),
  ('CHF', 'USD', 1.11731844, 'system_benchmark'),
  ('CAD', 'USD', 0.73529412, 'system_benchmark'),
  ('AUD', 'USD', 0.65789474, 'system_benchmark'),
  ('JPY', 'USD', 0.00648508, 'system_benchmark'),
  ('NGN', 'USD', 0.00063291, 'system_benchmark'),
  ('BTC', 'USD', 64516.12903226, 'system_benchmark'),
  ('ETH', 'USD', 3389.83050847, 'system_benchmark'),
  ('SOL', 'USD', 145.98540146, 'system_benchmark'),

  -- Cross Pairs
  ('EUR', 'GBP', 0.85869565, 'system_benchmark'),
  ('GBP', 'EUR', 1.16455696, 'system_benchmark'),
  ('EUR', 'CHF', 0.97282609, 'system_benchmark'),
  ('GBP', 'CAD', 1.72151899, 'system_benchmark')
ON CONFLICT (from_currency, to_currency) DO UPDATE SET
  rate = EXCLUDED.rate,
  updated_at = CURRENT_TIMESTAMP;

-- ----------------------------------------------------------------------------
-- 3. SYSTEM SETTINGS (BANK DEFAULTS & REGULATORY DISCLOSURES)
-- ----------------------------------------------------------------------------
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES
  ('bank_name', 'WB Credit Union', 'Official chartered institution legal entity name.'),
  ('routing_number', '251480576', 'Primary Federal Reserve ABA routing transit number.'),
  ('swift_bic', 'WBCUUS33XXX', 'SWIFT BIC clearing code for international wire transfers.'),
  ('wire_daily_limit_retail', '250000.00', 'Maximum daily outbound wire limit for personal retail accounts.'),
  ('wire_daily_limit_commercial', '5000000.00', 'Maximum daily wire limit for commercial treasury tiers.'),
  ('wire_cutoff_time_est', '17:00', 'Daily EST cutoff time for same-day Fedwire and SEPA clearing.'),
  ('default_overdraft_limit', '1000.00', 'Permitted courtesy overdraft protection buffer.'),
  ('compliance_support_email', 'clearance@wbcredit.org', 'Direct escalation email for wire and code verification support.'),
  ('support_phone', '+1 (800) 555-9228', '24/7 Member Treasury hotline.'),
  ('enforce_transfer_codes', 'true', 'Global switch enforcing COT/TAX/IMF/AML/PAP checks on international wires.'),
  ('maintenance_mode', 'false', 'Global flag to restrict transactions during scheduled treasury audits.')
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
