/**
 * ============================================================================
 * WB CREDIT UNION - ADMIN CRYPTO MANAGEMENT CONTROLLER (js/admin-crypto.js)
 * ============================================================================
 * 
 * Manages institutional cryptocurrency custody & exchange rates:
 * 1. Crypto Overview Metrics (Total Wallets, Total USD Valuation, Reserve Assets)
 * 2. Asset Allocation Donut Chart (BTC, ETH, USDT, SOL, etc.)
 * 3. Master Custodial Wallets Directory with Search, Multi-Filter, and Status Modifiers
 * 4. Wallet Operations Console:
 *     - Credit Crypto (+ Add balance with on-chain simulation)
 *     - Debit Crypto (- Deduct balance with compliance memo)
 *     - Freeze / Unfreeze Custodial Wallet
 *     - Reassign / Rotate Cold Storage Address
 *     - On-Chain Wallet Transaction Audit History
 * 5. Exchange Rate Matrix with Manual Overrides & Live Market Ticker
 * 6. Global Blockchain Transaction Ledger with Confirmations & TXID Inspector
 * ============================================================================
 */

import {
  showToast,
} from './supabase-config.js';
import {
  getAdminUsersList,
  saveAdminUsersList,
  showAdminFormModal,
} from './admin-users.js';
import { createNotification } from './notifications-email.js';

const ADMIN_CRYPTO_RATES_KEY = 'wb_admin_crypto_rates_v1';
const ADMIN_CRYPTO_TX_KEY = 'wb_admin_crypto_tx_v1';

/* ----------------------------------------------------------------------------
 * 1. DEFAULT EXCHANGE RATES
 * ---------------------------------------------------------------------------- */
const defaultExchangeRates = {
  BTC: { name: 'Bitcoin', symbol: 'BTC', price: 65420.00, change24h: '+2.4%', network: 'Bitcoin Mainnet (SegWit)' },
  ETH: { name: 'Ethereum', symbol: 'ETH', price: 3480.50, change24h: '+1.8%', network: 'Ethereum ERC-20' },
  USDT: { name: 'Tether USD', symbol: 'USDT', price: 1.00, change24h: '0.0%', network: 'Tron TRC-20 / ERC-20' },
  USDC: { name: 'USD Coin', symbol: 'USDC', price: 1.00, change24h: '0.0%', network: 'Ethereum ERC-20' },
  SOL: { name: 'Solana', symbol: 'SOL', price: 154.20, change24h: '+5.1%', network: 'Solana Mainnet-Beta' },
  BNB: { name: 'BNB Chain', symbol: 'BNB', price: 582.00, change24h: '-0.4%', network: 'BNB Smart Chain (BEP-20)' },
  XRP: { name: 'Ripple XRP', symbol: 'XRP', price: 0.625, change24h: '+3.2%', network: 'XRP Ledger (XRPL)' },
};

/* ----------------------------------------------------------------------------
 * 2. DEFAULT SEED CRYPTO TRANSACTIONS
 * ---------------------------------------------------------------------------- */
const initialSeedCryptoTx = [
  {
    id: 'ctx-901',
    txid: '0x8f9a2b1c4e7d0f3a6b5c8e1d4a7f0e3c6b9a2d1f4e7c0b3a6d9f2e1c4b7a0d3f',
    userId: 'usr-101',
    userName: 'Miz Brymo',
    userEmail: 'mizbrymo@gmail.com',
    currency: 'BTC',
    type: 'deposit',
    amount: 2.50,
    usdValue: 163550.00,
    fromAddress: 'bc1qext88402914820194821',
    toAddress: 'bc1q9x48v2m9sl3k0pw84mz789xq4e9',
    confirmations: 12,
    status: 'confirmed',
    blockHeight: 864920,
    fee: '0.00012 BTC',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    notes: 'Inward cold storage deposit for wealth reserve vault'
  },
  {
    id: 'ctx-902',
    txid: '0x3c6b9a2d1f4e7c0b3a6d9f2e1c4b7a0d3f8f9a2b1c4e7d0f3a6b5c8e1d4a7f0e',
    userId: 'usr-102',
    userName: 'Elena Rostova',
    userEmail: 'elena.rostova@vanguardlogistics.ch',
    currency: 'BTC',
    type: 'deposit',
    amount: 15.00,
    usdValue: 981300.00,
    fromAddress: 'bc1qcorp991204928104812',
    toAddress: 'bc1qvan88guard9942001',
    confirmations: 6,
    status: 'confirmed',
    blockHeight: 864918,
    fee: '0.00025 BTC',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    notes: 'Maritime fuel hedging escrow collateral'
  },
  {
    id: 'ctx-903',
    txid: '0x7a0d3f8f9a2b1c4e7d0f3a6b5c8e1d4a7f0e3c6b9a2d1f4e7c0b3a6d9f2e1c4b',
    userId: 'usr-101',
    userName: 'Miz Brymo',
    userEmail: 'mizbrymo@gmail.com',
    currency: 'USDT',
    type: 'credit',
    amount: 125000.00,
    usdValue: 125000.00,
    fromAddress: 'TREASURY_INTERNAL_MINT',
    toAddress: '0x99A...11C4',
    confirmations: 32,
    status: 'confirmed',
    blockHeight: 20884912,
    fee: '0.00 USDT (Internal)',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Officer liquidity adjustment ref #9941'
  },
  {
    id: 'ctx-904',
    txid: '0x1d4a7f0e3c6b9a2d1f4e7c0b3a6d9f2e1c4b7a0d3f8f9a2b1c4e7d0f3a6b5c8e',
    userId: 'usr-104',
    userName: 'Chen Wei',
    userEmail: 'chen.wei@singaporebiotech.sg',
    currency: 'ETH',
    type: 'withdrawal',
    amount: 50.00,
    usdValue: 174025.00,
    fromAddress: '0x44B...3391',
    toAddress: '0xExternalCustody99214',
    confirmations: 2,
    status: 'pending',
    blockHeight: 20885104,
    fee: '0.0042 ETH',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    notes: 'Awaiting secondary treasury multi-sig signoff'
  }
];

/* ----------------------------------------------------------------------------
 * 3. STORAGE GETTERS & SETTERS
 * ---------------------------------------------------------------------------- */
export function getExchangeRates() {
  const stored = localStorage.getItem(ADMIN_CRYPTO_RATES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fallback
    }
  }
  localStorage.setItem(ADMIN_CRYPTO_RATES_KEY, JSON.stringify(defaultExchangeRates));
  return defaultExchangeRates;
}

export function saveExchangeRates(rates) {
  localStorage.setItem(ADMIN_CRYPTO_RATES_KEY, JSON.stringify(rates));
}

export function getCryptoTransactions() {
  const stored = localStorage.getItem(ADMIN_CRYPTO_TX_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fallback
    }
  }
  localStorage.setItem(ADMIN_CRYPTO_TX_KEY, JSON.stringify(initialSeedCryptoTx));
  return initialSeedCryptoTx;
}

export function saveCryptoTransactions(txs) {
  localStorage.setItem(ADMIN_CRYPTO_TX_KEY, JSON.stringify(txs));
}

/* ----------------------------------------------------------------------------
 * 4. STATE VARIABLES
 * ---------------------------------------------------------------------------- */
let currentRates = {};
let currentCryptoTx = [];
let allWallets = [];
let filteredWallets = [];
let filteredCryptoTx = [];
let activeInspectedWallet = null;

/* ----------------------------------------------------------------------------
 * 5. INITIALIZATION
 * ---------------------------------------------------------------------------- */
export function initAdminCryptoManagement() {
  currentRates = getExchangeRates();
  currentCryptoTx = getCryptoTransactions();
  filteredCryptoTx = [...currentCryptoTx];

  refreshWalletsList();

  setupCryptoSubTabs();
  setupCryptoWalletsSearchAndFilters();
  setupAdminAddCryptoWallet();
  setupCryptoTxSearchAndFilters();
  setupExchangeRatesManager();
  setupWalletDetailModal();
  setupCryptoTxDetailModal();

  renderCryptoDashboardMetrics();
  renderCryptoAssetsDonutChart();
  renderCryptoWalletsTable();
  renderExchangeRateCards();
  renderCryptoTxTable();
}

function refreshWalletsList() {
  const users = getAdminUsersList();
  allWallets = [];

  users.forEach((u) => {
    const userWallets = u.cryptoWallets || [];
    userWallets.forEach((w, idx) => {
      const sym = (w.currency || w.symbol || 'BTC').toUpperCase();
      allWallets.push({
        walletId: `${u.id}-w-${sym.toLowerCase()}-${idx}`,
        userId: u.id,
        userName: u.fullName,
        userEmail: u.email,
        currency: sym,
        symbol: sym,
        balance: parseFloat(w.balance || 0),
        address: w.address || `0x${u.id.replace('usr-', '')}${sym}CustodyNode`,
        status: w.status || 'active',
        network: w.network || defaultExchangeRates[sym]?.network || 'Blockchain Mainnet'
      });
    });
  });

  filteredWallets = [...allWallets];
}

/* ----------------------------------------------------------------------------
 * 6. DASHBOARD METRICS & ASSET ALLOCATION DONUT CHART
 * ---------------------------------------------------------------------------- */
function renderCryptoDashboardMetrics() {
  const totalWalletsEl = document.getElementById('cryptoStatTotalWallets');
  const totalValEl = document.getElementById('cryptoStatTotalUsdValue');
  const btcReserveEl = document.getElementById('cryptoStatBtcReserve');
  const ethReserveEl = document.getElementById('cryptoStatEthReserve');

  let totalUsdVal = 0;
  let btcTotal = 0;
  let ethTotal = 0;

  allWallets.forEach((w) => {
    const rate = currentRates[w.currency]?.price || 1;
    totalUsdVal += w.balance * rate;
    if (w.currency === 'BTC') btcTotal += w.balance;
    if (w.currency === 'ETH') ethTotal += w.balance;
  });

  if (totalWalletsEl) totalWalletsEl.textContent = `${allWallets.length} Custody Wallets`;
  if (totalValEl) totalValEl.textContent = `$${totalUsdVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (btcReserveEl) btcReserveEl.textContent = `${btcTotal.toFixed(2)} BTC (~$${(btcTotal * (currentRates.BTC?.price || 65000)).toLocaleString()})`;
  if (ethReserveEl) ethReserveEl.textContent = `${ethTotal.toFixed(2)} ETH (~$${(ethTotal * (currentRates.ETH?.price || 3500)).toLocaleString()})`;
}

function renderCryptoAssetsDonutChart() {
  const canvas = document.getElementById('canvasCryptoAssetsDonut');
  if (!canvas) return;

  const rect = canvas.parentElement ? canvas.parentElement.getBoundingClientRect() : null;
  const width = rect && rect.width > 20 ? rect.width : (canvas.clientWidth || 240);
  const height = rect && rect.height > 20 ? rect.height : (canvas.clientHeight || 180);
  if (width <= 20 || height <= 20) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  const segments = [
    { label: 'Bitcoin (BTC)', percent: 58, color: '#f59e0b' },
    { label: 'Ethereum (ETH)', percent: 24, color: '#6366f1' },
    { label: 'Tether USD (USDT)', percent: 12, color: '#10b981' },
    { label: 'Solana (SOL)', percent: 4, color: '#c084fc' },
    { label: 'Others', percent: 2, color: '#38bdf8' }
  ];

  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = Math.max(15, Math.min(centerX, centerY) - 10);
  const innerRadius = Math.max(5, outerRadius * 0.58);

  let currentAngle = -Math.PI / 2;

  segments.forEach((seg) => {
    const sliceAngle = (seg.percent / 100) * (Math.PI * 2);

    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
    ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
    ctx.closePath();

    ctx.fillStyle = seg.color;
    ctx.fill();

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    currentAngle += sliceAngle;
  });

  // Center text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px Poppins, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('100%', centerX, centerY - 3);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '8px Poppins, sans-serif';
  ctx.fillText('HSM Backed', centerX, centerY + 11);
}

/* ----------------------------------------------------------------------------
 * 7. SUB-TABS NAVIGATION
 * ---------------------------------------------------------------------------- */
function setupCryptoSubTabs() {
  const tabs = [
    { id: 'cryptoTabWallets', panelId: 'panelCryptoWallets' },
    { id: 'cryptoTabRates', panelId: 'panelCryptoRates' },
    { id: 'cryptoTabTransactions', panelId: 'panelCryptoTransactions' }
  ];

  tabs.forEach((tab) => {
    const btn = document.getElementById(tab.id);
    if (btn) {
      btn.addEventListener('click', () => {
        tabs.forEach((t) => {
          document.getElementById(t.id)?.classList.remove('active');
          const p = document.getElementById(t.panelId);
          if (p) p.style.display = 'none';
        });

        btn.classList.add('active');
        const activePanel = document.getElementById(tab.panelId);
        if (activePanel) activePanel.style.display = 'block';
      });
    }
  });
}

/* ----------------------------------------------------------------------------
 * 8. WALLETS SEARCH & FILTERS
 * ---------------------------------------------------------------------------- */
function setupCryptoWalletsSearchAndFilters() {
  const searchInput = document.getElementById('cryptoWalletSearchInput');
  const coinFilter = document.getElementById('cryptoCoinFilter');
  const statusFilter = document.getElementById('cryptoWalletStatusFilter');
  const clearBtn = document.getElementById('btnClearCryptoFilters');

  let timer = null;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(applyWalletFilters, 250);
    });
  }

  [coinFilter, statusFilter].forEach((sel) => {
    if (sel) sel.addEventListener('change', applyWalletFilters);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (coinFilter) coinFilter.value = 'all';
      if (statusFilter) statusFilter.value = 'all';
      applyWalletFilters();
    });
  }
}

function setupAdminAddCryptoWallet() {
  const addBtn = document.getElementById('btnAdminAddCryptoWallet');
  if (!addBtn) return;

  addBtn.onclick = () => {
    const users = getAdminUsersList();
    if (users.length === 0) {
      showToast('No member profiles found.', 'error');
      return;
    }

    const userOptions = users.map((u) => ({
      value: u.id,
      label: `${u.fullName} (${u.email})`
    }));

    showAdminFormModal({
      title: 'Provision Custodial Crypto Wallet',
      subtitle: 'Assign segregated on-chain multi-sig cold storage vault to member',
      submitText: 'Provision Custodial Vault',
      fields: [
        {
          id: 'userId',
          type: 'select',
          label: 'Target Member *',
          value: users[0].id,
          options: userOptions
        },
        {
          id: 'sym',
          type: 'select',
          label: 'Cryptocurrency Asset *',
          value: 'BTC',
          options: [
            { value: 'BTC', label: 'Bitcoin (BTC)' },
            { value: 'ETH', label: 'Ethereum (ETH)' },
            { value: 'USDT', label: 'Tether USD (USDT)' },
            { value: 'USDC', label: 'USD Coin (USDC)' },
            { value: 'SOL', label: 'Solana (SOL)' },
            { value: 'BNB', label: 'Binance Coin (BNB)' },
            { value: 'XRP', label: 'Ripple (XRP)' }
          ]
        },
        {
          id: 'bal',
          type: 'number',
          step: 'any',
          label: 'Initial Settled Balance *',
          value: '0.50',
          required: true
        },
        {
          id: 'addr',
          label: 'Dedicated On-Chain Cold Address *',
          fontMono: true,
          value: 'bc1q' + Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 12),
          required: true
        },
        {
          id: 'status',
          type: 'select',
          label: 'Initial Operational Status',
          value: 'active',
          options: [
            { value: 'active', label: 'Active' },
            { value: 'frozen', label: 'Frozen (Hold)' },
            { value: 'inactive', label: 'Inactive' }
          ]
        }
      ],
      onSubmit: ({ userId, sym, bal, addr, status }) => {
        const targetUser = users.find((u) => u.id === userId);
        if (!targetUser) return;
        if (!targetUser.cryptoWallets) targetUser.cryptoWallets = [];

        // Check if coin already exists for user
        const existing = targetUser.cryptoWallets.find((w) => w.currency === sym.toUpperCase());
        if (existing) {
          existing.balance = parseFloat(bal) || 0;
          existing.address = addr;
          existing.status = status || 'active';
        } else {
          targetUser.cryptoWallets.push({
            currency: sym.toUpperCase(),
            balance: parseFloat(bal) || 0,
            address: addr,
            status: status || 'active'
          });
        }

        saveAdminUsersList(users);
        refreshWalletsList();
        renderCryptoDashboardMetrics();
        renderCryptoWalletsTable();
        showToast(`Provisioned ${sym.toUpperCase()} custodial wallet for ${targetUser.fullName}.`, 'success', 'Wallet Provisioned');
      }
    });
  };
}

function applyWalletFilters() {
  const query = (document.getElementById('cryptoWalletSearchInput')?.value || '').trim().toLowerCase();
  const coinVal = document.getElementById('cryptoCoinFilter')?.value || 'all';
  const statusVal = document.getElementById('cryptoWalletStatusFilter')?.value || 'all';

  filteredWallets = allWallets.filter((w) => {
    const matchesQuery = !query ||
      w.userName.toLowerCase().includes(query) ||
      w.userEmail.toLowerCase().includes(query) ||
      w.address.toLowerCase().includes(query);

    const matchesCoin = coinVal === 'all' || w.currency === coinVal;
    const matchesStatus = statusVal === 'all' || w.status === statusVal;

    return matchesQuery && matchesCoin && matchesStatus;
  });

  renderCryptoWalletsTable();
}

/* ----------------------------------------------------------------------------
 * 9. RENDER WALLETS TABLE
 * ---------------------------------------------------------------------------- */
export function renderCryptoWalletsTable() {
  const tbody = document.getElementById('adminCryptoWalletsTableBody');
  const countBadge = document.getElementById('cryptoWalletsCountBadge');

  if (countBadge) countBadge.textContent = `${filteredWallets.length} Wallets`;
  if (!tbody) return;

  if (filteredWallets.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center p-5 text-muted">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">₿</div>
          <div class="font-bold text-white mb-1">No crypto custody wallets found</div>
          <div class="text-xs">Try adjusting your coin selection or search query.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredWallets.map((w) => {
    const rate = currentRates[w.currency]?.price || 1;
    const usdVal = (w.balance * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const coinClass = `coin-${w.currency.toLowerCase()}`;

    return `
      <tr class="admin-user-row" data-wallet-id="${w.walletId}">
        <td>
          <div class="font-bold text-white text-xs">${escapeHtml(w.userName)}</div>
          <div class="text-xs text-muted font-mono">${escapeHtml(w.userEmail)}</div>
        </td>
        <td>
          <span class="crypto-coin-badge ${coinClass}">
            ${w.currency} &bull; ${defaultExchangeRates[w.currency]?.name || w.currency}
          </span>
        </td>
        <td>
          <span class="admin-crypto-address-chip font-mono text-xs" title="Click to copy address" onclick="event.stopPropagation(); navigator.clipboard.writeText('${w.address}');">
            ${w.address.length > 20 ? `${w.address.slice(0, 10)}...${w.address.slice(-6)}` : w.address} 📋
          </span>
        </td>
        <td>
          <span class="font-mono text-xs font-bold text-white">${w.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${w.currency}</span>
        </td>
        <td>
          <span class="font-mono text-xs font-bold text-emerald" style="color:#34d399;">$${usdVal} USD</span>
        </td>
        <td>
          <span class="action-chip badge-status-${w.status}">
            ${w.status.toUpperCase()}
          </span>
        </td>
        <td class="text-right" onclick="event.stopPropagation()">
          <button type="button" class="admin-btn admin-btn-outline admin-btn-sm btn-inspect-crypto-wallet" data-wallet-id="${w.walletId}">
            Manage &rarr;
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Row clicks & manage clicks
  tbody.querySelectorAll('.admin-user-row').forEach((row) => {
    row.addEventListener('click', () => {
      const wId = row.getAttribute('data-wallet-id');
      openCryptoWalletModal(wId);
    });
  });

  tbody.querySelectorAll('.btn-inspect-crypto-wallet').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wId = btn.getAttribute('data-wallet-id');
      openCryptoWalletModal(wId);
    });
  });
}

/* ----------------------------------------------------------------------------
 * 10. WALLET DETAIL & ACTION MODAL
 * ---------------------------------------------------------------------------- */
function setupWalletDetailModal() {
  const modal = document.getElementById('cryptoWalletDetailModal');
  const closeBtn = document.getElementById('closeCryptoWalletDetailModalBtn');
  if (closeBtn && modal) {
    closeBtn.onclick = () => modal.classList.remove('show');
  }
}

export function openCryptoWalletModal(walletId) {
  const wallet = allWallets.find((w) => w.walletId === walletId);
  if (!wallet) return;

  activeInspectedWallet = wallet;
  const modal = document.getElementById('cryptoWalletDetailModal');
  const body = document.getElementById('cryptoWalletDetailModalBody');
  if (!modal || !body) return;

  const rate = currentRates[wallet.currency]?.price || 1;
  const usdVal = (wallet.balance * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const coinClass = `coin-${wallet.currency.toLowerCase()}`;

  body.innerHTML = `
    <!-- Wallet Card Summary -->
    <div class="admin-user-acct-box mb-3 d-flex items-center justify-between flex-wrap gap-3">
      <div>
        <div class="d-flex items-center gap-2 mb-1">
          <span class="crypto-coin-badge ${coinClass}" style="font-size:0.9rem;">${wallet.currency}</span>
          <h3 class="text-white text-md font-bold m-0">${escapeHtml(wallet.userName)}</h3>
        </div>
        <div class="text-xs text-muted font-mono">${wallet.userEmail} &bull; Network: ${wallet.network}</div>
      </div>
      <div class="text-right">
        <div class="font-mono text-lg font-bold text-white">${wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ${wallet.currency}</div>
        <div class="font-mono text-xs font-bold text-emerald" style="color:#34d399;">$${usdVal} USD</div>
      </div>
    </div>

    <!-- Cold Storage QR & Address Box -->
    <div class="p-3 mb-3 d-flex items-center gap-4 flex-wrap" style="background:#090d16; border-radius:10px; border:1px solid #334155;">
      <div class="admin-crypto-qr-wrap">
        <div style="font-size:2.5rem; text-align:center;">🏛️<div style="font-size:0.6rem; font-weight:bold; color:#0f172a; margin-top:2px;">WBCU VAULT</div></div>
      </div>
      <div class="flex-1">
        <label class="admin-form-label">Dedicated Institutional Cold / Hot Address (Editable)</label>
        <div class="d-flex items-center gap-2 mb-2">
          <input type="text" id="activeWalletAddressInput" class="admin-form-control font-mono text-xs text-white" value="${wallet.address}" placeholder="Enter on-chain address" />
          <button type="button" class="admin-btn admin-btn-emerald admin-btn-sm" id="btnSaveCustomWalletAddress">💾 Save</button>
          <button type="button" class="admin-btn admin-btn-outline admin-btn-sm" id="btnCopyWalletAddress">Copy</button>
        </div>
        <div class="d-flex items-center justify-between flex-wrap gap-2">
          <div class="d-flex items-center gap-2">
            <button type="button" class="admin-btn admin-btn-outline admin-btn-sm text-xs" id="btnRotateWalletAddress">
              🔄 Rotate Key
            </button>
            <span class="text-xs text-muted">FIPS 140-3 Hardware Security Module</span>
          </div>
          <button type="button" class="admin-btn admin-btn-danger admin-btn-sm text-xs" id="btnAdminDeleteCryptoWallet" style="background:rgba(239,68,68,0.2); border-color:#ef4444; color:#f87171;">
            🗑️ Delete Custody Wallet
          </button>
        </div>
      </div>
    </div>

    <!-- Admin Operational Actions (Credit / Debit / Status) -->
    <div class="admin-user-acct-box mb-3" style="border-color: rgba(56, 189, 248, 0.4);">
      <h4 class="text-white text-xs font-bold uppercase mb-3" style="color:#38bdf8;">⚡ Officer Balance & Status Modifiers</h4>

      <!-- Credit / Debit Forms -->
      <div class="d-grid grid-cols-2 gap-3 mb-3">
        <!-- Credit Action -->
        <div class="p-3" style="background:#0f172a; border-radius:8px; border:1px solid rgba(16, 185, 129, 0.3);">
          <div class="text-xs font-bold uppercase mb-2" style="color:#34d399;">💰 Direct Crypto Credit (+ Add)</div>
          <div class="admin-form-group mb-2">
            <label class="admin-form-label">Amount (${wallet.currency})</label>
            <input type="number" id="creditCryptoAmountInput" class="admin-form-control font-mono text-xs" placeholder="0.50" min="0.000001" step="any" />
          </div>
          <div class="admin-form-group mb-2">
            <label class="admin-form-label">Audit Memo / TX Ref</label>
            <input type="text" id="creditCryptoMemoInput" class="admin-form-control text-xs" placeholder="e.g. Treasury Liquidity Allocation" />
          </div>
          <button type="button" class="admin-btn admin-btn-emerald admin-btn-sm w-100" id="btnExecuteCryptoCredit">
            Post Credit to Wallet
          </button>
        </div>

        <!-- Debit Action -->
        <div class="p-3" style="background:#0f172a; border-radius:8px; border:1px solid rgba(239, 68, 68, 0.3);">
          <div class="text-xs font-bold uppercase mb-2" style="color:#f87171;">💸 Direct Crypto Debit (- Deduct)</div>
          <div class="admin-form-group mb-2">
            <label class="admin-form-label">Amount (${wallet.currency})</label>
            <input type="number" id="debitCryptoAmountInput" class="admin-form-control font-mono text-xs" placeholder="0.25" min="0.000001" step="any" />
          </div>
          <div class="admin-form-group mb-2">
            <label class="admin-form-label">Audit Reason</label>
            <input type="text" id="debitCryptoMemoInput" class="admin-form-control text-xs" placeholder="e.g. Outward Settlement Sweep" />
          </div>
          <button type="button" class="admin-btn admin-btn-danger admin-btn-sm w-100" id="btnExecuteCryptoDebit">
            Execute Debit
          </button>
        </div>
      </div>

      <!-- Status Toggle -->
      <div class="d-flex items-center justify-between p-2" style="background:#090d16; border-radius:8px;">
        <span class="text-xs text-white">Wallet Operational State:</span>
        <div class="d-flex items-center gap-2">
          <select id="walletStatusModifierSelect" class="admin-form-control" style="width: 140px; padding: 0.3rem 0.5rem; font-size: 0.75rem;">
            <option value="active" ${wallet.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="frozen" ${wallet.status === 'frozen' ? 'selected' : ''}>Frozen / Hold</option>
            <option value="inactive" ${wallet.status === 'inactive' ? 'selected' : ''}>Inactive</option>
          </select>
          <button type="button" class="admin-btn admin-btn-primary admin-btn-sm" id="btnSaveWalletStatus">Update</button>
        </div>
      </div>
    </div>
  `;

  // Bind Buttons
  const copyBtn = document.getElementById('btnCopyWalletAddress');
  if (copyBtn) {
    copyBtn.onclick = () => {
      const addr = document.getElementById('activeWalletAddressInput')?.value.trim() || wallet.address;
      navigator.clipboard.writeText(addr);
      showToast('Wallet address copied to clipboard.', 'info', 'Address Copied');
    };
  }

  const saveAddrBtn = document.getElementById('btnSaveCustomWalletAddress');
  if (saveAddrBtn) {
    saveAddrBtn.onclick = () => {
      const newAddr = document.getElementById('activeWalletAddressInput')?.value.trim();
      if (!newAddr) {
        showToast('Please enter a valid wallet address.', 'error', 'Validation Error');
        return;
      }
      wallet.address = newAddr;
      updateWalletProperty(wallet, 'address', newAddr);
      showToast(`Custom wallet address saved for ${wallet.userName}.`, 'success', 'Address Updated');
      renderCryptoWalletsTable();
    };
  }

  const deleteWalletBtn = document.getElementById('btnAdminDeleteCryptoWallet');
  if (deleteWalletBtn) {
    deleteWalletBtn.onclick = () => {
      const confirmDel = confirm(`Are you sure you want to delete ${wallet.userName}'s ${wallet.currency} custodial wallet (${wallet.address})?`);
      if (!confirmDel) return;

      const users = getAdminUsersList();
      const user = users.find((u) => u.id === wallet.userId);
      if (user && user.cryptoWallets) {
        user.cryptoWallets = user.cryptoWallets.filter((w) => w.currency !== wallet.currency);
        saveAdminUsersList(users);
      }

      modal.classList.remove('show');
      refreshWalletsList();
      renderCryptoDashboardMetrics();
      renderCryptoWalletsTable();
      showToast(`Custodial ${wallet.currency} wallet deleted for ${wallet.userName}.`, 'warning', 'Wallet Deleted');
    };
  }

  const rotateBtn = document.getElementById('btnRotateWalletAddress');
  if (rotateBtn) {
    rotateBtn.onclick = () => {
      const newAddr = `bc1q${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 10)}`;
      updateWalletProperty(wallet, 'address', newAddr);
      document.getElementById('activeWalletAddressInput').value = newAddr;
      showToast(`Rotated custodial cold storage key for ${wallet.userName}.`, 'success', 'Address Rotated');
    };
  }

  // Credit Handler
  const creditBtn = document.getElementById('btnExecuteCryptoCredit');
  if (creditBtn) {
    creditBtn.onclick = () => {
      const amt = parseFloat(document.getElementById('creditCryptoAmountInput')?.value || '0');
      const memo = document.getElementById('creditCryptoMemoInput')?.value.trim() || 'Officer Balance Adjustment';
      if (amt <= 0) {
        showToast('Please enter a positive amount.', 'error', 'Validation Error');
        return;
      }

      const newBal = wallet.balance + amt;
      updateWalletProperty(wallet, 'balance', newBal);

      // Add to tx history
      const newTx = {
        id: `ctx-${Date.now().toString().slice(-4)}`,
        txid: `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        userId: wallet.userId,
        userName: wallet.userName,
        userEmail: wallet.userEmail,
        currency: wallet.currency,
        type: 'credit',
        amount: amt,
        usdValue: amt * (currentRates[wallet.currency]?.price || 1),
        fromAddress: 'TREASURY_INTERNAL_MINT',
        toAddress: wallet.address,
        confirmations: 32,
        status: 'confirmed',
        blockHeight: 864925,
        fee: '0.00 (Internal)',
        createdAt: new Date().toISOString(),
        notes: memo
      };
      currentCryptoTx.unshift(newTx);
      saveCryptoTransactions(currentCryptoTx);

      // Member notification
      try {
        createNotification({
          title: `Crypto Deposit Received: +${amt} ${wallet.currency}`,
          message: `+$${(amt * (currentRates[wallet.currency]?.price || 1)).toLocaleString()} USD credited to your ${wallet.currency} wallet.`,
          type: 'transaction',
          channel: 'in_app'
        });
      } catch (e) {
        console.debug('Notif:', e);
      }

      showToast(`Credited +${amt} ${wallet.currency} to ${wallet.userName}.`, 'success', 'Crypto Credited');
      modal.classList.remove('show');
      renderCryptoDashboardMetrics();
      renderCryptoWalletsTable();
      renderCryptoTxTable();
    };
  }

  // Debit Handler
  const debitBtn = document.getElementById('btnExecuteCryptoDebit');
  if (debitBtn) {
    debitBtn.onclick = () => {
      const amt = parseFloat(document.getElementById('debitCryptoAmountInput')?.value || '0');
      const memo = document.getElementById('debitCryptoMemoInput')?.value.trim() || 'Officer Balance Deduction';
      if (amt <= 0) {
        showToast('Please enter a positive amount.', 'error', 'Validation Error');
        return;
      }
      if (amt > wallet.balance) {
        showToast('Cannot debit more than available wallet balance.', 'error', 'Insufficient Funds');
        return;
      }

      const newBal = wallet.balance - amt;
      updateWalletProperty(wallet, 'balance', newBal);

      // Add to tx history
      const newTx = {
        id: `ctx-${Date.now().toString().slice(-4)}`,
        txid: `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        userId: wallet.userId,
        userName: wallet.userName,
        userEmail: wallet.userEmail,
        currency: wallet.currency,
        type: 'debit',
        amount: amt,
        usdValue: amt * (currentRates[wallet.currency]?.price || 1),
        fromAddress: wallet.address,
        toAddress: 'TREASURY_SWEEP_NODE',
        confirmations: 32,
        status: 'confirmed',
        blockHeight: 864926,
        fee: '0.00 (Internal)',
        createdAt: new Date().toISOString(),
        notes: memo
      };
      currentCryptoTx.unshift(newTx);
      saveCryptoTransactions(currentCryptoTx);

      showToast(`Debited -${amt} ${wallet.currency} from ${wallet.userName}.`, 'warning', 'Crypto Debited');
      modal.classList.remove('show');
      renderCryptoDashboardMetrics();
      renderCryptoWalletsTable();
      renderCryptoTxTable();
    };
  }

  // Status Save
  const saveStatusBtn = document.getElementById('btnSaveWalletStatus');
  if (saveStatusBtn) {
    saveStatusBtn.onclick = () => {
      const newStatus = document.getElementById('walletStatusModifierSelect')?.value || 'active';
      updateWalletProperty(wallet, 'status', newStatus);
      showToast(`Wallet status updated to ${newStatus.toUpperCase()}.`, 'success', 'Status Updated');
      modal.classList.remove('show');
      renderCryptoWalletsTable();
    };
  }

  modal.classList.add('show');
}

function updateWalletProperty(wallet, property, value) {
  wallet[property] = value;
  const users = getAdminUsersList();
  const user = users.find((u) => u.id === wallet.userId);
  if (user && user.cryptoWallets) {
    const targetW = user.cryptoWallets.find((w) => w.currency === wallet.currency);
    if (targetW) {
      targetW[property] = value;
      saveAdminUsersList(users);
    }
  }

  // Also sync to active user crypto wallets in localStorage if matching
  try {
    const rawUserWallets = localStorage.getItem('wb_credit_union_user_crypto_wallets');
    if (rawUserWallets) {
      const uWallets = JSON.parse(rawUserWallets);
      const uw = uWallets.find((w) => w.symbol === wallet.currency);
      if (uw) {
        if (property === 'address') uw.address = value;
        if (property === 'balance') uw.balance = parseFloat(value);
        if (property === 'status') uw.isActive = (value === 'active');
        localStorage.setItem('wb_credit_union_user_crypto_wallets', JSON.stringify(uWallets));
      }
    }
  } catch (e) {
    console.debug('User wallet sync note:', e);
  }
}

/* ----------------------------------------------------------------------------
 * 11. EXCHANGE RATES MATRIX & PRICING TICKER
 * ---------------------------------------------------------------------------- */
function setupExchangeRatesManager() {
  const updateAllBtn = document.getElementById('btnUpdateAllRates');
  const autoUpdateToggle = document.getElementById('toggleAutoRates');

  if (updateAllBtn) {
    updateAllBtn.addEventListener('click', () => {
      // Simulate live market sync with minor realistic variance
      Object.keys(currentRates).forEach((sym) => {
        if (sym !== 'USDT' && sym !== 'USDC') {
          const delta = (Math.random() * 0.04 - 0.02); // -2% to +2%
          currentRates[sym].price = +(currentRates[sym].price * (1 + delta)).toFixed(2);
          currentRates[sym].change24h = `${delta >= 0 ? '+' : ''}${(delta * 100).toFixed(1)}%`;
        }
      });
      saveExchangeRates(currentRates);
      renderExchangeRateCards();
      renderCryptoDashboardMetrics();
      renderCryptoWalletsTable();
      showToast('Exchange rates synced with Swiss Digital Asset Exchange (SDAX).', 'success', 'Rates Updated');
    });
  }

  if (autoUpdateToggle) {
    let autoInterval = null;
    autoUpdateToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        autoInterval = setInterval(() => {
          if (updateAllBtn) updateAllBtn.click();
        }, 30000);
        showToast('Auto-update ticker enabled (30s interval).', 'info', 'Ticker Active');
      } else {
        clearInterval(autoInterval);
        showToast('Auto-update ticker paused.', 'info', 'Ticker Paused');
      }
    });
  }
}

function renderExchangeRateCards() {
  const container = document.getElementById('exchangeRatesGrid');
  const timestampEl = document.getElementById('ratesLastUpdatedTimestamp');
  if (timestampEl) timestampEl.textContent = `Last Synced: ${new Date().toLocaleTimeString()} (Zurich CET)`;
  if (!container) return;

  container.innerHTML = Object.entries(currentRates).map(([symbol, rate]) => `
    <div class="admin-rate-card" data-coin="${symbol}">
      <div>
        <div class="d-flex items-center justify-between">
          <span class="crypto-coin-badge coin-${symbol.toLowerCase()}">${symbol}</span>
          <span class="action-chip ${rate.change24h.startsWith('+') ? 'action-chip-approve' : 'badge-status-failed'} font-bold">
            ${rate.change24h}
          </span>
        </div>
        <div class="admin-rate-value" id="rate-display-${symbol}">
          $${rate.price.toLocaleString('en-US', { minimumFractionDigits: symbol === 'XRP' ? 4 : 2, maximumFractionDigits: symbol === 'XRP' ? 4 : 2 })}
        </div>
        <div class="text-xs text-muted mb-3">${rate.name} &bull; ${rate.network}</div>
      </div>

      <div>
        <label class="admin-form-label" style="font-size: 0.65rem;">Manual Override Rate (USD)</label>
        <div class="d-flex items-center gap-2">
          <input type="number" id="input-rate-${symbol}" class="admin-form-control font-mono text-xs" value="${rate.price}" step="any" />
          <button type="button" class="admin-btn admin-btn-primary admin-btn-sm btn-save-individual-rate" data-coin="${symbol}">
            Save
          </button>
        </div>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.btn-save-individual-rate').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sym = btn.getAttribute('data-coin');
      const input = document.getElementById(`input-rate-${sym}`);
      const newPrice = parseFloat(input?.value || '0');
      if (newPrice > 0 && currentRates[sym]) {
        currentRates[sym].price = newPrice;
        saveExchangeRates(currentRates);
        renderExchangeRateCards();
        renderCryptoDashboardMetrics();
        renderCryptoWalletsTable();
        showToast(`${sym} exchange rate manually updated to $${newPrice.toLocaleString()}.`, 'success', 'Rate Saved');
      }
    });
  });
}

/* ----------------------------------------------------------------------------
 * 12. CRYPTO TRANSACTIONS LEDGER & SEARCH
 * ---------------------------------------------------------------------------- */
function setupCryptoTxSearchAndFilters() {
  const searchInput = document.getElementById('cryptoTxSearchInput');
  const typeFilter = document.getElementById('cryptoTxTypeFilter');
  const statusFilter = document.getElementById('cryptoTxStatusFilter');
  const clearBtn = document.getElementById('btnClearCryptoTxFilters');

  let timer = null;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(applyCryptoTxFilters, 250);
    });
  }

  [typeFilter, statusFilter].forEach((sel) => {
    if (sel) sel.addEventListener('change', applyCryptoTxFilters);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (typeFilter) typeFilter.value = 'all';
      if (statusFilter) statusFilter.value = 'all';
      applyCryptoTxFilters();
    });
  }
}

function applyCryptoTxFilters() {
  const query = (document.getElementById('cryptoTxSearchInput')?.value || '').trim().toLowerCase();
  const typeVal = document.getElementById('cryptoTxTypeFilter')?.value || 'all';
  const statusVal = document.getElementById('cryptoTxStatusFilter')?.value || 'all';

  filteredCryptoTx = currentCryptoTx.filter((t) => {
    const matchesQuery = !query ||
      t.userName.toLowerCase().includes(query) ||
      t.txid.toLowerCase().includes(query) ||
      t.currency.toLowerCase().includes(query);

    const matchesType = typeVal === 'all' || t.type === typeVal;
    const matchesStatus = statusVal === 'all' || t.status === statusVal;

    return matchesQuery && matchesType && matchesStatus;
  });

  renderCryptoTxTable();
}

export function renderCryptoTxTable() {
  const tbody = document.getElementById('adminCryptoTxTableBody');
  const countBadge = document.getElementById('cryptoTxCountBadge');

  if (countBadge) countBadge.textContent = `${filteredCryptoTx.length} On-Chain Records`;
  if (!tbody) return;

  if (filteredCryptoTx.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center p-5 text-muted">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">⛓️</div>
          <div class="font-bold text-white mb-1">No on-chain ledger transactions found</div>
          <div class="text-xs">Adjust your search or filter parameters.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredCryptoTx.map((tx) => {
    const dateFormatted = new Date(tx.createdAt).toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return `
      <tr class="admin-user-row" data-tx-id="${tx.id}">
        <td>
          <span class="admin-txid-chip" title="Click to view block explorer" onclick="event.stopPropagation();">
            ${tx.txid.slice(0, 10)}...${tx.txid.slice(-6)} 🔍
          </span>
          <div class="text-xs text-muted font-mono mt-0.5">${dateFormatted}</div>
        </td>
        <td>
          <div class="font-bold text-white text-xs">${escapeHtml(tx.userName)}</div>
          <div class="text-xs text-muted font-mono">${escapeHtml(tx.userEmail)}</div>
        </td>
        <td>
          <span class="admin-tx-type-tag uppercase font-bold">${tx.type}</span>
        </td>
        <td>
          <span class="crypto-coin-badge coin-${tx.currency.toLowerCase()}">${tx.currency}</span>
        </td>
        <td>
          <div class="font-mono text-xs font-bold text-white">${tx.amount} ${tx.currency}</div>
          <div class="font-mono text-xs text-muted">$${tx.usdValue.toLocaleString()} USD</div>
        </td>
        <td>
          <span class="action-chip ${tx.status === 'confirmed' ? 'action-chip-approve' : 'badge-status-pending'}">
            ${tx.status.toUpperCase()} (${tx.confirmations} Blocks)
          </span>
        </td>
        <td class="text-right" onclick="event.stopPropagation()">
          <button type="button" class="admin-btn admin-btn-outline admin-btn-sm btn-inspect-crypto-tx" data-tx-id="${tx.id}">
            Inspect &rarr;
          </button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.btn-inspect-crypto-tx').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-tx-id');
      const tx = currentCryptoTx.find((t) => t.id === id);
      if (tx) openCryptoTxModal(tx);
    });
  });
}

/* ----------------------------------------------------------------------------
 * 13. CRYPTO TX INSPECTOR MODAL
 * ---------------------------------------------------------------------------- */
function setupCryptoTxDetailModal() {
  const modal = document.getElementById('cryptoTxDetailModal');
  const closeBtn = document.getElementById('closeCryptoTxDetailModalBtn');
  if (closeBtn && modal) {
    closeBtn.onclick = () => modal.classList.remove('show');
  }
}

function openCryptoTxModal(tx) {
  const modal = document.getElementById('cryptoTxDetailModal');
  const body = document.getElementById('cryptoTxDetailModalBody');
  if (!modal || !body) return;

  body.innerHTML = `
    <div class="p-3 mb-3" style="background:#090d16; border-radius:8px; border:1px solid #334155;">
      <span class="text-xs text-muted d-block uppercase font-bold">Transaction Hash (TXID)</span>
      <div class="font-mono text-xs font-bold text-emerald text-break" style="color:#38bdf8; word-break:break-all;">
        ${tx.txid}
      </div>
    </div>

    <div class="d-grid grid-cols-2 gap-3 mb-3">
      <div class="admin-user-acct-box">
        <span class="text-xs text-muted d-block">Origin Address</span>
        <span class="font-mono text-xs text-white text-break">${tx.fromAddress}</span>
      </div>
      <div class="admin-user-acct-box">
        <span class="text-xs text-muted d-block">Destination Vault</span>
        <span class="font-mono text-xs text-white text-break">${tx.toAddress}</span>
      </div>
    </div>

    <div class="d-grid grid-cols-3 gap-2 mb-3">
      <div class="p-2 text-center" style="background:#0f172a; border-radius:6px;">
        <span class="text-xs text-muted d-block">Block Height</span>
        <span class="font-mono text-xs font-bold text-white">#${tx.blockHeight || 864920}</span>
      </div>
      <div class="p-2 text-center" style="background:#0f172a; border-radius:6px;">
        <span class="text-xs text-muted d-block">Confirmations</span>
        <span class="font-mono text-xs font-bold text-emerald" style="color:#34d399;">${tx.confirmations} Blocks</span>
      </div>
      <div class="p-2 text-center" style="background:#0f172a; border-radius:6px;">
        <span class="text-xs text-muted d-block">Gas / Miner Fee</span>
        <span class="font-mono text-xs font-bold text-white">${tx.fee || '0.00'}</span>
      </div>
    </div>

    <div class="admin-user-acct-box mb-3">
      <span class="text-xs text-muted d-block">Officer Memo / Compliance Reference</span>
      <span class="text-xs text-white font-semibold">${escapeHtml(tx.notes || 'On-chain liquidity settlement')}</span>
    </div>
  `;

  modal.classList.add('show');
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
