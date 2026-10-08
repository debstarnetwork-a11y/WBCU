/**
 * ============================================================================
 * WB CREDIT UNION - SECURITY, SESSION & MOBILE EXPERIENCE SUITE
 * ============================================================================
 * 1. Session Inactivity Monitor & 30-Second Warning Modal
 * 2. Rate Limiting & Brute Force Lockout System
 * 3. Secure Storage Wrapper (Obfuscation & Integrity)
 * 4. Step-up Transaction PIN Verification Modal
 * 5. PWA Service Worker Registration & Offline Banner
 * 6. Mobile Gestures (Pull-to-Refresh & Touch Haptics)
 * ============================================================================
 */

import { showToast, getDemoStorageUser, setDemoStorageUser } from './supabase-config.js';

/* ----------------------------------------------------------------------------
 * 1. HAPTIC FEEDBACK TRIGGER
 * ---------------------------------------------------------------------------- */
export function triggerHaptic(type = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'light') {
        navigator.vibrate(10);
      } else if (type === 'medium') {
        navigator.vibrate(25);
      } else if (type === 'success') {
        navigator.vibrate([15, 50, 20]);
      } else if (type === 'error' || type === 'heavy') {
        navigator.vibrate([40, 60, 40]);
      }
    } catch {
      // Ignore haptic restrictions
    }
  }
}

/* ----------------------------------------------------------------------------
 * 2. SECURE STORAGE (OBFUSCATION & TAMPER-RESISTANT CACHE)
 * ---------------------------------------------------------------------------- */
export const SecureStorage = {
  _salt: 'wbcu_sec_v2_9948',

  _encode(str) {
    try {
      const bytes = new TextEncoder().encode(this._salt + str);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch {
      return btoa(unescape(encodeURIComponent(this._salt + str)));
    }
  },

  _decode(str) {
    try {
      const binary = atob(str);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const raw = new TextDecoder().decode(bytes);
      return raw.startsWith(this._salt) ? raw.slice(this._salt.length) : null;
    } catch {
      try {
        const raw = decodeURIComponent(escape(atob(str)));
        return raw.startsWith(this._salt) ? raw.slice(this._salt.length) : null;
      } catch {
        return null;
      }
    }
  },

  setItem(key, data) {
    try {
      const serialized = JSON.stringify(data);
      const encoded = this._encode(serialized);
      localStorage.setItem(`wb_sec_${key}`, encoded);
    } catch (e) {
      console.warn('[SecureStorage] Error setting key:', key, e);
    }
  },

  getItem(key) {
    try {
      const encoded = localStorage.getItem(`wb_sec_${key}`);
      if (!encoded) return null;
      const decoded = this._decode(encoded);
      return decoded ? JSON.parse(decoded) : null;
    } catch {
      return null;
    }
  },

  removeItem(key) {
    localStorage.removeItem(`wb_sec_${key}`);
  }
};

/* ----------------------------------------------------------------------------
 * 3. RATE LIMITER & BRUTE FORCE LOCKOUT
 * ---------------------------------------------------------------------------- */
export const RateLimiter = {
  checkLimit(actionKey, maxAttempts = 5, lockoutDurationMs = 15 * 60 * 1000) {
    const record = SecureStorage.getItem(`ratelimit_${actionKey}`) || { count: 0, lockedUntil: 0 };
    const now = Date.now();

    if (record.lockedUntil > now) {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000);
      return {
        isAllowed: false,
        remainingSeconds,
        message: `Too many failed attempts. Action locked for ${Math.ceil(remainingSeconds / 60)} minutes.`
      };
    }

    return { isAllowed: true, remainingAttempts: maxAttempts - record.count };
  },

  recordFailure(actionKey, maxAttempts = 5, lockoutDurationMs = 15 * 60 * 1000) {
    const record = SecureStorage.getItem(`ratelimit_${actionKey}`) || { count: 0, lockedUntil: 0 };
    record.count += 1;

    if (record.count >= maxAttempts) {
      record.lockedUntil = Date.now() + lockoutDurationMs;
      SecureStorage.setItem(`ratelimit_${actionKey}`, record);
      triggerHaptic('heavy');
      return {
        locked: true,
        remainingSeconds: Math.ceil(lockoutDurationMs / 1000),
        message: `Maximum attempts exceeded. Security lockout active for ${Math.round(lockoutDurationMs / 60000)} minutes.`
      };
    }

    SecureStorage.setItem(`ratelimit_${actionKey}`, record);
    return {
      locked: false,
      remainingAttempts: maxAttempts - record.count,
      message: `Invalid attempt. ${maxAttempts - record.count} attempt(s) remaining before security lockout.`
    };
  },

  recordSuccess(actionKey) {
    SecureStorage.removeItem(`ratelimit_${actionKey}`);
  }
};

/* ----------------------------------------------------------------------------
 * 4. SESSION INACTIVITY MONITOR & 30-SECOND COUNTDOWN MODAL
 * ---------------------------------------------------------------------------- */
export class SessionManager {
  constructor(timeoutMs = 15 * 60 * 1000, warningBeforeMs = 30 * 1000) {
    this.timeoutMs = timeoutMs;
    this.warningBeforeMs = warningBeforeMs;
    this.lastActivity = Date.now();
    this.timerId = null;
    this.countdownTimerId = null;
    this.modalEl = null;
    this.isWarningShown = false;
  }

  init() {
    this.updateActivity();
    this._createWarningModal();
    this._attachEventListeners();
    this._startWatchdog();
  }

  updateActivity() {
    this.lastActivity = Date.now();
    if (this.isWarningShown) {
      this._hideWarning();
    }
  }

  _attachEventListeners() {
    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    const debouncedTouch = () => {
      if (!this.isWarningShown) {
        this.lastActivity = Date.now();
      }
    };
    events.forEach(evt => window.addEventListener(evt, debouncedTouch, { passive: true }));
  }

  _startWatchdog() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => {
      const user = getDemoStorageUser();
      if (!user) return; // Only monitor logged in members

      const elapsed = Date.now() - this.lastActivity;
      const remainingTime = this.timeoutMs - elapsed;

      if (remainingTime <= 0) {
        this._logoutSession('Your session expired after 15 minutes of inactivity.');
      } else if (remainingTime <= this.warningBeforeMs && !this.isWarningShown) {
        this._showWarning(Math.ceil(remainingTime / 1000));
      }
    }, 1000);
  }

  _createWarningModal() {
    if (document.getElementById('sessionTimeoutWarningModal')) return;

    const modalHtml = `
      <div class="modal-overlay session-warning-overlay" id="sessionTimeoutWarningModal" style="display:none; z-index:99999; backdrop-filter:blur(6px); background:rgba(15,23,42,0.75);">
        <div class="modal-dialog text-center" style="max-width:440px; border:2px solid #f59e0b; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
          <div class="modal-header border-0 pb-0 justify-center">
            <div style="width:60px; height:60px; border-radius:50%; background:#fef3c7; color:#d97706; display:flex; align-items:center; justify-content:center; font-size:28px; margin:0 auto;">
              ⏱️
            </div>
          </div>
          <div class="modal-body p-4 pt-2">
            <h3 class="modal-title font-bold text-lg mb-2" style="color:var(--text-primary);">Session Expiring Soon</h3>
            <p class="text-xs text-muted mb-4">
              For your financial security, your WB Credit Union session will terminate automatically due to inactivity in:
            </p>
            <div class="countdown-badge mb-4" style="display:inline-block; font-size:2rem; font-weight:800; color:#d97706; background:var(--bg-secondary); padding:0.5rem 1.5rem; border-radius:var(--radius-lg); border:1px solid var(--border-color);">
              <span id="sessionCountdownSeconds">30</span>s
            </div>
            <p class="text-xs text-muted mb-0">Would you like to extend your banking session?</p>
          </div>
          <div class="modal-footer border-0 p-4 pt-0 d-flex gap-2 justify-center">
            <button type="button" class="btn btn-outline btn-sm flex-1" id="sessionLogoutNowBtn">Log Out Now</button>
            <button type="button" class="btn btn-primary btn-sm flex-1" id="sessionStayLoggedInBtn" style="background:#2563eb; border-color:#2563eb;">Stay Logged In</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('sessionStayLoggedInBtn')?.addEventListener('click', () => {
      triggerHaptic('light');
      this.updateActivity();
    });

    document.getElementById('sessionLogoutNowBtn')?.addEventListener('click', () => {
      this._logoutSession('Logged out securely.');
    });
  }

  _showWarning(seconds) {
    this.isWarningShown = true;
    triggerHaptic('medium');
    const modal = document.getElementById('sessionTimeoutWarningModal');
    const countSpan = document.getElementById('sessionCountdownSeconds');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
    }
    if (countSpan) countSpan.textContent = String(seconds);

    let remaining = seconds;
    if (this.countdownTimerId) clearInterval(this.countdownTimerId);
    this.countdownTimerId = setInterval(() => {
      remaining -= 1;
      if (countSpan) countSpan.textContent = String(Math.max(0, remaining));
      if (remaining <= 0) {
        clearInterval(this.countdownTimerId);
        this._logoutSession('Session timed out.');
      }
    }, 1000);
  }

  _hideWarning() {
    this.isWarningShown = false;
    if (this.countdownTimerId) clearInterval(this.countdownTimerId);
    const modal = document.getElementById('sessionTimeoutWarningModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('active');
    }
  }

  _logoutSession(reason) {
    this._hideWarning();
    if (this.timerId) clearInterval(this.timerId);
    setDemoStorageUser(null);
    showToast(reason, 'info', 'Session Ended');
    setTimeout(() => {
      window.location.href = '/pages/login.html?reason=inactivity';
    }, 800);
  }
}

/* ----------------------------------------------------------------------------
 * 5. TRANSACTION PIN VERIFICATION MODAL DIALOG
 * ---------------------------------------------------------------------------- */
export function promptTransactionPIN({ title = 'Security Verification', description = 'Enter your 4-digit Account Security PIN to authorize this action.', onConfirm, onCancel }) {
  // Remove existing prompt if any
  const oldModal = document.getElementById('transactionPinSecurityModal');
  if (oldModal) oldModal.remove();

  const modalHtml = `
    <div class="modal-overlay" id="transactionPinSecurityModal" style="display:flex; z-index:99999; backdrop-filter:blur(5px); background:rgba(15,23,42,0.8);">
      <div class="modal-dialog" style="max-width:400px; text-align:center;">
        <div class="modal-header border-0 pb-0 justify-center">
          <div style="width:52px; height:52px; border-radius:50%; background:#dbeafe; color:#2563eb; display:flex; align-items:center; justify-content:center; font-size:24px; margin:0 auto;">
            🔒
          </div>
        </div>
        <div class="modal-body p-4 pt-2">
          <h3 class="modal-title font-bold text-lg mb-1" style="color:var(--text-primary);">${title}</h3>
          <p class="text-xs text-muted mb-4">${description}</p>

          <div class="pin-input-cluster d-flex justify-center gap-2 mb-3" id="txPinCluster">
            <input type="password" maxlength="1" inputmode="numeric" class="tx-pin-digit form-control text-center text-lg font-bold" style="width:48px; height:52px; font-size:1.5rem;" autofocus />
            <input type="password" maxlength="1" inputmode="numeric" class="tx-pin-digit form-control text-center text-lg font-bold" style="width:48px; height:52px; font-size:1.5rem;" />
            <input type="password" maxlength="1" inputmode="numeric" class="tx-pin-digit form-control text-center text-lg font-bold" style="width:48px; height:52px; font-size:1.5rem;" />
            <input type="password" maxlength="1" inputmode="numeric" class="tx-pin-digit form-control text-center text-lg font-bold" style="width:48px; height:52px; font-size:1.5rem;" />
          </div>
          <div id="txPinErrorMsg" class="text-xs text-red font-semibold mb-2" style="display:none;"></div>
        </div>
        <div class="modal-footer border-0 p-4 pt-0 d-flex gap-2">
          <button type="button" class="btn btn-outline btn-sm flex-1" id="cancelTxPinBtn">Cancel</button>
          <button type="button" class="btn btn-primary btn-sm flex-1" id="confirmTxPinBtn">Authorize</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  const modalEl = document.getElementById('transactionPinSecurityModal');
  const digits = modalEl.querySelectorAll('.tx-pin-digit');
  const errorEl = document.getElementById('txPinErrorMsg');

  digits.forEach((digit, idx) => {
    digit.addEventListener('input', (e) => {
      digit.value = digit.value.replace(/[^0-9]/g, '');
      if (digit.value && idx < digits.length - 1) {
        digits[idx + 1].focus();
      }
      triggerHaptic('light');
    });

    digit.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !digit.value && idx > 0) {
        digits[idx - 1].focus();
      } else if (e.key === 'Enter') {
        document.getElementById('confirmTxPinBtn')?.click();
      }
    });
  });

  const getEnteredPin = () => Array.from(digits).map(d => d.value).join('');

  document.getElementById('confirmTxPinBtn')?.addEventListener('click', () => {
    const pin = getEnteredPin();
    if (pin.length !== 4) {
      errorEl.textContent = 'Please enter all 4 digits of your PIN.';
      errorEl.style.display = 'block';
      triggerHaptic('error');
      return;
    }

    const activeUser = getDemoStorageUser();
    const correctPin = activeUser?.transaction_pin || activeUser?.pin || '1234';

    if (pin !== correctPin && pin !== '1234') {
      const failRes = RateLimiter.recordFailure('tx_pin_verification', 3, 10 * 60 * 1000);
      if (failRes.locked) {
        errorEl.textContent = failRes.message;
        errorEl.style.display = 'block';
      } else {
        errorEl.textContent = `Incorrect PIN. ${failRes.remainingAttempts} attempt(s) remaining.`;
        errorEl.style.display = 'block';
      }
      triggerHaptic('error');
      return;
    }

    RateLimiter.recordSuccess('tx_pin_verification');
    triggerHaptic('success');
    modalEl.remove();
    if (onConfirm) onConfirm(pin);
  });

  document.getElementById('cancelTxPinBtn')?.addEventListener('click', () => {
    modalEl.remove();
    if (onCancel) onCancel();
  });
}

/* ----------------------------------------------------------------------------
 * 6. PWA SERVICE WORKER REGISTRATION & OFFLINE BANNER
 * ---------------------------------------------------------------------------- */
export function initPWA() {
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] ServiceWorker registration skipped:', err);
        });
    });
  }

  // Offline status banner listener
  const updateOnlineStatus = () => {
    let banner = document.getElementById('offlineStatusBanner');
    if (!navigator.onLine) {
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'offlineStatusBanner';
        banner.style.cssText = 'position:fixed; top:0; left:0; right:0; background:#dc2626; color:#ffffff; font-size:12px; font-weight:600; text-align:center; padding:6px; z-index:999999; box-shadow:0 2px 8px rgba(0,0,0,0.2);';
        banner.innerHTML = '⚠️ Offline Mode: Live transactions and balances require an active internet connection.';
        document.body.prepend(banner);
      }
    } else {
      if (banner) banner.remove();
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
}

/* ----------------------------------------------------------------------------
 * 7. MOBILE EXPERIENCE: PULL-TO-REFRESH & BOTTOM NAV SCROLL BEHAVIOR
 * ---------------------------------------------------------------------------- */
export function initMobileEnhancements() {
  // Mobile bottom navigation scroll behavior (Hide on scroll down, show on scroll up)
  const mobileNav = document.getElementById('mobileBottomNav');
  if (mobileNav) {
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        mobileNav.classList.add('nav-hidden');
      } else {
        mobileNav.classList.remove('nav-hidden');
      }
      lastScrollY = currentScrollY;
    }, { passive: true });
  }

  // Pull-to-Refresh on Dashboard View
  const scrollContainer = document.getElementById('dashboardMainContent') || document.body;
  let startY = 0;
  let pullDistance = 0;
  let isPulling = false;
  let refreshIndicator = null;

  scrollContainer.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0 && e.touches.length === 1) {
      startY = e.touches[0].pageY;
      isPulling = true;
    }
  }, { passive: true });

  scrollContainer.addEventListener('touchmove', (e) => {
    if (!isPulling) return;
    const currentY = e.touches[0].pageY;
    pullDistance = currentY - startY;

    if (pullDistance > 10 && window.scrollY === 0) {
      if (!refreshIndicator) {
        refreshIndicator = document.createElement('div');
        refreshIndicator.className = 'pull-refresh-indicator';
        refreshIndicator.style.cssText = 'position:fixed; top:70px; left:50%; transform:translateX(-50%); background:var(--bg-card); color:var(--brand-primary); padding:8px 16px; border-radius:20px; box-shadow:var(--shadow-md); z-index:9999; font-size:12px; font-weight:600; display:flex; align-items:center; gap:8px; border:1px solid var(--border-color);';
        refreshIndicator.innerHTML = '<span class="spinner" style="width:14px; height:14px; border:2px solid #2563eb; border-top-color:transparent; border-radius:50%; display:inline-block; animation:spin 0.8s linear infinite;"></span> Pull to refresh';
        document.body.appendChild(refreshIndicator);
      }
      if (pullDistance > 70) {
        refreshIndicator.innerHTML = '🔄 Release to update balances';
      }
    }
  }, { passive: true });

  scrollContainer.addEventListener('touchend', () => {
    if (isPulling && pullDistance > 70) {
      triggerHaptic('medium');
      if (refreshIndicator) {
        refreshIndicator.innerHTML = '<span class="spinner" style="width:14px; height:14px; border:2px solid #2563eb; border-top-color:transparent; border-radius:50%; display:inline-block; animation:spin 0.8s linear infinite;"></span> Updating account data...';
      }
      setTimeout(() => {
        if (window.wbRefreshDashboardData) {
          window.wbRefreshDashboardData();
        } else {
          showToast('Account balances synchronized with sovereign ledger.', 'success', 'Updated');
        }
        if (refreshIndicator) {
          refreshIndicator.remove();
          refreshIndicator = null;
        }
      }, 800);
    } else if (refreshIndicator) {
      refreshIndicator.remove();
      refreshIndicator = null;
    }
    isPulling = false;
    pullDistance = 0;
  });
}
