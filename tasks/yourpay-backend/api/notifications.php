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
    case 'list':       handleList($pdo);    break;
    case 'mark_read':  handleMarkRead($pdo); break;
    case 'mark_all':   handleMarkAll($pdo);  break;
    case 'delete':     handleDelete($pdo);   break;
    case 'unread':     handleUnreadCount($pdo); break;
    default: jsonError('Unknown action.', 404);
}

function handleList(PDO $pdo): void {
    $userId = $_SESSION['user_id'];
    $limit  = min(intval($_GET['limit'] ?? 50), 100);
    $stmt   = $pdo->prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?');
    $stmt->execute([$userId, $limit]);
    jsonSuccess(['notifications' => $stmt->fetchAll()]);
}

function handleMarkRead(PDO $pdo): void {
    $userId = $_SESSION['user_id'];
    $body   = getJsonBody();
    $notifId = sanitize($body['notif_id'] ?? '');
    $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')->execute([$notifId, $userId]);
    jsonSuccess([], 'Marked as read.');
}

function handleMarkAll(PDO $pdo): void {
    $userId = $_SESSION['user_id'];
    $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?')->execute([$userId]);
    jsonSuccess([], 'All notifications marked as read.');
}

function handleDelete(PDO $pdo): void {
    $userId  = $_SESSION['user_id'];
    $body    = getJsonBody();
    $notifId = sanitize($body['notif_id'] ?? '');
    $pdo->prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?')->execute([$notifId, $userId]);
    jsonSuccess([], 'Notification deleted.');
}

function handleUnreadCount(PDO $pdo): void {
    $userId = $_SESSION['user_id'];
    $stmt   = $pdo->prepare('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0');
    $stmt->execute([$userId]);
    jsonSuccess(['count' => (int)$stmt->fetch()['count']]);
}
