<?php
header('Content-Type: text/plain; charset=utf-8');
require_once('bridg.php'); // assuming it can be included

// Mock input
$input = [
    'mode' => 'list',
    'table' => 'dogTab',
    'search' => '512375',
    'field' => 'uid',
    'limit' => 1
];

$res = kkc_handle_pedigree_list($input);
echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
