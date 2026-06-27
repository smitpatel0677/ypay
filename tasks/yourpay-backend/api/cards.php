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
    case 'get':       handleGetCard($pdo);    break;
    case 'freeze':    handleFreezeCard($pdo); break;
    case 'unfreeze':  handleUnfreezeCard($pdo); break;
    case 'replace':   handleReplaceCard($pdo); break;
    case 'show_cvv':  handleShowCvv($pdo);   break;
    case 'request':   handleCardRequest($pdo); break;
    case 'respond':   handleCardResponse($pdo); break;
    case 'pending':   handlePendingRequests($pdo); break;
    default: jsonError('Unknown action.', 404);
}

function handleGetCard(PDO $pdo): void {
    $userId = $_SESSION['user_id'];
    $stmt = $pdo->prepare('SELECT id, user_id, card_number, expiry_month, expiry_year, holder_name, theme, is_frozen FROM virtual_cards WHERE user_id = ?');
    $stmt->execute([$userId]);
    $card = $stmt->fetch();
    if (!$card) { jsonError('Card not found.', 404); return; }
    jsonSuccess(['card' => $card]);
}

function handleFreezeCard(PDO $pdo): void {
    $userId = $_SESSION['user_id'];
    $body = getJsonBody();
    $pin  = $body['pin'] ?? '';
    $user = getUserRow($pdo, $userId);
    if (!password_verify($pin, $user['pin_hash'])) { jsonError('Incorrect PIN.'); return; }
    $pdo->prepare('UPDATE virtual_cards SET is_frozen = 1 WHERE user_id = ?')->execute([$userId]);
    auditLog($pdo, $userId, $user['full_name'], AUDIT_CARD_FREEZE, 'Card frozen by user.', getClientIp());
    jsonSuccess([], 'Card frozen successfully.');
}

function handleUnfreezeCard(PDO $pdo): void {
    $userId = $_SESSION['user_id'];
    $body = getJsonBody();
    $pin  = $body['pin'] ?? '';
    $user = getUserRow($pdo, $userId);
    if (!password_verify($pin, $user['pin_hash'])) { jsonError('Incorrect PIN.'); return; }
    $pdo->prepare('UPDATE virtual_cards SET is_frozen = 0 WHERE user_id = ?')->execute([$userId]);
    auditLog($pdo, $userId, $user['full_name'], AUDIT_CARD_UNFREEZE, 'Card unfrozen by user.', getClientIp());
    jsonSuccess([], 'Card unfrozen successfully.');
}

function handleReplaceCard(PDO $pdo): void {
    $userId = $_SESSION['user_id'];
    $body = getJsonBody();
    $pin  = $body['pin'] ?? '';
    $user = getUserRow($pdo, $userId);
    if (!password_verify($pin, $user['pin_hash'])) { jsonError('Incorrect PIN.'); return; }

    $cardNum = implode(' ', array_map(fn() => str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT), range(1, 4)));
    $cvv     = str_pad(rand(100, 999), 3, '0', STR_PAD_LEFT);
    $expMo   = str_pad(rand(1, 12), 2, '0', STR_PAD_LEFT);
    $expYr   = substr(strval(date('Y') + 3), -2);

    $pdo->prepare('UPDATE virtual_cards SET card_number=?, cvv_hash=?, expiry_month=?, expiry_year=?, is_frozen=0 WHERE user_id=?')
        ->execute([$cardNum, password_hash($cvv, PASSWORD_BCRYPT), $expMo, $expYr, $userId]);

    auditLog($pdo, $userId, $user['full_name'], AUDIT_CARD_REPLACE, 'Card replaced by user.', getClientIp());
    jsonSuccess(['card_number' => $cardNum, 'expiry_month' => $expMo, 'expiry_year' => $expYr], 'Card replaced successfully.');
}

function handleShowCvv(PDO $pdo): void {
    $userId = $_SESSION['user_id'];
    $body = getJsonBody();
    $pin  = $body['pin'] ?? '';
    $user = getUserRow($pdo, $userId);
    if (!password_verify($pin, $user['pin_hash'])) { jsonError('Incorrect PIN.'); return; }
    $stmt = $pdo->prepare('SELECT cvv_hash FROM virtual_cards WHERE user_id = ?');
    $stmt->execute([$userId]);
    $card = $stmt->fetch();
    // NOTE: In production the CVV should never be stored; returned only if truly required.
    // Here we indicate verified status only.
    jsonSuccess(['cvv_verified' => true], 'CVV access granted. Keep it confidential.');
}

// ─── Card Payment Request ────────────────────────────────────────────────────
function handleCardRequest(PDO $pdo): void {
    $requesterId = $_SESSION['user_id'];
    $body       = getJsonBody();
    $cardNumber  = sanitize($body['card_number'] ?? '');
    $amount      = floatval($body['amount'] ?? 0);

    if ($amount <= 0) { jsonError('Invalid amount.'); return; }

    // Find card owner
    $stmt = $pdo->prepare('SELECT vc.*, u.id as owner_id, u.full_name, u.is_frozen FROM virtual_cards vc JOIN users u ON u.id = vc.user_id WHERE vc.card_number = ?');
    $stmt->execute([$cardNumber]);
    $card = $stmt->fetch();
    if (!$card) { jsonError('Card not found in YourPay ecosystem.'); return; }
    if ($card['is_frozen']) { jsonError('This card is frozen and cannot be charged.'); return; }
    if ($card['owner_id'] === $requesterId) { jsonError('Cannot use your own card.'); return; }
    if ($card['is_frozen']) { jsonError('Recipient account is unavailable.'); return; }

    $expires = date('Y-m-d H:i:s', time() + CARD_REQUEST_EXPIRY_MINUTES * 60);
    $reqId   = generateUuid();
    $pdo->prepare('INSERT INTO payment_requests (id, requester_id, card_owner_id, card_number, amount, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
        ->execute([$reqId, $requesterId, $card['owner_id'], $cardNumber, $amount, $expires]);

    // Notify card owner
    $requester = getUserRow($pdo, $requesterId);
    insertNotification($pdo, $card['owner_id'], 'card_request', 'Card Payment Request',
        "Someone wants to charge ₹{$amount} using your YourPay Card.", $amount);

    jsonSuccess(['request_id' => $reqId], 'Payment request sent. Awaiting card owner approval.');
}

// ─── Accept / Reject Card Request ───────────────────────────────────────────
function handleCardResponse(PDO $pdo): void {
    $userId  = $_SESSION['user_id'];
    $body    = getJsonBody();
    $reqId   = sanitize($body['request_id'] ?? '');
    $accept  = (bool)($body['accept'] ?? false);
    $pin     = $body['pin'] ?? '';

    $stmt = $pdo->prepare('SELECT * FROM payment_requests WHERE id = ? AND card_owner_id = ? AND status = "pending"');
    $stmt->execute([$reqId, $userId]);
    $req = $stmt->fetch();
    if (!$req) { jsonError('Request not found or already processed.'); return; }

    // Check expiry
    if (strtotime($req['expires_at']) < time()) {
        $pdo->prepare('UPDATE payment_requests SET status="expired" WHERE id=?')->execute([$reqId]);
        jsonError('Request has expired.'); return;
    }

    if (!$accept) {
        $pdo->prepare('UPDATE payment_requests SET status="rejected" WHERE id=?')->execute([$reqId]);
        insertNotification($pdo, $req['requester_id'], 'card_declined', 'Payment Declined', "Your ₹{$req['amount']} card payment was declined.", $req['amount']);
        jsonSuccess([], 'Payment request rejected.');
        return;
    }

    // Accept: verify PIN, transfer funds
    $user = getUserRow($pdo, $userId);
    if (!password_verify($pin, $user['pin_hash'])) { jsonError('Incorrect PIN.'); return; }

    $senderWallet   = getWalletRowByUser($pdo, $userId, 'main');
    $receiverWallet = getWalletRowByUser($pdo, $req['requester_id'], 'main');
    if ($senderWallet['balance'] < $req['amount']) { jsonError('Insufficient balance.'); return; }

    $txnId = generateTxnId();
    $refId = generateRefId();

    $pdo->beginTransaction();
    try {
        $pdo->prepare('UPDATE wallets SET balance = balance - ? WHERE id = ? AND balance >= ?')->execute([$req['amount'], $senderWallet['id'], $req['amount']]);
        $pdo->prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?')->execute([$req['amount'], $receiverWallet['id']]);
        $pdo->prepare('UPDATE payment_requests SET status="accepted" WHERE id=?')->execute([$reqId]);

        $pdo->prepare('INSERT INTO transactions (id, txn_id, reference_id, sender_id, receiver_id, sender_wallet, receiver_wallet, amount, method, status, wallet_type, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "card", "success", "main", "Card Payment")')
            ->execute([generateUuid(), $txnId, $refId, $userId, $req['requester_id'], $senderWallet['id'], $receiverWallet['id'], $req['amount']]);

        insertNotification($pdo, $userId, 'card_approved', 'Card Payment Approved', "You approved ₹{$req['amount']} card payment.", $req['amount'], $txnId);
        insertNotification($pdo, $req['requester_id'], 'card_approved', 'Payment Approved!', "Your ₹{$req['amount']} card payment was approved.", $req['amount'], $txnId);

        $pdo->commit();
        jsonSuccess(['txn_id' => $txnId], 'Payment approved and processed!');
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonError('Payment processing failed: ' . $e->getMessage());
    }
}

function handlePendingRequests(PDO $pdo): void {
    $userId = $_SESSION['user_id'];
    $stmt = $pdo->prepare('
        SELECT pr.*, u.full_name as requester_name, u.upi_id as requester_upi
        FROM payment_requests pr
        JOIN users u ON u.id = pr.requester_id
        WHERE pr.card_owner_id = ? AND pr.status = "pending" AND pr.expires_at > NOW()
    ');
    $stmt->execute([$userId]);
    jsonSuccess(['requests' => $stmt->fetchAll()]);
}

function getWalletRowByUser(PDO $pdo, string $userId, string $type): array|false {
    $stmt = $pdo->prepare('SELECT * FROM wallets WHERE user_id = ? AND type = ? FOR UPDATE');
    $stmt->execute([$userId, $type]);
    return $stmt->fetch();
}
