<?php
header('Content-Type: application/json');
$conn = new mysqli('127.0.0.1:4550', 'kkc3349', 'kkcdog3349**', 'kkc3349');
if ($conn->connect_error) {
    die(json_encode(['error' => 'Connection failed: ' . $conn->connect_error]));
}

// 1. 모든 스타일리스트 대회 목록 조회
$conn->query("SET NAMES 'utf8mb4'");
$res = $conn->query("SELECT ds_pid, ds_name, ds_date, category FROM stylist ORDER BY ds_pid DESC LIMIT 10");
$comps = [];
while($row = $res->fetch_assoc()) $comps[] = $row;

// 2. 명확히 '(국제)'가 들어간 대회의 신청자 수 확인
$summary = [];
foreach ($comps as $c) {
    $pid = $c['ds_pid'];
    $name = $c['ds_name'];
    $cat = $c['category'];
    $is_intl = (strpos($name, '(국제)') !== false || strpos($cat, '(국제)') !== false);
    $table = $is_intl ? 'stylist_intl_applicant' : 'stylist_applicant';
    
    $cnt_res = $conn->query("SELECT COUNT(*) as cnt FROM `$table` WHERE ds_pid = $pid");
    $cnt = $cnt_res ? $cnt_res->fetch_assoc()['cnt'] : 0;
    
    // zkfnth01 이 있는지 확인
    $has_res = $conn->query("SELECT COUNT(*) as has_cnt FROM `$table` WHERE ds_pid = $pid AND handler_id = 'zkfnth01'");
    $has_user = $has_res ? $has_res->fetch_assoc()['has_cnt'] : 0;
    
    $summary[] = [
        'pid' => $pid,
        'name' => $name,
        'cat' => $cat,
        'target_table' => $table,
        'total_applicants' => $cnt,
        'zkfnth01_present' => $has_user > 0
    ];
}

echo json_encode(['competitions' => $summary]);
$conn->close();
?>
