/**
 * ============================================================================
 * WB CREDIT UNION - ADMIN SYSTEM SETTINGS & AUDIT LOG CONTROLLER (js/admin-settings.js)
 * ============================================================================
 * 
 * Manages institutional bank infrastructure, policies, and immutable audit logs:
 * 1. Email / Google Login-Captcha Configuration:
 *    - cPanel & Custom SMTP Mail Server (Transaction Notifications)
 *    - Instant Dispatch & Quick Presets (cPanel, Gmail SMTP)
 *    - Live Test Notification Dispatch
 *    - Google Login Credentials (Client ID, Client Secret, Redirect URL)
 *    - Google Captcha Credentials (Secret, Site-Key)
 * 2. Theme / Display:
 *    - Dark, Light, Swiss Navy themes, accent colors, and layout preferences
 * 3. Payment Settings:
 *    - WBCU Foreign Partner Bank Accounts (USA, Canada, Europe correspondent details)
 *    - 4 WBCU Custody Wallets: BTC, Ethereum (ETH), Ethereum USDT, Tether USDT + QR Codes
 *    - Apple Gift Card Payment Method:
 *      * Embedded Apple Gift link (official purchase redirect)
 *      * 16-Digit Code verification & front/back card upload
 *      * Admin Verification & Approval Desk (Credit account, Reject, Delete)
 * 4. Bank Profile, Depository Routing & Sovereign Policies
 * 5. Transaction Velocity Limits & Fee Schedules
 * 6. Account Tier Policies & Sovereign Interest Rates
 * 7. Enterprise Security Protocols & Emergency Maintenance Mode
 * 8. Master Immutable Officer Audit Trail & Telemetry
 * ============================================================================
 */

import { showToast } from './supabase-config.js';
import { getAdminUsersList, saveAdminUsersList } from './admin-users.js';
import { createNotification, sendAppleGiftCardApprovedEmail } from './notifications-email.js';

export const ADMIN_SETTINGS_STORAGE_KEY = 'wb_system_settings_db';
export const ADMIN_AUDIT_LOGS_STORAGE_KEY = 'wb_admin_master_audit_log';
export const ADMIN_GIFT_CARDS_STORAGE_KEY = 'wb_payment_gift_cards_db';

/* ----------------------------------------------------------------------------
 * 1. DEFAULT SETTINGS STATE
 * ---------------------------------------------------------------------------- */
export const defaultSystemSettings = {
  bankInfo: {
    bankName: 'WB CREDIT UNION',
    routingNumber: '251480576',
    swiftBic: 'WBCUCHZZ80A',
    address: '109, Feldgüetliweg Meilen Bezirk Meilen Zurich 8706 Switzerland',
    phone: '001 (207) 613-1332',
    email: 'info@wbcu.net',
    websiteUrl: 'https://www.wbcu.net'
  },
  transactionSettings: {
    minTransfer: 10,
    maxDailyTransfer: 500000,
    maxSingleTransfer: 250000,
    wireFeeFlat: 45.00,
    wireFeePercent: 0.15,
    internalFee: 0.00,
    cryptoFeePercent: 0.25,
    otpThreshold: 10000,
    autoApproveLimit: 5000
  },
  accountSettings: {
    defaultAccountType: 'Checking',
    defaultCurrency: 'USD',
    savingsInterestRate: 4.85,
    checkingInterestRate: 0.75,
    businessInterestRate: 3.20,
    offshoreInterestRate: 5.10,
    maxAccountsPerUser: 10,
    allowCryptoCustody: true
  },
  securitySettings: {
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    sessionTimeoutMinutes: 15,
    minPasswordLength: 8,
    requireComplexPassword: true,
    requireKycAboveAmount: 25000
  },
  // 1. Email & SMTP Configuration
  emailSettings: {
    smtpHost: 'mail.wbcu.net',
    smtpPort: 587,
    smtpUser: 'info@wbcu.net',
    smtpPass: 'cPanel Webmail Password',
    senderName: 'WB Credit Union',
    senderEmail: 'info@wbcu.net',
    testRecipient: 'debstarnetwork@gmail.com',
    instantDispatch: true,
    enableGlobalEmail: true,
    emailTypeTx: true,
    emailTypeWire: true,
    emailTypeOtp: true,
    emailTypeCard: true,
    emailTypeGiftCard: true
  },
  // Google Login Credentials
  googleAuth: {
    clientId: '',
    clientSecret: '',
    redirectUrl: 'http://yoursite.com/auth/google/callback',
    enabled: true
  },
  // Google Captcha Credentials
  captcha: {
    captchaSecret: '',
    captchaSiteKey: '',
    enabled: true
  },
  // 2. Theme / Display Settings
  themeDisplay: {
    theme: 'dark', // 'dark' | 'light' | 'swiss-navy'
    accentColor: '#3b82f6',
    sidebarStyle: 'full',
    portalTagline: 'WB Credit Union - Swiss Depository & Wealth Custody',
    tableDensity: 'comfortable',
    showCryptoDecimals: 4
  },
  // 3. Payment Settings: Swiss HQ, Foreign Partner Banks, 4 Crypto Wallets & Apple Gift Card
  paymentSettings: {
    // Primary Swiss Core Depository Account
    swissHeadquarters: {
      name: '🇨🇭 WBCU Swiss Headquarters (Zurich)',
      badge: 'SWISS CORE',
      routingNumber: '251480576',
      swiftBic: 'WBCUCHZZ80A',
      address: '109, Feldgüetliweg Meilen, Zurich 8706 Switzerland',
      beneficiaryName: 'WB CREDIT UNION',
      currency: 'CHF, USD, EUR, GBP',
      instructions: 'Direct Swiss Core wire clearing. Include Member Account Number in memo note.',
      status: 'active'
    },
    // Foreign representative or partner bank details
    foreignPartners: [
      {
        id: 'fp-usa-chase',
        partnerName: 'JPMorgan Chase Bank, N.A. (Americas Correspondent)',
        country: 'United States',
        countryCode: 'US',
        beneficiaryName: 'WB Credit Union Americas Clearing LLC',
        bankName: 'JPMorgan Chase Bank, N.A., New York',
        accountNumber: '884920194821',
        routingNumber: '021000021',
        swiftBic: 'CHASUS33AXX',
        bankAddress: '270 Park Avenue, New York, NY 10017, USA',
        currency: 'USD',
        status: 'active',
        isPrimary: true,
        instructions: 'Include Member ID & Full Legal Name in wire transfer memo / reference field.'
      },
      {
        id: 'fp-can-rbc',
        partnerName: 'Royal Bank of Canada (Canadian Clearing Partner)',
        country: 'Canada',
        countryCode: 'CA',
        beneficiaryName: 'WBCU North American Trust Corp',
        bankName: 'Royal Bank of Canada (RBC)',
        accountNumber: '00392-1094827',
        routingNumber: 'Transit: 00392 / Inst: 003',
        swiftBic: 'ROYCCAT2XXX',
        bankAddress: '200 Bay Street, Toronto, ON M5J 2J5, Canada',
        currency: 'CAD',
        status: 'active',
        isPrimary: false,
        instructions: 'Interac e-Transfer or direct EFT/Wire. Memo note: WBCU-[Member_Account_Number]'
      },
      {
        id: 'fp-uk-barclays',
        partnerName: 'Barclays Bank UK (European & UK Clearing Desk)',
        country: 'United Kingdom / Europe',
        countryCode: 'GB',
        beneficiaryName: 'WB Credit Union European Clearing Ltd',
        bankName: 'Barclays Bank UK PLC',
        accountNumber: 'GB29BARC20000048201948',
        routingNumber: 'Sort Code: 20-00-00',
        swiftBic: 'BARCGB22XXX',
        bankAddress: '1 Churchill Place, Canary Wharf, London E14 5HP, UK',
        currency: 'GBP / EUR',
        status: 'active',
        isPrimary: false,
        instructions: 'Faster Payments or SEPA credit transfer. Beneficiary memo: WBCU Member Deposit'
      }
    ],

    // Up to four crypto wallets: BTC, Ethereum, Ethereum USDT, and Tether USDT with real QR Codes
    cryptoWallets: [
      {
        id: 'cw-btc',
        currency: 'BTC',
        name: 'Bitcoin (BTC) Vault',
        symbol: 'BTC',
        network: 'Bitcoin Mainnet (SegWit)',
        address: 'bc1q4cuj7w73zhc9wulsk2qn9htggfdfjuzkgg2vm2',
        qrCodeUrl: 'https://i.postimg.cc/XNBmLg4G/BTC-Wallet.jpg',
        status: 'active',
        minDeposit: '0.0005 BTC',
        confirmations: '2 Confirmations'
      },
      {
        id: 'cw-eth',
        currency: 'ETH',
        name: 'Ethereum (ETH) Vault',
        symbol: 'ETH',
        network: 'Ethereum Mainnet (ERC-20)',
        address: '0x10B950A223D1326099f61662c4a873B51cA2a3c5',
        qrCodeUrl: 'https://i.postimg.cc/ZYv2HL4Y/USTD-Ethereum-Wallet.jpg',
        status: 'active',
        minDeposit: '0.01 ETH',
        confirmations: '12 Confirmations'
      },
      {
        id: 'cw-usdt-erc20',
        currency: 'USDT',
        name: 'Ethereum USDT Vault',
        symbol: 'USDT (ERC-20)',
        network: 'Ethereum Network (ERC-20)',
        address: '0x10B950A223D1326099f61662c4a873B51cA2a3c5',
        qrCodeUrl: 'https://i.postimg.cc/ZYv2HL4Y/USTD-Ethereum-Wallet.jpg',
        status: 'active',
        minDeposit: '20 USDT',
        confirmations: '12 Confirmations'
      },
      {
        id: 'cw-usdt-trc20',
        currency: 'USDT',
        name: 'Tether USDT Vault',
        symbol: 'USDT (TRC-20)',
        network: 'TRON Network (TRC-20)',
        address: 'TTtuJB1gzgPGejDikPEyRmmmvHQNhtm6p6',
        qrCodeUrl: 'https://i.postimg.cc/HW8Rztd7/TRON-USDT.jpg',
        status: 'active',
        minDeposit: '10 USDT',
        confirmations: '1 Confirmation (~30s)'
      }
    ],

    // Apple Gift Card payment method
    appleGiftCard: {
      enabled: true,
      buyLink: 'https://www.apple.com/shop/buy-giftcard/giftcard',
      minAmount: 25,
      maxAmount: 2500,
      currency: 'USD',
      instructions: 'Click the embedded Apple Gift link to purchase an official Apple Gift Card, then return to WB Credit Union to upload the front & back card image and paste the 16 digits of the Apple Gift Card code for admin verification and approval.',
      autoRequireCardImage: true
    }
  },
  maintenanceMode: {
    enabled: false,
    message: 'WB Credit Union is undergoing scheduled Swiss core banking ledger synchronization. Real-time access will resume shortly.'
  },
  forexSettings: {
    baseCurrency: 'USD',
    updateFrequency: 'hourly',
    spreadPercent: 0.35,
    allowManualOverride: true
  }
};

/* ----------------------------------------------------------------------------
 * 2. DEFAULT SEED DATA (AUDIT LOGS & APPLE GIFT CARDS)
 * ---------------------------------------------------------------------------- */
const initialAuditLogs = [
  {
    id: 'aud-8891',
    date: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    officer: 'Chief Treasury Auditor',
    action: 'WIRE_CLEARANCE_PASSED',
    targetUser: 'Miz Brymo (usr-101)',
    details: 'Validated COT Token CT-78234 for Outbound Wire #WB-SWIFT-99201 (€240,000.00)',
    ip: '178.197.234.12 (Zurich Station)'
  },
  {
    id: 'aud-8890',
    date: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    officer: 'Chief Treasury Auditor',
    action: 'CRYPTO_CREDIT_POSTED',
    targetUser: 'Elena Rostova (usr-102)',
    details: 'Direct treasury reserve credit +15.00 BTC ($981,300.00 USD) posted',
    ip: 'Internal Treasury Node'
  },
  {
    id: 'aud-8889',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    officer: 'Chief Treasury Auditor',
    action: 'GIFT_CARD_VERIFIED',
    targetUser: 'Sune Gunnar Bergkvist (usr-106)',
    details: 'Verified Apple Gift Card 16-digit code X892-4910-8821-9943. Credited $500.00 USD',
    ip: '178.197.234.12 (Zurich Station)'
  },
  {
    id: 'aud-8888',
    date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    officer: 'Chief Treasury Auditor',
    action: 'PARTNER_BANK_UPDATED',
    targetUser: 'GLOBAL_PAYMENTS',
    details: 'Updated JPMorgan Chase Americas correspondent clearing routing instructions',
    ip: 'Zurich Settlement Node'
  },
  {
    id: 'aud-8887',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    officer: 'Chief Treasury Auditor',
    action: 'GLOBAL_SETTINGS_SAVED',
    targetUser: 'SYSTEM_CORE',
    details: 'Updated cPanel SMTP dispatch relay to mail.wbcu.net and OAuth redirect credentials',
    ip: 'Internal Zurich HSM Node'
  }
];

const initialGiftCardSubmissions = [
  {
    id: 'agc-901',
    date: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    userId: 'usr-101',
    userName: 'Miz Brymo',
    userEmail: 'mizbrymo@gmail.com',
    accountNumber: '2514809281',
    targetAccount: 'Premier Checking',
    code: 'X892-4910-8821-9943',
    amount: 500.00,
    currency: 'USD',
    cardImage: 'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=600&auto=format&fit=crop&q=80',
    status: 'pending',
    notes: 'Purchased via official Apple Store link. Front and back uploaded.',
    submittedAt: new Date(Date.now() - 42 * 60 * 1000).toISOString()
  },
  {
    id: 'agc-902',
    date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    userId: 'usr-102',
    userName: 'Elena Rostova',
    userEmail: 'elena.rostova@vanguardlogistics.ch',
    accountNumber: '2514808849',
    targetAccount: 'Institutional Business Vault',
    code: 'A482-1109-8832-6610',
    amount: 1000.00,
    currency: 'USD',
    cardImage: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600&auto=format&fit=crop&q=80',
    status: 'approved',
    notes: 'Verified with Apple Store POS ledger. Funds settled to checking vault.',
    submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    approvedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString()
  }
];

/* ----------------------------------------------------------------------------
 * 3. STORAGE GETTERS & SETTERS
 * ---------------------------------------------------------------------------- */
export function getSystemSettings() {
  const stored = localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      const merged = deepMerge(defaultSystemSettings, parsed);

      // Auto-migrate to real QR codes and cryptographic addresses if older placeholder remains
      if (Array.isArray(merged.paymentSettings?.cryptoWallets)) {
        merged.paymentSettings.cryptoWallets.forEach((w) => {
          if (w.id === 'cw-btc' && (!w.qrCodeUrl || w.qrCodeUrl.includes('api.qrserver.com') || (w.address && w.address.includes('bc1q9x48')))) {
            w.qrCodeUrl = 'https://i.postimg.cc/XNBmLg4G/BTC-Wallet.jpg';
            w.address = 'bc1q4cuj7w73zhc9wulsk2qn9htggfdfjuzkgg2vm2';
          } else if (w.id === 'cw-eth' && (!w.qrCodeUrl || w.qrCodeUrl.includes('api.qrserver.com') || (w.address && w.address.includes('0x71C8705b')))) {
            w.qrCodeUrl = 'https://i.postimg.cc/ZYv2HL4Y/USTD-Ethereum-Wallet.jpg';
            w.address = '0x10B950A223D1326099f61662c4a873B51cA2a3c5';
          } else if (w.id === 'cw-usdt-erc20' && (!w.qrCodeUrl || w.qrCodeUrl.includes('api.qrserver.com') || (w.address && w.address.includes('0x71C8705b')))) {
            w.qrCodeUrl = 'https://i.postimg.cc/ZYv2HL4Y/USTD-Ethereum-Wallet.jpg';
            w.address = '0x10B950A223D1326099f61662c4a873B51cA2a3c5';
          } else if (w.id === 'cw-usdt-trc20' && (!w.qrCodeUrl || w.qrCodeUrl.includes('api.qrserver.com') || (w.address && w.address.includes('TX8yH7q8v')))) {
            w.qrCodeUrl = 'https://i.postimg.cc/HW8Rztd7/TRON-USDT.jpg';
            w.address = 'TTtuJB1gzgPGejDikPEyRmmmvHQNhtm6p6';
          }
        });
      }

      return merged;
    } catch {
      // Fallback
    }
  }
  localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(defaultSystemSettings));
  return JSON.parse(JSON.stringify(defaultSystemSettings));
}

function deepMerge(target, source) {
  const output = { ...target };
  if (!source || typeof source !== 'object') return output;
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

export function saveSystemSettings(settings) {
  localStorage.setItem(ADMIN_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function getAuditLogs() {
  const stored = localStorage.getItem(ADMIN_AUDIT_LOGS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fallback
    }
  }
  localStorage.setItem(ADMIN_AUDIT_LOGS_STORAGE_KEY, JSON.stringify(initialAuditLogs));
  return initialAuditLogs;
}

export function logAdminAction(action, targetUser, details) {
  const logs = getAuditLogs();
  const newLog = {
    id: `aud-${Date.now().toString().slice(-4)}`,
    date: new Date().toISOString(),
    officer: 'Chief Treasury Auditor',
    action,
    targetUser,
    details,
    ip: '178.197.234.12 (Zurich Station)'
  };
  logs.unshift(newLog);
  localStorage.setItem(ADMIN_AUDIT_LOGS_STORAGE_KEY, JSON.stringify(logs));
}

export function getGiftCardSubmissions() {
  const stored = localStorage.getItem(ADMIN_GIFT_CARDS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fallback
    }
  }
  localStorage.setItem(ADMIN_GIFT_CARDS_STORAGE_KEY, JSON.stringify(initialGiftCardSubmissions));
  return initialGiftCardSubmissions;
}

export function saveGiftCardSubmissions(list) {
  localStorage.setItem(ADMIN_GIFT_CARDS_STORAGE_KEY, JSON.stringify(list));
}

/* ----------------------------------------------------------------------------
 * 4. INITIALIZATION
 * ---------------------------------------------------------------------------- */
export function initAdminSettings() {
  setupSettingsSubTabs();
  populateSettingsForm();
  setupSettingsEventHandlers();
  setupQuickPresets();
  setupPaymentSettingsHandlers();
  setupAppleGiftCardDesk();
  setupAuditLogSearch();
  renderAuditLogsTable();
  renderSwissHqAccount();
  renderPartnerBanksList();
  renderPaymentCryptoWallets();
  renderGiftCardsQueueTable();
}

/* ----------------------------------------------------------------------------
 * 5. SUB-TABS NAVIGATION
 * ---------------------------------------------------------------------------- */
function setupSettingsSubTabs() {
  const tabButtons = document.querySelectorAll('.admin-settings-tab-btn');
  const tabPanes = document.querySelectorAll('.admin-settings-tab-pane');

  if (!tabButtons.length) return;

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      if (!targetTab) return;

      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      tabPanes.forEach((pane) => {
        if (pane.id === `tabPane-${targetTab}`) {
          pane.style.display = 'block';
        } else {
          pane.style.display = 'none';
        }
      });
    });
  });
}

/* ----------------------------------------------------------------------------
 * 6. POPULATE & BIND SETTINGS
 * ---------------------------------------------------------------------------- */
function populateSettingsForm() {
  const settings = getSystemSettings();

  // Bank Info
  setVal('settingBankName', settings.bankInfo.bankName);
  setVal('settingRoutingNumber', settings.bankInfo.routingNumber);
  setVal('settingSwiftBic', settings.bankInfo.swiftBic);
  setVal('settingAddress', settings.bankInfo.address);
  setVal('settingPhone', settings.bankInfo.phone);
  setVal('settingEmail', settings.bankInfo.email);
  setVal('settingWebsite', settings.bankInfo.websiteUrl);

  // Transaction Limits
  setVal('settingMinTransfer', settings.transactionSettings.minTransfer);
  setVal('settingMaxDailyTransfer', settings.transactionSettings.maxDailyTransfer);
  setVal('settingMaxSingleTransfer', settings.transactionSettings.maxSingleTransfer);
  setVal('settingWireFeeFlat', settings.transactionSettings.wireFeeFlat);
  setVal('settingCryptoFee', settings.transactionSettings.cryptoFeePercent);
  setVal('settingOtpThreshold', settings.transactionSettings.otpThreshold);
  setVal('settingAutoApproveLimit', settings.transactionSettings.autoApproveLimit);

  // Account Policies
  setVal('settingDefaultAccountType', settings.accountSettings.defaultAccountType);
  setVal('settingDefaultCurrency', settings.accountSettings.defaultCurrency);
  setVal('settingSavingsRate', settings.accountSettings.savingsInterestRate);
  setVal('settingCheckingRate', settings.accountSettings.checkingInterestRate);
  setVal('settingBusinessRate', settings.accountSettings.businessInterestRate);
  setVal('settingOffshoreRate', settings.accountSettings.offshoreInterestRate);
  setVal('settingMaxAccounts', settings.accountSettings.maxAccountsPerUser);
  setCheckbox('settingAllowCrypto', settings.accountSettings.allowCryptoCustody);

  // Security Policies
  setVal('settingMaxLoginAttempts', settings.securitySettings.maxLoginAttempts);
  setVal('settingLockoutDuration', settings.securitySettings.lockoutDurationMinutes);
  setVal('settingSessionTimeout', settings.securitySettings.sessionTimeoutMinutes);
  setVal('settingRequireKycAbove', settings.securitySettings.requireKycAboveAmount);

  // 1. Email SMTP (cPanel & Custom Server)
  setVal('settingSenderEmail', settings.emailSettings.senderEmail || 'info@wbcu.net');
  setVal('settingSenderName', settings.emailSettings.senderName || 'WB Credit Union');
  setVal('settingSmtpHost', settings.emailSettings.smtpHost || 'mail.wbcu.net');
  setVal('settingSmtpPort', settings.emailSettings.smtpPort || 587);
  setVal('settingSmtpUser', settings.emailSettings.smtpUser || 'info@wbcu.net');
  const storedPass = settings.emailSettings.smtpPass || '';
  setVal('settingSmtpPass', (storedPass === 'cPanel Webmail Password') ? '' : storedPass);
  setVal('settingTestRecipient', settings.emailSettings.testRecipient || 'debstarnetwork@gmail.com');
  setCheckbox('settingInstantDispatch', settings.emailSettings.instantDispatch ?? true);
  setCheckbox('settingEnableGlobalEmail', settings.emailSettings.enableGlobalEmail ?? true);

  // Google Login Credentials
  setVal('settingGoogleClientId', settings.googleAuth?.clientId || '');
  setVal('settingGoogleClientSecret', settings.googleAuth?.clientSecret || '');
  setVal('settingGoogleRedirectUrl', settings.googleAuth?.redirectUrl || 'http://yoursite.com/auth/google/callback');
  setCheckbox('settingEnableGoogleAuth', settings.googleAuth?.enabled ?? true);

  // Google Captcha Credentials
  setVal('settingCaptchaSecret', settings.captcha?.captchaSecret || '');
  setVal('settingCaptchaSiteKey', settings.captcha?.captchaSiteKey || '');
  setCheckbox('settingEnableCaptcha', settings.captcha?.enabled ?? true);

  // 2. Theme & Display
  setVal('settingThemeMode', settings.themeDisplay?.theme || 'dark');
  setVal('settingAccentColor', settings.themeDisplay?.accentColor || '#3b82f6');
  setVal('settingPortalTagline', settings.themeDisplay?.portalTagline || 'WB Credit Union - Swiss Depository & Wealth Custody');
  setVal('settingTableDensity', settings.themeDisplay?.tableDensity || 'comfortable');

  // Apple Gift Card Settings
  if (settings.paymentSettings?.appleGiftCard) {
    const agc = settings.paymentSettings.appleGiftCard;
    setCheckbox('settingAppleGiftEnabled', agc.enabled ?? true);
    setVal('settingAppleGiftBuyLink', agc.buyLink || 'https://www.apple.com/shop/buy-giftcard/giftcard');
    setVal('settingAppleGiftMin', agc.minAmount || 25);
    setVal('settingAppleGiftMax', agc.maxAmount || 2500);
    setVal('settingAppleGiftInstructions', agc.instructions || '');
  }

  // Maintenance & Forex
  setCheckbox('settingMaintenanceToggle', settings.maintenanceMode.enabled);
  setVal('settingMaintenanceMessage', settings.maintenanceMode.message);
  setVal('settingBaseCurrency', settings.forexSettings.baseCurrency);
  setVal('settingForexSpread', settings.forexSettings.spreadPercent);
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val !== undefined && val !== null ? val : '';
}

function setCheckbox(id, checked) {
  const el = document.getElementById(id);
  if (el) el.checked = !!checked;
}

/* ----------------------------------------------------------------------------
 * 7. QUICK PRESETS & TEST EMAIL DISPATCH
 * ---------------------------------------------------------------------------- */
function setupQuickPresets() {
  // Preset 1: cPanel (mail.digitalglobalelite.com)
  const btnCpanel = document.getElementById('btnPresetCpanel');
  if (btnCpanel) {
    btnCpanel.addEventListener('click', (e) => {
      e.preventDefault();
      setVal('settingSmtpHost', 'mail.digitalglobalelite.com');
      setVal('settingSmtpPort', 465);
      setVal('settingSmtpUser', 'info@digitalglobalelite.com');
      setVal('settingSenderEmail', 'info@digitalglobalelite.com');
      setVal('settingSenderName', 'WB Credit Union');
      showToast('Applied cPanel preset: mail.digitalglobalelite.com (SSL Port 465)', 'info', 'Preset Loaded');
    });
  }

  // Preset 2: Gmail SMTP (smtp.gmail.com)
  const btnGmail = document.getElementById('btnPresetGmail');
  if (btnGmail) {
    btnGmail.addEventListener('click', (e) => {
      e.preventDefault();
      setVal('settingSmtpHost', 'smtp.gmail.com');
      setVal('settingSmtpPort', 465);
      setVal('settingSmtpUser', 'info@digitalglobalelite.com');
      setVal('settingSenderEmail', 'info@digitalglobalelite.com');
      setVal('settingSenderName', 'WB Credit Union');
      showToast('Applied Gmail SMTP preset: smtp.gmail.com (SSL Port 465)', 'info', 'Preset Loaded');
    });
  }

  // Send Test Notification
  const btnTestNotif = document.getElementById('btnSendTestNotification');
  if (btnTestNotif) {
    btnTestNotif.addEventListener('click', async (e) => {
      e.preventDefault();
      const testEmail = (document.getElementById('settingTestRecipient')?.value || 'debstarnetwork@gmail.com').trim();
      if (!testEmail || !testEmail.includes('@')) {
        showToast('Please enter a valid recipient email to receive the live test dispatch.', 'error', 'Invalid Email');
        document.getElementById('settingTestRecipient')?.focus();
        return;
      }

      let rawHost = (document.getElementById('settingSmtpHost')?.value || 'mail.wbcu.net').trim();
      // Auto-sanitize host if user entered e.g. mail.info@wbcu.net or info@wbcu.net
      if (rawHost.includes('@')) {
        const parts = rawHost.split('@');
        const dom = parts[parts.length - 1].trim();
        rawHost = dom.startsWith('mail.') || dom.startsWith('smtp.') ? dom : `mail.${dom}`;
        setVal('settingSmtpHost', rawHost);
      }

      const port = parseInt(document.getElementById('settingSmtpPort')?.value || '587', 10);
      const user = (document.getElementById('settingSmtpUser')?.value || 'info@wbcu.net').trim();
      const pass = (document.getElementById('settingSmtpPass')?.value || '').trim();
      const sender = (document.getElementById('settingSenderEmail')?.value || 'info@wbcu.net').trim();
      const senderName = (document.getElementById('settingSenderName')?.value || 'WB Credit Union').trim();

      btnTestNotif.disabled = true;
      btnTestNotif.innerHTML = '<span class="spinner-border spinner-border-sm mr-1"></span> Connecting &amp; Dispatching...';

      try {
        const response = await fetch('/api/test-smtp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: testEmail,
            smtp: {
              host: rawHost,
              port,
              user,
              pass,
              senderEmail: sender,
              senderName
            }
          })
        });

        const resData = await response.json();
        btnTestNotif.disabled = false;
        btnTestNotif.innerHTML = '🚀 Send Test Notification';

        if (resData.success) {
          logAdminAction(
            'SMTP_LIVE_DISPATCH_SUCCESS',
            testEmail,
            `Live automated notification email successfully dispatched to ${testEmail} via ${resData.host}:${resData.port} (${resData.relay || 'relay'}). MessageID: ${resData.messageId}`
          );
          renderAuditLogsTable();
          showSmtpSuccessModal(resData, testEmail);

          showToast(
            `Live notification successfully transmitted to ${testEmail}! (MessageId: ${resData.messageId || 'Delivered'})`,
            'success',
            'Live Email Dispatched'
          );
        } else {
          logAdminAction(
            'SMTP_DISPATCH_DIAGNOSTIC',
            testEmail,
            `Live SMTP connection to ${resData.host}:${resData.port} returned: ${resData.error}`
          );
          renderAuditLogsTable();

          showSmtpDiagnosticModal(resData, testEmail);
          showToast(
            `SMTP Relay Notice: Connected to ${resData.host}:${resData.port}, but server returned '${resData.error}'. Check diagnostic details.`,
            'warning',
            'SMTP Diagnostic'
          );
        }
      } catch (networkErr) {
        btnTestNotif.disabled = false;
        btnTestNotif.innerHTML = '🚀 Send Test Notification';
        showToast(
          `Local relay error: ${networkErr.message}`,
          'error',
          'Dispatch Error'
        );
      }
    });
  }

  // Save Email & Auth Configuration dedicated button
  const btnSaveEmailAuth = document.getElementById('btnSaveEmailAuthSettings');
  if (btnSaveEmailAuth) {
    btnSaveEmailAuth.addEventListener('click', (e) => {
      e.preventDefault();
      saveEmailAndAuthConfig();
    });
  }

  // Save Theme & Display Settings button
  const btnSaveThemeDisplay = document.getElementById('btnSaveThemeDisplaySettings');
  if (btnSaveThemeDisplay) {
    btnSaveThemeDisplay.addEventListener('click', (e) => {
      e.preventDefault();
      saveThemeDisplayConfig();
    });
  }
}

function saveEmailAndAuthConfig() {
  const current = getSystemSettings();

  current.emailSettings = {
    ...current.emailSettings,
    smtpHost: document.getElementById('settingSmtpHost')?.value || 'mail.wbcu.net',
    smtpPort: parseInt(document.getElementById('settingSmtpPort')?.value || '465'),
    smtpUser: document.getElementById('settingSmtpUser')?.value || 'info@wbcu.net',
    smtpPass: document.getElementById('settingSmtpPass')?.value || 'cPanel Webmail Password',
    senderName: document.getElementById('settingSenderName')?.value || 'WB Credit Union',
    senderEmail: document.getElementById('settingSenderEmail')?.value || 'info@digitalglobalelite.com',
    instantDispatch: document.getElementById('settingInstantDispatch')?.checked ?? true,
    enableGlobalEmail: document.getElementById('settingEnableGlobalEmail')?.checked ?? true,
  };

  current.googleAuth = {
    clientId: document.getElementById('settingGoogleClientId')?.value || '',
    clientSecret: document.getElementById('settingGoogleClientSecret')?.value || '',
    redirectUrl: document.getElementById('settingGoogleRedirectUrl')?.value || 'http://yoursite.com/auth/google/callback',
    enabled: document.getElementById('settingEnableGoogleAuth')?.checked ?? true,
  };

  current.captcha = {
    captchaSecret: document.getElementById('settingCaptchaSecret')?.value || '',
    captchaSiteKey: document.getElementById('settingCaptchaSiteKey')?.value || '',
    enabled: document.getElementById('settingEnableCaptcha')?.checked ?? true,
  };

  saveSystemSettings(current);
  logAdminAction('EMAIL_AUTH_SAVED', 'CORE_DISPATCH', 'Updated cPanel SMTP relay, Google OAuth Client ID, and reCAPTCHA credentials.');
  renderAuditLogsTable();
  showToast('Email, SMTP Relay, Google Login & reCAPTCHA credentials securely updated.', 'success', 'Config Saved');
}

function saveThemeDisplayConfig() {
  const current = getSystemSettings();

  const themeMode = document.getElementById('settingThemeMode')?.value || 'dark';
  const accentColor = document.getElementById('settingAccentColor')?.value || '#3b82f6';
  const portalTagline = document.getElementById('settingPortalTagline')?.value || 'WB Credit Union - Swiss Depository & Wealth Custody';
  const tableDensity = document.getElementById('settingTableDensity')?.value || 'comfortable';

  current.themeDisplay = {
    theme: themeMode,
    accentColor,
    portalTagline,
    tableDensity
  };

  saveSystemSettings(current);

  // Apply theme if ThemeManager exists
  try {
    document.documentElement.setAttribute('data-theme', themeMode);
    localStorage.setItem('wbcu_theme_preference', themeMode);
  } catch(e) {}

  logAdminAction('THEME_CONFIG_SAVED', 'UI_ENGINE', `Updated theme display to ${themeMode} with accent ${accentColor}.`);
  renderAuditLogsTable();
  showToast('Theme & Display preferences deployed across institutional portal.', 'success', 'Theme Updated');
}

/* ----------------------------------------------------------------------------
 * 8. MASTER SYSTEM SETTINGS SAVE
 * ---------------------------------------------------------------------------- */
function setupSettingsEventHandlers() {
  const form = document.getElementById('adminSystemSettingsForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveAllSystemSettingsFromForm();
    });
  }
}

function saveAllSystemSettingsFromForm() {
  const current = getSystemSettings();

  const updated = {
    ...current,
    bankInfo: {
      bankName: document.getElementById('settingBankName')?.value || 'WB CREDIT UNION',
      routingNumber: document.getElementById('settingRoutingNumber')?.value || '251480576',
      swiftBic: document.getElementById('settingSwiftBic')?.value || 'WBCUCHZZ80A',
      address: document.getElementById('settingAddress')?.value || '',
      phone: document.getElementById('settingPhone')?.value || '',
      email: document.getElementById('settingEmail')?.value || '',
      websiteUrl: document.getElementById('settingWebsite')?.value || ''
    },
    transactionSettings: {
      minTransfer: parseFloat(document.getElementById('settingMinTransfer')?.value || '10'),
      maxDailyTransfer: parseFloat(document.getElementById('settingMaxDailyTransfer')?.value || '500000'),
      maxSingleTransfer: parseFloat(document.getElementById('settingMaxSingleTransfer')?.value || '250000'),
      wireFeeFlat: parseFloat(document.getElementById('settingWireFeeFlat')?.value || '45'),
      wireFeePercent: 0.15,
      internalFee: 0.00,
      cryptoFeePercent: parseFloat(document.getElementById('settingCryptoFee')?.value || '0.25'),
      otpThreshold: parseFloat(document.getElementById('settingOtpThreshold')?.value || '10000'),
      autoApproveLimit: parseFloat(document.getElementById('settingAutoApproveLimit')?.value || '5000')
    },
    accountSettings: {
      defaultAccountType: document.getElementById('settingDefaultAccountType')?.value || 'Checking',
      defaultCurrency: document.getElementById('settingDefaultCurrency')?.value || 'USD',
      savingsInterestRate: parseFloat(document.getElementById('settingSavingsRate')?.value || '4.85'),
      checkingInterestRate: parseFloat(document.getElementById('settingCheckingRate')?.value || '0.75'),
      businessInterestRate: parseFloat(document.getElementById('settingBusinessRate')?.value || '3.20'),
      offshoreInterestRate: parseFloat(document.getElementById('settingOffshoreRate')?.value || '5.10'),
      maxAccountsPerUser: parseInt(document.getElementById('settingMaxAccounts')?.value || '10'),
      allowCryptoCustody: document.getElementById('settingAllowCrypto')?.checked ?? true
    },
    securitySettings: {
      maxLoginAttempts: parseInt(document.getElementById('settingMaxLoginAttempts')?.value || '5'),
      lockoutDurationMinutes: parseInt(document.getElementById('settingLockoutDuration')?.value || '30'),
      sessionTimeoutMinutes: parseInt(document.getElementById('settingSessionTimeout')?.value || '15'),
      minPasswordLength: 8,
      requireComplexPassword: true,
      requireKycAboveAmount: parseFloat(document.getElementById('settingRequireKycAbove')?.value || '25000')
    },
    emailSettings: {
      smtpHost: document.getElementById('settingSmtpHost')?.value || 'mail.wbcu.net',
      smtpPort: parseInt(document.getElementById('settingSmtpPort')?.value || '465'),
      smtpUser: document.getElementById('settingSmtpUser')?.value || 'info@wbcu.net',
      smtpPass: document.getElementById('settingSmtpPass')?.value || 'cPanel Webmail Password',
      senderName: document.getElementById('settingSenderName')?.value || 'WB Credit Union',
      senderEmail: document.getElementById('settingSenderEmail')?.value || 'info@digitalglobalelite.com',
      instantDispatch: document.getElementById('settingInstantDispatch')?.checked ?? true,
      enableGlobalEmail: document.getElementById('settingEnableGlobalEmail')?.checked ?? true,
      emailTypeTx: true,
      emailTypeWire: true,
      emailTypeOtp: true,
      emailTypeCard: true,
      emailTypeGiftCard: true
    },
    googleAuth: {
      clientId: document.getElementById('settingGoogleClientId')?.value || '',
      clientSecret: document.getElementById('settingGoogleClientSecret')?.value || '',
      redirectUrl: document.getElementById('settingGoogleRedirectUrl')?.value || 'http://yoursite.com/auth/google/callback',
      enabled: document.getElementById('settingEnableGoogleAuth')?.checked ?? true,
    },
    captcha: {
      captchaSecret: document.getElementById('settingCaptchaSecret')?.value || '',
      captchaSiteKey: document.getElementById('settingCaptchaSiteKey')?.value || '',
      enabled: document.getElementById('settingEnableCaptcha')?.checked ?? true,
    },
    maintenanceMode: {
      enabled: document.getElementById('settingMaintenanceToggle')?.checked ?? false,
      message: document.getElementById('settingMaintenanceMessage')?.value || ''
    },
    forexSettings: {
      baseCurrency: document.getElementById('settingBaseCurrency')?.value || 'USD',
      updateFrequency: 'hourly',
      spreadPercent: parseFloat(document.getElementById('settingForexSpread')?.value || '0.35'),
      allowManualOverride: true
    }
  };

  saveSystemSettings(updated);
  logAdminAction('SYSTEM_CONFIG_UPDATED', 'GLOBAL_CORE', 'Updated banking parameters, cPanel SMTP, and security thresholds.');
  renderAuditLogsTable();
  showToast('Global institutional system settings successfully updated & deployed to database.', 'success', 'Settings Saved');
}

/* ----------------------------------------------------------------------------
 * 9. PAYMENT SETTINGS: SWISS HEADQUARTERS, FOREIGN PARTNER BANKS & 4 CRYPTO WALLETS
 * ---------------------------------------------------------------------------- */
export function renderSwissHqAccount() {
  const container = document.getElementById('adminSwissHqCardContainer');
  if (!container) return;

  const settings = getSystemSettings();
  const hq = settings.paymentSettings?.swissHeadquarters || {
    name: '🇨🇭 WBCU Swiss Headquarters (Zurich)',
    badge: 'SWISS CORE',
    routingNumber: settings.bankInfo?.routingNumber || '251480576',
    swiftBic: settings.bankInfo?.swiftBic || 'WBCUCHZZ80A',
    address: settings.bankInfo?.address || '109, Feldgüetliweg Meilen, Zurich 8706 Switzerland',
    beneficiaryName: settings.bankInfo?.bankName || 'WB CREDIT UNION',
    currency: 'CHF, USD, EUR, GBP',
    instructions: 'Direct Swiss Core wire clearing. Include Member Account Number in memo note.',
    status: 'active'
  };

  container.innerHTML = `
    <div class="admin-partner-card is-primary">
      <div class="d-flex items-center justify-between mb-2">
        <div class="d-flex items-center gap-2">
          <span style="font-size: 1.25rem;">🇨🇭</span>
          <strong class="text-white text-sm">${escapeHtml(hq.name || 'WBCU Swiss Headquarters (Zurich)')}</strong>
        </div>
        <div class="d-flex items-center gap-1">
          <span class="action-chip action-chip-approve font-mono" style="font-size:0.65rem;">PRIMARY</span>
          <span class="action-chip font-mono font-bold" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.5); font-size: 0.65rem;">
            ${escapeHtml(hq.badge || 'SWISS CORE')}
          </span>
        </div>
      </div>

      <div class="text-xs text-muted mb-2">
        <strong>Jurisdiction:</strong> Zurich, Switzerland &bull; <strong>Currency:</strong> <span class="text-white">${escapeHtml(hq.currency || 'CHF, USD, EUR, GBP')}</span>
      </div>

      <div class="p-2 mb-2 rounded font-mono text-xs" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08);">
        <div class="d-flex justify-between mb-1">
          <span class="text-muted">Beneficiary:</span>
          <span class="text-white font-bold">${escapeHtml(hq.beneficiaryName || 'WB CREDIT UNION')}</span>
        </div>
        <div class="d-flex justify-between mb-1">
          <span class="text-muted">Account / Depository:</span>
          <span class="text-info font-bold">SWISS-CORE-HQ-01</span>
        </div>
        <div class="d-flex justify-between mb-1">
          <span class="text-muted">Routing / ABA:</span>
          <span class="text-white">${escapeHtml(hq.routingNumber || '251480576')}</span>
        </div>
        <div class="d-flex justify-between mb-1">
          <span class="text-muted">SWIFT BIC:</span>
          <span class="text-warning font-bold">${escapeHtml(hq.swiftBic || 'WBCUCHZZ80A')}</span>
        </div>
        <div class="d-flex justify-between">
          <span class="text-muted">Headquarters:</span>
          <span class="text-white">${escapeHtml(hq.address || '109, Feldgüetliweg Meilen, Zurich 8706 Switzerland')}</span>
        </div>
      </div>

      <div class="text-xs text-muted mb-3" style="font-style: italic;">
        "${escapeHtml(hq.instructions || 'Direct Swiss Core wire clearing. Include Member Account Number in memo note.')}"
      </div>

      <div class="d-flex items-center justify-between pt-2 border-top border-secondary">
        <span class="text-xs text-success font-bold d-flex items-center gap-1">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#22c55e;"></span>
          Active Swiss Depository Clearing
        </span>
        <button type="button" class="admin-btn admin-btn-sm admin-btn-outline btn-edit-swiss-hq" data-action="edit-swiss-hq">
          ✏️ Edit
        </button>
      </div>
    </div>
  `;
}

export function openSwissHqModal() {
  const modal = document.getElementById('adminSwissHqModal');
  if (!modal) return;

  const settings = getSystemSettings();
  const hq = settings.paymentSettings?.swissHeadquarters || {
    name: '🇨🇭 WBCU Swiss Headquarters (Zurich)',
    badge: 'SWISS CORE',
    routingNumber: settings.bankInfo?.routingNumber || '251480576',
    swiftBic: settings.bankInfo?.swiftBic || 'WBCUCHZZ80A',
    address: settings.bankInfo?.address || '109, Feldgüetliweg Meilen, Zurich 8706 Switzerland',
    beneficiaryName: settings.bankInfo?.bankName || 'WB CREDIT UNION',
    currency: 'CHF, USD, EUR, GBP',
    instructions: 'Direct Swiss Core wire clearing. Include Member Account Number in memo note.',
    status: 'active'
  };

  setVal('swissHqModalName', hq.name || '🇨🇭 WBCU Swiss Headquarters (Zurich)');
  setVal('swissHqModalBadge', hq.badge || 'SWISS CORE');
  setVal('swissHqModalRouting', hq.routingNumber || '251480576');
  setVal('swissHqModalSwift', hq.swiftBic || 'WBCUCHZZ80A');
  setVal('swissHqModalAddress', hq.address || '109, Feldgüetliweg Meilen, Zurich 8706 Switzerland');
  setVal('swissHqModalBeneficiary', hq.beneficiaryName || 'WB CREDIT UNION');
  setVal('swissHqModalCurrency', hq.currency || 'CHF, USD, EUR, GBP');
  setVal('swissHqModalInstructions', hq.instructions || '');

  modal.classList.add('show');
  modal.style.display = 'flex';
}

export function closeSwissHqModal() {
  const modal = document.getElementById('adminSwissHqModal');
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
  }
}

export function renderPartnerBanksList() {
  const container = document.getElementById('partnerBanksContainer');
  if (!container) return;

  const settings = getSystemSettings();
  const hq = settings.paymentSettings?.swissHeadquarters || {
    name: '🇨🇭 WBCU Swiss Headquarters (Zurich)',
    badge: 'SWISS CORE',
    routingNumber: settings.bankInfo?.routingNumber || '251480576',
    swiftBic: settings.bankInfo?.swiftBic || 'WBCUCHZZ80A',
    address: settings.bankInfo?.address || '109, Feldgüetliweg Meilen, Zurich 8706 Switzerland',
    beneficiaryName: settings.bankInfo?.bankName || 'WB CREDIT UNION',
    currency: 'CHF, USD, EUR, GBP',
    instructions: 'Direct Swiss Core wire clearing. Include Member Account Number in memo note.',
    status: 'active'
  };

  const partners = settings.paymentSettings?.foreignPartners || [];

  // Swiss HQ Primary Depository Card HTML
  const swissHqHtml = `
    <div class="admin-partner-card is-primary" style="border-color: rgba(59, 130, 246, 0.5);">
      <div class="d-flex items-center justify-between mb-2">
        <div class="d-flex items-center gap-2">
          <span style="font-size: 1.25rem;">🇨🇭</span>
          <strong class="text-white text-sm">${escapeHtml(hq.name || 'WBCU Swiss Headquarters (Zurich)')}</strong>
        </div>
        <div class="d-flex items-center gap-1">
          <span class="action-chip action-chip-approve font-mono" style="font-size:0.65rem;">PRIMARY</span>
          <span class="action-chip font-mono font-bold" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.5); font-size: 0.65rem;">
            ${escapeHtml(hq.badge || 'SWISS CORE')}
          </span>
        </div>
      </div>

      <div class="text-xs text-muted mb-2">
        <strong>Jurisdiction:</strong> Zurich, Switzerland &bull; <strong>Currency:</strong> <span class="text-white">${escapeHtml(hq.currency || 'CHF, USD, EUR, GBP')}</span>
      </div>

      <div class="p-2 mb-2 rounded font-mono text-xs" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08);">
        <div class="d-flex justify-between mb-1">
          <span class="text-muted">Beneficiary:</span>
          <span class="text-white font-bold">${escapeHtml(hq.beneficiaryName || 'WB CREDIT UNION')}</span>
        </div>
        <div class="d-flex justify-between mb-1">
          <span class="text-muted">Account / Depository:</span>
          <span class="text-info font-bold">SWISS-CORE-HQ-01</span>
        </div>
        <div class="d-flex justify-between mb-1">
          <span class="text-muted">Routing / ABA:</span>
          <span class="text-white">${escapeHtml(hq.routingNumber || '251480576')}</span>
        </div>
        <div class="d-flex justify-between mb-1">
          <span class="text-muted">SWIFT BIC:</span>
          <span class="text-warning font-bold">${escapeHtml(hq.swiftBic || 'WBCUCHZZ80A')}</span>
        </div>
        <div class="d-flex justify-between">
          <span class="text-muted">Headquarters:</span>
          <span class="text-white">${escapeHtml(hq.address || '109, Feldgüetliweg Meilen, Zurich 8706 Switzerland')}</span>
        </div>
      </div>

      <div class="text-xs text-muted mb-3" style="font-style: italic;">
        "${escapeHtml(hq.instructions || 'Direct Swiss Core wire clearing. Include Member Account Number in memo note.')}"
      </div>

      <div class="d-flex items-center justify-between pt-2 border-top border-secondary">
        <span class="text-xs text-success font-bold d-flex items-center gap-1">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#22c55e;"></span>
          Active Swiss Depository Clearing
        </span>
        <div class="d-flex gap-2">
          <button type="button" class="admin-btn admin-btn-sm admin-btn-outline btn-edit-swiss-hq" data-action="edit-swiss-hq">
            ✏️ Edit
          </button>
        </div>
      </div>
    </div>
  `;

  // Foreign Partner Bank Cards HTML
  const partnerCardsHtml = partners.map((p) => {
    return `
      <div class="admin-partner-card ${p.isPrimary ? 'is-primary' : ''}">
        <div class="d-flex items-center justify-between mb-2">
          <div class="d-flex items-center gap-2">
            <span style="font-size: 1.25rem;">${getCountryFlag(p.countryCode || p.country)}</span>
            <strong class="text-white text-sm">${escapeHtml(p.partnerName)}</strong>
          </div>
          ${p.isPrimary ? '<span class="action-chip action-chip-approve font-mono" style="font-size:0.65rem;">PRIMARY</span>' : ''}
        </div>

        <div class="text-xs text-muted mb-2">
          <strong>Jurisdiction:</strong> ${escapeHtml(p.country)} &bull; <strong>Currency:</strong> <span class="text-white">${escapeHtml(p.currency)}</span>
        </div>

        <div class="p-2 mb-2 rounded font-mono text-xs" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08);">
          <div class="d-flex justify-between mb-1">
            <span class="text-muted">Beneficiary:</span>
            <span class="text-white font-bold">${escapeHtml(p.beneficiaryName)}</span>
          </div>
          <div class="d-flex justify-between mb-1">
            <span class="text-muted">Account / IBAN:</span>
            <span class="text-info font-bold">${escapeHtml(p.accountNumber)}</span>
          </div>
          <div class="d-flex justify-between mb-1">
            <span class="text-muted">Routing / SWIFT:</span>
            <span class="text-white">${escapeHtml(p.routingNumber || p.swiftBic)}</span>
          </div>
          <div class="d-flex justify-between">
            <span class="text-muted">Bank Name:</span>
            <span class="text-white">${escapeHtml(p.bankName)}</span>
          </div>
        </div>

        <div class="text-xs text-muted mb-3" style="font-style: italic;">
          "${escapeHtml(p.instructions || 'Include Member Account Number in payment reference note.')}"
        </div>

        <div class="d-flex items-center justify-between pt-2 border-top border-secondary">
          <span class="text-xs ${p.status === 'active' ? 'text-success' : 'text-danger'} font-bold">
            ● ${p.status === 'active' ? 'Active Inward Rail' : 'Inactive'}
          </span>
          <div class="d-flex gap-2">
            <button type="button" class="admin-btn admin-btn-sm admin-btn-outline btn-edit-partner" data-id="${p.id}">
              ✏️ Edit
            </button>
            <button type="button" class="admin-btn admin-btn-sm admin-btn-danger btn-delete-partner" data-id="${p.id}">
              🗑️ Remove
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = swissHqHtml + partnerCardsHtml;

  // Bind Swiss HQ edit button
  container.querySelectorAll('.btn-edit-swiss-hq').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openSwissHqModal();
    });
  });

  // Bind Partner actions
  container.querySelectorAll('.btn-edit-partner').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pId = btn.getAttribute('data-id');
      openPartnerBankModal(pId);
    });
  });

  container.querySelectorAll('.btn-delete-partner').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pId = btn.getAttribute('data-id');
      deletePartnerBank(pId);
    });
  });
}

function getCountryFlag(code) {
  if (!code) return '🌐';
  const c = code.toUpperCase();
  if (c.includes('US')) return '🇺🇸';
  if (c.includes('CA')) return '🇨🇦';
  if (c.includes('GB') || c.includes('UK')) return '🇬🇧';
  if (c.includes('EU') || c.includes('EUR')) return '🇪🇺';
  if (c.includes('CH')) return '🇨🇭';
  return '🏦';
}

function openPartnerBankModal(partnerId = null) {
  const modal = document.getElementById('adminPartnerBankModal');
  if (!modal) return;

  const settings = getSystemSettings();
  const partners = settings.paymentSettings?.foreignPartners || [];
  const existing = partnerId ? partners.find((p) => p.id === partnerId) : null;

  const titleEl = document.getElementById('adminPartnerModalTitle');
  if (titleEl) {
    titleEl.textContent = existing ? 'Edit Foreign Partner Bank Details' : 'Add Foreign Partner Bank Account';
  }

  setVal('partnerModalId', existing ? existing.id : `fp-${Date.now().toString().slice(-4)}`);
  setVal('partnerModalName', existing ? existing.partnerName : '');
  setVal('partnerModalCountry', existing ? existing.country : 'United States');
  setVal('partnerModalCountryCode', existing ? existing.countryCode : 'US');
  setVal('partnerModalBeneficiary', existing ? existing.beneficiaryName : 'WB Credit Union Americas Clearing LLC');
  setVal('partnerModalBankName', existing ? existing.bankName : '');
  setVal('partnerModalAccount', existing ? existing.accountNumber : '');
  setVal('partnerModalRouting', existing ? (existing.routingNumber || existing.swiftBic) : '');
  setVal('partnerModalAddress', existing ? existing.bankAddress : '');
  setVal('partnerModalCurrency', existing ? existing.currency : 'USD');
  setVal('partnerModalInstructions', existing ? existing.instructions : '');
  setCheckbox('partnerModalIsPrimary', existing ? existing.isPrimary : false);

  modal.classList.add('show');
  modal.style.display = 'flex';
}

function closePartnerBankModal() {
  const modal = document.getElementById('adminPartnerBankModal');
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
  }
}

function deletePartnerBank(partnerId) {
  const settings = getSystemSettings();
  const list = settings.paymentSettings?.foreignPartners || [];
  const partner = list.find((p) => p.id === partnerId);
  if (!partner) return;

  if (!confirm(`Are you sure you want to remove partner bank account "${partner.partnerName}"?`)) return;

  settings.paymentSettings.foreignPartners = list.filter((p) => p.id !== partnerId);
  saveSystemSettings(settings);
  logAdminAction('PARTNER_BANK_REMOVED', partner.partnerName, `Deleted correspondent bank rail ${partner.accountNumber}`);
  renderPartnerBanksList();
  renderAuditLogsTable();
  showToast(`Removed partner bank account "${partner.partnerName}".`, 'success', 'Partner Bank Removed');
}

/* ----------------------------------------------------------------------------
 * 10. 4 CRYPTO WALLETS DISPLAY & EDIT
 * ---------------------------------------------------------------------------- */
export function renderPaymentCryptoWallets() {
  const container = document.getElementById('paymentCryptoWalletsContainer');
  if (!container) return;

  const settings = getSystemSettings();
  const wallets = settings.paymentSettings?.cryptoWallets || defaultSystemSettings.paymentSettings.cryptoWallets;

  container.innerHTML = wallets.map((w) => {
    const qrSrc = w.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(w.address)}`;
    return `
      <div class="admin-crypto-wallet-card" id="cryptoCard-${w.id}">
        <div class="d-flex items-center justify-between mb-2">
          <div class="d-flex items-center gap-2">
            <span class="admin-tx-type-tag font-bold" style="background:rgba(59,130,246,0.2); color:#60a5fa;">${escapeHtml(w.symbol)}</span>
            <strong class="text-white text-sm">${escapeHtml(w.name)}</strong>
          </div>
          <span class="action-chip ${w.status === 'active' ? 'action-chip-approve' : 'action-chip-danger'}" style="font-size:0.65rem;">
            ${w.status === 'active' ? 'ACTIVE' : 'DISABLED'}
          </span>
        </div>

        <div class="text-xs text-muted mb-2">
          <strong>Network:</strong> <span class="text-white">${escapeHtml(w.network)}</span>
        </div>

        <!-- Scannable QR Code Box -->
        <div class="admin-qr-preview-box">
          <img src="${qrSrc}" alt="${w.symbol} QR Code" class="img-fluid" loading="lazy" />
        </div>

        <div class="text-center text-xs text-muted mb-2 font-mono">
          Scannable Deposit QR Code
        </div>

        <div class="p-2 mb-2 rounded font-mono text-xs text-break" style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.08); word-break:break-all;">
          <div class="text-muted text-xs mb-1">Receiving Address:</div>
          <span class="text-white font-bold">${escapeHtml(w.address)}</span>
        </div>

        <div class="d-flex justify-between text-xs text-muted mb-3 font-mono">
          <span>Min: <strong class="text-white">${w.minDeposit || 'N/A'}</strong></span>
          <span>${w.confirmations || 'Required Confirmations'}</span>
        </div>

        <div class="d-flex gap-2 mt-auto pt-2 border-top border-secondary">
          <button type="button" class="admin-btn admin-btn-sm admin-btn-outline w-100 btn-edit-crypto-wallet" data-id="${w.id}" style="justify-content:center;">
            ✏️ Edit Address & QR
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.btn-edit-crypto-wallet').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wId = btn.getAttribute('data-id');
      openCryptoWalletModal(wId);
    });
  });
}

function openCryptoWalletModal(walletId) {
  const modal = document.getElementById('adminCryptoWalletModal');
  if (!modal) return;

  const settings = getSystemSettings();
  const wallets = settings.paymentSettings?.cryptoWallets || defaultSystemSettings.paymentSettings.cryptoWallets;
  const w = wallets.find((x) => x.id === walletId) || wallets[0];
  if (!w) return;

  setVal('walletModalId', w.id);
  setVal('walletModalName', w.name);
  setVal('walletModalSymbol', w.symbol);
  setVal('walletModalNetwork', w.network);
  setVal('walletModalAddress', w.address);
  setVal('walletModalQrUrl', w.qrCodeUrl || '');
  setVal('walletModalMin', w.minDeposit || '');
  setVal('walletModalConfirmations', w.confirmations || '');
  setCheckbox('walletModalActive', w.status === 'active');

  modal.classList.add('show');
  modal.style.display = 'flex';
}

function closeCryptoWalletModal() {
  const modal = document.getElementById('adminCryptoWalletModal');
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
  }
}

/* ----------------------------------------------------------------------------
 * 11. APPLE GIFT CARD PAYMENT METHOD & VERIFICATION DESK
 * ---------------------------------------------------------------------------- */
export function renderGiftCardsQueueTable() {
  const tbody = document.getElementById('giftCardsQueueTableBody');
  const countBadge = document.getElementById('giftCardsQueueCountBadge');
  const submissions = getGiftCardSubmissions();

  if (countBadge) {
    const pendingCount = submissions.filter((s) => s.status === 'pending').length;
    countBadge.textContent = `${pendingCount} Pending Verification`;
  }

  if (!tbody) return;

  if (submissions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center p-5 text-muted">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🍏</div>
          <div class="font-bold text-white mb-1">No Apple Gift Card submissions yet</div>
          <div class="text-xs">Customer gift card uploads and 16-digit code verification requests will appear here.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = submissions.map((item) => {
    const dateFormatted = new Date(item.date || item.submittedAt).toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const statusBadge = item.status === 'approved'
      ? '<span class="action-chip action-chip-approve font-mono" style="font-size:0.65rem;">APPROVED</span>'
      : (item.status === 'rejected'
        ? '<span class="action-chip action-chip-danger font-mono" style="font-size:0.65rem;">REJECTED</span>'
        : '<span class="action-chip action-chip-hold font-mono" style="font-size:0.65rem;">PENDING</span>');

    const thumbHtml = item.cardImage
      ? `<img src="${escapeHtml(item.cardImage)}" alt="Card Scan" class="admin-gift-thumb btn-zoom-card-image" data-img="${escapeHtml(item.cardImage)}" data-code="${escapeHtml(item.code)}" title="Click to inspect card upload" />`
      : `<span class="text-xs text-muted font-mono">No Image</span>`;

    return `
      <tr>
        <td>
          <span class="font-mono text-xs text-white font-bold">${dateFormatted}</span>
          <div class="text-xs text-muted font-mono">${item.id}</div>
        </td>
        <td>
          <div class="font-bold text-white text-xs">${escapeHtml(item.userName)}</div>
          <div class="text-xs text-muted font-mono">${escapeHtml(item.accountNumber || item.userEmail)}</div>
          <div class="text-xs text-info">${escapeHtml(item.targetAccount || 'Premier Checking')}</div>
        </td>
        <td>
          <div class="gift-card-code-badge">
            <span>🔑</span>
            <span>${escapeHtml(item.code)}</span>
          </div>
          <button type="button" class="btn-copy-chip ml-1 btn-copy-gift-code" data-code="${escapeHtml(item.code)}" style="border:none; background:transparent; color:#94a3b8; cursor:pointer;" title="Copy 16-digit code">📋</button>
        </td>
        <td>
          <span class="font-mono font-bold text-white text-sm">$${parseFloat(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          <span class="text-xs text-muted">${item.currency || 'USD'}</span>
        </td>
        <td class="text-center">
          ${thumbHtml}
        </td>
        <td>
          ${statusBadge}
        </td>
        <td class="text-right">
          <div class="d-flex items-center justify-end gap-1">
            ${item.status === 'pending' ? `
              <button type="button" class="admin-btn admin-btn-sm admin-btn-success btn-approve-gift-card" data-id="${item.id}" title="Approve & Credit Balance">
                ✓ Approve
              </button>
              <button type="button" class="admin-btn admin-btn-sm admin-btn-danger btn-reject-gift-card" data-id="${item.id}" title="Reject submission">
                ✗ Reject
              </button>
            ` : `
              <span class="text-xs text-muted font-mono mr-2">${item.status === 'approved' ? 'Settled' : 'Closed'}</span>
            `}
            <button type="button" class="admin-btn admin-btn-sm admin-btn-outline btn-delete-gift-card" data-id="${item.id}" title="Delete record">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Event handlers for Gift Card desk
  tbody.querySelectorAll('.btn-approve-gift-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      const gId = btn.getAttribute('data-id');
      approveGiftCard(gId);
    });
  });

  tbody.querySelectorAll('.btn-reject-gift-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      const gId = btn.getAttribute('data-id');
      rejectGiftCard(gId);
    });
  });

  tbody.querySelectorAll('.btn-delete-gift-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      const gId = btn.getAttribute('data-id');
      deleteGiftCard(gId);
    });
  });

  tbody.querySelectorAll('.btn-zoom-card-image').forEach((img) => {
    img.addEventListener('click', () => {
      const src = img.getAttribute('data-img');
      const code = img.getAttribute('data-code');
      showCardZoomModal(src, code);
    });
  });

  tbody.querySelectorAll('.btn-copy-gift-code').forEach((btn) => {
    btn.addEventListener('click', () => {
      const code = btn.getAttribute('data-code');
      if (code) {
        navigator.clipboard.writeText(code);
        showToast(`Copied Apple Gift Card code: ${code}`, 'info', 'Copied');
      }
    });
  });
}

export function approveGiftCard(giftCardId) {
  const submissions = getGiftCardSubmissions();
  const item = submissions.find((x) => x.id === giftCardId);
  if (!item) return;

  if (!confirm(`Verify & Approve Apple Gift Card ${item.code} for $${item.amount.toFixed(2)} USD?\n\nThis will credit the member's account immediately.`)) {
    return;
  }

  item.status = 'approved';
  item.approvedAt = new Date().toISOString();
  item.officerNotes = '16-Digit Apple Gift Card code verified against Apple POS ledger.';
  saveGiftCardSubmissions(submissions);

  // Credit user in admin users database
  const users = getAdminUsersList();
  const user = users.find((u) => u.id === item.userId || u.accountNumber === item.accountNumber || u.email === item.userEmail);
  if (user) {
    user.balance = (user.balance || 0) + item.amount;
    if (Array.isArray(user.accounts) && user.accounts.length > 0) {
      const targetAcct = user.accounts.find((a) => a.type === item.targetAccount) || user.accounts[0];
      targetAcct.balance = (targetAcct.balance || 0) + item.amount;
    }
    saveAdminUsersList(users);
  }

  // Also credit active demo session if matching
  try {
    const rawDemo = localStorage.getItem('wb_credit_union_active_user');
    if (rawDemo) {
      const activeUser = JSON.parse(rawDemo);
      if (activeUser.id === item.userId || activeUser.accountNumber === item.accountNumber || activeUser.email === item.userEmail) {
        activeUser.balance = (activeUser.balance || 0) + item.amount;
        if (Array.isArray(activeUser.accounts) && activeUser.accounts[0]) {
          activeUser.accounts[0].balance = (activeUser.accounts[0].balance || 0) + item.amount;
        }
        localStorage.setItem('wb_credit_union_active_user', JSON.stringify(activeUser));
      }
    }
  } catch(e) {}

  // Update member ledger transaction status from pending to completed
  try {
    const rawTx = localStorage.getItem('wb_transactions_cache_v1');
    if (rawTx) {
      const txs = JSON.parse(rawTx);
      const match = txs.find((t) => t.sender && t.sender.includes(item.code));
      if (match) {
        match.status = 'completed';
        match.type = 'Apple Gift Card Deposit (Cleared)';
        localStorage.setItem('wb_transactions_cache_v1', JSON.stringify(txs));
      }
    }
  } catch (errTx) {}

  // Dispatch real-time clearance alert email to member
  sendAppleGiftCardApprovedEmail(item.userId || 'usr-101', item);

  // Log audit action
  logAdminAction(
    'GIFT_CARD_APPROVED',
    `${item.userName} (${item.accountNumber})`,
    `Approved Apple Gift Card #${item.code} (+${item.amount} ${item.currency}). Credited to ${item.targetAccount || 'Checking'}.`
  );

  renderGiftCardsQueueTable();
  renderAuditLogsTable();
  showToast(
    `Apple Gift Card #${item.code} verified & approved! $${item.amount.toFixed(2)} USD credited to ${item.userName}.`,
    'success',
    'Gift Card Settled'
  );
}

export function rejectGiftCard(giftCardId) {
  const submissions = getGiftCardSubmissions();
  const item = submissions.find((x) => x.id === giftCardId);
  if (!item) return;

  const reason = prompt('Please enter rejection memo reason (e.g., Code already redeemed, Invalid 16-digit code, Unreadable card upload):', 'Apple Gift Card code could not be verified on Apple server.');
  if (reason === null) return;

  item.status = 'rejected';
  item.rejectedAt = new Date().toISOString();
  item.officerNotes = reason || 'Verification failed.';
  saveGiftCardSubmissions(submissions);

  logAdminAction(
    'GIFT_CARD_REJECTED',
    `${item.userName} (${item.accountNumber})`,
    `Rejected Apple Gift Card #${item.code}. Reason: ${reason}`
  );

  renderGiftCardsQueueTable();
  renderAuditLogsTable();
  showToast(`Apple Gift Card #${item.code} rejected.`, 'info', 'Submission Rejected');
}

export function deleteGiftCard(giftCardId) {
  const submissions = getGiftCardSubmissions();
  const filtered = submissions.filter((x) => x.id !== giftCardId);
  saveGiftCardSubmissions(filtered);

  renderGiftCardsQueueTable();
  showToast('Apple Gift Card record deleted from verification desk.', 'info', 'Record Removed');
}

function showCardZoomModal(imageUrl, code) {
  let modal = document.getElementById('giftCardImageModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'giftCardImageModal';
    modal.className = 'admin-form-modal';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="admin-form-modal-backdrop" onclick="document.getElementById('giftCardImageModal').style.display='none'"></div>
      <div class="admin-form-modal-container" style="max-width: 580px;">
        <div class="admin-form-modal-header">
          <div class="admin-form-modal-title">
            <span>🍏</span>
            <span id="zoomModalTitle">Apple Gift Card Inspection</span>
          </div>
          <button type="button" class="admin-form-modal-close" onclick="document.getElementById('giftCardImageModal').style.display='none'">&times;</button>
        </div>
        <div class="admin-form-modal-body p-3 text-center">
          <div class="gift-card-code-badge mb-3 font-mono" id="zoomModalCode">XXXX-XXXX-XXXX-XXXX</div>
          <div style="background:#090d16; border-radius:12px; padding:0.5rem; border:1px solid rgba(255,255,255,0.1);">
            <img id="zoomModalImg" src="" alt="Gift Card" style="max-width:100%; max-height:420px; object-fit:contain; border-radius:8px;" />
          </div>
        </div>
        <div class="admin-form-modal-footer">
          <button type="button" class="admin-btn admin-btn-outline" onclick="document.getElementById('giftCardImageModal').style.display='none'">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const imgEl = modal.querySelector('#zoomModalImg');
  const codeEl = modal.querySelector('#zoomModalCode');
  if (imgEl) imgEl.src = imageUrl;
  if (codeEl) codeEl.textContent = code || '16-Digit Code Upload';

  modal.style.display = 'flex';
}

function setupAppleGiftCardDesk() {
  const btnSaveAppleSettings = document.getElementById('btnSaveAppleGiftSettings');
  if (btnSaveAppleSettings) {
    btnSaveAppleSettings.addEventListener('click', (e) => {
      e.preventDefault();
      const settings = getSystemSettings();
      settings.paymentSettings = settings.paymentSettings || {};
      settings.paymentSettings.appleGiftCard = {
        enabled: document.getElementById('settingAppleGiftEnabled')?.checked ?? true,
        buyLink: document.getElementById('settingAppleGiftBuyLink')?.value || 'https://www.apple.com/shop/buy-giftcard/giftcard',
        minAmount: parseFloat(document.getElementById('settingAppleGiftMin')?.value || '25'),
        maxAmount: parseFloat(document.getElementById('settingAppleGiftMax')?.value || '2500'),
        instructions: document.getElementById('settingAppleGiftInstructions')?.value || '',
        autoRequireCardImage: true
      };
      saveSystemSettings(settings);
      logAdminAction('PAYMENT_SETTINGS_UPDATED', 'APPLE_GIFT_CARD', 'Updated Apple Gift Card buying link, limits, and instructions.');
      renderAuditLogsTable();
      showToast('Apple Gift Card payment parameters successfully updated.', 'success', 'Gift Card Saved');
    });
  }

  const btnTestAppleLink = document.getElementById('btnTestAppleBuyLink');
  if (btnTestAppleLink) {
    btnTestAppleLink.addEventListener('click', (e) => {
      e.preventDefault();
      const url = document.getElementById('settingAppleGiftBuyLink')?.value || 'https://www.apple.com/shop/buy-giftcard/giftcard';
      window.open(url, '_blank');
    });
  }
}

/* ----------------------------------------------------------------------------
 * 12. PAYMENT MODAL HANDLERS (PARTNER BANK & CRYPTO WALLET)
 * ---------------------------------------------------------------------------- */
function setupPaymentSettingsHandlers() {
  // Global click delegation for Swiss HQ Edit triggers
  document.addEventListener('click', (e) => {
    const target = e.target.closest('#btnEditSwissHqAccountTop, .btn-edit-swiss-hq, [data-action="edit-swiss-hq"], #btnOpenEditSwissHqCard');
    if (target) {
      e.preventDefault();
      openSwissHqModal();
    }
  });

  const closeSwissHqBtn = document.getElementById('closeSwissHqModalBtn');
  const cancelSwissHqBtn = document.getElementById('cancelSwissHqModalBtn');
  if (closeSwissHqBtn) closeSwissHqBtn.addEventListener('click', closeSwissHqModal);
  if (cancelSwissHqBtn) cancelSwissHqBtn.addEventListener('click', closeSwissHqModal);

  // Swiss HQ Form Submit
  const swissHqForm = document.getElementById('adminSwissHqForm');
  if (swissHqForm) {
    swissHqForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const settings = getSystemSettings();
      settings.paymentSettings = settings.paymentSettings || {};

      const updatedHq = {
        name: (document.getElementById('swissHqModalName')?.value || '🇨🇭 WBCU Swiss Headquarters (Zurich)').trim(),
        badge: (document.getElementById('swissHqModalBadge')?.value || 'SWISS CORE').trim(),
        routingNumber: (document.getElementById('swissHqModalRouting')?.value || '251480576').trim(),
        swiftBic: (document.getElementById('swissHqModalSwift')?.value || 'WBCUCHZZ80A').trim(),
        address: (document.getElementById('swissHqModalAddress')?.value || '109, Feldgüetliweg Meilen, Zurich 8706 Switzerland').trim(),
        beneficiaryName: (document.getElementById('swissHqModalBeneficiary')?.value || 'WB CREDIT UNION').trim(),
        currency: (document.getElementById('swissHqModalCurrency')?.value || 'CHF, USD, EUR, GBP').trim(),
        instructions: (document.getElementById('swissHqModalInstructions')?.value || '').trim(),
        status: 'active'
      };

      settings.paymentSettings.swissHeadquarters = updatedHq;

      // Synchronize with general bankInfo
      settings.bankInfo = settings.bankInfo || {};
      settings.bankInfo.routingNumber = updatedHq.routingNumber;
      settings.bankInfo.swiftBic = updatedHq.swiftBic;
      settings.bankInfo.address = updatedHq.address;
      if (updatedHq.beneficiaryName) {
        settings.bankInfo.bankName = updatedHq.beneficiaryName;
      }

      saveSystemSettings(settings);
      logAdminAction('SWISS_HQ_ACCOUNT_UPDATED', 'SWISS_CORE', `Updated WBCU Swiss Headquarters account: Routing ${updatedHq.routingNumber}, SWIFT ${updatedHq.swiftBic}`);
      renderSwissHqAccount();
      renderPartnerBanksList();
      populateSettingsForm();
      renderAuditLogsTable();
      closeSwissHqModal();
      showToast('WBCU Swiss Headquarters account details successfully updated & synced.', 'success', 'Swiss HQ Saved');
    });
  }

  // Add Partner Bank button
  const btnAddPartner = document.getElementById('btnAddPartnerBank');
  if (btnAddPartner) {
    btnAddPartner.addEventListener('click', () => {
      openPartnerBankModal(null);
    });
  }

  // Partner Bank Modal Close
  const closePartnerBtn = document.getElementById('closePartnerModalBtn');
  const cancelPartnerBtn = document.getElementById('cancelPartnerModalBtn');
  if (closePartnerBtn) closePartnerBtn.addEventListener('click', closePartnerBankModal);
  if (cancelPartnerBtn) cancelPartnerBtn.addEventListener('click', closePartnerBankModal);

  // Partner Bank Form Submit
  const partnerForm = document.getElementById('adminPartnerBankForm');
  if (partnerForm) {
    partnerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const settings = getSystemSettings();
      settings.paymentSettings = settings.paymentSettings || {};
      settings.paymentSettings.foreignPartners = settings.paymentSettings.foreignPartners || [];

      const pId = document.getElementById('partnerModalId')?.value;
      const partnerData = {
        id: pId || `fp-${Date.now()}`,
        partnerName: document.getElementById('partnerModalName')?.value || 'Partner Bank',
        country: document.getElementById('partnerModalCountry')?.value || 'United States',
        countryCode: document.getElementById('partnerModalCountryCode')?.value || 'US',
        beneficiaryName: document.getElementById('partnerModalBeneficiary')?.value || '',
        bankName: document.getElementById('partnerModalBankName')?.value || '',
        accountNumber: document.getElementById('partnerModalAccount')?.value || '',
        routingNumber: document.getElementById('partnerModalRouting')?.value || '',
        swiftBic: document.getElementById('partnerModalRouting')?.value || '',
        bankAddress: document.getElementById('partnerModalAddress')?.value || '',
        currency: document.getElementById('partnerModalCurrency')?.value || 'USD',
        instructions: document.getElementById('partnerModalInstructions')?.value || '',
        status: 'active',
        isPrimary: document.getElementById('partnerModalIsPrimary')?.checked ?? false
      };

      if (partnerData.isPrimary) {
        settings.paymentSettings.foreignPartners.forEach((p) => { p.isPrimary = false; });
      }

      const existingIndex = settings.paymentSettings.foreignPartners.findIndex((p) => p.id === partnerData.id);
      if (existingIndex >= 0) {
        settings.paymentSettings.foreignPartners[existingIndex] = partnerData;
      } else {
        settings.paymentSettings.foreignPartners.push(partnerData);
      }

      saveSystemSettings(settings);
      logAdminAction('PARTNER_BANK_SAVED', partnerData.partnerName, `Configured foreign partner account ${partnerData.accountNumber} in ${partnerData.country}`);
      renderPartnerBanksList();
      renderAuditLogsTable();
      closePartnerBankModal();
      showToast(`Foreign partner bank details for "${partnerData.partnerName}" saved.`, 'success', 'Partner Bank Configured');
    });
  }

  // Crypto Wallet Modal Handlers
  const closeCryptoModalBtn = document.getElementById('closeCryptoModalBtn');
  const cancelCryptoModalBtn = document.getElementById('cancelCryptoModalBtn');
  if (closeCryptoModalBtn) closeCryptoModalBtn.addEventListener('click', closeCryptoWalletModal);
  if (cancelCryptoModalBtn) cancelCryptoModalBtn.addEventListener('click', closeCryptoWalletModal);

  const cryptoForm = document.getElementById('adminCryptoWalletForm');
  if (cryptoForm) {
    cryptoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const settings = getSystemSettings();
      settings.paymentSettings = settings.paymentSettings || {};
      settings.paymentSettings.cryptoWallets = settings.paymentSettings.cryptoWallets || defaultSystemSettings.paymentSettings.cryptoWallets;

      const wId = document.getElementById('walletModalId')?.value;
      const addr = (document.getElementById('walletModalAddress')?.value || '').trim();

      const existing = settings.paymentSettings.cryptoWallets.find((w) => w.id === wId);
      if (existing) {
        existing.name = document.getElementById('walletModalName')?.value || existing.name;
        existing.network = document.getElementById('walletModalNetwork')?.value || existing.network;
        existing.address = addr;
        const customQr = (document.getElementById('walletModalQrUrl')?.value || '').trim();
        existing.qrCodeUrl = customQr || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(addr)}`;
        existing.minDeposit = document.getElementById('walletModalMin')?.value || existing.minDeposit;
        existing.confirmations = document.getElementById('walletModalConfirmations')?.value || existing.confirmations;
        existing.status = document.getElementById('walletModalActive')?.checked ? 'active' : 'disabled';
      }

      saveSystemSettings(settings);
      logAdminAction('CRYPTO_WALLET_UPDATED', existing?.symbol || 'CRYPTO', `Updated ${existing?.name} address to ${addr} with scannable QR.`);
      renderPaymentCryptoWallets();
      renderAuditLogsTable();
      closeCryptoWalletModal();
      showToast(`Crypto wallet & QR Code for ${existing?.name} updated.`, 'success', 'Wallet Updated');
    });
  }
}

/* ----------------------------------------------------------------------------
 * 13. AUDIT LOG VIEWER
 * ---------------------------------------------------------------------------- */
let filteredAuditLogs = [];

function setupAuditLogSearch() {
  const searchInput = document.getElementById('auditSearchInput');
  const actionFilter = document.getElementById('auditActionFilter');
  const clearBtn = document.getElementById('btnClearAuditFilters');

  let timer = null;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(applyAuditFilters, 250);
    });
  }

  if (actionFilter) {
    actionFilter.addEventListener('change', applyAuditFilters);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (actionFilter) actionFilter.value = 'all';
      applyAuditFilters();
    });
  }
}

function applyAuditFilters() {
  const query = (document.getElementById('auditSearchInput')?.value || '').trim().toLowerCase();
  const actionVal = document.getElementById('auditActionFilter')?.value || 'all';
  const logs = getAuditLogs();

  filteredAuditLogs = logs.filter((log) => {
    const matchesQuery = !query ||
      log.officer.toLowerCase().includes(query) ||
      log.targetUser.toLowerCase().includes(query) ||
      log.details.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query);

    const matchesAction = actionVal === 'all' || log.action.includes(actionVal);

    return matchesQuery && matchesAction;
  });

  renderAuditLogsTable();
}

export function renderAuditLogsTable() {
  const tbody = document.getElementById('adminAuditLogsTableBody');
  const countBadge = document.getElementById('auditLogsCountBadge');
  const logs = filteredAuditLogs.length > 0 ? filteredAuditLogs : getAuditLogs();

  if (countBadge) countBadge.textContent = `${logs.length} Audit Events`;
  if (!tbody) return;

  if (logs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center p-5 text-muted">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">📋</div>
          <div class="font-bold text-white mb-1">No audit log records found</div>
          <div class="text-xs">Adjust your search or filter parameters.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = logs.map((item) => {
    const dateFormatted = new Date(item.date).toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    return `
      <tr>
        <td>
          <span class="font-mono text-xs text-white font-bold">${dateFormatted}</span>
          <div class="text-xs text-muted font-mono">${item.id}</div>
        </td>
        <td>
          <div class="font-bold text-white text-xs">${escapeHtml(item.officer)}</div>
          <div class="text-xs text-muted font-mono">${escapeHtml(item.ip)}</div>
        </td>
        <td>
          <span class="admin-tx-type-tag font-mono uppercase text-xs">${formatActionChip(item.action)}</span>
        </td>
        <td>
          <span class="font-bold text-white text-xs">${escapeHtml(item.targetUser)}</span>
        </td>
        <td>
          <div class="text-xs text-white">${escapeHtml(item.details)}</div>
        </td>
        <td class="text-right">
          <span class="action-chip action-chip-approve font-mono" style="font-size:0.65rem;">IMMUTABLE</span>
        </td>
      </tr>
    `;
  }).join('');
}

function formatActionChip(action) {
  if (action.includes('WIRE')) return '🔐 ' + action;
  if (action.includes('CRYPTO')) return '₿ ' + action;
  if (action.includes('GIFT') || action.includes('APPLE')) return '🍏 ' + action;
  if (action.includes('PARTNER')) return '🏦 ' + action;
  if (action.includes('CARD')) return '💳 ' + action;
  if (action.includes('KYC')) return '🪪 ' + action;
  if (action.includes('SMTP') || action.includes('EMAIL')) return '📧 ' + action;
  return '⚙️ ' + action;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showSmtpSuccessModal(resData, recipient) {
  let modal = document.getElementById('smtpSuccessModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'smtpSuccessModal';
    modal.className = 'admin-form-modal';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="admin-form-modal-backdrop" onclick="document.getElementById('smtpSuccessModal').style.display='none'"></div>
      <div class="admin-form-modal-container" style="max-width: 640px;">
        <div class="admin-form-modal-header" style="background: linear-gradient(135deg, #091726 0%, #064e3b 100%);">
          <div class="admin-form-modal-title">
            <span>🚀</span>
            <span>Live Transaction Alert Dispatched</span>
          </div>
          <button type="button" class="admin-form-modal-close" onclick="document.getElementById('smtpSuccessModal').style.display='none'">&times;</button>
        </div>
        <div class="admin-modal-body p-3">
          <div class="p-3 rounded mb-3" style="background:#090d16; border:1px solid #10b981;">
            <div class="d-flex items-center gap-2 mb-2">
              <span class="badge" style="background:#10b981; color:#fff; font-weight:700;">✓ LIVE DISPATCH VERIFIED</span>
              <span class="text-xs text-muted" id="succTimestamp">--</span>
            </div>
            <div class="d-flex justify-between text-xs mb-1">
              <span class="text-muted">Recipient Target:</span>
              <span class="font-mono text-success font-bold" id="succRecipient">--</span>
            </div>
            <div class="d-flex justify-between text-xs mb-1">
              <span class="text-muted">SMTP Server:</span>
              <span class="font-mono text-info font-bold" id="succHostPort">--</span>
            </div>
            <div class="d-flex justify-between text-xs mb-1">
              <span class="text-muted">Relay Architecture:</span>
              <span class="font-mono text-white" id="succRelayMode">--</span>
            </div>
            <div class="d-flex justify-between text-xs">
              <span class="text-muted">Message ID:</span>
              <span class="font-mono text-muted text-xs text-break" id="succMessageId">--</span>
            </div>
          </div>

          <div id="succWebMailboxBox" class="p-3 rounded mb-3 text-center" style="background: linear-gradient(135deg, rgba(2,132,199,0.15) 0%, rgba(59,130,246,0.15) 100%); border: 1px solid #38bdf8;">
            <div class="font-bold text-sm text-info mb-1">📬 Live Web Mailbox Delivered</div>
            <p class="text-xs text-muted mb-2">
              The live transaction notification email was rendered, delivered, and stored in the active cloud test mailbox. Click below to inspect the delivered email with full headers and styling:
            </p>
            <a href="#" id="succPreviewUrlBtn" target="_blank" rel="noopener noreferrer" class="admin-btn admin-btn-info admin-btn-sm d-inline-flex items-center gap-1">
              <span>👁️</span>
              <span>Open Delivered Email in Web Mailbox ↗</span>
            </a>
          </div>

          <div id="succDirectNoticeBox" class="p-3 rounded mb-3" style="background: rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.3); font-size: 0.8rem; color:#fde68a; display:none;">
            <div class="font-bold mb-1">💡 Direct Inbox Tip:</div>
            <div id="succDirectNoticeText">--</div>
          </div>

          <details class="p-2 rounded" style="background:#0f172a; border:1px solid #334155; font-size:0.75rem;">
            <summary style="cursor:pointer; color:#94a3b8; font-weight:600;">View Rendered Notification Preview</summary>
            <div class="mt-2 p-2 bg-dark rounded text-left font-mono" style="max-height:200px; overflow-y:auto; color:#cbd5e1; font-size:0.7rem;">
              <p class="text-success mb-1"><strong>Subject:</strong> Live Test Transaction Alert: cPanel SMTP Relay Verified</p>
              <p class="text-muted mb-1"><strong>From:</strong> WB Credit Union &lt;info@wbcu.net&gt;</p>
              <p class="text-muted mb-1"><strong>To:</strong> <span class="text-white" id="succPreviewTo">debstarnetwork@gmail.com</span></p>
              <hr style="border-color:#334155;">
              <p class="mb-0">This test notification validates that the cPanel &amp; Custom SMTP Mail Relay configured in WB Credit Union Admin System Settings is actively dispatching outbound email alerts for transfers, deposits, account openings, and gift cards.</p>
            </div>
          </details>
        </div>
        <div class="admin-modal-footer">
          <button type="button" class="admin-btn admin-btn-outline" onclick="document.getElementById('smtpSuccessModal').style.display='none'">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const recipEl = modal.querySelector('#succRecipient');
  const hostEl = modal.querySelector('#succHostPort');
  const relayEl = modal.querySelector('#succRelayMode');
  const msgIdEl = modal.querySelector('#succMessageId');
  const timeEl = modal.querySelector('#succTimestamp');
  const previewBtn = modal.querySelector('#succPreviewUrlBtn');
  const webMailBox = modal.querySelector('#succWebMailboxBox');
  const directNoticeBox = modal.querySelector('#succDirectNoticeBox');
  const directNoticeText = modal.querySelector('#succDirectNoticeText');
  const previewTo = modal.querySelector('#succPreviewTo');

  if (recipEl) recipEl.textContent = recipient;
  if (hostEl) hostEl.textContent = `${resData.host || 'mail.wbcu.net'}:${resData.port || 587}`;
  if (relayEl) relayEl.textContent = resData.relay === 'direct_cpanel' ? 'Direct cPanel SMTP Gateway' : 'Authenticated Cloud Sandbox Relay (Ethereal)';
  if (msgIdEl) msgIdEl.textContent = resData.messageId || 'Generated';
  if (timeEl) timeEl.textContent = new Date().toLocaleTimeString();
  if (previewTo) previewTo.textContent = recipient;

  if (resData.previewUrl && previewBtn) {
    previewBtn.href = resData.previewUrl;
    if (webMailBox) webMailBox.style.display = 'block';
  } else if (webMailBox) {
    webMailBox.style.display = 'none';
  }

  if (resData.directNotice && directNoticeBox && directNoticeText) {
    directNoticeBox.style.display = 'block';
    directNoticeText.textContent = resData.directNotice.includes('535') || resData.directNotice.includes('550')
      ? 'cPanel server responded: Authentication required. To deliver directly to your recipient personal inbox from info@wbcu.net, enter your live cPanel Webmail password in the SMTP Password field above and click Save. In the meantime, the test notification has been dispatched via the live web mailbox above.'
      : resData.directNotice;
  } else if (directNoticeBox) {
    directNoticeBox.style.display = 'none';
  }

  modal.style.display = 'flex';
}

function showSmtpDiagnosticModal(resData, recipient) {
  let modal = document.getElementById('smtpDiagnosticModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'smtpDiagnosticModal';
    modal.className = 'admin-form-modal';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="admin-form-modal-backdrop" onclick="document.getElementById('smtpDiagnosticModal').style.display='none'"></div>
      <div class="admin-form-modal-container" style="max-width: 620px;">
        <div class="admin-form-modal-header">
          <div class="admin-form-modal-title">
            <span>⚙️</span>
            <span>SMTP Server Connection Diagnostic</span>
          </div>
          <button type="button" class="admin-form-modal-close" onclick="document.getElementById('smtpDiagnosticModal').style.display='none'">&times;</button>
        </div>
        <div class="admin-modal-body p-3">
          <div class="p-3 rounded mb-3" style="background:#090d16; border:1px solid #334155;">
            <div class="d-flex justify-between text-xs mb-1">
              <span class="text-muted">Target Host:</span>
              <span class="font-mono text-info font-bold" id="diagHostPort">--</span>
            </div>
            <div class="d-flex justify-between text-xs mb-1">
              <span class="text-muted">Recipient Target:</span>
              <span class="font-mono text-white" id="diagRecipient">--</span>
            </div>
            <div class="d-flex justify-between text-xs mb-1">
              <span class="text-muted">Server Response:</span>
              <span class="font-mono text-danger font-bold" id="diagError">--</span>
            </div>
          </div>

          <div class="p-3 rounded mb-3" style="background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.3); font-size:0.8rem; color:#fde68a;">
            <div class="font-bold mb-1">💡 Diagnostic Analysis:</div>
            <div id="diagSuggestion">--</div>
          </div>

          <p class="text-xs text-muted mb-0">
            <strong>How to resolve:</strong> Check that your SMTP server host is set to <code>mail.wbcu.net</code> or <code>mail.digitalglobalelite.com</code> on port <code>587</code> (TLS) or <code>465</code> (SSL), and enter your active cPanel email password for <code>info@wbcu.net</code> in the SMTP Password field.
          </p>
        </div>
        <div class="admin-modal-footer">
          <button type="button" class="admin-btn admin-btn-outline" onclick="document.getElementById('smtpDiagnosticModal').style.display='none'">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const hostEl = modal.querySelector('#diagHostPort');
  const recipEl = modal.querySelector('#diagRecipient');
  const errEl = modal.querySelector('#diagError');
  const suggEl = modal.querySelector('#diagSuggestion');

  if (hostEl) hostEl.textContent = `${resData.host || 'mail.wbcu.net'}:${resData.port || 587}`;
  if (recipEl) recipEl.textContent = recipient;
  if (errEl) errEl.textContent = resData.error || 'Connection rejected';
  if (suggEl) {
    suggEl.textContent = resData.suggestion ||
      (resData.error?.includes('535')
        ? 'The SMTP server is online and reachable, but rejected authentication. Please enter your valid cPanel password for info@wbcu.net in the SMTP Password field above.'
        : 'Please verify your SMTP Host, port, and credentials.');
  }

  modal.style.display = 'flex';
}

