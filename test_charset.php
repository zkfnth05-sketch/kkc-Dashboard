<?php
require_once dirname(__FILE__) . '/wp-load.php';
global $wpdb;

// Let's connect as utf8mb4 (which WP does)
$wpdb->query("SET NAMES 'utf8mb4'");

// Test insert using UTF-8 data directly into dogshow
$data = [
    'ds_type' => '도그쇼',
    'ds_name' => 'UTF-8 테스트',
    'ds_place' => '서울',
    'ds_content' => '내용입니다.',
    'ds_date' => '2025-01-01',
    'ds_start_time' => '10:00:00',
    'ds_end_date' => '2025-01-01',
    'ds_end_time' => '18:00:00',
    'is_multi_day' => 0
];

$res = $wpdb->insert('dogshow', $data);
if ($res !== false) {
    echo "Insert Success! ID: " . $wpdb->insert_id . "\n";
    $inserted_id = $wpdb->insert_id;
    
    // Now let's try to query it normally (without SET NAMES binary)
    $row = $wpdb->get_row("SELECT ds_type, ds_name FROM dogshow WHERE ds_pid = " . $inserted_id, ARRAY_A);
    var_dump($row);
    
    // Cleanup
    $wpdb->query("DELETE FROM dogshow WHERE ds_pid = " . $inserted_id);
} else {
    echo "Insert failed: " . $wpdb->last_error . "\n";
}
