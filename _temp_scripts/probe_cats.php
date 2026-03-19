<?php
include 'bridg.php';
global $wpdb;

function probe_cat($cat) {
    echo "--- PROBING CATEGORY: $cat ---\n";
    $input = ['mode' => 'list', 'table' => 'legacy_events', 'category' => $cat, 'limit' => 5];
    include_once 'src/handlers/event_logic.php';
    if (!function_exists('kkc_handle_event_list')) {
        echo "ERROR: kkc_handle_event_list not found.\n";
        return;
    }
    $res = kkc_handle_event_list($input);
    echo "Count: " . count($res) . "\n";
    if (!empty($res)) {
        foreach($res as $e) {
            echo "ID: {$e['ID']} | Title: {$e['title']} | Category: {$e['category']}\n";
        }
    }
    echo "\n";
}

probe_cat('도그쇼');
probe_cat('셰퍼드 전람회');
probe_cat('진도견 선발대회');
?>
