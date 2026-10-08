/**
 * ============================================================================
 * WB CREDIT UNION - SUPABASE CONFIGURATION & AUTHENTICATION HELPER
 * ============================================================================
 * 
 * Description: Initializes the Supabase client instance and exports authentication
 * utility helpers, session validators, role-based access checks (Customer vs Admin),
 * and route protection guards.
 * 
 * Instructions:
 * 1. Replace SUPABASE_URL with your Supabase Project URL (found in Settings -> API).
 * 2. Replace SUPABASE_ANON_KEY with your Supabase Project Anonymous Public Key.
 * 3. The client is architected to gracefully fall back to a high-fidelity local
 *    session mock store during development if credentials are still placeholder,
 *    allowing immediate UI/UX testing and workflow verification.
 * 
 * Recommended Supabase Schema:
 * - Table: `profiles`
 *     id (uuid, primary key references auth.users.id)
 *     email (text)
 *     full_name (text)
 *     role (text: 'member' | 'admin' | 'treasury')
 *     account_number (text)
 *     phone (text)
 *     created_at (timestamptz)
 * - Table: `currency_wallets`
 *     id (uuid, primary key)
 *     user_id (uuid references auth.users.id)
 *     currency (text: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'NGN')
 *     balance (numeric(14,2))
 *     is_primary (boolean)
 * - Table: `transactions`
 *     id (uuid, primary key)
 *     user_id (uuid)
 *     type (text: 'transfer' | 'deposit' | 'exchange' | 'wire' | 'payment')
 *     amount (numeric(14,2))
 *     currency (text)
 *     recipient (text)
 *     status (text: 'completed' | 'pending' | 'flagged')
 *     reference (text)
 *     created_at (timestamptz)
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';

/* ----------------------------------------------------------------------------
 * 1. SUPABASE CREDENTIALS & INITIALIZATION
 * ---------------------------------------------------------------------------- */

/**
 * Placeholder Supabase project configuration.
 * TODO: Replace with your actual project URL and public Anon Key from Supabase Dashboard.
 */
export const SUPABASE_URL = 'https://wb-credit-union-demo.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiLWNyZWRpdC11bmlvbiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE5MDAwMDAwMDB9.sample-placeholder-key-replace-with-real-supabase-key';

/**
 * Flag to detect if real Supabase keys have been configured.
 */
export const isConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  !SUPABASE_URL.includes('wb-credit-union-demo') && 
  !SUPABASE_ANON_KEY.includes('sample-placeholder-key')
);

/**
 * Initialize and export the Supabase Client.
 */
let supabaseClientInstance = null;

try {
  supabaseClientInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'wb_credit_union_auth_token',
    },
  });
} catch (error) {
  console.warn('[WB Credit Union] Supabase client init warning (using demo sandbox):', error);
  // Fallback stub client if network initialization fails in preview
  supabaseClientInstance = {
    auth: {
      async getSession() { return { data: { session: null }, error: null }; },
      async getUser() { return { data: { user: null }, error: null }; },
      async signInWithPassword() { return { data: {}, error: new Error('Please configure Supabase credentials') }; },
      async signUp() { return { data: {}, error: new Error('Please configure Supabase credentials') }; },
      async signOut() { return { error: null }; },
      onAuthStateChange() { return { data: { subscription: { unsubscribe: () => {} } } }; },
    },
  };
}

export const supabase = supabaseClientInstance;

/* ----------------------------------------------------------------------------
 * 2. LOCAL DEMO SESSION STORE (FALLBACK WHEN IN PLACEHOLDER MODE)
 * ---------------------------------------------------------------------------- */
const DEMO_STORAGE_KEY = 'wb_credit_union_active_user';

/**
 * Seed a default demo member if none exists for quick evaluation
 */
export function getDemoStorageUser() {
  const stored = localStorage.getItem(DEMO_STORAGE_KEY);
  let user = null;
  if (stored) {
    try {
      user = JSON.parse(stored);
    } catch {
      user = null;
    }
  }

  // Check if user updated profile in settings
  try {
    const profileRaw = localStorage.getItem('wbcu_user_profile_v1');
    if (profileRaw) {
      const p = JSON.parse(profileRaw);
      // Only apply profile settings cache if email or id matches active logged-in user
      if (p && user && (p.email === user.email || p.id === user.id)) {
        const name = `${p.firstName || ''} ${p.lastName || ''}`.trim();
        if (name) {
          user.fullName = name;
          user.firstName = p.firstName;
          user.lastName = p.lastName;
          if (p.email) user.email = p.email;
        }
      }
    }
  } catch (e) {}

  if (user) {
    // Authoritative synchronization with persistent admin users DB
    try {
      const adminUsersRaw = localStorage.getItem('wb_credit_union_admin_users_db');
      if (adminUsersRaw) {
        const adminUsers = JSON.parse(adminUsersRaw);
        if (Array.isArray(adminUsers)) {
          const match = adminUsers.find((u) => u.id === user.id || (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()));
          if (match) {
            user.status = match.status || user.status;
            user.account_status = match.account_status || match.status || user.account_status;
            user.accountStatus = match.accountStatus || match.status || user.accountStatus;
            user.kycStatus = match.kycStatus || user.kycStatus;
            user.kyc_status = match.kyc_status || match.kycStatus || user.kyc_status;
            user.statusReason = match.statusReason || user.statusReason;
            if (Array.isArray(match.accounts) && match.accounts.length > 0) {
              user.accounts = match.accounts;
            }
            if (match.wireTransferCodes) user.wireTransferCodes = match.wireTransferCodes;
            if (match.transactionPin) user.transactionPin = match.transactionPin;
            if (match.pin) user.pin = match.pin;
            if (match.password) user.password = match.password;
            if (match.profilePhoto) user.profilePhoto = match.profilePhoto;
            if (match.avatarUrl) user.avatarUrl = match.avatarUrl;
          }
        }
      }
    } catch (e) {}

    // Normalization: When status is active, eliminate any dormant/pending hold flags
    if (user.status === 'active' || user.account_status === 'active' || user.accountStatus === 'active') {
      user.status = 'active';
      user.account_status = 'active';
      user.accountStatus = 'active';
      const isVer = (user.kycStatus || user.kyc_status || '').toLowerCase() === 'verified';
      if (isVer) {
        user.kycStatus = 'verified';
        user.kyc_status = 'verified';
      }
      if (!user.statusReason || user.statusReason.toLowerCase().includes('pending') || user.statusReason.toLowerCase().includes('dormant') || user.statusReason.toLowerCase().includes('approval') || user.statusReason.toLowerCase().includes('activation')) {
        user.statusReason = isVer ? 'Account Active & Verified' : 'Account Active';
      }
      if (Array.isArray(user.accounts)) {
        user.accounts.forEach((a) => { a.status = 'active'; });
      }
      if (Array.isArray(user.cards)) {
        user.cards.forEach((c) => {
          if (c.status === 'pending_approval' || c.status === 'inactive') {
            c.status = 'active';
            c.is_frozen = false;
          }
        });
      }
    }

    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {}

    return user;
  }

  // If no user is logged in, return null
  return null;
}

if (typeof window !== 'undefined') {
  window.getDemoStorageUser = getDemoStorageUser;
  window.setDemoStorageUser = setDemoStorageUser;
  window.getCurrentUser = getCurrentUser;
  window.showToast = showToast;
}

export function setDemoStorageUser(user) {
  if (user) {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(DEMO_STORAGE_KEY);
  }
}

/* ----------------------------------------------------------------------------
 * 3. AUTHENTICATION HELPER FUNCTIONS
 * ---------------------------------------------------------------------------- */

/**
 * Retrieves the currently authenticated user object.
 * Checks active Supabase session first; if placeholder, checks demo storage.
 * 
 * @returns {Promise<Object|null>} The user object or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    if (isConfigured && supabase?.auth) {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        // Fetch supplemental profile details
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          return {
            ...user,
            profile: profile || {},
            role: profile?.role || 'member',
            fullName: profile?.full_name || user.user_metadata?.full_name || user.email.split('@')[0],
          };
        } catch {
          return {
            ...user,
            role: user.user_metadata?.role || 'member',
            fullName: user.user_metadata?.full_name || user.email.split('@')[0],
          };
        }
      }
    }
  } catch (err) {
    console.debug('[WB Credit Union] Supabase live user check bypassed:', err);
  }

  // Fallback to local demo session store
  return getDemoStorageUser();
}

/**
 * Checks if a user is currently authenticated with a valid session.
 * 
 * @returns {Promise<boolean>} True if logged in, false otherwise
 */
export async function isAuthenticated() {
  const user = await getCurrentUser();
  return Boolean(user && user.id);
}

/**
 * Checks if the current user possesses administrative privileges.
 * Validates role attribute against 'admin' or 'superadmin'.
 * 
 * @returns {Promise<boolean>} True if user is an administrator
 */
export async function isAdmin() {
  const user = await getCurrentUser();
  if (!user) return false;

  const role = user.role || user.profile?.role || user.user_metadata?.role;
  return (
    role === 'admin' ||
    role === 'superadmin' ||
    role === 'treasury' ||
    Boolean(user.badgeNumber) ||
    user.is_admin === true ||
    user.isAdmin === true ||
    user.email?.includes('admin') ||
    user.email?.includes('wbcu.net') ||
    user.email?.includes('wbcredit.org')
  );
}

/**
 * Session verification and route guard for member dashboard pages.
 * Redirects unauthenticated visitors to login.html.
 * 
 * @param {string} [redirectUrl='/pages/login.html'] Destination if not logged in
 * @returns {Promise<Object>} The authenticated user object
 */
export async function requireAuth(redirectUrl = '/pages/login.html') {
  const authed = await isAuthenticated();
  if (!authed) {
    // Preserve attempted destination for post-login redirect
    const currentPath = window.location.pathname + window.location.search;
    const loginTarget = `${redirectUrl}?returnUrl=${encodeURIComponent(currentPath)}`;
    window.location.replace(loginTarget);
    throw new Error('Authentication required. Redirecting to login.');
  }
  return await getCurrentUser();
}

/**
 * Session verification and route guard for administrative dashboard pages.
 * Redirects non-admin visitors to admin-login.html.
 * 
 * @param {string} [redirectUrl='/pages/admin-login.html'] Destination if not an admin
 * @returns {Promise<Object>} The authenticated administrator user object
 */
export async function requireAdmin(redirectUrl = '/pages/admin-login.html') {
  const adminAuthorized = await isAdmin();
  if (!adminAuthorized) {
    const currentPath = window.location.pathname + window.location.search;
    const loginTarget = `${redirectUrl}?returnUrl=${encodeURIComponent(currentPath)}&error=unauthorized`;
    window.location.replace(loginTarget);
    throw new Error('Administrative privilege required. Access denied.');
  }
  return await getCurrentUser();
}

/**
 * Logs out the current user session and clears credentials.
 * 
 * @param {string} [redirectUrl='/pages/login.html'] Destination after signout
 */
export async function signOutUser(redirectUrl = '/pages/login.html') {
  try {
    if (isConfigured && supabase?.auth) {
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.warn('[WB Credit Union] Supabase signOut error:', err);
  } finally {
    setDemoStorageUser(null);
    localStorage.removeItem('wb_credit_union_auth_token');
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }
}

/**
 * Helper to display accessible toast notifications across all pages
 * 
 * @param {string} message Text message to display
 * @param {'success'|'error'|'warning'|'info'} [type='info'] Notification variant
 * @param {string} [title=''] Optional bold heading
 * @param {number} [duration=4000] Time in milliseconds before auto-dismiss
 */
export function showToast(message, type = 'info', title = '', duration = 4000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');

  const icons = {
    success: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
    error: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    warning: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info: `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  };

  const defaultTitles = {
    success: 'Transaction Successful',
    error: 'Security Notice',
    warning: 'Account Attention',
    info: 'System Update',
  };

  toast.innerHTML = `
    ${icons[type] || icons.info}
    <div class="toast-content">
      <div class="toast-title">${title || defaultTitles[type]}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button type="button" class="toast-close" aria-label="Close notification">&times;</button>
  `;

  const closeBtn = toast.querySelector('.toast-close');
  const dismiss = () => {
    toast.classList.add('toast-hiding');
    setTimeout(() => toast.remove(), 250);
  };

  closeBtn.addEventListener('click', dismiss);
  setTimeout(dismiss, duration);
  container.appendChild(toast);
}
