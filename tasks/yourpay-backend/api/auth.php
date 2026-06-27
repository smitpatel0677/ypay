<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../helpers/helpers.php';

session_start();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$pdo    = getDB();

switch ($action) {
    case 'register':
        handleRegister($pdo);
        break;
    case 'login':
        handleLogin($pdo);
        break;
    case 'logout':
        handleLogout();
        break;
    case 'send_otp':
        handleSendOtp($pdo);
        break;
    case 'verify_otp':
        handleVerifyOtp($pdo);
        break;
    default:
        jsonError('Unknown action.', 404);
}

// ─── Register ────────────────────────────────────────────────────────────────
function handleRegister(PDO $pdo): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') { jsonError('POST required.', 405); return; }
    $body = getJsonBody();
    $email    = sanitize($body['email'] ?? '');
    $password = $body['password'] ?? '';
    $fullName = sanitize($body['full_name'] ?? '');
    $dob      = sanitize($body['dob'] ?? '');
    $pin      = $body['pin'] ?? '';

    if (!$email || !$password || !$fullName || !$dob || !$pin) {
        jsonError('All fields are required.'); return;
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { jsonError('Invalid email.'); return; }
    if (strlen($password) < 8)  { jsonError('Password must be at least 8 characters.'); return; }
    if (!preg_match('/^\d{4}$/', $pin)) { jsonError('PIN must be 4 digits.'); return; }

    // Check duplicate
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) { jsonError('Email already registered.'); return; }

    $username     = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', explode('@', $email)[0]));
    $walletNumber = 'YP' . strtoupper(bin2hex(random_bytes(4)));
    $upiId        = $username . '@ypay';
    $referralCode = strtoupper(substr($username, 0, 6)) . rand(10, 99);

    // Ensure UPI uniqueness
    $stmt = $pdo->prepare('SELECT id FROM users WHERE upi_id = ?');
    $stmt->execute([$upiId]);
    if ($stmt->fetch()) { $upiId = $username . rand(100, 999) . '@ypay'; }

    $pdo->beginTransaction();
    try {
        $userId = generateUuid();
        $stmt = $pdo->prepare('
            INSERT INTO users (id, email, full_name, password_hash, dob, wallet_number, upi_id, pin_hash, referral_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $userId, $email, $fullName,
            password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]),
            $dob, $walletNumber, $upiId,
            password_hash($pin, PASSWORD_BCRYPT, ['cost' => 12]),
            $referralCode,
        ]);

        // Create 3 wallets
        foreach (['main', 'savings', 'rewards'] as $type) {
            $wNum = $walletNumber . ($type === 'main' ? '' : ('-' . strtoupper($type[0])));
            $wUpi = $upiId . ($type === 'main' ? '' : ('.' . $type));
            $stmt = $pdo->prepare('INSERT INTO wallets (id, user_id, type, balance, wallet_number, upi_id) VALUES (?, ?, ?, 0.00, ?, ?)');
            $stmt->execute([generateUuid(), $userId, $type, $wNum, $wUpi]);
        }

        // Create virtual card
        $cardNum = implode(' ', array_map(fn() => str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT), range(1, 4)));
        $cvv     = str_pad(rand(100, 999), 3, '0', STR_PAD_LEFT);
        $expMo   = str_pad(rand(1, 12), 2, '0', STR_PAD_LEFT);
        $expYr   = substr(strval(date('Y') + 3), -2);
        $stmt = $pdo->prepare('INSERT INTO virtual_cards (id, user_id, card_number, cvv_hash, expiry_month, expiry_year, holder_name) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([generateUuid(), $userId, $cardNum, password_hash($cvv, PASSWORD_BCRYPT), $expMo, $expYr, strtoupper($fullName)]);

        $pdo->commit();
        auditLog($pdo, $userId, $fullName, 'REGISTER', 'New user registered.', getClientIp());
        jsonSuccess(['user_id' => $userId, 'upi_id' => $upiId, 'wallet_number' => $walletNumber], 'Registration successful!');
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonError('Registration failed: ' . $e->getMessage());
    }
}

// ─── Login ───────────────────────────────────────────────────────────────────
function handleLogin(PDO $pdo): void {
    $body     = getJsonBody();
    $email    = sanitize($body['email'] ?? '');
    $password = $body['password'] ?? '';

    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        auditLog($pdo, null, $email, AUDIT_LOGIN_FAILED, 'User not found.', getClientIp());
        jsonError('No account found with this email.'); return;
    }
    if ($user['is_frozen']) {
        auditLog($pdo, $user['id'], $user['full_name'], AUDIT_LOGIN_FAILED, 'Login on frozen account.', getClientIp());
        jsonError('Your account has been frozen. Please contact support.'); return;
    }
    if (!password_verify($password, $user['password_hash'])) {
        auditLog($pdo, $user['id'], $user['full_name'], AUDIT_LOGIN_FAILED, 'Incorrect password.', getClientIp());
        // Log login history
        $stmt2 = $pdo->prepare('INSERT INTO login_history (id, user_id, ip_address, user_agent, status) VALUES (UUID(), ?, ?, ?, ?)');
        $stmt2->execute([$user['id'], getClientIp(), $_SERVER['HTTP_USER_AGENT'] ?? '', 'failed']);
        jsonError('Incorrect password.'); return;
    }

    // Success
    $stmt2 = $pdo->prepare('INSERT INTO login_history (id, user_id, ip_address, user_agent, status) VALUES (UUID(), ?, ?, ?, ?)');
    $stmt2->execute([$user['id'], getClientIp(), $_SERVER['HTTP_USER_AGENT'] ?? '', 'success']);

    auditLog($pdo, $user['id'], $user['full_name'], AUDIT_LOGIN_SUCCESS, 'Successful login.', getClientIp());
    $_SESSION['user_id'] = $user['id'];

    unset($user['password_hash'], $user['pin_hash']);
    jsonSuccess(['user' => $user], 'Login successful!');
}

// ─── Logout ──────────────────────────────────────────────────────────────────
function handleLogout(): void {
    session_destroy();
    jsonSuccess([], 'Logged out successfully.');
}

// ─── Send OTP ────────────────────────────────────────────────────────────────
function handleSendOtp(PDO $pdo): void {
    $body  = getJsonBody();
    $email = sanitize($body['email'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { jsonError('Invalid email.'); return; }

    $otp     = str_pad(rand(100000, 999999), 6, '0', STR_PAD_LEFT);
    $expires = date('Y-m-d H:i:s', time() + OTP_EXPIRY_MINUTES * 60);
    $stmt    = $pdo->prepare('INSERT INTO otp_store (id, email, otp_hash, expires_at) VALUES (UUID(), ?, ?, ?)');
    $stmt->execute([$email, password_hash($otp, PASSWORD_BCRYPT), $expires]);

    // NOTE: In production, send via EmailJS or SMTP. Here we return OTP in dev mode.
    jsonSuccess(['otp_sent' => true, 'dev_otp' => $otp], 'OTP sent to your email.');
}

// ─── Verify OTP ──────────────────────────────────────────────────────────────
function handleVerifyOtp(PDO $pdo): void {
    $body  = getJsonBody();
    $email = sanitize($body['email'] ?? '');
    $otp   = $body['otp'] ?? '';

    $stmt = $pdo->prepare('SELECT * FROM otp_store WHERE email = ? AND used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1');
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($otp, $row['otp_hash'])) {
        jsonError('Invalid or expired OTP.'); return;
    }
    $pdo->prepare('UPDATE otp_store SET used = 1 WHERE id = ?')->execute([$row['id']]);
    jsonSuccess(['verified' => true], 'OTP verified successfully.');
}
