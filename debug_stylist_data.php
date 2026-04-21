<?php
header('Content-Type: application/json');
require_once('bridg.php');

$db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
if ($db->connect_error) {
    die(json_encode(['error' => $db->connect_error]));
}

$result = [];

// 1. 국제 스타일리스트 신청자 확인
$query = "SELECT ds_pid, COUNT(*) as count FROM stylist_intl_applicant GROUP BY ds_pid";
$res = $db->query($query);
$intl = [];
while($row = $res->fetch_assoc()) $intl[] = $row;
$result['stylist_intl'] = $intl;

// 2. 일반 스타일리스트 신청자 확인
$query = "SELECT ds_pid, COUNT(*) as count FROM stylist_applicant GROUP BY ds_pid";
$res = $db->query($query);
$reg = [];
while($row = $res->fetch_assoc()) $reg[] = $row;
$result['stylist_regular'] = $reg;

// 3. 테스트로 데이터 몇 개 추출
$query = "SELECT * FROM stylist_intl_applicant LIMIT 5";
$res = $db->query($query);
$samples = [];
while($row = $res->fetch_assoc()) $samples[] = $row;
$result['samples'] = $samples;

echo json_encode($result);
$db->close();
?>
