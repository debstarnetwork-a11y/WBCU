/**
 * ============================================================================
 * WB CREDIT UNION - THEME MANAGER & CLIENT UTILITIES (js/theme.js)
 * ============================================================================
 * 
 * Handles:
 * - Light / Dark mode toggling and state management
 * - Synchronization across tabs with localStorage
 * - System preference detection (prefers-color-scheme)
 * - Anti-flash instant initialization
 * - Universal UI theme toggle button listener and icon synchronization
 * - Core banking formatters and validation helpers (BankUtils)
 * ============================================================================
 */

export class ThemeManager {
  constructor() {
    this.STORAGE_KEY = 'wbcu_theme_preference';
    this.theme = 'light';
    this._handleToggleClick = this._handleToggleClick.bind(this);
  }

  /**
   * Initialize theme from localStorage or system preference
   */
  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      this.setTheme(saved, false);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.setTheme('dark', false);
    } else {
      this.setTheme('light', false);
    }

    // Listen for OS system theme preference changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', (e) => {
          if (!localStorage.getItem(this.STORAGE_KEY)) {
            this.setTheme(e.matches ? 'dark' : 'light', false);
          }
        });
      } else if (mediaQuery.addListener) {
        // Fallback for older WebKit
        mediaQuery.addListener((e) => {
          if (!localStorage.getItem(this.STORAGE_KEY)) {
            this.setTheme(e.matches ? 'dark' : 'light', false);
          }
        });
      }
    }

    // Attach click listeners to all theme toggle buttons
    this.attachEventListeners();
    this.updateToggleButtons();

    // Re-attach listeners when DOM mutates or loads
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.attachEventListeners();
        this.updateToggleButtons();
      });
    }
  }

  /**
   * Get current theme ('light' | 'dark')
   */
  getTheme() {
    return document.documentElement.getAttribute('data-theme') || this.theme || 'light';
  }

  /**
   * Apply theme and persist preference
   */
  setTheme(theme, save = true) {
    this.theme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this.theme);
    
    if (save) {
      try {
        localStorage.setItem(this.STORAGE_KEY, this.theme);
      } catch (err) {
        console.warn('LocalStorage unavailable for theme saving', err);
      }
    }

    this.updateToggleButtons();

    // Broadcast custom event for charts, canvas or modules that need recalculation
    window.dispatchEvent(new CustomEvent('wbcu-theme-change', { detail: { theme: this.theme } }));
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: this.theme } }));
  }

  /**
   * Toggle between light and dark modes
   */
  toggle() {
    const next = this.getTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(next, true);
    return next;
  }

  /**
   * Attach click event listeners to theme toggle buttons
   */
  attachEventListeners() {
    const buttons = document.querySelectorAll('.theme-toggle-btn, [data-action="toggle-theme"], #themeToggleBtn, #themeToggleNavBtn, #adminThemeToggleBtn');
    buttons.forEach((btn) => {
      btn.removeEventListener('click', this._handleToggleClick);
      btn.addEventListener('click', this._handleToggleClick);
    });
  }

  _handleToggleClick(e) {
    e.preventDefault();
    this.toggle();
  }

  /**
   * Update visual states of all theme toggle buttons across page
   */
  updateToggleButtons() {
    const isDark = this.getTheme() === 'dark';
    const buttons = document.querySelectorAll('.theme-toggle-btn, [data-action="toggle-theme"], #themeToggleBtn, #themeToggleNavBtn, #adminThemeToggleBtn');
    
    buttons.forEach((btn) => {
      btn.setAttribute('aria-label', isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme');
      btn.setAttribute('title', isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme');
      btn.setAttribute('data-current-theme', isDark ? 'dark' : 'light');

      const sunIcon = btn.querySelector('.theme-icon-sun');
      const moonIcon = btn.querySelector('.theme-icon-moon');
      const textLabel = btn.querySelector('.theme-toggle-label');

      if (sunIcon) {
        sunIcon.style.display = isDark ? 'inline-block' : 'none';
      }
      if (moonIcon) {
        moonIcon.style.display = isDark ? 'none' : 'inline-block';
      }
      if (textLabel) {
        textLabel.textContent = isDark ? 'Light Mode' : 'Dark Mode';
      }
    });
  }
}

/**
 * Universal Banking Utility Functions
 */
export const BankUtils = {
  /**
   * Format currency values with symbol and proper decimals
   */
  formatCurrency(amount, currency = 'USD') {
    const num = Number(amount) || 0;
    const symbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      CHF: 'CHF ',
      CAD: 'CA$',
      AUD: 'A$',
      JPY: '¥',
      NGN: '₦',
      BTC: '₿',
      ETH: 'Ξ',
      SOL: 'SOL ',
      USDC: '$'
    };
    
    const isCrypto = ['BTC', 'ETH', 'SOL'].includes(currency);
    const decimals = isCrypto ? 4 : (currency === 'JPY' ? 0 : 2);
    const prefix = symbols[currency] || `${currency} `;
    
    return `${prefix}${num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  },

  /**
   * Format dates to human readable string
   */
  formatDate(date, format = 'medium') {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);

    if (format === 'short') {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    if (format === 'time') {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    if (format === 'full') {
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  },

  /**
   * Calculate age from Date of Birth string (YYYY-MM-DD)
   */
  calculateAge(dob) {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return Math.max(0, age);
  },

  /**
   * Validate Credit/Debit Card number using Luhn Algorithm (Mod 10)
   */
  validateLuhn(number) {
    if (!number) return false;
    const cleanNumber = String(number).replace(/\D/g, '');
    if (cleanNumber.length < 13 || cleanNumber.length > 19) return false;

    let sum = 0;
    let shouldDouble = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber.charAt(i), 10);

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return (sum % 10) === 0;
  },

  /**
   * Truncate text with ellipsis
   */
  truncate(text, length = 20) {
    if (!text) return '';
    const str = String(text);
    if (str.length <= length) return str;
    return `${str.slice(0, length)}...`;
  },

  /**
   * Format masked card number (**** **** **** 1234)
   */
  maskCardNumber(cardNumber) {
    if (!cardNumber) return '**** **** **** ****';
    const clean = String(cardNumber).replace(/\s+/g, '');
    const last4 = clean.slice(-4);
    return `•••• •••• •••• ${last4}`;
  },

  /**
   * Format 16-digit card number with spaces (1234 5678 9012 3456)
   */
  formatCardNumber(cardNumber) {
    if (!cardNumber) return '';
    const clean = String(cardNumber).replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(\d{4})(?=\d)/g, '$1 ');
  }
};

// Singleton Theme Instance
export const themeManager = new ThemeManager();

// Expose globally for inline scripts or external modules
if (typeof window !== 'undefined') {
  window.ThemeManager = ThemeManager;
  window.themeManager = themeManager;
  window.BankUtils = BankUtils;
  
  // Auto init immediately
  themeManager.init();
}

export default themeManager;
