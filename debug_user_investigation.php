<?php
header('Content-Type: application/json');
require_once('bridg.php');

$db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
if ($db->connect_error) {
    die(json_encode(['error' => $db->connect_error]));
}

$id = 'zkfnth01';

// 1. 회원 정보 확인
$res = $db->query("SELECT mid, id, name, hp, birth FROM memTab WHERE id = '$id'");
$users = [];
while($row = $res->fetch_assoc()) $users[] = $row;

// 2. 이 회원의 모든 신청 내역 확인
$tables = [
    'dogshow_applicant',
    'stylist_applicant',
    'stylist_intl_applicant',
    'sports_applicant',
    'agility_applicant',
    'discdog_applicant',
    'flyball_applicant',
    'seminar_applicant',
    'breed_exam_applicant'
];

$apps = [];
foreach ($tables as $table) {
    $res = $db->query("SELECT * FROM `$table` WHERE handler_id = '$id'");
    while($row = $res->fetch_assoc()) {
        $row['__table'] = $table;
        $apps[] = $row;
    }
}

echo json_encode(['users' => $users, 'apps' => $apps]);
$db->close();
?>
