/**
 * ============================================================================
 * NinjaBank Unified Web App - Microservice Orchestrator & Live Risk Dashboard
 * ============================================================================
 */

// Global State
const state = {
  jwtToken: sessionStorage.getItem('ninja_jwt') || '',
  userEmail: 'testuser@ninjabank.com',
  deviceId: localStorage.getItem('ninja_device_id') || ('DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase()),
  config: {
    txnUrl: localStorage.getItem('ninja_txn_url') || (window.location.origin.startsWith('http') ? window.location.origin : 'http://localhost:8080'),
    accountUrl: localStorage.getItem('ninja_account_url') || 'https://accountservice-bank.onrender.com',
    userUrl: localStorage.getItem('ninja_user_url') || 'https://userservice-bank.onrender.com'
  },
  currentAssessment: null,
  pendingTransferPayload: null,
  recentTransactions: []
};

// Store device ID permanently
localStorage.setItem('ninja_device_id', state.deviceId);

// DOM Elements
const DOM = {
  displayDeviceId: document.getElementById('display-device-id'),
  dotUser: document.getElementById('dot-user'),
  dotAccount: document.getElementById('dot-account'),
  dotTxn: document.getElementById('dot-txn'),
  authBtnLabel: document.getElementById('auth-btn-label'),
  cardAccNum: document.getElementById('card-acc-num'),
  cardAccName: document.getElementById('card-acc-name'),
  cardAccBalance: document.getElementById('card-acc-balance'),
  cardAccStatus: document.getElementById('card-acc-status'),
  inputFromAcc: document.getElementById('input-from-acc'),
  inputToAcc: document.getElementById('input-to-acc'),
  inputAmount: document.getElementById('input-amount'),
  riskSummaryText: document.getElementById('risk-summary-text'),
  riskScoreValue: document.getElementById('risk-score-value'),
  riskLevelBadge: document.getElementById('risk-level-badge'),
  riskProgressBar: document.getElementById('risk-progress-bar'),
  riskFactorsContainer: document.getElementById('risk-factors-container'),
  transferForm: document.getElementById('transfer-form'),
  btnSubmitTransfer: document.getElementById('btn-submit-transfer'),
  btnRefreshAccount: document.getElementById('btn-refresh-account'),
  
  // Profile elements
  profileRiskScore: document.getElementById('profile-risk-score'),
  profileSafeCount: document.getElementById('profile-safe-count'),
  profileUnsafeCount: document.getElementById('profile-unsafe-count'),
  profileFailedAttempts: document.getElementById('profile-failed-attempts'),
  securityAlertBox: document.getElementById('security-alert-box'),
  securityAlertMsg: document.getElementById('security-alert-msg'),
  
  // Audit Simulator
  reviewTxnId: document.getElementById('review-txn-id'),
  btnReviewSafe: document.getElementById('btn-review-safe'),
  btnReviewUnsafe: document.getElementById('btn-review-unsafe'),
  
  // Table
  transactionLogBody: document.getElementById('transaction-log-body'),
  
  // Modals
  modalMedium: document.getElementById('modal-medium-confirm'),
  mediumFactorsBreakdown: document.getElementById('medium-factors-breakdown'),
  btnCancelMedium: document.getElementById('btn-cancel-medium'),
  btnConfirmMedium: document.getElementById('btn-confirm-medium'),
  
  modalHigh: document.getElementById('modal-high-password'),
  inputRiskPwdPrompt: document.getElementById('input-risk-pwd-prompt'),
  btnCancelHigh: document.getElementById('btn-cancel-high'),
  btnSubmitRiskPwd: document.getElementById('btn-submit-risk-pwd'),
  
  modalSetPwd: document.getElementById('modal-set-password'),
  inputNewRiskPwd: document.getElementById('input-new-risk-pwd'),
  btnOpenRiskPwd: document.getElementById('btn-open-risk-pwd'),
  btnCloseSetPwd: document.getElementById('btn-close-set-pwd'),
  btnSaveNewPwd: document.getElementById('btn-save-new-pwd'),
  
  modalAuth: document.getElementById('modal-auth-config'),
  inputJwtToken: document.getElementById('input-jwt-token'),
  btnOpenAuth: document.getElementById('btn-open-auth'),
  btnCloseAuth: document.getElementById('btn-close-auth'),
  btnSaveJwt: document.getElementById('btn-save-jwt'),
  btnGenTestToken: document.getElementById('btn-gen-test-token'),
  
  modalCfg: document.getElementById('modal-services-config'),
  cfgTxnUrl: document.getElementById('cfg-txn-url'),
  cfgAccountUrl: document.getElementById('cfg-account-url'),
  cfgUserUrl: document.getElementById('cfg-user-url'),
  btnOpenConfig: document.getElementById('btn-open-config'),
  btnCloseCfg: document.getElementById('btn-close-cfg'),
  btnSaveCfg: document.getElementById('btn-save-cfg'),
  
  toastContainer: document.getElementById('toast-container')
};

// ============================================================================
// Initialization
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
  DOM.displayDeviceId.textContent = state.deviceId;
  initAuth();
  initServicePings();
  fetchSenderAccount();
  triggerRiskAssessment();
  bindEvents();
});

// ============================================================================
// Authentication & JWT
// ============================================================================

function initAuth() {
  if (!state.jwtToken) {
    // Generate an automatic pre-signed test token so user can test instantly without login friction
    generateDefaultTestToken();
  }
  updateAuthUI();
}

function updateAuthUI() {
  if (state.jwtToken) {
    try {
      const parts = state.jwtToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        state.userEmail = payload.sub || 'testuser@ninjabank.com';
      }
    } catch (e) {
      state.userEmail = 'testuser@ninjabank.com';
    }
    DOM.authBtnLabel.textContent = `👤 ${state.userEmail}`;
  } else {
    DOM.authBtnLabel.textContent = '🔑 Set JWT Token';
  }
}

function generateDefaultTestToken() {
  // Pre-signed HMAC-SHA256 test token matching server JWT_SECRET for testuser@ninjabank.com
  const defaultToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0dXNlckBuaW5qYWJhbmsuY29tIiwiaWF0IjoxNzkxNDg4NDc4LCJleHAiOjE3OTE0OTIwNzh9.VSXDPNNrbC0aJp9YbmgqopWfxMpBvcxcGfA3W7Z43lQ";
  state.jwtToken = defaultToken;
  sessionStorage.setItem('ninja_jwt', defaultToken);
  DOM.inputJwtToken.value = defaultToken;
}

// ============================================================================
// Service Health Monitoring
// ============================================================================

async function initServicePings() {
  // 1. Transaction Service Health
  try {
    const res = await fetch(`${state.config.txnUrl}/health`);
    if (res.ok) {
      DOM.dotTxn.className = 'dot-status';
    } else {
      DOM.dotTxn.className = 'dot-status warning';
    }
  } catch {
    DOM.dotTxn.className = 'dot-status warning';
  }

  // 2. Account Service Health
  try {
    const res = await fetch(`${state.config.accountUrl}/accounts/ACC-1001`, { method: 'GET' });
    DOM.dotAccount.className = res.status !== 502 ? 'dot-status' : 'dot-status warning';
  } catch {
    DOM.dotAccount.className = 'dot-status warning';
  }

  // 3. User Service Health
  try {
    const res = await fetch(`${state.config.userUrl}/users/devices/verify?email=test&deviceId=ping`);
    DOM.dotUser.className = res.status !== 502 ? 'dot-status' : 'dot-status warning';
  } catch {
    DOM.dotUser.className = 'dot-status warning';
  }
}

// ============================================================================
// Account Service Integration
// ============================================================================

async function fetchSenderAccount() {
  const accNo = DOM.inputFromAcc.value.trim() || 'ACC-1001';
  DOM.cardAccNum.textContent = accNo;
  DOM.cardAccName.textContent = 'Contacting Account Service...';

  try {
    const res = await fetch(`${state.config.accountUrl}/accounts/${accNo}`);
    if (res.ok) {
      const data = await res.json();
      DOM.cardAccName.textContent = data.accountName || 'Active Customer Account';
      DOM.cardAccBalance.textContent = `₹${Number(data.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      DOM.cardAccStatus.textContent = data.accountStatus || 'ACTIVE';
      DOM.cardAccStatus.className = 'status-active-pill';
    } else {
      DOM.cardAccName.textContent = 'Account Demo Sandbox';
      DOM.cardAccBalance.textContent = '₹50,000.00';
      DOM.cardAccStatus.textContent = 'SANDBOX';
    }
  } catch (err) {
    DOM.cardAccName.textContent = 'Account Service Connected';
    DOM.cardAccBalance.textContent = '₹50,000.00';
    DOM.cardAccStatus.textContent = 'DEMO';
  }
}

// ============================================================================
// Real-time Risk Assessment Simulator (Transaction Service)
// ============================================================================

let debounceTimer = null;

function triggerRiskAssessment() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runRiskAssessment, 250);
}

async function runRiskAssessment() {
  const fromAcc = DOM.inputFromAcc.value.trim();
  const toAcc = DOM.inputToAcc.value.trim();
  const amount = parseFloat(DOM.inputAmount.value) || 0;

  if (!fromAcc || !toAcc || amount <= 0) {
    updateRiskMeterUI(0, 'LOW', [], 'Enter transfer details to calculate risk score');
    return;
  }

  DOM.riskSummaryText.textContent = 'Evaluating risk with adaptive rules...';

  try {
    const payload = {
      fromAccountNumber: fromAcc,
      toAccountNumber: toAcc,
      amount: amount,
      deviceId: state.deviceId
    };

    const res = await fetch(`${state.config.txnUrl}/transactions/assess-risk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.jwtToken}`,
        'X-Device-Id': state.deviceId
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      state.currentAssessment = data;
      updateRiskMeterUI(data.riskScore, data.riskLevel, data.riskFactors || [], data.message);
    } else {
      // Fallback local preview simulation if not authenticated yet
      simulateRiskPreviewLocally(amount, fromAcc, toAcc);
    }
  } catch (err) {
    simulateRiskPreviewLocally(amount, fromAcc, toAcc);
  }
}

function simulateRiskPreviewLocally(amount, fromAcc, toAcc) {
  let score = 0;
  const factors = [];

  if (amount >= 10000) {
    score += 30;
    factors.push('VERY_LARGE_TRANSACTION');
  } else if (amount >= 5000) {
    score += 15;
    factors.push('LARGE_TRANSACTION');
  }

  if (toAcc !== fromAcc) {
    score += 20;
    factors.push('NEW_RECEIVER');
  }

  const hour = new Date().getHours();
  if (hour < 6 || hour >= 23) {
    score += 10;
    factors.push('UNUSUAL_TRANSACTION_TIME');
  }

  let level = 'LOW';
  if (score <= 30) level = 'LOW';
  else if (score <= 80) level = 'MEDIUM';
  else level = 'HIGH';

  updateRiskMeterUI(score, level, factors, `${level} Risk Level Estimated`);
}

function updateRiskMeterUI(score, level, factors, message) {
  DOM.riskScoreValue.textContent = score;
  DOM.riskSummaryText.textContent = message || 'Risk evaluation complete';

  // Badge & Bar Color
  DOM.riskLevelBadge.className = `risk-level-badge ${level.toLowerCase()}`;
  DOM.riskLevelBadge.textContent = `${level} RISK`;

  DOM.riskProgressBar.style.width = `${score}%`;
  if (level === 'LOW') {
    DOM.riskProgressBar.style.backgroundColor = 'var(--risk-low)';
  } else if (level === 'MEDIUM') {
    DOM.riskProgressBar.style.backgroundColor = 'var(--risk-medium)';
  } else {
    DOM.riskProgressBar.style.backgroundColor = 'var(--risk-high)';
  }

  // Factor Chips
  DOM.riskFactorsContainer.innerHTML = '';
  if (factors.length === 0) {
    DOM.riskFactorsContainer.innerHTML = '<span style="font-size: 12px; color: var(--text-subtle);">No critical risk factors triggered</span>';
  } else {
    factors.forEach(f => {
      const chip = document.createElement('span');
      chip.className = 'factor-chip';
      chip.textContent = `⚠️ ${f.replace(/_/g, ' ')}`;
      DOM.riskFactorsContainer.appendChild(chip);
    });
  }
}

// ============================================================================
// Transfer Execution Pipeline
// ============================================================================

DOM.transferForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const payload = {
    fromAccountNumber: DOM.inputFromAcc.value.trim(),
    toAccountNumber: DOM.inputToAcc.value.trim(),
    amount: parseFloat(DOM.inputAmount.value),
    deviceId: state.deviceId
  };

  state.pendingTransferPayload = payload;

  const currentLevel = state.currentAssessment ? state.currentAssessment.riskLevel : 'LOW';

  if (currentLevel === 'HIGH') {
    // High Risk: Prompt dedicated Risk Password
    DOM.inputRiskPwdPrompt.value = '';
    DOM.modalHigh.classList.add('active');
  } else if (currentLevel === 'MEDIUM') {
    // Medium Risk: Prompt confirmation dialog
    const factors = state.currentAssessment && state.currentAssessment.riskFactors ? state.currentAssessment.riskFactors.join(', ') : 'ELEVATED_AMOUNT';
    DOM.mediumFactorsBreakdown.textContent = `Triggered Factors: ${factors}`;
    DOM.modalMedium.classList.add('active');
  } else {
    // Low Risk: Direct transfer
    executeTransfer(payload);
  }
});

async function executeTransfer(transferData) {
  DOM.btnSubmitTransfer.disabled = true;
  DOM.btnSubmitTransfer.textContent = '⏳ Processing Transfer with Risk Engine...';

  try {
    const res = await fetch(`${state.config.txnUrl}/transactions/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.jwtToken}`,
        'X-Device-Id': state.deviceId
      },
      body: JSON.stringify(transferData)
    });

    const data = await res.json();

    if (res.ok) {
      showToast('🎉 Transfer completed successfully!', 'success');
      appendTransactionToTable(data);
      fetchSenderAccount();
      triggerRiskAssessment();
    } else {
      const errorMsg = data.message || 'Transfer failed';
      showToast(`❌ ${errorMsg}`, 'error');

      // Update failed attempts visual if password issue
      if (errorMsg.includes('failed attempt')) {
        incrementFailedCounterUI();
      }
    }
  } catch (err) {
    showToast(`❌ Connection error: ${err.message}`, 'error');
  } finally {
    DOM.btnSubmitTransfer.disabled = false;
    DOM.btnSubmitTransfer.textContent = '🚀 Execute Secure Transfer';
    closeAllModals();
  }
}

function incrementFailedCounterUI() {
  const current = parseInt(DOM.profileFailedAttempts.textContent) || 0;
  const next = current + 1;
  DOM.profileFailedAttempts.textContent = `${next}/6`;
  if (next >= 6) {
    DOM.securityAlertBox.className = 'security-status-alert frozen';
    DOM.securityAlertMsg.textContent = 'ACCOUNT FROZEN: Max risk password attempts exceeded (24hr lock).';
  } else if (next >= 4) {
    DOM.securityAlertBox.className = 'security-status-alert frozen';
    DOM.securityAlertMsg.textContent = `Security Warning: ${next} failed password attempts recorded.`;
  }
}

function appendTransactionToTable(txn) {
  const tbody = DOM.transactionLogBody;

  // Clear placeholder row if empty
  if (state.recentTransactions.length === 0) {
    tbody.innerHTML = '';
  }

  state.recentTransactions.unshift(txn);

  const tr = document.createElement('tr');
  const levelClass = txn.riskLevel || 'LOW';

  tr.innerHTML = `
    <td><code>${txn.transactionId || 'TXN-NEW'}</code></td>
    <td><strong>${txn.fromAccountNumber}</strong> → <strong>${txn.toAccountNumber}</strong></td>
    <td style="color: var(--risk-low); font-weight: 700;">₹${Number(txn.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
    <td><strong style="font-size: 14px;">${txn.riskScore || 0}</strong></td>
    <td><span class="risk-tag-sm ${levelClass}">${levelClass}</span></td>
    <td><small style="color: var(--text-muted);">${txn.riskFactors ? txn.riskFactors.replace(/,/g, ', ') : 'NONE'}</small></td>
    <td><span style="color: #6ee7b7; font-weight: 600;">SUCCESS</span></td>
  `;

  tbody.prepend(tr);
}

// ============================================================================
// Modals Handlers
// ============================================================================

function bindEvents() {
  // Input debouncing for live risk score
  DOM.inputAmount.addEventListener('input', triggerRiskAssessment);
  DOM.inputFromAcc.addEventListener('input', () => {
    fetchSenderAccount();
    triggerRiskAssessment();
  });
  DOM.inputToAcc.addEventListener('input', triggerRiskAssessment);
  DOM.btnRefreshAccount.addEventListener('click', fetchSenderAccount);

  // Medium Risk Confirm
  DOM.btnCancelMedium.addEventListener('click', () => DOM.modalMedium.classList.remove('active'));
  DOM.btnConfirmMedium.addEventListener('click', () => {
    if (state.pendingTransferPayload) {
      state.pendingTransferPayload.confirmed = true;
      executeTransfer(state.pendingTransferPayload);
    }
  });

  // High Risk Password Submit
  DOM.btnCancelHigh.addEventListener('click', () => DOM.modalHigh.classList.remove('active'));
  DOM.btnSubmitRiskPwd.addEventListener('click', () => {
    const pwd = DOM.inputRiskPwdPrompt.value.trim();
    if (!pwd) {
      showToast('⚠️ Please enter your Risk Password', 'warning');
      return;
    }
    if (state.pendingTransferPayload) {
      state.pendingTransferPayload.riskPassword = pwd;
      executeTransfer(state.pendingTransferPayload);
    }
  });

  // Set Risk Password Modal
  DOM.btnOpenRiskPwd.addEventListener('click', () => DOM.modalSetPwd.classList.add('active'));
  DOM.btnCloseSetPwd.addEventListener('click', () => DOM.modalSetPwd.classList.remove('active'));
  DOM.btnSaveNewPwd.addEventListener('click', async () => {
    const newPwd = DOM.inputNewRiskPwd.value.trim();
    if (newPwd.length < 4) {
      showToast('Password must be at least 4 characters', 'warning');
      return;
    }
    try {
      const res = await fetch(`${state.config.txnUrl}/transactions/risk-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.jwtToken}`
        },
        body: JSON.stringify({ password: newPwd })
      });
      if (res.ok) {
        showToast('🔐 Risk Password configured successfully!', 'success');
        DOM.modalSetPwd.classList.remove('active');
        DOM.inputNewRiskPwd.value = '';
      } else {
        const err = await res.json();
        showToast(`❌ ${err.message || 'Could not set password'}`, 'error');
      }
    } catch (e) {
      showToast(`❌ Error: ${e.message}`, 'error');
    }
  });

  // Auth Modal
  DOM.btnOpenAuth.addEventListener('click', () => DOM.modalAuth.classList.add('active'));
  DOM.btnCloseAuth.addEventListener('click', () => DOM.modalAuth.classList.remove('active'));
  DOM.btnGenTestToken.addEventListener('click', () => {
    generateDefaultTestToken();
    showToast('Applied pre-signed test token', 'success');
  });
  DOM.btnSaveJwt.addEventListener('click', () => {
    const token = DOM.inputJwtToken.value.trim();
    if (token) {
      state.jwtToken = token;
      sessionStorage.setItem('ninja_jwt', token);
      updateAuthUI();
      showToast('JWT Token updated', 'success');
      DOM.modalAuth.classList.remove('active');
      triggerRiskAssessment();
    }
  });

  // Config Modal
  DOM.btnOpenConfig.addEventListener('click', () => {
    DOM.cfgTxnUrl.value = state.config.txnUrl;
    DOM.cfgAccountUrl.value = state.config.accountUrl;
    DOM.cfgUserUrl.value = state.config.userUrl;
    DOM.modalCfg.classList.add('active');
  });
  DOM.btnCloseCfg.addEventListener('click', () => DOM.modalCfg.classList.remove('active'));
  DOM.btnSaveCfg.addEventListener('click', () => {
    state.config.txnUrl = DOM.cfgTxnUrl.value.trim();
    state.config.accountUrl = DOM.cfgAccountUrl.value.trim();
    state.config.userUrl = DOM.cfgUserUrl.value.trim();

    localStorage.setItem('ninja_txn_url', state.config.txnUrl);
    localStorage.setItem('ninja_account_url', state.config.accountUrl);
    localStorage.setItem('ninja_user_url', state.config.userUrl);

    DOM.modalCfg.classList.remove('active');
    showToast('Microservice configurations saved', 'success');
    initServicePings();
  });

  // Audit Reviews Simulation
  DOM.btnReviewSafe.addEventListener('click', () => {
    const current = parseInt(DOM.profileRiskScore.textContent) || 0;
    const updated = Math.max(0, current - 5);
    DOM.profileRiskScore.textContent = updated;
    const safeCount = parseInt(DOM.profileSafeCount.textContent) || 0;
    DOM.profileSafeCount.textContent = safeCount + 1;
    showToast('Audit recorded: Marked SAFE (-5 Risk Score)', 'success');
    triggerRiskAssessment();
  });

  DOM.btnReviewUnsafe.addEventListener('click', () => {
    const current = parseInt(DOM.profileRiskScore.textContent) || 0;
    const updated = Math.min(100, current + 15);
    DOM.profileRiskScore.textContent = updated;
    const unsafeCount = parseInt(DOM.profileUnsafeCount.textContent) || 0;
    DOM.profileUnsafeCount.textContent = unsafeCount + 1;
    showToast('Audit recorded: Marked UNSAFE (+15 Risk Score)', 'warning');
    triggerRiskAssessment();
  });

  // Close modals on escape key or backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  });
}

function closeAllModals() {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
}

// ============================================================================
// Toast Notification Utility
// ============================================================================

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
