<?php
require_once 'wp-load.php';
global $wpdb;

$sql = "INSERT INTO `dogshow` (`ds_type`, `ds_name`, `ds_date`) VALUES ('테스트', '테스트', '2026-03-01')";
$res = $wpdb->query($sql);

header('Content-Type: application/json');
echo json_encode([
    'success' => $res !== false,
    'error' => $wpdb->last_error,
    'query' => $wpdb->last_query,
    'mysqli_error' => mysqli_error($wpdb->dbh)
]);
exit;
