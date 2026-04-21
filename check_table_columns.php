<?php
require_once 'wp-load.php';
global $wpdb;

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
    echo "--- TABLE: $table ---\n";
    $columns = $wpdb->get_results("SHOW COLUMNS FROM `$table`", ARRAY_A);
    foreach ($columns as $col) {
        if ($col['Field'] === 'options_summary' || $col['Field'] === 'total_amount') {
            echo "✅ FOUND: {$col['Field']}\n";
        }
    }
    echo "\n";
}
