<?php
require_once('wp-load.php');
global $wpdb;
$cols = $wpdb->get_results("DESC dogTab", ARRAY_A);
print_r($cols);
?>
