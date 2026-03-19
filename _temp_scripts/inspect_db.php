<?php
require_once 'wp-load.php';
global $wpdb;

$columns = $wpdb->get_results("SHOW COLUMNS FROM dogshow", ARRAY_A);
echo "<h3>[dogshow Table Columns]</h3><pre>";
print_r($columns);
echo "</pre>";

$st_table = $wpdb->get_var("SHOW TABLES LIKE 'stylist'");
if ($st_table) {
    $columns_st = $wpdb->get_results("SHOW COLUMNS FROM stylist", ARRAY_A);
    echo "<h3>[stylist Table Columns]</h3><pre>";
    print_r($columns_st);
    echo "</pre>";
} else {
    echo "<h3>stylist 테이블이 아직 없습니다.</h3>";
}
