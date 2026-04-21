<?php
header('Content-Type: application/json');
$conn = new mysqli('localhost', 'kkc3349', 'kkcdog3349**', 'kkc3349');
if ($conn->connect_error) {
    die(json_encode(['error' => 'Connection failed: ' . $conn->connect_error]));
}

$id = 'zkfnth01';

// 1. 회원 정보 (memTab)
$conn->query("SET NAMES 'binary'");
$res = $conn->query("SELECT mid, id, name, hp FROM memTab WHERE id = '$id'");
$users = [];
while($row = $res->fetch_assoc()) $users[] = $row;

// 2. 모든 테이블에서 이 ID로 신청한 내역이 있는지 확인
$tables = [
    'dogshow_applicant', 'stylist_applicant', 'stylist_intl_applicant', 
    'sports_applicant', 'agility_applicant', 'discdog_applicant', 
    'flyball_applicant', 'seminar_applicant', 'breed_exam_applicant'
];

$conn->query("SET NAMES 'utf8mb4'");
$summary = [];
foreach ($tables as $t) {
    $res = $conn->query("SELECT COUNT(*) as cnt FROM `$t` WHERE handler_id = '$id'");
    if ($res) {
        $count = $res->fetch_assoc()['cnt'];
        if ($count > 0) $summary[$t] = $count;
        
        // 데이터 하나만 샘플로
        $res2 = $conn->query("SELECT * FROM `$t` WHERE handler_id = '$id' LIMIT 1");
        if ($res2 && $res2->num_rows > 0) {
            $summary[$t . '_sample'] = $res2->fetch_assoc();
        }
    }
}

echo json_encode(['users' => $users, 'summary' => $summary]);
$conn->close();
?>
