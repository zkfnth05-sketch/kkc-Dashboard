<?php
require_once 'wp-load.php';
global $wpdb;

header('Content-Type: text/plain; charset=utf-8');

$tables = ['dogshow', 'stylist', 'sports_event', 'seminar', 'breed_exam'];

foreach ($tables as $table) {
    echo "=== TABLE: $table ===\n";
    $columns = $wpdb->get_results("DESCRIBE `$table`", ARRAY_A);
    if ($columns) {
        foreach ($columns as $col) {
            echo "{$col['Field']} ({$col['Type']}) - Null: {$col['Null']}, Key: {$col['Key']}, Default: {$col['Default']}\n";
        }
    } else {
        echo "Failed or table not found.\n";
    }
    echo "\n";
}
