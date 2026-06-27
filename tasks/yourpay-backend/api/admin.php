<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../helpers/helpers.php';

session_start();
requireAdminAuth();

$pdo    = getDB();
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'login':             handleAdminLogin($pdo);       break;
    case 'logout':            handleAdminLogout();          break;
    case 'dashboard':         handleDashboard($pdo);        break;
    case 'users':             handleUsers($pdo);            break;
    case 'user_detail':       handleUserDetail($pdo);       break;
    case 'freeze_user':       handleFreezeUser($pdo);       break;
    case 'unfreeze_user':     handleUnfreezeUser($pdo);     break;
    case 'delete_user':       handleDeleteUser($pdo);       break;
    case 'wallet_credit':     handleWalletCredit($pdo);     break;
    case 'wallet_debit':      handleWalletDebit($pdo);      break;
    case 'transactions':      handleTransactions($pdo);     break;
    case 'refund':            handleRefund($pdo);           break;
    case 'audit_logs':        handleAuditLogs($pdo);        break;
    case 'send_notification': handleSendNotif($pdo);        break;
    case 'broadcast':         handleBroadcast($pdo);        break;
    default: jsonError('Unknown action.', 404);
}

// ─── Admin Login ─────────────────────────────────────────────────────────────
function handleAdminLogin(PDO $pdo): void {
    $body     = getJsonBody();
    $username = sanitize($body['username'] ?? '');
    $password = $body['password'] ?? '';
    $stmt = $pdo->prepare('SELECT * FROM admin_users WHERE username = ? AND is_active = 1');
    $stmt->execute([$username]);
    $admin = $stmt->fetch();
    if (!$admin || !password_verify($password, $admin['password_hash'])) {
        auditLog($pdo, null, $username, 'ADMIN_LOGIN_FAILED', 'Failed admin login.', getClientIp());
        jsonError('Invalid admin credentials.'); return;
    }
    $_SESSION['admin_id']   = $admin['id'];
    $_SESSION['admin_role'] = $admin['role'];
    auditLog($pdo, $admin['id'], $admin['username'], 'ADMIN_LOGIN_SUCCESS', 'Admin logged in.', getClientIp());
    jsonSuccess(['admin' => ['id' => $admin['id'], 'username' => $admin['username'], 'role' => $admin['role']]], 'Welcome back, ' . $admin['username'] . '!');
}

function handleAdminLogout(): void {
    session_destroy();
    jsonSuccess([], 'Admin logged out.');
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
function handleDashboard(PDO $pdo): void {
    $stats = [];
    $stats['total_users']       = $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
    $stats['total_transactions'] = $pdo->query('SELECT COUNT(*) FROM transactions')->fetchColumn();
    $stats['total_wallet_balance'] = $pdo->query('SELECT SUM(balance) FROM wallets')->fetchColumn();
    $stats['todays_transactions'] = $pdo->query('SELECT COUNT(*) FROM transactions WHERE DATE(created_at) = CURDATE()')->fetchColumn();
    $stats['active_cards']      = $pdo->query('SELECT COUNT(*) FROM virtual_cards WHERE is_frozen = 0')->fetchColumn();
    $stats['pending_requests']  = $pdo->query('SELECT COUNT(*) FROM payment_requests WHERE status = "pending"')->fetchColumn();
    $stats['frozen_users']      = $pdo->query('SELECT COUNT(*) FROM users WHERE is_frozen = 1')->fetchColumn();
    jsonSuccess(['stats' => $stats]);
}

// ─── User Management ─────────────────────────────────────────────────────────
function handleUsers(PDO $pdo): void {
    $q      = sanitize($_GET['q'] ?? '');
    $limit  = min(intval($_GET['limit'] ?? 50), 200);
    $offset = intval($_GET['offset'] ?? 0);
    $params = [];
    $where  = '';
    if ($q) {
        $like  = "%{$q}%";
        $where = 'WHERE full_name LIKE ? OR email LIKE ? OR wallet_number LIKE ? OR upi_id LIKE ?';
        $params = [$like, $like, $like, $like];
    }
    $params[] = $limit; $params[] = $offset;
    $stmt = $pdo->prepare("SELECT id, full_name, email, wallet_number, upi_id, is_verified, is_frozen, member_since FROM users {$where} ORDER BY member_since DESC LIMIT ? OFFSET ?");
    $stmt->execute($params);
    $total = $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
    jsonSuccess(['users' => $stmt->fetchAll(), 'total' => $total]);
}

function handleUserDetail(PDO $pdo): void {
    $userId = sanitize($_GET['user_id'] ?? '');
    $user   = getUserRow($pdo, $userId);
    if (!$user) { jsonError('User not found.', 404); return; }
    unset($user['password_hash'], $user['pin_hash']);
    $stmt = $pdo->prepare('SELECT type, balance FROM wallets WHERE user_id = ?');
    $stmt->execute([$userId]); $wallets = $stmt->fetchAll();
    $stmt = $pdo->prepare('SELECT id, card_number, expiry_month, expiry_year, is_frozen FROM virtual_cards WHERE user_id = ?');
    $stmt->execute([$userId]); $card = $stmt->fetch();
    jsonSuccess(['user' => $user, 'wallets' => $wallets, 'card' => $card]);
}

function handleFreezeUser(PDO $pdo): void {
    $body   = getJsonBody();
    $userId = sanitize($body['user_id'] ?? '');
    $user   = getUserRow($pdo, $userId);
    if (!$user) { jsonError('User not found.'); return; }
    $pdo->prepare('UPDATE users SET is_frozen = 1 WHERE id = ?')->execute([$userId]);
    auditLog($pdo, $_SESSION['admin_id'], 'ADMIN', AUDIT_ACCOUNT_FREEZE, "Froze user {$user['email']}", getClientIp());
    jsonSuccess([], 'User account frozen.');
}

function handleUnfreezeUser(PDO $pdo): void {
    $body   = getJsonBody();
    $userId = sanitize($body['user_id'] ?? '');
    $user   = getUserRow($pdo, $userId);
    if (!$user) { jsonError('User not found.'); return; }
    $pdo->prepare('UPDATE users SET is_frozen = 0 WHERE id = ?')->execute([$userId]);
    auditLog($pdo, $_SESSION['admin_id'], 'ADMIN', AUDIT_ACCOUNT_UNFREEZE, "Unfroze user {$user['email']}", getClientIp());
    jsonSuccess([], 'User account unfrozen.');
}

function handleDeleteUser(PDO $pdo): void {
    $body   = getJsonBody();
    $userId = sanitize($body['user_id'] ?? '');
    $user   = getUserRow($pdo, $userId);
    if (!$user) { jsonError('User not found.'); return; }
    $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$userId]);
    auditLog($pdo, $_SESSION['admin_id'], 'ADMIN', AUDIT_ACCOUNT_DELETE, "Deleted user {$user['email']}", getClientIp());
    jsonSuccess([], 'User deleted.');
}

// ─── Wallet Operations ───────────────────────────────────────────────────────
function handleWalletCredit(PDO $pdo): void {
    $body       = getJsonBody();
    $userId     = sanitize($body['user_id'] ?? '');
    $amount     = floatval($body['amount'] ?? 0);
    $walletType = sanitize($body['wallet_type'] ?? 'main');
    $reason     = sanitize($body['reason'] ?? 'Admin credit');
    if ($amount <= 0) { jsonError('Invalid amount.'); return; }

    $pdo->prepare('UPDATE wallets SET balance = balance + ? WHERE user_id = ? AND type = ?')->execute([$amount, $userId, $walletType]);
    $user = getUserRow($pdo, $userId);
    insertNotification($pdo, $userId, 'admin_credit', 'Wallet Credited', "₹{$amount} has been credited to your {$walletType} wallet by admin. Reason: {$reason}", $amount);
    auditLog($pdo, $_SESSION['admin_id'], 'ADMIN', AUDIT_WALLET_CREDIT, "Credited ₹{$amount} to {$user['email']} {$walletType} wallet. Reason: {$reason}", getClientIp());
    jsonSuccess([], "₹{$amount} credited to {$walletType} wallet.");
}

function handleWalletDebit(PDO $pdo): void {
    $body       = getJsonBody();
    $userId     = sanitize($body['user_id'] ?? '');
    $amount     = floatval($body['amount'] ?? 0);
    $walletType = sanitize($body['wallet_type'] ?? 'main');
    $reason     = sanitize($body['reason'] ?? 'Admin debit');
    if ($amount <= 0) { jsonError('Invalid amount.'); return; }

    $stmt = $pdo->prepare('SELECT balance FROM wallets WHERE user_id = ? AND type = ?');
    $stmt->execute([$userId, $walletType]);
    $wallet = $stmt->fetch();
    if (!$wallet || $wallet['balance'] < $amount) { jsonError('Insufficient balance.'); return; }

    $pdo->prepare('UPDATE wallets SET balance = balance - ? WHERE user_id = ? AND type = ? AND balance >= ?')->execute([$amount, $userId, $walletType, $amount]);
    $user = getUserRow($pdo, $userId);
    insertNotification($pdo, $userId, 'admin_debit', 'Wallet Debited', "₹{$amount} has been debited from your {$walletType} wallet by admin. Reason: {$reason}", $amount);
    auditLog($pdo, $_SESSION['admin_id'], 'ADMIN', AUDIT_WALLET_DEBIT, "Debited ₹{$amount} from {$user['email']} {$walletType} wallet. Reason: {$reason}", getClientIp());
    jsonSuccess([], "₹{$amount} debited from {$walletType} wallet.");
}

// ─── Transaction Management ──────────────────────────────────────────────────
function handleTransactions(PDO $pdo): void {
    $limit  = min(intval($_GET['limit'] ?? 50), 500);
    $offset = intval($_GET['offset'] ?? 0);
    $status = sanitize($_GET['status'] ?? '');
    $q      = sanitize($_GET['q'] ?? '');
    $where  = 'WHERE 1=1';
    $params = [];
    if ($status) { $where .= ' AND t.status = ?'; $params[] = $status; }
    if ($q) { $like = "%{$q}%"; $where .= ' AND (t.txn_id LIKE ? OR s.email LIKE ? OR r.email LIKE ?)'; array_push($params, $like, $like, $like); }
    $params[] = $limit; $params[] = $offset;
    $stmt = $pdo->prepare("
        SELECT t.*, s.full_name AS sender_name, s.email AS sender_email,
               r.full_name AS receiver_name, r.email AS receiver_email
        FROM transactions t
        JOIN users s ON s.id = t.sender_id
        JOIN users r ON r.id = t.receiver_id
        {$where} ORDER BY t.created_at DESC LIMIT ? OFFSET ?
    ");
    $stmt->execute($params);
    jsonSuccess(['transactions' => $stmt->fetchAll()]);
}

function handleRefund(PDO $pdo): void {
    $body  = getJsonBody();
    $txnId = sanitize($body['txn_id'] ?? '');
    $stmt  = $pdo->prepare('SELECT * FROM transactions WHERE txn_id = ? AND status = "success"');
    $stmt->execute([$txnId]);
    $txn = $stmt->fetch();
    if (!$txn) { jsonError('Transaction not found or already refunded.'); return; }

    $pdo->beginTransaction();
    try {
        $pdo->prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?')->execute([$txn['amount'], $txn['sender_wallet']]);
        $pdo->prepare('UPDATE wallets SET balance = balance - ? WHERE id = ? AND balance >= ?')->execute([$txn['amount'], $txn['receiver_wallet'], $txn['amount']]);
        $pdo->prepare('UPDATE transactions SET status = "refunded" WHERE txn_id = ?')->execute([$txnId]);
        insertNotification($pdo, $txn['sender_id'], 'refund', 'Refund Received', "₹{$txn['amount']} refunded to your wallet.", $txn['amount'], $txnId);
        $pdo->commit();
        auditLog($pdo, $_SESSION['admin_id'], 'ADMIN', 'REFUND', "Refunded TXN {$txnId} ₹{$txn['amount']}", getClientIp());
        jsonSuccess([], 'Refund processed successfully.');
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonError('Refund failed: ' . $e->getMessage());
    }
}

// ─── Audit Logs ──────────────────────────────────────────────────────────────
function handleAuditLogs(PDO $pdo): void {
    $limit  = min(intval($_GET['limit'] ?? 100), 500);
    $offset = intval($_GET['offset'] ?? 0);
    $stmt   = $pdo->prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?');
    $stmt->execute([$limit, $offset]);
    jsonSuccess(['logs' => $stmt->fetchAll()]);
}

// ─── Notifications ───────────────────────────────────────────────────────────
function handleSendNotif(PDO $pdo): void {
    $body    = getJsonBody();
    $userId  = sanitize($body['user_id'] ?? '');
    $title   = sanitize($body['title'] ?? '');
    $message = sanitize($body['message'] ?? '');
    if (!$userId || !$title || !$message) { jsonError('user_id, title, message required.'); return; }
    insertNotification($pdo, $userId, 'announcement', $title, $message);
    jsonSuccess([], 'Notification sent.');
}

function handleBroadcast(PDO $pdo): void {
    $body    = getJsonBody();
    $title   = sanitize($body['title'] ?? '');
    $message = sanitize($body['message'] ?? '');
    if (!$title || !$message) { jsonError('title and message required.'); return; }
    $users = $pdo->query('SELECT id FROM users WHERE is_frozen = 0')->fetchAll();
    foreach ($users as $u) {
        insertNotification($pdo, $u['id'], 'announcement', $title, $message);
    }
    auditLog($pdo, $_SESSION['admin_id'], 'ADMIN', AUDIT_ADMIN_ACTION, "Broadcast: {$title}", getClientIp());
    jsonSuccess([], 'Broadcast sent to ' . count($users) . ' users.');
}

// ─── Admin Auth Guard ────────────────────────────────────────────────────────
function requireAdminAuth(): void {
    $unguarded = ['login'];
    $action    = $_GET['action'] ?? '';
    if (in_array($action, $unguarded)) return;
    if (empty($_SESSION['admin_id'])) {
        jsonError('Admin authentication required.', 401);
        exit;
    }
}
