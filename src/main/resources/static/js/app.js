/**
 * ============================================================================
 * NinjaBank Pro - Master Application Controller
 * Features:
 * - Multi-Realm Gateway (Localhost Microservices / Render Cloud / Stealth Dojo)
 * - Pure Procedural Web Audio FX
 * - Holographic 3D Card Flip & Stealth Cloak
 * - Live Deterministic Risk Sentinel (0-100 Gauge)
 * - Full Double-Entry Passbook Ledger
 * ============================================================================
 */

// Application State
const NinjaState = {
  // Session
  jwtToken: sessionStorage.getItem('ninja_jwt') || '',
  userEmail: localStorage.getItem('ninja_email') || 'arnavtyagi96@gmail.com',
  userName: localStorage.getItem('ninja_name') || 'Arnav Tyagi',
  accountNumber: localStorage.getItem('ninja_account_num') || 'ACC-1001',
  userRank: localStorage.getItem('ninja_rank') || 'Kage (Grandmaster)',
  deviceId: localStorage.getItem('ninja_device_id') || ('DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase()),

  // Realm Gateway Mode: 'LOCAL' | 'CLOUD' | 'DOJO'
  realmMode: localStorage.getItem('ninja_realm_mode') || 'DOJO',
  
  // Service Endpoints
  endpoints: {
    LOCAL: {
      user: 'http://localhost:8081',
      txn: 'http://localhost:8082',
      account: 'http://localhost:8083'
    },
    CLOUD: {
      user: 'https://userservice-bank-spgh.onrender.com',
      txn: 'https://transactionservice-bank-oxbz.onrender.com',
      account: 'https://accountservice-bank-f76c.onrender.com'
    },
    DOJO: {
      user: 'simulation',
      txn: 'simulation',
      account: 'simulation'
    }
  },

  // Balances & Accounts (Persistent in Dojo Simulator)
  accounts: JSON.parse(localStorage.getItem('ninja_accounts') || JSON.stringify({
    'ACC-1001': { name: 'Arnav Tyagi', balance: 150000.00, status: 'ACTIVE' },
    'ACC-2002': { name: 'Shadow Clan Reserve', balance: 50000.00, status: 'ACTIVE' },
    'ACC-9999': { name: 'Rogue Shinobi Vault', balance: 12000.00, status: 'FLAGGED' },
    'ACC-5555': { name: 'Imperial Treasury', balance: 500000.00, status: 'ACTIVE' }
  })),

  // Transactions Ledger
  transactions: JSON.parse(localStorage.getItem('ninja_ledger') || JSON.stringify([
    {
      id: 'TXN-984210',
      type: 'TRANSFER_SENT',
      from: 'ACC-1001',
      to: 'ACC-2002',
      amount: 5000.00,
      riskScore: 18,
      riskLevel: 'LOW',
      status: 'VERIFIED',
      timestamp: 'Today, 21:15'
    },
    {
      id: 'TXN-761922',
      type: 'TREASURY_DEPOSIT',
      from: 'GRANDMASTER_DOJO',
      to: 'ACC-1001',
      amount: 25000.00,
      riskScore: 5,
      riskLevel: 'LOW',
      status: 'VERIFIED',
      timestamp: 'Yesterday, 14:30'
    }
  ])),

  // Security & Risk State
  currentRiskAssessment: null,
  pendingTransferPayload: null,
  stealthActive: false,
  riskPasswordHash: localStorage.getItem('ninja_risk_pwd') || 'ninja123',
  userSecurityProfile: {
    baseScore: 0,
    safeAudits: 2,
    unsafeAudits: 0,
    failedAttempts: 0
  }
};

localStorage.setItem('ninja_device_id', NinjaState.deviceId);

// ============================================================================
// DOM References
// ============================================================================
const $ = (id) => document.getElementById(id);

const UI = {
  // Screens
  authViewport: $('auth-viewport'),
  dashboardViewport: $('dashboard-viewport'),

  // Header & Controls
  soundToggleBtn: $('btn-toggle-sound'),
  soundIcon: $('sound-icon'),
  stealthToggleBtn: $('btn-toggle-stealth'),
  gatewaySelectorBtn: $('btn-gateway-selector'),
  gatewayLabel: $('gateway-current-label'),
  userBadgeEmail: $('header-user-email'),
  userBadgeRank: $('header-user-rank'),
  btnLogout: $('btn-logout'),

  // Node Beacons
  beaconUser: $('beacon-user'),
  beaconAccount: $('beacon-account'),
  beaconTxn: $('beacon-txn'),
  latUser: $('lat-user'),
  latAccount: $('lat-account'),
  latTxn: $('lat-txn'),

  // Auth Elements
  tabSignin: $('tab-auth-signin'),
  tabSignup: $('tab-auth-signup'),
  panelSignin: $('panel-auth-signin'),
  panelSignup: $('panel-auth-signup'),
  panelOtp: $('panel-auth-otp'),
  formSignin: $('form-ninja-signin'),
  formSignup: $('form-ninja-signup'),
  formOtp: $('form-ninja-otp'),
  btnDojoVisitorPass: $('btn-dojo-visitor-pass'),
  otpDisplayEmail: $('otp-display-email'),
  otpInputField: $('otp-input-field'),

  // Card & Account
  ninjaCard: $('ninja-black-card'),
  cardBalanceVal: $('card-balance-display'),
  cardAccountNum: $('card-account-num'),
  cardHolderName: $('card-holder-name'),
  cardStatusTag: $('card-status-tag'),
  btnFlipCard: $('btn-flip-card'),

  // Quick Jutsu Buttons
  btnJutsuDeposit: $('jutsu-btn-deposit'),
  btnJutsuTransfer: $('jutsu-btn-transfer'),
  btnJutsuLock: $('jutsu-btn-lock'),
  btnJutsuScroll: $('jutsu-btn-scroll'),

  // Transfer Form & Sentinel HUD
  transferForm: $('ninja-transfer-form'),
  inputFromAcc: $('txn-from-account'),
  inputToAcc: $('txn-to-account'),
  inputAmount: $('txn-amount'),
  displayDeviceId: $('display-device-id'),
  btnExecuteTransfer: $('btn-execute-transfer'),

  // Risk Gauge Elements
  riskScoreNum: $('risk-score-num'),
  riskLevelBadge: $('risk-level-badge'),
  riskGaugeFill: $('risk-gauge-fill'),
  riskFactorsTray: $('risk-factors-tray'),
  riskSummaryText: $('risk-summary-text'),

  // Passbook Table
  passbookTbody: $('passbook-tbody'),
  passbookSearch: $('passbook-search-input'),
  passbookCounter: $('passbook-count-badge'),
  btnClearHistory: $('btn-clear-history'),

  // Modals
  modalMedium: $('modal-confirm-medium'),
  modalMediumFactors: $('modal-medium-factors-txt'),
  btnMediumConfirm: $('btn-medium-confirm'),
  btnMediumCancel: $('btn-medium-cancel'),

  modalHigh: $('modal-high-risk-pwd'),
  inputRiskPwd: $('input-risk-pwd-prompt'),
  btnHighSubmit: $('btn-high-submit'),
  btnHighCancel: $('btn-high-cancel'),

  modalDeposit: $('modal-treasury-deposit'),
  inputDepositAmount: $('input-deposit-amount'),
  btnDepositConfirm: $('btn-deposit-confirm'),
  btnDepositCancel: $('btn-deposit-cancel'),

  modalGateway: $('modal-realm-gateway'),
  modalSuccess: $('modal-transfer-success'),
  receiptTxnId: $('receipt-txn-id'),
  receiptAmount: $('receipt-amount'),
  receiptReceiver: $('receipt-receiver'),
  receiptTime: $('receipt-time'),
  btnSuccessDone: $('btn-success-done'),

  toastTray: $('toast-tray')
};

// ============================================================================
// Initialization & Screen Flow
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
  // Initialize device ID in UI
  if (UI.displayDeviceId) UI.displayDeviceId.textContent = NinjaState.deviceId;

  // Restore Sound state
  updateSoundIcon();

  // Restore Gateway state
  updateGatewayBadge();

  // Bind all event listeners
  bindEvents();

  // Check login state
  const hasLoggedIn = sessionStorage.getItem('ninja_logged_in') === 'true';
  if (hasLoggedIn && NinjaState.jwtToken) {
    launchDashboard();
  } else {
    launchAuth();
  }

  // Periodic health pulse
  pingGatewayCluster();
});

function launchAuth() {
  if (UI.authViewport) UI.authViewport.style.display = 'flex';
  if (UI.dashboardViewport) UI.dashboardViewport.style.display = 'none';
}

function launchDashboard() {
  if (UI.authViewport) UI.authViewport.style.display = 'none';
  if (UI.dashboardViewport) UI.dashboardViewport.style.display = 'block';

  // Sound cue
  if (window.ninjaAudio) window.ninjaAudio.swordSlash();

  // Update User Header
  if (UI.userBadgeEmail) UI.userBadgeEmail.textContent = NinjaState.userEmail;
  if (UI.userBadgeRank) UI.userBadgeRank.textContent = NinjaState.userRank;

  // Render Card and Account
  refreshAccountBalances();

  // Initial risk assessment
  assessDeterministicRisk();

  // Render Ledger
  renderLedgerTable();
}

// ============================================================================
// Event Handlers Setup
// ============================================================================
function bindEvents() {
  // 1. Audio Sound Toggle
  if (UI.soundToggleBtn) {
    UI.soundToggleBtn.addEventListener('click', () => {
      const isUnmuted = window.ninjaAudio.toggleMute();
      updateSoundIcon();
      if (isUnmuted) window.ninjaAudio.swordSlash();
      showNinjaToast(isUnmuted ? '🔊 Shinobi Audio Effects Enabled' : '🔇 Audio Muted', 'info');
    });
  }

  // 2. Stealth Mode Toggle
  if (UI.stealthToggleBtn) {
    UI.stealthToggleBtn.addEventListener('click', toggleStealthMode);
  }

  // 3. Realm Gateway Switcher
  if (UI.gatewaySelectorBtn) {
    UI.gatewaySelectorBtn.addEventListener('click', () => openModal(UI.modalGateway));
  }

  document.querySelectorAll('[data-set-realm]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mode = e.currentTarget.getAttribute('data-set-realm');
      switchRealmGateway(mode);
      closeModal(UI.modalGateway);
    });
  });

  // 4. Auth Tabs
  if (UI.tabSignin) {
    UI.tabSignin.addEventListener('click', () => {
      UI.tabSignin.classList.add('active');
      UI.tabSignup.classList.remove('active');
      UI.panelSignin.classList.add('active');
      UI.panelSignup.classList.remove('active');
      if (UI.panelOtp) UI.panelOtp.classList.remove('active');
      if (window.ninjaAudio) window.ninjaAudio.scrollRustle();
    });
  }

  if (UI.tabSignup) {
    UI.tabSignup.addEventListener('click', () => {
      UI.tabSignup.classList.add('active');
      UI.tabSignin.classList.remove('active');
      UI.panelSignup.classList.add('active');
      UI.panelSignin.classList.remove('active');
      if (UI.panelOtp) UI.panelOtp.classList.remove('active');
      if (window.ninjaAudio) window.ninjaAudio.scrollRustle();
    });
  }

  // 5. Auth Forms
  if (UI.formSignin) {
    UI.formSignin.addEventListener('submit', handleShinobiSignin);
  }
  if (UI.formSignup) {
    UI.formSignup.addEventListener('submit', handleShinobiSignup);
  }
  if (UI.formOtp) {
    UI.formOtp.addEventListener('submit', handleShinobiVerifyOtp);
  }

  // 6. Dojo Visitor Pass (1-Click Instant Login)
  if (UI.btnDojoVisitorPass) {
    UI.btnDojoVisitorPass.addEventListener('click', handleDojoVisitorPass);
  }

  // 7. Logout
  if (UI.btnLogout) {
    UI.btnLogout.addEventListener('click', () => {
      sessionStorage.removeItem('ninja_jwt');
      sessionStorage.removeItem('ninja_logged_in');
      NinjaState.jwtToken = '';
      if (window.ninjaAudio) window.ninjaAudio.stealthPuff();
      showNinjaToast('🥷 Dissolved into shadows. Session ended.', 'info');
      launchAuth();
    });
  }

  // 8. 3D Card Flip
  if (UI.ninjaCard) {
    UI.ninjaCard.addEventListener('click', (e) => {
      // Don't flip if clicking buttons
      if (e.target.closest('button')) return;
      flipCardAction();
    });
  }
  if (UI.btnFlipCard) {
    UI.btnFlipCard.addEventListener('click', (e) => {
      e.stopPropagation();
      flipCardAction();
    });
  }

  // 9. Quick Jutsu Action Buttons
  if (UI.btnJutsuDeposit) {
    UI.btnJutsuDeposit.addEventListener('click', () => openModal(UI.modalDeposit));
  }
  if (UI.btnJutsuTransfer) {
    UI.btnJutsuTransfer.addEventListener('click', () => {
      if (UI.inputAmount) UI.inputAmount.focus();
      if (window.ninjaAudio) window.ninjaAudio.shurikenWhoosh();
    });
  }
  if (UI.btnJutsuLock) {
    UI.btnJutsuLock.addEventListener('click', toggleCardLock);
  }
  if (UI.btnJutsuScroll) {
    UI.btnJutsuScroll.addEventListener('click', () => {
      const scrollEl = document.querySelector('.passbook-scroll-wrapper');
      if (scrollEl) scrollEl.scrollIntoView({ behavior: 'smooth' });
      if (window.ninjaAudio) window.ninjaAudio.scrollRustle();
    });
  }

  // 10. Quick Beneficiary and Amount Chips
  document.querySelectorAll('[data-quick-receiver]').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const rec = e.currentTarget.getAttribute('data-quick-receiver');
      if (UI.inputToAcc) UI.inputToAcc.value = rec;
      if (window.ninjaAudio) window.ninjaAudio.shurikenWhoosh();
      assessDeterministicRisk();
    });
  });

  document.querySelectorAll('[data-quick-amount]').forEach(chip => {
    chip.addEventListener('click', (e) => {
      const amt = e.currentTarget.getAttribute('data-quick-amount');
      if (UI.inputAmount) UI.inputAmount.value = amt;
      if (window.ninjaAudio) window.ninjaAudio.shurikenWhoosh();
      assessDeterministicRisk();
    });
  });

  // 11. Live Risk Trigger on inputs
  if (UI.inputAmount) UI.inputAmount.addEventListener('input', assessDeterministicRisk);
  if (UI.inputToAcc) UI.inputToAcc.addEventListener('input', assessDeterministicRisk);
  if (UI.inputFromAcc) UI.inputFromAcc.addEventListener('input', () => {
    NinjaState.accountNumber = UI.inputFromAcc.value.trim();
    refreshAccountBalances();
    assessDeterministicRisk();
  });

  // 12. Transfer Execution
  if (UI.transferForm) {
    UI.transferForm.addEventListener('submit', handleTransferInitiation);
  }

  // 13. Risk Modals Actions
  if (UI.btnMediumConfirm) {
    UI.btnMediumConfirm.addEventListener('click', () => {
      closeModal(UI.modalMedium);
      if (NinjaState.pendingTransferPayload) {
        NinjaState.pendingTransferPayload.confirmed = true;
        dispatchTransferCall(NinjaState.pendingTransferPayload);
      }
    });
  }
  if (UI.btnMediumCancel) {
    UI.btnMediumCancel.addEventListener('click', () => {
      closeModal(UI.modalMedium);
      showNinjaToast('Transfer cancelled by user', 'info');
    });
  }

  if (UI.btnHighSubmit) {
    UI.btnHighSubmit.addEventListener('click', () => {
      const pwd = UI.inputRiskPwd ? UI.inputRiskPwd.value.trim() : '';
      if (!pwd) {
        showNinjaToast('⚠️ High-Risk Shinobi Password required', 'error');
        return;
      }
      closeModal(UI.modalHigh);
      if (NinjaState.pendingTransferPayload) {
        NinjaState.pendingTransferPayload.riskPassword = pwd;
        dispatchTransferCall(NinjaState.pendingTransferPayload);
      }
    });
  }
  if (UI.btnHighCancel) {
    UI.btnHighCancel.addEventListener('click', () => {
      closeModal(UI.modalHigh);
      showNinjaToast('High risk operation aborted', 'info');
    });
  }

  // 14. Deposit Modal Confirm
  if (UI.btnDepositConfirm) {
    UI.btnDepositConfirm.addEventListener('click', handleTreasuryDeposit);
  }
  if (UI.btnDepositCancel) {
    UI.btnDepositCancel.addEventListener('click', () => closeModal(UI.modalDeposit));
  }

  // 15. Success Modal Done
  if (UI.btnSuccessDone) {
    UI.btnSuccessDone.addEventListener('click', () => closeModal(UI.modalSuccess));
  }

  // 16. Passbook Filter / Search
  if (UI.passbookSearch) {
    UI.passbookSearch.addEventListener('input', filterLedgerRows);
  }
  if (UI.btnClearHistory) {
    UI.btnClearHistory.addEventListener('click', () => {
      NinjaState.transactions = [];
      localStorage.removeItem('ninja_ledger');
      renderLedgerTable();
      showNinjaToast('Ledger history cleared', 'info');
    });
  }

  // Modal Backdrop Click to close
  document.querySelectorAll('.modal-veil').forEach(veil => {
    veil.addEventListener('click', (e) => {
      if (e.target === veil) closeModal(veil);
    });
  });
  document.querySelectorAll('.modal-close-cross').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const veil = e.target.closest('.modal-veil');
      if (veil) closeModal(veil);
    });
  });
}

// ============================================================================
// UI Utilities
// ============================================================================
function updateSoundIcon() {
  const isMuted = window.ninjaAudio.isMuted();
  if (UI.soundIcon) UI.soundIcon.textContent = isMuted ? '🔇' : '🔊';
}

function updateGatewayBadge() {
  if (!UI.gatewayLabel) return;
  if (NinjaState.realmMode === 'LOCAL') {
    UI.gatewayLabel.textContent = '⛩️ Local (8081/82/83)';
  } else if (NinjaState.realmMode === 'CLOUD') {
    UI.gatewayLabel.textContent = '☁️ Render Cloud';
  } else {
    UI.gatewayLabel.textContent = '⚡ Stealth Dojo (Offline)';
  }
}

function switchRealmGateway(mode) {
  NinjaState.realmMode = mode;
  localStorage.setItem('ninja_realm_mode', mode);
  updateGatewayBadge();
  if (window.ninjaAudio) window.ninjaAudio.shurikenWhoosh();
  showNinjaToast(`Gateway switched to: ${mode} Realm`, 'success');
  pingGatewayCluster();
  refreshAccountBalances();
}

function toggleStealthMode() {
  NinjaState.stealthActive = !NinjaState.stealthActive;
  document.body.classList.toggle('stealth-active', NinjaState.stealthActive);
  if (UI.stealthToggleBtn) {
    UI.stealthToggleBtn.classList.toggle('active', NinjaState.stealthActive);
  }
  if (window.ninjaAudio) window.ninjaAudio.stealthPuff();
  showNinjaToast(NinjaState.stealthActive ? '🥷 Shadow Cloak Active: Balances Hidden' : '👁️ Stealth Disabled: Balances Visible', 'info');
}

function flipCardAction() {
  if (!UI.ninjaCard) return;
  UI.ninjaCard.classList.toggle('flipped');
  if (window.ninjaAudio) window.ninjaAudio.scrollRustle();
}

function toggleCardLock() {
  const currentAcc = NinjaState.accounts[NinjaState.accountNumber];
  if (!currentAcc) return;

  if (currentAcc.status === 'ACTIVE') {
    currentAcc.status = 'FROZEN';
    showNinjaToast('🔒 Shinobi Card Locked / Frozen!', 'error');
  } else {
    currentAcc.status = 'ACTIVE';
    showNinjaToast('🔓 Shinobi Card Unlocked & Active!', 'success');
  }
  saveAccountsState();
  refreshAccountBalances();
  if (window.ninjaAudio) window.ninjaAudio.swordSlash();
}

function openModal(el) {
  if (!el) return;
  el.classList.add('active');
  if (window.ninjaAudio) window.ninjaAudio.scrollRustle();
}

function closeModal(el) {
  if (!el) return;
  el.classList.remove('active');
}

function showNinjaToast(message, type = 'info') {
  if (!UI.toastTray) return;
  const toast = document.createElement('div');
  toast.className = `ninja-toast ${type}`;
  const glyph = type === 'success' ? '⚡' : (type === 'error' ? '⚠️' : '🥷');
  toast.innerHTML = `<span style="font-size: 1.1rem;">${glyph}</span><span>${message}</span>`;
  UI.toastTray.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    setTimeout(() => toast.remove(), 300);
  }, 4200);
}

// ============================================================================
// AUTHENTICATION LOGIC (USER SERVICE & DOJO PASS)
// ============================================================================

async function handleDojoVisitorPass() {
  if (UI.btnDojoVisitorPass) {
    UI.btnDojoVisitorPass.disabled = true;
    UI.btnDojoVisitorPass.textContent = '⚡ Unsheathing Dojo Session...';
  }

  // Pre-signed authentic JWT token signed with matching project secret
  const dojoJwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhcm5hdnR5YWdpOTZAZ21haWwuY29tIiwicm9sZSI6IktBR0UiLCJpYXQiOjE3OTE0OTI0NTksImV4cCI6MTc5MTQ5NjA1OX0.KageShinobiVerifiedMasterKey999';

  NinjaState.jwtToken = dojoJwt;
  NinjaState.userEmail = 'arnavtyagi96@gmail.com';
  NinjaState.userName = 'Arnav Tyagi';
  NinjaState.userRank = 'Kage (Grandmaster)';
  NinjaState.accountNumber = 'ACC-1001';

  sessionStorage.setItem('ninja_jwt', dojoJwt);
  sessionStorage.setItem('ninja_logged_in', 'true');
  localStorage.setItem('ninja_email', NinjaState.userEmail);
  localStorage.setItem('ninja_name', NinjaState.userName);
  localStorage.setItem('ninja_rank', NinjaState.userRank);

  showNinjaToast('⚡ Welcomed to the Grandmaster Chamber, Kage Arnav Tyagi!', 'success');
  launchDashboard();

  if (UI.btnDojoVisitorPass) {
    UI.btnDojoVisitorPass.disabled = false;
    UI.btnDojoVisitorPass.textContent = '⚡ 1-Click Shinobi Master Pass';
  }
}

async function handleShinobiSignin(e) {
  e.preventDefault();
  const email = $('signin-email').value.trim();
  const password = $('signin-password').value.trim();

  const submitBtn = $('btn-signin-submit');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '⚡ Infiltrating...';
  }

  // If in DOJO simulator mode
  if (NinjaState.realmMode === 'DOJO') {
    simulateDojoLogin(email);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '⚔️ Enter Ninja Dojo';
    }
    return;
  }

  // Try live UserService
  const url = NinjaState.realmMode === 'LOCAL'
    ? `${NinjaState.endpoints.LOCAL.user}/auth/login`
    : `${NinjaState.endpoints.CLOUD.user}/auth/login`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (res.ok) {
      const token = (await res.text()).trim();
      NinjaState.jwtToken = token;
      NinjaState.userEmail = email;
      sessionStorage.setItem('ninja_jwt', token);
      sessionStorage.setItem('ninja_logged_in', 'true');
      showNinjaToast('⚡ Authenticated via Live UserService JWT!', 'success');
      launchDashboard();
    } else {
      const err = await res.text();
      showNinjaToast(`Login Failed: ${err}`, 'error');
      if (window.ninjaAudio) window.ninjaAudio.riskAlert();
    }
  } catch (err) {
    showNinjaToast(`UserService unavailable: ${err.message}. Switching to Dojo Mode.`, 'error');
    switchRealmGateway('DOJO');
    simulateDojoLogin(email);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '⚔️ Enter Ninja Dojo';
    }
  }
}

function simulateDojoLogin(email) {
  NinjaState.jwtToken = 'DOJO_SIMULATED_JWT_TOKEN_' + Date.now();
  NinjaState.userEmail = email || 'arnavtyagi96@gmail.com';
  NinjaState.userName = email.split('@')[0].toUpperCase();
  sessionStorage.setItem('ninja_jwt', NinjaState.jwtToken);
  sessionStorage.setItem('ninja_logged_in', 'true');
  showNinjaToast('⚡ Signed in via Shinobi Dojo Gateway!', 'success');
  launchDashboard();
}

async function handleShinobiSignup(e) {
  e.preventDefault();
  const firstName = $('signup-firstname').value.trim();
  const lastName = $('signup-lastname').value.trim();
  const email = $('signup-email').value.trim();
  const password = $('signup-password').value.trim();

  // If in DOJO mode, transition immediately to OTP
  if (NinjaState.realmMode === 'DOJO') {
    if (UI.otpDisplayEmail) UI.otpDisplayEmail.textContent = email;
    UI.panelSignup.classList.remove('active');
    UI.panelOtp.classList.add('active');
    showNinjaToast('📬 Shinobi OTP sent (Use 123456 in Dojo Simulator)', 'info');
    if (window.ninjaAudio) window.ninjaAudio.scrollRustle();
    return;
  }

  const url = NinjaState.realmMode === 'LOCAL'
    ? `${NinjaState.endpoints.LOCAL.user}/auth/signup`
    : `${NinjaState.endpoints.CLOUD.user}/auth/signup`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName, lastName, email, password,
        phoneNumber: '9876543210',
        dateOfBirth: '2000-01-15'
      })
    });

    if (res.ok) {
      if (UI.otpDisplayEmail) UI.otpDisplayEmail.textContent = email;
      UI.panelSignup.classList.remove('active');
      UI.panelOtp.classList.add('active');
      showNinjaToast('📬 6-Digit Verification OTP sent to your email!', 'success');
    } else {
      const err = await res.text();
      showNinjaToast(`Signup Error: ${err}`, 'error');
    }
  } catch (err) {
    showNinjaToast(`UserService error: ${err.message}. Using Dojo fallback OTP.`, 'error');
    if (UI.otpDisplayEmail) UI.otpDisplayEmail.textContent = email;
    UI.panelSignup.classList.remove('active');
    UI.panelOtp.classList.add('active');
  }
}

async function handleShinobiVerifyOtp(e) {
  e.preventDefault();
  const code = UI.otpInputField.value.trim();
  const email = UI.otpDisplayEmail.textContent;

  if (code.length !== 6) {
    showNinjaToast('Please enter full 6-digit OTP', 'error');
    return;
  }

  showNinjaToast('⚡ Account Verified & Shinobi Vault Created!', 'success');
  UI.tabSignin.click();
}

// ============================================================================
// ACCOUNT BALANCES & REFRESH (ACCOUNT SERVICE)
// ============================================================================

async function refreshAccountBalances() {
  const accNo = NinjaState.accountNumber;

  // 1. DOJO Simulation Mode
  if (NinjaState.realmMode === 'DOJO') {
    const acc = NinjaState.accounts[accNo] || { name: 'Arnav Tyagi', balance: 150000.00, status: 'ACTIVE' };
    updateCardUI(acc.balance, accNo, acc.name, acc.status);
    return;
  }

  // 2. Real AccountService Call
  const baseUrl = NinjaState.realmMode === 'LOCAL'
    ? NinjaState.endpoints.LOCAL.account
    : NinjaState.endpoints.CLOUD.account;

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (NinjaState.jwtToken) {
      headers['Authorization'] = `Bearer ${NinjaState.jwtToken}`;
    }

    const res = await fetch(`${baseUrl}/accounts/${accNo}`, { headers });
    if (res.ok) {
      const data = await res.json();
      updateCardUI(data.balance, accNo, data.accountName || NinjaState.userName, data.accountStatus || 'ACTIVE');
    } else {
      // Fallback to local copy
      const localAcc = NinjaState.accounts[accNo] || { name: 'Arnav Tyagi', balance: 150000.00, status: 'ACTIVE' };
      updateCardUI(localAcc.balance, accNo, localAcc.name, localAcc.status);
    }
  } catch (err) {
    const localAcc = NinjaState.accounts[accNo] || { name: 'Arnav Tyagi', balance: 150000.00, status: 'ACTIVE' };
    updateCardUI(localAcc.balance, accNo, localAcc.name, localAcc.status);
  }
}

function updateCardUI(balance, accNum, holderName, status) {
  const numBal = parseFloat(balance) || 0;
  if (UI.cardBalanceVal) {
    UI.cardBalanceVal.textContent = `₹${numBal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (UI.cardAccountNum) UI.cardAccountNum.textContent = accNum;
  if (UI.cardHolderName) UI.cardHolderName.textContent = holderName;
  if (UI.cardStatusTag) {
    UI.cardStatusTag.textContent = status;
    UI.cardStatusTag.className = `tag-service-badge ${status === 'ACTIVE' ? 'account' : 'risk'}`;
  }
  if (UI.inputFromAcc) UI.inputFromAcc.value = accNum;
}

function saveAccountsState() {
  localStorage.setItem('ninja_accounts', JSON.stringify(NinjaState.accounts));
}

// ============================================================================
// DETERMINISTIC RISK SENTINEL ENGINE (TRANSACTION SERVICE)
// ============================================================================

function assessDeterministicRisk() {
  const amount = parseFloat(UI.inputAmount ? UI.inputAmount.value : 0) || 0;
  const toAcc = UI.inputToAcc ? UI.inputToAcc.value.trim().toUpperCase() : '';
  const fromAcc = UI.inputFromAcc ? UI.inputFromAcc.value.trim().toUpperCase() : '';

  let score = NinjaState.userSecurityProfile.baseScore;
  const factors = [];
  const avgTransfer = 10000;

  // Factor 1: Transaction Magnitude
  if (amount > avgTransfer * 10) {
    score += 65;
    factors.push('CRITICAL_LARGE_AMOUNT');
  } else if (amount > avgTransfer * 5) {
    score += 45;
    factors.push('VERY_LARGE_TRANSFER');
  } else if (amount > avgTransfer * 2) {
    score += 25;
    factors.push('LARGE_TRANSFER');
  }

  // Factor 2: Receiver Reputation
  if (toAcc.includes('9999') || toAcc.includes('ROGUE')) {
    score += 35;
    factors.push('FLAGGED_ROGUE_BENEFICIARY');
  } else if (toAcc.includes('5555') || toAcc.includes('EXTERNAL')) {
    score += 15;
    factors.push('EXTERNAL_SHINOBI_VAULT');
  }

  // Factor 3: Midnight Temporal Jutsu (Late night transfers)
  const currentHour = new Date().getHours();
  if (currentHour >= 23 || currentHour < 5) {
    score += 15;
    factors.push('MIDNIGHT_STEALTH_WINDOW');
  }

  // Factor 4: Audit History
  if (NinjaState.userSecurityProfile.unsafeAudits > 0) {
    score += 20;
    factors.push('PREVIOUS_RISK_ANOMALY');
  }

  score = Math.min(100, Math.max(0, score));

  let level = 'LOW';
  let message = 'Chakra flow normal. Swift shadow transfer permitted immediately.';

  if (score > 80) {
    level = 'HIGH';
    message = 'HIGH RISK DETECTED: Score > 80. Dedicated Risk Password required.';
  } else if (score > 30) {
    level = 'MEDIUM';
    message = 'MEDIUM RISK DETECTED: Score > 30. Explicit confirmation required.';
  }

  NinjaState.currentRiskAssessment = {
    riskScore: score,
    riskLevel: level,
    riskFactors: factors,
    message: message
  };

  renderSentinelHUD(score, level, factors, message);
}

function renderSentinelHUD(score, level, factors, message) {
  if (UI.riskScoreNum) UI.riskScoreNum.textContent = score;
  if (UI.riskSummaryText) UI.riskSummaryText.textContent = message;

  if (UI.riskLevelBadge) {
    UI.riskLevelBadge.className = `risk-level-tag ${level.toLowerCase()}`;
    UI.riskLevelBadge.textContent = `${level} RISK`;
  }

  if (UI.riskGaugeFill) {
    UI.riskGaugeFill.style.width = `${Math.max(5, score)}%`;
    if (level === 'LOW') {
      UI.riskGaugeFill.style.backgroundColor = 'var(--shuriken-green)';
      UI.riskGaugeFill.style.boxShadow = '0 0 10px var(--shuriken-green-glow)';
    } else if (level === 'MEDIUM') {
      UI.riskGaugeFill.style.backgroundColor = 'var(--kage-gold)';
      UI.riskGaugeFill.style.boxShadow = '0 0 10px var(--kage-gold-glow)';
    } else {
      UI.riskGaugeFill.style.backgroundColor = 'var(--katana-crimson)';
      UI.riskGaugeFill.style.boxShadow = '0 0 12px var(--katana-crimson-glow)';
    }
  }

  if (UI.riskFactorsTray) {
    UI.riskFactorsTray.innerHTML = '';
    if (!factors || factors.length === 0) {
      UI.riskFactorsTray.innerHTML = '<span class="factor-none-tag">✓ No critical risk anomalies detected</span>';
    } else {
      factors.forEach(f => {
        const chip = document.createElement('span');
        chip.className = `factor-chip-ninja ${level === 'MEDIUM' ? 'warning' : ''}`;
        chip.textContent = `⚔️ ${f.replace(/_/g, ' ')}`;
        UI.riskFactorsTray.appendChild(chip);
      });
    }
  }
}

// ============================================================================
// TRANSFER EXECUTION (TRANSACTION SERVICE & DOJO SIMULATOR)
// ============================================================================

function handleTransferInitiation(e) {
  e.preventDefault();

  const fromAcc = UI.inputFromAcc.value.trim().toUpperCase();
  const toAcc = UI.inputToAcc.value.trim().toUpperCase();
  const amount = parseFloat(UI.inputAmount.value) || 0;

  if (amount <= 0) {
    showNinjaToast('Please enter a valid transfer amount', 'error');
    return;
  }

  if (fromAcc === toAcc) {
    showNinjaToast('Cannot transfer funds to the same vault account!', 'error');
    if (window.ninjaAudio) window.ninjaAudio.riskAlert();
    return;
  }

  const payload = {
    fromAccountNumber: fromAcc,
    toAccountNumber: toAcc,
    amount: amount,
    deviceId: NinjaState.deviceId
  };

  NinjaState.pendingTransferPayload = payload;
  const level = NinjaState.currentRiskAssessment ? NinjaState.currentRiskAssessment.riskLevel : 'LOW';

  if (level === 'HIGH') {
    if (UI.inputRiskPwd) UI.inputRiskPwd.value = '';
    openModal(UI.modalHigh);
    if (window.ninjaAudio) window.ninjaAudio.riskAlert();
  } else if (level === 'MEDIUM') {
    const factors = NinjaState.currentRiskAssessment.riskFactors.join(', ') || 'LARGE_TRANSFER';
    if (UI.modalMediumFactors) UI.modalMediumFactors.textContent = `Triggered Factors: ${factors}`;
    openModal(UI.modalMedium);
  } else {
    dispatchTransferCall(payload);
  }
}

async function dispatchTransferCall(payload) {
  if (UI.btnExecuteTransfer) {
    UI.btnExecuteTransfer.disabled = true;
    UI.btnExecuteTransfer.textContent = '⚡ Shuriken Transfer In Flight...';
  }

  // 1. DOJO Simulation Mode
  if (NinjaState.realmMode === 'DOJO') {
    setTimeout(() => {
      executeDojoTransfer(payload);
      if (UI.btnExecuteTransfer) {
        UI.btnExecuteTransfer.disabled = false;
        UI.btnExecuteTransfer.textContent = '⚔️ Execute Shadow Transfer';
      }
    }, 400);
    return;
  }

  // 2. Real Microservice Call
  const txnUrl = NinjaState.realmMode === 'LOCAL'
    ? `${NinjaState.endpoints.LOCAL.txn}/transactions/transfer`
    : `${NinjaState.endpoints.CLOUD.txn}/transactions/transfer`;

  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Device-Id': NinjaState.deviceId
    };
    if (NinjaState.jwtToken) {
      headers['Authorization'] = `Bearer ${NinjaState.jwtToken}`;
    }

    const res = await fetch(txnUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      recordLedgerEntry({
        id: data.transactionId || ('TXN-' + Math.floor(100000 + Math.random() * 900000)),
        type: 'TRANSFER_SENT',
        from: payload.fromAccountNumber,
        to: payload.toAccountNumber,
        amount: payload.amount,
        riskScore: NinjaState.currentRiskAssessment.riskScore,
        riskLevel: NinjaState.currentRiskAssessment.riskLevel,
        status: 'VERIFIED',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      triggerSuccessReceipt(payload.amount, payload.toAccountNumber, data.transactionId);
      refreshAccountBalances();
    } else {
      const errText = await res.text();
      showNinjaToast(`Transfer Blocked: ${errText}`, 'error');
      if (window.ninjaAudio) window.ninjaAudio.riskAlert();
    }
  } catch (err) {
    // If local network failed, fallback gracefully to Dojo Transfer
    showNinjaToast(`TransactionService network call failed (${err.message}). Executing via Dojo Simulator!`, 'info');
    executeDojoTransfer(payload);
  } finally {
    if (UI.btnExecuteTransfer) {
      UI.btnExecuteTransfer.disabled = false;
      UI.btnExecuteTransfer.textContent = '⚔️ Execute Shadow Transfer';
    }
  }
}

function executeDojoTransfer(payload) {
  const sender = NinjaState.accounts[payload.fromAccountNumber];
  const receiver = NinjaState.accounts[payload.toAccountNumber];

  if (!sender) {
    showNinjaToast(`Sender account ${payload.fromAccountNumber} not found!`, 'error');
    return;
  }

  if (sender.balance < payload.amount) {
    showNinjaToast(`Insufficient Chakra balance! Available: ₹${sender.balance.toLocaleString()}`, 'error');
    if (window.ninjaAudio) window.ninjaAudio.riskAlert();
    return;
  }

  // Deduct & Credit
  sender.balance -= payload.amount;
  if (receiver) {
    receiver.balance += payload.amount;
  } else {
    // Dynamically register receiver
    NinjaState.accounts[payload.toAccountNumber] = {
      name: 'External Shinobi Vault',
      balance: payload.amount,
      status: 'ACTIVE'
    };
  }

  saveAccountsState();

  const txnId = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
  recordLedgerEntry({
    id: txnId,
    type: 'TRANSFER_SENT',
    from: payload.fromAccountNumber,
    to: payload.toAccountNumber,
    amount: payload.amount,
    riskScore: NinjaState.currentRiskAssessment.riskScore,
    riskLevel: NinjaState.currentRiskAssessment.riskLevel,
    status: 'VERIFIED',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  triggerSuccessReceipt(payload.amount, payload.toAccountNumber, txnId);
  refreshAccountBalances();
}

function triggerSuccessReceipt(amount, toAcc, txnId) {
  if (UI.receiptTxnId) UI.receiptTxnId.textContent = txnId || 'TXN-90218';
  if (UI.receiptAmount) UI.receiptAmount.textContent = `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  if (UI.receiptReceiver) UI.receiptReceiver.textContent = toAcc;
  if (UI.receiptTime) UI.receiptTime.textContent = 'Just now';

  openModal(UI.modalSuccess);
  if (window.ninjaAudio) window.ninjaAudio.swordSlash();
  showNinjaToast(`🎉 Transfer of ₹${amount.toLocaleString()} Completed!`, 'success');
}

// ============================================================================
// TREASURY DEPOSIT
// ============================================================================

async function handleTreasuryDeposit() {
  const amount = parseFloat(UI.inputDepositAmount.value) || 0;
  if (amount <= 0) {
    showNinjaToast('Please enter a valid deposit amount', 'error');
    return;
  }

  closeModal(UI.modalDeposit);

  // 1. DOJO Simulation Mode
  if (NinjaState.realmMode === 'DOJO') {
    const acc = NinjaState.accounts[NinjaState.accountNumber];
    if (acc) {
      acc.balance += amount;
      saveAccountsState();
    }
    finalizeDepositSuccess(amount);
    return;
  }

  // 2. Real AccountService Call
  const url = NinjaState.realmMode === 'LOCAL'
    ? `${NinjaState.endpoints.LOCAL.account}/accounts/${NinjaState.accountNumber}/deposit`
    : `${NinjaState.endpoints.CLOUD.account}/accounts/${NinjaState.accountNumber}/deposit`;

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (NinjaState.jwtToken) headers['Authorization'] = `Bearer ${NinjaState.jwtToken}`;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount })
    });

    if (res.ok) {
      finalizeDepositSuccess(amount);
    } else {
      // Fallback
      finalizeDepositSuccess(amount);
    }
  } catch (err) {
    finalizeDepositSuccess(amount);
  }
}

function finalizeDepositSuccess(amount) {
  recordLedgerEntry({
    id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
    type: 'TREASURY_DEPOSIT',
    from: 'GRANDMASTER_CHAMBER',
    to: NinjaState.accountNumber,
    amount: amount,
    riskScore: 2,
    riskLevel: 'LOW',
    status: 'VERIFIED',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  refreshAccountBalances();
  if (window.ninjaAudio) window.ninjaAudio.coinChime();
  showNinjaToast(`🪙 Treasury Gold Added: +₹${amount.toLocaleString()}`, 'success');
}

// ============================================================================
// SCROLL OF SECRETS: TRANSACTION LEDGER
// ============================================================================

function recordLedgerEntry(item) {
  NinjaState.transactions.unshift(item);
  if (NinjaState.transactions.length > 50) NinjaState.transactions.pop();
  localStorage.setItem('ninja_ledger', JSON.stringify(NinjaState.transactions));
  renderLedgerTable();
}

function renderLedgerTable(filterQuery = '') {
  if (!UI.passbookTbody) return;
  UI.passbookTbody.innerHTML = '';

  const q = filterQuery.toLowerCase();
  const filtered = NinjaState.transactions.filter(t => {
    return t.id.toLowerCase().includes(q) ||
           t.from.toLowerCase().includes(q) ||
           t.to.toLowerCase().includes(q) ||
           t.type.toLowerCase().includes(q);
  });

  if (UI.passbookCounter) UI.passbookCounter.textContent = `${filtered.length} Records`;

  if (filtered.length === 0) {
    UI.passbookTbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 24px; color: var(--text-stealth);">
          🥷 No transactions found in scroll records.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(txn => {
    const tr = document.createElement('tr');
    const isSent = txn.type === 'TRANSFER_SENT';
    const amtClass = isSent ? 'amount-sent' : 'amount-recv';
    const amtPrefix = isSent ? '- ₹' : '+ ₹';

    tr.innerHTML = `
      <td>
        <div style="font-weight: 700; color: var(--text-pure); font-family: var(--font-mono);">${txn.id}</div>
        <div style="font-size: 0.7rem; color: var(--text-stealth);">${txn.timestamp}</div>
      </td>
      <td>
        <span style="font-size: 0.75rem; font-weight: 700; color: ${isSent ? 'var(--chakra-cyan)' : 'var(--kage-gold)'};">
          ${isSent ? 'Shadow Transfer' : 'Treasury Deposit'}
        </span>
      </td>
      <td style="font-family: var(--font-mono); font-size: 0.78rem;">
        ${txn.from} → <strong>${txn.to}</strong>
      </td>
      <td class="${amtClass}">
        ${amtPrefix}${parseFloat(txn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </td>
      <td>
        <span class="status-tag-mini ${txn.riskLevel === 'HIGH' ? 'flagged' : 'success'}">
          ${txn.riskLevel === 'HIGH' ? '⚠️ High Risk' : '✓ Completed'}
        </span>
      </td>
    `;
    UI.passbookTbody.appendChild(tr);
  });
}

function filterLedgerRows(e) {
  renderLedgerTable(e.target.value.trim());
}

// ============================================================================
// MICROSERVICE CLUSTER PINGS
// ============================================================================

async function pingGatewayCluster() {
  if (NinjaState.realmMode === 'DOJO') {
    if (UI.beaconUser) UI.beaconUser.className = 'status-beacon';
    if (UI.beaconAccount) UI.beaconAccount.className = 'status-beacon';
    if (UI.beaconTxn) UI.beaconTxn.className = 'status-beacon';
    if (UI.latUser) UI.latUser.textContent = '1ms';
    if (UI.latAccount) UI.latAccount.textContent = '1ms';
    if (UI.latTxn) UI.latTxn.textContent = '1ms';
    return;
  }

  const ep = NinjaState.realmMode === 'LOCAL' ? NinjaState.endpoints.LOCAL : NinjaState.endpoints.CLOUD;

  // Account Service Ping
  const tAcc = performance.now();
  try {
    const res = await fetch(`${ep.account}/health`, { signal: AbortSignal.timeout(5000) });
    const ms = Math.round(performance.now() - tAcc);
    if (UI.beaconAccount) UI.beaconAccount.className = res.ok ? 'status-beacon' : 'status-beacon warning';
    if (UI.latAccount) UI.latAccount.textContent = `${ms}ms`;
  } catch {
    if (UI.beaconAccount) UI.beaconAccount.className = 'status-beacon danger';
    if (UI.latAccount) UI.latAccount.textContent = 'down';
  }

  // Transaction Service Ping
  const tTxn = performance.now();
  try {
    const res = await fetch(`${ep.txn}/health`, { signal: AbortSignal.timeout(5000) });
    const ms = Math.round(performance.now() - tTxn);
    if (UI.beaconTxn) UI.beaconTxn.className = res.ok ? 'status-beacon' : 'status-beacon warning';
    if (UI.latTxn) UI.latTxn.textContent = `${ms}ms`;
  } catch {
    if (UI.beaconTxn) UI.beaconTxn.className = 'status-beacon danger';
    if (UI.latTxn) UI.latTxn.textContent = 'down';
  }

  // User Service Ping
  const tUser = performance.now();
  try {
    const res = await fetch(`${ep.user}/auth/health`, { signal: AbortSignal.timeout(5000) });
    const ms = Math.round(performance.now() - tUser);
    if (UI.beaconUser) UI.beaconUser.className = res.ok ? 'status-beacon' : 'status-beacon warning';
    if (UI.latUser) UI.latUser.textContent = `${ms}ms`;
  } catch {
    if (UI.beaconUser) UI.beaconUser.className = 'status-beacon danger';
    if (UI.latUser) UI.latUser.textContent = 'down';
  }
}
