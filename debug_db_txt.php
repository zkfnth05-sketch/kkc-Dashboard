<?php
require_once 'wp-load.php';
global $wpdb;

$sql = "INSERT INTO `dogshow` (`ds_type`, `ds_name`, `ds_date`) VALUES ('test', 'test', '2026-03-01')";
$res = $wpdb->query($sql);

echo "SUCCESS: " . ($res !== false ? 'YES' : 'NO') . "\n";
echo "ERROR: " . $wpdb->last_error . "\n";
echo "MYSQLI_ERROR: " . mysqli_error($wpdb->dbh) . "\n";
exit;
