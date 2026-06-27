<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../helpers/helpers.php';

session_start();
requireAuth();

$pdo    = getDB();
$action = $_GET['action'] ?? '';

switch ($action) {
    case 'profile':         handleProfile($pdo);       break;
    case 'update_profile':  handleUpdateProfile($pdo); break;
    case 'change_pin':      handleChangePin($pdo);     break;
    case 'change_password': handleChangePassword($pdo); break;
    case 'wallets':         handleWallets($pdo);        break;
    case 'search':          handleSearch($pdo);         break;
    default: jsonError('Unknown action.', 404);
}

function handleProfile(PDO $pdo): void {
    $userId = $_SESSION['user_id'];
    $user   = getUserRow($pdo, $userId);
    if (!$user) { jsonError('User not found.', 404); return; }
    unset($user['password_hash'], $user['pin_hash']);
    $wallets = getWallets($pdo, $userId);
    $stmt = $pdo->prepare('SELECT id, card_number, expiry_month, expiry_year, holder_name, theme, is_frozen FROM virtual_cards WHERE user_id = ?');
    $stmt->execute([$userId]);
    $card = $stmt->fetch();
    jsonSuccess(['user' => $user, 'wallets' => $wallets, 'card' => $card]);
}

function handleUpdateProfile(PDO $pdo): void {
    $userId = $_SESSION['user_id'];
    $body   = getJsonBody();
    $fullName = sanitize($body['full_name'] ?? '');
    $profilePic = sanitize($body['profile_pic'] ?? '');
    if (!$fullName) { jsonError('Name cannot be empty.'); return; }
    $pdo->prepare('UPDATE users SET full_name = ?, profile_pic = ? WHERE id = ?')->execute([$fullName, $profilePic, $userId]);
    $user = getUserRow($pdo, $userId);
    auditLog($pdo, $userId, $user['full_name'], AUDIT_PROFILE_UPDATE, 'Profile updated.', getClientIp());
    unset($user['password_hash'], $user['pin_hash']);
    jsonSuccess(['user' => $user], 'Profile updated successfully.');
}

function handleChangePin(PDO $pdo): void {
    $userId = $_SESSION['user_id'];
    $body   = getJsonBody();
    $oldPin = $body['old_pin'] ?? '';
    $newPin = $body['new_pin'] ?? '';
    if (!preg_match('/^\d{4}$/', $newPin)) { jsonError('New PIN must be 4 digits.'); return; }
    $user = getUserRow($pdo, $userId);
    if (!password_verify($oldPin, $user['pin_hash'])) { jsonError('Current PIN is incorrect.'); return; }
    $pdo->prepare('UPDATE users SET pin_hash = ? WHERE id = ?')->execute([password_hash($newPin, PASSWORD_BCRYPT), $userId]);
    auditLog($pdo, $userId, $user['full_name'], AUDIT_PIN_CHANGE, 'Transaction PIN changed.', getClientIp());
    jsonSuccess([], 'PIN updated successfully.');
}

function handleChangePassword(PDO $pdo): void {
    $userId  = $_SESSION['user_id'];
    $body    = getJsonBody();
    $current = $body['current_password'] ?? '';
    $newPass = $body['new_password'] ?? '';
    if (strlen($newPass) < 8) { jsonError('Password must be at least 8 characters.'); return; }
    $user = getUserRow($pdo, $userId);
    if (!password_verify($current, $user['password_hash'])) { jsonError('Current password is incorrect.'); return; }
    $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([password_hash($newPass, PASSWORD_BCRYPT, ['cost' => 12]), $userId]);
    auditLog($pdo, $userId, $user['full_name'], AUDIT_PASSWORD_CHANGE, 'Password changed.', getClientIp());
    jsonSuccess([], 'Password updated successfully.');
}

function handleWallets(PDO $pdo): void {
    $userId  = $_SESSION['user_id'];
    $wallets = getWallets($pdo, $userId);
    jsonSuccess(['wallets' => $wallets]);
}

function handleSearch(PDO $pdo): void {
    $q = sanitize($_GET['q'] ?? '');
    if (strlen($q) < 2) { jsonSuccess(['users' => []]); return; }
    $like = "%{$q}%";
    $stmt = $pdo->prepare('SELECT id, full_name, upi_id, wallet_number, profile_pic, is_verified FROM users WHERE (full_name LIKE ? OR upi_id LIKE ? OR email LIKE ? OR wallet_number LIKE ?) AND is_frozen = 0 LIMIT 10');
    $stmt->execute([$like, $like, $like, $like]);
    jsonSuccess(['users' => $stmt->fetchAll()]);
}

function getWallets(PDO $pdo, string $userId): array {
    $stmt = $pdo->prepare('SELECT id, type, balance, wallet_number, upi_id FROM wallets WHERE user_id = ?');
    $stmt->execute([$userId]);
    return $stmt->fetchAll();
}
