<?php
include 'bridg.php';
global $wpdb;
$res = $wpdb->get_results('SELECT DISTINCT ds_type FROM dogshow', ARRAY_A);
echo "DOGSHOW TYPES:\n";
print_r($res);

$res2 = $wpdb->get_results('SELECT DISTINCT ds_type FROM sports_event', ARRAY_A);
echo "\nSPORTS TYPES:\n";
print_r($res2);
?>
