<?php
// ─── Shared Helper Functions ─────────────────────────────────────────────────

function generateUuid(): string {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

function generateTxnId(): string {
    return 'TXN' . strtoupper(bin2hex(random_bytes(6))) . time();
}

function generateRefId(): string {
    return 'REF' . strtoupper(bin2hex(random_bytes(5))) . rand(100, 999);
}

function sanitize(string $value): string {
    return htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
}

function getJsonBody(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

function getClientIp(): string {
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'] as $key) {
        if (!empty($_SERVER[$key])) {
            return explode(',', $_SERVER[$key])[0];
        }
    }
    return '0.0.0.0';
}

function jsonSuccess(array $data = [], string $message = 'OK', int $code = 200): void {
    http_response_code($code);
    echo json_encode(['success' => true, 'message' => $message, 'data' => $data]);
    exit;
}

function jsonError(string $message, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $message]);
    exit;
}

function requireAuth(): void {
    if (empty($_SESSION['user_id'])) {
        jsonError('Authentication required.', 401);
    }
}

function getUserRow(PDO $pdo, string $userId): array|false {
    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$userId]);
    return $stmt->fetch();
}

function insertNotification(
    PDO $pdo,
    string $userId,
    string $type,
    string $title,
    string $message,
    ?float $amount = null,
    ?string $txnId = null
): void {
    $stmt = $pdo->prepare('
        INSERT INTO notifications (id, user_id, type, title, message, amount, txn_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ');
    $stmt->execute([generateUuid(), $userId, $type, $title, $message, $amount, $txnId]);
}

function auditLog(
    PDO $pdo,
    ?string $userId,
    ?string $userName,
    string $action,
    string $details,
    string $ip
): void {
    $stmt = $pdo->prepare('
        INSERT INTO audit_logs (id, user_id, user_name, action, details, ip_address)
        VALUES (?, ?, ?, ?, ?, ?)
    ');
    $stmt->execute([generateUuid(), $userId, $userName, $action, $details, $ip]);
}
