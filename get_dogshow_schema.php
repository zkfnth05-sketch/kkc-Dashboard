<?php
require_once 'wp-load.php';
global $wpdb;
$cols = $wpdb->get_results("DESCRIBE dogshow", ARRAY_A);
echo json_encode($cols);
