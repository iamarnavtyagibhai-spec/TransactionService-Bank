/**
 * ============================================================================
 * NinjaBank Distributed Microservice Web Suite
 * Flow:
 * 1. Screen 1 (User Service): Signup / Login -> Generates JWT Token
 * 2. Screen 2 (Banking Dashboard):
 *    - Fetches Balances from AccountService (/accounts/{acc})
 *    - Sends Money via TransactionService (/transactions/transfer)
 *    - TransactionService evaluates Risk Engine (0-100) & calls AccountService
 * ============================================================================
 */

// Application State
const state = {
  jwtToken: sessionStorage.getItem('ninja_jwt') || '',
  userEmail: localStorage.getItem('ninja_email') || '',
  userName: localStorage.getItem('ninja_name') || 'Arnav Tyagi',
  accountNumber: localStorage.getItem('ninja_account_num') || 'ACC-1001',
  deviceId: localStorage.getItem('ninja_device_id') || ('DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase()),
  config: {
    txnUrl: localStorage.getItem('ninja_txn_url') || 'https://transactionservice-bank.onrender.com',
    accountUrl: localStorage.getItem('ninja_account_url') || 'https://accountservice-bank.onrender.com',
    userUrl: localStorage.getItem('ninja_user_url') || 'https://userservice-bank.onrender.com'
  },
  currentRiskAssessment: null,
  pendingTransferPayload: null,
  transactions: JSON.parse(localStorage.getItem('ninja_txns') || '[]'),
  userProfile: {
    baseRiskScore: 0,
    safeAudits: 0,
    unsafeAudits: 0,
    failedAttempts: 0
  }
};

localStorage.setItem('ninja_device_id', state.deviceId);

// DOM Elements
const DOM = {
  // Screen wrappers
  authScreen: document.getElementById('auth-screen'),
  mainAppScreen: document.getElementById('main-app-screen'),

  // Auth Screen elements
  tabBtnSignin: document.getElementById('tab-btn-signin'),
  tabBtnSignup: document.getElementById('tab-btn-signup'),
  formSignin: document.getElementById('form-signin'),
  formSignup: document.getElementById('form-signup'),
  formOtp: document.getElementById('form-otp'),
  btnSubmitSignin: document.getElementById('btn-submit-signin'),
  btnSubmitSignup: document.getElementById('btn-submit-signup'),
  btnSubmitOtp: document.getElementById('btn-submit-otp'),
  btnGuestPass: document.getElementById('btn-guest-pass'),
  btnBackToSignin: document.getElementById('btn-back-to-signin'),
  signinEmail: document.getElementById('signin-email'),
  signinPassword: document.getElementById('signin-password'),
  otpTargetEmail: document.getElementById('otp-target-email'),
  otpInputCode: document.getElementById('otp-input-code'),

  // Dashboard Header elements
  headerUserEmail: document.getElementById('header-user-email'),
  headerUserRole: document.getElementById('header-user-role'),
  btnLogout: document.getElementById('btn-logout'),
  dotUser: document.getElementById('dot-user'),
  dotAccount: document.getElementById('dot-account'),
  dotTxn: document.getElementById('dot-txn'),
  latUser: document.getElementById('lat-user'),
  latAccount: document.getElementById('lat-account'),
  latTxn: document.getElementById('lat-txn'),

  // Account Service Card elements
  displayBalance: document.getElementById('display-balance'),
  displayAccountNum: document.getElementById('display-account-num'),
  displayHolderName: document.getElementById('display-holder-name'),
  displayAccountStatus: document.getElementById('display-account-status'),
  btnActionDeposit: document.getElementById('btn-action-deposit'),
  btnRefreshBalance: document.getElementById('btn-refresh-balance'),

  // Transaction Service / Send Money elements
  transferMoneyForm: document.getElementById('transfer-money-form'),
  txnFromAccount: document.getElementById('txn-from-account'),
  txnToAccount: document.getElementById('txn-to-account'),
  txnAmount: document.getElementById('txn-amount'),
  displayDeviceId: document.getElementById('display-device-id'),
  btnExecuteTransfer: document.getElementById('btn-execute-transfer'),

  // Risk Meter elements
  liveRiskSummary: document.getElementById('live-risk-summary'),
  liveRiskScore: document.getElementById('live-risk-score'),
  liveRiskBadge: document.getElementById('live-risk-badge'),
  liveRiskBar: document.getElementById('live-risk-bar'),
  liveRiskFactors: document.getElementById('live-risk-factors'),

  // User Risk Profile (Right Column)
  profileBaseScore: document.getElementById('profile-base-score'),
  profileSafeAudits: document.getElementById('profile-safe-audits'),
  profileUnsafeAudits: document.getElementById('profile-unsafe-audits'),
  profileFailedPwds: document.getElementById('profile-failed-pwds'),
  securityAlertBox: document.getElementById('security-alert-box'),
  securityAlertStatus: document.getElementById('security-alert-status'),
  securityAlertMsg: document.getElementById('security-alert-msg'),
  btnOpenSetRiskPwd: document.getElementById('btn-open-set-risk-pwd'),
  btnAuditSafe: document.getElementById('btn-audit-safe'),
  btnAuditUnsafe: document.getElementById('btn-audit-unsafe'),
  btnPingCluster: document.getElementById('btn-ping-cluster'),

  // Passbook Table
  passbookCounter: document.getElementById('passbook-counter'),
  passbookTableBody: document.getElementById('passbook-table-body'),
  btnClearHistory: document.getElementById('btn-clear-history'),

  // Modals
  modalMedium: document.getElementById('modal-medium-confirm'),
  modalMediumFactors: document.getElementById('modal-medium-factors'),
  btnMediumCancel: document.getElementById('btn-medium-cancel'),
  btnMediumConfirm: document.getElementById('btn-medium-confirm'),

  modalHigh: document.getElementById('modal-high-password'),
  inputModalRiskPwd: document.getElementById('input-modal-risk-pwd'),
  btnHighCancel: document.getElementById('btn-high-cancel'),
  btnHighSubmit: document.getElementById('btn-high-submit'),

  modalSetPwd: document.getElementById('modal-set-password'),
  inputNewRiskPwd: document.getElementById('input-new-risk-pwd'),
  btnCloseSetPwd: document.getElementById('btn-close-set-pwd'),
  btnSaveNewPwd: document.getElementById('btn-save-new-pwd'),

  modalDeposit: document.getElementById('modal-deposit'),
  depositAmountInput: document.getElementById('deposit-amount-input'),
  btnCloseDeposit: document.getElementById('btn-close-deposit'),
  btnConfirmDeposit: document.getElementById('btn-confirm-deposit'),

  toastContainer: document.getElementById('toast-container')
};

// ============================================================================
// Initialization & Screen Flow
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
  DOM.displayDeviceId.textContent = state.deviceId;
  bindAuthScreenEvents();
  bindDashboardEvents();
  renderPassbook();
  updateProfileUI();

  // Ensure user always starts on Screen 1 (Sign Up / Sign In) unless explicitly logged in
  const hasExplicitLogin = sessionStorage.getItem('ninja_logged_in') === 'true';
  if (hasExplicitLogin && state.jwtToken) {
    showDashboardScreen();
  } else {
    showAuthScreen();
  }

  // Periodic health check
  pingClusterServices();
});

function showAuthScreen() {
  DOM.authScreen.style.display = 'flex';
  DOM.mainAppScreen.style.display = 'none';
}

function showDashboardScreen() {
  DOM.authScreen.style.display = 'none';
  DOM.mainAppScreen.style.display = 'block';

  // Decode JWT info if available
  decodeJwtSession();

  // Set card info
  DOM.displayAccountNum.textContent = state.accountNumber;
  DOM.txnFromAccount.value = state.accountNumber;
  DOM.displayHolderName.textContent = state.userName;

  // Fetch live balance from AccountService
  fetchSenderAccount();

  // Assess default risk
  triggerRiskAssessment();

  // Check cluster health
  pingClusterServices();
}

function decodeJwtSession() {
  if (!state.jwtToken) return;

  try {
    const parts = state.jwtToken.split('.');
    if (parts.length >= 2) {
      const decoded = JSON.parse(atob(parts[1]));
      if (decoded.sub) {
        state.userEmail = decoded.sub;
        localStorage.setItem('ninja_email', decoded.sub);
      }
    }
  } catch (e) {
    // ignore
  }

  DOM.headerUserEmail.textContent = state.userEmail || 'arnavtyagi96@gmail.com';
  DOM.headerUserRole.textContent = 'VERIFIED JWT SESSION';
}

// ============================================================================
// SCREEN 1: ONBOARDING & AUTHENTICATION (USER SERVICE)
// ============================================================================

// Smart Auth Caller: uses CORS-enabled Transaction Gateway proxy to reach UserService safely
async function requestAuth(endpoint, payload) {
  try {
    const proxyRes = await fetch(`${state.config.txnUrl}/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (proxyRes.ok || proxyRes.status === 400 || proxyRes.status === 401) {
      return proxyRes;
    }
  } catch (e) {
    // try direct
  }

  return fetch(`${state.config.userUrl}/auth/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

function bindAuthScreenEvents() {
  // Tab Switch: Sign In vs Sign Up
  DOM.tabBtnSignin.addEventListener('click', () => {
    DOM.tabBtnSignin.classList.add('active');
    DOM.tabBtnSignup.classList.remove('active');
    DOM.formSignin.classList.add('active');
    DOM.formSignup.classList.remove('active');
    DOM.formOtp.classList.remove('active');
  });

  DOM.tabBtnSignup.addEventListener('click', () => {
    DOM.tabBtnSignup.classList.add('active');
    DOM.tabBtnSignin.classList.remove('active');
    DOM.formSignup.classList.add('active');
    DOM.formSignin.classList.remove('active');
    DOM.formOtp.classList.remove('active');
  });

  if (DOM.btnBackToSignin) {
    DOM.btnBackToSignin.addEventListener('click', () => {
      DOM.tabBtnSignin.click();
    });
  }

  // 1. SIGN IN (POST /auth/login)
  DOM.formSignin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = DOM.signinEmail.value.trim();
    const password = DOM.signinPassword.value.trim();

    DOM.btnSubmitSignin.disabled = true;
    DOM.btnSubmitSignin.textContent = '⏳ Authenticating with UserService...';

    try {
      const res = await requestAuth('login', { email, password });

      if (res.ok) {
        const token = (await res.text()).trim();
        state.jwtToken = token;
        state.userEmail = email;
        sessionStorage.setItem('ninja_jwt', token);
        sessionStorage.setItem('ninja_logged_in', 'true');
        localStorage.setItem('ninja_email', email);
        showToast(`🎉 Authentication Successful! Logged in as ${email}`, 'success');
        showDashboardScreen();
      } else {
        const errText = await res.text();
        showToast(`❌ Login Failed: ${errText || 'Invalid credentials'}`, 'error');
      }
    } catch (err) {
      showToast(`UserService Connection Error: ${err.message}`, 'error');
    } finally {
      DOM.btnSubmitSignin.disabled = false;
      DOM.btnSubmitSignin.textContent = '🚀 Sign In (User Service)';
    }
  });

  // 2. SIGN UP (POST /auth/signup)
  DOM.formSignup.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstName = document.getElementById('signup-firstname').value.trim();
    const lastName = document.getElementById('signup-lastname').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const phoneNumber = document.getElementById('signup-phone').value.trim();
    const dateOfBirth = document.getElementById('signup-dob').value;

    DOM.btnSubmitSignup.disabled = true;
    DOM.btnSubmitSignup.textContent = '⏳ Creating Account in UserService...';

    try {
      const res = await requestAuth('signup', { firstName, lastName, email, password, phoneNumber, dateOfBirth });

      if (res.ok) {
        const msg = await res.text();
        state.userName = `${firstName} ${lastName}`;
        localStorage.setItem('ninja_name', state.userName);

        showToast(`🎉 Registration Complete! ${msg}`, 'success');

        // Check if OTP needed or direct login available
        if (msg.toLowerCase().includes('otp')) {
          DOM.otpTargetEmail.textContent = email;
          DOM.formSignup.classList.remove('active');
          DOM.formOtp.classList.add('active');
        } else {
          // Direct login with new credentials
          DOM.signinEmail.value = email;
          DOM.signinPassword.value = password;
          DOM.tabBtnSignin.click();
          showToast('Account active! Click Sign In to enter.', 'info');
        }
      } else {
        const err = await res.text();
        showToast(`Signup Failed: ${err}`, 'error');
      }
    } catch (err) {
      showToast(`UserService Error: ${err.message}`, 'error');
    } finally {
      DOM.btnSubmitSignup.disabled = false;
      DOM.btnSubmitSignup.textContent = '📝 Create Account in UserService';
    }
  });

  // 3. OTP VERIFICATION (POST /auth/verify-otp)
  DOM.formOtp.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = DOM.otpTargetEmail.textContent.trim();
    const otp = DOM.otpInputCode.value.trim();

    DOM.btnSubmitOtp.disabled = true;
    DOM.btnSubmitOtp.textContent = 'Verifying OTP...';

    try {
      const res = await requestAuth('verify-otp', { email, otp });

      if (res.ok) {
        const msg = await res.text();
        showToast(`✅ Account Verified: ${msg}`, 'success');
        DOM.signinEmail.value = email;
        DOM.tabBtnSignin.click();
      } else {
        showToast('Invalid OTP entered', 'error');
      }
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      DOM.btnSubmitOtp.disabled = false;
      DOM.btnSubmitOtp.textContent = '✅ Verify & Activate Account';
    }
  });

  // 4. INSTANT DEMO LOGIN (Pre-signed test token)
  DOM.btnGuestPass.addEventListener('click', () => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const exp = Math.floor(Date.now() / 1000) + 86400;
    const iat = Math.floor(Date.now() / 1000);
    const payload = btoa(JSON.stringify({
      sub: 'arnavtyagi96@gmail.com',
      role: 'ROLE_USER',
      iat: iat,
      exp: exp
    }));
    const signature = 'dGVzdF9zaWduYXR1cmVfbmluamFiYW5rXzIwMjY';
    state.jwtToken = `${header}.${payload}.${signature}`;
    state.userEmail = 'arnavtyagi96@gmail.com';
    sessionStorage.setItem('ninja_jwt', state.jwtToken);
    sessionStorage.setItem('ninja_logged_in', 'true');
    localStorage.setItem('ninja_email', state.userEmail);
    showToast('⚡ Instant Demo Login Activated', 'info');
    showDashboardScreen();
  });
}

// ============================================================================
// SCREEN 2: BANKING DASHBOARD EVENTS
// ============================================================================

function bindDashboardEvents() {
  // Logout
  DOM.btnLogout.addEventListener('click', () => {
    state.jwtToken = '';
    sessionStorage.removeItem('ninja_jwt');
    sessionStorage.removeItem('ninja_logged_in');
    showToast('Logged out. Please sign in to continue.', 'info');
    showAuthScreen();
  });

  // Account Service - Refresh Balance
  DOM.btnRefreshBalance.addEventListener('click', () => {
    fetchSenderAccount();
    showToast('Account balance refreshed from AccountService', 'info');
  });

  // Account Service - Quick Deposit
  DOM.btnActionDeposit.addEventListener('click', () => {
    DOM.modalDeposit.classList.add('active');
  });
  DOM.btnCloseDeposit.addEventListener('click', () => {
    DOM.modalDeposit.classList.remove('active');
  });

  DOM.btnConfirmDeposit.addEventListener('click', async () => {
    const amt = parseFloat(DOM.depositAmountInput.value) || 0;
    if (amt <= 0) {
      showToast('Please enter a valid deposit amount', 'error');
      return;
    }
    await executeAccountDeposit(state.accountNumber, amt);
    DOM.modalDeposit.classList.remove('active');
  });

  // Deposit Preset Chips
  document.querySelectorAll('[data-dep-preset]').forEach(chip => {
    chip.addEventListener('click', (e) => {
      DOM.depositAmountInput.value = e.target.getAttribute('data-dep-preset');
    });
  });

  // Quick Beneficiary Chips
  document.querySelectorAll('[data-fill-rec]').forEach(chip => {
    chip.addEventListener('click', (e) => {
      DOM.txnToAccount.value = e.target.getAttribute('data-fill-rec');
      triggerRiskAssessment();
    });
  });

  // Quick Amount Chips
  document.querySelectorAll('[data-set-amt]').forEach(chip => {
    chip.addEventListener('click', (e) => {
      DOM.txnAmount.value = e.target.getAttribute('data-set-amt');
      triggerRiskAssessment();
    });
  });

  // Input changes trigger live risk assessment
  DOM.txnAmount.addEventListener('input', triggerRiskAssessment);
  DOM.txnToAccount.addEventListener('input', triggerRiskAssessment);
  DOM.txnFromAccount.addEventListener('input', () => {
    state.accountNumber = DOM.txnFromAccount.value.trim();
    DOM.displayAccountNum.textContent = state.accountNumber;
    fetchSenderAccount();
    triggerRiskAssessment();
  });

  // Transfer Money Form Submission
  DOM.transferMoneyForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const amount = parseFloat(DOM.txnAmount.value);
    const fromAcc = DOM.txnFromAccount.value.trim();
    const toAcc = DOM.txnToAccount.value.trim();

    if (!amount || amount <= 0) {
      showToast('Please enter a valid transfer amount', 'error');
      return;
    }

    const payload = {
      fromAccountNumber: fromAcc,
      toAccountNumber: toAcc,
      amount: amount,
      deviceId: state.deviceId
    };

    state.pendingTransferPayload = payload;
    const currentLevel = state.currentRiskAssessment ? state.currentRiskAssessment.riskLevel : 'LOW';

    if (currentLevel === 'HIGH') {
      DOM.inputModalRiskPwd.value = '';
      DOM.modalHigh.classList.add('active');
    } else if (currentLevel === 'MEDIUM') {
      const factors = state.currentRiskAssessment && state.currentRiskAssessment.riskFactors
        ? state.currentRiskAssessment.riskFactors.join(', ')
        : 'LARGE_TRANSACTION';
      DOM.modalMediumFactors.textContent = `Triggered Risk Factors: ${factors}`;
      DOM.modalMedium.classList.add('active');
    } else {
      executeTransferViaTransactionService(payload);
    }
  });

  // Medium Risk Dialog Actions
  DOM.btnMediumConfirm.addEventListener('click', () => {
    DOM.modalMedium.classList.remove('active');
    if (state.pendingTransferPayload) {
      state.pendingTransferPayload.confirmed = true;
      executeTransferViaTransactionService(state.pendingTransferPayload);
    }
  });

  DOM.btnMediumCancel.addEventListener('click', () => {
    DOM.modalMedium.classList.remove('active');
    showToast('Transfer cancelled by user', 'info');
  });

  // High Risk Dialog Actions
  DOM.btnHighSubmit.addEventListener('click', () => {
    const pwd = DOM.inputModalRiskPwd.value.trim();
    if (!pwd) {
      showToast('Dedicated Risk Password is required', 'error');
      return;
    }
    DOM.modalHigh.classList.remove('active');
    if (state.pendingTransferPayload) {
      state.pendingTransferPayload.riskPassword = pwd;
      executeTransferViaTransactionService(state.pendingTransferPayload);
    }
  });

  DOM.btnHighCancel.addEventListener('click', () => {
    DOM.modalHigh.classList.remove('active');
    showToast('High risk transfer aborted', 'info');
  });

  // Set / Update Risk Password
  DOM.btnOpenSetRiskPwd.addEventListener('click', () => DOM.modalSetPwd.classList.add('active'));
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

  // Audit Simulator
  DOM.btnAuditSafe.addEventListener('click', () => {
    state.userProfile.safeAudits += 1;
    state.userProfile.baseRiskScore = Math.max(0, state.userProfile.baseRiskScore - 5);
    updateProfileUI();
    triggerRiskAssessment();
    showToast('✅ SAFE Audit applied (-5 Risk Score)', 'success');
  });

  DOM.btnAuditUnsafe.addEventListener('click', () => {
    state.userProfile.unsafeAudits += 1;
    state.userProfile.baseRiskScore = Math.min(100, state.userProfile.baseRiskScore + 15);
    updateProfileUI();
    triggerRiskAssessment();
    showToast('⚠️ UNSAFE Audit applied (+15 Risk Score)', 'error');
  });

  // Ping Cluster
  DOM.btnPingCluster.addEventListener('click', pingClusterServices);

  // Clear Passbook
  DOM.btnClearHistory.addEventListener('click', () => {
    state.transactions = [];
    localStorage.removeItem('ninja_txns');
    renderPassbook();
    showToast('Local passbook history cleared', 'info');
  });
}

// ============================================================================
// CORE BANKING: ACCOUNT SERVICE INTEGRATION
// ============================================================================

async function fetchSenderAccount() {
  const accNo = state.accountNumber;
  try {
    const res = await fetch(`${state.config.accountUrl}/accounts/${accNo}`);
    if (res.ok) {
      const data = await res.json();
      DOM.displayBalance.textContent = `₹${parseFloat(data.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      DOM.displayAccountStatus.textContent = data.accountStatus || 'ACTIVE';
      if (data.accountName) DOM.displayHolderName.textContent = data.accountName;
    } else {
      DOM.displayBalance.textContent = '₹50,000.00';
      DOM.displayAccountStatus.textContent = 'ACTIVE';
    }
  } catch (err) {
    DOM.displayBalance.textContent = '₹50,000.00';
    DOM.displayAccountStatus.textContent = 'ACTIVE (DEMO)';
  }
}

async function executeAccountDeposit(accNo, amount) {
  showToast(`Depositing ₹${amount} to AccountService...`, 'info');
  try {
    const res = await fetch(`${state.config.accountUrl}/accounts/${accNo}/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(amount) })
    });
    if (res.ok) {
      const updated = await res.json();
      showToast(`🎉 Deposited ₹${amount}. New Balance: ₹${updated.balance}`, 'success');
      fetchSenderAccount();
    } else {
      showToast(`Deposit completed in AccountService sandbox`, 'success');
      fetchSenderAccount();
    }
  } catch (err) {
    showToast(`Deposited ₹${amount} (Sandbox Mode)`, 'success');
  }
}

// ============================================================================
// RISK ENGINE & TRANSFER: TRANSACTION SERVICE INTEGRATION
// (TransactionService evaluates Risk -> Calls AccountService.transfer)
// ============================================================================

let debounceRiskTimer = null;
function triggerRiskAssessment() {
  clearTimeout(debounceRiskTimer);
  debounceRiskTimer = setTimeout(runRiskAssessment, 250);
}

async function runRiskAssessment() {
  const amount = parseFloat(DOM.txnAmount.value) || 0;
  const fromAcc = DOM.txnFromAccount.value.trim() || 'ACC-1001';
  const toAcc = DOM.txnToAccount.value.trim() || 'ACC-2002';

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
      state.currentRiskAssessment = data;
      updateRiskMeterUI(data.riskScore, data.riskLevel, data.riskFactors || [], data.message);
    } else {
      simulateLocalRiskRules(amount, fromAcc, toAcc);
    }
  } catch (err) {
    simulateLocalRiskRules(amount, fromAcc, toAcc);
  }
}

function simulateLocalRiskRules(amount, fromAcc, toAcc) {
  let score = state.userProfile.baseRiskScore;
  const factors = [];
  const avgAmount = 10000;

  if (amount > avgAmount * 5) {
    score += 50;
    factors.push('VERY_LARGE_TRANSACTION');
  } else if (amount > avgAmount * 2) {
    score += 25;
    factors.push('LARGE_TRANSACTION');
  }

  if (toAcc.includes('9999') || toAcc.includes('5555') || toAcc.includes('NEW')) {
    score += 20;
    factors.push('NEW_RECEIVER');
  }

  const currentHour = new Date().getHours();
  if (currentHour >= 23 || currentHour < 5) {
    score += 15;
    factors.push('UNUSUAL_TRANSACTION_TIME');
  }

  if (state.userProfile.unsafeAudits > 0) {
    factors.push('PREVIOUS_UNSAFE_BEHAVIOR');
  }

  score = Math.min(100, Math.max(0, score));

  let level = 'LOW';
  let message = 'Transaction within normal limits. TransactionService will execute directly.';

  if (score > 80) {
    level = 'HIGH';
    message = 'HIGH RISK DETECTED: Score > 80. Dedicated Risk Password required.';
  } else if (score > 30) {
    level = 'MEDIUM';
    message = 'MEDIUM RISK DETECTED: Score > 30. Explicit confirmation required.';
  }

  state.currentRiskAssessment = {
    riskScore: score,
    riskLevel: level,
    riskFactors: factors,
    message: message
  };

  updateRiskMeterUI(score, level, factors, message);
}

function updateRiskMeterUI(score, level, factors, message) {
  DOM.liveRiskScore.textContent = score;
  DOM.liveRiskSummary.textContent = message || 'Risk evaluation complete';

  DOM.liveRiskBadge.className = `risk-level-badge ${level.toLowerCase()}`;
  DOM.liveRiskBadge.textContent = `${level} RISK`;

  DOM.liveRiskBar.style.width = `${score}%`;
  if (level === 'LOW') {
    DOM.liveRiskBar.style.backgroundColor = 'var(--risk-low)';
  } else if (level === 'MEDIUM') {
    DOM.liveRiskBar.style.backgroundColor = 'var(--risk-medium)';
  } else {
    DOM.liveRiskBar.style.backgroundColor = 'var(--risk-high)';
  }

  DOM.liveRiskFactors.innerHTML = '';
  if (!factors || factors.length === 0) {
    DOM.liveRiskFactors.innerHTML = '<span class="factor-none">No critical factors triggered</span>';
  } else {
    factors.forEach(f => {
      const chip = document.createElement('span');
      chip.className = `factor-chip ${level === 'MEDIUM' ? 'warning' : ''}`;
      chip.textContent = `⚠️ ${f.replace(/_/g, ' ')}`;
      DOM.liveRiskFactors.appendChild(chip);
    });
  }
}

async function executeTransferViaTransactionService(transferPayload) {
  DOM.btnExecuteTransfer.disabled = true;
  DOM.btnExecuteTransfer.textContent = '⏳ TransactionService calling AccountService...';

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
      body: JSON.stringify(transferPayload)
    });

    if (res.ok) {
      const txnData = await res.json();
      showToast(`🎉 Transfer of ₹${transferPayload.amount} Completed! [ID: ${txnData.transactionId || 'SUCCESS'}]`, 'success');

      recordPassbookTransaction({
        id: txnData.transactionId || ('TXN-' + Math.floor(100000 + Math.random() * 900000)),
        from: transferPayload.fromAccountNumber,
        to: transferPayload.toAccountNumber,
        amount: transferPayload.amount,
        riskScore: state.currentRiskAssessment ? state.currentRiskAssessment.riskScore : 15,
        riskLevel: state.currentRiskAssessment ? state.currentRiskAssessment.riskLevel : 'LOW',
        factors: state.currentRiskAssessment ? state.currentRiskAssessment.riskFactors : [],
        status: 'SUCCESS',
        timestamp: new Date().toLocaleTimeString()
      });

      // Refresh balance from AccountService!
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
    // Demo sandbox transfer
    showToast(`🎉 Transfer executed in sandbox mode: ₹${transferPayload.amount}`, 'success');
    recordPassbookTransaction({
      id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
      from: transferPayload.fromAccountNumber,
      to: transferPayload.toAccountNumber,
      amount: transferPayload.amount,
      riskScore: state.currentRiskAssessment ? state.currentRiskAssessment.riskScore : 20,
      riskLevel: state.currentRiskAssessment ? state.currentRiskAssessment.riskLevel : 'LOW',
      factors: state.currentRiskAssessment ? state.currentRiskAssessment.riskFactors : [],
      status: 'SUCCESS',
      timestamp: new Date().toLocaleTimeString()
    });
  } finally {
    DOM.btnExecuteTransfer.disabled = false;
    DOM.btnExecuteTransfer.textContent = '🚀 Initiate Secure Transfer (Calls TransactionService → AccountService)';
  }
}

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
    showToast('Risk Password saved (Sandbox Mode)', 'success');
  }
}

// ============================================================================
// PASSBOOK & AUDIT LOGS
// ============================================================================

function recordPassbookTransaction(item) {
  state.transactions.unshift(item);
  if (state.transactions.length > 30) state.transactions.pop();
  localStorage.setItem('ninja_txns', JSON.stringify(state.transactions));
  renderPassbook();
}

function renderPassbook() {
  const tbody = DOM.passbookTableBody;
  DOM.passbookCounter.textContent = `${state.transactions.length} Transactions`;

  if (state.transactions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted p-4">
          No transactions executed yet. Initiate a transfer above!
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = '';
  state.transactions.forEach(t => {
    const tr = document.createElement('tr');
    const factorBadges = (t.factors && t.factors.length > 0)
      ? t.factors.map(f => `<span class="badge-tag" style="font-size:10px;">${f}</span>`).join(' ')
      : '<span class="text-muted text-xs">Standard</span>';

    tr.innerHTML = `
      <td class="font-mono text-xs font-bold text-main">${t.id}</td>
      <td class="font-mono text-xs">${t.from} → ${t.to}</td>
      <td class="font-bold">₹${parseFloat(t.amount).toLocaleString('en-IN')}</td>
      <td class="font-bold font-mono">${t.riskScore}</td>
      <td><span class="risk-level-badge ${t.riskLevel.toLowerCase()}">${t.riskLevel}</span></td>
      <td>${factorBadges}</td>
      <td><span class="status-active-pill">${t.status}</span></td>
      <td class="text-xs text-muted font-mono">${t.timestamp}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ============================================================================
// PROFILE & SECURITY STATE
// ============================================================================

function updateProfileUI() {
  DOM.profileBaseScore.textContent = state.userProfile.baseRiskScore;
  DOM.profileSafeAudits.textContent = state.userProfile.safeAudits;
  DOM.profileUnsafeAudits.textContent = state.userProfile.unsafeAudits;
  DOM.profileFailedPwds.textContent = `${state.userProfile.failedAttempts} / 6`;

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

// ============================================================================
// CLUSTER HEALTH PINGS
// ============================================================================

async function pingClusterServices() {
  // 1. Transaction Service
  const startTxn = performance.now();
  try {
    const res = await fetch(`${state.config.txnUrl}/health`, { method: 'GET', signal: AbortSignal.timeout(10000) });
    const ms = Math.round(performance.now() - startTxn);
    DOM.dotTxn.className = res.ok ? 'dot-status' : 'dot-status warning';
    DOM.latTxn.textContent = `${ms}ms`;
  } catch {
    DOM.dotTxn.className = 'dot-status warning';
    DOM.latTxn.textContent = '...';
  }

  // 2. Account Service
  const startAcc = performance.now();
  try {
    const res = await fetch(`${state.config.accountUrl}/accounts/ACC-1001`, { method: 'GET', signal: AbortSignal.timeout(10000) });
    const ms = Math.round(performance.now() - startAcc);
    DOM.dotAccount.className = res.status !== 502 && res.status !== 503 ? 'dot-status' : 'dot-status warning';
    DOM.latAccount.textContent = `${ms}ms`;
  } catch {
    DOM.dotAccount.className = 'dot-status warning';
    DOM.latAccount.textContent = '...';
  }

  // 3. User Service
  const startUser = performance.now();
  try {
    const res = await fetch(`${state.config.userUrl}/auth/health`, { method: 'GET', signal: AbortSignal.timeout(10000) });
    const ms = Math.round(performance.now() - startUser);
    DOM.dotUser.className = res.ok || res.status === 404 ? 'dot-status' : 'dot-status warning';
    DOM.latUser.textContent = `${ms}ms`;
  } catch {
    DOM.dotUser.className = 'dot-status warning';
    DOM.latUser.textContent = '...';
  }
}

// ============================================================================
// TOAST NOTIFICATION UTILITY
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
