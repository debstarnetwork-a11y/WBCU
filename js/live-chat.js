/**
 * ============================================================================
 * WB CREDIT UNION - UNIVERSAL 24/7 LIVE CONCIERGE CHAT ENGINE (js/live-chat.js)
 * ============================================================================
 * 
 * Injects and powers the floating 24/7 Live Support Chatbot & Concierge Desk
 * on every page across WB Credit Union. Features:
 * - Floating trigger pill with active status indicator & unread message badge
 * - Institutional Bank Header with 1-click 1-800-BANKING and support@wbcu.net
 * - Dynamic multilingual chat prompts
 * - Real-time conversational AI responses with realistic typing indicator
 * - Soft Web Audio API message arrival chime
 * - Transfer code (COT, IMF, TAX, AML, PIN) assistance
 * - Quick prompt chips for fast routing
 * - Full conversation persistence in localStorage
 * ============================================================================
 */

import { t, getCurrentLanguage } from './i18n.js';

const LIVE_CHAT_STORAGE_KEY = 'wb_credit_union_live_chat_history';
const CHAT_UNREAD_STORAGE_KEY = 'wb_credit_union_chat_unread_count';

// Web Audio API soft chime player
function playMessageChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    // AudioContext blocked by browser policy until user gesture
  }
}

/**
 * Get stored chat history
 */
export function getUniversalChatHistory() {
  try {
    const raw = localStorage.getItem(LIVE_CHAT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  const defaultMessages = [
    {
      id: 'msg-welcome-1',
      sender: 'bot',
      name: 'WB Priority Concierge',
      role: 'Treasury & Member Services Desk',
      avatar: '🏛️',
      time: 'Just now',
      text: t('chat.welcome_msg', 'Hello! Welcome to WB Credit Union 24/7 Support. How can we assist you with your accounts, transfers, or clearance codes today?'),
    },
  ];
  saveUniversalChatHistory(defaultMessages);
  return defaultMessages;
}

/**
 * Save chat history
 */
export function saveUniversalChatHistory(messages) {
  try {
    localStorage.setItem(LIVE_CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {}
}

/**
 * Inject the universal live chat HTML structure
 */
export function injectUniversalLiveChat() {
  if (document.getElementById('wbUniversalLiveChatWidget')) return;

  const chatContainer = document.createElement('div');
  chatContainer.id = 'wbUniversalLiveChatWidget';
  chatContainer.className = 'wb-chat-widget-container';

  chatContainer.innerHTML = `
    <!-- Floating Launcher Trigger Button -->
    <button type="button" class="wb-chat-launcher-btn" id="wbChatLauncherBtn" aria-label="Open 24/7 Live Support Chat" title="24/7 Live Concierge Chat">
      <div class="wb-chat-launcher-pulse"></div>
      <div class="wb-chat-launcher-icon">
        <svg class="wb-icon-chat-open" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <svg class="wb-icon-chat-close" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
      <div class="wb-chat-launcher-text">
        <span class="wb-chat-status-dot"></span>
        <strong data-i18n="chat.badge_online">24/7 Live Support</strong>
      </div>
      <span class="wb-chat-unread-badge" id="wbChatUnreadBadge" style="display:none;">1</span>
    </button>

    <!-- Main Expandable Chat Window -->
    <div class="wb-chat-window" id="wbChatWindow" aria-hidden="true">
      <!-- Institutional Top Header -->
      <div class="wb-chat-header">
        <div class="wb-chat-header-brand">
          <div class="wb-chat-avatar-lockup">
            <div class="wb-chat-avatar-icon">🏛️</div>
            <span class="wb-chat-online-indicator" title="Online"></span>
          </div>
          <div class="wb-chat-header-info">
            <h4 class="wb-chat-title" data-i18n="chat.header_title">WB Credit Union Support</h4>
            <p class="wb-chat-subtitle">
              <span class="wb-chat-agent-name">Senior Desk: Marc Bieri &amp; Sarah K.</span>
              <span class="wb-chat-response-rate" data-i18n="chat.online_status">Online · Response: Instant</span>
            </p>
          </div>
        </div>

        <div class="wb-chat-header-actions">
          <button type="button" class="wb-chat-control-btn" id="wbChatMinimizeBtn" title="Minimize Chat" aria-label="Minimize Chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>
      </div>

      <!-- Quick Contact Bar (Phone 1-800-BANKING & Email support@wbcu.net) -->
      <div class="wb-chat-contact-bar">
        <div class="wb-chat-contact-item">
          <span class="wb-chat-contact-label">24/7 Hotline:</span>
          <a href="tel:18002265464" class="wb-chat-contact-link phone">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <span>1-800-BANKING</span>
          </a>
        </div>
        <div class="wb-chat-contact-item">
          <span class="wb-chat-contact-label">Support Email:</span>
          <a href="mailto:support@wbcu.net" class="wb-chat-contact-link email">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            <span>support@wbcu.net</span>
          </a>
        </div>
      </div>

      <!-- Live Messages Scroll Container -->
      <div class="wb-chat-messages" id="wbChatMessagesContainer">
        <!-- Injected via renderMessages() -->
      </div>

      <!-- Realistic Typing Indicator -->
      <div class="wb-chat-typing-row" id="wbChatTypingIndicator" style="display:none;">
        <div class="wb-chat-typing-bubble">
          <span class="wb-dot"></span>
          <span class="wb-dot"></span>
          <span class="wb-dot"></span>
        </div>
        <span class="wb-typing-text">WB Concierge is typing...</span>
      </div>

      <!-- Quick Prompt Suggestion Chips -->
      <div class="wb-chat-chips-scroll">
        <button type="button" class="wb-chat-chip" data-prompt="Request COT Code">
          🔑 Request COT Code
        </button>
        <button type="button" class="wb-chat-chip" data-prompt="How long do SWIFT wire transfers take?">
          ⚡ Wire Transfer Speed
        </button>
        <button type="button" class="wb-chat-chip" data-prompt="What is the 24/7 bank phone number and email?">
          📞 1-800-BANKING &amp; Email
        </button>
        <button type="button" class="wb-chat-chip" data-prompt="How do I block or unfreeze a payment card?">
          💳 Card Security
        </button>
        <button type="button" class="wb-chat-chip" data-prompt="Speak with a human duty officer">
          👤 Human Agent
        </button>
      </div>

      <!-- Chat Bottom Input Form -->
      <form class="wb-chat-input-bar" id="wbChatForm">
        <input
          type="text"
          id="wbChatInput"
          class="wb-chat-input-field"
          placeholder="Type your question or request..."
          data-i18n-placeholder="chat.input_placeholder"
          autocomplete="off"
          required
        />
        <button type="submit" class="wb-chat-send-btn" id="wbChatSendBtn" aria-label="Send message" title="Send message">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  `;

  document.body.appendChild(chatContainer);
  initUniversalChatEvents();
}

/**
 * Render conversation messages into the chat window
 */
export function renderUniversalChatMessages() {
  const container = document.getElementById('wbChatMessagesContainer');
  if (!container) return;

  const messages = getUniversalChatHistory();

  container.innerHTML = messages
    .map((msg) => {
      const isBot = msg.sender === 'bot';
      if (isBot) {
        return `
          <div class="wb-chat-msg-row bot">
            <div class="wb-msg-avatar">🏛️</div>
            <div class="wb-msg-bubble">
              <div class="wb-msg-meta">
                <span class="wb-msg-author">${msg.name || 'WB Priority Concierge'}</span>
                <span class="wb-msg-time">${msg.time}</span>
              </div>
              <div class="wb-msg-content">${msg.text}</div>
            </div>
          </div>
        `;
      } else {
        return `
          <div class="wb-chat-msg-row user">
            <div class="wb-msg-bubble">
              <div class="wb-msg-meta">
                <span class="wb-msg-author">${msg.name || 'You'}</span>
                <span class="wb-msg-time">${msg.time}</span>
              </div>
              <div class="wb-msg-content">${msg.text}</div>
            </div>
            <div class="wb-msg-avatar user">👤</div>
          </div>
        `;
      }
    })
    .join('');

  container.scrollTop = container.scrollHeight;
}

/**
 * Institutional AI Concierge response generator
 */
function getConciergeAnswer(query) {
  const q = query.toLowerCase();

  if (q.includes('cot') || q.includes('cost of transfer') || q.includes('transfer code') || q.includes('clearance code') || q.includes('tax code') || q.includes('imf')) {
    return `The <strong>Cost of Transfer (COT) Code</strong> is a mandated institutional clearance token required to release high-value wire transfers. If you need or request transfer codes, please contact Treasury Operations directly at <strong><a href="mailto:support@wbcu.net" style="color:#2563eb; font-weight:700; text-decoration:underline;">support@wbcu.net</a></strong> or call <strong><a href="tel:18002265464" style="color:#2563eb; font-weight:700;">1-800-BANKING</a></strong>.`;
  }

  if (q.includes('phone') || q.includes('number') || q.includes('call') || q.includes('contact') || q.includes('email') || q.includes('1-800') || q.includes('24/7')) {
    return `<strong>WB Credit Union 24/7 Support:</strong><br>
    📞 Toll-Free Phone: <strong><a href="tel:18002265464" style="color:#2563eb; font-weight:700;">1-800-BANKING</a></strong> (24/7 Support)<br>
    🌍 International Desk: <strong><a href="tel:+12076131332" style="color:#2563eb; font-weight:700;">001 (207) 613-1332</a></strong><br>
    ✉️ Official Email: <strong><a href="mailto:support@wbcu.net" style="color:#2563eb; font-weight:700;">support@wbcu.net</a></strong><br>
    <em>Always here to help you 24 hours a day, 7 days a week.</em>`;
  }

  if (q.includes('routing') || q.includes('aba') || q.includes('swift') || q.includes('iban')) {
    return `<strong>Institutional Banking Identifiers:</strong><br>
    • Federal Reserve Routing (ABA): <strong>251480576</strong><br>
    • SWIFT / BIC Code: <strong>WBCUUS33</strong><br>
    • Head Office: 109, Feldgüetliweg Meilen, Zurich 8706, Switzerland.`;
  }

  if (q.includes('wire') || q.includes('speed') || q.includes('settle') || q.includes('limit')) {
    return `Domestic Fedwire and instant SEPA transactions clear within <strong>1 to 4 hours</strong>. International SWIFT wires settle within <strong>24 to 48 business hours</strong> once required compliance verification (COT/IMF tokens) is confirmed. Verified account limits are up to $250,000/day.`;
  }

  if (q.includes('card') || q.includes('block') || q.includes('lost') || q.includes('stolen') || q.includes('freeze')) {
    return `To secure your card immediately, navigate to the <strong>Cards</strong> tab or open <strong>Emergency Actions</strong> in Help & Support to block or freeze cards instantly. You can also call <strong>1-800-BANKING</strong> for immediate emergency card deactivation.`;
  }

  if (q.includes('crypto') || q.includes('btc') || q.includes('bitcoin') || q.includes('eth') || q.includes('usdt')) {
    return `WB Credit Union supports cold-vault crypto custody for BTC, ETH, SOL, and USDT. Deposits credit automatically after required network confirmations with zero custodial lending risk.`;
  }

  if (q.includes('agent') || q.includes('human') || q.includes('representative') || q.includes('speak') || q.includes('operator')) {
    return `I have forwarded your request to <strong>Senior Duty Officer Marc Bieri</strong> at our Zurich Priority Desk. An officer is reviewing your session and will respond here shortly, or you can call us directly right now at <strong>1-800-BANKING</strong>.`;
  }

  return `Thank you for contacting WB Credit Union. Our priority member care team is available 24/7 at <strong>1-800-BANKING</strong> and <strong>support@wbcu.net</strong>. If you need assistance with account opening, international transfers, or wire clearance codes, our team is always here to help.`;
}

/**
 * Initialize chat events and listeners
 */
export function initUniversalChatEvents() {
  const launcherBtn = document.getElementById('wbChatLauncherBtn');
  const chatWindow = document.getElementById('wbChatWindow');
  const minimizeBtn = document.getElementById('wbChatMinimizeBtn');
  const chatForm = document.getElementById('wbChatForm');
  const chatInput = document.getElementById('wbChatInput');
  const typingIndicator = document.getElementById('wbChatTypingIndicator');

  if (!launcherBtn || !chatWindow) return;

  function toggleChat() {
    const isOpen = chatWindow.classList.contains('is-open');
    if (!isOpen) {
      chatWindow.classList.add('is-open');
      launcherBtn.classList.add('is-active');
      chatWindow.setAttribute('aria-hidden', 'false');
      renderUniversalChatMessages();
      setTimeout(() => chatInput?.focus(), 250);
      // Clear unread badge
      const badge = document.getElementById('wbChatUnreadBadge');
      if (badge) badge.style.display = 'none';
    } else {
      chatWindow.classList.remove('is-open');
      launcherBtn.classList.remove('is-active');
      chatWindow.setAttribute('aria-hidden', 'true');
    }
  }

  launcherBtn.addEventListener('click', toggleChat);
  minimizeBtn?.addEventListener('click', toggleChat);

  // Quick chips
  document.querySelectorAll('.wb-chat-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt');
      if (prompt && chatInput) {
        chatInput.value = prompt;
        chatForm?.dispatchEvent(new Event('submit'));
      }
    });
  });

  // Handle message submission
  chatForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput?.value.trim();
    if (!text) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let userName = 'Member';
    try {
      const activeRaw = localStorage.getItem('wb_credit_union_active_user') || localStorage.getItem('wb_credit_union_user_session');
      if (activeRaw) {
        const u = JSON.parse(activeRaw);
        if (u && u.fullName) userName = u.fullName;
      }
    } catch (e) {}

    const messages = getUniversalChatHistory();
    messages.push({
      id: `msg-${Date.now()}`,
      sender: 'user',
      name: userName,
      time: timeStr,
      text,
    });

    saveUniversalChatHistory(messages);
    renderUniversalChatMessages();
    chatInput.value = '';

    // Show typing animation and answer
    if (typingIndicator) typingIndicator.style.display = 'flex';
    const container = document.getElementById('wbChatMessagesContainer');
    if (container) container.scrollTop = container.scrollHeight;

    const currentLang = localStorage.getItem('wb_credit_union_selected_lang') || 'en';

    // Attempt Gemini AI backend call first with seamless local fallback
    fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, lang: currentLang }),
    })
      .then((res) => res.json())
      .then((data) => {
        let botReply = '';
        if (data && data.success && data.reply) {
          botReply = data.reply;
        } else {
          botReply = getConciergeAnswer(text);
        }
        dispatchBotReply(botReply);
      })
      .catch(() => {
        const botReply = getConciergeAnswer(text);
        dispatchBotReply(botReply);
      });

    function dispatchBotReply(botReply) {
      if (typingIndicator) typingIndicator.style.display = 'none';
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      messages.push({
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        name: 'WB Priority Concierge',
        time: replyTime,
        text: botReply,
      });

      saveUniversalChatHistory(messages);
      renderUniversalChatMessages();
      playMessageChime();
    }
  });
}

/**
 * Auto-initialize on page load
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectUniversalLiveChat();
  });
} else {
  injectUniversalLiveChat();
}
