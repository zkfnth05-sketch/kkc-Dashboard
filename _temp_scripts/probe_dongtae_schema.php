<?php
require_once 'wp-load.php';
global $wpdb;
$row = $wpdb->get_results("DESCRIBE dongtaeTab", ARRAY_A);
echo json_encode($row);
