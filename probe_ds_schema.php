<?php
require_once 'wp-load.php';
global $wpdb;

$columns = $wpdb->get_results("SHOW COLUMNS FROM dogshow", ARRAY_A);
echo json_encode($columns, JSON_PRETTY_PRINT);
