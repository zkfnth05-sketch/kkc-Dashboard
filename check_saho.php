<?php
require_once('wp-load.php');
global $wpdb;

$id = 'zkfnth01';
$row = $wpdb->get_row($wpdb->prepare("SELECT mid, id, name, saho, saho_eng FROM memTab WHERE id = %s", $id), ARRAY_A);
echo "ZKFNTH01 Data:\n";
print_r($row);

$id2 = 'rlaghddlf';
$row2 = $wpdb->get_row($wpdb->prepare("SELECT mid, id, name, saho, saho_eng FROM memTab WHERE id = %s", $id2), ARRAY_A);
echo "\nRLAGHDDLF Data:\n";
print_r($row2);
?>
