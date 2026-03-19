<?php
while (ob_get_level()) { ob_end_clean(); }
$log_file = 'handlers/event_list_debug.log';
if (file_exists($log_file)) {
    header('Content-Type: text/plain');
    echo file_get_contents($log_file);
} else {
    echo "Log file not found: " . $log_file;
}
exit;
