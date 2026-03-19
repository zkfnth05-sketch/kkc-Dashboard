<?php
require_once 'wp-load.php';
global $wpdb;
$cols = $wpdb->get_results("DESCRIBE dogshow_applicant", ARRAY_A);
echo json_encode($cols, JSON_PRETTY_PRINT);
