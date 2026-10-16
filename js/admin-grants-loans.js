/**
 * ============================================================================
 * WB CREDIT UNION - ADMIN GRANTS & LOANS MANAGEMENT CONTROLLER
 * ============================================================================
 */

import { showToast } from './supabase-config.js';
import { getAdminUsersList, updateUser } from './admin-users.js';

const ADMIN_GRANTS_STORAGE_KEY = 'wb_credit_union_admin_grants_db';
const ADMIN_LOANS_STORAGE_KEY = 'wb_credit_union_admin_loans_db';

const defaultGrants = [
  {
    id: 'GR-SWISS-2026-01',
    applicantName: 'Miz Brymo',
    accountNumber: '9482-1049-55',
    programType: 'Swiss Sovereign Clean Energy Transition Grant',
    category: 'Renewable Technology',
    amount: 450000.00,
    status: 'pending',
    date: '2026-09-24',
    purpose: 'Zero-emission logistics fleet decarbonization and solar infrastructure across Alpine distribution hubs.',
    complianceScore: '98/100',
    dossierRef: 'DOS-FED-9921-CH'
  }
];

const defaultLoans = [
  {
    id: 'LN-ZUR-2026-881',
    borrowerName: 'Miz Brymo',
    accountNumber: '9482-1049-55',
    facilityType: 'Zurich Prime Commercial Real Estate Mortgage',
    principal: 2500000.00,
    interestRate: 3.2,
    termMonths: 120,
    monthlyPayment: 24375.00,
    collateral: 'Tier-1 Freehold Commercial Real Estate (Bahnhofstrasse, Zurich)',
    status: 'approved',
    date: '2026-09-18',
    ltv: '58%'
  }
];

export function getAdminGrants() {
  try {
    const raw = localStorage.getItem(ADMIN_GRANTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  localStorage.setItem(ADMIN_GRANTS_STORAGE_KEY, JSON.stringify(defaultGrants));
  return [...defaultGrants];
}

export function saveAdminGrants(grants) {
  try {
    localStorage.setItem(ADMIN_GRANTS_STORAGE_KEY, JSON.stringify(grants));
  } catch (e) {}
}

export function getAdminLoans() {
  try {
    const raw = localStorage.getItem(ADMIN_LOANS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  localStorage.setItem(ADMIN_LOANS_STORAGE_KEY, JSON.stringify(defaultLoans));
  return [...defaultLoans];
}

export function saveAdminLoans(loans) {
  try {
    localStorage.setItem(ADMIN_LOANS_STORAGE_KEY, JSON.stringify(loans));
  } catch (e) {}
}

export function initAdminGrantsAndLoans() {
  renderGrantsTable();
  renderLoansTable();
  setupGrantsAndLoansModals();
}

export function renderGrantsTable() {
  const tbody = document.getElementById('adminGrantsTableBody');
  const badge = document.getElementById('adminGrantsTotalBadge');
  const grants = getAdminGrants();

  if (badge) {
    const totalAwarded = grants
      .filter((g) => g.status === 'approved')
      .reduce((sum, g) => sum + (g.amount || 0), 0);
    badge.textContent = `$${totalAwarded.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Total Awarded`;
  }

  if (!tbody) return;

  if (grants.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-muted">No grant applications submitted.</td></tr>`;
    return;
  }

  tbody.innerHTML = grants.map((g, idx) => `
    <tr data-grant-idx="${idx}">
      <td>
        <div class="font-bold text-white font-mono">${escapeHtml(g.id)}</div>
        <div class="text-xs text-muted">${g.date}</div>
      </td>
      <td>
        <div class="font-bold text-white">${escapeHtml(g.applicantName)}</div>
        <div class="text-xs text-muted font-mono">${escapeHtml(g.accountNumber)}</div>
      </td>
      <td>
        <div class="text-white text-sm font-semibold">${escapeHtml(g.programType)}</div>
        <div class="text-xs text-muted">${escapeHtml(g.category)} • Score: <span class="text-emerald font-bold">${g.complianceScore}</span></div>
      </td>
      <td>
        <span class="font-mono text-emerald font-bold text-md">$${(g.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
      </td>
      <td>
        <span class="action-chip ${g.status === 'approved' ? 'action-chip-approve' : (g.status === 'declined' ? 'action-chip-flag' : 'action-chip-pending')}">
          ${g.status === 'approved' ? '✓ DISBURSED' : (g.status === 'declined' ? 'DECLINED' : 'AWAITING SIGNOFF')}
        </span>
      </td>
      <td class="text-right">
        <div class="d-flex items-center justify-end gap-1">
          ${g.status !== 'approved' ? `
            <button type="button" class="admin-btn admin-btn-emerald admin-btn-sm btn-approve-grant" data-idx="${idx}">
              ✓ Disburse
            </button>
          ` : ''}
          <button type="button" class="admin-btn admin-btn-outline admin-btn-sm btn-view-grant" data-idx="${idx}">
            📋 Dossier
          </button>
          ${g.status !== 'declined' && g.status !== 'approved' ? `
            <button type="button" class="admin-btn admin-btn-danger admin-btn-sm btn-decline-grant" data-idx="${idx}">
              ✕ Decline
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  // Bind grant actions
  tbody.querySelectorAll('.btn-approve-grant').forEach((btn) => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      const grant = grants[idx];
      if (!grant) return;

      grant.status = 'approved';
      saveAdminGrants(grants);

      // Credit member account if member exists in user DB
      try {
        const users = getAdminUsersList();
        const targetUser = users.find((u) => u.fullName.toLowerCase() === grant.applicantName.toLowerCase() || u.accounts?.some((a) => a.accountNumber === grant.accountNumber));
        if (targetUser && targetUser.accounts?.length) {
          const acct = targetUser.accounts.find((a) => a.accountNumber === grant.accountNumber) || targetUser.accounts[0];
          acct.balance = (acct.balance || 0) + grant.amount;
          targetUser.status = 'active';
          if (!targetUser.transactions) targetUser.transactions = [];
          targetUser.transactions.unshift({
            id: `TX-GR-${Date.now().toString().slice(-5)}`,
            date: new Date().toISOString(),
            type: 'credit',
            amount: grant.amount,
            currency: 'USD',
            description: `Federal Grant Disbursement: ${grant.programType}`,
            status: 'completed',
            reference: grant.id,
            adminNotes: 'Disbursed by Chief Treasury Officer'
          });
          updateUser(targetUser);
        }
      } catch (err) {
        console.warn('Grant user credit error:', err);
      }

      renderGrantsTable();
      showToast(`Grant ${grant.id} for $${grant.amount.toLocaleString()} approved & disbursed to ${grant.applicantName}.`, 'success', 'Grant Disbursed');
    };
  });

  tbody.querySelectorAll('.btn-decline-grant').forEach((btn) => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      const grant = grants[idx];
      if (!grant) return;
      grant.status = 'declined';
      saveAdminGrants(grants);
      renderGrantsTable();
      showToast(`Grant application ${grant.id} has been declined.`, 'warning', 'Grant Declined');
    };
  });

  tbody.querySelectorAll('.btn-view-grant').forEach((btn) => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      const grant = grants[idx];
      showGrantDossierModal(grant);
    };
  });
}

export function renderLoansTable() {
  const tbody = document.getElementById('adminLoansTableBody');
  const badge = document.getElementById('adminLoansTotalBadge');
  const loans = getAdminLoans();

  if (badge) {
    const totalPrincipal = loans
      .filter((l) => l.status === 'approved')
      .reduce((sum, l) => sum + (l.principal || 0), 0);
    badge.textContent = `$${totalPrincipal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Active Principal`;
  }

  if (!tbody) return;

  if (loans.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-muted">No loan applications submitted.</td></tr>`;
    return;
  }

  tbody.innerHTML = loans.map((l, idx) => `
    <tr data-loan-idx="${idx}">
      <td>
        <div class="font-bold text-white font-mono">${escapeHtml(l.id)}</div>
        <div class="text-xs text-muted">${l.date}</div>
      </td>
      <td>
        <div class="font-bold text-white">${escapeHtml(l.borrowerName)}</div>
        <div class="text-xs text-muted font-mono">${escapeHtml(l.accountNumber)}</div>
      </td>
      <td>
        <div class="text-white text-sm font-semibold">${escapeHtml(l.facilityType)}</div>
        <div class="text-xs text-muted">LTV: <span class="text-white font-bold">${l.ltv}</span> • ${escapeHtml(l.collateral.slice(0, 30))}...</div>
      </td>
      <td>
        <div class="font-mono text-white font-bold text-md">$${(l.principal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
        <div class="text-xs text-emerald font-semibold">${l.interestRate}% APR • ${l.termMonths} Mo.</div>
      </td>
      <td>
        <span class="font-mono text-white font-semibold text-sm">$${(l.monthlyPayment || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo</span>
      </td>
      <td>
        <span class="action-chip ${l.status === 'approved' ? 'action-chip-approve' : (l.status === 'declined' ? 'action-chip-flag' : 'action-chip-pending')}">
          ${l.status === 'approved' ? '✓ FUNDED' : (l.status === 'declined' ? 'REJECTED' : 'UNDERWRITING')}
        </span>
      </td>
      <td class="text-right">
        <div class="d-flex items-center justify-end gap-1">
          ${l.status !== 'approved' ? `
            <button type="button" class="admin-btn admin-btn-emerald admin-btn-sm btn-approve-loan" data-idx="${idx}">
              ✓ Fund
            </button>
          ` : ''}
          <button type="button" class="admin-btn admin-btn-outline admin-btn-sm btn-view-loan" data-idx="${idx}">
            📊 Risk
          </button>
          ${l.status !== 'declined' && l.status !== 'approved' ? `
            <button type="button" class="admin-btn admin-btn-danger admin-btn-sm btn-decline-loan" data-idx="${idx}">
              ✕ Decline
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  // Bind loan actions
  tbody.querySelectorAll('.btn-approve-loan').forEach((btn) => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      const loan = loans[idx];
      if (!loan) return;

      loan.status = 'approved';
      saveAdminLoans(loans);

      // Credit member account if member exists
      try {
        const users = getAdminUsersList();
        const targetUser = users.find((u) => u.fullName.toLowerCase() === loan.borrowerName.toLowerCase() || u.accounts?.some((a) => a.accountNumber === loan.accountNumber));
        if (targetUser && targetUser.accounts?.length) {
          const acct = targetUser.accounts.find((a) => a.accountNumber === loan.accountNumber) || targetUser.accounts[0];
          acct.balance = (acct.balance || 0) + loan.principal;
          targetUser.status = 'active';
          if (!targetUser.transactions) targetUser.transactions = [];
          targetUser.transactions.unshift({
            id: `TX-LN-${Date.now().toString().slice(-5)}`,
            date: new Date().toISOString(),
            type: 'credit',
            amount: loan.principal,
            currency: 'USD',
            description: `Loan Facility Disbursement: ${loan.facilityType}`,
            status: 'completed',
            reference: loan.id,
            adminNotes: 'Credit Facility funded by Treasury Committee'
          });
          updateUser(targetUser);
        }
      } catch (err) {
        console.warn('Loan user credit error:', err);
      }

      renderLoansTable();
      showToast(`Loan facility ${loan.id} ($${loan.principal.toLocaleString()}) approved and principal funded to ${loan.borrowerName}.`, 'success', 'Facility Funded');
    };
  });

  tbody.querySelectorAll('.btn-decline-loan').forEach((btn) => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      const loan = loans[idx];
      if (!loan) return;
      loan.status = 'declined';
      saveAdminLoans(loans);
      renderLoansTable();
      showToast(`Loan facility ${loan.id} has been declined.`, 'warning', 'Facility Declined');
    };
  });

  tbody.querySelectorAll('.btn-view-loan').forEach((btn) => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute('data-idx'), 10);
      const loan = loans[idx];
      showLoanDossierModal(loan);
    };
  });
}

function showGrantDossierModal(grant) {
  let modal = document.getElementById('grantDossierModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'admin-modal-overlay';
    modal.id = 'grantDossierModal';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="admin-modal-card" style="max-width: 650px;">
      <div class="admin-modal-header">
        <div>
          <h3 class="admin-modal-title">Federal &amp; Sovereign Grant Dossier</h3>
          <p class="text-xs text-muted mb-0">Ref: ${escapeHtml(grant.dossierRef || grant.id)}</p>
        </div>
        <button type="button" class="admin-modal-close" id="closeGrantDossierBtn">&times;</button>
      </div>
      <div class="admin-modal-body">
        <div class="p-3 mb-3 rounded" style="background:#090d16; border:1px solid #334155;">
          <div class="d-flex justify-between items-center mb-2">
            <span class="text-xs text-muted">Grant Program:</span>
            <span class="font-bold text-white">${escapeHtml(grant.programType)}</span>
          </div>
          <div class="d-flex justify-between items-center mb-2">
            <span class="text-xs text-muted">Applicant:</span>
            <span class="font-bold text-white">${escapeHtml(grant.applicantName)} (${grant.accountNumber})</span>
          </div>
          <div class="d-flex justify-between items-center mb-2">
            <span class="text-xs text-muted">Funding Amount:</span>
            <span class="font-mono text-emerald font-bold text-lg">$${grant.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="d-flex justify-between items-center">
            <span class="text-xs text-muted">Compliance &amp; Due Diligence:</span>
            <span class="action-chip action-chip-approve">${grant.complianceScore} Verified</span>
          </div>
        </div>

        <div class="mb-3">
          <label class="admin-form-label">Project Scope &amp; Utilization Plan</label>
          <div class="p-3 rounded text-xs text-white" style="background:rgba(255,255,255,0.03); border:1px solid #334155; line-height: 1.6;">
            ${escapeHtml(grant.purpose)}
          </div>
        </div>

        <div class="p-3 rounded" style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3);">
          <div class="text-xs font-bold text-emerald mb-1">✓ Non-Repayable Sovereign Endowment</div>
          <div class="text-xs text-muted">Funds are awarded under Swiss Federal Economic Framework Article 44. No principal repayment or equity claim attaches to this capital allocation.</div>
        </div>
      </div>
      <div class="admin-modal-footer">
        <button type="button" class="admin-btn admin-btn-outline" id="closeGrantDossierFooterBtn">Close Dossier</button>
        ${grant.status !== 'approved' ? `
          <button type="button" class="admin-btn admin-btn-emerald" id="dossierApproveGrantBtn">✓ Authorize Disbursement</button>
        ` : ''}
      </div>
    </div>
  `;

  modal.classList.add('show');

  const closeFn = () => modal.classList.remove('show');
  modal.querySelector('#closeGrantDossierBtn').onclick = closeFn;
  modal.querySelector('#closeGrantDossierFooterBtn').onclick = closeFn;
  modal.onclick = (e) => { if (e.target === modal) closeFn(); };

  const appBtn = modal.querySelector('#dossierApproveGrantBtn');
  if (appBtn) {
    appBtn.onclick = () => {
      const grants = getAdminGrants();
      const match = grants.find((g) => g.id === grant.id);
      if (match) {
        match.status = 'approved';
        saveAdminGrants(grants);
        renderGrantsTable();
        showToast(`Disbursement authorized for ${grant.applicantName}.`, 'success', 'Grant Disbursed');
      }
      closeFn();
    };
  }
}

function showLoanDossierModal(loan) {
  let modal = document.getElementById('loanDossierModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'admin-modal-overlay';
    modal.id = 'loanDossierModal';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="admin-modal-card" style="max-width: 650px;">
      <div class="admin-modal-header">
        <div>
          <h3 class="admin-modal-title">Institutional Credit Facility Underwriting</h3>
          <p class="text-xs text-muted mb-0">Ref: ${escapeHtml(loan.id)} • Risk Rating: AAA</p>
        </div>
        <button type="button" class="admin-modal-close" id="closeLoanDossierBtn">&times;</button>
      </div>
      <div class="admin-modal-body">
        <div class="p-3 mb-3 rounded" style="background:#090d16; border:1px solid #334155;">
          <div class="d-flex justify-between items-center mb-2">
            <span class="text-xs text-muted">Credit Product:</span>
            <span class="font-bold text-white">${escapeHtml(loan.facilityType)}</span>
          </div>
          <div class="d-flex justify-between items-center mb-2">
            <span class="text-xs text-muted">Borrower Member:</span>
            <span class="font-bold text-white">${escapeHtml(loan.borrowerName)} (${loan.accountNumber})</span>
          </div>
          <div class="d-flex justify-between items-center mb-2">
            <span class="text-xs text-muted">Principal Amount:</span>
            <span class="font-mono text-white font-bold text-lg">$${loan.principal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="d-flex justify-between items-center mb-2">
            <span class="text-xs text-muted">Fixed Yield / Term:</span>
            <span class="text-emerald font-bold">${loan.interestRate}% APR • ${loan.termMonths} Months</span>
          </div>
          <div class="d-flex justify-between items-center">
            <span class="text-xs text-muted">Monthly Amortization:</span>
            <span class="font-mono text-white font-bold">$${loan.monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })} / month</span>
          </div>
        </div>

        <div class="mb-3">
          <label class="admin-form-label">Pledged Collateral &amp; Liquidity Coverage</label>
          <div class="p-3 rounded text-xs text-white" style="background:rgba(255,255,255,0.03); border:1px solid #334155;">
            ${escapeHtml(loan.collateral)} (Underwriting LTV: ${loan.ltv})
          </div>
        </div>

        <div class="p-3 rounded" style="background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.3);">
          <div class="text-xs font-bold text-blue mb-1">🏦 Swiss Banking Act Title IV Compliance</div>
          <div class="text-xs text-muted">Senior secured credit facility subject to perfected lien under Swiss Code of Obligations.</div>
        </div>
      </div>
      <div class="admin-modal-footer">
        <button type="button" class="admin-btn admin-btn-outline" id="closeLoanDossierFooterBtn">Close Dossier</button>
        ${loan.status !== 'approved' ? `
          <button type="button" class="admin-btn admin-btn-emerald" id="dossierApproveLoanBtn">✓ Authorize Principal Funding</button>
        ` : ''}
      </div>
    </div>
  `;

  modal.classList.add('show');

  const closeFn = () => modal.classList.remove('show');
  modal.querySelector('#closeLoanDossierBtn').onclick = closeFn;
  modal.querySelector('#closeLoanDossierFooterBtn').onclick = closeFn;
  modal.onclick = (e) => { if (e.target === modal) closeFn(); };

  const appBtn = modal.querySelector('#dossierApproveLoanBtn');
  if (appBtn) {
    appBtn.onclick = () => {
      const loans = getAdminLoans();
      const match = loans.find((l) => l.id === loan.id);
      if (match) {
        match.status = 'approved';
        saveAdminLoans(loans);
        renderLoansTable();
        showToast(`Principal funded for ${loan.borrowerName}.`, 'success', 'Facility Funded');
      }
      closeFn();
    };
  }
}

function setupGrantsAndLoansModals() {
  // Ensure table action buttons can be initialized on demand
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
