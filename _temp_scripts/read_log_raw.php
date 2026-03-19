<?php
ob_start();
define('WP_USE_THEMES', false);
require_once 'wp-load.php';
$output_to_ignore = ob_get_clean();

$log_file = dirname(__FILE__) . '/src/handlers/event_list_debug.log';
if (file_exists($log_file)) {
    header('Content-Type: text/plain; charset=utf-8');
    echo file_get_contents($log_file);
} else {
    echo "Log file not found at: " . $log_file;
    // Try alternate path just in case
    $log_file_alt = dirname(__FILE__) . '/handlers/event_list_debug.log';
    if (file_exists($log_file_alt)) {
        echo "\nFound at alt path: " . $log_file_alt . "\n";
        echo file_get_contents($log_file_alt);
    }
}
exit;
