<?php
require_once 'wp-load.php';
global $wpdb;

$id = $_GET['id'] ?? 859;
$row = $wpdb->get_row($wpdb->prepare("SELECT * FROM dogshow WHERE ds_pid = %d", $id), ARRAY_A);

header('Content-Type: application/json');
echo json_encode($row);
exit;
