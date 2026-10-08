/**
 * ============================================================================
 * WB CREDIT UNION - NOTIFICATIONS & EMAIL NOTIFICATION ENGINE
 * File: js/notifications-email.js
 * ============================================================================
 *
 * Implements:
 * 1. In-App Notification System:
 *    - Notifications Page controller (#notificationsView)
 *    - Category filtering: All, Transactions, Security, Account, System
 *    - Grouping by date: Today, Yesterday, This Week, Earlier
 *    - Expand/collapse accordion, unread blue dot, delete action
 *    - "Mark All as Read", pagination / "Load More"
 *    - Bell Dropdown live updates & Realtime subscriptions
 *    - Notification Preferences controller (in Settings)
 *
 * 2. Professional Responsive Email System:
 *    - 5 Inline CSS Email Templates (Max 600px, Poppins font, mobile-friendly tables):
 *        * Welcome Email Template
 *        * Transaction Alert Email Template (Credit/Debit)
 *        * Wire Transfer Code Email Template
 *        * OTP Security Email Template
 *        * ATM/Debit Card Issued Email Template
 *    - JavaScript Functions:
 *        * createNotification(userId, type, title, message, metadata)
 *        * sendWelcomeEmail(userId)
 *        * sendTransactionEmail(userId, transactionId)
 *        * sendOTPEmail(userId, otpCode)
 *        * sendWireCodeEmail(userId, transactionId)
 *        * sendCardEmail(userId, cardId)
 *        * logEmail(userId, emailType, subject, body, status, errorMessage)
 *    - Supabase DB integration for `notifications` & `email_logs` tables
 *    - Supabase Edge Function dispatcher fallback
 * ============================================================================
 */

import {
  supabase,
  isConfigured,
  showToast,
  getCurrentUser,
  getDemoStorageUser,
} from './supabase-config.js';

// Local storage keys
export const NOTIFICATIONS_STORAGE_KEY = 'wb_user_notifications_v2';
export const EMAIL_LOGS_STORAGE_KEY = 'wb_email_logs_v2';
export const NOTIF_PREFS_STORAGE_KEY = 'wb_notification_preferences_v2';

/* ----------------------------------------------------------------------------
 * 1. DEFAULT SEED NOTIFICATIONS (Empty - Synchronizes with Real Transactions)
 * ---------------------------------------------------------------------------- */
const DEFAULT_SEED_NOTIFICATIONS = [];

/* ----------------------------------------------------------------------------
 * 2. NOTIFICATION PREFERENCES DEFAULTS
 * ---------------------------------------------------------------------------- */
export const DEFAULT_NOTIFICATION_PREFERENCES = {
  transactions: true,
  security: true, // mandatory, locked
  account: true,
  promotions: false,
  wire: true,
  cards: true,
  delivery_in_app: true,
  delivery_email: true,
  delivery_push: false, // coming soon
};

/* ----------------------------------------------------------------------------
 * 3. HTML EMAIL TEMPLATES (Inline CSS, 600px Max-Width, Dark Mode, Poppins Font)
 * ---------------------------------------------------------------------------- */

/**
 * Standard Email Wrapper with inline CSS styling
 */
export function wrapEmailHtml(contentHtml, previewText = 'WB Credit Union Notification') {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>WB CREDIT UNION</title>
  <!--[if mso]>
  <style>
    * { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #f1f5f9; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
      .mobile-center { text-align: center !important; }
    }
    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #0b1526 !important; }
      .card-body { background-color: #111d33 !important; color: #f8fafc !important; }
      .card-text { color: #cbd5e1 !important; }
      .table-box { background-color: #1a2942 !important; border-color: #273b5c !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  <!-- Hidden Preheader -->
  <div style="display: none; font-size: 1px; color: #f1f5f9; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${previewText}
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-bg" style="background-color: #f1f5f9; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 30px 15px;">
        <!-- Email Container (Max 600px) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);">
          
          <!-- BRAND HEADER: Blue Gradient -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #091726 0%, #0f2b48 50%, #1e3a8a 100%); padding: 32px 30px; text-align: center;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <!-- Brand Crest Icon -->
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 12px; width: 48px; height: 48px; text-align: center; vertical-align: middle;">
                          <span style="font-size: 24px; line-height: 48px; color: #ffffff;">🏛️</span>
                        </td>
                      </tr>
                    </table>
                    <h1 style="margin: 14px 0 2px 0; font-family: 'Poppins', Arial, sans-serif; font-size: 22px; font-weight: 800; letter-spacing: 1.5px; color: #ffffff; text-transform: uppercase;">
                      WB CREDIT UNION
                    </h1>
                    <p style="margin: 0; font-family: 'Poppins', Arial, sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 2px; color: #93c5fd; text-transform: uppercase;">
                      Sovereign Multi-Currency & Treasury Banking
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CONTENT BODY -->
          <tr>
            <td class="card-body mobile-padding" style="padding: 36px 36px 30px 36px; background-color: #ffffff;">
              ${contentHtml}
            </td>
          </tr>

          <!-- SECURITY GUARANTEE BANNER -->
          <tr>
            <td style="padding: 16px 36px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td width="28" valign="top" style="font-size: 18px; line-height: 20px;">🛡️</td>
                  <td style="font-family: 'Poppins', Arial, sans-serif; font-size: 11px; line-height: 16px; color: #64748b;">
                    <strong>Security Reminder:</strong> WB Credit Union officers will never ask for your account password, master token, or PIN over the phone or via email. Always verify URLs end in <strong>wbcu.net</strong>.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #0f172a; padding: 32px 36px; text-align: center;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="font-family: 'Poppins', Arial, sans-serif; font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 12px;">
                    WB CREDIT UNION &bull; CHARTER #25148 &bull; NCUA INSURED
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family: 'Poppins', Arial, sans-serif; font-size: 11px; line-height: 18px; color: #64748b; padding-bottom: 16px;">
                    Headquarters: One Sovereign Financial Plaza, Suite 4400, New York, NY 10005<br>
                    Official Portal: <a href="https://www.wbcu.net" style="color: #38bdf8; text-decoration: none;">www.wbcu.net</a> &bull; Member Care: <a href="mailto:support@wbcu.net" style="color: #38bdf8; text-decoration: none;">support@wbcu.net</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 8px; border-top: 1px solid #1e293b;">
                    <p style="margin: 0; font-family: 'Poppins', Arial, sans-serif; font-size: 10px; color: #475569; line-height: 16px;">
                      This is an automated operational notice generated for your institutional depository account. 
                      To adjust your notification preferences, visit <a href="https://www.wbcu.net/#settings" style="color: #94a3b8; text-decoration: underline;">Account Settings</a>. 
                      <a href="https://www.wbcu.net/#settings" style="color: #94a3b8; text-decoration: underline; margin-left: 8px;">Unsubscribe from marketing</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1. Welcome Email Template
 */
export function getWelcomeEmailHtml(data = {}) {
  const firstName = data.firstName || 'Valued Member';
  const accountNumber = data.accountNumber || '2514809281';
  const accountType = data.accountType || 'Multi-Currency Sovereign Checking';
  const routingNumber = data.routingNumber || '251480576';
  const email = data.email || 'member@wbcu.net';

  const body = `
    <!-- Header Greeting -->
    <h2 style="margin: 0 0 10px 0; font-family: 'Poppins', Arial, sans-serif; font-size: 24px; font-weight: 700; color: #0f172a; text-align: left;">
      Welcome to WB CREDIT UNION! 🎉
    </h2>
    <p style="margin: 0 0 24px 0; font-family: 'Poppins', Arial, sans-serif; font-size: 14px; line-height: 22px; color: #475569;">
      Dear <strong>${firstName}</strong>, your institutional digital banking account has been successfully provisioned with sovereign depository clearance and FDIC/NCUA insurance backing.
    </p>

    <!-- Account Details Box -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="table-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 28px; overflow: hidden;">
      <tr>
        <td style="padding: 16px 20px; background-color: #0f2b48; color: #ffffff; font-family: 'Poppins', Arial, sans-serif; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
          📋 Your Account Credentials
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding-bottom: 10px; font-family: 'Poppins', Arial, sans-serif; font-size: 12px; color: #64748b; font-weight: 600;">Account Number:</td>
              <td style="padding-bottom: 10px; font-family: 'Poppins', Arial, sans-serif; font-size: 14px; font-weight: 700; color: #0f172a; text-align: right; letter-spacing: 1px;">${accountNumber}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 10px; font-family: 'Poppins', Arial, sans-serif; font-size: 12px; color: #64748b; font-weight: 600;">Account Type:</td>
              <td style="padding-bottom: 10px; font-family: 'Poppins', Arial, sans-serif; font-size: 13px; font-weight: 600; color: #0284c7; text-align: right;">${accountType}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 10px; font-family: 'Poppins', Arial, sans-serif; font-size: 12px; color: #64748b; font-weight: 600;">ABA / Routing Number:</td>
              <td style="padding-bottom: 10px; font-family: 'Poppins', Arial, sans-serif; font-size: 14px; font-weight: 700; color: #0f172a; text-align: right; letter-spacing: 1px;">${routingNumber}</td>
            </tr>
            <tr>
              <td style="font-family: 'Poppins', Arial, sans-serif; font-size: 12px; color: #64748b; font-weight: 600;">Registered Email:</td>
              <td style="font-family: 'Poppins', Arial, sans-serif; font-size: 13px; font-weight: 500; color: #0f172a; text-align: right;">${email}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Getting Started Section -->
    <h3 style="margin: 0 0 14px 0; font-family: 'Poppins', Arial, sans-serif; font-size: 16px; font-weight: 700; color: #0f172a;">
      🚀 Getting Started with Your Account
    </h3>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
      <tr>
        <td width="28" valign="top" style="font-size: 16px; line-height: 24px;">💳</td>
        <td style="padding-left: 10px; padding-bottom: 14px; font-family: 'Poppins', Arial, sans-serif; font-size: 13px; line-height: 20px; color: #475569;">
          <strong>Order Your Debit Card:</strong> Access instant virtual card generation or physical high-limit Visa Platinum issuance with zero FX markup.
        </td>
      </tr>
      <tr>
        <td width="28" valign="top" style="font-size: 16px; line-height: 24px;">🌐</td>
        <td style="padding-left: 10px; padding-bottom: 14px; font-family: 'Poppins', Arial, sans-serif; font-size: 13px; line-height: 20px; color: #475569;">
          <strong>Activate Multi-Currency Vaults:</strong> Hold and exchange USD, EUR, GBP, CHF, CAD, AUD, JPY, and Cold Crypto Assets seamlessly.
        </td>
      </tr>
      <tr>
        <td width="28" valign="top" style="font-size: 16px; line-height: 24px;">⚡</td>
        <td style="padding-left: 10px; font-family: 'Poppins', Arial, sans-serif; font-size: 13px; line-height: 20px; color: #475569;">
          <strong>Wire Transfer Clearances:</strong> Secure automated COT, TAX, IMF, and AML institutional compliance for international settlements.
        </td>
      </tr>
    </table>

    <!-- Primary CTA Button (Orange) -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 28px;">
      <tr>
        <td align="center">
          <a href="https://www.wbcu.net/pages/login.html" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; font-family: 'Poppins', Arial, sans-serif; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 8px; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.35); text-transform: uppercase; letter-spacing: 0.5px;">
            Access Banking Portal &rarr;
          </a>
        </td>
      </tr>
    </table>

    <!-- Quick Links Grid -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #e2e8f0; padding-top: 20px;">
      <tr>
        <td align="center" style="font-family: 'Poppins', Arial, sans-serif; font-size: 12px; color: #64748b;">
          <a href="https://www.wbcu.net/pages/login.html" style="color: #0284c7; text-decoration: none; font-weight: 600; margin: 0 10px;">Login Portal</a> &bull;
          <a href="https://www.wbcu.net/#accounts" style="color: #0284c7; text-decoration: none; font-weight: 600; margin: 0 10px;">Mobile Web App</a> &bull;
          <a href="mailto:support@wbcu.net" style="color: #0284c7; text-decoration: none; font-weight: 600; margin: 0 10px;">24/7 Priority Support</a>
        </td>
      </tr>
    </table>
  `;

  return wrapEmailHtml(body, `Welcome to WB Credit Union, ${firstName}! Your account has been provisioned.`);
}

/**
 * 2. Transaction Email Template (Credit / Debit)
 */
export function getTransactionEmailHtml(data = {}) {
  const isCredit = data.type === 'credit' || String(data.direction).toLowerCase() === 'credit';
  const typeLabel = isCredit ? 'Credit' : 'Debit';
  const badgeColor = isCredit ? '#10b981' : '#f97316';
  const badgeBg = isCredit ? '#ecfdf5' : '#fff7ed';
  const badgeBorder = isCredit ? '#a7f3d0' : '#fed7aa';
  const amountPrefix = isCredit ? '+' : '-';
  const currency = data.currency || 'USD';
  const amount = data.amount != null ? Number(data.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '1,250.00';
  const dateFormatted = data.date || new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  const reference = data.reference || `WBCU-TX-${Math.floor(100000 + Math.random() * 900000)}`;
  const description = data.description || (isCredit ? 'Direct ACH Inbound Transfer' : 'Merchant POS Wire Settlement');
  const maskedAccount = data.maskedAccount || '****8092';
  const newBalance = data.newBalance != null ? `$${Number(data.newBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$248,930.50';

  const body = `
    <!-- Top Alert Badge -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
      <tr>
        <td style="background-color: ${badgeBg}; border: 1px solid ${badgeBorder}; border-radius: 20px; padding: 6px 16px; font-family: 'Poppins', Arial, sans-serif; font-size: 12px; font-weight: 700; color: ${badgeColor}; text-transform: uppercase; letter-spacing: 0.5px;">
          ${isCredit ? '🟢 INFLOW / CREDIT ALERT' : '🟠 OUTFLOW / DEBIT ALERT'}
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 6px 0; font-family: 'Poppins', Arial, sans-serif; font-size: 22px; font-weight: 700; color: #0f172a;">
      Transaction Notification
    </h2>
    <p style="margin: 0 0 24px 0; font-family: 'Poppins', Arial, sans-serif; font-size: 14px; color: #64748b;">
      A transaction of <strong style="color: ${badgeColor}; font-size: 16px;">${amountPrefix} ${currency} ${amount}</strong> has settled on your account.
    </p>

    <!-- Transaction Details Table -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="table-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
      <tr>
        <td style="padding: 14px 20px; background-color: #0f2b48; color: #ffffff; font-family: 'Poppins', Arial, sans-serif; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
          📊 Transaction Ledger Record
        </td>
      </tr>
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding-bottom: 12px; font-family: 'Poppins', Arial, sans-serif; font-size: 12px; color: #64748b; font-weight: 600;">Transaction Type:</td>
              <td style="padding-bottom: 12px; font-family: 'Poppins', Arial, sans-serif; font-size: 13px; font-weight: 700; color: ${badgeColor}; text-align: right; text-transform: uppercase;">${typeLabel}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px; font-family: 'Poppins', Arial, sans-serif; font-size: 12px; color: #64748b; font-weight: 600;">Amount Settled:</td>
              <td style="padding-bottom: 12px; font-family: 'Poppins', Arial, sans-serif; font-size: 16px; font-weight: 800; color: #0f172a; text-align: right;">${amountPrefix} ${currency} ${amount}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px; font-family: 'Poppins', Arial, sans-serif; font-size: 12px; color: #64748b; font-weight: 600;">Date & Time:</td>
              <td style="padding-bottom: 12px; font-family: 'Poppins', Arial, sans-serif; font-size: 13px; font-weight: 600; color: #0f172a; text-align: right;">${dateFormatted}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px; font-family: 'Poppins', Arial, sans-serif; font-size: 12px; color: #64748b; font-weight: 600;">Reference Number:</td>
              <td style="padding-bottom: 12px; font-family: 'Poppins', Arial, sans-serif; font-size: 13px; font-weight: 700; color: #0284c7; text-align: right; letter-spacing: 0.5px;">${reference}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px; font-family: 'Poppins', Arial, sans-serif; font-size: 12px; color: #64748b; font-weight: 600;">Description:</td>
              <td style="padding-bottom: 12px; font-family: 'Poppins', Arial, sans-serif; font-size: 13px; font-weight: 600; color: #334155; text-align: right;">${description}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 12px; font-family: 'Poppins', Arial, sans-serif; font-size: 12px; color: #64748b; font-weight: 600;">Account Vault:</td>
              <td style="padding-bottom: 12px; font-family: 'Poppins', Arial, sans-serif; font-size: 13px; font-weight: 700; color: #0f172a; text-align: right;">${maskedAccount}</td>
            </tr>
            <tr style="border-top: 1px dashed #cbd5e1;">
              <td style="padding-top: 12px; font-family: 'Poppins', Arial, sans-serif; font-size: 13px; color: #0f172a; font-weight: 700;">New Vault Balance:</td>
              <td style="padding-top: 12px; font-family: 'Poppins', Arial, sans-serif; font-size: 16px; font-weight: 800; color: #0f2b48; text-align: right;">${newBalance}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Dispute / Fraud Notice -->
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
      <p style="margin: 0; font-family: 'Poppins', Arial, sans-serif; font-size: 12px; line-height: 18px; color: #991b1b;">
        <strong>Unauthorized Activity?</strong> If you did not recognize or authorize this transaction, please lock your cards and notify Treasury Fraud Control immediately.
      </p>
    </div>

    <!-- Action Buttons -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <a href="https://www.wbcu.net/pages/dashboard.html#transactions" style="display: inline-block; background: #0f2b48; color: #ffffff; font-family: 'Poppins', Arial, sans-serif; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; margin-right: 10px;">
            View Receipt in Portal
          </a>
          <a href="mailto:support@wbcu.net?subject=Dispute%20Transaction%20${reference}" style="display: inline-block; background: #ffffff; border: 1px solid #cbd5e1; color: #dc2626; font-family: 'Poppins', Arial, sans-serif; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px;">
            Contact Support
          </a>
        </td>
      </tr>
    </table>
  `;

  return wrapEmailHtml(body, `Transaction Alert - ${typeLabel} of ${currency} ${amount} on your account`);
}

/**
 * 3. Wire Transfer Code Email Template
 */
export function getWireTransferCodeEmailHtml(data = {}) {
  const firstName = data.firstName || 'Member';
  const reference = data.reference || `WBCU-WIRE-${Math.floor(10000 + Math.random() * 90000)}`;
  const amount = data.amount != null ? Number(data.amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '45,000.00';
  const currency = data.currency || 'USD';
  const beneficiary = data.beneficiary || 'Acme Global Holdings Ltd';
  const requiredCodeTypes = data.requiredCodeTypes || 'COT (Cost of Transfer) & IMF Clearance';
  const portalUrl = data.portalUrl || 'https://www.wbcu.net/pages/dashboard.html#wire';

  const body = `
    <!-- Security Header -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
      <tr>
        <td style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 20px; padding: 6px 16px; font-family: 'Poppins', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px;">
          ⚠️ REGULATORY CLEARANCE REQUIRED
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 10px 0; font-family: 'Poppins', Arial, sans-serif; font-size: 22px; font-weight: 700; color: #0f172a;">
      A Wire Transfer Requires Verification
    </h2>
    <p style="margin: 0 0 20px 0; font-family: 'Poppins', Arial, sans-serif; font-size: 14px; line-height: 22px; color: #475569;">
      Dear <strong>${firstName}</strong>, outbound wire transfer <strong>#${reference}</strong> requires administrative clearance before processing.
    </p>

    <!-- Transfer Details Summary -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="table-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 18px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding-bottom: 10px; font-family: 'Poppins', Arial, sans-serif; font-size: 12px; color: #64748b; font-weight: 600;">Transfer Amount:</td>
              <td style="padding-bottom: 10px; font-family: 'Poppins', Arial, sans-serif; font-size: 16px; font-weight: 800; color: #0f172a; text-align: right;">${currency} ${amount}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 10px; font-family: 'Poppins', Arial, sans-serif; font-size: 12px; color: #64748b; font-weight: 600;">Beneficiary:</td>
              <td style="padding-bottom: 10px; font-family: 'Poppins', Arial, sans-serif; font-size: 13px; font-weight: 700; color: #0f172a; text-align: right;">${beneficiary}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 10px; font-family: 'Poppins', Arial, sans-serif; font-size: 12px; color: #64748b; font-weight: 600;">Clearance Codes Required:</td>
              <td style="padding-bottom: 10px; font-family: 'Poppins', Arial, sans-serif; font-size: 13px; font-weight: 700; color: #dc2626; text-align: right;">${requiredCodeTypes}</td>
            </tr>
            <tr>
              <td style="font-family: 'Poppins', Arial, sans-serif; font-size: 12px; color: #64748b; font-weight: 600;">Clearing State:</td>
              <td style="font-family: 'Poppins', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #d97706; text-align: right;">⏳ AWAITING VERIFICATION CODES</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 24px 0; font-family: 'Poppins', Arial, sans-serif; font-size: 14px; line-height: 22px; color: #334155;">
      Please enter the required authorization codes in your secure digital banking portal to proceed with funds settlement.
    </p>

    <!-- Login CTA Button -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; font-family: 'Poppins', Arial, sans-serif; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 34px; border-radius: 8px; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.35); text-transform: uppercase;">
            Enter Clearance Codes in Portal &rarr;
          </a>
        </td>
      </tr>
    </table>

    <!-- Warning Box -->
    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 14px 18px;">
      <p style="margin: 0; font-family: 'Poppins', Arial, sans-serif; font-size: 12px; line-height: 18px; color: #92400e;">
        <strong>Crucial Security Warning:</strong> Never share your COT, TAX, IMF, AML, or PAP clearance codes with anyone outside the official WB Credit Union encrypted compliance interface. WB Credit Union staff will never request these codes via phone or unencrypted email.
      </p>
    </div>
  `;

  return wrapEmailHtml(body, `Wire Transfer Code Required - Action Needed for #${reference}`);
}

/**
 * 4. OTP Email Template
 */
export function getOTPEmailHtml(data = {}) {
  const otpCode = data.otpCode || `${Math.floor(100000 + Math.random() * 900000)}`;
  const expiresMinutes = data.expiresMinutes || 10;
  const email = data.email || 'member@wbcu.net';
  const type = data.type || 'transaction authorization';

  const body = `
    <!-- Security Header -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
      <tr>
        <td style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 20px; padding: 6px 16px; font-family: 'Poppins', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #1d4ed8; text-transform: uppercase; letter-spacing: 0.5px;">
          🔒 SOVEREIGN IDENTITY VERIFICATION
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 8px 0; font-family: 'Poppins', Arial, sans-serif; font-size: 22px; font-weight: 700; color: #0f172a;">
      Your One-Time Password (OTP)
    </h2>
    <p style="margin: 0 0 24px 0; font-family: 'Poppins', Arial, sans-serif; font-size: 14px; color: #64748b;">
      Use the following single-use passcode to authorize your ${type} request for account associated with <strong>${email}</strong>:
    </p>

    <!-- Large OTP Display Box -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
      <tr>
        <td align="center">
          <div style="background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%); border: 2px dashed #0284c7; border-radius: 12px; padding: 22px 30px; display: inline-block; text-align: center;">
            <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #0f2b48; display: block;">
              ${otpCode}
            </span>
          </div>
        </td>
      </tr>
    </table>

    <!-- Expiry Timer Notice -->
    <p style="margin: 0 0 24px 0; font-family: 'Poppins', Arial, sans-serif; font-size: 13px; font-weight: 600; color: #ea580c; text-align: center;">
      ⏱️ This code expires in <strong>${expiresMinutes} minutes</strong> and can only be used once.
    </p>

    <!-- Security Alert Box -->
    <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
      <p style="margin: 0 0 6px 0; font-family: 'Poppins', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #991b1b;">
        Didn't request this code?
      </p>
      <p style="margin: 0; font-family: 'Poppins', Arial, sans-serif; font-size: 11px; line-height: 16px; color: #7f1d1d;">
        If you did not initiate this request, someone may be attempting to access your profile. Please freeze your accounts and notify our emergency security unit at <a href="mailto:support@wbcu.net" style="color: #991b1b; font-weight: 700; text-decoration: underline;">support@wbcu.net</a>.
      </p>
    </div>

    <!-- Security Tips -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #e2e8f0; padding-top: 16px;">
      <tr>
        <td style="font-family: 'Poppins', Arial, sans-serif; font-size: 11px; line-height: 18px; color: #64748b;">
          &bull; Never dictate or forward this passcode to any third party.<br>
          &bull; WB Credit Union representatives will never call you requesting this OTP.<br>
          &bull; Passcode is tied to session IP and cryptographically invalidates after usage.
        </td>
      </tr>
    </table>
  `;

  return wrapEmailHtml(body, `Your OTP Code [${otpCode}] - WB CREDIT UNION`);
}

/**
 * 5. Card Issued Email Template
 */
export function getCardIssuedEmailHtml(data = {}) {
  const firstName = data.firstName || 'Member';
  const cardType = data.cardType || 'Visa Platinum Debit';
  const maskedCardNumber = data.maskedCardNumber || '•••• •••• •••• 4921';
  const expiryDate = data.expiryDate || '09/29';

  const body = `
    <h2 style="margin: 0 0 8px 0; font-family: 'Poppins', Arial, sans-serif; font-size: 22px; font-weight: 700; color: #0f172a;">
      Your New Card Has Been Issued! 💳
    </h2>
    <p style="margin: 0 0 24px 0; font-family: 'Poppins', Arial, sans-serif; font-size: 14px; line-height: 22px; color: #475569;">
      Dear <strong>${firstName}</strong>, your new <strong>${cardType}</strong> has been generated and enrolled into the sovereign card processing network.
    </p>

    <!-- Card Illustration (HTML/CSS Realistic Virtual Card) -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 26px;">
      <tr>
        <td align="center">
          <div style="width: 320px; max-width: 100%; height: 180px; background: linear-gradient(135deg, #091726 0%, #1e3a8a 60%, #0284c7 100%); border-radius: 14px; padding: 18px; box-shadow: 0 12px 24px rgba(15, 23, 42, 0.25); text-align: left; position: relative; color: #ffffff; box-sizing: border-box;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="font-family: 'Poppins', Arial, sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 1px; color: #93c5fd; text-transform: uppercase;">
                  WB CREDIT UNION
                </td>
                <td align="right" style="font-size: 18px;">
                  💳
                </td>
              </tr>
            </table>

            <!-- EMV Chip graphic -->
            <div style="width: 34px; height: 26px; background: linear-gradient(135deg, #fcd34d, #f59e0b); border-radius: 4px; margin: 14px 0 10px 0;"></div>

            <!-- Card Number -->
            <div style="font-family: 'Courier New', monospace; font-size: 15px; font-weight: 700; letter-spacing: 2.5px; color: #ffffff; margin-bottom: 8px;">
              ${maskedCardNumber}
            </div>

            <!-- Card Holder & Expiry -->
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="font-family: 'Poppins', Arial, sans-serif; font-size: 10px; text-transform: uppercase; color: #cbd5e1;">
                  CARDHOLDER<br>
                  <strong style="color: #ffffff; font-size: 11px;">${firstName.toUpperCase()}</strong>
                </td>
                <td align="right" style="font-family: 'Poppins', Arial, sans-serif; font-size: 10px; text-transform: uppercase; color: #cbd5e1;">
                  EXPIRES<br>
                  <strong style="color: #ffffff; font-size: 11px;">${expiryDate}</strong>
                </td>
              </tr>
            </table>
          </div>
        </td>
      </tr>
    </table>

    <!-- Card Details Table -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="table-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding-bottom: 8px; font-family: 'Poppins', Arial, sans-serif; font-size: 12px; color: #64748b; font-weight: 600;">Card Product:</td>
              <td style="padding-bottom: 8px; font-family: 'Poppins', Arial, sans-serif; font-size: 13px; font-weight: 700; color: #0f172a; text-align: right;">${cardType}</td>
            </tr>
            <tr>
              <td style="padding-bottom: 8px; font-family: 'Poppins', Arial, sans-serif; font-size: 12px; color: #64748b; font-weight: 600;">Status:</td>
              <td style="padding-bottom: 8px; font-family: 'Poppins', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #16a34a; text-align: right;">ACTIVE / READY</td>
            </tr>
            <tr>
              <td style="font-family: 'Poppins', Arial, sans-serif; font-size: 12px; color: #64748b; font-weight: 600;">Daily Spending Limit:</td>
              <td style="font-family: 'Poppins', Arial, sans-serif; font-size: 13px; font-weight: 700; color: #0f2b48; text-align: right;">$25,000.00 USD</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Activation Instructions -->
    <h3 style="margin: 0 0 12px 0; font-family: 'Poppins', Arial, sans-serif; font-size: 15px; font-weight: 700; color: #0f172a;">
      📌 Next Steps & Activation Instructions:
    </h3>
    <ol style="margin: 0 0 24px 0; padding-left: 20px; font-family: 'Poppins', Arial, sans-serif; font-size: 13px; line-height: 22px; color: #475569;">
      <li>Log in to your <strong>WB Credit Union Banking Portal</strong>.</li>
      <li>Navigate to the <strong>Cards</strong> section in your sidebar.</li>
      <li>Verify your 4-digit ATM PIN and set your daily international withdrawal limits.</li>
      <li>Physical embossed cards will be delivered via insured courier within 2-3 business days.</li>
    </ol>

    <!-- CTA Button -->
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <a href="https://www.wbcu.net/pages/dashboard.html#cards" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; font-family: 'Poppins', Arial, sans-serif; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 32px; border-radius: 8px; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.35); text-transform: uppercase;">
            Manage Card in Portal &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  return wrapEmailHtml(body, `Your New Card Has Been Issued - WB CREDIT UNION`);
}

/* ----------------------------------------------------------------------------
 * 4. JAVASCRIPT FUNCTIONS (AS REQUIRED BY PROMPT 12)
 * ---------------------------------------------------------------------------- */

/**
 * 1. createNotification(userId, type, title, message, metadata)
 * Inserts in-app notification into Supabase notifications table,
 * and maintains local state mirror with broadcast.
 */
export async function createNotification(userId, type, title, message, metadata = {}) {
  const notifObj = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    user_id: userId || 'wb-usr-demo-01',
    type: type || 'system',
    title: title || 'Notice from WB Credit Union',
    message: message || '',
    is_read: false,
    action_url: metadata?.action_url || (type === 'transaction' ? '#transactions' : type === 'card' ? '#cards' : type === 'wire_code' ? '#wire' : '#notifications'),
    metadata: metadata || {},
    created_at: new Date().toISOString(),
  };

  // Try inserting into Supabase if configured
  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: notifObj.user_id,
            type: notifObj.type,
            title: notifObj.title,
            message: notifObj.message,
            is_read: false,
            action_url: notifObj.action_url,
            metadata: notifObj.metadata,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        notifObj.id = data.id;
      }
    } catch (e) {
      console.warn('Supabase notifications insert fallback to local:', e);
    }
  }

  // Update local storage mirror
  const stored = getLocalNotifications();
  stored.unshift(notifObj);
  saveLocalNotifications(stored);

  // Trigger UI re-renders and dispatch event
  dispatchNotificationEvent('created', notifObj);
  updateBellDropdownBadge();

  return notifObj;
}

/**
 * 2. logEmail(userId, emailType, subject, body, status, errorMessage)
 * Records email in Supabase email_logs table and local storage mirror
 */
export async function logEmail(userId, emailType, subject, body, status = 'sent', errorMessage = null, recipientEmail = null, previewUrl = null, messageId = null) {
  const recipient = recipientEmail || 'mizbrymo@gmail.com';
  const emailLogRecord = {
    id: `email-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    user_id: userId || 'wb-usr-demo-01',
    email_type: emailType,
    recipient_email: recipient,
    subject: subject,
    body: body,
    status: status,
    error_message: errorMessage,
    preview_url: previewUrl,
    message_id: messageId,
    created_at: new Date().toISOString(),
  };

  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .insert([
          {
            user_id: emailLogRecord.user_id,
            email_type: emailLogRecord.email_type,
            recipient_email: emailLogRecord.recipient_email,
            subject: emailLogRecord.subject,
            body: emailLogRecord.body,
            status: emailLogRecord.status,
            error_message: emailLogRecord.error_message,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        emailLogRecord.id = data.id;
      }
    } catch (e) {
      console.warn('Supabase email_logs insert note:', e);
    }
  }

  // Mirror in local storage
  const logs = getLocalEmailLogs();
  logs.unshift(emailLogRecord);
  saveLocalEmailLogs(logs);

  return emailLogRecord;
}

/**
 * Dispatches an email via real-time backend SMTP API (/api/send-email),
 * Supabase Edge Function fallback, or live web sandbox relay.
 */
async function dispatchEmailPayload({ to, subject, html, emailType, userId }) {
  let status = 'sent';
  let errorMessage = null;
  let previewUrl = null;
  let messageId = null;

  // 1. Read admin SMTP configuration from system settings
  let smtpConfig = null;
  let isGlobalEnabled = true;
  try {
    const rawSettings = localStorage.getItem('wb_system_settings_db');
    if (rawSettings) {
      const parsed = JSON.parse(rawSettings);
      if (parsed.emailSettings) {
        if (parsed.emailSettings.enableGlobalEmail === false) {
          isGlobalEnabled = false;
        }
        smtpConfig = {
          host: parsed.emailSettings.smtpHost || 'mail.wbcu.net',
          port: parsed.emailSettings.smtpPort || 587,
          user: parsed.emailSettings.smtpUser || 'info@wbcu.net',
          pass: parsed.emailSettings.smtpPass || '',
          senderEmail: parsed.emailSettings.senderEmail || 'info@wbcu.net',
          senderName: parsed.emailSettings.senderName || 'WB Credit Union',
        };
      }
    }
  } catch (parseErr) {
    console.warn('Could not read admin SMTP settings:', parseErr);
  }

  // 2. Dispatch via real backend API if automated global dispatch is enabled
  if (isGlobalEnabled) {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: to || 'mizbrymo@gmail.com',
          subject,
          html,
          emailType,
          smtp: smtpConfig,
        }),
      });
      const resData = await response.json();
      if (resData.success) {
        previewUrl = resData.previewUrl || null;
        messageId = resData.messageId || null;
        status = 'delivered';
      } else {
        errorMessage = resData.error || 'SMTP dispatch warning';
      }
    } catch (netErr) {
      console.warn('Backend /api/send-email connection notice:', netErr);
      errorMessage = netErr.message;
    }
  } else {
    status = 'skipped_global_disabled';
  }

  // 3. Try calling Supabase Edge Function if configured
  if (isConfigured && supabase?.functions) {
    try {
      await supabase.functions.invoke('send-email', {
        body: { to, subject, html, email_type: emailType, user_id: userId },
      });
    } catch (e) {
      console.warn('Edge function invoke note:', e);
    }
  }

  // 4. Record in local email logs with live preview URL
  return await logEmail(userId, emailType, subject, html, status, errorMessage, to, previewUrl, messageId);
}

/**
 * 3. sendWelcomeEmail(userId)
 */
export async function sendWelcomeEmail(userId) {
  const user = getDemoStorageUser() || { fullName: 'Valued Member', email: 'member@wbcu.net', accountNumber: '2514809281' };
  const firstName = (user.fullName || 'Member').split(' ')[0];
  const subject = 'Welcome to WB CREDIT UNION! 🎉';
  const html = getWelcomeEmailHtml({
    firstName,
    accountNumber: user.accountNumber || '2514809281',
    accountType: 'Multi-Currency Sovereign Checking',
    routingNumber: '251480576',
    email: user.email || 'member@wbcu.net',
  });

  // 1. Dispatch/log email
  await dispatchEmailPayload({
    to: user.email || 'mizbrymo@gmail.com',
    subject,
    html,
    emailType: 'welcome',
    userId,
  });

  // 2. Create corresponding in-app notification
  await createNotification(
    userId,
    'account',
    'Welcome to WB Credit Union!',
    `Your institutional depository account has been successfully provisioned. Welcome aboard, ${firstName}!`,
    { action_url: '#overview' }
  );

  return { success: true, subject };
}

/**
 * 4. sendTransactionEmail(userId, transactionId)
 */
export async function sendTransactionEmail(userId, transactionDataOrId) {
  const user = getDemoStorageUser() || { fullName: 'Member', email: 'mizbrymo@gmail.com', accountNumber: '2514-8092-81' };
  
  let tx = transactionDataOrId;
  if (typeof transactionDataOrId === 'string') {
    const txs = JSON.parse(localStorage.getItem('wb_transactions_cache_v1') || '[]');
    tx = txs.find((t) => t.id === transactionDataOrId) || {
      type: 'credit',
      amount: 1250,
      currency: 'USD',
      description: 'Funds Transfer',
      reference: transactionDataOrId,
      date: new Date().toISOString(),
    };
  }

  const isCredit = (tx.type || tx.direction) === 'credit';
  const typeText = isCredit ? 'Credit' : 'Debit';
  const currency = tx.currency || 'USD';
  const amountStr = Number(tx.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
  const subject = `Transaction Alert - ${typeText} of ${currency} ${amountStr} on your account`;

  const html = getTransactionEmailHtml({
    type: tx.type || (isCredit ? 'credit' : 'debit'),
    direction: tx.direction || (isCredit ? 'credit' : 'debit'),
    amount: tx.amount,
    currency,
    reference: tx.reference || tx.id || `WBCU-TX-${Date.now().toString().slice(-6)}`,
    description: tx.description || 'Account Transaction',
    date: new Date(tx.date || Date.now()).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
    maskedAccount: user.accountNumber ? `****${user.accountNumber.slice(-4)}` : '****8092',
    newBalance: tx.newBalance,
  });

  // 1. Dispatch/log email
  await dispatchEmailPayload({
    to: user.email || 'mizbrymo@gmail.com',
    subject,
    html,
    emailType: 'transaction',
    userId,
  });

  // 2. In-app notification
  await createNotification(
    userId,
    'transaction',
    `${typeText} Alert: ${currency} ${amountStr}`,
    `${isCredit ? 'Received' : 'Sent'} ${currency} ${amountStr} for ${tx.description || 'transaction'}. Ref: ${tx.reference || 'N/A'}.`,
    { action_url: '#transactions', transactionId: tx.id }
  );

  return { success: true, subject };
}

/**
 * 5. sendOTPEmail(userId, otpCode)
 */
export async function sendOTPEmail(userId, otpCode) {
  const user = getDemoStorageUser() || { fullName: 'Member', email: 'member@wbcu.net' };
  const code = otpCode || `${Math.floor(100000 + Math.random() * 900000)}`;
  const subject = 'Your OTP Code - WB CREDIT UNION';
  const html = getOTPEmailHtml({
    otpCode: code,
    expiresMinutes: 10,
    email: user.email || 'mizbrymo@gmail.com',
    type: 'security verification',
  });

  await dispatchEmailPayload({
    to: user.email || 'mizbrymo@gmail.com',
    subject,
    html,
    emailType: 'otp',
    userId,
  });

  await createNotification(
    userId,
    'security',
    'One-Time Security Passcode Dispatched',
    `A single-use security token has been generated and dispatched to ${user.email || 'your registered email'}. Valid for 10 minutes.`,
    { action_url: '#security' }
  );

  return { success: true, otpCode: code };
}

/**
 * 6. sendWireCodeEmail(userId, transactionId)
 */
export async function sendWireCodeEmail(userId, wireTxOrId) {
  const user = getDemoStorageUser() || { fullName: 'Member', email: 'mizbrymo@gmail.com' };
  const firstName = (user.fullName || 'Member').split(' ')[0];
  
  let wire = typeof wireTxOrId === 'object' ? wireTxOrId : {
    reference: wireTxOrId || 'WBCU-WIRE-8841',
    amount: 50000,
    currency: 'USD',
    beneficiary: 'International Settlement Counterparty',
    requiredCodeTypes: 'COT & IMF Clearance',
  };

  const subject = 'Wire Transfer Code Required - Action Needed';
  const html = getWireTransferCodeEmailHtml({
    firstName,
    reference: wire.reference || 'WBCU-WIRE-8841',
    amount: wire.amount || 50000,
    currency: wire.currency || 'USD',
    beneficiary: wire.beneficiary || 'Authorized Beneficiary',
    requiredCodeTypes: wire.requiredCodeTypes || 'COT, TAX & IMF Regulatory Clearance',
  });

  await dispatchEmailPayload({
    to: user.email || 'mizbrymo@gmail.com',
    subject,
    html,
    emailType: 'wire_code',
    userId,
  });

  await createNotification(
    userId,
    'wire_code',
    'Wire Clearance Code Required',
    `Outbound wire #${wire.reference || 'WBCU-WIRE'} requires regulatory verification codes. Please authorize in your portal.`,
    { action_url: '#wire' }
  );

  return { success: true, subject };
}

/**
 * 7. sendCardEmail(userId, cardId)
 */
export async function sendCardEmail(userId, cardDataOrId) {
  const user = getDemoStorageUser() || { fullName: 'Member', email: 'mizbrymo@gmail.com' };
  const firstName = (user.fullName || 'Member').split(' ')[0];

  let card = typeof cardDataOrId === 'object' ? cardDataOrId : {
    cardType: 'Visa Platinum Debit',
    maskedCardNumber: '•••• •••• •••• 4921',
    expiryDate: '09/29',
  };

  const subject = 'Your New Card Has Been Issued - WB CREDIT UNION';
  const html = getCardIssuedEmailHtml({
    firstName,
    cardType: card.cardType || card.type || 'Visa Platinum Debit',
    maskedCardNumber: card.maskedCardNumber || (card.card_number ? `•••• •••• •••• ${card.card_number.slice(-4)}` : '•••• •••• •••• 4921'),
    expiryDate: card.expiryDate || card.expiry_date || '09/29',
  });

  await dispatchEmailPayload({
    to: user.email || 'mizbrymo@gmail.com',
    subject,
    html,
    emailType: 'card_issued',
    userId,
  });

  await createNotification(
    userId,
    'card',
    'Debit Card Issued Successfully',
    `Your new ${card.cardType || 'Visa Platinum'} debit card is active. Configure PIN and spend rules in the Cards view.`,
    { action_url: '#cards' }
  );

  return { success: true, subject };
}

/**
 * 8. sendAppleGiftCardDepositEmail(userId, giftCard)
 */
export async function sendAppleGiftCardDepositEmail(userId, giftCard) {
  const user = getDemoStorageUser() || { fullName: 'Member', email: 'mizbrymo@gmail.com' };
  const firstName = (user.fullName || 'Member').split(' ')[0];
  const amt = Number(giftCard?.amount || 0).toFixed(2);
  const code = giftCard?.code || 'XXXX-XXXX-XXXX-XXXX';
  const target = giftCard?.targetAccount || 'Primary Checking';

  const subject = `Apple Gift Card Deposit Submitted ($${amt} USD) - Pending Clearance`;
  const body = `
    <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px; font-weight: 700;">
      Apple Gift Card Deposit Submitted 🍏
    </h2>
    <p style="color: #334155; font-size: 14px; line-height: 24px; margin: 0 0 20px 0;">
      Dear ${firstName}, your Apple Gift Card deposit has been recorded in the WB Credit Union clearing queue. Our Treasury Verification Desk is reviewing the submitted 16-digit card code and card voucher.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 600;">Deposit Amount:</td>
          <td style="padding: 6px 0; font-size: 15px; font-weight: 800; color: #16a34a; text-align: right;">$${amt} USD</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 600;">16-Digit Code:</td>
          <td style="padding: 6px 0; font-size: 13px; font-family: monospace; font-weight: 700; color: #0284c7; text-align: right;">${code}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 600;">Target Account:</td>
          <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f172a; text-align: right;">${target}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #64748b; font-weight: 600;">Status:</td>
          <td style="padding: 6px 0; font-size: 12px; font-weight: 700; color: #d97706; text-align: right;">PENDING AUDIT & CLEARANCE</td>
        </tr>
      </table>
    </div>

    <p style="color: #64748b; font-size: 12px; line-height: 20px; margin: 0;">
      Funds will be automatically credited to your ${target} vault upon approval. You will receive an instant email notification once cleared.
    </p>
  `;

  const html = wrapEmailHtml(body, `Apple Gift Card Deposit Submitted - WB CREDIT UNION`);

  await dispatchEmailPayload({
    to: user.email || 'mizbrymo@gmail.com',
    subject,
    html,
    emailType: 'gift_card_submission',
    userId,
  });

  await createNotification(
    userId,
    'account',
    `Apple Gift Card Submitted ($${amt})`,
    `Deposit of $${amt} USD (Code: ${code}) is pending Treasury desk approval. Target: ${target}.`,
    { action_url: '#overview' }
  );

  return { success: true, subject };
}

/**
 * 9. sendAppleGiftCardApprovedEmail(userId, giftCard)
 */
export async function sendAppleGiftCardApprovedEmail(userId, giftCard) {
  const user = getDemoStorageUser() || { fullName: 'Member', email: 'mizbrymo@gmail.com' };
  const firstName = (user.fullName || 'Member').split(' ')[0];
  const amt = Number(giftCard?.amount || 0).toFixed(2);
  const target = giftCard?.targetAccount || 'Primary Checking';

  const subject = `Apple Gift Card Approved - $${amt} USD Credited to Your Account!`;
  const body = `
    <h2 style="color: #16a34a; margin: 0 0 16px 0; font-size: 20px; font-weight: 700;">
      ✓ Gift Card Deposit Approved & Credited!
    </h2>
    <p style="color: #334155; font-size: 14px; line-height: 24px; margin: 0 0 20px 0;">
      Dear ${firstName}, your submitted Apple Gift Card has been verified and fully cleared by WB Credit Union Treasury.
    </p>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #166534; font-weight: 600;">Credited Amount:</td>
          <td style="padding: 6px 0; font-size: 18px; font-weight: 800; color: #15803d; text-align: right;">+$${amt} USD</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #166534; font-weight: 600;">Beneficiary Vault:</td>
          <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f172a; text-align: right;">${target}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #166534; font-weight: 600;">Settlement:</td>
          <td style="padding: 6px 0; font-size: 12px; font-weight: 700; color: #15803d; text-align: right;">CLEARED & AVAILABLE</td>
        </tr>
      </table>
    </div>

    <p style="color: #64748b; font-size: 12px; line-height: 20px; margin: 0;">
      These funds are now immediately available for withdrawal, wire transfers, debit card spending, or wealth compounding.
    </p>
  `;

  const html = wrapEmailHtml(body, `Apple Gift Card Approved - Funds Credited`);

  await dispatchEmailPayload({
    to: user.email || 'mizbrymo@gmail.com',
    subject,
    html,
    emailType: 'gift_card_approved',
    userId,
  });

  await createNotification(
    userId,
    'transaction',
    `Gift Card Credited: +$${amt} USD`,
    `Your Apple Gift Card deposit has been approved and +$${amt} USD is now in your ${target}.`,
    { action_url: '#overview' }
  );

  return { success: true, subject };
}

/**
 * 10. sendCryptoDepositEmail(userId, cryptoData)
 */
export async function sendCryptoDepositEmail(userId, cryptoData) {
  const user = getDemoStorageUser() || { fullName: 'Member', email: 'mizbrymo@gmail.com' };
  const firstName = (user.fullName || 'Member').split(' ')[0];
  const asset = cryptoData.asset || 'BTC';
  const amt = cryptoData.amount || '0.00';
  const txid = cryptoData.txid || 'Pending Network Confirmations';

  const subject = `Crypto Deposit Notice: ${amt} ${asset} Initiated`;
  const body = `
    <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px; font-weight: 700;">
      Inbound Crypto Deposit Detected ₿
    </h2>
    <p style="color: #334155; font-size: 14px; line-height: 24px; margin: 0 0 20px 0;">
      Dear ${firstName}, your deposit of <strong>${amt} ${asset}</strong> to WBCU cold custody vaults is tracking on-chain.
    </p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Digital Asset:</td>
          <td style="padding: 4px 0; font-size: 13px; font-weight: 700; text-align: right;">${asset}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Amount:</td>
          <td style="padding: 4px 0; font-size: 14px; font-weight: 800; color: #0284c7; text-align: right;">${amt} ${asset}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Transaction TXID:</td>
          <td style="padding: 4px 0; font-size: 11px; font-family: monospace; text-align: right; word-break: break-all;">${txid}</td>
        </tr>
      </table>
    </div>
  `;

  const html = wrapEmailHtml(body, `Crypto Deposit Notice - WB CREDIT UNION`);

  await dispatchEmailPayload({
    to: user.email || 'mizbrymo@gmail.com',
    subject,
    html,
    emailType: 'crypto_deposit',
    userId,
  });

  await createNotification(
    userId,
    'transaction',
    `Crypto Deposit: ${amt} ${asset}`,
    `Inbound deposit of ${amt} ${asset} is processing. Ref: ${txid.slice(0, 16)}...`,
    { action_url: '#overview' }
  );

  return { success: true, subject };
}

/* ----------------------------------------------------------------------------
 * 5. LOCAL STORAGE HELPERS & DATA CACHE (REAL-TIME TRANSACTION SYNCHRONIZED)
 * ---------------------------------------------------------------------------- */

export function syncNotificationsWithRealtimeTransactions(existingList = null) {
  let list = Array.isArray(existingList) ? [...existingList] : [];
  if (!existingList) {
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (raw) list = JSON.parse(raw);
    } catch (e) {
      list = [];
    }
  }

  // 1. Purge every test notification and test user details (such as Alexander Morgan or dummy seed items)
  list = list.filter((n) => {
    if (!n) return false;
    if (n.id && (String(n.id).startsWith('notif-seed-') || String(n.id).startsWith('notif-1') || String(n.id).startsWith('notif-2') || String(n.id).startsWith('notif-3'))) return false;
    const text = (String(n.title || '') + ' ' + String(n.message || '')).toLowerCase();
    if (text.includes('alexander morgan')) return false;
    if (text.includes('global tech innovations')) return false;
    if (text.includes('wbcu-tx-982412')) return false;
    if (text.includes('wbcu-wire-8841')) return false;
    if (text.includes('tx-9025') || text.includes('tx-9024') || text.includes('tx-9023') || text.includes('tx-9022') || text.includes('tx-9021') || text.includes('tx-9020')) return false;
    return true;
  });

  // 2. Synchronize with real user transactions from localStorage
  let validTxs = [];
  try {
    const txRaw = localStorage.getItem('wb_credit_union_user_transactions');
    if (txRaw) {
      const realTxs = JSON.parse(txRaw);
      if (Array.isArray(realTxs)) {
        // Filter out dummy Alexander Morgan test transactions
        validTxs = realTxs.filter(tx => {
          if (!tx || !tx.id) return false;
          if (String(tx.id).startsWith('TX-902')) return false;
          if (tx.recipient === 'Alexander Morgan' || tx.sender === 'Alexander Morgan') return false;
          if (tx.sender === 'Global Tech Innovations Inc.') return false;
          return true;
        });

        const validTxIds = new Set(validTxs.map(t => t.id));

        // Purge any transaction notifications that are not part of real transactions
        list = list.filter((n) => {
          if (n.type === 'transaction' && n.metadata && n.metadata.transactionId) {
            return validTxIds.has(n.metadata.transactionId);
          }
          return true;
        });

        validTxs.forEach((tx) => {
          const notifId = 'notif-tx-' + tx.id;
          const alreadyExists = list.some((n) => n.id === notifId || (n.metadata && n.metadata.transactionId === tx.id));
          if (!alreadyExists) {
            const isCredit = (tx.category === 'credit' || tx.direction === 'credit' || tx.type === 'credit' || (typeof tx.amount === 'number' && tx.amount > 0 && !String(tx.type || '').toLowerCase().includes('debit')));
            const currency = tx.currency || 'USD';
            const amtAbs = Math.abs(Number(tx.amount || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 });
            const title = isCredit ? `Credit Alert: +${currency} ${amtAbs}` : `Debit Alert: -${currency} ${amtAbs}`;
            const message = isCredit
              ? `+${currency} ${amtAbs} credited via ${tx.type || 'Transfer'}. ${tx.description || ''} Ref: ${tx.ref || tx.id}`
              : `-${currency} ${amtAbs} sent via ${tx.type || 'Transfer'} to ${tx.recipient || 'beneficiary'}. Ref: ${tx.ref || tx.id}`;

            const txTimestamp = (tx.timestamp && tx.timestamp !== 'Just now' && !isNaN(new Date(tx.timestamp).getTime()))
              ? tx.timestamp
              : (tx.date && tx.date !== 'Just now' && !isNaN(new Date(tx.date).getTime()))
              ? new Date(tx.date).toISOString()
              : new Date().toISOString();

            list.unshift({
              id: notifId,
              user_id: tx.userId || 'usr-101',
              type: 'transaction',
              title,
              message,
              is_read: false,
              action_url: '#transactions',
              metadata: { transactionId: tx.id, amount: tx.amount, currency: tx.currency },
              created_at: txTimestamp,
            });
          }
        });
      }
    }
  } catch (err) {
    console.warn('Realtime transaction sync note:', err);
  }

  saveLocalNotifications(list);
  return list;
}

export function getLocalNotifications() {
  return syncNotificationsWithRealtimeTransactions();
}

export function notifyNewRealtimeTransaction(tx) {
  if (!tx || !tx.id) return;
  if (tx.recipient === 'Alexander Morgan' || tx.sender === 'Alexander Morgan' || String(tx.id).startsWith('TX-902')) return;

  const list = getLocalNotifications();
  const notifId = 'notif-tx-' + tx.id;
  if (list.some((n) => n.id === notifId)) return;

  const isCredit = (tx.category === 'credit' || tx.direction === 'credit' || tx.type === 'credit' || (typeof tx.amount === 'number' && tx.amount > 0 && !String(tx.type || '').toLowerCase().includes('debit')));
  const currency = tx.currency || 'USD';
  const amtAbs = Math.abs(Number(tx.amount || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 });
  const title = isCredit ? `Credit Alert: +${currency} ${amtAbs}` : `Debit Alert: -${currency} ${amtAbs}`;
  const message = isCredit
    ? `+${currency} ${amtAbs} credited via ${tx.type || 'Transfer'}. ${tx.description || ''} Ref: ${tx.ref || tx.id}`
    : `-${currency} ${amtAbs} sent via ${tx.type || 'Transfer'} to ${tx.recipient || 'beneficiary'}. Ref: ${tx.ref || tx.id}`;

  const newNotif = {
    id: notifId,
    user_id: tx.userId || 'usr-101',
    type: 'transaction',
    title,
    message,
    is_read: false,
    action_url: '#transactions',
    metadata: { transactionId: tx.id, amount: tx.amount, currency: tx.currency },
    created_at: (tx.timestamp && tx.timestamp !== 'Just now' && !isNaN(new Date(tx.timestamp).getTime()))
      ? tx.timestamp
      : (tx.date && tx.date !== 'Just now' && !isNaN(new Date(tx.date).getTime()))
      ? new Date(tx.date).toISOString()
      : new Date().toISOString(),
  };

  list.unshift(newNotif);
  saveLocalNotifications(list);
  updateBellDropdownBadge();
  dispatchNotificationEvent('created', newNotif);
}

export function saveLocalNotifications(list) {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed saving notifications cache:', e);
  }
}

export function getLocalEmailLogs() {
  try {
    const raw = localStorage.getItem(EMAIL_LOGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading email logs:', e);
  }
  return [];
}

export function saveLocalEmailLogs(logs) {
  try {
    localStorage.setItem(EMAIL_LOGS_STORAGE_KEY, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed saving email logs:', e);
  }
}

export function getNotificationPreferences() {
  try {
    const raw = localStorage.getItem(NOTIF_PREFS_STORAGE_KEY);
    if (raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed loading notification preferences:', e);
  }
  return { ...DEFAULT_NOTIFICATION_PREFERENCES };
}

export function saveNotificationPreferences(prefs) {
  try {
    const merged = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...prefs, security: true }; // Security cannot be disabled
    localStorage.setItem(NOTIF_PREFS_STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (e) {
    console.error('Failed saving notification preferences:', e);
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

/* ----------------------------------------------------------------------------
 * 6. ASYNC SUPABASE DATA RETRIEVAL WITH FALLBACK
 * ---------------------------------------------------------------------------- */

export async function fetchUserNotifications(userId) {
  if (isConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        saveLocalNotifications(data);
        return data;
      }
    } catch (e) {
      console.warn('Supabase fetch notifications warning:', e);
    }
  }
  return getLocalNotifications();
}

export async function markNotificationAsRead(notifId) {
  // 1. Update in local storage
  const list = getLocalNotifications();
  const target = list.find((n) => n.id === notifId);
  if (target) {
    target.is_read = true;
    saveLocalNotifications(list);
  }

  // 2. Update in Supabase
  if (isConfigured && supabase) {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notifId);
    } catch (e) {
      console.warn('Supabase mark read note:', e);
    }
  }

  updateBellDropdownBadge();
  dispatchNotificationEvent('updated', target);
}

export async function markAllNotificationsAsRead(userId) {
  const list = getLocalNotifications();
  list.forEach((n) => (n.is_read = true));
  saveLocalNotifications(list);

  if (isConfigured && supabase) {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId);
    } catch (e) {
      console.warn('Supabase mark all read note:', e);
    }
  }

  updateBellDropdownBadge();
  dispatchNotificationEvent('all_read');
  showToast('All notifications marked as read.', 'info', 'Notifications');
}

export async function deleteNotification(notifId) {
  const list = getLocalNotifications();
  const filtered = list.filter((n) => n.id !== notifId);
  saveLocalNotifications(filtered);

  if (isConfigured && supabase) {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', notifId);
    } catch (e) {
      console.warn('Supabase delete notification note:', e);
    }
  }

  updateBellDropdownBadge();
  dispatchNotificationEvent('deleted', { id: notifId });
}

/* ----------------------------------------------------------------------------
 * 7. DATE GROUPING & RELATIVE TIME FORMATTER
 * ---------------------------------------------------------------------------- */

export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin === 1) return '1 minute ago';
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24 && now.getDate() === date.getDate()) return `${diffHours} hours ago`;
  if (diffDays === 1 || (diffHours < 48 && now.getDate() - date.getDate() === 1)) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function groupNotificationsByDate(notifications) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const thisWeekStart = todayStart - 6 * 86400000;

  const groups = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Earlier: [],
  };

  notifications.forEach((item) => {
    const itemTime = new Date(item.created_at).getTime();
    if (itemTime >= todayStart) {
      groups.Today.push(item);
    } else if (itemTime >= yesterdayStart) {
      groups.Yesterday.push(item);
    } else if (itemTime >= thisWeekStart) {
      groups['This Week'].push(item);
    } else {
      groups.Earlier.push(item);
    }
  });

  return groups;
}

export function getNotificationTypeIcon(type) {
  switch (type) {
    case 'transaction':
      return { emoji: '💰', label: 'Transaction', color: '#10b981', bg: '#ecfdf5' };
    case 'security':
      return { emoji: '🔒', label: 'Security', color: '#dc2626', bg: '#fef2f2' };
    case 'account':
      return { emoji: '📋', label: 'Account', color: '#0284c7', bg: '#f0f9ff' };
    case 'card':
      return { emoji: '💳', label: 'Card', color: '#8b5cf6', bg: '#faf5ff' };
    case 'wire_code':
      return { emoji: '⚡', label: 'Wire Clearance', color: '#f59e0b', bg: '#fffbeb' };
    case 'promotion':
      return { emoji: '🎁', label: 'Promotion', color: '#ec4899', bg: '#fdf2f8' };
    case 'system':
    default:
      return { emoji: '📢', label: 'System', color: '#0f2b48', bg: '#f1f5f9' };
  }
}

/* ----------------------------------------------------------------------------
 * 8. REALTIME SUBSCRIPTIONS & EVENT DISPATCHER
 * ---------------------------------------------------------------------------- */

function dispatchNotificationEvent(action, payload = null) {
  const event = new CustomEvent('wb:notifications:change', {
    detail: { action, payload },
  });
  window.dispatchEvent(event);
}

export function setupSupabaseRealtimeNotifications(userId, onNotificationReceived) {
  if (!isConfigured || !supabase) return null;

  try {
    const channel = supabase
      .channel(`public:notifications:${userId || 'global'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: userId ? `user_id=eq.${userId}` : undefined,
        },
        (payload) => {
          console.log('Realtime notification event received:', payload);
          if (payload.eventType === 'INSERT') {
            const notif = payload.new;
            const current = getLocalNotifications();
            if (!current.some((n) => n.id === notif.id)) {
              current.unshift(notif);
              saveLocalNotifications(current);
              updateBellDropdownBadge();
              dispatchNotificationEvent('created', notif);
              showToast(`New Notification: ${notif.title}`, 'info', 'Alert');
              if (typeof onNotificationReceived === 'function') {
                onNotificationReceived(notif);
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new;
            const current = getLocalNotifications();
            const idx = current.findIndex((n) => n.id === updated.id);
            if (idx !== -1) {
              current[idx] = updated;
              saveLocalNotifications(current);
              updateBellDropdownBadge();
              dispatchNotificationEvent('updated', updated);
            }
          }
        }
      )
      .subscribe();

    return channel;
  } catch (err) {
    console.warn('Realtime subscription error:', err);
    return null;
  }
}

/* ----------------------------------------------------------------------------
 * 9. BELL DROPDOWN CONTROLLER
 * ---------------------------------------------------------------------------- */

export function updateBellDropdownBadge() {
  const notifs = getLocalNotifications();
  const unreadCount = notifs.filter((n) => !n.is_read).length;
  const badgeEl = document.getElementById('notificationBadge');
  const sidebarBadgeEl = document.getElementById('sidebarNotifBadge');

  if (badgeEl) {
    badgeEl.textContent = String(unreadCount);
    badgeEl.style.display = unreadCount > 0 ? 'flex' : 'none';
  }

  if (sidebarBadgeEl) {
    sidebarBadgeEl.textContent = String(unreadCount);
    sidebarBadgeEl.style.display = unreadCount > 0 ? 'inline-block' : 'none';
  }

  renderBellDropdownList();
}

export function renderBellDropdownList() {
  const container = document.getElementById('notificationsListContainer');
  if (!container) return;

  const notifs = getLocalNotifications();
  // Show last 5 notifications (prioritizing unread)
  const sorted = [...notifs].sort((a, b) => {
    if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const displayItems = sorted.slice(0, 5);

  if (displayItems.length === 0) {
    container.innerHTML = `
      <div style="padding: 24px 16px; text-align: center; color: #64748b;">
        <div style="font-size: 28px; margin-bottom: 6px;">🔔</div>
        <div style="font-size: 13px; font-weight: 600; color: #0f172a;">All caught up!</div>
        <p style="font-size: 11px; margin: 4px 0 0 0;">No active notifications right now.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = displayItems
    .map((item) => {
      const typeInfo = getNotificationTypeIcon(item.type);
      const isUnread = !item.is_read;
      const timeStr = formatRelativeTime(item.created_at);

      return `
        <div class="notification-item ${isUnread ? 'unread' : ''}" data-id="${item.id}" style="position: relative;">
          <div class="notif-icon-circle" style="background-color: ${typeInfo.bg}; color: ${typeInfo.color}; font-size: 16px; display: flex; align-items: center; justify-content: center;">
            ${typeInfo.emoji}
          </div>
          <div class="notif-content" style="flex: 1; min-width: 0;">
            <div class="notif-title" style="font-weight: ${isUnread ? '700' : '500'}; color: #0f172a; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${item.title}
            </div>
            <div class="notif-desc" style="font-size: 11px; color: #64748b; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${item.message}
            </div>
            <div class="notif-time" style="font-size: 10px; color: #94a3b8; margin-top: 4px;">${timeStr}</div>
          </div>
          ${isUnread ? `<span style="position: absolute; top: 14px; right: 14px; width: 8px; height: 8px; border-radius: 50%; background-color: #2563eb;"></span>` : ''}
        </div>
      `;
    })
    .join('');

  // Attach click listeners to mark as read and navigate
  container.querySelectorAll('.notification-item').forEach((row) => {
    row.addEventListener('click', () => {
      const notifId = row.getAttribute('data-id');
      if (notifId) {
        markNotificationAsRead(notifId);
        // If clicking, switch to notifications view
        window.location.hash = 'notifications';
      }
    });
  });
}

/* ----------------------------------------------------------------------------
 * 10. IN-APP NOTIFICATIONS PAGE CONTROLLER (#notificationsView)
 * ---------------------------------------------------------------------------- */

let currentActiveFilter = 'all';
let currentVisibleLimit = 15;

export function setupNotificationsPageController() {
  const container = document.getElementById('notificationsPageContainer');
  if (!container) return;

  // Filter tab buttons
  const filterTabs = document.querySelectorAll('.notif-filter-tab');
  filterTabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      filterTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentActiveFilter = tab.getAttribute('data-filter') || 'all';
      currentVisibleLimit = 15; // reset page size
      renderNotificationsPage();
    });
  });

  // Mark all read button on notifications page
  const pageMarkAllBtn = document.getElementById('btnPageMarkAllRead');
  if (pageMarkAllBtn) {
    pageMarkAllBtn.addEventListener('click', async () => {
      const user = getDemoStorageUser() || { id: 'wb-usr-demo-01' };
      await markAllNotificationsAsRead(user.id);
      renderNotificationsPage();
    });
  }

  // Load More button
  const loadMoreBtn = document.getElementById('btnNotifLoadMore');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      currentVisibleLimit += 15;
      renderNotificationsPage();
    });
  }

  // Listen for global notification change events
  window.addEventListener('wb:notifications:change', () => {
    renderNotificationsPage();
    updateBellDropdownBadge();
  });

  // Initial render
  renderNotificationsPage();
}

export function renderNotificationsPage() {
  const container = document.getElementById('notificationsPageContainer');
  const emptyState = document.getElementById('notifEmptyState');
  const loadMoreBtn = document.getElementById('btnNotifLoadMore');
  const totalCounter = document.getElementById('notifTotalCounter');
  const unreadCounter = document.getElementById('notifUnreadCounter');

  if (!container) return;

  const allNotifs = getLocalNotifications();
  const unreadCount = allNotifs.filter((n) => !n.is_read).length;

  if (totalCounter) totalCounter.textContent = `${allNotifs.length} total`;
  if (unreadCounter) unreadCounter.textContent = `${unreadCount} unread`;

  // Apply tab filter: 'all' | 'transactions' | 'security' | 'account' | 'system'
  let filtered = allNotifs;
  if (currentActiveFilter !== 'all') {
    if (currentActiveFilter === 'transactions') {
      filtered = allNotifs.filter((n) => n.type === 'transaction' || n.type === 'wire_code');
    } else if (currentActiveFilter === 'security') {
      filtered = allNotifs.filter((n) => n.type === 'security' || n.type === 'wire_code');
    } else if (currentActiveFilter === 'account') {
      filtered = allNotifs.filter((n) => n.type === 'account' || n.type === 'card');
    } else if (currentActiveFilter === 'system') {
      filtered = allNotifs.filter((n) => n.type === 'system' || n.type === 'promotion');
    }
  }

  if (filtered.length === 0) {
    container.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  // Limit display items for pagination
  const visibleItems = filtered.slice(0, currentVisibleLimit);
  if (loadMoreBtn) {
    loadMoreBtn.style.display = filtered.length > currentVisibleLimit ? 'inline-flex' : 'none';
  }

  // Group by date: "Today", "Yesterday", "This Week", "Earlier"
  const groups = groupNotificationsByDate(visibleItems);

  let html = '';
  Object.keys(groups).forEach((groupTitle) => {
    const items = groups[groupTitle];
    if (items.length === 0) return;

    html += `
      <div class="notif-date-group mb-4">
        <div class="d-flex align-center gap-2 mb-2 pb-1 border-bottom" style="border-color: #e2e8f0;">
          <span style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">${groupTitle}</span>
          <span class="badge" style="background: #e2e8f0; color: #475569; font-size: 10px; padding: 2px 6px; border-radius: 10px;">${items.length}</span>
        </div>
        <div class="d-flex flex-column gap-2">
          ${items.map((item) => renderNotificationCard(item)).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Bind interactions: click to expand accordion, mark read, delete
  attachNotificationCardEvents(container);
}

function renderNotificationCard(item) {
  const typeInfo = getNotificationTypeIcon(item.type);
  const isUnread = !item.is_read;
  const relativeTime = formatRelativeTime(item.created_at);
  const fullDate = new Date(item.created_at).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return `
    <div class="notification-card-item card border ${isUnread ? 'card-unread' : ''}" data-id="${item.id}" style="background: #ffffff; border-radius: 12px; padding: 14px 18px; transition: all 0.2s ease; border-left: 4px solid ${isUnread ? '#2563eb' : 'transparent'}; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
      
      <!-- Card Summary Row (Clickable) -->
      <div class="d-flex align-center justify-between gap-3 notif-summary-row" style="cursor: pointer;">
        
        <div class="d-flex align-center gap-3" style="flex: 1; min-width: 0;">
          <!-- Type Icon -->
          <div class="notif-type-avatar" style="width: 38px; height: 38px; border-radius: 10px; background-color: ${typeInfo.bg}; color: ${typeInfo.color}; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">
            ${typeInfo.emoji}
          </div>

          <!-- Title & Preview -->
          <div style="flex: 1; min-width: 0;">
            <div class="d-flex align-center gap-2">
              <span class="notif-card-title text-sm ${isUnread ? 'font-bold text-navy' : 'font-semibold text-dark'}" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${item.title}
              </span>
              ${isUnread ? `<span class="unread-dot" title="Unread notification" style="width: 8px; height: 8px; border-radius: 50%; background: #2563eb; flex-shrink: 0;"></span>` : ''}
              <span class="badge d-none d-md-inline-block text-xs" style="background: ${typeInfo.bg}; color: ${typeInfo.color}; font-size: 10px; padding: 2px 6px; border-radius: 6px;">
                ${typeInfo.label}
              </span>
            </div>
            
            <div class="notif-card-preview text-xs text-muted text-truncate" style="line-height: 1.4; margin-top: 2px;">
              ${item.message}
            </div>
          </div>
        </div>

        <!-- Timestamp & Action Icons -->
        <div class="d-flex align-center gap-3 flex-shrink-0">
          <span class="text-xs text-muted font-numeric" title="${fullDate}">
            ${relativeTime}
          </span>

          <!-- Delete Button (Trash Icon) -->
          <button type="button" class="btn-icon-subtle btn-delete-notif" data-id="${item.id}" title="Delete notification" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 4px; border-radius: 6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>

          <!-- Accordion Chevron -->
          <span class="notif-chevron text-muted" style="transition: transform 0.2s ease;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </span>
        </div>

      </div>

      <!-- Expandable Details Accordion Body -->
      <div class="notif-expanded-body mt-3 pt-3 border-top" style="display: none; border-color: #f1f5f9;">
        <p class="text-sm text-dark mb-3" style="line-height: 1.6;">
          ${item.message}
        </p>

        <!-- Metadata Pill Chips if available -->
        ${
          item.metadata && Object.keys(item.metadata).length > 0
            ? `
          <div class="p-2 bg-light rounded text-xs d-flex flex-wrap gap-2 mb-3" style="background: #f8fafc; border: 1px solid #e2e8f0;">
            ${Object.entries(item.metadata)
              .map(
                ([k, v]) => `
              <span class="px-2 py-1 bg-white border rounded text-muted font-numeric">
                <strong>${k}:</strong> ${typeof v === 'object' ? JSON.stringify(v) : v}
              </span>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }

        <!-- Actions in Expanded View -->
        <div class="d-flex align-center justify-between">
          <div class="text-xs text-muted font-numeric">
            Audited Timestamp: ${fullDate}
          </div>
          <div class="d-flex gap-2">
            ${
              item.action_url
                ? `
              <a href="${item.action_url}" class="btn btn-primary btn-sm text-xs" style="background-color: var(--primary-navy); border-color: var(--primary-navy); color: #fff;">
                Open Related Vault &rarr;
              </a>
            `
                : ''
            }
            ${
              isUnread
                ? `
              <button type="button" class="btn btn-outline btn-sm text-xs btn-mark-read-item" data-id="${item.id}">
                Mark as Read
              </button>
            `
                : ''
            }
          </div>
        </div>

      </div>

    </div>
  `;
}

function attachNotificationCardEvents(container) {
  // Accordion Expand/Collapse
  container.querySelectorAll('.notif-summary-row').forEach((row) => {
    row.addEventListener('click', (e) => {
      // Don't expand if trash button was clicked
      if (e.target.closest('.btn-delete-notif')) return;

      const card = row.closest('.notification-card-item');
      if (!card) return;
      const notifId = card.getAttribute('data-id');
      const expandedBody = card.querySelector('.notif-expanded-body');
      const chevron = card.querySelector('.notif-chevron');

      const isOpening = expandedBody.style.display === 'none';
      expandedBody.style.display = isOpening ? 'block' : 'none';
      if (chevron) {
        chevron.style.transform = isOpening ? 'rotate(180deg)' : 'rotate(0deg)';
      }

      // Mark as read automatically when expanded
      if (isOpening && card.classList.contains('card-unread')) {
        markNotificationAsRead(notifId);
        card.classList.remove('card-unread');
        card.style.borderLeftColor = 'transparent';
        const dot = card.querySelector('.unread-dot');
        if (dot) dot.remove();
        const title = card.querySelector('.notif-card-title');
        if (title) {
          title.classList.remove('font-bold');
          title.classList.add('font-semibold');
        }
      }
    });
  });

  // Individual Delete Button
  container.querySelectorAll('.btn-delete-notif').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const notifId = btn.getAttribute('data-id');
      if (notifId) {
        await deleteNotification(notifId);
        showToast('Notification deleted from ledger.', 'info', 'Deleted');
        renderNotificationsPage();
      }
    });
  });

  // Individual Mark Read Button inside expanded view
  container.querySelectorAll('.btn-mark-read-item').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const notifId = btn.getAttribute('data-id');
      if (notifId) {
        await markNotificationAsRead(notifId);
        btn.remove();
        renderNotificationsPage();
      }
    });
  });
}

/* ----------------------------------------------------------------------------
 * 11. NOTIFICATION PREFERENCES CONTROLLER (IN SETTINGS)
 * ---------------------------------------------------------------------------- */

export function setupNotificationPreferencesController() {
  const form = document.getElementById('notifPreferencesForm');
  if (!form) return;

  const prefs = getNotificationPreferences();

  // Populate checkboxes
  const txCheck = document.getElementById('prefTransactionAlerts');
  const secCheck = document.getElementById('prefSecurityAlerts');
  const acctCheck = document.getElementById('prefAccountUpdates');
  const promoCheck = document.getElementById('prefPromotionalOffers');
  const wireCheck = document.getElementById('prefWireUpdates');
  const cardCheck = document.getElementById('prefCardNotifications');

  const inAppCheck = document.getElementById('prefDeliveryInApp');
  const emailCheck = document.getElementById('prefDeliveryEmail');
  const pushCheck = document.getElementById('prefDeliveryPush');

  if (txCheck) txCheck.checked = prefs.transactions;
  if (secCheck) {
    secCheck.checked = true; // Mandatory
    secCheck.disabled = true; // Cannot be disabled
  }
  if (acctCheck) acctCheck.checked = prefs.account;
  if (promoCheck) promoCheck.checked = prefs.promotions;
  if (wireCheck) wireCheck.checked = prefs.wire;
  if (cardCheck) cardCheck.checked = prefs.cards;

  if (inAppCheck) inAppCheck.checked = prefs.delivery_in_app;
  if (emailCheck) emailCheck.checked = prefs.delivery_email;
  if (pushCheck) {
    pushCheck.checked = false;
    pushCheck.disabled = true; // Coming soon
  }

  // Handle Form Submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const updated = {
      transactions: txCheck ? txCheck.checked : true,
      security: true, // mandatory
      account: acctCheck ? acctCheck.checked : true,
      promotions: promoCheck ? promoCheck.checked : false,
      wire: wireCheck ? wireCheck.checked : true,
      cards: cardCheck ? cardCheck.checked : true,
      delivery_in_app: inAppCheck ? inAppCheck.checked : true,
      delivery_email: emailCheck ? emailCheck.checked : true,
      delivery_push: false,
    };

    saveNotificationPreferences(updated);
    showToast('Notification & communication preferences saved.', 'success', 'Preferences Updated');
  });

  // Test Email Button
  const btnTestEmail = document.getElementById('btnSendTestEmail');
  if (btnTestEmail) {
    btnTestEmail.addEventListener('click', async () => {
      const user = getDemoStorageUser() || { id: 'usr-101', fullName: 'Miz Brymo', email: 'mizbrymo@gmail.com' };
      btnTestEmail.disabled = true;
      btnTestEmail.textContent = 'Generating & Sending...';
      try {
        await sendTransactionEmail(user.id, {
          type: 'credit',
          amount: 5250.0,
          currency: 'USD',
          reference: `WBCU-TEST-${Date.now().toString().slice(-4)}`,
          description: 'Sovereign Treasury Demonstration Credit',
          newBalance: 248930.5,
        });
        showToast('Sample transaction alert email dispatched & logged in email_logs.', 'success', 'Email Sent');
      } catch (err) {
        showToast('Error sending test notification.', 'error');
      } finally {
        btnTestEmail.disabled = false;
        btnTestEmail.textContent = 'Send Test Transaction Email';
      }
    });
  }
}

/* ----------------------------------------------------------------------------
 * 12. INITIALIZATION HOOK
 * ---------------------------------------------------------------------------- */

export function initNotificationsSystem() {
  const user = getDemoStorageUser() || { id: 'wb-usr-demo-01' };

  // 1. Initial Badge & Bell Dropdown Sync
  updateBellDropdownBadge();

  // 2. Setup Page Controllers if DOM present
  setupNotificationsPageController();
  setupNotificationPreferencesController();

  // 3. Connect Supabase Realtime channel
  setupSupabaseRealtimeNotifications(user.id);
}
