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
    case 'goals':        handleGoals($pdo);       break;
    case 'add_goal':     handleAddGoal($pdo);     break;
    case 'delete_goal':  handleDeleteGoal($pdo);  break;
    case 'contribute':   handleContribute($pdo);  break;
    default: jsonError('Unknown action.', 404);
}

function handleGoals(PDO $pdo): void {
    $userId = $_SESSION['user_id'];
    $stmt   = $pdo->prepare('SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC');
    $stmt->execute([$userId]);
    jsonSuccess(['goals' => $stmt->fetchAll()]);
}

function handleAddGoal(PDO $pdo): void {
    $userId   = $_SESSION['user_id'];
    $body     = getJsonBody();
    $name     = sanitize($body['name'] ?? '');
    $target   = floatval($body['target'] ?? 0);
    $deadline = sanitize($body['deadline'] ?? '');
    if (!$name || $target <= 0) { jsonError('Name and valid target amount required.'); return; }
    $pdo->prepare('INSERT INTO savings_goals (id, user_id, name, target, deadline) VALUES (?, ?, ?, ?, ?)')
        ->execute([generateUuid(), $userId, $name, $target, $deadline ?: null]);
    jsonSuccess([], 'Savings goal created!');
}

function handleDeleteGoal(PDO $pdo): void {
    $userId = $_SESSION['user_id'];
    $body   = getJsonBody();
    $goalId = sanitize($body['goal_id'] ?? '');
    $pdo->prepare('DELETE FROM savings_goals WHERE id = ? AND user_id = ?')->execute([$goalId, $userId]);
    jsonSuccess([], 'Goal deleted.');
}

function handleContribute(PDO $pdo): void {
    $userId = $_SESSION['user_id'];
    $body   = getJsonBody();
    $goalId = sanitize($body['goal_id'] ?? '');
    $amount = floatval($body['amount'] ?? 0);
    $pin    = $body['pin'] ?? '';

    if ($amount <= 0) { jsonError('Invalid amount.'); return; }

    $user = getUserRow($pdo, $userId);
    if (!password_verify($pin, $user['pin_hash'])) { jsonError('Incorrect PIN.'); return; }

    $mainWallet = getWalletForUser($pdo, $userId, 'main');
    $savingsWallet = getWalletForUser($pdo, $userId, 'savings');
    if (!$mainWallet || !$savingsWallet) { jsonError('Wallet not found.'); return; }
    if ($mainWallet['balance'] < $amount) { jsonError('Insufficient balance in main wallet.'); return; }

    $stmt = $pdo->prepare('SELECT * FROM savings_goals WHERE id = ? AND user_id = ?');
    $stmt->execute([$goalId, $userId]);
    $goal = $stmt->fetch();
    if (!$goal) { jsonError('Goal not found.'); return; }

    $txnId = generateTxnId();
    $refId = generateRefId();

    $pdo->beginTransaction();
    try {
        $pdo->prepare('UPDATE wallets SET balance = balance - ? WHERE id = ? AND balance >= ?')->execute([$amount, $mainWallet['id'], $amount]);
        $pdo->prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?')->execute([$amount, $savingsWallet['id']]);
        $newCurrent = $goal['current'] + $amount;
        $isComplete = $newCurrent >= $goal['target'] ? 1 : 0;
        $pdo->prepare('UPDATE savings_goals SET current = ?, is_complete = ? WHERE id = ?')->execute([$newCurrent, $isComplete, $goalId]);

        $pdo->prepare('
            INSERT INTO transactions (id, txn_id, reference_id, sender_id, receiver_id, sender_wallet, receiver_wallet, amount, method, status, wallet_type, note)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, "wallet", "success", "savings", ?)
        ')->execute([generateUuid(), $txnId, $refId, $userId, $userId, $mainWallet['id'], $savingsWallet['id'], $amount, 'Contribution to goal: ' . $goal['name']]);

        $pdo->commit();
        jsonSuccess(['txn_id' => $txnId, 'goal_current' => $newCurrent, 'is_complete' => (bool)$isComplete], 'Contribution added!');
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonError('Contribution failed: ' . $e->getMessage());
    }
}

function getWalletForUser(PDO $pdo, string $userId, string $type): array|false {
    $stmt = $pdo->prepare('SELECT * FROM wallets WHERE user_id = ? AND type = ? FOR UPDATE');
    $stmt->execute([$userId, $type]);
    return $stmt->fetch();
}
