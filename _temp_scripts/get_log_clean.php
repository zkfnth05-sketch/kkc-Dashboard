<?php
ob_start();
define('WP_USE_THEMES', false);
require_once 'wp-load.php';
while (ob_get_level() > 1) { ob_end_clean(); }
ob_end_clean(); 

$log_file = 'src/handlers/event_list_debug.log';
$content = file_exists($log_file) ? file_get_contents($log_file) : 'Log not found';
header('Content-Type: application/json');
echo json_encode(['success' => true, 'log' => $content]);
exit;
