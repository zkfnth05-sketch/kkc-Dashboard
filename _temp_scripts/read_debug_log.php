<?php
$log_file = 'src/handlers/event_list_debug.log';
if (file_exists($log_file)) {
    echo file_get_contents($log_file);
} else {
    echo "Log file not found: " . $log_file;
}
exit;
