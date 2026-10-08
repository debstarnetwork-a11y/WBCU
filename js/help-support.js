/**
 * ============================================================================
 * WB CREDIT UNION - HELP & SUPPORT CONTROLLER (js/help-support.js)
 * ============================================================================
 * 
 * Manages all member assistance, FAQs, emergency actions, ticketing,
 * Swiss branch information, and 24/7 priority live concierge chat.
 * ============================================================================
 */

import { showToast, getDemoStorageUser } from './supabase-config.js';
import { createNotification } from './notifications-email.js';

// Local storage keys
const TICKETS_STORAGE_KEY = 'wb_credit_union_support_tickets';
const LIVE_CHAT_STORAGE_KEY = 'wb_credit_union_live_chat_history';

/* ----------------------------------------------------------------------------
 * 1. COMPREHENSIVE FAQ DATA REPOSITORY (35+ BANKING QUESTIONS ACROSS 6 CATEGORIES)
 * ---------------------------------------------------------------------------- */
export const FAQ_DATA = [
  // --- Category: Account ---
  {
    id: 'faq-acct-1',
    category: 'account',
    categoryName: 'Account',
    question: 'What is my WB Credit Union account and routing transit number?',
    answer: 'Your account number is available in the top right user menu and under the Accounts tab. WB Credit Union operates under Federal Reserve Routing Number (ABA) <strong>251480576</strong>. For international incoming wires, our SWIFT/BIC code is <strong>WBCUUS33</strong>.',
    tags: ['routing', 'account number', 'swift', 'aba', 'wire info']
  },
  {
    id: 'faq-acct-2',
    category: 'account',
    categoryName: 'Account',
    question: 'How do I update my personal contact or mailing address?',
    answer: 'Navigate to <strong>Settings &rarr; Profile Settings</strong>. You can modify your phone number, residential address, and international tax domicile. To change your primary email address, a two-step verification security token will be dispatched.',
    tags: ['address', 'profile', 'email change', 'phone']
  },
  {
    id: 'faq-acct-3',
    category: 'account',
    categoryName: 'Account',
    question: 'What are the monthly account maintenance and vault custody fees?',
    answer: 'WB Credit Union provides zero-fee monthly maintenance on all sovereign multi-currency checking accounts for verified members maintaining an aggregate balance above $1,000 USD (or currency equivalent). Crypto cold-vault custody is included at zero additional charge.',
    tags: ['fees', 'maintenance', 'charges', 'minimum balance']
  },
  {
    id: 'faq-acct-4',
    category: 'account',
    categoryName: 'Account',
    question: 'How do I open a secondary multi-currency savings or commercial vault?',
    answer: 'Click the <strong>"Open New Account"</strong> button in the Accounts tab. You can instantly provision sub-accounts in USD, EUR, GBP, CHF, CAD, AUD, JPY, NGN, or BTC with custom account nicknames and independent IBAN/account numbers.',
    tags: ['open account', 'multi-currency', 'savings', 'sub-account']
  },
  {
    id: 'faq-acct-5',
    category: 'account',
    categoryName: 'Account',
    question: 'How do I close my depository account if needed?',
    answer: 'Go to <strong>Security &rarr; Close Member Account</strong> at the bottom of the Security page. Account closure requires withdrawal or transfer of remaining balances, followed by verification of your Master Password and 4-digit Security PIN.',
    tags: ['close account', 'terminate', 'cancel membership']
  },
  {
    id: 'faq-acct-6',
    category: 'account',
    categoryName: 'Account',
    question: 'How do I download monthly certified bank statements?',
    answer: 'Official audited statements are available under <strong>Settings &rarr; Bank Statements</strong> and inside the Account Details modal. You can preview digitally stamped PDF statements or generate custom date range records.',
    tags: ['statement', 'download pdf', 'tax statement', 'audit']
  },
  {
    id: 'faq-acct-7',
    category: 'account',
    categoryName: 'Account',
    question: 'Is my depository balance insured and protected?',
    answer: 'Yes. Member deposits are fully insured up to <strong>$25,000,000 USD</strong> under sovereign credit union multi-custody excess reserve coverage, backed by NCUA regulatory standards and Swiss banking depository vaults.',
    tags: ['insurance', 'ncua', 'fdic', 'protection', 'safety']
  },

  // --- Category: Transfers ---
  {
    id: 'faq-trans-1',
    category: 'transfers',
    categoryName: 'Transfers',
    question: 'How long do international wire transfers take to settle?',
    answer: 'Domestic Fedwire and instant SEPA transfers settle within <strong>1 to 4 hours</strong>. International SWIFT interbank wires typically clear within <strong>24 to 48 business hours</strong> once required compliance tokens (COT/IMF) are confirmed.',
    tags: ['wire speed', 'settlement time', 'swift', 'clearing']
  },
  {
    id: 'faq-trans-2',
    category: 'transfers',
    categoryName: 'Transfers',
    question: 'What is a COT (Cost of Transfer) Code and why is it requested?',
    answer: 'A <strong>Cost of Transfer (COT) Code</strong> is an institutional interbank clearing token mandated by international monetary routing standards for high-value cross-border wires. It confirms liquidity clearing charges between correspondent banks. If you need or request transfer codes, contact Treasury Operations at <strong><a href="mailto:support@wbcu.net" style="color:#2563eb; font-weight:600;">support@wbcu.net</a></strong>.',
    tags: ['cot code', 'wire token', 'interbank', 'clearance']
  },
  {
    id: 'faq-trans-3',
    category: 'transfers',
    categoryName: 'Transfers',
    question: 'What is an IMF / Tax Clearance Certificate for cross-border wires?',
    answer: 'For wires exceeding institutional thresholds ($10,000+ USD/EUR), international cross-border anti-money laundering regulations may require an <strong>IMF (International Monetary Fund) Anti-Terrorism & Tax Clearance Token</strong> to release held correspondent funds. To request or verify transfer codes, contact <strong><a href="mailto:support@wbcu.net" style="color:#2563eb; font-weight:600;">support@wbcu.net</a></strong>.',
    tags: ['imf code', 'tax clearance', 'anti-money laundering', 'compliance']
  },
  {
    id: 'faq-trans-4',
    category: 'transfers',
    categoryName: 'Transfers',
    question: 'What are the daily and monthly transfer limits?',
    answer: 'Standard verified tier limits: Internal Account Transfers: <strong>$100,000/day</strong>; Domestic ACH/Fedwire: <strong>$250,000/day</strong>; International SWIFT: <strong>$1,000,000/day</strong>. To request higher limits, submit a ticket to Private Wealth Support.',
    tags: ['limits', 'transfer maximum', 'daily limit', 'increase']
  },
  {
    id: 'faq-trans-5',
    category: 'transfers',
    categoryName: 'Transfers',
    question: 'How do I perform an instant internal transfer between my own vaults?',
    answer: 'Click <strong>"Transfers"</strong> or <strong>"Send Money"</strong> on the dashboard, select "Internal Transfer", choose your source and destination accounts, input the amount, and confirm. Funds transfer instantaneously with zero slippage or fees.',
    tags: ['internal transfer', 'swap', 'move money', 'instant']
  },
  {
    id: 'faq-trans-6',
    category: 'transfers',
    categoryName: 'Transfers',
    question: 'Can I cancel or recall a wire transfer once broadcasted?',
    answer: 'Wires in <em>Pending Clearance</em> or <em>Awaiting Code</em> status can be recalled immediately via the Wire Transfer view. Once an interbank SWIFT wire has achieved <em>Broadcasted / Settled</em> status, an official SWIFT MT199 Recall Request must be opened through Support.',
    tags: ['cancel wire', 'recall', 'stop payment', 'reversal']
  },
  {
    id: 'faq-trans-7',
    category: 'transfers',
    categoryName: 'Transfers',
    question: 'What fees apply to international SWIFT wires?',
    answer: 'Standard outbound SWIFT wires incur an institutional routing fee of <strong>$25.00 USD</strong> (or free for Sovereign Platinum tier members). Inbound wires are processed with zero receiver deductions.',
    tags: ['wire fees', 'swift cost', 'international wire']
  },

  // --- Category: Cards ---
  {
    id: 'faq-card-1',
    category: 'cards',
    categoryName: 'Cards',
    question: 'How do I report a lost or stolen payment card immediately?',
    answer: 'Go to <strong>Cards</strong> in the sidebar, select the card, and click <strong>"Report Lost / Stolen"</strong> (or use the Emergency Actions bar below). The card will be permanently blocked in real-time, and a new virtual and physical card will be reissued.',
    tags: ['lost card', 'stolen card', 'block card', 'emergency']
  },
  {
    id: 'faq-card-2',
    category: 'cards',
    categoryName: 'Cards',
    question: 'How do I change my 4-digit ATM / Point-of-Sale PIN?',
    answer: 'Open the <strong>Cards</strong> view, click <strong>"Change PIN"</strong> on your active card, enter your current 4-digit PIN, and choose your new PIN. The change synchronizes instantly with global Visa/Mastercard EMV networks.',
    tags: ['change pin', 'atm pin', 'card pin', 'security']
  },
  {
    id: 'faq-card-3',
    category: 'cards',
    categoryName: 'Cards',
    question: 'How do I create a Virtual Card for secure online purchases?',
    answer: 'In the <strong>Cards</strong> view, click <strong>"Order Virtual Card"</strong>. Your new tokenized virtual card with dynamic CVV is provisioned in 3 seconds and ready for Apple Pay, Google Pay, and online merchant checkout.',
    tags: ['virtual card', 'apple pay', 'google pay', 'online spending']
  },
  {
    id: 'faq-card-4',
    category: 'cards',
    categoryName: 'Cards',
    question: 'How do I freeze or unfreeze my debit card temporarily?',
    answer: 'You can toggle the <strong>"Card Lock / Freeze"</strong> switch directly on any card inside the Cards section. While frozen, all new in-store, online, and ATM transactions are declined until you toggle it back.',
    tags: ['freeze card', 'lock card', 'unfreeze', 'temporary block']
  },
  {
    id: 'faq-card-5',
    category: 'cards',
    categoryName: 'Cards',
    question: 'Can I use my WB Credit Union Platinum Debit Card abroad?',
    answer: 'Yes! WB Credit Union debit cards feature <strong>zero foreign transaction fees</strong> worldwide across 200+ countries with automatic mid-market foreign exchange conversion at interbank rates.',
    tags: ['travel', 'international use', 'foreign transaction fee', 'abroad']
  },
  {
    id: 'faq-card-6',
    category: 'cards',
    categoryName: 'Cards',
    question: 'What is 3D Secure / Visa Secure OTP verification?',
    answer: 'When shopping online at participating merchants, an instant 6-digit One-Time Passcode (OTP) is sent to your registered email and SMS to authenticate the purchase before funds are debited.',
    tags: ['3d secure', 'otp', 'visa secure', 'sms code']
  },
  {
    id: 'faq-card-7',
    category: 'cards',
    categoryName: 'Cards',
    question: 'How do I adjust daily spending and ATM withdrawal limits?',
    answer: 'In the <strong>Cards</strong> section, click "Spending Controls" to adjust daily POS limits (up to $25,000/day) and ATM cash withdrawal limits (up to $5,000/day) with instant real-time activation.',
    tags: ['spending limits', 'atm limit', 'daily cap']
  },

  // --- Category: Crypto ---
  {
    id: 'faq-cry-1',
    category: 'crypto',
    categoryName: 'Crypto',
    question: 'How do I receive cryptocurrency into my WB Credit Union vault?',
    answer: 'Go to <strong>Crypto</strong> in the sidebar, choose your digital asset (BTC, ETH, USDT, SOL, USDC), and click <strong>"Receive"</strong>. A permanent public blockchain deposit address and QR code will be generated for your secure vault.',
    tags: ['receive crypto', 'deposit btc', 'deposit eth', 'crypto address']
  },
  {
    id: 'faq-cry-2',
    category: 'crypto',
    categoryName: 'Crypto',
    question: 'How long do blockchain deposit confirmations take to appear in my balance?',
    answer: 'Bitcoin deposits require <strong>2 network confirmations (~20 minutes)</strong>. Ethereum and USDT (ERC-20) require <strong>12 confirmations (~3 minutes)</strong>. Solana deposits credit in under <strong>10 seconds</strong>.',
    tags: ['crypto speed', 'blockchain confirmations', 'deposit time']
  },
  {
    id: 'faq-cry-3',
    category: 'crypto',
    categoryName: 'Crypto',
    question: 'What cryptocurrencies are supported by WB Credit Union?',
    answer: 'We currently support native custody for <strong>Bitcoin (BTC), Ethereum (ETH), Solana (SOL), Tether (USDT), and USD Coin (USDC)</strong> with institutional cold storage HSM safeguards.',
    tags: ['supported assets', 'coins', 'tokens', 'crypto list']
  },
  {
    id: 'faq-cry-4',
    category: 'crypto',
    categoryName: 'Crypto',
    question: 'How do I swap or convert Bitcoin to fiat USD or other crypto assets?',
    answer: 'Use the <strong>"Convert & Swap"</strong> tool in the Crypto tab. You can swap instantly between BTC, ETH, USDT, and USD at live oracle benchmark rates with zero spread markup.',
    tags: ['swap crypto', 'convert btc', 'sell crypto', 'fiat cashout']
  },
  {
    id: 'faq-cry-5',
    category: 'crypto',
    categoryName: 'Crypto',
    question: 'Are digital assets held in institutional cold storage?',
    answer: 'Yes. 100% of member crypto reserves are custodied in multi-signature, air-gapped Swiss bunker hardware security modules (HSM) protected by institutional cryptographic key shards.',
    tags: ['cold storage', 'hsm', 'security', 'vault safety']
  },
  {
    id: 'faq-cry-6',
    category: 'crypto',
    categoryName: 'Crypto',
    question: 'Why do outbound crypto withdrawals require a blockchain network miner fee?',
    answer: 'Outbound transfers require native blockchain network miner/gas fees to prioritize transactions across distributed nodes. WB Credit Union does not charge any additional custodial markup on gas fees.',
    tags: ['gas fee', 'miner fee', 'network fee', 'crypto fee']
  },

  // --- Category: Security ---
  {
    id: 'faq-sec-1',
    category: 'security',
    categoryName: 'Security',
    question: 'How do I change my master banking password?',
    answer: 'Visit <strong>Security &rarr; Change Master Password</strong>. Enter your current password, type your new strong password (with our live strength evaluator), and confirm. Changes update immediately.',
    tags: ['change password', 'reset password', 'credential update']
  },
  {
    id: 'faq-sec-2',
    category: 'security',
    categoryName: 'Security',
    question: 'How do I enable Biometric Login (Touch ID, Face ID, Windows Hello)?',
    answer: 'Go to <strong>Security &rarr; Biometric Authentication (WebAuthn)</strong>, click "Enable Biometrics" or "+ Register New Key", and follow your device prompt. You can register multiple biometrics across laptops and phones.',
    tags: ['biometrics', 'touch id', 'face id', 'webauthn', 'fingerprint']
  },
  {
    id: 'faq-sec-3',
    category: 'security',
    categoryName: 'Security',
    question: 'How do I set up Two-Factor Authentication (2FA) with Google Authenticator?',
    answer: 'Under <strong>Security &rarr; Two-Factor Authentication (2FA)</strong>, click "Enable 2FA". Scan the secret QR code using Google Authenticator, Authy, or 1Password, and enter the 6-digit verification code.',
    tags: ['2fa', 'totp', 'authenticator', 'two factor', 'google auth']
  },
  {
    id: 'faq-sec-4',
    category: 'security',
    categoryName: 'Security',
    question: 'What are 2FA Emergency Backup Recovery Codes?',
    answer: 'When enrolling in 2FA, 10 single-use cryptographic recovery codes are generated. If you lose access to your authenticator phone, each code grants one-time emergency access to your vault.',
    tags: ['backup codes', 'emergency recovery', 'lost phone']
  },
  {
    id: 'faq-sec-5',
    category: 'security',
    categoryName: 'Security',
    question: 'How do I view and revoke active login sessions on other devices?',
    answer: 'Visit <strong>Security &rarr; Active Login Sessions</strong>. You can see IP addresses, approximate geographic locations, device browsers, and click "Revoke" or "Revoke All Other Sessions".',
    tags: ['active sessions', 'remote logout', 'device management', 'ip tracking']
  },
  {
    id: 'faq-sec-6',
    category: 'security',
    categoryName: 'Security',
    question: 'What should I do if I suspect unauthorized account access?',
    answer: 'Immediately use the <strong>"Freeze All Accounts"</strong> button in Help & Support or Security, or call our 24/7 fraud emergency hotline at <strong>001 (207) 613-1332</strong>. All active tokens will be revoked instantly.',
    tags: ['fraud', 'unauthorized', 'hacked', 'freeze']
  },
  {
    id: 'faq-sec-7',
    category: 'security',
    categoryName: 'Security',
    question: 'How do I recognize official correspondence from WB Credit Union?',
    answer: 'Official email notifications will only originate from <code>@wbcu.net</code> or <code>@wbcredit.org</code>. We will never ask for your Master Password, 4-digit Security PIN, or 2FA OTP codes via phone or email.',
    tags: ['phishing', 'official email', 'scam prevention', 'verification']
  },

  // --- Category: General & Swiss HQ ---
  {
    id: 'faq-gen-1',
    category: 'general',
    categoryName: 'General',
    question: 'What is the official Swiss headquarters address and location?',
    answer: 'Our global sovereign clearing headquarters is located at:<br /><strong>WB CREDIT UNION</strong><br />109, Feldgüetliweg Meilen<br />Bezirk Meilen, Zurich 8706, Switzerland.<br />Coordinates: 47.2704° N, 8.6432° E (Lake Zurich Gold Coast).',
    tags: ['address', 'zurich', 'switzerland', 'headquarters', 'location']
  },
  {
    id: 'faq-gen-2',
    category: 'general',
    categoryName: 'General',
    question: 'What are WB Credit Union customer service and banking hours?',
    answer: 'Telephone & Concierge Support: <strong>24/7/365</strong>.<br />Zurich Branch Visiting Hours: <strong>Monday – Friday: 9:00 AM – 5:00 PM CET</strong>, <strong>Saturday: 9:00 AM – 1:00 PM CET</strong>, Sunday: Closed.',
    tags: ['hours', 'opening times', 'support availability']
  },
  {
    id: 'faq-gen-3',
    category: 'general',
    categoryName: 'General',
    question: 'How do I contact Priority Wealth Management and Private Banking?',
    answer: 'Members with assets exceeding $250,000 USD are assigned a dedicated Senior Private Wealth Officer. Contact the executive desk via phone at <strong>+41 44 915 8900</strong> or email <strong>privatewealth@wbcu.net</strong>.',
    tags: ['wealth management', 'private banker', 'vip support']
  },
  {
    id: 'faq-gen-4',
    category: 'general',
    categoryName: 'General',
    question: 'Is WB Credit Union a chartered and regulated credit institution?',
    answer: 'Yes. WB Credit Union is an institutional member-owned credit institution operating in compliance with international interbank standards, NCUA sovereign protections, and Swiss Federal Banking standards.',
    tags: ['license', 'regulation', 'charter', 'compliance']
  },
  {
    id: 'faq-gen-5',
    category: 'general',
    categoryName: 'General',
    question: 'How do I schedule an in-person appointment at the Zurich headquarters?',
    answer: 'Click the <strong>"Visit Branch"</strong> quick action card or contact your private banker. In-person consultations for physical vault access, large gold transfers, or bespoke corporate underwriting require 24-hour advance scheduling.',
    tags: ['appointment', 'visit', 'branch consultation']
  },
  {
    id: 'faq-gen-6',
    category: 'general',
    categoryName: 'General',
    question: 'How do I submit formal member feedback or file a complaint?',
    answer: 'You can submit a formal inquiry by selecting "Complaint" or "Other" in the Contact Form below. Complaints are routed directly to the Chief Compliance Officer and responded to within 24 business hours.',
    tags: ['feedback', 'complaint', 'ombudsman', 'compliance']
  }
];

/* ----------------------------------------------------------------------------
 * 2. DEFAULT INITIAL SUPPORT TICKETS STORE
 * ---------------------------------------------------------------------------- */
export function getInitialSupportTickets() {
  return [
    {
      id: 'TKT-WBCU-902148',
      subject: 'Virtual Platinum Card Limit Increase',
      category: 'Card Issue',
      priority: 'Medium',
      status: 'Open',
      dateSubmitted: 'Sep 25, 2026, 02:40 PM',
      lastUpdated: 'Sep 25, 2026, 04:15 PM',
      messages: [
        {
          sender: (getDemoStorageUser()?.fullName || 'Miz Brymo'),
          isStaff: false,
          avatar: 'A',
          time: 'Sep 25, 2026, 02:40 PM',
          text: 'Hello, I would like to request an increase to my Virtual Visa Platinum card daily spending limit from $10,000 to $25,000 USD for upcoming commercial equipment procurement.',
          attachment: null
        },
        {
          sender: 'Elena Rossi (Card Operations)',
          isStaff: true,
          avatar: 'ER',
          time: 'Sep 25, 2026, 04:15 PM',
          text: 'Dear Valued Member, thank you for contacting Card Services. We have received your limit increase request. Our underwriting team is reviewing your account history and will finalize approval shortly.',
          attachment: null
        }
      ]
    },
    {
      id: 'TKT-WBCU-892014',
      subject: 'Travel Notification - Zurich & London Trip',
      category: 'Account Issue',
      priority: 'Low',
      status: 'In Progress',
      dateSubmitted: 'Sep 20, 2026, 10:15 AM',
      lastUpdated: 'Sep 21, 2026, 09:30 AM',
      messages: [
        {
          sender: (getDemoStorageUser()?.fullName || 'Miz Brymo'),
          isStaff: false,
          avatar: 'A',
          time: 'Sep 20, 2026, 10:15 AM',
          text: 'Informing customer service that I will be traveling to Zurich (Switzerland) and London (UK) from October 1 to October 15. Please ensure my debit cards and wire transfers do not trigger automated fraud locks.',
          attachment: null
        },
        {
          sender: 'Marc Bieri (Senior Security Officer)',
          isStaff: true,
          avatar: 'MB',
          time: 'Sep 21, 2026, 09:30 AM',
          text: 'Hello, your international travel exception flags have been registered for Switzerland and the United Kingdom. Enjoy your travels, and our Zurich headquarters at Meilen is available if you require in-person services.',
          attachment: null
        }
      ]
    },
    {
      id: 'TKT-WBCU-841920',
      subject: 'COT Clearance Confirmation for Euro Wire',
      category: 'Transfer Problem',
      priority: 'High',
      status: 'Resolved',
      dateSubmitted: 'Sep 10, 2026, 11:00 AM',
      lastUpdated: 'Sep 11, 2026, 03:20 PM',
      messages: [
        {
          sender: (getDemoStorageUser()?.fullName || 'Miz Brymo'),
          isStaff: false,
          avatar: 'A',
          time: 'Sep 10, 2026, 11:00 AM',
          text: 'Requesting confirmation that the COT regulatory clearance token for wire reference WB-WIRE-8841 has been validated by the correspondent clearing house.',
          attachment: 'COT_Clearance_Record.pdf'
        },
        {
          sender: 'Swiss Interbank Desk (Zurich)',
          isStaff: true,
          avatar: 'WBCU',
          time: 'Sep 11, 2026, 03:20 PM',
          text: 'Confirmed. The COT code and IMF compliance tokens were successfully acknowledged by the Euro clearing rail. Funds have been credited to the beneficiary.',
          attachment: null
        }
      ]
    }
  ];
}

export function getUserSupportTickets() {
  const data = localStorage.getItem(TICKETS_STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return getInitialSupportTickets();
    }
  }
  const initial = getInitialSupportTickets();
  localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

export function saveUserSupportTickets(tickets) {
  localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
}

/* ----------------------------------------------------------------------------
 * 3. LIVE CHAT DEFAULT CONVERSATION REPOSITORY
 * ---------------------------------------------------------------------------- */
export function getLiveChatHistory() {
  const data = localStorage.getItem(LIVE_CHAT_STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return getInitialLiveChatMessages();
    }
  }
  const initial = getInitialLiveChatMessages();
  localStorage.setItem(LIVE_CHAT_STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

export function saveLiveChatHistory(messages) {
  localStorage.setItem(LIVE_CHAT_STORAGE_KEY, JSON.stringify(messages));
}

export function getInitialLiveChatMessages() {
  return [
    {
      sender: 'bot',
      name: 'WB Priority Concierge',
      time: 'Just now',
      text: 'Hello Alexander, welcome to WB Credit Union 24/7 Priority Support. How can our Swiss clearing and banking operations assist you today?'
    }
  ];
}

/* ----------------------------------------------------------------------------
 * 4. HELP & SUPPORT CONTROLLER INITIALIZER
 * ---------------------------------------------------------------------------- */
let activeFaqCategory = 'all';
let currentSearchQuery = '';
let selectedAttachmentFile = null;
let currentActiveThreadTicketId = null;

export function setupHelpSupportController() {
  const helpView = document.getElementById('helpView');
  if (!helpView) return;

  // 1. Render FAQs with active filter & search
  renderFaqAccordionList();

  // 2. Setup Category Filter Tabs
  setupFaqCategoryTabs();

  // 3. Setup Universal Help Search Bar
  setupHelpSearchBar();

  // 4. Setup Quick Action Cards (Call, Email, Branch, Live Chat)
  setupQuickActionCards();

  // 5. Setup Contact / Ticket Form
  setupContactTicketForm();

  // 6. Render Support Tickets History
  renderSupportTicketsList();

  // 7. Setup Ticket Filter Pills
  setupTicketFilterPills();

  // 8. Setup Emergency Action Modals (Freeze, Block Cards, Report Fraud)
  setupEmergencyActionModals();

  // 9. Setup Live Chat Modal & Engine
  setupLiveChatModal();

  // 10. Setup Ticket Conversation Thread Modal
  setupTicketThreadModal();
}

/* ----------------------------------------------------------------------------
 * 5. FAQ ACCORDION RENDERER & INTERACTION
 * ---------------------------------------------------------------------------- */
export function renderFaqAccordionList() {
  const container = document.getElementById('faqAccordionContainer');
  const countBadge = document.getElementById('faqResultsCount');
  if (!container) return;

  const query = currentSearchQuery.toLowerCase().trim();

  const filteredFaqs = FAQ_DATA.filter((faq) => {
    const matchesCategory = activeFaqCategory === 'all' || faq.category === activeFaqCategory;
    if (!matchesCategory) return false;

    if (!query) return true;

    const inQuestion = faq.question.toLowerCase().includes(query);
    const inAnswer = faq.answer.toLowerCase().includes(query);
    const inTags = faq.tags.some((t) => t.toLowerCase().includes(query));
    return inQuestion || inAnswer || inTags;
  });

  if (countBadge) {
    countBadge.textContent = `${filteredFaqs.length} ${filteredFaqs.length === 1 ? 'topic' : 'topics'} found`;
  }

  if (filteredFaqs.length === 0) {
    container.innerHTML = `
      <div class="p-5 text-center bg-light rounded-2xl border">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
        <h4 class="font-bold text-navy mb-1">No matching support articles found</h4>
        <p class="text-xs text-muted mb-3">We couldn't find anything matching "${currentSearchQuery}". Try a different search term or contact our 24/7 priority desk directly.</p>
        <div class="d-flex justify-center gap-2">
          <button type="button" class="btn btn-outline btn-sm text-xs" id="btnClearFaqSearchBtn">Clear Search</button>
          <button type="button" class="btn btn-primary btn-sm text-xs" id="btnOpenChatFromNoResults">Open Live Chat</button>
        </div>
      </div>
    `;

    document.getElementById('btnClearFaqSearchBtn')?.addEventListener('click', () => {
      const input = document.getElementById('helpSearchInput');
      if (input) input.value = '';
      currentSearchQuery = '';
      renderFaqAccordionList();
    });

    document.getElementById('btnOpenChatFromNoResults')?.addEventListener('click', () => {
      openLiveChatModal();
    });

    return;
  }

  container.innerHTML = filteredFaqs
    .map((faq, index) => {
      const categoryBadgeColors = {
        account: 'bg-blue-50 text-blue-700 border-blue-200',
        transfers: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        cards: 'bg-amber-50 text-amber-700 border-amber-200',
        crypto: 'bg-purple-50 text-purple-700 border-purple-200',
        security: 'bg-rose-50 text-rose-700 border-rose-200',
        general: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };

      const badgeClass = categoryBadgeColors[faq.category] || 'bg-gray-50 text-gray-700';

      return `
        <div class="faq-accordion-item border rounded-xl mb-3 overflow-hidden bg-white shadow-sm" data-id="${faq.id}">
          <button type="button" class="faq-accordion-header d-flex justify-between align-center w-100 p-4 text-left cursor-pointer border-0 bg-white" aria-expanded="false" style="outline: none;">
            <div class="d-flex align-center gap-3 pr-3">
              <span class="badge ${badgeClass} text-xs uppercase font-bold px-2 py-1 rounded-md" style="font-size: 10px; letter-spacing: 0.04em;">
                ${faq.categoryName}
              </span>
              <span class="faq-question-title font-semibold text-navy text-sm md:text-base">
                ${faq.question}
              </span>
            </div>
            <div class="faq-chevron-icon" style="transition: transform 0.25s ease; color: #64748b;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </button>
          <div class="faq-accordion-body p-4 pt-0 text-xs md:text-sm text-muted border-top" style="display: none; background: #fcfdfe; line-height: 1.65; border-color: #f1f5f9;">
            <div class="pt-3">
              ${faq.answer}
            </div>
            <div class="faq-helpful-footer d-flex flex-wrap justify-between align-center pt-3 mt-3 border-top gap-2 text-xs" style="border-color: #f1f5f9;">
              <span class="text-muted">Was this article helpful?</span>
              <div class="d-flex align-center gap-2">
                <button type="button" class="btn-helpful-feedback btn btn-outline btn-sm py-1 px-2 text-xs" data-helpful="yes" data-faq="${faq.id}">
                  👍 Yes
                </button>
                <button type="button" class="btn-helpful-feedback btn btn-outline btn-sm py-1 px-2 text-xs" data-helpful="no" data-faq="${faq.id}">
                  👎 No
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  // Wire up accordion toggle clicks
  container.querySelectorAll('.faq-accordion-header').forEach((header) => {
    header.addEventListener('click', () => {
      const item = header.closest('.faq-accordion-item');
      const body = item.querySelector('.faq-accordion-body');
      const chevron = item.querySelector('.faq-chevron-icon');
      const isExpanded = header.getAttribute('aria-expanded') === 'true';

      // Toggle this item
      if (isExpanded) {
        header.setAttribute('aria-expanded', 'false');
        body.style.display = 'none';
        chevron.style.transform = 'rotate(0deg)';
        item.classList.remove('is-open');
      } else {
        header.setAttribute('aria-expanded', 'true');
        body.style.display = 'block';
        chevron.style.transform = 'rotate(180deg)';
        item.classList.add('is-open');
      }
    });
  });

  // Wire up helpful feedback buttons
  container.querySelectorAll('.btn-helpful-feedback').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isYes = btn.getAttribute('data-helpful') === 'yes';
      const parent = btn.closest('.faq-helpful-footer');
      if (parent) {
        parent.innerHTML = `
          <span class="text-green text-xs font-semibold">
            ✓ Thank you for your feedback! It helps us refine our depository guidelines.
          </span>
        `;
      }
    });
  });
}

function setupFaqCategoryTabs() {
  const tabs = document.querySelectorAll('.faq-cat-tab-btn');
  tabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeFaqCategory = tab.getAttribute('data-cat') || 'all';
      renderFaqAccordionList();
    });
  });
}

function setupHelpSearchBar() {
  const searchInput = document.getElementById('helpSearchInput');
  const clearBtn = document.getElementById('btnClearHelpSearch');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      currentSearchQuery = searchInput.value;
      if (clearBtn) {
        clearBtn.style.display = currentSearchQuery.length > 0 ? 'block' : 'none';
      }
      renderFaqAccordionList();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      currentSearchQuery = '';
      clearBtn.style.display = 'none';
      renderFaqAccordionList();
      searchInput?.focus();
    });
  }
}

/* ----------------------------------------------------------------------------
 * 6. QUICK ACTION CARDS (Call, Email, Branch, Live Chat)
 * ---------------------------------------------------------------------------- */
function setupQuickActionCards() {
  // Call Us Card -> Opens Call Info Modal
  document.getElementById('quickActionCallUs')?.addEventListener('click', () => {
    const modal = document.getElementById('callSupportModal');
    if (modal) modal.classList.add('is-active');
  });

  // Email Us Card -> Scrolls smoothly to Contact Form
  document.getElementById('quickActionEmailUs')?.addEventListener('click', () => {
    const formSection = document.getElementById('helpContactFormCard');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('ticketSubjectSelect')?.focus();
    }
  });

  // Visit Branch Card -> Opens Zurich Branch Modal
  document.getElementById('quickActionVisitBranch')?.addEventListener('click', () => {
    const modal = document.getElementById('branchVisitModal');
    if (modal) modal.classList.add('is-active');
  });

  // Live Chat Card -> Opens Live Chat Modal
  document.getElementById('quickActionLiveChat')?.addEventListener('click', () => {
    openLiveChatModal();
  });

  // Close modals
  document.getElementById('closeCallSupportModalBtn')?.addEventListener('click', () => {
    document.getElementById('callSupportModal')?.classList.remove('is-active');
  });
  document.getElementById('closeBranchVisitModalBtn')?.addEventListener('click', () => {
    document.getElementById('branchVisitModal')?.classList.remove('is-active');
  });

  // Request priority callback in Call Support Modal
  document.getElementById('requestCallbackForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const phoneInput = document.getElementById('callbackPhoneInput');
    const noteInput = document.getElementById('callbackNoteInput');
    const phoneVal = phoneInput?.value.trim();
    if (!phoneVal) return;

    showToast(`Priority callback requested for ${phoneVal}. A Senior Private Banker will dial you within 5 minutes.`, 'success', 'Callback Queued');
    document.getElementById('callSupportModal')?.classList.remove('is-active');
    phoneInput.value = '';
    if (noteInput) noteInput.value = '';
  });

  // Book in-person branch visit in Branch Modal
  document.getElementById('bookBranchVisitForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = document.getElementById('branchVisitDate')?.value;
    const time = document.getElementById('branchVisitTime')?.value;
    const purpose = document.getElementById('branchVisitPurpose')?.value;

    showToast(`Private consultation reserved for ${date} at ${time} at Meilen Zurich HQ (${purpose}). Confirmation emailed.`, 'success', 'Appointment Confirmed');
    document.getElementById('branchVisitModal')?.classList.remove('is-active');
  });
}

/* ----------------------------------------------------------------------------
 * 7. CONTACT FORM & TICKET SUBMISSION
 * ---------------------------------------------------------------------------- */
function setupContactTicketForm() {
  const form = document.getElementById('helpContactForm');
  const fileInput = document.getElementById('ticketFileInput');
  const filePreviewWrap = document.getElementById('ticketFilePreviewWrap');
  const fileNameDisplay = document.getElementById('ticketFileNameDisplay');
  const btnRemoveFile = document.getElementById('btnRemoveTicketFile');

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          showToast('File size exceeds 10MB limit.', 'error', 'File Too Large');
          fileInput.value = '';
          selectedAttachmentFile = null;
          return;
        }
        selectedAttachmentFile = file.name;
        if (fileNameDisplay) fileNameDisplay.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        if (filePreviewWrap) filePreviewWrap.style.display = 'flex';
      }
    });
  }

  if (btnRemoveFile) {
    btnRemoveFile.addEventListener('click', () => {
      if (fileInput) fileInput.value = '';
      selectedAttachmentFile = null;
      if (filePreviewWrap) filePreviewWrap.style.display = 'none';
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnSubmit = document.getElementById('btnSubmitTicket');
      const subjectSelect = document.getElementById('ticketSubjectSelect');
      const prioritySelect = document.getElementById('ticketPrioritySelect');
      const messageInput = document.getElementById('ticketMessageInput');

      const subject = subjectSelect?.value || 'General Account Inquiry';
      const priority = prioritySelect?.value || 'Medium';
      const message = messageInput?.value.trim();

      if (!message) {
        showToast('Please provide a message for your inquiry.', 'warning');
        return;
      }

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `
          <span class="spinner-border spinner-border-sm" role="status" style="width: 14px; height: 14px; border: 2px solid #fff; border-right-color: transparent; border-radius: 50%; display: inline-block; animation: spin 0.75s linear infinite;"></span>
          Transmitting to Audit Desk...
        `;
      }

      // Generate ticket reference number (e.g. TKT-WBCU-892410)
      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const ticketRef = `TKT-WBCU-${randomSuffix}`;

      const user = getDemoStorageUser() || { fullName: 'Miz Brymo' };

      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const newTicket = {
        id: ticketRef,
        subject,
        category: subject,
        priority,
        status: 'Open',
        dateSubmitted: formattedDate,
        lastUpdated: formattedDate,
        messages: [
          {
            sender: user.fullName || 'Miz Brymo',
            isStaff: false,
            avatar: (user.fullName || 'A').charAt(0).toUpperCase(),
            time: formattedDate,
            text: message,
            attachment: selectedAttachmentFile || null
          },
          {
            sender: 'WB Credit Union Automated Dispatch',
            isStaff: true,
            avatar: 'WBCU',
            time: formattedDate,
            text: `Your formal inquiry has been logged into the secure Zurich operations audit queue under reference ${ticketRef}. Priority clearance level: ${priority}. An assigned officer will review your dossier within 4 hours.`,
            attachment: null
          }
        ]
      };

      setTimeout(() => {
        // Save to tickets array
        const tickets = getUserSupportTickets();
        tickets.unshift(newTicket);
        saveUserSupportTickets(tickets);

        // Render updated tickets
        renderSupportTicketsList();

        // Create in-app notification
        createNotification({
          type: 'info',
          title: `Support Ticket Dispatched (${ticketRef})`,
          message: `Your inquiry regarding "${subject}" has been registered. Priority: ${priority}.`,
        });

        // Reset form
        form.reset();
        if (filePreviewWrap) filePreviewWrap.style.display = 'none';
        selectedAttachmentFile = null;

        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.innerHTML = 'Submit Formal Ticket';
        }

        showToast(`Support Ticket ${ticketRef} created successfully. Our team will respond shortly.`, 'success', 'Ticket Dispatched');

        // Scroll down to tickets section
        document.getElementById('supportTicketsSection')?.scrollIntoView({ behavior: 'smooth' });
      }, 700);
    });
  }
}

/* ----------------------------------------------------------------------------
 * 8. SUPPORT TICKETS HISTORY RENDERER & INTERACTION
 * ---------------------------------------------------------------------------- */
let activeTicketStatusFilter = 'all';

export function renderSupportTicketsList() {
  const container = document.getElementById('supportTicketsContainer');
  if (!container) return;

  const tickets = getUserSupportTickets();

  const filtered = tickets.filter((t) => {
    if (activeTicketStatusFilter === 'all') return true;
    return t.status.toLowerCase() === activeTicketStatusFilter.toLowerCase();
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="p-4 text-center text-muted bg-light rounded-xl border">
        <div style="font-size: 2rem; margin-bottom: 0.25rem;">📋</div>
        <p class="text-xs mb-0">No support tickets found in this category.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="table-responsive">
      <table class="table-modern w-100 text-xs" style="margin-bottom: 0;">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="padding: 12px 14px; font-weight: 700; color: #475569; text-transform: uppercase;">Ticket Reference</th>
            <th style="padding: 12px 14px; font-weight: 700; color: #475569; text-transform: uppercase;">Subject &amp; Category</th>
            <th style="padding: 12px 14px; font-weight: 700; color: #475569; text-transform: uppercase;">Priority</th>
            <th style="padding: 12px 14px; font-weight: 700; color: #475569; text-transform: uppercase;">Status</th>
            <th style="padding: 12px 14px; font-weight: 700; color: #475569; text-transform: uppercase;">Last Updated</th>
            <th style="padding: 12px 14px; font-weight: 700; color: #475569; text-transform: uppercase; text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${filtered
            .map((t) => {
              const statusBadges = {
                Open: 'background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe;',
                'In Progress': 'background: #fefce8; color: #ca8a04; border: 1px solid #fef08a;',
                Resolved: 'background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;',
                Closed: 'background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1;',
              };

              const priorityPills = {
                High: 'background: #fef2f2; color: #dc2626; font-weight: bold;',
                Medium: 'background: #eff6ff; color: #2563eb;',
                Low: 'background: #f8fafc; color: #64748b;',
              };

              const badgeStyle = statusBadges[t.status] || statusBadges['Open'];
              const priorityStyle = priorityPills[t.priority] || priorityPills['Medium'];

              return `
                <tr class="ticket-row-item hover:bg-slate-50 transition-colors" style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 12px 14px;">
                    <strong class="font-numeric text-navy font-semibold">${t.id}</strong>
                  </td>
                  <td style="padding: 12px 14px;">
                    <div class="font-semibold text-navy">${t.subject}</div>
                    <div class="text-muted" style="font-size: 11px;">${t.category}</div>
                  </td>
                  <td style="padding: 12px 14px;">
                    <span class="badge text-xs px-2 py-1 rounded-md" style="${priorityStyle}">
                      ${t.priority}
                    </span>
                  </td>
                  <td style="padding: 12px 14px;">
                    <span class="badge text-xs px-2 py-1 rounded-md" style="${badgeStyle}">
                      ${t.status}
                    </span>
                  </td>
                  <td style="padding: 12px 14px;" class="text-muted font-numeric">
                    ${t.lastUpdated}
                  </td>
                  <td style="padding: 12px 14px; text-align: right;">
                    <button type="button" class="btn btn-outline btn-sm text-xs py-1 px-3 btn-view-ticket-thread" data-ticket-id="${t.id}" style="border-color: #cbd5e1;">
                      View Thread &rarr;
                    </button>
                  </td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>
    </div>
  `;

  // Wire up view thread clicks
  container.querySelectorAll('.btn-view-ticket-thread').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ticketId = btn.getAttribute('data-ticket-id');
      openTicketThreadModal(ticketId);
    });
  });
}

function setupTicketFilterPills() {
  const pills = document.querySelectorAll('.ticket-filter-pill');
  pills.forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      pills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      activeTicketStatusFilter = pill.getAttribute('data-status') || 'all';
      renderSupportTicketsList();
    });
  });
}

/* ----------------------------------------------------------------------------
 * 9. TICKET CONVERSATION THREAD MODAL
 * ---------------------------------------------------------------------------- */
export function openTicketThreadModal(ticketId) {
  const modal = document.getElementById('ticketThreadModal');
  if (!modal) return;

  currentActiveThreadTicketId = ticketId;
  const tickets = getUserSupportTickets();
  const ticket = tickets.find((t) => t.id === ticketId);
  if (!ticket) return;

  document.getElementById('threadTicketRefDisplay').textContent = ticket.id;
  document.getElementById('threadTicketSubjectDisplay').textContent = ticket.subject;
  document.getElementById('threadTicketCategoryBadge').textContent = ticket.category;
  document.getElementById('threadTicketPriorityBadge').textContent = `${ticket.priority} Priority`;
  document.getElementById('threadTicketStatusBadge').textContent = ticket.status;

  renderTicketMessagesList(ticket);

  modal.classList.add('is-active');
}

function renderTicketMessagesList(ticket) {
  const container = document.getElementById('ticketThreadMessagesContainer');
  if (!container) return;

  container.innerHTML = ticket.messages
    .map((msg) => {
      if (msg.isStaff) {
        return `
          <div class="d-flex gap-3 mb-4">
            <div style="width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #1e3a8a, #2563eb); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; flex-shrink: 0;">
              ${msg.avatar}
            </div>
            <div class="p-3 rounded-2xl flex-1 border" style="background: #ffffff; border-color: #e2e8f0; border-top-left-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
              <div class="d-flex justify-between align-center mb-1">
                <span class="font-bold text-navy text-xs">${msg.sender}</span>
                <span class="text-xs text-muted font-numeric">${msg.time}</span>
              </div>
              <p class="text-xs text-muted mb-0" style="line-height: 1.6;">${msg.text}</p>
              ${
                msg.attachment
                  ? `<div class="mt-2 p-2 bg-light rounded text-xs d-flex align-center gap-2" style="background:#f1f5f9; border:1px solid #e2e8f0;">
                      <span>📎</span>
                      <strong class="font-numeric">${msg.attachment}</strong>
                    </div>`
                  : ''
              }
            </div>
          </div>
        `;
      } else {
        return `
          <div class="d-flex gap-3 justify-end mb-4">
            <div class="p-3 rounded-2xl border" style="background: #eff6ff; border-color: #bfdbfe; border-top-right-radius: 4px; max-width: 80%;">
              <div class="d-flex justify-between align-center mb-1 gap-3">
                <span class="font-bold text-blue text-xs">${msg.sender}</span>
                <span class="text-xs text-muted font-numeric">${msg.time}</span>
              </div>
              <p class="text-xs text-slate-800 mb-0" style="line-height: 1.6;">${msg.text}</p>
              ${
                msg.attachment
                  ? `<div class="mt-2 p-2 rounded text-xs d-flex align-center gap-2" style="background:#dbeafe; border:1px solid #bfdbfe;">
                      <span>📎</span>
                      <strong class="font-numeric">${msg.attachment}</strong>
                    </div>`
                  : ''
              }
            </div>
            <div style="width: 36px; height: 36px; border-radius: 10px; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: bold; flex-shrink: 0;">
              ${msg.avatar}
            </div>
          </div>
        `;
      }
    })
    .join('');

  container.scrollTop = container.scrollHeight;
}

function setupTicketThreadModal() {
  const modal = document.getElementById('ticketThreadModal');
  const closeBtn = document.getElementById('closeTicketThreadModalBtn');
  const replyForm = document.getElementById('ticketReplyForm');
  const replyInput = document.getElementById('ticketReplyInput');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal?.classList.remove('is-active'));
  }

  if (replyForm) {
    replyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = replyInput?.value.trim();
      if (!text || !currentActiveThreadTicketId) return;

      const tickets = getUserSupportTickets();
      const ticket = tickets.find((t) => t.id === currentActiveThreadTicketId);
      if (!ticket) return;

      const user = getDemoStorageUser() || { fullName: 'Miz Brymo' };

      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      ticket.messages.push({
        sender: user.fullName || 'Miz Brymo',
        isStaff: false,
        avatar: (user.fullName || 'A').charAt(0).toUpperCase(),
        time: formattedDate,
        text,
        attachment: null
      });

      ticket.lastUpdated = formattedDate;

      // Automated officer acknowledgement response after 1 second
      setTimeout(() => {
        ticket.messages.push({
          sender: 'Elena Rossi (Senior Support Officer)',
          isStaff: true,
          avatar: 'ER',
          time: formattedDate,
          text: `Thank you for the update. I am appending this note to audit record ${ticket.id} for the compliance desk.`,
          attachment: null
        });
        saveUserSupportTickets(tickets);
        renderTicketMessagesList(ticket);
        renderSupportTicketsList();
      }, 1200);

      saveUserSupportTickets(tickets);
      renderTicketMessagesList(ticket);
      renderSupportTicketsList();

      replyInput.value = '';
    });
  }
}

/* ----------------------------------------------------------------------------
 * 10. EMERGENCY ACTIONS (Freeze Accounts, Block Cards, Report Fraud)
 * ---------------------------------------------------------------------------- */
function setupEmergencyActionModals() {
  // 1. FREEZE ALL ACCOUNTS
  const btnTriggerFreeze = document.getElementById('btnEmergencyFreezeAccounts');
  const modalFreeze = document.getElementById('emergencyFreezeAccountsModal');
  const formFreeze = document.getElementById('emergencyFreezeAccountsForm');

  btnTriggerFreeze?.addEventListener('click', () => {
    modalFreeze?.classList.add('is-active');
  });

  document.getElementById('closeFreezeAccountsModalBtn')?.addEventListener('click', () => {
    modalFreeze?.classList.remove('is-active');
  });
  document.getElementById('cancelFreezeAccountsBtn')?.addEventListener('click', () => {
    modalFreeze?.classList.remove('is-active');
  });

  formFreeze?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pin = document.getElementById('freezePinConfirmInput')?.value;
    if (pin !== '1234') {
      showToast('Invalid Security PIN. (Default demo PIN is 1234)', 'error', 'Authentication Failed');
      return;
    }

    // Freeze all accounts in localStorage
    const accountsData = localStorage.getItem('wb_credit_union_user_accounts');
    if (accountsData) {
      try {
        const accounts = JSON.parse(accountsData);
        accounts.forEach((acc) => (acc.status = 'frozen'));
        localStorage.setItem('wb_credit_union_user_accounts', JSON.stringify(accounts));
      } catch (err) {
        console.error(err);
      }
    }

    createNotification({
      type: 'warning',
      title: '🚨 EMERGENCY SECURITY LOCKDOWN ACTIVATED',
      message: 'All multi-currency accounts have been frozen. Outbound wires, debits, and transfers are locked.',
    });

    showToast('SECURITY LOCKDOWN: All accounts have been frozen immediately. Contact 001 (207) 613-1332 to unfreeze.', 'warning', 'Accounts Frozen');
    modalFreeze?.classList.remove('is-active');
  });

  // 2. BLOCK ALL CARDS
  const btnTriggerBlockCards = document.getElementById('btnEmergencyBlockCards');
  const modalBlockCards = document.getElementById('emergencyBlockCardsModal');
  const formBlockCards = document.getElementById('emergencyBlockCardsForm');

  btnTriggerBlockCards?.addEventListener('click', () => {
    modalBlockCards?.classList.add('is-active');
  });

  document.getElementById('closeEmergencyBlockCardsModalBtn')?.addEventListener('click', () => {
    modalBlockCards?.classList.remove('is-active');
  });
  document.getElementById('cancelEmergencyBlockCardsBtn')?.addEventListener('click', () => {
    modalBlockCards?.classList.remove('is-active');
  });

  formBlockCards?.addEventListener('submit', (e) => {
    e.preventDefault();
    createNotification({
      type: 'warning',
      title: '💳 ALL PAYMENT CARDS TERMINATED',
      message: 'Emergency block applied to all active physical and virtual Visa cards.',
    });

    showToast('All payment cards have been blocked and tokenizations deactivated.', 'success', 'Cards Blocked');
    modalBlockCards?.classList.remove('is-active');
  });

  // 3. REPORT FRAUD
  const btnTriggerReportFraud = document.getElementById('btnEmergencyReportFraud');
  const modalReportFraud = document.getElementById('emergencyReportFraudModal');
  const formReportFraud = document.getElementById('emergencyReportFraudForm');

  btnTriggerReportFraud?.addEventListener('click', () => {
    modalReportFraud?.classList.add('is-active');
  });

  document.getElementById('closeReportFraudModalBtn')?.addEventListener('click', () => {
    modalReportFraud?.classList.remove('is-active');
  });
  document.getElementById('cancelReportFraudBtn')?.addEventListener('click', () => {
    modalReportFraud?.classList.remove('is-active');
  });

  formReportFraud?.addEventListener('submit', (e) => {
    e.preventDefault();
    const incidentType = document.getElementById('fraudIncidentTypeSelect')?.value;
    const notes = document.getElementById('fraudIncidentNotesInput')?.value;

    const fraudCaseNo = `FRD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    createNotification({
      type: 'warning',
      title: `🚨 FRAUD INVESTIGATION OPENED (${fraudCaseNo})`,
      message: `Urgent case lodged: ${incidentType}. Interbank trace protocol active.`,
    });

    showToast(`Fraud Incident Case ${fraudCaseNo} logged. Security Operations are tracking the transaction.`, 'success', 'Case Logged');
    modalReportFraud?.classList.remove('is-active');
    formReportFraud.reset();
  });
}

/* ----------------------------------------------------------------------------
 * 11. 24/7 LIVE CONCIERGE CHAT ENGINE
 * ---------------------------------------------------------------------------- */
export function openLiveChatModal() {
  const modal = document.getElementById('helpLiveChatModal');
  if (!modal) return;

  renderLiveChatMessages();
  modal.classList.add('is-active');

  const input = document.getElementById('liveChatMessageInput');
  setTimeout(() => input?.focus(), 200);
}

function renderLiveChatMessages() {
  const container = document.getElementById('liveChatMessagesContainer');
  if (!container) return;

  const messages = getLiveChatHistory();

  container.innerHTML = messages
    .map((msg) => {
      const isBot = msg.sender === 'bot';
      if (isBot) {
        return `
          <div class="d-flex gap-2 mb-3">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #1e3a8a, #2563eb); color:#fff; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0;">
              🏛️
            </div>
            <div class="p-3 rounded-2xl flex-1 text-xs" style="background:#ffffff; border: 1px solid #e2e8f0; border-top-left-radius: 4px; color:#1e293b; box-shadow: 0 1px 3px rgba(0,0,0,0.04); line-height: 1.6;">
              <div class="d-flex justify-between align-center mb-1">
                <span class="font-bold text-navy">${msg.name || 'WB Priority Concierge'}</span>
                <span class="text-muted font-numeric" style="font-size:10px;">${msg.time}</span>
              </div>
              <div>${msg.text}</div>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="d-flex gap-2 justify-end mb-3">
            <div class="p-3 rounded-2xl text-xs" style="background:#2563eb; color:#ffffff; border-top-right-radius: 4px; max-width:82%; line-height: 1.6;">
              <div class="d-flex justify-between align-center mb-1 gap-2">
                <span class="font-bold opacity-90">You</span>
                <span class="opacity-80 font-numeric" style="font-size:10px;">${msg.time}</span>
              </div>
              <div>${msg.text}</div>
            </div>
            <div style="width: 32px; height: 32px; border-radius: 8px; background:#1e3a8a; color:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:bold; flex-shrink:0;">
              A
            </div>
          </div>
        `;
      }
    })
    .join('');

  container.scrollTop = container.scrollHeight;
}

function setupLiveChatModal() {
  const modal = document.getElementById('helpLiveChatModal');
  const closeBtn = document.getElementById('closeLiveChatModalBtn');
  const form = document.getElementById('liveChatInputForm');
  const input = document.getElementById('liveChatMessageInput');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal?.classList.remove('is-active'));
  }

  // Quick Chat Suggestion Chips
  document.querySelectorAll('.chat-suggestion-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const text = chip.getAttribute('data-query');
      if (text && input) {
        input.value = text;
        form?.dispatchEvent(new Event('submit'));
      }
    });
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input?.value.trim();
      if (!text) return;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const messages = getLiveChatHistory();
      messages.push({
        sender: 'user',
        name: (getDemoStorageUser()?.fullName || 'Miz Brymo'),
        time: timeStr,
        text,
      });

      saveLiveChatHistory(messages);
      renderLiveChatMessages();
      if (input) input.value = '';

      // Generate intelligent institutional banking automated reply
      setTimeout(() => {
        const reply = generateConciergeReply(text);
        messages.push({
          sender: 'bot',
          name: 'WB Priority Concierge',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: reply,
        });
        saveLiveChatHistory(messages);
        renderLiveChatMessages();
      }, 750);
    });
  }
}

/**
 * Institutional AI Concierge smart response engine
 */
function generateConciergeReply(query) {
  const q = query.toLowerCase();

  if (q.includes('cot') || q.includes('cost of transfer') || q.includes('transfer code')) {
    return 'The <strong>COT (Cost of Transfer) Code</strong> is an interbank clearance token required to release held correspondent wire transfers. If you need or request transfer codes, contact Treasury Operations at <strong><a href="mailto:support@wbcu.net" style="color:#2563eb; font-weight:600;">support@wbcu.net</a></strong> or navigate to the <strong>Wire Transfer</strong> view to input your token.';
  }

  if (q.includes('wire') || q.includes('transfer limit') || q.includes('swift')) {
    return 'International SWIFT wires are processed within 24 to 48 hours under ABA <strong>251480576</strong> (SWIFT: <strong>WBCUUS33</strong>). Standard verified accounts have a $250,000 daily wire clearing limit.';
  }

  if (q.includes('card') || q.includes('block') || q.includes('lost') || q.includes('stolen') || q.includes('pin')) {
    return 'For card assistance, you can temporarily freeze or permanently report cards lost directly in the <strong>Cards</strong> tab or through the Emergency Actions section. Would you like me to connect you with an on-duty card supervisor?';
  }

  if (q.includes('crypto') || q.includes('bitcoin') || q.includes('btc') || q.includes('eth')) {
    return 'Crypto deposits in BTC, ETH, SOL, and USDT credit automatically after standard network confirmations. All assets are held in air-gapped Swiss HSM vaults with zero custodial lending risk.';
  }

  if (q.includes('address') || q.includes('zurich') || q.includes('location') || q.includes('branch')) {
    return 'Our global headquarters is at <strong>109, Feldgüetliweg Meilen, Bezirk Meilen, Zurich 8706, Switzerland</strong>. Hours: Mon-Fri 9AM-5PM CET, Sat 9AM-1PM CET. 24/7 Global Phone: <strong>001 (207) 613-1332</strong>.';
  }

  if (q.includes('agent') || q.includes('human') || q.includes('officer') || q.includes('speak')) {
    return 'I have escalated your session to <strong>Senior Duty Officer Marc Bieri</strong> at our Zurich Priority Clearing Desk. A direct secure callback or chat pickup has been queued.';
  }

  return 'Thank you for your message. For specialized inquiries regarding this topic, our 24/7 Zurich support team can be reached directly at <strong>001 (207) 613-1332</strong> or via formal ticket in the Contact Form below.';
}
