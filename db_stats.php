<?php
include 'bridg.php';
global $wpdb;

$results = $wpdb->get_results("SELECT ds_type, COUNT(*) as cnt FROM dogshow GROUP BY ds_type", ARRAY_A);
echo "DOGSHOW TABLE STATISTICS:\n";
foreach($results as $r) {
    $type = $r['ds_type'] ?: '(EMPTY)';
    echo "Type: $type | Count: {$r['cnt']}\n";
}

$results2 = $wpdb->get_results("SELECT ds_type, COUNT(*) as cnt FROM sports_event GROUP BY ds_type", ARRAY_A);
echo "\nSPORTS_EVENT TABLE STATISTICS:\n";
foreach($results2 as $r) {
    $type = $r['ds_type'] ?: '(EMPTY)';
    echo "Type: $type | Count: {$r['cnt']}\n";
}
?>
