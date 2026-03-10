<?php
require_once dirname(__FILE__) . '/wp-load.php';
global $wpdb;

function kkc_convert_test($text) {
    return mb_convert_encoding($text, 'EUC-KR', 'UTF-8');
}

$wpdb->query("SET NAMES 'binary'");
$old_char = $wpdb->charset;
$wpdb->charset = ''; 

$legacy_data = [
    'ds_type' => kkc_convert_test('도그쇼'),
    'ds_name' => kkc_convert_test('바이너리 테스트'),
    'ds_place' => kkc_convert_test('서울'),
    'is_multi_day' => 0
];

$res = $wpdb->insert('dogshow', $legacy_data);
$err = $wpdb->last_error;
$id = $wpdb->insert_id;

$wpdb->charset = $old_char;
$wpdb->query("SET NAMES 'utf8mb4'");

if ($res !== false) {
    echo "Success: $id\n";
    $wpdb->query("DELETE FROM dogshow WHERE ds_pid = $id");
} else {
    echo "Fail: $err\n";
}
