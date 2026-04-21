<?php
/**
 * 🕵️ 긴급 전수 조사 스크립트 (어제 7시 현상 재현용)
 */
header('Content-Type: text/plain; charset=utf-8');

$conn = new mysqli('localhost', 'kkc3349', 'kkcdog3349**', 'kkc3349');
if ($conn->connect_error) die("DB 연결 실패");

echo "=== [1] 사용자 정보 (zkfnth01) 정밀 대조 ===\n";
// 관리자 페이지 방식(binary)으로 정보 추출
$conn->query("SET NAMES 'binary'");
$res_user = $conn->query("SELECT mid, id, name, hp FROM memTab WHERE id = 'zkfnth01' LIMIT 1");
$u_raw = $res_user->fetch_assoc();

// kkc_constitution.php가 있다면 변환 시도
$c_path = dirname(__file__) . '/src/lib/kkc_constitution.php';
if (file_exists($c_path)) {
    require_once $c_path;
    $u = kkc_convert($u_raw, 'EUC-KR', true);
} else {
    $u = $u_raw; // 변환기 없으면 생데이터
}

echo "회원번호(mid): {$u['mid']}\n";
echo "아이디(id): {$u['id']}\n";
echo "이름(name): {$u['name']}\n";
echo "전화번호(hp): {$u['hp']}\n";

$e_id = $u['id'];
$e_mid = $u['mid'];
$e_name = $u['name'];
$e_hp = str_replace('-', '', $u['hp']);

echo "\n=== [2] 어질리티 신청 내역(agility_applicant) 실제 대역 조회 ===\n";
// 신청자 테이블은 UTF-8이므로 utf8mb4로 전환
$conn->query("SET NAMES 'utf8mb4'");

// 어떤 컬럼이 인덱스인지 확인하기 위해 모든 조건으로 다 찔러봄
$queries = [
    "MID 매칭" => "SELECT * FROM agility_applicant WHERE mid = $e_mid",
    "handler_id 매칭" => "SELECT * FROM agility_applicant WHERE handler_id = '$e_id'",
    "이름+연락처 매칭" => "SELECT * FROM agility_applicant WHERE name = '$e_name' AND REPLACE(contact, '-', '') = '$e_hp'"
];

foreach ($queries as $label => $q) {
    $res = $conn->query($q);
    echo "[$label]: " . ($res ? $res->num_rows : 0) . "건 발견\n";
    if ($res && $res->num_rows > 0) {
        $row = $res->fetch_assoc();
        echo "   -> 샘플 데이터: [mid:{$row['mid']}, handler_id:{$row['handler_id']}, name:{$row['name']}]\n";
    }
}

echo "\n=== [3] dogTab 실제 poss_id 포맷 확인 ===\n";
$conn->query("SET NAMES 'binary'");
$res_dog = $conn->query("SELECT uid, poss_id, name FROM dogTab WHERE poss_id = '$e_id' OR poss_id = '$e_mid' LIMIT 3");
while($d = $res_dog->fetch_assoc()) {
    echo "반려견: " . mb_convert_encoding($d['name'], 'UTF-8', 'CP949') . " (poss_id: {$d['poss_id']})\n";
}

$conn->close();
