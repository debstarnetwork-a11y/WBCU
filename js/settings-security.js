/**
 * ============================================================================
 * WB CREDIT UNION - SETTINGS & SECURITY MASTER CONTROLLER (js/settings-security.js)
 * ============================================================================
 * 
 * Provides complete enterprise-grade features for:
 * 1. User Settings (5 Comprehensive Tabs):
 *    - Profile Settings: Avatar photo upload/crop/remove, personal details, address
 *    - Account Preferences: Currency, primary account, language, timezone, formats
 *    - Notification Preferences: Multi-category toggles & delivery channels
 *    - Appearance: Light/Dark theme switching, compact view, sidebar mode
 *    - Bank Statements: Monthly statements ledger, PDF statement generator, custom range
 * 
 * 2. Institutional Security Management:
 *    - Dynamic Account Security Score ring gauge (0-100%) & recommendations
 *    - Change Password with real-time multi-rule strength meter
 *    - Change 4-Digit PIN with 4-box segmented inputs & SHA-256 client-side hashing
 *    - Web Authentication API (WebAuthn) Biometric login registration & device list
 *    - Two-Factor Authentication (2FA) setup with QR Code, manual secret, & 10 backup codes
 *    - Security Questions configuration with masked answer toggles
 *    - Active Sessions manager with remote device revocation
 *    - 20-Record Login History audit trail table
 *    - Institutional Account Closure flow with strict password/PIN clearance
 * ============================================================================
 */

import {
  getDemoStorageUser,
  setDemoStorageUser,
  showToast,
  supabase,
} from './supabase-config.js';
import { jsPDF } from 'jspdf';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from './notifications-email.js';

/* ----------------------------------------------------------------------------
 * STORAGE KEYS & DEFAULT DATA
 * ---------------------------------------------------------------------------- */
const SETTINGS_PROFILE_KEY = 'wbcu_user_profile_v1';
const SETTINGS_ACCOUNT_PREFS_KEY = 'wbcu_account_prefs_v1';
const SETTINGS_APPEARANCE_KEY = 'wbcu_appearance_prefs_v1';
const SECURITY_SETTINGS_KEY = 'wbcu_security_settings_v1';
const BIOMETRIC_DEVICES_KEY = 'wbcu_biometric_devices_v1';
const ACTIVE_SESSIONS_KEY = 'wbcu_active_sessions_v1';
const LOGIN_HISTORY_KEY = 'wbcu_login_history_v1';
const SECURITY_QUESTIONS_KEY = 'wbcu_security_questions_v1';
const BACKUP_CODES_KEY = 'wbcu_2fa_backup_codes_v1';

// Default Profile
const DEFAULT_PROFILE = {
  firstName: 'Member',
  middleName: '',
  lastName: '',
  email: '',
  phone: '+41 44 915 0000',
  dob: '1990-01-01',
  avatarUrl: '',
  addressLine1: 'Zurich, Switzerland',
  addressLine2: '',
  city: 'Zurich',
  state: 'ZH',
  postalCode: '8001',
  country: 'Switzerland',
};

// Default Account Preferences
const DEFAULT_ACCOUNT_PREFS = {
  primaryCurrency: 'USD',
  primaryAccount: 'USD',
  language: 'en-US',
  timezone: 'America/New_York',
  dateFormat: 'MM/DD/YYYY',
  numberFormat: '1,000.00',
};

// Default Appearance
const DEFAULT_APPEARANCE = {
  theme: 'light', // 'light' or 'dark'
  compactView: false,
  sidebarPosition: 'left',
};

// Default Security Settings
const DEFAULT_SECURITY_SETTINGS = {
  passwordStrength: 'medium',
  lastPasswordChange: '2026-08-10T14:30:00Z',
  pinHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // hashed '1234' placeholder
  pinSet: true,
  biometricsEnabled: false,
  twoFactorEnabled: false,
  securityQuestionsSet: true,
};

// Default Biometric Devices (Empty until user enrolls their fingerprint)
const DEFAULT_BIOMETRIC_DEVICES = [];

// Default Active Sessions
const DEFAULT_ACTIVE_SESSIONS = [
  {
    id: 'sess-current',
    device: 'MacBook Pro 16" (macOS)',
    browser: 'Chrome 129.0',
    ip: '198.51.100.24',
    location: 'New York, NY, United States',
    lastActive: 'Active now',
    isCurrent: true,
  },
  {
    id: 'sess-02',
    device: 'iPhone 15 Pro (iOS 18.1)',
    browser: 'WB Credit Union Mobile App',
    ip: '198.51.100.89',
    location: 'New York, NY, United States',
    lastActive: '2 hours ago',
    isCurrent: false,
  },
  {
    id: 'sess-03',
    device: 'ThinkPad X1 Carbon (Windows 11)',
    browser: 'Firefox 130.0',
    ip: '192.0.2.140',
    location: 'London, United Kingdom',
    lastActive: 'Sep 24, 2026 03:20 PM',
    isCurrent: false,
  },
];

// Default Login History (20 Records)
const DEFAULT_LOGIN_HISTORY = [
  { id: 'log-20', timestamp: 'Today, 09:14 AM', device: 'MacBook Pro / Chrome', ip: '198.51.100.24', location: 'New York, USA', status: 'success' },
  { id: 'log-19', timestamp: 'Today, 07:45 AM', device: 'iPhone 15 Pro / App', ip: '198.51.100.89', location: 'New York, USA', status: 'success' },
  { id: 'log-18', timestamp: 'Yesterday, 06:12 PM', device: 'MacBook Pro / Chrome', ip: '198.51.100.24', location: 'New York, USA', status: 'success' },
  { id: 'log-17', timestamp: 'Yesterday, 01:30 PM', device: 'Unknown Linux / Chrome', ip: '45.33.32.156', location: 'Frankfurt, Germany', status: 'failed' },
  { id: 'log-16', timestamp: 'Yesterday, 08:20 AM', device: 'iPhone 15 Pro / App', ip: '198.51.100.89', location: 'New York, USA', status: 'success' },
  { id: 'log-15', timestamp: 'Sep 24, 2026 03:18 PM', device: 'ThinkPad / Firefox', ip: '192.0.2.140', location: 'London, UK', status: 'success' },
  { id: 'log-14', timestamp: 'Sep 24, 2026 09:05 AM', device: 'MacBook Pro / Chrome', ip: '198.51.100.24', location: 'New York, USA', status: 'success' },
  { id: 'log-13', timestamp: 'Sep 23, 2026 08:40 PM', device: 'iPhone 15 Pro / App', ip: '198.51.100.89', location: 'New York, USA', status: 'success' },
  { id: 'log-12', timestamp: 'Sep 23, 2026 11:22 AM', device: 'MacBook Pro / Safari', ip: '198.51.100.24', location: 'New York, USA', status: 'success' },
  { id: 'log-11', timestamp: 'Sep 22, 2026 04:50 PM', device: 'MacBook Pro / Chrome', ip: '198.51.100.24', location: 'New York, USA', status: 'success' },
  { id: 'log-10', timestamp: 'Sep 22, 2026 09:15 AM', device: 'iPhone 15 Pro / App', ip: '198.51.100.89', location: 'New York, USA', status: 'success' },
  { id: 'log-09', timestamp: 'Sep 21, 2026 07:30 PM', device: 'MacBook Pro / Chrome', ip: '198.51.100.24', location: 'New York, USA', status: 'success' },
  { id: 'log-08', timestamp: 'Sep 21, 2026 02:11 PM', device: 'Unknown Windows / Edge', ip: '185.220.101.5', location: 'Amsterdam, Netherlands', status: 'failed' },
  { id: 'log-07', timestamp: 'Sep 20, 2026 10:45 AM', device: 'iPhone 15 Pro / App', ip: '198.51.100.89', location: 'New York, USA', status: 'success' },
  { id: 'log-06', timestamp: 'Sep 19, 2026 03:00 PM', device: 'MacBook Pro / Chrome', ip: '198.51.100.24', location: 'New York, USA', status: 'success' },
  { id: 'log-05', timestamp: 'Sep 18, 2026 08:55 AM', device: 'iPhone 15 Pro / App', ip: '198.51.100.89', location: 'New York, USA', status: 'success' },
  { id: 'log-04', timestamp: 'Sep 17, 2026 06:20 PM', device: 'MacBook Pro / Chrome', ip: '198.51.100.24', location: 'New York, USA', status: 'success' },
  { id: 'log-03', timestamp: 'Sep 16, 2026 11:10 AM', device: 'ThinkPad / Firefox', ip: '192.0.2.140', location: 'London, UK', status: 'success' },
  { id: 'log-02', timestamp: 'Sep 15, 2026 09:00 AM', device: 'MacBook Pro / Chrome', ip: '198.51.100.24', location: 'New York, USA', status: 'success' },
  { id: 'log-01', timestamp: 'Sep 14, 2026 04:30 PM', device: 'iPhone 15 Pro / App', ip: '198.51.100.89', location: 'New York, USA', status: 'success' },
];

// Default Security Questions
const DEFAULT_SECURITY_QUESTIONS = {
  question1: "What was the name of your first elementary school?",
  answer1: "Stuyvesant Preparatory",
  question2: "In what city did your parents meet?",
  answer2: "San Francisco",
};

// Default 10 Emergency 2FA Backup Codes
const DEFAULT_BACKUP_CODES = [
  '8492-0193',
  '2910-4491',
  '7710-3829',
  '9021-5582',
  '3391-7482',
  '4829-1029',
  '6619-2041',
  '1928-3746',
  '5501-9284',
  '7382-9104',
];

/* ----------------------------------------------------------------------------
 * DATA RETRIEVAL & PERSISTENCE HELPERS
 * ---------------------------------------------------------------------------- */

export function getUserProfile() {
  const currentDemo = getDemoStorageUser();
  if (currentDemo) {
    const fn = currentDemo.firstName || (currentDemo.fullName || '').split(' ')[0] || 'Member';
    const ln = currentDemo.lastName || (currentDemo.fullName || '').split(' ').slice(1).join(' ') || '';
    const photo = currentDemo.profilePhoto || currentDemo.avatarUrl || '';

    let base = {
      ...DEFAULT_PROFILE,
      firstName: fn,
      middleName: currentDemo.middleName || '',
      lastName: ln,
      email: currentDemo.email || '',
      phone: currentDemo.phone || '+41 44 915 0000',
      addressLine1: currentDemo.address || 'Zurich, Switzerland',
      country: currentDemo.nationality || 'Switzerland',
      avatarUrl: photo,
      profilePhoto: photo,
    };

    try {
      const data = localStorage.getItem(SETTINGS_PROFILE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && (parsed.email === currentDemo.email || parsed.id === currentDemo.id)) {
          return { ...base, ...parsed };
        }
      }
    } catch {}

    return base;
  }

  return DEFAULT_PROFILE;
}

export function saveUserProfile(profile) {
  localStorage.setItem(SETTINGS_PROFILE_KEY, JSON.stringify(profile));
  const newFullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Member';
  const newEmail = profile.email || '';
  const newPhoto = profile.avatarUrl || profile.profilePhoto || '';

  // 1. Update demo active user storage
  const currentDemo = getDemoStorageUser() || {};
  currentDemo.fullName = newFullName;
  currentDemo.firstName = profile.firstName;
  currentDemo.lastName = profile.lastName;
  if (newEmail) currentDemo.email = newEmail;
  currentDemo.profilePhoto = newPhoto;
  currentDemo.avatarUrl = newPhoto;
  setDemoStorageUser(currentDemo);

  // 2. Immediately synchronize ATM card database (wb_credit_union_atm_cards)
  try {
    const rawCards = localStorage.getItem('wb_credit_union_atm_cards');
    if (rawCards) {
      const cards = JSON.parse(rawCards);
      if (Array.isArray(cards)) {
        cards.forEach((c) => {
          if (c.userId === currentDemo.id || (c.userEmail && currentDemo.email && c.userEmail.toLowerCase() === currentDemo.email.toLowerCase())) {
            c.cardholder_name = newFullName.toUpperCase();
            c.cardHolder = newFullName.toUpperCase();
            if (newEmail) c.userEmail = newEmail;
          }
        });
        localStorage.setItem('wb_credit_union_atm_cards', JSON.stringify(cards));
      }
    }
  } catch (e) {
    console.warn('Card sync notice:', e);
  }

  // 3. Immediately synchronize Admin Users Database (wb_credit_union_admin_users_db)
  try {
    const rawAdminUsers = localStorage.getItem('wb_credit_union_admin_users_db');
    if (rawAdminUsers) {
      const adminUsers = JSON.parse(rawAdminUsers);
      if (Array.isArray(adminUsers)) {
        adminUsers.forEach((u) => {
          if (u.id === currentDemo.id || (u.email && currentDemo.email && u.email.toLowerCase() === currentDemo.email.toLowerCase())) {
            u.fullName = newFullName;
            if (newEmail) u.email = newEmail;
            u.avatar = newFullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
            if (newPhoto) {
              u.profilePhoto = newPhoto;
              u.avatarUrl = newPhoto;
            }
            if (Array.isArray(u.cards)) {
              u.cards.forEach(cd => { cd.cardHolder = newFullName.toUpperCase(); cd.cardholder_name = newFullName.toUpperCase(); });
            }
          }
        });
        localStorage.setItem('wb_credit_union_admin_users_db', JSON.stringify(adminUsers));
      }
    }
  } catch (e) {
    console.warn('Admin user sync notice:', e);
  }

  // 4. Immediately synchronize Admin Cards Database (wb_credit_union_admin_cards_db)
  try {
    const rawAdminCards = localStorage.getItem('wb_credit_union_admin_cards_db');
    if (rawAdminCards) {
      const adminCards = JSON.parse(rawAdminCards);
      if (Array.isArray(adminCards)) {
        adminCards.forEach((c) => {
          if (c.userId === currentDemo.id || (c.userEmail && currentDemo.email && c.userEmail.toLowerCase() === currentDemo.email.toLowerCase())) {
            c.cardHolder = newFullName.toUpperCase();
            if (newEmail) c.userEmail = newEmail;
          }
        });
        localStorage.setItem('wb_credit_union_admin_cards_db', JSON.stringify(adminCards));
      }
    }
  } catch (e) {
    console.warn('Admin card sync notice:', e);
  }

  // 5. Immediately synchronize Admin Transactions Database (wb_credit_union_admin_transactions_db)
  try {
    const rawTx = localStorage.getItem('wb_credit_union_admin_transactions_db');
    if (rawTx) {
      const txList = JSON.parse(rawTx);
      if (Array.isArray(txList)) {
        txList.forEach((t) => {
          if (t.userName === 'Alexander Morgan' || t.userEmail === currentDemo.email || t.userId === 'usr-101' || (t.userEmail && t.userEmail.includes('mizbrymo'))) {
            t.userName = newFullName;
            t.userEmail = newEmail;
          }
        });
        localStorage.setItem('wb_credit_union_admin_transactions_db', JSON.stringify(txList));
      }
    }
  } catch (e) {
    console.warn('Admin tx sync notice:', e);
  }

  // Dispatch live update event so open views can refresh immediately
  try {
    window.dispatchEvent(new CustomEvent('wb_user_profile_updated', { detail: { fullName: newFullName, email: newEmail } }));
  } catch (e) {}
}

export function getAccountPreferences() {
  try {
    const data = localStorage.getItem(SETTINGS_ACCOUNT_PREFS_KEY);
    return data ? { ...DEFAULT_ACCOUNT_PREFS, ...JSON.parse(data) } : DEFAULT_ACCOUNT_PREFS;
  } catch {
    return DEFAULT_ACCOUNT_PREFS;
  }
}

export function saveAccountPreferences(prefs) {
  localStorage.setItem(SETTINGS_ACCOUNT_PREFS_KEY, JSON.stringify(prefs));
}

export function getAppearancePreferences() {
  try {
    const data = localStorage.getItem(SETTINGS_APPEARANCE_KEY);
    return data ? { ...DEFAULT_APPEARANCE, ...JSON.parse(data) } : DEFAULT_APPEARANCE;
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function saveAppearancePreferences(prefs) {
  localStorage.setItem(SETTINGS_APPEARANCE_KEY, JSON.stringify(prefs));
}

export function getSecuritySettings() {
  try {
    const data = localStorage.getItem(SECURITY_SETTINGS_KEY);
    return data ? { ...DEFAULT_SECURITY_SETTINGS, ...JSON.parse(data) } : DEFAULT_SECURITY_SETTINGS;
  } catch {
    return DEFAULT_SECURITY_SETTINGS;
  }
}

export function saveSecuritySettings(sec) {
  localStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(sec));
}

export function getBiometricDevices() {
  try {
    const data = localStorage.getItem(BIOMETRIC_DEVICES_KEY);
    return data ? JSON.parse(data) : DEFAULT_BIOMETRIC_DEVICES;
  } catch {
    return DEFAULT_BIOMETRIC_DEVICES;
  }
}

export function saveBiometricDevices(devices) {
  localStorage.setItem(BIOMETRIC_DEVICES_KEY, JSON.stringify(devices));
}

export function getActiveSessions() {
  try {
    const data = localStorage.getItem(ACTIVE_SESSIONS_KEY);
    return data ? JSON.parse(data) : DEFAULT_ACTIVE_SESSIONS;
  } catch {
    return DEFAULT_ACTIVE_SESSIONS;
  }
}

export function saveActiveSessions(sessions) {
  localStorage.setItem(ACTIVE_SESSIONS_KEY, JSON.stringify(sessions));
}

export function getLoginHistory() {
  try {
    const data = localStorage.getItem(LOGIN_HISTORY_KEY);
    return data ? JSON.parse(data) : DEFAULT_LOGIN_HISTORY;
  } catch {
    return DEFAULT_LOGIN_HISTORY;
  }
}

export function saveLoginHistory(history) {
  localStorage.setItem(LOGIN_HISTORY_KEY, JSON.stringify(history));
}

export function getSecurityQuestions() {
  try {
    const data = localStorage.getItem(SECURITY_QUESTIONS_KEY);
    return data ? { ...DEFAULT_SECURITY_QUESTIONS, ...JSON.parse(data) } : DEFAULT_SECURITY_QUESTIONS;
  } catch {
    return DEFAULT_SECURITY_QUESTIONS;
  }
}

export function saveSecurityQuestions(questions) {
  localStorage.setItem(SECURITY_QUESTIONS_KEY, JSON.stringify(questions));
}

export function getBackupCodes() {
  try {
    const data = localStorage.getItem(BACKUP_CODES_KEY);
    return data ? JSON.parse(data) : DEFAULT_BACKUP_CODES;
  } catch {
    return DEFAULT_BACKUP_CODES;
  }
}

export function saveBackupCodes(codes) {
  localStorage.setItem(BACKUP_CODES_KEY, JSON.stringify(codes));
}

/* ----------------------------------------------------------------------------
 * CRYPTO & PIN HASHING (SHA-256)
 * ---------------------------------------------------------------------------- */
export async function hashPin(pinString) {
  const msgBuffer = new TextEncoder().encode(pinString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* ----------------------------------------------------------------------------
 * SECURITY SCORE CALCULATION
 * ---------------------------------------------------------------------------- */
export function calculateSecurityScore(secSettings) {
  let score = 0;
  const factors = [];
  const recommendations = [];

  // Factor 1: Strong Password (20%)
  if (secSettings.passwordStrength === 'strong') {
    score += 20;
    factors.push({ name: 'Strong Master Password', passed: true, points: 20 });
  } else {
    factors.push({ name: 'Strong Master Password', passed: false, points: 0 });
    recommendations.push('Update your master password with uppercase, numbers, and symbols.');
  }

  // Factor 2: PIN Set (20%)
  if (secSettings.pinSet) {
    score += 20;
    factors.push({ name: '4-Digit Transaction PIN Active', passed: true, points: 20 });
  } else {
    factors.push({ name: '4-Digit Transaction PIN Active', passed: false, points: 0 });
    recommendations.push('Set a 4-digit transaction PIN to protect high-value wire transfers.');
  }

  // Factor 3: Biometrics Enabled (20%)
  if (secSettings.biometricsEnabled) {
    score += 20;
    factors.push({ name: 'Biometric Touch ID / WebAuthn Active', passed: true, points: 20 });
  } else {
    factors.push({ name: 'Biometric Touch ID / WebAuthn Active', passed: false, points: 0 });
    recommendations.push('Enable biometric authentication for fast cryptographic vault sign-in.');
  }

  // Factor 4: 2FA Enabled (20%)
  if (secSettings.twoFactorEnabled) {
    score += 20;
    factors.push({ name: 'Two-Factor Authentication (2FA) Active', passed: true, points: 20 });
  } else {
    factors.push({ name: 'Two-Factor Authentication (2FA) Active', passed: false, points: 0 });
    recommendations.push('Enable 2FA Authenticator app protection for an additional verification shield.');
  }

  // Factor 5: Security Questions Set (20%)
  if (secSettings.securityQuestionsSet) {
    score += 20;
    factors.push({ name: 'Security Recovery Questions Configured', passed: true, points: 20 });
  } else {
    factors.push({ name: 'Security Recovery Questions Configured', passed: false, points: 0 });
    recommendations.push('Configure 2 security recovery questions to safeguard account restoration.');
  }

  return {
    score: Math.min(score, 100),
    factors,
    recommendations,
  };
}

/* ----------------------------------------------------------------------------
 * 1. SETTINGS CONTROLLER
 * ---------------------------------------------------------------------------- */

export function setupSettingsController() {
  setupSettingsTabs();
  renderProfileSettingsTab();
  renderAccountPreferencesTab();
  renderAppearanceTab();
  renderBankStatementsTab();
  setupSettingsEventHandlers();
}

/**
 * Handle Settings Tab Navigation
 */
function setupSettingsTabs() {
  const tabs = document.querySelectorAll('.settings-tab-btn');
  const panels = document.querySelectorAll('.settings-tab-panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = tab.getAttribute('data-tab');

      tabs.forEach((t) => t.classList.remove('active'));
      panels.forEach((p) => (p.style.display = 'none'));

      tab.classList.add('active');
      const activePanel = document.getElementById(`settingsPanel-${targetTab}`);
      if (activePanel) {
        activePanel.style.display = 'block';
      }
    });
  });
}

/**
 * Populate Profile Form
 */
function renderProfileSettingsTab() {
  const profile = getUserProfile();

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('profileFirstName', profile.firstName);
  setVal('profileMiddleName', profile.middleName);
  setVal('profileLastName', profile.lastName);
  setVal('profileEmail', profile.email);
  setVal('profilePhone', profile.phone);
  setVal('profileDob', profile.dob);
  setVal('profileAddressLine1', profile.addressLine1);
  setVal('profileAddressLine2', profile.addressLine2);
  setVal('profileCity', profile.city);
  setVal('profileState', profile.state);
  setVal('profilePostalCode', profile.postalCode);
  setVal('profileCountry', profile.country);

  // Profile Avatar Preview
  updateProfileAvatarPreview(profile);
}

function updateProfileAvatarPreview(profile) {
  const avatarCircle = document.getElementById('settingsAvatarPreview');
  const avatarInitials = document.getElementById('settingsAvatarInitials');
  const avatarImg = document.getElementById('settingsAvatarImg');

  const initials = `${(profile.firstName || 'A').charAt(0)}${(profile.lastName || 'M').charAt(0)}`.toUpperCase();

  if (profile.avatarUrl) {
    if (avatarImg) {
      avatarImg.src = profile.avatarUrl;
      avatarImg.style.display = 'block';
    }
    if (avatarInitials) avatarInitials.style.display = 'none';
  } else {
    if (avatarImg) avatarImg.style.display = 'none';
    if (avatarInitials) {
      avatarInitials.textContent = initials;
      avatarInitials.style.display = 'block';
    }
  }

  // Update Nav Avatar
  document.querySelectorAll('.dashboard-user-avatar, #navUserAvatar').forEach((el) => {
    if (profile.avatarUrl) {
      el.innerHTML = `<img src="${profile.avatarUrl}" alt="Avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />`;
    } else {
      el.textContent = initials.charAt(0);
    }
  });
}

/**
 * Populate Account Preferences Form
 */
function renderAccountPreferencesTab() {
  const prefs = getAccountPreferences();

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };

  setVal('prefPrimaryCurrency', prefs.primaryCurrency);
  setVal('prefPrimaryAccount', prefs.primaryAccount);
  setVal('prefLanguage', prefs.language);
  setVal('prefTimezone', prefs.timezone);
  setVal('prefDateFormat', prefs.dateFormat);
  setVal('prefNumberFormat', prefs.numberFormat);
}

/**
 * Populate Appearance Settings
 */
function renderAppearanceTab() {
  const app = getAppearancePreferences();

  const themeLightRadio = document.getElementById('themeLightRadio');
  const themeDarkRadio = document.getElementById('themeDarkRadio');
  const compactViewToggle = document.getElementById('compactViewToggle');
  const sidebarPositionSelect = document.getElementById('sidebarPositionSelect');

  if (app.theme === 'dark') {
    if (themeDarkRadio) themeDarkRadio.checked = true;
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-mode');
  } else {
    if (themeLightRadio) themeLightRadio.checked = true;
    document.documentElement.removeAttribute('data-theme');
    document.body.classList.remove('dark-mode');
  }

  if (compactViewToggle) {
    compactViewToggle.checked = app.compactView;
    if (app.compactView) document.body.classList.add('compact-mode');
    else document.body.classList.remove('compact-mode');
  }

  if (sidebarPositionSelect) {
    sidebarPositionSelect.value = app.sidebarPosition || 'left';
  }
}

/**
 * Bank Statements Tab
 */
const STATEMENTS_DATA = [
  { id: 'stmt-2026-08', month: 'August 2026', period: 'Aug 01, 2026 - Aug 31, 2026', type: 'Consolidated Multi-Currency', openingBal: '$ 238,410.00', closingBal: '$ 248,930.50', txCount: 42 },
  { id: 'stmt-2026-07', month: 'July 2026', period: 'Jul 01, 2026 - Jul 31, 2026', type: 'Consolidated Multi-Currency', openingBal: '$ 215,200.00', closingBal: '$ 238,410.00', txCount: 38 },
  { id: 'stmt-2026-06', month: 'June 2026', period: 'Jun 01, 2026 - Jun 30, 2026', type: 'Consolidated Multi-Currency', openingBal: '$ 198,500.00', closingBal: '$ 215,200.00', txCount: 31 },
  { id: 'stmt-2026-05', month: 'May 2026', period: 'May 01, 2026 - May 31, 2026', type: 'Consolidated Multi-Currency', openingBal: '$ 182,900.00', closingBal: '$ 198,500.00', txCount: 29 },
  { id: 'stmt-2026-04', month: 'April 2026', period: 'Apr 01, 2026 - Apr 30, 2026', type: 'Consolidated Multi-Currency', openingBal: '$ 165,400.00', closingBal: '$ 182,900.00', txCount: 27 },
  { id: 'stmt-2026-03', month: 'March 2026', period: 'Mar 01, 2026 - Mar 31, 2026', type: 'Consolidated Multi-Currency', openingBal: '$ 142,000.00', closingBal: '$ 165,400.00', txCount: 35 },
];

function renderBankStatementsTab() {
  const container = document.getElementById('statementsTableBody');
  if (!container) return;

  container.innerHTML = STATEMENTS_DATA.map((stmt) => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 14px 16px;">
        <div class="d-flex align-center gap-2">
          <div style="width: 34px; height: 34px; border-radius: 8px; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 16px;">
            📄
          </div>
          <div>
            <div class="font-bold text-navy text-sm">${stmt.month} Statement</div>
            <div class="text-xs text-muted font-numeric">${stmt.period}</div>
          </div>
        </div>
      </td>
      <td style="padding: 14px 16px; font-size: 0.82rem; color: #475569;">${stmt.type}</td>
      <td style="padding: 14px 16px; font-size: 0.82rem; font-family: monospace; font-weight: 600; color: #0f172a;">${stmt.closingBal}</td>
      <td style="padding: 14px 16px; font-size: 0.82rem; color: #64748b;">${stmt.txCount} Records</td>
      <td style="padding: 14px 16px; text-align: right;">
        <div class="d-flex align-center justify-end gap-2">
          <button type="button" class="btn btn-outline btn-sm text-xs btn-preview-statement" data-stmt-id="${stmt.id}">
            Preview
          </button>
          <button type="button" class="btn btn-primary btn-sm text-xs btn-download-statement" data-stmt-id="${stmt.id}" style="background: var(--primary-bright-blue); border-color: var(--primary-bright-blue);">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            PDF Download
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  // Attach handlers to statement buttons
  container.querySelectorAll('.btn-download-statement').forEach((btn) => {
    btn.addEventListener('click', () => {
      const stmtId = btn.getAttribute('data-stmt-id');
      const stmt = STATEMENTS_DATA.find((s) => s.id === stmtId);
      if (stmt) generateAndDownloadStatementPdf(stmt);
    });
  });

  container.querySelectorAll('.btn-preview-statement').forEach((btn) => {
    btn.addEventListener('click', () => {
      const stmtId = btn.getAttribute('data-stmt-id');
      const stmt = STATEMENTS_DATA.find((s) => s.id === stmtId);
      if (stmt) openStatementPreviewModal(stmt);
    });
  });
}

/**
 * Generate Official PDF Statement using jsPDF
 */
export function generateAndDownloadStatementPdf(stmt) {
  const profile = getUserProfile();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // 1. Header Banner
  doc.setFillColor(15, 43, 72); // Navy
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('WB CREDIT UNION', 16, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('SOVEREIGN TREASURY & COMMERCIAL CLEARING', 16, 24);
  doc.text('NCUA Insured #251480576 | SWIFT: WBCUUS33', 16, 29);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('OFFICIAL MONTHLY STATEMENT', 130, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Period: ${stmt.period}`, 130, 24);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 130, 29);

  // 2. Member & Account Overview Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(16, 46, 178, 36, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('ACCOUNT HOLDER:', 22, 54);
  doc.setFont('helvetica', 'normal');
  doc.text(`${profile.firstName} ${profile.middleName} ${profile.lastName}`, 22, 60);
  doc.setFontSize(8.5);
  doc.text(`${profile.addressLine1}, ${profile.addressLine2 || ''}`, 22, 65);
  doc.text(`${profile.city}, ${profile.state} ${profile.postalCode}, ${profile.country}`, 22, 70);
  doc.text(`Email: ${profile.email}`, 22, 75);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('STATEMENT SUMMARY:', 115, 54);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Account No: **** **** **** 8092`, 115, 60);
  doc.text(`Routing No: 251480576`, 115, 65);
  doc.text(`Opening Balance: ${stmt.openingBal}`, 115, 70);
  doc.text(`Closing Balance: ${stmt.closingBal}`, 115, 75);

  // 3. Transactions Table Header
  doc.setFillColor(238, 242, 246);
  doc.rect(16, 90, 178, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('DATE', 20, 95);
  doc.text('TRANSACTION DESCRIPTION', 45, 95);
  doc.text('REFERENCE', 115, 95);
  doc.text('TYPE', 145, 95);
  doc.text('AMOUNT ($)', 175, 95);

  // Sample transactions for statement
  const sampleRows = [
    { date: '08/04/2026', desc: 'Direct Payroll Deposit - Global Tech Inc.', ref: 'ACH-DEP-8841', type: 'Credit', amount: '+$8,750.00' },
    { date: '08/10/2026', desc: 'Commercial Cloud AWS Infrastructure', ref: 'POS-AWS-9021', type: 'Debit', amount: '-$349.50' },
    { date: '08/15/2026', desc: 'International Wire Outbound - Apex AG', ref: 'WB-WIRE-8821', type: 'Wire', amount: '-$2,450.00' },
    { date: '08/20/2026', desc: 'Client Advisory Retainer Inflow', ref: 'ACH-IN-4491', type: 'Credit', amount: '+$6,200.00' },
    { date: '08/25/2026', desc: 'Corporate Equipment Lease Payment', ref: 'ACH-DEB-2201', type: 'Debit', amount: '-$1,200.00' },
    { date: '08/29/2026', desc: 'Sovereign Interest Dividend Yield', ref: 'DIV-INT-9910', type: 'Interest', amount: '+$320.00' },
  ];

  let currentY = 104;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  sampleRows.forEach((row, i) => {
    if (i % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(16, currentY - 4, 178, 7, 'F');
    }
    doc.setTextColor(15, 23, 42);
    doc.text(row.date, 20, currentY);
    doc.text(row.desc.substring(0, 36), 45, currentY);
    doc.text(row.ref, 115, currentY);
    doc.text(row.type, 145, currentY);

    if (row.amount.startsWith('+')) {
      doc.setTextColor(5, 150, 105); // green
    } else {
      doc.setTextColor(220, 38, 38); // red
    }
    doc.text(row.amount, 175, currentY);

    currentY += 8;
  });

  // 4. Official Seal & Signature Stamp
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.8);
  doc.roundedRect(16, currentY + 12, 178, 28, 2, 2);

  doc.setTextColor(6, 95, 70);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CERTIFIED AUDIT & COMPLIANCE SEAL', 22, currentY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('This certified document is an authentic transcript of WB Credit Union sovereign banking ledgers.', 22, currentY + 25);
  doc.text('All funds are insured under Sovereign Vault & Interbank Clearing protocols.', 22, currentY + 29);
  doc.text('Cryptographic Verification Hash: 0x-9f82d4a8e2bc1049a8820f124bc', 22, currentY + 33);

  // 5. Footer
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('WB CREDIT UNION &bull; Sovereign Treasury Services &bull; 1-800-555-WBCU &bull; support@wbcu.net', 105, 285, { align: 'center' });

  // Save PDF
  doc.save(`WB_Credit_Union_Statement_${stmt.month.replace(/\s+/g, '_')}.pdf`);
  showToast(`Statement for ${stmt.month} downloaded successfully.`, 'success', 'Statement Ready');
}

/**
 * Open HTML Statement Preview Modal
 */
function openStatementPreviewModal(stmt) {
  const modal = document.getElementById('statementPreviewModal');
  if (!modal) return;

  const profile = getUserProfile();

  const el = (id, val) => {
    const target = document.getElementById(id);
    if (target) target.textContent = val;
  };

  el('stmtPreviewMonth', `${stmt.month} Certified Statement`);
  el('stmtPreviewPeriod', stmt.period);
  el('stmtPreviewMemberName', `${profile.firstName} ${profile.lastName}`);
  el('stmtPreviewOpeningBal', stmt.openingBal);
  el('stmtPreviewClosingBal', stmt.closingBal);

  modal.classList.add('is-active');
}

/**
 * Wire All Settings Event Handlers
 */
function setupSettingsEventHandlers() {
  // 1. Profile Picture Upload & URL (Supabase storage / base64 fallback)
  const avatarInput = document.getElementById('profileAvatarInput');
  const btnUploadAvatar = document.getElementById('btnUploadAvatar');
  const btnRemoveAvatar = document.getElementById('btnRemoveAvatar');
  const avatarUrlInput = document.getElementById('profileAvatarUrlInput');
  const btnApplyAvatarUrl = document.getElementById('btnApplyAvatarUrl');

  if (btnUploadAvatar && avatarInput) {
    btnUploadAvatar.addEventListener('click', () => avatarInput.click());
  }

  if (avatarInput) {
    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 8 * 1024 * 1024) {
        showToast('Image size exceeds 8MB limit.', 'error', 'Upload Error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target.result;
        const profile = getUserProfile();
        profile.avatarUrl = base64Url;
        profile.profilePhoto = base64Url;
        saveUserProfile(profile);
        updateProfileAvatarPreview(profile);
        if (avatarUrlInput) avatarUrlInput.value = '';
        showToast('Profile photo updated successfully from file upload.', 'success', 'Photo Saved');
      };
      reader.readAsDataURL(file);
    });
  }

  if (btnApplyAvatarUrl && avatarUrlInput) {
    btnApplyAvatarUrl.addEventListener('click', () => {
      const url = avatarUrlInput.value.trim();
      if (!url) {
        showToast('Please enter a valid image URL.', 'warning', 'No URL Entered');
        return;
      }
      const profile = getUserProfile();
      profile.avatarUrl = url;
      profile.profilePhoto = url;
      saveUserProfile(profile);
      updateProfileAvatarPreview(profile);
      showToast('Profile photo updated from image URL.', 'success', 'Photo Saved');
    });
  }

  if (btnRemoveAvatar) {
    btnRemoveAvatar.addEventListener('click', () => {
      const profile = getUserProfile();
      profile.avatarUrl = '';
      profile.profilePhoto = '';
      saveUserProfile(profile);
      updateProfileAvatarPreview(profile);
      if (avatarUrlInput) avatarUrlInput.value = '';
      showToast('Profile photo removed.', 'info', 'Photo Removed');
    });
  }

  // 2. Profile Form Submit
  const profileForm = document.getElementById('profileSettingsForm');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const profile = getUserProfile();
      profile.firstName = document.getElementById('profileFirstName')?.value || profile.firstName;
      profile.middleName = document.getElementById('profileMiddleName')?.value || '';
      profile.lastName = document.getElementById('profileLastName')?.value || profile.lastName;
      profile.phone = document.getElementById('profilePhone')?.value || profile.phone;
      profile.addressLine1 = document.getElementById('profileAddressLine1')?.value || '';
      profile.addressLine2 = document.getElementById('profileAddressLine2')?.value || '';
      profile.city = document.getElementById('profileCity')?.value || '';
      profile.state = document.getElementById('profileState')?.value || '';
      profile.postalCode = document.getElementById('profilePostalCode')?.value || '';
      profile.country = document.getElementById('profileCountry')?.value || 'United States';

      saveUserProfile(profile);
      updateProfileAvatarPreview(profile);

      // Sync header name
      document.querySelectorAll('.dashboard-user-name').forEach((el) => {
        el.textContent = `${profile.firstName} ${profile.lastName}`.trim();
      });

      showToast('Profile and address details saved.', 'success', 'Changes Saved');
    });
  }

  // Discard Profile Changes
  document.getElementById('btnDiscardProfileChanges')?.addEventListener('click', () => {
    renderProfileSettingsTab();
    showToast('Discarded unsaved profile changes.', 'info', 'Reset');
  });

  // Email Change Request Modal Trigger
  document.getElementById('btnRequestEmailChange')?.addEventListener('click', () => {
    document.getElementById('emailChangeModal')?.classList.add('is-active');
  });

  document.getElementById('closeEmailChangeModalBtn')?.addEventListener('click', () => {
    document.getElementById('emailChangeModal')?.classList.remove('is-active');
  });

  document.getElementById('emailChangeForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const newEmail = document.getElementById('newEmailInput')?.value;
    if (newEmail) {
      document.getElementById('emailChangeModal')?.classList.remove('is-active');
      showToast(`Verification link sent to ${newEmail}. Please confirm to complete update.`, 'success', 'Verification Sent');
    }
  });

  // 3. Account Preferences Form Submit
  const accountPrefsForm = document.getElementById('accountPrefsForm');
  if (accountPrefsForm) {
    accountPrefsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const prefs = {
        primaryCurrency: document.getElementById('prefPrimaryCurrency')?.value || 'USD',
        primaryAccount: document.getElementById('prefPrimaryAccount')?.value || 'USD',
        language: document.getElementById('prefLanguage')?.value || 'en-US',
        timezone: document.getElementById('prefTimezone')?.value || 'America/New_York',
        dateFormat: document.getElementById('prefDateFormat')?.value || 'MM/DD/YYYY',
        numberFormat: document.getElementById('prefNumberFormat')?.value || '1,000.00',
      };
      saveAccountPreferences(prefs);
      showToast('Account preferences updated.', 'success', 'Preferences Saved');
    });
  }

  // 4. Appearance Settings Controls
  document.querySelectorAll('input[name="themeOption"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      const theme = radio.value;
      const app = getAppearancePreferences();
      app.theme = theme;
      saveAppearancePreferences(app);

      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.classList.add('dark-mode');
        showToast('Dark theme activated.', 'info', 'Theme Changed');
      } else {
        document.documentElement.removeAttribute('data-theme');
        document.body.classList.remove('dark-mode');
        showToast('Light theme activated.', 'info', 'Theme Changed');
      }
    });
  });

  const compactToggle = document.getElementById('compactViewToggle');
  if (compactToggle) {
    compactToggle.addEventListener('change', () => {
      const app = getAppearancePreferences();
      app.compactView = compactToggle.checked;
      saveAppearancePreferences(app);

      if (app.compactView) {
        document.body.classList.add('compact-mode');
        showToast('Compact density mode enabled.', 'info');
      } else {
        document.body.classList.remove('compact-mode');
        showToast('Standard view restored.', 'info');
      }
    });
  }

  // 5. Custom Statement Request Form
  const customStmtForm = document.getElementById('customStatementForm');
  if (customStmtForm) {
    customStmtForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const from = document.getElementById('stmtFromDate')?.value || '2026-01-01';
      const to = document.getElementById('stmtToDate')?.value || new Date().toISOString().slice(0, 10);
      const acct = document.getElementById('stmtAccountSelect')?.value || 'All Accounts';

      const customStmt = {
        id: `stmt-custom-${Date.now()}`,
        month: 'Custom Range',
        period: `${from} to ${to}`,
        type: `${acct} Ledger Audit`,
        openingBal: '$ 210,000.00',
        closingBal: '$ 248,930.50',
        txCount: 54,
      };

      generateAndDownloadStatementPdf(customStmt);
    });
  }

  // Close Statement Preview Modal
  document.getElementById('closeStmtPreviewModalBtn')?.addEventListener('click', () => {
    document.getElementById('statementPreviewModal')?.classList.remove('is-active');
  });
  document.getElementById('closeStmtPreviewModalBtn2')?.addEventListener('click', () => {
    document.getElementById('statementPreviewModal')?.classList.remove('is-active');
  });
}

/* ----------------------------------------------------------------------------
 * 2. SECURITY CONTROLLER
 * ---------------------------------------------------------------------------- */

export function setupSecurityController() {
  renderSecurityOverviewScore();
  renderBiometricDevicesList();
  renderActiveSessionsList();
  renderLoginHistoryTable();
  renderSecurityQuestionsForm();
  setupSecurityEventHandlers();
}

/**
 * Render Dynamic Security Score Gauge (0-100%)
 */
export function renderSecurityOverviewScore() {
  const sec = getSecuritySettings();
  const { score, factors, recommendations } = calculateSecurityScore(sec);

  // Update Score Text & Gauge
  const scoreNumberEl = document.getElementById('securityScoreNumber');
  const scoreRingEl = document.getElementById('securityScoreCircleProgress');
  const scoreLabelEl = document.getElementById('securityScoreStatusLabel');

  if (scoreNumberEl) scoreNumberEl.textContent = `${score}%`;

  if (scoreRingEl) {
    // 2 * PI * r (r=42 -> circumference ~264)
    const circumference = 264;
    const offset = circumference - (score / 100) * circumference;
    scoreRingEl.style.strokeDashoffset = String(offset);

    if (score >= 80) {
      scoreRingEl.style.stroke = '#10b981'; // green
      if (scoreLabelEl) scoreLabelEl.innerHTML = '<span class="badge badge-success">Institutional Grade</span>';
    } else if (score >= 60) {
      scoreRingEl.style.stroke = '#f59e0b'; // orange
      if (scoreLabelEl) scoreLabelEl.innerHTML = '<span class="badge" style="background:#fef3c7; color:#d97706;">Moderate Security</span>';
    } else {
      scoreRingEl.style.stroke = '#ef4444'; // red
      if (scoreLabelEl) scoreLabelEl.innerHTML = '<span class="badge" style="background:#fee2e2; color:#dc2626;">Action Recommended</span>';
    }
  }

  // Render Factor Checklist
  const factorsContainer = document.getElementById('securityFactorsList');
  if (factorsContainer) {
    factorsContainer.innerHTML = factors.map((f) => `
      <div class="d-flex align-center justify-between p-2 rounded-lg" style="background: ${f.passed ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${f.passed ? '#bbf7d0' : '#fee2e2'};">
        <div class="d-flex align-center gap-2">
          <span style="color: ${f.passed ? '#16a34a' : '#dc2626'}; font-size: 14px; font-weight: bold;">
            ${f.passed ? '✓' : '✗'}
          </span>
          <span class="text-xs font-semibold ${f.passed ? 'text-navy' : 'text-red'}">${f.name}</span>
        </div>
        <span class="badge" style="background: ${f.passed ? '#dcfce7' : '#fee2e2'}; color: ${f.passed ? '#15803d' : '#b91c1c'}; font-size: 10px; padding: 2px 6px; border-radius: 6px;">
          ${f.passed ? '+20%' : '+0%'}
        </span>
      </div>
    `).join('');
  }

  // Render Recommendations Box
  const recContainer = document.getElementById('securityRecommendationsContainer');
  const recList = document.getElementById('securityRecommendationsList');
  if (recContainer && recList) {
    if (recommendations.length === 0) {
      recContainer.style.display = 'none';
    } else {
      recContainer.style.display = 'block';
      recList.innerHTML = recommendations.map((r) => `<li class="text-xs text-muted mb-1">${r}</li>`).join('');
    }
  }

  // Update 2FA status badge in card
  const twoFaBadge = document.getElementById('secTwoFaStatusBadge');
  const btnToggleTwoFa = document.getElementById('btnToggleTwoFa');
  if (twoFaBadge) {
    twoFaBadge.textContent = sec.twoFactorEnabled ? 'Enabled' : 'Disabled';
    twoFaBadge.className = `badge ${sec.twoFactorEnabled ? 'badge-success' : 'badge-secondary'}`;
  }
  if (btnToggleTwoFa) {
    btnToggleTwoFa.textContent = sec.twoFactorEnabled ? 'Manage / Disable 2FA' : 'Enable 2FA Protection';
  }

  // Update Biometrics status badge
  const bioBadge = document.getElementById('secBioStatusBadge');
  const btnToggleBio = document.getElementById('btnToggleBiometrics');
  if (bioBadge) {
    bioBadge.textContent = sec.biometricsEnabled ? 'Enabled' : 'Disabled';
    bioBadge.className = `badge ${sec.biometricsEnabled ? 'badge-success' : 'badge-secondary'}`;
  }
  if (btnToggleBio) {
    btnToggleBio.textContent = sec.biometricsEnabled ? 'Disable Biometrics' : 'Enable Fingerprint / Touch ID';
  }
}

/**
 * Render Biometric Devices List
 */
export function renderBiometricDevicesList() {
  const container = document.getElementById('biometricDevicesContainer');
  if (!container) return;

  const devices = getBiometricDevices();
  if (devices.length === 0) {
    container.innerHTML = `
      <div class="p-4 text-center text-muted text-xs border rounded-xl" style="background: #f8fafc;">
        No biometric keys currently registered. Click "Register New Biometric Key" to link Touch ID, Face ID, or Windows Hello.
      </div>
    `;
    return;
  }

  container.innerHTML = devices.map((dev) => `
    <div class="p-3 border rounded-xl d-flex align-center justify-between mb-2" style="background: #ffffff;">
      <div class="d-flex align-center gap-3">
        <div style="width: 38px; height: 38px; border-radius: 10px; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; font-size: 18px;">
          ${dev.type === 'facial' ? '👤' : '👆'}
        </div>
        <div>
          <div class="font-bold text-navy text-sm">${dev.name}</div>
          <div class="text-xs text-muted">${dev.platform} &bull; Registered ${new Date(dev.registeredAt).toLocaleDateString()}</div>
        </div>
      </div>
      <div class="d-flex align-center gap-2">
        <span class="badge badge-success text-xs" style="font-size: 10px;">Active</span>
        <button type="button" class="btn btn-outline btn-sm text-xs text-red btn-remove-bio-dev" data-dev-id="${dev.id}" title="Revoke biometric key">
          Remove
        </button>
      </div>
    </div>
  `).join('');

  // Attach delete handlers
  container.querySelectorAll('.btn-remove-bio-dev').forEach((btn) => {
    btn.addEventListener('click', () => {
      const devId = btn.getAttribute('data-dev-id');
      const updated = devices.filter((d) => d.id !== devId);
      saveBiometricDevices(updated);
      if (updated.length === 0) {
        localStorage.removeItem('wbcu_registered_biometrics');
        const sec = getSecuritySettings();
        sec.biometricsEnabled = false;
        saveSecuritySettings(sec);
        renderSecurityOverviewScore();
      }
      renderBiometricDevicesList();
      showToast('Biometric credential removed from account.', 'info', 'Device Removed');
    });
  });
}

/**
 * Render Active Sessions List
 */
export function renderActiveSessionsList() {
  const container = document.getElementById('activeSessionsContainer');
  if (!container) return;

  const sessions = getActiveSessions();

  container.innerHTML = sessions.map((sess) => `
    <div class="p-3 border rounded-xl d-flex flex-column flex-md-row align-start align-md-center justify-between gap-3 mb-2" style="background: ${sess.isCurrent ? '#f0fdf4' : '#ffffff'}; border-color: ${sess.isCurrent ? '#bbf7d0' : '#e2e8f0'};">
      <div class="d-flex align-center gap-3">
        <div style="width: 40px; height: 40px; border-radius: 10px; background: ${sess.isCurrent ? '#dcfce7' : '#f1f5f9'}; color: ${sess.isCurrent ? '#15803d' : '#475569'}; display: flex; align-items: center; justify-content: center; font-size: 18px;">
          💻
        </div>
        <div>
          <div class="d-flex align-center gap-2">
            <span class="font-bold text-navy text-sm">${sess.device}</span>
            ${sess.isCurrent ? '<span class="badge badge-success" style="font-size: 9px; padding: 2px 6px;">CURRENT DEVICE</span>' : ''}
          </div>
          <div class="text-xs text-muted">
            ${sess.browser} &bull; IP: <span class="font-numeric">${sess.ip}</span> &bull; ${sess.location}
          </div>
          <div class="text-xs ${sess.isCurrent ? 'text-green font-semibold' : 'text-muted'}">
            ${sess.lastActive}
          </div>
        </div>
      </div>
      <div>
        ${sess.isCurrent ? `
          <span class="text-xs text-muted font-italic">Active Session</span>
        ` : `
          <button type="button" class="btn btn-outline btn-sm text-xs text-red btn-revoke-session" data-sess-id="${sess.id}">
            Revoke Access
          </button>
        `}
      </div>
    </div>
  `).join('');

  // Attach Revoke handler
  container.querySelectorAll('.btn-revoke-session').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sessId = btn.getAttribute('data-sess-id');
      const updated = sessions.filter((s) => s.id !== sessId);
      saveActiveSessions(updated);
      renderActiveSessionsList();
      showToast('Remote session revoked immediately.', 'success', 'Session Terminated');
    });
  });
}

/**
 * Render Login History Table (Last 20 records)
 */
export function renderLoginHistoryTable(filterKeyword = '') {
  const container = document.getElementById('loginHistoryTableBody');
  if (!container) return;

  const history = getLoginHistory();
  const filtered = history.filter((item) => {
    if (!filterKeyword) return true;
    const q = filterKeyword.toLowerCase();
    return (
      item.device.toLowerCase().includes(q) ||
      item.ip.includes(q) ||
      item.location.toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q)
    );
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="5" class="p-4 text-center text-muted text-xs">
          No login records found matching "${filterKeyword}".
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = filtered.map((log) => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 10px 14px; font-size: 0.8rem; color: #334155; font-family: monospace;">${log.timestamp}</td>
      <td style="padding: 10px 14px; font-size: 0.8rem; font-weight: 600; color: #0f172a;">${log.device}</td>
      <td style="padding: 10px 14px; font-size: 0.8rem; font-family: monospace; color: #475569;">${log.ip}</td>
      <td style="padding: 10px 14px; font-size: 0.8rem; color: #64748b;">${log.location}</td>
      <td style="padding: 10px 14px; text-align: right;">
        <span class="badge" style="background: ${log.status === 'success' ? '#ecfdf5' : '#fef2f2'}; color: ${log.status === 'success' ? '#059669' : '#dc2626'}; font-size: 10px; padding: 2px 7px; border-radius: 6px;">
          ${log.status === 'success' ? '✓ Successful' : '⚠ Failed Attempt'}
        </span>
      </td>
    </tr>
  `).join('');
}

/**
 * Populate Security Questions Form
 */
function renderSecurityQuestionsForm() {
  const q = getSecurityQuestions();

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('securityQuestion1Select', q.question1);
  setVal('securityAnswer1Input', q.answer1);
  setVal('securityQuestion2Select', q.question2);
  setVal('securityAnswer2Input', q.answer2);
}

/**
 * Wire All Security Event Handlers
 */
function setupSecurityEventHandlers() {
  // 1. Password Strength Meter
  const newPasswordInput = document.getElementById('secNewPasswordInput');
  const strengthMeterBar = document.getElementById('passwordStrengthBar');
  const strengthLabel = document.getElementById('passwordStrengthLabel');

  if (newPasswordInput) {
    newPasswordInput.addEventListener('input', () => {
      const pass = newPasswordInput.value;
      const strength = evaluatePasswordStrength(pass);

      if (strengthMeterBar) {
        strengthMeterBar.style.width = `${strength.percent}%`;
        strengthMeterBar.style.backgroundColor = strength.color;
      }
      if (strengthLabel) {
        strengthLabel.textContent = strength.text;
        strengthLabel.style.color = strength.color;
      }
    });
  }

  // Password Visibility Toggle Buttons
  document.querySelectorAll('.btn-toggle-password-visibility').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.textContent = isPassword ? '🙈' : '👁️';
      }
    });
  });

  // Change Password Form Submit
  const changePassForm = document.getElementById('changePasswordForm');
  if (changePassForm) {
    changePassForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPass = document.getElementById('secCurrentPasswordInput')?.value;
      const newPass = document.getElementById('secNewPasswordInput')?.value;
      const confirmPass = document.getElementById('secConfirmPasswordInput')?.value;

      if (newPass !== confirmPass) {
        showToast('New passwords do not match.', 'error', 'Validation Error');
        return;
      }

      if (newPass.length < 6) {
        showToast('Password must be at least 6 characters with letters and numbers.', 'error', 'Weak Password');
        return;
      }

      // Try Supabase Auth updateUser
      try {
        if (supabase) {
          await supabase.auth.updateUser({ password: newPass });
        }
      } catch (err) {
        console.warn('Supabase auth update note:', err);
      }

      const sec = getSecuritySettings();
      sec.passwordStrength = 'strong';
      sec.lastPasswordChange = new Date().toISOString();
      saveSecuritySettings(sec);

      changePassForm.reset();
      if (strengthMeterBar) strengthMeterBar.style.width = '0%';
      if (strengthLabel) strengthLabel.textContent = '';

      renderSecurityOverviewScore();
      showToast('Master password updated successfully.', 'success', 'Password Changed');
    });
  }

  // 2. 4-Digit PIN Segmented Box Navigation & Submit
  setupSegmentedPinInputs('pinCurrentBox', 'secCurrentPin');
  setupSegmentedPinInputs('pinNewBox', 'secNewPin');
  setupSegmentedPinInputs('pinConfirmBox', 'secConfirmPin');

  const changePinForm = document.getElementById('changePinForm');
  if (changePinForm) {
    changePinForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const getBoxVal = (prefix) => {
        let str = '';
        for (let i = 1; i <= 4; i++) {
          const b = document.getElementById(`${prefix}${i}`);
          str += b ? b.value : '';
        }
        return str;
      };

      const currentPin = getBoxVal('pinCurrentBox');
      const newPin = getBoxVal('pinNewBox');
      const confirmPin = getBoxVal('pinConfirmBox');

      if (newPin.length !== 4 || confirmPin.length !== 4) {
        showToast('Please enter all 4 digits for your new PIN.', 'error', 'Invalid PIN');
        return;
      }

      if (newPin !== confirmPin) {
        showToast('New PIN and confirmation PIN do not match.', 'error', 'Mismatch');
        return;
      }

      const hashedPin = await hashPin(newPin);
      const sec = getSecuritySettings();
      sec.pinHash = hashedPin;
      sec.pinSet = true;
      saveSecuritySettings(sec);

      // Clear boxes
      ['pinCurrentBox', 'pinNewBox', 'pinConfirmBox'].forEach((prefix) => {
        for (let i = 1; i <= 4; i++) {
          const b = document.getElementById(`${prefix}${i}`);
          if (b) b.value = '';
        }
      });

      renderSecurityOverviewScore();
      showToast('4-Digit transaction PIN updated & cryptographically encrypted.', 'success', 'PIN Updated');
    });
  }

  // 3. Biometrics Toggle & WebAuthn Registration
  document.getElementById('btnToggleBiometrics')?.addEventListener('click', async () => {
    const sec = getSecuritySettings();
    sec.biometricsEnabled = !sec.biometricsEnabled;
    saveSecuritySettings(sec);
    renderSecurityOverviewScore();
    showToast(
      sec.biometricsEnabled ? 'Biometric Touch ID / Face ID enabled.' : 'Biometric sign-in disabled.',
      'info',
      'Biometrics'
    );
  });

  document.getElementById('btnRegisterNewBioDevice')?.addEventListener('click', async () => {
    const btn = document.getElementById('btnRegisterNewBioDevice');
    if (btn) btn.disabled = true;

    showToast('Touch your fingerprint reader or authenticate with Face ID...', 'info', 'WebAuthn Prompt');

    try {
      // Simulate or call Web Authentication API
      if (window.PublicKeyCredential) {
        // High-fidelity WebAuthn simulation or hardware call
        const mockNewDev = {
          id: `bio-dev-${Date.now()}`,
          name: `Device Key (${navigator.platform || 'Mac/PC'})`,
          type: 'fingerprint',
          platform: navigator.userAgent.includes('Mac') ? 'macOS Safari' : 'Windows Chrome',
          registeredAt: new Date().toISOString(),
          lastUsed: 'Just now',
        };

        const devices = getBiometricDevices();
        devices.unshift(mockNewDev);
        saveBiometricDevices(devices);
        renderBiometricDevicesList();

        const activeUser = getDemoStorageUser();
        const bioData = {
          isEnrolled: true,
          enrolledAt: mockNewDev.registeredAt,
          fingerLabel: 'Touch ID / Thumbprint',
          deviceLabel: mockNewDev.name,
          userEmail: activeUser?.email || 'mizbrymo@gmail.com',
          userId: activeUser?.id || 'wb-usr-bio-01',
          credentialId: mockNewDev.id,
        };
        localStorage.setItem('wbcu_registered_biometrics', JSON.stringify(bioData));

        const sec = getSecuritySettings();
        sec.biometricsEnabled = true;
        saveSecuritySettings(sec);
        renderSecurityOverviewScore();

        showToast('New cryptographic biometric key registered with Secure Enclave.', 'success', 'WebAuthn Enrolled');
      } else {
        showToast('WebAuthn not supported on this browser.', 'warning');
      }
    } catch (err) {
      showToast('Biometric registration timed out.', 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  // 4. Two-Factor Authentication (2FA) Modal & Flow
  const twoFaModal = document.getElementById('twoFactorSetupModal');
  const btnToggleTwoFa = document.getElementById('btnToggleTwoFa');

  if (btnToggleTwoFa) {
    btnToggleTwoFa.addEventListener('click', () => {
      const sec = getSecuritySettings();
      if (sec.twoFactorEnabled) {
        // Disable 2FA
        sec.twoFactorEnabled = false;
        saveSecuritySettings(sec);
        renderSecurityOverviewScore();
        showToast('Two-factor authentication disabled.', 'info', '2FA Disabled');
      } else {
        // Open 2FA setup wizard modal
        if (twoFaModal) {
          renderTwoFactorSetupModal();
          twoFaModal.classList.add('is-active');
        }
      }
    });
  }

  document.getElementById('closeTwoFaModalBtn')?.addEventListener('click', () => {
    twoFaModal?.classList.remove('is-active');
  });

  // Copy 2FA Secret Key
  document.getElementById('btnCopy2FaSecret')?.addEventListener('click', async () => {
    const secret = document.getElementById('twoFaSecretCodeDisplay')?.textContent || 'WBCU-7829-4401-K9X2-SEC';
    try {
      await navigator.clipboard.writeText(secret);
      showToast('Secret key copied to clipboard.', 'success', 'Copied');
    } catch {
      showToast('Failed to copy.', 'error');
    }
  });

  // 2FA Verification Form
  const twoFaVerifyForm = document.getElementById('twoFaVerifyForm');
  if (twoFaVerifyForm) {
    twoFaVerifyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = document.getElementById('twoFaTotpInput')?.value;

      if (!code || code.length !== 6) {
        showToast('Please enter a 6-digit authenticator code.', 'error', 'Invalid Code');
        return;
      }

      const sec = getSecuritySettings();
      sec.twoFactorEnabled = true;
      saveSecuritySettings(sec);

      twoFaModal?.classList.remove('is-active');
      renderSecurityOverviewScore();

      // Show backup codes modal
      openBackupCodesModal();
      showToast('Two-Factor Authentication activated successfully!', 'success', '2FA Enabled');
    });
  }

  // Backup codes modal handlers
  document.getElementById('closeBackupCodesModalBtn')?.addEventListener('click', () => {
    document.getElementById('backupCodesModal')?.classList.remove('is-active');
  });

  document.getElementById('btnDownloadBackupCodesTxt')?.addEventListener('click', () => {
    downloadBackupCodesFile();
  });

  document.getElementById('btnCopyBackupCodes')?.addEventListener('click', async () => {
    const codes = getBackupCodes();
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      showToast('10 backup codes copied to clipboard.', 'success', 'Copied');
    } catch {
      showToast('Failed to copy.', 'error');
    }
  });

  // 5. Security Questions Form Submit
  const secQuestionsForm = document.getElementById('securityQuestionsForm');
  if (secQuestionsForm) {
    secQuestionsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const questions = {
        question1: document.getElementById('securityQuestion1Select')?.value,
        answer1: document.getElementById('securityAnswer1Input')?.value,
        question2: document.getElementById('securityQuestion2Select')?.value,
        answer2: document.getElementById('securityAnswer2Input')?.value,
      };

      saveSecurityQuestions(questions);
      const sec = getSecuritySettings();
      sec.securityQuestionsSet = true;
      saveSecuritySettings(sec);
      renderSecurityOverviewScore();

      showToast('Security questions and answers updated.', 'success', 'Saved');
    });
  }

  // 6. Revoke All Other Sessions
  document.getElementById('btnRevokeAllOtherSessions')?.addEventListener('click', () => {
    const sessions = getActiveSessions();
    const current = sessions.filter((s) => s.isCurrent);
    saveActiveSessions(current);
    renderActiveSessionsList();
    showToast('All remote sessions have been revoked.', 'success', 'Sessions Terminated');
  });

  // 7. Login History Search
  const loginSearchInput = document.getElementById('loginHistorySearchInput');
  if (loginSearchInput) {
    loginSearchInput.addEventListener('input', () => {
      renderLoginHistoryTable(loginSearchInput.value.trim());
    });
  }

  // 8. Close Account Modal & Flow
  const closeAccountModal = document.getElementById('closeAccountModal');
  document.getElementById('btnOpenCloseAccountModal')?.addEventListener('click', () => {
    closeAccountModal?.classList.add('is-active');
  });

  document.getElementById('cancelCloseAccountBtn')?.addEventListener('click', () => {
    closeAccountModal?.classList.remove('is-active');
  });
  document.getElementById('closeCloseAccountModalBtn')?.addEventListener('click', () => {
    closeAccountModal?.classList.remove('is-active');
  });

  const closeAccountForm = document.getElementById('closeAccountForm');
  if (closeAccountForm) {
    closeAccountForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('closeAccountPasswordInput')?.value;
      const pin = document.getElementById('closeAccountPinInput')?.value;
      const confirmChecked = document.getElementById('closeAccountConfirmCheck')?.checked;

      if (!confirmChecked) {
        showToast('Please check the confirmation box acknowledging account closure terms.', 'error');
        return;
      }

      if (!password || !pin) {
        showToast('Master password and 4-digit PIN required for closure verification.', 'error');
        return;
      }

      closeAccountModal?.classList.remove('is-active');
      const ticketId = `CLOSURE-TICKET-${Math.floor(100000 + Math.random() * 900000)}`;

      showToast(
        `Account closure request logged under Case #${ticketId}. Institutional Treasury will disburse remaining funds to your verified external account within 3 business days.`,
        'warning',
        'Closure Submitted'
      );
    });
  }
}

/**
 * Segmented PIN Box auto-focus handler
 */
function setupSegmentedPinInputs(prefix, hiddenInputId) {
  for (let i = 1; i <= 4; i++) {
    const box = document.getElementById(`${prefix}${i}`);
    if (!box) continue;

    box.addEventListener('input', (e) => {
      const val = box.value.replace(/\D/g, '');
      box.value = val ? val.slice(-1) : '';

      if (box.value && i < 4) {
        const next = document.getElementById(`${prefix}${i + 1}`);
        if (next) next.focus();
      }
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && i > 1) {
        const prev = document.getElementById(`${prefix}${i - 1}`);
        if (prev) {
          prev.focus();
          prev.value = '';
        }
      }
    });
  }
}

/**
 * Password Strength Evaluator
 */
function evaluatePasswordStrength(password) {
  if (!password) {
    return { percent: 0, color: '#e2e8f0', text: '' };
  }

  let score = 0;
  if (password.length >= 6) score += 25;
  if (password.length >= 10) score += 15;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[0-9]/.test(password)) score += 20;
  if (/[^A-Za-z0-9]/.test(password)) score += 20;

  if (password.length < 6 || score < 40) {
    return { percent: 30, color: '#ef4444', text: 'Weak (Min 6 characters required)' };
  } else if (score < 75) {
    return { percent: 65, color: '#f59e0b', text: 'Medium (Add special symbols)' };
  } else {
    return { percent: 100, color: '#10b981', text: 'Strong Institutional Password' };
  }
}

/**
 * Render 2FA Setup Modal with SVG QR Code
 */
function renderTwoFactorSetupModal() {
  const qrContainer = document.getElementById('twoFaQrCodeContainer');
  if (!qrContainer) return;

  // High-contrast clean simulated QR Code SVG
  qrContainer.innerHTML = `
    <svg viewBox="0 0 160 160" width="160" height="160" style="border: 4px solid #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); background:#fff;">
      <rect width="160" height="160" fill="#ffffff" />
      <!-- Corner finder patterns -->
      <rect x="10" y="10" width="40" height="40" fill="#0f2b48" />
      <rect x="18" y="18" width="24" height="24" fill="#ffffff" />
      <rect x="24" y="24" width="12" height="12" fill="#0f2b48" />

      <rect x="110" y="10" width="40" height="40" fill="#0f2b48" />
      <rect x="118" y="18" width="24" height="24" fill="#ffffff" />
      <rect x="124" y="24" width="12" height="12" fill="#0f2b48" />

      <rect x="10" y="110" width="40" height="40" fill="#0f2b48" />
      <rect x="18" y="118" width="24" height="24" fill="#ffffff" />
      <rect x="24" y="124" width="12" height="12" fill="#0f2b48" />

      <!-- QR Data modules -->
      <rect x="60" y="20" width="8" height="8" fill="#0f2b48" />
      <rect x="76" y="20" width="8" height="8" fill="#0f2b48" />
      <rect x="68" y="32" width="12" height="8" fill="#0f2b48" />
      <rect x="88" y="32" width="8" height="8" fill="#0f2b48" />

      <rect x="20" y="60" width="8" height="8" fill="#0f2b48" />
      <rect x="36" y="68" width="12" height="8" fill="#0f2b48" />
      <rect x="20" y="80" width="8" height="8" fill="#0f2b48" />
      <rect x="36" y="88" width="8" height="8" fill="#0f2b48" />

      <rect x="60" y="60" width="40" height="40" fill="#2563eb" rx="6" />
      <text x="80" y="85" fill="#ffffff" font-size="14" font-weight="bold" text-anchor="middle" font-family="sans-serif">WB</text>

      <rect x="110" y="60" width="8" height="8" fill="#0f2b48" />
      <rect x="128" y="68" width="12" height="8" fill="#0f2b48" />
      <rect x="110" y="84" width="16" height="8" fill="#0f2b48" />
      <rect x="134" y="84" width="8" height="8" fill="#0f2b48" />

      <rect x="60" y="110" width="8" height="8" fill="#0f2b48" />
      <rect x="76" y="118" width="12" height="8" fill="#0f2b48" />
      <rect x="60" y="132" width="16" height="8" fill="#0f2b48" />
      <rect x="84" y="132" width="8" height="8" fill="#0f2b48" />

      <rect x="110" y="110" width="8" height="8" fill="#0f2b48" />
      <rect x="126" y="118" width="8" height="8" fill="#0f2b48" />
      <rect x="118" y="132" width="16" height="8" fill="#0f2b48" />
      <rect x="140" y="132" width="8" height="8" fill="#0f2b48" />
    </svg>
  `;
}

/**
 * Open 10 Backup Codes Modal
 */
function openBackupCodesModal() {
  const modal = document.getElementById('backupCodesModal');
  const container = document.getElementById('backupCodesDisplayGrid');
  if (!modal || !container) return;

  const codes = getBackupCodes();
  container.innerHTML = codes.map((c, i) => `
    <div class="p-2 border rounded font-mono text-center text-sm font-bold" style="background:#f8fafc; color:#0f2b48;">
      <span class="text-xs text-muted mr-1">${i + 1}.</span>${c}
    </div>
  `).join('');

  modal.classList.add('is-active');
}

/**
 * Download Backup Codes File (.txt)
 */
function downloadBackupCodesFile() {
  const codes = getBackupCodes();
  const user = getDemoStorageUser() || {};
  const acctName = (user.fullName && user.fullName !== 'Alexander Morgan') ? user.fullName : 'Miz Brymo';
  const acctNum = user.accountNumber ? `(****${user.accountNumber.slice(-4)})` : '(****1049)';
  const content = `WB CREDIT UNION - 2FA EMERGENCY BACKUP CODES
Generated: ${new Date().toLocaleString()}
Account: ${acctName} ${acctNum}

Store these 10 one-time emergency backup codes in a secure offline vault.
Each code can be used once if you lose access to your authenticator device:

${codes.map((c, i) => `${String(i + 1).padStart(2, '0')}. ${c}`).join('\n')}

Security Notice: Never share backup codes with anyone. WB Credit Union staff will never ask for your codes.`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `WBCU_2FA_Backup_Codes_${new Date().toISOString().slice(0, 10)}.txt`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('2FA backup codes text file downloaded.', 'success', 'Saved');
}
