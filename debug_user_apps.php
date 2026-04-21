<?php
require_once 'wp-load.php';
global $wpdb;

$handler_id = 'zkfnth01';
echo "🔍 Searching for applications by handler_id: $handler_id\n";

$tables = [
    'agility_applicant',
    'discdog_applicant',
    'flyball_applicant',
    'sports_applicant',
    'dogshow_applicant',
    'stylist_applicant',
    'stylist_intl_applicant',
    'seminar_applicant',
    'breed_exam_applicant'
];

foreach ($tables as $table) {
    if ($wpdb->get_var("SHOW TABLES LIKE '$table'")) {
        $results = $wpdb->get_results($wpdb->prepare("SELECT id, ds_pid, name, options_summary, total_amount, created_at FROM $table WHERE handler_id = %s", $handler_id), ARRAY_A);
        if (!empty($results)) {
            echo "\n--- TABLE: $table ---\n";
            foreach ($results as $row) {
                echo "ID: {$row['id']} | DS_PID: {$row['ds_pid']} | Name: {$row['name']} | Options: " . ($row['options_summary'] ?: 'EMPTY') . " | Amount: {$row['total_amount']} | Date: {$row['created_at']}\n";
            }
        }
    }
}
