<?php
require_once 'wp-load.php';
$log_file = 'src/handlers/event_list_debug.log';
$content = file_exists($log_file) ? file_get_contents($log_file) : 'Log not found';
header('Content-Type: application/json');
echo json_encode(['success' => true, 'log' => $content]);
exit;
