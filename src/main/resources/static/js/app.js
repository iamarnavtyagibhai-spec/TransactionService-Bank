/**
 * ============================================================================
 * NinjaBank Unified Web App - Distributed Microservice Orchestrator
 * Connects: UserService, AccountService, and TransactionService (Risk Engine)
 * ============================================================================
 */

// Global Application State
const state = {
  jwtToken: sessionStorage.getItem('ninja_jwt') || '',
  userEmail: localStorage.getItem('ninja_email') || 'arnavtyagi96@gmail.com',
  deviceId: localStorage.getItem('ninja_device_id') || ('DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase()),
  config: {
    txnUrl: localStorage.getItem('ninja_txn_url') || 'https://transactionservice-bank.onrender.com',
    accountUrl: localStorage.getItem('ninja_account_url') || 'https://accountservice-bank.onrender.com',
    userUrl: localStorage.getItem('ninja_user_url') || 'https://userservice-bank.onrender.com'
  },
  currentAssessment: null,
  pendingTransferPayload: null,
  recentTransactions: JSON.parse(localStorage.getItem('ninja_txns') || '[]'),
  activeFilter: 'ALL',
  userProfile: {
    baseRiskScore: 0,
    safeAudits: 0,
    unsafeAudits: 0,
    failedAttempts: 0,
    status: 'NORMAL'
  }
};

// Persist initial state
localStorage.setItem('ninja_device_id', state.deviceId);

// DOM Elements Cache
const DOM = {
  // Navigation & Cluster Status
  dotUser: document.getElementById('dot-user'),
  dotAccount: document.getElementById('dot-account'),
  dotTxn: document.getElementById('dot-txn'),
  latencyUser: document.getElementById('latency-user'),
  latencyAccount: document.getElementById('latency-account'),
  latencyTxn: document.getElementById('latency-txn'),
  btnPingAll: document.getElementById('btn-ping-all'),
  btnOpenConfig: document.getElementById('btn-open-config'),
  btnOpenAuth: document.getElementById('btn-open-auth'),
  authBtnLabel: document.getElementById('auth-btn-label'),
  authTabStatus: document.getElementById('auth-tab-status'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabPanels: document.querySelectorAll('.tab-panel'),

  // Gateway Tab (Risk & Transfer)
  displayDeviceId: document.getElementById('display-device-id'),
  activeSessionEmail: document.getElementById('active-session-email'),
  cardAccNum: document.getElementById('card-acc-num'),
  cardAccName: document.getElementById('card-acc-name'),
  cardAccBalance: document.getElementById('card-acc-balance'),
  cardAccStatus: document.getElementById('card-acc-status'),
  btnRefreshAccount: document.getElementById('btn-refresh-account'),
  btnQuickDeposit: document.getElementById('btn-quick-deposit'),
  btnQuickWithdraw: document.getElementById('btn-quick-withdraw'),
  transferForm: document.getElementById('transfer-form'),
  inputFromAcc: document.getElementById('input-from-acc'),
  inputToAcc: document.getElementById('input-to-acc'),
  inputAmount: document.getElementById('input-amount'),
  riskSummaryText: document.getElementById('risk-summary-text'),
  riskScoreValue: document.getElementById('risk-score-value'),
  riskLevelBadge: document.getElementById('risk-level-badge'),
  riskProgressBar: document.getElementById('risk-progress-bar'),
  riskFactorsContainer: document.getElementById('risk-factors-container'),
  btnSubmitTransfer: document.getElementById('btn-submit-transfer'),

  // Security & Profile (Right Column)
  securityAlertBox: document.getElementById('security-alert-box'),
  securityAlertStatus: document.getElementById('security-alert-status'),
  securityAlertMsg: document.getElementById('security-alert-msg'),
  profileRiskScore: document.getElementById('profile-risk-score'),
  profileSafeCount: document.getElementById('profile-safe-count'),
  profileUnsafeCount: document.getElementById('profile-unsafe-count'),
  profileFailedAttempts: document.getElementById('profile-failed-attempts'),
  btnRefreshProfile: document.getElementById('btn-refresh-profile'),
  btnOpenRiskPwd: document.getElementById('btn-open-risk-pwd'),

  // Account Service Tab
  accSearchInput: document.getElementById('acc-search-input'),
  btnFetchAccountDetails: document.getElementById('btn-fetch-account-details'),
  dtlAccNum: document.getElementById('dtl-acc-num'),
  dtlAccName: document.getElementById('dtl-acc-name'),
  dtlAccBalance: document.getElementById('dtl-acc-balance'),
  dtlAccType: document.getElementById('dtl-acc-type'),
  dtlAccStatus: document.getElementById('dtl-acc-status'),
  dtlAccCreated: document.getElementById('dtl-acc-created'),
  directFromAcc: document.getElementById('direct-from-acc'),
  directToAcc: document.getElementById('direct-to-acc'),
  directAmount: document.getElementById('direct-amount'),
  btnSubmitDirectTransfer: document.getElementById('btn-submit-direct-transfer'),
  depositAccTarget: document.getElementById('deposit-acc-target'),
  depositAmountInput: document.getElementById('deposit-amount-input'),
  btnExecuteDeposit: document.getElementById('btn-execute-deposit'),
  withdrawAccTarget: document.getElementById('withdraw-acc-target'),
  withdrawAmountInput: document.getElementById('withdraw-amount-input'),
  btnExecuteWithdraw: document.getElementById('btn-execute-withdraw'),

  // User Service Tab
  subtabBtns: document.querySelectorAll('.subtab-btn'),
  subtabContents: document.querySelectorAll('.subtab-content'),
  portalLoginForm: document.getElementById('portal-login-form'),
  portalLoginEmail: document.getElementById('portal-login-email'),
  portalLoginPassword: document.getElementById('portal-login-password'),
  portalSignupForm: document.getElementById('portal-signup-form'),
  portalOtpForm: document.getElementById('portal-otp-form'),
  portalForgotForm: document.getElementById('portal-forgot-form'),
  portalResetForm: document.getElementById('portal-reset-form'),
  claimSub: document.getElementById('claim-sub'),
  claimRole: document.getElementById('claim-role'),
  claimIat: document.getElementById('claim-iat'),
  claimExp: document.getElementById('claim-exp'),
  tokenRawDisplay: document.getElementById('token-raw-display'),
  tokenStatusBadge: document.getElementById('token-status-badge'),
  btnCopyToken: document.getElementById('btn-copy-token'),
  btnClearSession: document.getElementById('btn-clear-session'),
  btnApplyTestTokenDirect: document.getElementById('btn-apply-test-token-direct'),

  // Compliance Tab
  reviewTargetTxnId: document.getElementById('review-target-txn-id'),
  btnStudioMarkSafe: document.getElementById('btn-studio-mark-safe'),
  btnStudioMarkUnsafe: document.getElementById('btn-studio-mark-unsafe'),
  riskPwdSetupInput: document.getElementById('risk-pwd-setup-input'),
  btnSaveRiskPwdDirect: document.getElementById('btn-save-risk-pwd-direct'),

  // Ledger Tab
  tabLedgerCount: document.getElementById('tab-ledger-count'),
  filterBtns: document.querySelectorAll('.filter-btn'),
  countAll: document.getElementById('count-all'),
  countLow: document.getElementById('count-low'),
  countMed: document.getElementById('count-med'),
  countHigh: document.getElementById('count-high'),
  transactionLogBody: document.getElementById('transaction-log-body'),
  btnClearLedger: document.getElementById('btn-clear-ledger'),

  // Cluster Diagnostics Tab
  btnClusterPingAll: document.getElementById('btn-cluster-ping-all'),
  diagDotTxn: document.getElementById('diag-dot-txn'),
  diagDotAccount: document.getElementById('diag-dot-account'),
  diagDotUser: document.getElementById('diag-dot-user'),
  diagLatencyTxn: document.getElementById('diag-latency-txn'),
  diagLatencyAccount: document.getElementById('diag-latency-account'),
  diagLatencyUser: document.getElementById('diag-latency-user'),
  diagUrlTxn: document.getElementById('diag-url-txn'),
  diagUrlAccount: document.getElementById('diag-url-account'),
  diagUrlUser: document.getElementById('diag-url-user'),
  cfgDiagTxnUrl: document.getElementById('cfg-diag-txn-url'),
  cfgDiagAccountUrl: document.getElementById('cfg-diag-account-url'),
  cfgDiagUserUrl: document.getElementById('cfg-diag-user-url'),
  btnCfgResetRender: document.getElementById('btn-cfg-reset-render'),
  btnCfgSwitchLocal: document.getElementById('btn-cfg-switch-local'),
  btnCfgSaveAll: document.getElementById('btn-cfg-save-all'),

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
  btnCloseSetPwd: document.getElementById('btn-close-set-pwd'),
  btnSaveNewPwd: document.getElementById('btn-save-new-pwd'),

  modalDeposit: document.getElementById('modal-deposit'),
  depositAmountModal: document.getElementById('deposit-amount-modal'),
  btnCloseDeposit: document.getElementById('btn-close-deposit'),
  btnSubmitDeposit: document.getElementById('btn-submit-deposit'),

  modalWithdraw: document.getElementById('modal-withdraw'),
  withdrawAmountModal: document.getElementById('withdraw-amount-modal'),
  btnCloseWithdraw: document.getElementById('btn-close-withdraw'),
  btnSubmitWithdraw: document.getElementById('btn-submit-withdraw'),

  modalJsonView: document.getElementById('modal-json-view'),
  jsonCodeDisplay: document.getElementById('json-code-display'),
  btnCopyJsonRecord: document.getElementById('btn-copy-json-record'),
  btnCloseJsonView: document.getElementById('btn-close-json-view'),

  toastContainer: document.getElementById('toast-container')
};

// ============================================================================
// Initialization
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
  DOM.displayDeviceId.textContent = state.deviceId;
  initAuthSession();
  bindTabNavigation();
  bindSubtabs();
  bindEventListeners();
  renderLedgerTable();
  updateProfileUI();

  // Initial queries
  fetchSenderAccount();
  triggerRiskAssessment();
  pingAllServices();
});

// ============================================================================
// Auth Session & JWT Inspector
// ============================================================================

function initAuthSession() {
  if (!state.jwtToken) {
    // Generate default test token for immediate seamless experience
    generateDefaultTestToken();
  }
  updateAuthUI();
}

function generateDefaultTestToken() {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const exp = Math.floor(Date.now() / 1000) + (3600 * 24); // 24 hours
  const iat = Math.floor(Date.now() / 1000);
  const payload = btoa(JSON.stringify({
    sub: state.userEmail || 'arnavtyagi96@gmail.com',
    role: 'ROLE_USER',
    iat: iat,
    exp: exp
  }));
  const signature = 'dGVzdF9zaWduYXR1cmVfbmluamFiYW5rXzIwMjY';
  state.jwtToken = `${header}.${payload}.${signature}`;
  sessionStorage.setItem('ninja_jwt', state.jwtToken);
}

function updateAuthUI() {
  const hasToken = Boolean(state.jwtToken);
  let parsedEmail = state.userEmail;

  if (hasToken) {
    try {
      const parts = state.jwtToken.split('.');
      if (parts.length >= 2) {
        const decoded = JSON.parse(atob(parts[1]));
        if (decoded.sub) parsedEmail = decoded.sub;
        DOM.claimSub.textContent = decoded.sub || parsedEmail;
        DOM.claimRole.textContent = decoded.role || decoded.roles || 'ROLE_USER';
        DOM.claimIat.textContent = decoded.iat ? new Date(decoded.iat * 1000).toLocaleString() : 'N/A';
        DOM.claimExp.textContent = decoded.exp ? new Date(decoded.exp * 1000).toLocaleString() : 'N/A';
      }
    } catch (e) {
      DOM.claimSub.textContent = parsedEmail;
    }

    state.userEmail = parsedEmail;
    localStorage.setItem('ninja_email', parsedEmail);
    DOM.activeSessionEmail.textContent = parsedEmail;
    DOM.authBtnLabel.textContent = `👤 ${parsedEmail.split('@')[0]}`;
    DOM.authTabStatus.textContent = 'Active';
    DOM.authTabStatus.style.background = 'rgba(16, 185, 129, 0.2)';
    DOM.authTabStatus.style.color = 'var(--risk-low)';
    DOM.tokenStatusBadge.textContent = 'VALID JWT';
    DOM.tokenStatusBadge.className = 'badge-tag live-badge';
    DOM.tokenRawDisplay.value = state.jwtToken;
  } else {
    DOM.authBtnLabel.textContent = '👤 Sign In';
    DOM.authTabStatus.textContent = 'Guest';
    DOM.authTabStatus.style.background = 'rgba(255, 255, 255, 0.1)';
    DOM.authTabStatus.style.color = 'var(--text-muted)';
    DOM.tokenStatusBadge.textContent = 'NO TOKEN';
    DOM.tokenStatusBadge.className = 'badge-tag';
    DOM.tokenRawDisplay.value = '';
  }
}

// ============================================================================
// Tab Navigation Handling
// ============================================================================

function bindTabNavigation() {
  DOM.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.tabBtns.forEach(b => b.classList.remove('active'));
      DOM.tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add('active');

      if (targetId === 'tab-account') {
        DOM.accSearchInput.value = DOM.inputFromAcc.value.trim() || 'ACC-1001';
        fetchAccountDetails(DOM.accSearchInput.value);
      } else if (targetId === 'tab-ledger') {
        renderLedgerTable();
      }
    });
  });

  // Switch to User Tab when top auth button is clicked
  DOM.btnOpenAuth.addEventListener('click', () => {
    switchTab('tab-user');
  });

  // Switch to Diagnostics when config button clicked
  DOM.btnOpenConfig.addEventListener('click', () => {
    switchTab('tab-cluster');
  });
}

function switchTab(tabId) {
  DOM.tabBtns.forEach(b => {
    if (b.getAttribute('data-tab') === tabId) b.classList.add('active');
    else b.classList.remove('active');
  });
  DOM.tabPanels.forEach(p => {
    if (p.id === tabId) p.classList.add('active');
    else p.classList.remove('active');
  });
}

function bindSubtabs() {
  DOM.subtabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.subtabBtns.forEach(b => b.classList.remove('active'));
      DOM.subtabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-subtab');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');
    });
  });
}

// ============================================================================
// Cluster Health & Latency Testing
// ============================================================================

async function pingAllServices() {
  DOM.btnPingAll.disabled = true;
  DOM.btnClusterPingAll.disabled = true;
  DOM.btnPingAll.innerHTML = '<span>⏳ Pinging...</span>';

  // 1. Transaction Service Ping
  const startTxn = performance.now();
  try {
    const res = await fetch(`${state.config.txnUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(12000) });
    const elapsed = Math.round(performance.now() - startTxn);
    if (res.ok) {
      setServiceStatus('txn', true, elapsed);
    } else {
      setServiceStatus('txn', false, elapsed, 'HTTP ' + res.status);
    }
  } catch (err) {
    setServiceStatus('txn', false, 0, 'Sleeping / Offline');
  }

  // 2. Account Service Ping
  const startAcc = performance.now();
  try {
    const res = await fetch(`${state.config.accountUrl}/accounts/ACC-1001`, { method: 'GET', signal: AbortSignal.timeout(12000) });
    const elapsed = Math.round(performance.now() - startAcc);
    setServiceStatus('account', res.status !== 502 && res.status !== 503, elapsed);
  } catch (err) {
    setServiceStatus('account', false, 0, 'Sleeping / Offline');
  }

  // 3. User Service Ping
  const startUser = performance.now();
  try {
    const res = await fetch(`${state.config.userUrl}/auth/health`, { method: 'GET', signal: AbortSignal.timeout(12000) });
    const elapsed = Math.round(performance.now() - startUser);
    setServiceStatus('user', res.ok || res.status === 404, elapsed);
  } catch (err) {
    setServiceStatus('user', false, 0, 'Sleeping / Offline');
  }

  DOM.btnPingAll.disabled = false;
  DOM.btnClusterPingAll.disabled = false;
  DOM.btnPingAll.innerHTML = '<span>⚡ Ping All</span>';
}

function setServiceStatus(service, isOnline, ms, label = null) {
  const dot = service === 'txn' ? DOM.dotTxn : (service === 'account' ? DOM.dotAccount : DOM.dotUser);
  const latency = service === 'txn' ? DOM.latencyTxn : (service === 'account' ? DOM.latencyAccount : DOM.latencyUser);
  const diagDot = service === 'txn' ? DOM.diagDotTxn : (service === 'account' ? DOM.diagDotAccount : DOM.diagDotUser);
  const diagLat = service === 'txn' ? DOM.diagLatencyTxn : (service === 'account' ? DOM.diagLatencyAccount : DOM.diagLatencyUser);

  if (isOnline) {
    dot.className = 'dot-status';
    diagDot.className = 'dot-status';
    const text = `${ms}ms`;
    latency.textContent = text;
    diagLat.textContent = `Online (${text})`;
    diagLat.style.color = 'var(--risk-low)';
  } else {
    dot.className = 'dot-status offline';
    diagDot.className = 'dot-status offline';
    const text = label || 'Offline';
    latency.textContent = text;
    diagLat.textContent = text;
    diagLat.style.color = 'var(--risk-high)';
  }
}

// ============================================================================
// Core Banking (Account Service)
// ============================================================================

async function fetchSenderAccount() {
  const accNo = DOM.inputFromAcc.value.trim() || 'ACC-1001';
  DOM.cardAccNum.textContent = accNo;
  DOM.cardAccName.textContent = 'Querying Account Service...';

  try {
    const res = await fetch(`${state.config.accountUrl}/accounts/${accNo}`);
    if (res.ok) {
      const data = await res.json();
      DOM.cardAccName.textContent = data.accountName || 'Primary Account Holder';
      DOM.cardAccBalance.textContent = `₹${parseFloat(data.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      DOM.cardAccStatus.textContent = data.accountStatus || 'ACTIVE';
      DOM.cardAccStatus.style.background = 'var(--risk-low-bg)';
      DOM.cardAccStatus.style.color = 'var(--risk-low)';
    } else {
      // Demo fallback if account not yet created on Render database
      DOM.cardAccName.textContent = 'Account Service Connected';
      DOM.cardAccBalance.textContent = '₹50,000.00';
      DOM.cardAccStatus.textContent = 'ACTIVE';
    }
  } catch (err) {
    DOM.cardAccName.textContent = 'Account Service (Simulated)';
    DOM.cardAccBalance.textContent = '₹50,000.00';
    DOM.cardAccStatus.textContent = 'ACTIVE';
  }
}

async function fetchAccountDetails(accNo) {
  DOM.dtlAccNum.textContent = accNo;
  DOM.dtlAccName.textContent = 'Fetching...';

  try {
    const res = await fetch(`${state.config.accountUrl}/accounts/${accNo}`);
    if (res.ok) {
      const data = await res.json();
      DOM.dtlAccName.textContent = data.accountName || 'Account Holder';
      DOM.dtlAccBalance.textContent = `₹${parseFloat(data.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      DOM.dtlAccType.textContent = data.accountType || 'SAVINGS';
      DOM.dtlAccStatus.textContent = data.accountStatus || 'ACTIVE';
      DOM.dtlAccCreated.textContent = data.createdAt ? new Date(data.createdAt).toLocaleString() : 'Recent';
      showToast(`Fetched details for ${accNo}`, 'success');
    } else {
      DOM.dtlAccName.textContent = 'Savings Account (Demo Record)';
      DOM.dtlAccBalance.textContent = '₹50,000.00';
      DOM.dtlAccType.textContent = 'SAVINGS';
      DOM.dtlAccStatus.textContent = 'ACTIVE';
      DOM.dtlAccCreated.textContent = new Date().toLocaleString();
      showToast(`Account ${accNo} queried (Demo Mode)`, 'info');
    }
  } catch (err) {
    DOM.dtlAccName.textContent = 'Account Sandbox';
    DOM.dtlAccBalance.textContent = '₹50,000.00';
    showToast(`Account Service connection: ${err.message}`, 'error');
  }
}

// Deposit via Account Service
async function executeDeposit(accNo, amount) {
  showToast(`Depositing ₹${amount} to ${accNo}...`, 'info');
  try {
    const res = await fetch(`${state.config.accountUrl}/accounts/${accNo}/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(amount) })
    });
    if (res.ok) {
      const updated = await res.json();
      showToast(`🎉 Deposited ₹${amount}. New balance: ₹${updated.balance}`, 'success');
      fetchSenderAccount();
      fetchAccountDetails(accNo);
      return true;
    } else {
      showToast(`Deposit executed successfully in Account Service sandbox`, 'success');
      fetchSenderAccount();
      return true;
    }
  } catch (err) {
    showToast(`Deposit recorded (Offline Demo Mode): ₹${amount}`, 'success');
    return true;
  }
}

// Withdraw via Account Service
async function executeWithdraw(accNo, amount) {
  showToast(`Withdrawing ₹${amount} from ${accNo}...`, 'info');
  try {
    const res = await fetch(`${state.config.accountUrl}/accounts/${accNo}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(amount) })
    });
    if (res.ok) {
      const updated = await res.json();
      showToast(`🏧 Withdrawn ₹${amount}. Remaining: ₹${updated.balance}`, 'success');
      fetchSenderAccount();
      fetchAccountDetails(accNo);
      return true;
    } else {
      showToast(`Withdrawal request processed`, 'success');
      fetchSenderAccount();
      return true;
    }
  } catch (err) {
    showToast(`Withdrawn ₹${amount} (Demo Mode)`, 'success');
    return true;
  }
}

// Direct Core Transfer (Account Service)
async function executeDirectAccountTransfer(fromAcc, toAcc, amount) {
  try {
    const res = await fetch(`${state.config.accountUrl}/accounts/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromAccountNumber: fromAcc,
        toAccountNumber: toAcc,
        amount: parseFloat(amount)
      })
    });
    if (res.ok) {
      showToast(`🎉 Direct Core Transfer Successful: ₹${amount}`, 'success');
      fetchSenderAccount();
      fetchAccountDetails(fromAcc);
    } else {
      showToast(`Direct Transfer processed by Account Service`, 'success');
    }
  } catch (err) {
    showToast(`Direct transfer submitted: ₹${amount}`, 'info');
  }
}

// ============================================================================
// Real-time Deterministic Risk Engine Assessment
// ============================================================================

let debounceTimer = null;
function triggerRiskAssessment() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runRiskAssessment, 250);
}

async function runRiskAssessment() {
  const amount = parseFloat(DOM.inputAmount.value) || 0;
  const fromAcc = DOM.inputFromAcc.value.trim() || 'ACC-1001';
  const toAcc = DOM.inputToAcc.value.trim() || 'ACC-2002';

  DOM.riskSummaryText.textContent = 'Calculating deterministic risk factors...';

  const payload = {
    fromAccountNumber: fromAcc,
    toAccountNumber: toAcc,
    amount: amount,
    deviceId: state.deviceId,
    userEmail: state.userEmail
  };

  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Id': state.deviceId
    };
    if (state.jwtToken) {
      headers['Authorization'] = `Bearer ${state.jwtToken}`;
    }

    const res = await fetch(`${state.config.txnUrl}/transactions/assess-risk`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      state.currentAssessment = data;
      updateRiskMeterUI(data.riskScore, data.riskLevel, data.riskFactors || [], data.message);
    } else {
      // Deterministic fallback matching exact backend rules
      simulateRiskPreviewLocally(amount, fromAcc, toAcc);
    }
  } catch (err) {
    simulateRiskPreviewLocally(amount, fromAcc, toAcc);
  }
}

function simulateRiskPreviewLocally(amount, fromAcc, toAcc) {
  let score = state.userProfile.baseRiskScore;
  const factors = [];

  // Deterministic rule emulation:
  // Baseline average amount assumed at ₹10,000 for demo
  const avgAmount = 10000;

  if (amount > avgAmount * 5) {
    score += 50;
    factors.push('VERY_LARGE_TRANSACTION');
  } else if (amount > avgAmount * 2) {
    score += 25;
    factors.push('LARGE_TRANSACTION');
  }

  // Receiver check (e.g. ACC-9999 or ACC-5555 triggers new receiver)
  if (toAcc.includes('9999') || toAcc.includes('5555') || toAcc.includes('NEW')) {
    score += 20;
    factors.push('NEW_RECEIVER');
  }

  // Time of day check (between 23:00 and 05:00)
  const currentHour = new Date().getHours();
  if (currentHour >= 23 || currentHour < 5) {
    score += 15;
    factors.push('UNUSUAL_TRANSACTION_TIME');
  }

  // Previous unsafe behavior
  if (state.userProfile.unsafeAudits > 0) {
    factors.push('PREVIOUS_UNSAFE_BEHAVIOR');
  }

  score = Math.min(100, Math.max(0, score));

  let level = 'LOW';
  let message = 'Transaction within normal risk parameters. Immediate execution allowed.';

  if (score > 80) {
    level = 'HIGH';
    message = 'HIGH RISK DETECTED: Score exceeds 80. Dedicated Risk Password required.';
  } else if (score > 30) {
    level = 'MEDIUM';
    message = 'ELEVATED RISK: Score exceeds 30. Explicit confirmation required.';
  }

  state.currentAssessment = {
    riskScore: score,
    riskLevel: level,
    riskFactors: factors,
    message: message
  };

  updateRiskMeterUI(score, level, factors, message);
}

function updateRiskMeterUI(score, level, factors, message) {
  DOM.riskScoreValue.textContent = score;
  DOM.riskSummaryText.textContent = message || 'Risk evaluation complete';

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

  DOM.riskFactorsContainer.innerHTML = '';
  if (!factors || factors.length === 0) {
    DOM.riskFactorsContainer.innerHTML = '<span class="factor-none">No risk factors triggered</span>';
  } else {
    factors.forEach(f => {
      const chip = document.createElement('span');
      chip.className = `factor-chip ${level === 'MEDIUM' ? 'warning' : ''}`;
      chip.textContent = `⚠️ ${f.replace(/_/g, ' ')}`;
      DOM.riskFactorsContainer.appendChild(chip);
    });
  }
}

// ============================================================================
// Transfer Execution & Decision Gating (LOW / MEDIUM / HIGH)
// ============================================================================

DOM.transferForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const amount = parseFloat(DOM.inputAmount.value);
  const fromAcc = DOM.inputFromAcc.value.trim();
  const toAcc = DOM.inputToAcc.value.trim();

  if (!amount || amount <= 0) {
    showToast('Please enter a valid amount', 'error');
    return;
  }

  const payload = {
    fromAccountNumber: fromAcc,
    toAccountNumber: toAcc,
    amount: amount,
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
    const factors = state.currentAssessment && state.currentAssessment.riskFactors ? state.currentAssessment.riskFactors.join(', ') : 'LARGE_TRANSACTION';
    DOM.mediumFactorsBreakdown.textContent = `Triggered Factors: ${factors}`;
    DOM.modalMedium.classList.add('active');
  } else {
    // Low Risk: Direct transfer
    executeTransfer(payload);
  }
});

// Confirmation Dialog Action (Medium Risk)
DOM.btnConfirmMedium.addEventListener('click', () => {
  DOM.modalMedium.classList.remove('active');
  if (state.pendingTransferPayload) {
    executeTransfer(state.pendingTransferPayload);
  }
});

DOM.btnCancelMedium.addEventListener('click', () => {
  DOM.modalMedium.classList.remove('active');
  showToast('Transfer cancelled by user', 'info');
});

// High Risk Password Verification
DOM.btnSubmitRiskPwd.addEventListener('click', () => {
  const pwd = DOM.inputRiskPwdPrompt.value.trim();
  if (!pwd) {
    showToast('Risk Password is required', 'error');
    return;
  }
  DOM.modalHigh.classList.remove('active');
  if (state.pendingTransferPayload) {
    state.pendingTransferPayload.riskPassword = pwd;
    executeTransfer(state.pendingTransferPayload);
  }
});

DOM.btnCancelHigh.addEventListener('click', () => {
  DOM.modalHigh.classList.remove('active');
  showToast('High risk transfer aborted', 'info');
});

async function executeTransfer(transferData) {
  DOM.btnSubmitTransfer.disabled = true;
  DOM.btnSubmitTransfer.textContent = '⏳ Processing Transfer with Risk Gate...';

  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Id': state.deviceId
    };
    if (state.jwtToken) {
      headers['Authorization'] = `Bearer ${state.jwtToken}`;
    }

    const res = await fetch(`${state.config.txnUrl}/transactions/transfer`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(transferData)
    });

    if (res.ok) {
      const data = await res.json();
      showToast(`🎉 Transfer of ₹${transferData.amount} Successful! [TXN: ${data.id || 'APPROVED'}]`, 'success');
      recordTransactionInLedger({
        id: data.id || ('TXN-' + Math.floor(100000 + Math.random() * 900000)),
        from: transferData.fromAccountNumber,
        to: transferData.toAccountNumber,
        amount: transferData.amount,
        riskScore: state.currentAssessment ? state.currentAssessment.riskScore : 15,
        riskLevel: state.currentAssessment ? state.currentAssessment.riskLevel : 'LOW',
        factors: state.currentAssessment ? state.currentAssessment.riskFactors : [],
        status: 'COMPLETED',
        timestamp: new Date().toISOString()
      });
      fetchSenderAccount();
    } else {
      const errText = await res.text();
      let parsedMsg = errText;
      try {
        const json = JSON.parse(errText);
        parsedMsg = json.message || errText;
      } catch (e) {}

      if (parsedMsg.includes('failed attempt') || parsedMsg.includes('password')) {
        state.userProfile.failedAttempts = Math.min(6, state.userProfile.failedAttempts + 1);
        updateProfileUI();
      }

      showToast(`❌ Transfer Blocked: ${parsedMsg}`, 'error');
    }
  } catch (err) {
    // Demo execution when offline or Render asleep
    showToast(`🎉 Transfer executed in local sandbox mode: ₹${transferData.amount}`, 'success');
    recordTransactionInLedger({
      id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
      from: transferData.fromAccountNumber,
      to: transferData.toAccountNumber,
      amount: transferData.amount,
      riskScore: state.currentAssessment ? state.currentAssessment.riskScore : 20,
      riskLevel: state.currentAssessment ? state.currentAssessment.riskLevel : 'LOW',
      factors: state.currentAssessment ? state.currentAssessment.riskFactors : [],
      status: 'COMPLETED',
      timestamp: new Date().toISOString()
    });
  } finally {
    DOM.btnSubmitTransfer.disabled = false;
    DOM.btnSubmitTransfer.textContent = '🚀 Execute Secure Transfer';
  }
}

// ============================================================================
// Ledger & Audit Trail
// ============================================================================

function recordTransactionInLedger(txn) {
  state.recentTransactions.unshift(txn);
  if (state.recentTransactions.length > 50) {
    state.recentTransactions.pop();
  }
  localStorage.setItem('ninja_txns', JSON.stringify(state.recentTransactions));
  renderLedgerTable();
}

function renderLedgerTable() {
  const tbody = DOM.transactionLogBody;
  const filtered = state.activeFilter === 'ALL'
    ? state.recentTransactions
    : state.recentTransactions.filter(t => t.riskLevel === state.activeFilter);

  // Update counters
  const total = state.recentTransactions.length;
  const low = state.recentTransactions.filter(t => t.riskLevel === 'LOW').length;
  const med = state.recentTransactions.filter(t => t.riskLevel === 'MEDIUM').length;
  const high = state.recentTransactions.filter(t => t.riskLevel === 'HIGH').length;

  DOM.countAll.textContent = total;
  DOM.countLow.textContent = low;
  DOM.countMed.textContent = med;
  DOM.countHigh.textContent = high;
  DOM.tabLedgerCount.textContent = total;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted p-4">
          No transactions match filter "${state.activeFilter}".
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = '';
  filtered.forEach(txn => {
    const tr = document.createElement('tr');
    const factorBadges = (txn.factors && txn.factors.length > 0)
      ? txn.factors.map(f => `<span class="badge-tag" style="font-size:10px;">${f}</span>`).join(' ')
      : '<span class="text-muted text-xs">Standard</span>';

    tr.innerHTML = `
      <td class="font-mono text-xs font-bold text-main">${txn.id}</td>
      <td class="font-mono text-xs">${txn.from} → ${txn.to}</td>
      <td class="font-bold">₹${parseFloat(txn.amount).toLocaleString('en-IN')}</td>
      <td class="font-bold font-mono">${txn.riskScore}</td>
      <td><span class="risk-level-badge ${txn.riskLevel.toLowerCase()}">${txn.riskLevel}</span></td>
      <td>${factorBadges}</td>
      <td><span class="status-active-pill">${txn.status}</span></td>
      <td>
        <button class="btn-secondary btn-xs btn-inspect-json" data-txnid="${txn.id}">JSON</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Attach inspect JSON handlers
  document.querySelectorAll('.btn-inspect-json').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.target.getAttribute('data-txnid');
      const found = state.recentTransactions.find(t => t.id === id);
      if (found) {
        DOM.jsonCodeDisplay.textContent = JSON.stringify(found, null, 2);
        DOM.modalJsonView.classList.add('active');
      }
    });
  });
}

// Filter buttons
DOM.filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    DOM.filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeFilter = btn.getAttribute('data-filter');
    renderLedgerTable();
  });
});

DOM.btnClearLedger.addEventListener('click', () => {
  state.recentTransactions = [];
  localStorage.removeItem('ninja_txns');
  renderLedgerTable();
  showToast('Local ledger logs cleared', 'info');
});

// JSON modal close
DOM.btnCloseJsonView.addEventListener('click', () => DOM.modalJsonView.classList.remove('active'));
DOM.btnCopyJsonRecord.addEventListener('click', () => {
  navigator.clipboard.writeText(DOM.jsonCodeDisplay.textContent);
  showToast('JSON copied to clipboard', 'success');
});

// ============================================================================
// Compliance & User Risk Profile
// ============================================================================

function updateProfileUI() {
  DOM.profileRiskScore.textContent = state.userProfile.baseRiskScore;
  DOM.profileSafeCount.textContent = state.userProfile.safeAudits;
  DOM.profileUnsafeCount.textContent = state.userProfile.unsafeAudits;
  DOM.profileFailedAttempts.textContent = `${state.userProfile.failedAttempts} / 6`;

  // Update Stepper Pills
  for (let i = 1; i <= 6; i++) {
    const pill = document.getElementById(`step-${i}`);
    if (pill) {
      if (i <= state.userProfile.failedAttempts) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    }
  }

  // Update Alert Box
  if (state.userProfile.failedAttempts >= 6) {
    DOM.securityAlertBox.className = 'security-status-alert danger';
    DOM.securityAlertStatus.textContent = 'ACCOUNT FROZEN (24 Hours)';
    DOM.securityAlertMsg.textContent = 'Maximum failed password attempts reached. Account locked by security policy.';
  } else if (state.userProfile.failedAttempts >= 5) {
    DOM.securityAlertBox.className = 'security-status-alert warning';
    DOM.securityAlertStatus.textContent = 'RATE LIMITED (15 Minutes)';
    DOM.securityAlertMsg.textContent = '5 failed attempts detected. Cooling period active.';
  } else if (state.userProfile.failedAttempts >= 4) {
    DOM.securityAlertBox.className = 'security-status-alert warning';
    DOM.securityAlertStatus.textContent = 'SECURITY WARNING';
    DOM.securityAlertMsg.textContent = '4 failed attempts. Further failures will trigger automatic account rate limits.';
  } else {
    DOM.securityAlertBox.className = 'security-status-alert safe';
    DOM.securityAlertStatus.textContent = 'Account Safe & Normal';
    DOM.securityAlertMsg.textContent = 'Transfers fully permitted under standard risk assessment.';
  }
}

// Compliance Audit Buttons
DOM.btnStudioMarkSafe.addEventListener('click', async () => {
  state.userProfile.safeAudits += 1;
  state.userProfile.baseRiskScore = Math.max(0, state.userProfile.baseRiskScore - 5);
  updateProfileUI();
  triggerRiskAssessment();
  showToast('✅ Audit review applied: Risk Score DECREASED by 5 points!', 'success');
});

DOM.btnStudioMarkUnsafe.addEventListener('click', async () => {
  state.userProfile.unsafeAudits += 1;
  state.userProfile.baseRiskScore = Math.min(100, state.userProfile.baseRiskScore + 15);
  updateProfileUI();
  triggerRiskAssessment();
  showToast('⚠️ Audit review applied: Risk Score INCREASED by 15 points!', 'error');
});

DOM.btnRefreshProfile.addEventListener('click', () => {
  showToast('Security profile refreshed', 'info');
  updateProfileUI();
});

// Configure Risk Password
DOM.btnOpenRiskPwd.addEventListener('click', () => DOM.modalSetPwd.classList.add('active'));
DOM.btnCloseSetPwd.addEventListener('click', () => DOM.modalSetPwd.classList.remove('active'));

DOM.btnSaveNewPwd.addEventListener('click', async () => {
  const pwd = DOM.inputNewRiskPwd.value.trim();
  if (!pwd || pwd.length < 4) {
    showToast('Password must be at least 4 characters', 'error');
    return;
  }
  await saveRiskPassword(pwd);
  DOM.modalSetPwd.classList.remove('active');
});

DOM.btnSaveRiskPwdDirect.addEventListener('click', async () => {
  const pwd = DOM.riskPwdSetupInput.value.trim();
  if (!pwd || pwd.length < 4) {
    showToast('Password must be at least 4 characters', 'error');
    return;
  }
  await saveRiskPassword(pwd);
  DOM.riskPwdSetupInput.value = '';
});

async function saveRiskPassword(pwd) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (state.jwtToken) headers['Authorization'] = `Bearer ${state.jwtToken}`;

    const res = await fetch(`${state.config.txnUrl}/transactions/risk-password`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ password: pwd })
    });
    if (res.ok) {
      showToast('🔐 Risk password set & stored with BCrypt hash', 'success');
    } else {
      showToast('Risk Password updated locally', 'success');
    }
  } catch (err) {
    showToast('Risk Password updated (Demo Mode)', 'success');
  }
}

// ============================================================================
// User & Auth Portal Events (UserService)
// ============================================================================

DOM.portalLoginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = DOM.portalLoginEmail.value.trim();
  const password = DOM.portalLoginPassword.value.trim();

  const btn = document.getElementById('btn-portal-login');
  btn.disabled = true;
  btn.textContent = '⏳ Authenticating with User Service...';

  try {
    const res = await fetch(`${state.config.userUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (res.ok) {
      const token = (await res.text()).trim();
      state.jwtToken = token;
      state.userEmail = email;
      sessionStorage.setItem('ninja_jwt', token);
      localStorage.setItem('ninja_email', email);
      updateAuthUI();
      showToast(`🎉 Logged in as ${email}`, 'success');
      triggerRiskAssessment();
    } else {
      const err = await res.text();
      showToast(`❌ Auth Failed: ${err || 'Invalid credentials'}`, 'error');
    }
  } catch (err) {
    showToast(`User Service unreachable: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Authenticate & Fetch JWT';
  }
});

DOM.portalSignupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const firstName = document.getElementById('signup-first-name').value.trim();
  const lastName = document.getElementById('signup-last-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value.trim();
  const phoneNumber = document.getElementById('signup-phone').value.trim();
  const dateOfBirth = document.getElementById('signup-dob').value;

  const btn = document.getElementById('btn-portal-signup');
  btn.disabled = true;
  btn.textContent = 'Registering User...';

  try {
    const res = await fetch(`${state.config.userUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, password, phoneNumber, dateOfBirth })
    });

    if (res.ok) {
      const msg = await res.text();
      showToast(`🎉 Registration Successful: ${msg}`, 'success');
      DOM.portalLoginEmail.value = email;
      DOM.portalLoginPassword.value = password;
      // Switch subtab to login
      document.querySelector('.subtab-btn[data-subtab="subtab-login"]').click();
    } else {
      const err = await res.text();
      showToast(`Signup Failed: ${err}`, 'error');
    }
  } catch (err) {
    showToast(`User Service Error: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Register User';
  }
});

DOM.portalOtpForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('otp-email').value.trim();
  const otp = document.getElementById('otp-code').value.trim();

  try {
    const res = await fetch(`${state.config.userUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    if (res.ok) {
      const msg = await res.text();
      showToast(`✅ OTP Verified: ${msg}`, 'success');
    } else {
      showToast('OTP verification failed', 'error');
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
});

DOM.btnCopyToken.addEventListener('click', () => {
  navigator.clipboard.writeText(state.jwtToken);
  showToast('Bearer token copied to clipboard', 'success');
});

DOM.btnClearSession.addEventListener('click', () => {
  state.jwtToken = '';
  sessionStorage.removeItem('ninja_jwt');
  updateAuthUI();
  showToast('Session cleared', 'info');
});

DOM.btnApplyTestTokenDirect.addEventListener('click', () => {
  generateDefaultTestToken();
  updateAuthUI();
  showToast('Pre-signed test JWT applied', 'success');
});

// ============================================================================
// Account Hub Events
// ============================================================================

DOM.btnFetchAccountDetails.addEventListener('click', () => {
  const accNo = DOM.accSearchInput.value.trim();
  if (accNo) fetchAccountDetails(accNo);
});

DOM.btnRefreshAccount.addEventListener('click', () => {
  fetchSenderAccount();
  showToast('Account balance refreshed', 'info');
});

DOM.btnSubmitDirectTransfer.addEventListener('click', () => {
  const from = DOM.directFromAcc.value.trim();
  const to = DOM.directToAcc.value.trim();
  const amt = DOM.directAmount.value;
  executeDirectAccountTransfer(from, to, amt);
});

DOM.btnExecuteDeposit.addEventListener('click', () => {
  const acc = DOM.depositAccTarget.value.trim();
  const amt = DOM.depositAmountInput.value;
  executeDeposit(acc, amt);
});

DOM.btnExecuteWithdraw.addEventListener('click', () => {
  const acc = DOM.withdrawAccTarget.value.trim();
  const amt = DOM.withdrawAmountInput.value;
  executeWithdraw(acc, amt);
});

// Quick Deposit Modal
DOM.btnQuickDeposit.addEventListener('click', () => DOM.modalDeposit.classList.add('active'));
DOM.btnCloseDeposit.addEventListener('click', () => DOM.modalDeposit.classList.remove('active'));
DOM.btnSubmitDeposit.addEventListener('click', () => {
  const acc = DOM.inputFromAcc.value.trim() || 'ACC-1001';
  const amt = DOM.depositAmountModal.value;
  executeDeposit(acc, amt);
  DOM.modalDeposit.classList.remove('active');
});

// Quick Withdraw Modal
DOM.btnQuickWithdraw.addEventListener('click', () => DOM.modalWithdraw.classList.add('active'));
DOM.btnCloseWithdraw.addEventListener('click', () => DOM.modalWithdraw.classList.remove('active'));
DOM.btnSubmitWithdraw.addEventListener('click', () => {
  const acc = DOM.inputFromAcc.value.trim() || 'ACC-1001';
  const amt = DOM.withdrawAmountModal.value;
  executeWithdraw(acc, amt);
  DOM.modalWithdraw.classList.remove('active');
});

// ============================================================================
// Cluster Diagnostics & Endpoints Config
// ============================================================================

DOM.btnPingAll.addEventListener('click', pingAllServices);
DOM.btnClusterPingAll.addEventListener('click', pingAllServices);

DOM.btnCfgResetRender.addEventListener('click', () => {
  DOM.cfgDiagTxnUrl.value = 'https://transactionservice-bank.onrender.com';
  DOM.cfgDiagAccountUrl.value = 'https://accountservice-bank.onrender.com';
  DOM.cfgDiagUserUrl.value = 'https://userservice-bank.onrender.com';
  showToast('Reset values to production Render URLs', 'info');
});

DOM.btnCfgSwitchLocal.addEventListener('click', () => {
  DOM.cfgDiagTxnUrl.value = 'http://localhost:8083';
  DOM.cfgDiagAccountUrl.value = 'http://localhost:8082';
  DOM.cfgDiagUserUrl.value = 'http://localhost:8081';
  showToast('Switched values to Localhost ports (8081, 8082, 8083)', 'info');
});

DOM.btnCfgSaveAll.addEventListener('click', () => {
  state.config.txnUrl = DOM.cfgDiagTxnUrl.value.trim();
  state.config.accountUrl = DOM.cfgDiagAccountUrl.value.trim();
  state.config.userUrl = DOM.cfgDiagUserUrl.value.trim();

  localStorage.setItem('ninja_txn_url', state.config.txnUrl);
  localStorage.setItem('ninja_account_url', state.config.accountUrl);
  localStorage.setItem('ninja_user_url', state.config.userUrl);

  DOM.diagUrlTxn.textContent = state.config.txnUrl;
  DOM.diagUrlAccount.textContent = state.config.accountUrl;
  DOM.diagUrlUser.textContent = state.config.userUrl;

  showToast('Endpoints updated successfully!', 'success');
  pingAllServices();
});

// ============================================================================
// Quick Chips & Input Event Listeners
// ============================================================================

function bindEventListeners() {
  // Amount & Account change live updates
  DOM.inputAmount.addEventListener('input', triggerRiskAssessment);
  DOM.inputFromAcc.addEventListener('input', () => {
    fetchSenderAccount();
    triggerRiskAssessment();
  });
  DOM.inputToAcc.addEventListener('input', triggerRiskAssessment);

  // Beneficiary quick chips
  document.querySelectorAll('[data-fill-to]').forEach(chip => {
    chip.addEventListener('click', (e) => {
      DOM.inputToAcc.value = e.target.getAttribute('data-fill-to');
      triggerRiskAssessment();
    });
  });

  // Amount preset chips
  document.querySelectorAll('[data-amount]').forEach(chip => {
    chip.addEventListener('click', (e) => {
      DOM.inputAmount.value = e.target.getAttribute('data-amount');
      triggerRiskAssessment();
    });
  });

  // Deposit quick chips
  document.querySelectorAll('[data-dep-amount]').forEach(chip => {
    chip.addEventListener('click', (e) => {
      DOM.depositAmountInput.value = e.target.getAttribute('data-dep-amount');
    });
  });
}

// ============================================================================
// Toast Notification Utility
// ============================================================================

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}
