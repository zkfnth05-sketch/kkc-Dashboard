<?php
define('WP_USE_THEMES', false);
require_once 'wp-load.php';
global $wpdb;

$table = 'dogshow';
$results = $wpdb->get_results("DESCRIBE `$table`", ARRAY_A);

while (ob_get_level()) {
    ob_end_clean();
}

header('Content-Type: application/json');
if ($results) {
    echo json_encode(['success' => true, 'columns' => $results]);
} else {
    echo json_encode(['success' => false, 'error' => $wpdb->last_error]);
}
exit;
