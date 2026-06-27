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
    case 'send':        handleSendMoney($pdo);   break;
    case 'transfer':    handleTransfer($pdo);     break;
    case 'history':     handleHistory($pdo);      break;
    case 'receipt':     handleReceipt($pdo);      break;
    default: jsonError('Unknown action.', 404);
}

// ─── Send Money ──────────────────────────────────────────────────────────────
function handleSendMoney(PDO $pdo): void {
    $body       = getJsonBody();
    $userId     = $_SESSION['user_id'];
    $receiverUpi = sanitize($body['receiver_upi'] ?? '');
    $amount     = floatval($body['amount'] ?? 0);
    $method     = sanitize($body['method'] ?? 'upi');
    $note       = sanitize($body['note'] ?? '');
    $pin        = $body['pin'] ?? '';

    if ($amount < MIN_TRANSFER_AMOUNT)  { jsonError('Minimum transfer is ₹' . MIN_TRANSFER_AMOUNT); return; }
    if ($amount > MAX_TRANSFER_AMOUNT)  { jsonError('Maximum transfer is ₹' . MAX_TRANSFER_AMOUNT); return; }

    // Verify PIN
    $stmtUser = $pdo->prepare('SELECT * FROM users WHERE id = ?');
    $stmtUser->execute([$userId]);
    $sender = $stmtUser->fetch();
    if (!$sender || $sender['is_frozen']) { jsonError('Account unavailable.'); return; }

    if (!password_verify($pin, $sender['pin_hash'])) {
        jsonError('Incorrect PIN. Please try again.'); return;
    }

    // Find receiver
    $stmtRec = $pdo->prepare('SELECT * FROM users WHERE upi_id = ? OR wallet_number = ? OR email = ?');
    $stmtRec->execute([$receiverUpi, $receiverUpi, $receiverUpi]);
    $receiver = $stmtRec->fetch();
    if (!$receiver) { jsonError('Recipient not found.'); return; }
    if ($receiver['id'] === $userId) { jsonError('Cannot send money to yourself.'); return; }
    if ($receiver['is_frozen']) { jsonError('Recipient account is unavailable.'); return; }

    // Get wallets
    $senderWallet   = getWalletRow($pdo, $userId, 'main');
    $receiverWallet = getWalletRow($pdo, $receiver['id'], 'main');
    if (!$senderWallet || !$receiverWallet) { jsonError('Wallet not found.'); return; }
    if ($senderWallet['balance'] < $amount) { jsonError('Insufficient balance.'); return; }

    $txnId  = generateTxnId();
    $refId  = generateRefId();

    $pdo->beginTransaction();
    try {
        // Debit sender (balance checked by CHECK constraint)
        $pdo->prepare('UPDATE wallets SET balance = balance - ? WHERE id = ? AND balance >= ?')
            ->execute([$amount, $senderWallet['id'], $amount]);

        // Credit receiver
        $pdo->prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?')
            ->execute([$amount, $receiverWallet['id']]);

        // Record transaction
        $txnRowId = generateUuid();
        $pdo->prepare('
            INSERT INTO transactions (id, txn_id, reference_id, sender_id, receiver_id, sender_wallet, receiver_wallet, amount, method, status, wallet_type, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "success", "main", ?)
        ')->execute([$txnRowId, $txnId, $refId, $userId, $receiver['id'], $senderWallet['id'], $receiverWallet['id'], $amount, $method, $note]);

        // Notifications
        insertNotification($pdo, $userId, 'money_sent', 'Payment Sent', "You sent ₹{$amount} to {$receiver['full_name']}", $amount, $txnId);
        insertNotification($pdo, $receiver['id'], 'money_received', 'Money Received!', "{$sender['full_name']} sent you ₹{$amount}", $amount, $txnId);

        $pdo->commit();
        auditLog($pdo, $userId, $sender['full_name'], AUDIT_MONEY_TRANSFER, "Sent ₹{$amount} to {$receiver['full_name']} via {$method}. TXN: {$txnId}", getClientIp());
        jsonSuccess(['txn_id' => $txnId, 'reference_id' => $refId], 'Payment sent successfully!');
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonError('Transaction failed: ' . $e->getMessage());
    }
}

// ─── Transfer Between Own Wallets ────────────────────────────────────────────
function handleTransfer(PDO $pdo): void {
    $body       = getJsonBody();
    $userId     = $_SESSION['user_id'];
    $amount     = floatval($body['amount'] ?? 0);
    $toSavings  = (bool)($body['to_savings'] ?? true);
    $pin        = $body['pin'] ?? '';

    if ($amount <= 0) { jsonError('Invalid amount.'); return; }

    $user = $pdo->prepare('SELECT * FROM users WHERE id = ?');
    $user->execute([$userId]);
    $user = $user->fetch();
    if (!password_verify($pin, $user['pin_hash'])) { jsonError('Incorrect PIN.'); return; }

    $fromType = $toSavings ? 'main' : 'savings';
    $toType   = $toSavings ? 'savings' : 'main';

    $fromWallet = getWalletRow($pdo, $userId, $fromType);
    $toWallet   = getWalletRow($pdo, $userId, $toType);

    if (!$fromWallet || !$toWallet) { jsonError('Wallet not found.'); return; }
    if ($fromWallet['balance'] < $amount) { jsonError('Insufficient balance.'); return; }

    $txnId = generateTxnId();
    $refId = generateRefId();

    $pdo->beginTransaction();
    try {
        $pdo->prepare('UPDATE wallets SET balance = balance - ? WHERE id = ? AND balance >= ?')->execute([$amount, $fromWallet['id'], $amount]);
        $pdo->prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?')->execute([$amount, $toWallet['id']]);

        $pdo->prepare('
            INSERT INTO transactions (id, txn_id, reference_id, sender_id, receiver_id, sender_wallet, receiver_wallet, amount, method, status, wallet_type, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, "wallet", "success", ?, ?)
        ')->execute([generateUuid(), $txnId, $refId, $userId, $userId, $fromWallet['id'], $toWallet['id'], $amount, $toType, $toSavings ? 'Transfer to Savings' : 'Transfer from Savings']);

        $pdo->commit();
        auditLog($pdo, $userId, $user['full_name'], AUDIT_WALLET_CREDIT, "Self-transfer ₹{$amount} {$fromType}→{$toType}", getClientIp());
        jsonSuccess(['txn_id' => $txnId], 'Transfer successful!');
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonError('Transfer failed: ' . $e->getMessage());
    }
}

// ─── Transaction History ─────────────────────────────────────────────────────
function handleHistory(PDO $pdo): void {
    $userId = $_SESSION['user_id'];
    $limit  = min(intval($_GET['limit'] ?? 50), 200);
    $offset = intval($_GET['offset'] ?? 0);
    $status = sanitize($_GET['status'] ?? '');
    $method = sanitize($_GET['method'] ?? '');

    $where = 'WHERE (t.sender_id = ? OR t.receiver_id = ?)';
    $params = [$userId, $userId];

    if ($status) { $where .= ' AND t.status = ?'; $params[] = $status; }
    if ($method) { $where .= ' AND t.method = ?'; $params[] = $method; }

    $stmt = $pdo->prepare("
        SELECT t.*,
               s.full_name as sender_name, s.upi_id as sender_upi, s.profile_pic as sender_photo,
               r.full_name as receiver_name, r.upi_id as receiver_upi, r.profile_pic as receiver_photo
        FROM transactions t
        JOIN users s ON s.id = t.sender_id
        JOIN users r ON r.id = t.receiver_id
        {$where}
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
    ");
    $params[] = $limit;
    $params[] = $offset;
    $stmt->execute($params);
    jsonSuccess(['transactions' => $stmt->fetchAll()]);
}

// ─── Transaction Receipt ─────────────────────────────────────────────────────
function handleReceipt(PDO $pdo): void {
    $userId = $_SESSION['user_id'];
    $txnId  = sanitize($_GET['txn_id'] ?? '');
    $stmt   = $pdo->prepare('SELECT * FROM transactions WHERE txn_id = ? AND (sender_id = ? OR receiver_id = ?)');
    $stmt->execute([$txnId, $userId, $userId]);
    $txn = $stmt->fetch();
    if (!$txn) { jsonError('Transaction not found.', 404); return; }
    jsonSuccess(['transaction' => $txn]);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getWalletRow(PDO $pdo, string $userId, string $type): array|false {
    $stmt = $pdo->prepare('SELECT * FROM wallets WHERE user_id = ? AND type = ? FOR UPDATE');
    $stmt->execute([$userId, $type]);
    return $stmt->fetch();
}
