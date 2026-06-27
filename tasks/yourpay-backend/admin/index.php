<?php
session_start();

// Simple admin panel session check
$isLoggedIn = !empty($_SESSION['admin_id']);

// Handle logout
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: index.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>YourPay Admin Panel</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #0A0A0C; --surface: #111116; --card: #16161E; --border: #2A2A36;
  --primary: #3B82F6; --accent: #00E676; --danger: #EF4444; --warn: #F59E0B;
  --text: #E4E4E7; --muted: #71717A;
  --sidebar-w: 240px;
}
body { font-family: 'Segoe UI', system-ui, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }

/* ── Login ── */
.login-wrap { display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
.login-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 40px 32px; width: 100%; max-width: 380px; }
.login-card h1 { font-size: 22px; margin-bottom: 4px; }
.login-card p  { color: var(--muted); font-size: 14px; margin-bottom: 28px; }
.badge { display: inline-block; background: var(--accent); color: #000; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 99px; margin-bottom: 16px; }

/* ── Forms ── */
.form-group { margin-bottom: 16px; }
label { display: block; font-size: 13px; color: var(--muted); margin-bottom: 6px; }
input, select, textarea {
  width: 100%; padding: 10px 14px; background: var(--surface); border: 1px solid var(--border);
  border-radius: 8px; color: var(--text); font-size: 14px; outline: none;
  transition: border-color .2s;
}
input:focus, select:focus { border-color: var(--primary); }
.btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; font-weight: 600; transition: opacity .2s; }
.btn:hover { opacity: .85; }
.btn-primary  { background: var(--primary); color: #fff; }
.btn-success  { background: var(--accent); color: #000; }
.btn-danger   { background: var(--danger); color: #fff; }
.btn-warn     { background: var(--warn); color: #000; }
.btn-ghost    { background: transparent; color: var(--text); border: 1px solid var(--border); }
.btn-sm { padding: 6px 12px; font-size: 12px; }
.btn-block { width: 100%; justify-content: center; }
.error-msg { background: rgba(239,68,68,.15); border: 1px solid var(--danger); border-radius: 8px; padding: 10px 14px; color: #fca5a5; font-size: 13px; margin-bottom: 16px; }
.success-msg { background: rgba(0,230,118,.12); border: 1px solid var(--accent); border-radius: 8px; padding: 10px 14px; color: var(--accent); font-size: 13px; margin-bottom: 16px; }

/* ── Layout ── */
.layout { display: flex; min-height: 100vh; }
.sidebar {
  width: var(--sidebar-w); background: var(--surface); border-right: 1px solid var(--border);
  display: flex; flex-direction: column; position: fixed; top: 0; left: 0; height: 100vh;
  overflow-y: auto; z-index: 50;
}
.sidebar-logo { padding: 24px 20px 16px; border-bottom: 1px solid var(--border); }
.sidebar-logo h2 { font-size: 18px; color: var(--accent); font-weight: 700; }
.sidebar-logo span { font-size: 11px; color: var(--muted); }
.sidebar-nav { flex: 1; padding: 12px 8px; }
.nav-section { font-size: 10px; color: var(--muted); font-weight: 700; text-transform: uppercase; letter-spacing: .08em; padding: 12px 12px 4px; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; color: var(--muted); text-decoration: none; font-size: 14px; cursor: pointer; transition: all .15s; margin-bottom: 2px; }
.nav-item:hover, .nav-item.active { background: rgba(59,130,246,.12); color: var(--text); }
.nav-item.active { color: var(--primary); font-weight: 600; }
.sidebar-footer { padding: 16px; border-top: 1px solid var(--border); }
.main { margin-left: var(--sidebar-w); flex: 1; display: flex; flex-direction: column; }
.topbar { background: var(--surface); border-bottom: 1px solid var(--border); padding: 16px 28px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 40; }
.topbar h1 { font-size: 18px; font-weight: 700; }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
.content { padding: 28px; flex: 1; }

/* ── Stats Grid ── */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 28px; }
.stat-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
.stat-label { font-size: 12px; color: var(--muted); margin-bottom: 8px; }
.stat-value { font-size: 28px; font-weight: 700; }
.stat-value.green { color: var(--accent); }
.stat-value.blue  { color: var(--primary); }
.stat-value.red   { color: var(--danger); }
.stat-value.warn  { color: var(--warn); }

/* ── Table ── */
.table-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
.table-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.table-header h2 { font-size: 16px; font-weight: 700; }
.table-search { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 8px 14px; color: var(--text); font-size: 14px; width: 240px; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 600px; }
th { background: var(--surface); padding: 12px 16px; text-align: left; font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; white-space: nowrap; }
td { padding: 12px 16px; border-top: 1px solid var(--border); font-size: 14px; white-space: nowrap; }
tr:hover td { background: rgba(255,255,255,.02); }
.badge-status { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; }
.badge-success  { background: rgba(0,230,118,.15); color: var(--accent); }
.badge-pending  { background: rgba(245,158,11,.15); color: var(--warn); }
.badge-failed   { background: rgba(239,68,68,.15); color: var(--danger); }
.badge-frozen   { background: rgba(99,102,241,.15); color: #818cf8; }
.actions { display: flex; gap: 6px; }
.pagination { padding: 12px 20px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--muted); }

/* ── Modal ── */
.modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.7); z-index: 100; align-items: center; justify-content: center; padding: 16px; }
.modal-overlay.open { display: flex; }
.modal { background: var(--card); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.modal-head { padding: 20px 24px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
.modal-head h3 { font-size: 16px; font-weight: 700; }
.modal-close { background: none; border: none; color: var(--muted); font-size: 22px; cursor: pointer; padding: 0 4px; }
.modal-close:hover { color: var(--text); }
.modal-body { padding: 20px 24px; }
.modal-foot { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; }

/* ── Toast ── */
#toast { position: fixed; bottom: 24px; right: 24px; z-index: 200; display: flex; flex-direction: column; gap: 8px; }
.toast-item { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 12px 18px; font-size: 14px; min-width: 260px; box-shadow: 0 4px 20px rgba(0,0,0,.5); animation: slideIn .3s ease; }
.toast-item.ok  { border-left: 3px solid var(--accent); }
.toast-item.err { border-left: 3px solid var(--danger); }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: none; opacity: 1; } }

/* ── Misc ── */
.section { display: none; }
.section.active { display: block; }
.info-row { display: flex; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
.info-row .key { color: var(--muted); width: 160px; flex-shrink: 0; }
.spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid var(--muted); border-top-color: var(--primary); border-radius: 50%; animation: spin .6s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.loading-block { padding: 48px; text-align: center; color: var(--muted); }

@media (max-width: 768px) {
  .sidebar { transform: translateX(-100%); transition: transform .3s; }
  .sidebar.open { transform: none; }
  .main { margin-left: 0; }
  .topbar { padding: 12px 16px; }
  .content { padding: 16px; }
  .table-search { width: 100%; }
}
</style>
</head>
<body>

<?php if (!$isLoggedIn): ?>
<!-- ──────────────── LOGIN PAGE ──────────────── -->
<div class="login-wrap">
  <div class="login-card">
    <div class="badge">ADMIN PANEL</div>
    <h1>YourPay Admin</h1>
    <p>Sign in to manage the platform</p>
    <div id="loginError" class="error-msg" style="display:none"></div>
    <form id="loginForm">
      <div class="form-group">
        <label>Username</label>
        <input type="text" id="loginUser" placeholder="admin" autocomplete="username" required>
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="loginPass" placeholder="••••••••" autocomplete="current-password" required>
      </div>
      <button class="btn btn-primary btn-block" type="submit" id="loginBtn">
        <span id="loginSpinner" class="spinner" style="display:none"></span>
        Sign In
      </button>
    </form>
    <p style="margin-top:20px;font-size:12px;color:var(--muted);text-align:center">
      Default: admin / admin11
    </p>
  </div>
</div>

<?php else: ?>
<!-- ──────────────── ADMIN LAYOUT ──────────────── -->
<div class="layout">

  <!-- Sidebar -->
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-logo">
      <h2>⬡ YourPay</h2>
      <span>Admin Console</span>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section">Overview</div>
      <a class="nav-item active" onclick="show('dashboard')">📊 Dashboard</a>
      <div class="nav-section">Management</div>
      <a class="nav-item" onclick="show('users')">👥 Users</a>
      <a class="nav-item" onclick="show('transactions')">💸 Transactions</a>
      <a class="nav-item" onclick="show('cards')">💳 Cards</a>
      <a class="nav-item" onclick="show('notifications')">🔔 Notifications</a>
      <div class="nav-section">System</div>
      <a class="nav-item" onclick="show('audit')">🗒 Audit Logs</a>
    </nav>
    <div class="sidebar-footer">
      <a href="?logout=1" class="btn btn-ghost btn-block">Sign Out</a>
    </div>
  </aside>

  <!-- Main -->
  <div class="main">
    <div class="topbar">
      <div style="display:flex;align-items:center;gap:12px">
        <button class="btn btn-ghost btn-sm" style="display:none" id="sidebarToggle" onclick="document.getElementById('sidebar').classList.toggle('open')">☰</button>
        <h1 id="pageTitle">Dashboard</h1>
      </div>
      <div class="topbar-right">
        <span style="font-size:13px;color:var(--muted)"><?= htmlspecialchars($_SESSION['admin_role'] ?? 'admin') ?></span>
        <div class="avatar">A</div>
      </div>
    </div>

    <div class="content">

      <!-- ── DASHBOARD ── -->
      <div class="section active" id="sec-dashboard">
        <div class="stats-grid" id="statsGrid">
          <div class="loading-block"><span class="spinner"></span></div>
        </div>
        <div class="table-card">
          <div class="table-header"><h2>Recent Transactions</h2></div>
          <div class="table-wrap" id="recentTxnTable"><div class="loading-block"><span class="spinner"></span></div></div>
        </div>
      </div>

      <!-- ── USERS ── -->
      <div class="section" id="sec-users">
        <div class="table-card">
          <div class="table-header">
            <h2>All Users</h2>
            <input class="table-search" id="userSearch" placeholder="Search name, email, wallet…" oninput="searchUsers(this.value)">
          </div>
          <div class="table-wrap" id="usersTable"><div class="loading-block"><span class="spinner"></span></div></div>
          <div class="pagination">
            <span id="userCountLabel">–</span>
            <div style="display:flex;gap:6px">
              <button class="btn btn-ghost btn-sm" onclick="loadUsers(usersOffset-50)">← Prev</button>
              <button class="btn btn-ghost btn-sm" onclick="loadUsers(usersOffset+50)">Next →</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── TRANSACTIONS ── -->
      <div class="section" id="sec-transactions">
        <div class="table-card">
          <div class="table-header">
            <h2>Transactions</h2>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <input class="table-search" id="txnSearch" placeholder="Search TXN ID, email…" oninput="loadTxns(0,this.value)">
              <select id="txnStatus" onchange="loadTxns(0)" style="width:160px">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
          <div class="table-wrap" id="txnsTable"><div class="loading-block"><span class="spinner"></span></div></div>
          <div class="pagination">
            <span id="txnCountLabel">–</span>
            <div style="display:flex;gap:6px">
              <button class="btn btn-ghost btn-sm" onclick="loadTxns(txnsOffset-50)">← Prev</button>
              <button class="btn btn-ghost btn-sm" onclick="loadTxns(txnsOffset+50)">Next →</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── CARDS ── -->
      <div class="section" id="sec-cards">
        <div class="table-card">
          <div class="table-header"><h2>Virtual Cards</h2></div>
          <div class="table-wrap" id="cardsTable"><div class="loading-block"><span class="spinner"></span></div></div>
        </div>
      </div>

      <!-- ── NOTIFICATIONS ── -->
      <div class="section" id="sec-notifications">
        <div class="table-card" style="margin-bottom:20px">
          <div class="table-header"><h2>Send Notification</h2></div>
          <div style="padding:20px;display:grid;gap:14px">
            <div class="form-group" style="margin:0">
              <label>User ID (leave blank to broadcast)</label>
              <input type="text" id="notifUserId" placeholder="user-uuid or blank for all">
            </div>
            <div class="form-group" style="margin:0">
              <label>Title</label>
              <input type="text" id="notifTitle" placeholder="Notification title">
            </div>
            <div class="form-group" style="margin:0">
              <label>Message</label>
              <textarea id="notifMsg" rows="3" placeholder="Notification message…"></textarea>
            </div>
            <div style="display:flex;gap:10px">
              <button class="btn btn-primary" onclick="sendNotif(false)">Send to User</button>
              <button class="btn btn-warn" onclick="sendNotif(true)">📢 Broadcast All</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── AUDIT LOGS ── -->
      <div class="section" id="sec-audit">
        <div class="table-card">
          <div class="table-header"><h2>Audit Logs</h2></div>
          <div class="table-wrap" id="auditTable"><div class="loading-block"><span class="spinner"></span></div></div>
          <div class="pagination">
            <span id="auditCountLabel">–</span>
            <div style="display:flex;gap:6px">
              <button class="btn btn-ghost btn-sm" onclick="loadAudit(auditOffset-100)">← Prev</button>
              <button class="btn btn-ghost btn-sm" onclick="loadAudit(auditOffset+100)">Next →</button>
            </div>
          </div>
        </div>
      </div>

    </div><!-- /content -->
  </div><!-- /main -->
</div><!-- /layout -->

<!-- ── User Detail Modal ── -->
<div class="modal-overlay" id="userModal">
  <div class="modal">
    <div class="modal-head">
      <h3>User Details</h3>
      <button class="modal-close" onclick="closeModal('userModal')">×</button>
    </div>
    <div class="modal-body" id="userModalBody"><span class="spinner"></span></div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal('userModal')">Close</button>
    </div>
  </div>
</div>

<!-- ── Wallet Action Modal ── -->
<div class="modal-overlay" id="walletModal">
  <div class="modal">
    <div class="modal-head">
      <h3 id="walletModalTitle">Wallet Operation</h3>
      <button class="modal-close" onclick="closeModal('walletModal')">×</button>
    </div>
    <div class="modal-body">
      <input type="hidden" id="walletUserId">
      <input type="hidden" id="walletAction">
      <div class="form-group">
        <label>Amount (₹)</label>
        <input type="number" id="walletAmount" min="1" placeholder="0.00">
      </div>
      <div class="form-group">
        <label>Wallet Type</label>
        <select id="walletType">
          <option value="main">Main Wallet</option>
          <option value="savings">Savings Wallet</option>
          <option value="rewards">Rewards Wallet</option>
        </select>
      </div>
      <div class="form-group">
        <label>Reason</label>
        <input type="text" id="walletReason" placeholder="Reason for this operation…">
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal('walletModal')">Cancel</button>
      <button class="btn btn-primary" onclick="submitWalletOp()">Confirm</button>
    </div>
  </div>
</div>

<?php endif; ?>

<div id="toast"></div>

<script>
const API = 'api/';

// ── Toast ────────────────────────────────────────────────────
function toast(msg, ok = true) {
  const t = document.getElementById('toast');
  const el = document.createElement('div');
  el.className = 'toast-item ' + (ok ? 'ok' : 'err');
  el.textContent = msg;
  t.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── Modal ────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// ── Navigation ───────────────────────────────────────────────
const sections = { dashboard: 'Dashboard', users: 'Users', transactions: 'Transactions', cards: 'Cards', notifications: 'Notifications', audit: 'Audit Logs' };
function show(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('sec-' + name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => { if (n.textContent.toLowerCase().includes(name.toLowerCase().replace('-',' '))) n.classList.add('active'); });
  document.getElementById('pageTitle').textContent = sections[name] || name;
  if (name === 'dashboard')     loadDashboard();
  if (name === 'users')         loadUsers(0);
  if (name === 'transactions')  loadTxns(0);
  if (name === 'cards')         loadCards();
  if (name === 'audit')         loadAudit(0);
}

// ── Login ────────────────────────────────────────────────────
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    const sp  = document.getElementById('loginSpinner');
    btn.disabled = true; sp.style.display = 'inline-block';
    const res = await apiFetch('admin.php?action=login', {
      username: document.getElementById('loginUser').value,
      password: document.getElementById('loginPass').value,
    });
    btn.disabled = false; sp.style.display = 'none';
    if (res.success) { location.reload(); }
    else { const err = document.getElementById('loginError'); err.style.display='block'; err.textContent=res.error; }
  };
}

// ── API Fetch ────────────────────────────────────────────────
async function apiFetch(endpoint, body = null, method = 'POST') {
  try {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const r = await fetch(API + endpoint, opts);
    return await r.json();
  } catch (e) { return { success: false, error: 'Network error.' }; }
}

// ── Dashboard ────────────────────────────────────────────────
async function loadDashboard() {
  const res = await apiFetch('admin.php?action=dashboard', {}, 'GET');
  if (!res.success) { toast(res.error, false); return; }
  const s = res.data.stats;
  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card"><div class="stat-label">Total Users</div><div class="stat-value blue">${s.total_users}</div></div>
    <div class="stat-card"><div class="stat-label">Total Transactions</div><div class="stat-value">${s.total_transactions}</div></div>
    <div class="stat-card"><div class="stat-label">Wallet Balance</div><div class="stat-value green">₹${Number(s.total_wallet_balance||0).toLocaleString()}</div></div>
    <div class="stat-card"><div class="stat-label">Today's Transactions</div><div class="stat-value warn">${s.todays_transactions}</div></div>
    <div class="stat-card"><div class="stat-label">Active Cards</div><div class="stat-value">${s.active_cards}</div></div>
    <div class="stat-card"><div class="stat-label">Pending Requests</div><div class="stat-value warn">${s.pending_requests}</div></div>
    <div class="stat-card"><div class="stat-label">Frozen Users</div><div class="stat-value red">${s.frozen_users}</div></div>
  `;
  loadRecentTxns();
}

async function loadRecentTxns() {
  const res = await apiFetch('admin.php?action=transactions&limit=10&offset=0', {}, 'GET');
  if (!res.success) return;
  document.getElementById('recentTxnTable').innerHTML = buildTxnTable(res.data.transactions);
}

// ── Users ────────────────────────────────────────────────────
let usersOffset = 0, userSearchQ = '';
function searchUsers(q) { userSearchQ = q; loadUsers(0); }
async function loadUsers(offset = 0) {
  if (offset < 0) return;
  usersOffset = offset;
  document.getElementById('usersTable').innerHTML = '<div class="loading-block"><span class="spinner"></span></div>';
  const url = `admin.php?action=users&limit=50&offset=${offset}${userSearchQ ? '&q=' + encodeURIComponent(userSearchQ) : ''}`;
  const res = await apiFetch(url, {}, 'GET');
  if (!res.success) { toast(res.error, false); return; }
  const users = res.data.users;
  document.getElementById('userCountLabel').textContent = `Showing ${offset+1}–${offset+users.length} of ${res.data.total}`;
  if (!users.length) { document.getElementById('usersTable').innerHTML = '<div class="loading-block">No users found.</div>'; return; }
  let html = `<table><thead><tr><th>Name</th><th>Email</th><th>UPI ID</th><th>Wallet #</th><th>Status</th><th>Since</th><th>Actions</th></tr></thead><tbody>`;
  users.forEach(u => {
    const badge = u.is_frozen ? '<span class="badge-status badge-frozen">Frozen</span>' : '<span class="badge-status badge-success">Active</span>';
    html += `<tr>
      <td>${esc(u.full_name)}</td>
      <td>${esc(u.email)}</td>
      <td>${esc(u.upi_id)}</td>
      <td>${esc(u.wallet_number)}</td>
      <td>${badge}</td>
      <td>${u.member_since.split('T')[0]}</td>
      <td><div class="actions">
        <button class="btn btn-ghost btn-sm" onclick="viewUser('${u.id}')">View</button>
        ${u.is_frozen
          ? `<button class="btn btn-success btn-sm" onclick="toggleFreeze('${u.id}',false)">Unfreeze</button>`
          : `<button class="btn btn-warn btn-sm" onclick="toggleFreeze('${u.id}',true)">Freeze</button>`}
        <button class="btn btn-primary btn-sm" onclick="openWalletOp('${u.id}','credit')">Credit</button>
        <button class="btn btn-danger btn-sm" onclick="openWalletOp('${u.id}','debit')">Debit</button>
      </div></td>
    </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('usersTable').innerHTML = html;
}

async function viewUser(userId) {
  document.getElementById('userModalBody').innerHTML = '<div class="loading-block"><span class="spinner"></span></div>';
  openModal('userModal');
  const res = await apiFetch(`admin.php?action=user_detail&user_id=${userId}`, {}, 'GET');
  if (!res.success) { document.getElementById('userModalBody').innerHTML = `<p style="color:var(--danger)">${res.error}</p>`; return; }
  const { user, wallets, card } = res.data;
  let wHtml = (wallets||[]).map(w => `<div class="info-row"><span class="key">${w.type} wallet</span><span>₹${Number(w.balance).toLocaleString()} — ${w.wallet_number}</span></div>`).join('');
  document.getElementById('userModalBody').innerHTML = `
    <div class="info-row"><span class="key">Full Name</span><span>${esc(user.full_name)}</span></div>
    <div class="info-row"><span class="key">Email</span><span>${esc(user.email)}</span></div>
    <div class="info-row"><span class="key">UPI ID</span><span>${esc(user.upi_id)}</span></div>
    <div class="info-row"><span class="key">Wallet #</span><span>${esc(user.wallet_number)}</span></div>
    <div class="info-row"><span class="key">Status</span><span>${user.is_frozen ? '❄️ Frozen' : '✅ Active'}</span></div>
    <div class="info-row"><span class="key">Member Since</span><span>${user.member_since}</span></div>
    ${wHtml}
    ${card ? `<div class="info-row"><span class="key">Card</span><span>${esc(card.card_number)} (${card.is_frozen?'Frozen':'Active'})</span></div>` : ''}
  `;
}

async function toggleFreeze(userId, freeze) {
  const action = freeze ? 'freeze_user' : 'unfreeze_user';
  const res = await apiFetch(`admin.php?action=${action}`, { user_id: userId });
  toast(res.success ? res.message : res.error, res.success);
  if (res.success) loadUsers(usersOffset);
}

function openWalletOp(userId, action) {
  document.getElementById('walletUserId').value = userId;
  document.getElementById('walletAction').value = action;
  document.getElementById('walletModalTitle').textContent = action === 'credit' ? '💳 Credit Wallet' : '💳 Debit Wallet';
  document.getElementById('walletAmount').value = '';
  document.getElementById('walletReason').value = '';
  openModal('walletModal');
}

async function submitWalletOp() {
  const userId = document.getElementById('walletUserId').value;
  const action = document.getElementById('walletAction').value;
  const amount = parseFloat(document.getElementById('walletAmount').value);
  const type   = document.getElementById('walletType').value;
  const reason = document.getElementById('walletReason').value;
  if (!amount || amount <= 0) { toast('Enter a valid amount.', false); return; }
  const endpoint = action === 'credit' ? 'wallet_credit' : 'wallet_debit';
  const res = await apiFetch(`admin.php?action=${endpoint}`, { user_id: userId, amount, wallet_type: type, reason });
  toast(res.success ? res.message : res.error, res.success);
  if (res.success) { closeModal('walletModal'); loadUsers(usersOffset); }
}

// ── Transactions ─────────────────────────────────────────────
let txnsOffset = 0;
async function loadTxns(offset = 0, q = null) {
  if (offset < 0) return;
  txnsOffset = offset;
  const search = q !== null ? q : document.getElementById('txnSearch').value;
  const status = document.getElementById('txnStatus').value;
  document.getElementById('txnsTable').innerHTML = '<div class="loading-block"><span class="spinner"></span></div>';
  const url = `admin.php?action=transactions&limit=50&offset=${offset}${search?'&q='+encodeURIComponent(search):''}${status?'&status='+status:''}`;
  const res = await apiFetch(url, {}, 'GET');
  if (!res.success) { toast(res.error, false); return; }
  const txns = res.data.transactions;
  document.getElementById('txnCountLabel').textContent = `Showing ${txns.length} transactions`;
  document.getElementById('txnsTable').innerHTML = buildTxnTable(txns, true);
}

function buildTxnTable(txns, showRefund = false) {
  if (!txns?.length) return '<div class="loading-block">No transactions found.</div>';
  const statusBadge = s => {
    const cls = { success:'success', pending:'pending', failed:'failed', refunded:'pending', rejected:'failed' };
    return `<span class="badge-status badge-${cls[s]||'pending'}">${s}</span>`;
  };
  let html = `<table><thead><tr><th>TXN ID</th><th>Sender</th><th>Receiver</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th>${showRefund?'<th>Actions</th>':''}</tr></thead><tbody>`;
  txns.forEach(t => {
    html += `<tr>
      <td style="font-family:monospace;font-size:12px">${esc(t.txn_id)}</td>
      <td>${esc(t.sender_name||t.sender_email||'–')}</td>
      <td>${esc(t.receiver_name||t.receiver_email||'–')}</td>
      <td style="color:var(--accent)">₹${Number(t.amount).toLocaleString()}</td>
      <td>${esc(t.method)}</td>
      <td>${statusBadge(t.status)}</td>
      <td>${t.created_at?.split('T')[0]||'–'}</td>
      ${showRefund && t.status==='success' ? `<td><button class="btn btn-warn btn-sm" onclick="refundTxn('${esc(t.txn_id)}')">Refund</button></td>` : showRefund ? '<td>–</td>' : ''}
    </tr>`;
  });
  return html + '</tbody></table>';
}

async function refundTxn(txnId) {
  if (!confirm('Refund transaction ' + txnId + '?')) return;
  const res = await apiFetch('admin.php?action=refund', { txn_id: txnId });
  toast(res.success ? res.message : res.error, res.success);
  if (res.success) loadTxns(txnsOffset);
}

// ── Cards ────────────────────────────────────────────────────
async function loadCards() {
  document.getElementById('cardsTable').innerHTML = '<div class="loading-block"><span class="spinner"></span></div>';
  // Uses users list — each user has one card
  const res = await apiFetch('admin.php?action=users&limit=200&offset=0', {}, 'GET');
  if (!res.success) return;
  let html = `<table><thead><tr><th>Holder</th><th>Email</th><th>Card Number</th><th>Expiry</th><th>Status</th></tr></thead><tbody>`;
  for (const u of res.data.users) {
    const cr = await apiFetch(`admin.php?action=user_detail&user_id=${u.id}`, {}, 'GET');
    const card = cr.data?.card;
    if (!card) continue;
    const badge = card.is_frozen ? '<span class="badge-status badge-frozen">Frozen</span>' : '<span class="badge-status badge-success">Active</span>';
    html += `<tr>
      <td>${esc(u.full_name)}</td>
      <td>${esc(u.email)}</td>
      <td style="font-family:monospace">${esc(card.card_number)}</td>
      <td>${card.expiry_month}/${card.expiry_year}</td>
      <td>${badge}</td>
    </tr>`;
  }
  html += '</tbody></table>';
  document.getElementById('cardsTable').innerHTML = html;
}

// ── Audit Logs ───────────────────────────────────────────────
let auditOffset = 0;
async function loadAudit(offset = 0) {
  if (offset < 0) return;
  auditOffset = offset;
  document.getElementById('auditTable').innerHTML = '<div class="loading-block"><span class="spinner"></span></div>';
  const res = await apiFetch(`admin.php?action=audit_logs&limit=100&offset=${offset}`, {}, 'GET');
  if (!res.success) { toast(res.error, false); return; }
  const logs = res.data.logs;
  document.getElementById('auditCountLabel').textContent = `Showing ${logs.length} logs`;
  if (!logs.length) { document.getElementById('auditTable').innerHTML = '<div class="loading-block">No audit logs.</div>'; return; }
  let html = `<table><thead><tr><th>Action</th><th>User</th><th>Details</th><th>IP</th><th>Date</th></tr></thead><tbody>`;
  logs.forEach(l => {
    html += `<tr>
      <td><span class="badge-status badge-pending">${esc(l.action)}</span></td>
      <td>${esc(l.user_name||'–')}</td>
      <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis">${esc(l.details)}</td>
      <td style="font-family:monospace;font-size:12px">${esc(l.ip_address)}</td>
      <td>${l.created_at?.replace('T',' ').slice(0,19)||'–'}</td>
    </tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('auditTable').innerHTML = html;
}

// ── Notifications ─────────────────────────────────────────────
async function sendNotif(broadcast) {
  const userId  = document.getElementById('notifUserId').value.trim();
  const title   = document.getElementById('notifTitle').value.trim();
  const message = document.getElementById('notifMsg').value.trim();
  if (!title || !message) { toast('Title and message required.', false); return; }
  let res;
  if (broadcast) {
    res = await apiFetch('admin.php?action=broadcast', { title, message });
  } else {
    if (!userId) { toast('Enter a User ID to send to a specific user.', false); return; }
    res = await apiFetch('admin.php?action=send_notification', { user_id: userId, title, message });
  }
  toast(res.success ? res.message : res.error, res.success);
  if (res.success) { document.getElementById('notifTitle').value=''; document.getElementById('notifMsg').value=''; }
}

// ── Utility ───────────────────────────────────────────────────
function esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Init ─────────────────────────────────────────────────────
<?php if ($isLoggedIn): ?>
loadDashboard();
// Mobile sidebar toggle
if (window.innerWidth <= 768) {
  document.getElementById('sidebarToggle').style.display = 'flex';
}
<?php endif; ?>
</script>
</body>
</html>
