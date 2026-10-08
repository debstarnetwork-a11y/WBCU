/**
 * ============================================================================
 * WB CREDIT UNION - COMPREHENSIVE INPUT VALIDATION & SANITIZATION ENGINE
 * ============================================================================
 * High-reliability security validation, XSS prevention, formatting, and live form feedback.
 */

export const Validator = {
  /**
   * Check if a field is provided and not empty
   */
  isRequired(value, fieldName = 'Field') {
    if (value === null || value === undefined) {
      return { isValid: false, message: `${fieldName} is required.` };
    }
    const str = String(value).trim();
    if (str.length === 0) {
      return { isValid: false, message: `${fieldName} cannot be left empty.` };
    }
    return { isValid: true, message: '' };
  },

  /**
   * Validate Email Address format
   */
  isEmail(email) {
    if (!email || typeof email !== 'string') {
      return { isValid: false, message: 'Email address is required.' };
    }
    const trimmed = email.trim();
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(trimmed)) {
      return { isValid: false, message: 'Please enter a valid banking email address.' };
    }
    return { isValid: true, message: '' };
  },

  /**
   * Validate International & Domestic Phone Numbers
   */
  isPhone(phone) {
    if (!phone) {
      return { isValid: false, message: 'Phone number is required.' };
    }
    const cleaned = String(phone).replace(/[\s\-()]/g, '');
    const phoneRegex = /^\+?[0-9]{7,15}$/;
    if (!phoneRegex.test(cleaned)) {
      return { isValid: false, message: 'Please enter a valid phone number (7-15 digits).' };
    }
    return { isValid: true, message: '' };
  },

  /**
   * Check Password Strength (Min 6 chars, uppercase, lowercase, number, special char)
   * Levels: weak, medium, strong
   */
  isStrongPassword(password, minLength = 6) {
    if (!password || typeof password !== 'string') {
      return { isValid: false, score: 0, level: 'weak', message: 'Password is required.', errors: ['Password is required'] };
    }

    const errors = [];
    if (password.length < minLength) errors.push(`At least ${minLength} characters`);
    if (!/[A-Za-z]/.test(password)) errors.push('At least 1 letter');
    if (!/[0-9]/.test(password)) errors.push('At least 1 number');

    let score = 0;
    if (password.length >= minLength) score += 25;
    if (password.length >= 10) score += 15;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 20;
    if (/[0-9]/.test(password)) score += 20;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password)) score += 20;

    let level = 'weak';
    let color = '#ef4444';
    let label = 'Weak';

    if (password.length < minLength || score < 40) {
      level = 'weak';
      color = '#ef4444';
      label = 'Weak';
    } else if (score < 75) {
      level = 'medium';
      color = '#f59e0b';
      label = 'Medium';
    } else {
      level = 'strong';
      color = '#10b981';
      label = 'Strong';
    }

    return {
      isValid: password.length >= minLength,
      score,
      level,
      label,
      color,
      errors,
      message: errors.length > 0 ? `Password must include: ${errors.join(', ')}.` : 'Password meets security requirements.'
    };
  },

  /**
   * Exactly 4 numeric digits for PIN
   */
  isPIN(pin) {
    const cleaned = String(pin || '').trim();
    if (!/^\d{4}$/.test(cleaned)) {
      return { isValid: false, message: 'PIN must be exactly 4 digits.' };
    }
    return { isValid: true, message: '' };
  },

  /**
   * 10-digit standard Bank Account Number
   */
  isAccountNumber(num) {
    const cleaned = String(num || '').replace(/[\s-]/g, '').trim();
    if (!/^\d{10}$/.test(cleaned)) {
      return { isValid: false, message: 'Account number must be exactly 10 digits.' };
    }
    return { isValid: true, message: '' };
  },

  /**
   * Validate Currency / Transfer Amount within bounds
   */
  isAmount(amount, min = 0.01, max = 10000000) {
    const num = parseFloat(String(amount).replace(/[^0-9.-]+/g, ''));
    if (isNaN(num) || num <= 0) {
      return { isValid: false, message: 'Please enter a valid numeric amount.' };
    }
    if (num < min) {
      return { isValid: false, message: `Minimum transfer amount is ${this.formatCurrency(min)}.` };
    }
    if (num > max) {
      return { isValid: false, message: `Maximum transfer limit is ${this.formatCurrency(max)}.` };
    }
    return { isValid: true, value: num, message: '' };
  },

  /**
   * Validate Cryptocurrency Wallet Addresses
   */
  isCryptoAddress(address, type = 'BTC') {
    if (!address || typeof address !== 'string') {
      return { isValid: false, message: 'Crypto wallet address is required.' };
    }
    const clean = address.trim();
    const upperType = type.toUpperCase();

    if (upperType === 'BTC' || upperType === 'BITCOIN') {
      // Legacy (1...), P2SH (3...), or Bech32 (bc1...)
      const btcRegex = /^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$/;
      if (!btcRegex.test(clean)) {
        return { isValid: false, message: 'Invalid Bitcoin address format (must start with 1, 3, or bc1).' };
      }
    } else if (upperType === 'ETH' || upperType === 'ETHEREUM' || upperType === 'USDT' || upperType === 'USDC') {
      // 0x + 40 hex characters
      const ethRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!ethRegex.test(clean)) {
        return { isValid: false, message: 'Invalid ERC-20 / Ethereum address (must start with 0x followed by 40 hex characters).' };
      }
    } else if (upperType === 'SOL' || upperType === 'SOLANA') {
      // Base58 32-44 characters
      const solRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
      if (!solRegex.test(clean)) {
        return { isValid: false, message: 'Invalid Solana address format (32-44 alphanumeric characters).' };
      }
    } else {
      if (clean.length < 24 || clean.length > 70) {
        return { isValid: false, message: 'Invalid cryptocurrency destination address.' };
      }
    }
    return { isValid: true, message: '' };
  },

  /**
   * Validate Date string & Age checks
   */
  isDate(dateStr, minAge = 0) {
    if (!dateStr) {
      return { isValid: false, message: 'Date is required.' };
    }
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      return { isValid: false, message: 'Invalid date format.' };
    }
    if (minAge > 0) {
      const today = new Date();
      let age = today.getFullYear() - parsed.getFullYear();
      const monthDiff = today.getMonth() - parsed.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
        age--;
      }
      if (age < minAge) {
        return { isValid: false, message: `Applicant must be at least ${minAge} years old to open an account.` };
      }
    }
    return { isValid: true, message: '' };
  },

  /**
   * Validate Legal Names
   */
  isName(name, fieldName = 'Name') {
    if (!name || typeof name !== 'string') {
      return { isValid: false, message: `${fieldName} is required.` };
    }
    const clean = name.trim();
    if (clean.length < 2) {
      return { isValid: false, message: `${fieldName} must be at least 2 characters.` };
    }
    const nameRegex = /^[a-zA-Z\s'\-\.]+$/;
    if (!nameRegex.test(clean)) {
      return { isValid: false, message: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes.` };
    }
    return { isValid: true, message: '' };
  },

  /**
   * XSS Prevention & HTML Sanitization
   */
  sanitize(input) {
    if (typeof input !== 'string') return input;
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    return input.replace(/[&<>"'/]/g, (char) => map[char]);
  },

  /* --------------------------------------------------------------------------
   * FORMATTERS
   * -------------------------------------------------------------------------- */

  formatCurrency(amount, currency = 'USD') {
    const num = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9.-]+/g, '')) || 0;
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(num);
    } catch {
      return `$${num.toFixed(2)}`;
    }
  },

  maskCard(cardNumber) {
    const clean = String(cardNumber || '').replace(/\D/g, '');
    if (clean.length < 4) return '•••• •••• •••• ••••';
    const last4 = clean.slice(-4);
    return `•••• •••• •••• ${last4}`;
  },

  formatCardNumber(value) {
    const v = String(value || '').replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  },

  formatPhone(phone) {
    const clean = String(phone || '').replace(/\D/g, '');
    if (clean.length === 10) {
      return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
    }
    if (clean.length === 11 && clean.startsWith('1')) {
      return `+1 (${clean.slice(1, 4)}) ${clean.slice(4, 7)}-${clean.slice(7)}`;
    }
    return phone;
  },

  formatIBAN(iban) {
    const clean = String(iban || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return clean.replace(/(.{4})/g, '$1 ').trim();
  },

  /* --------------------------------------------------------------------------
   * FORM VALIDATION HELPERS & VISUAL FEEDBACK
   * -------------------------------------------------------------------------- */

  /**
   * Set field visual state (valid or invalid) with inline message
   */
  setFieldFeedback(inputEl, isValid, errorMessage = '') {
    if (!inputEl) return;
    
    // Find or create feedback container
    let feedbackEl = inputEl.parentElement.querySelector('.form-feedback-msg');
    if (!feedbackEl) {
      feedbackEl = document.createElement('div');
      feedbackEl.className = 'form-feedback-msg';
      inputEl.parentElement.appendChild(feedbackEl);
    }

    if (!isValid) {
      inputEl.classList.add('is-invalid');
      inputEl.classList.remove('is-valid');
      feedbackEl.textContent = errorMessage;
      feedbackEl.className = 'form-feedback-msg text-red text-xs mt-1 d-block font-medium animate-shake';
      
      // Trigger subtle haptic feedback if supported
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([15]);
      }
    } else {
      inputEl.classList.remove('is-invalid');
      inputEl.classList.add('is-valid');
      feedbackEl.textContent = '';
      feedbackEl.className = 'form-feedback-msg text-green text-xs mt-1 d-none';
    }
  },

  /**
   * Validate entire form according to field schema
   * schema = { inputId: [rule1, rule2], ... }
   */
  validateForm(formElement, schema) {
    let isAllValid = true;
    let firstInvalidField = null;

    for (const [fieldSelector, rules] of Object.entries(schema)) {
      const input = formElement.querySelector(fieldSelector);
      if (!input) continue;

      let fieldValid = true;
      let errorMsg = '';

      for (const rule of rules) {
        const res = rule(input.value, input);
        if (!res.isValid) {
          fieldValid = false;
          errorMsg = res.message;
          break;
        }
      }

      this.setFieldFeedback(input, fieldValid, errorMsg);

      if (!fieldValid) {
        isAllValid = false;
        if (!firstInvalidField) firstInvalidField = input;
      }
    }

    if (firstInvalidField) {
      firstInvalidField.focus();
    }

    return isAllValid;
  },

  /**
   * Attach live blur/input validation triggers
   */
  attachLiveValidation(formElement, schema) {
    if (!formElement) return;

    for (const [fieldSelector, rules] of Object.entries(schema)) {
      const input = formElement.querySelector(fieldSelector);
      if (!input) continue;

      const validateSelf = () => {
        let fieldValid = true;
        let errorMsg = '';
        for (const rule of rules) {
          const res = rule(input.value, input);
          if (!res.isValid) {
            fieldValid = false;
            errorMsg = res.message;
            break;
          }
        }
        this.setFieldFeedback(input, fieldValid, errorMsg);
      };

      input.addEventListener('blur', validateSelf);
      input.addEventListener('input', () => {
        if (input.classList.contains('is-invalid')) {
          validateSelf();
        }
      });
    }
  }
};

// Global attachment for compatibility
if (typeof window !== 'undefined') {
  window.Validator = Validator;
}
