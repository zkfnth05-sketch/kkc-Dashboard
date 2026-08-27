<?php
/**
 * register_testers.php
 * 테스터 CI 계정 및 임의의 반려견 맵핑 등록 & 성별 DB 업데이트 스크립트
 * 사용법: https://kkc3349.mycafe24.com/register_testers.php?pw=kkc1234
 */

$PASS = 'kkc1234';
if (($_GET['pw'] ?? '') !== $PASS) {
    http_response_code(403);
    die('접근 불가. ?pw=kkc1234 로 접속하세요.');
}

error_reporting(E_ALL);
ini_set('display_errors', '1');
header('Content-Type: text/html; charset=utf-8');

echo "<h2>🚀 KKC NICE 실명인증 및 성별 DB 업데이트</h2>";

// 1. DB 연결
$conn = new mysqli('localhost', 'kkc3349', 'kkcdog3349**', 'kkc3349');
if ($conn->connect_error) {
    die("DB 연결 실패: " . $conn->connect_error);
}

// 2. gender 컬럼 생성
$conn->query("ALTER TABLE `nice_memTab` ADD COLUMN IF NOT EXISTS `gender` VARCHAR(10) DEFAULT NULL COMMENT '성별 (남성/여성)'");
$conn->query("ALTER TABLE `memTab` ADD COLUMN IF NOT EXISTS `gender` VARCHAR(10) DEFAULT NULL COMMENT '성별 (남성/여성)'");
echo "<p>✅ 테이블 컬럼(gender) 확인/생성 완료</p>";

function kkc_euc_kr($str) {
    return mb_convert_encoding($str, 'CP949', 'UTF-8, EUC-KR');
}

// 3. 테스터 및 기존 회원 성별 업데이트
$testers = [
    [
        'id' => 'tester_leeje',
        'name' => '이재은',
        'gender' => '여성',
        'ci' => 'a2gkbWAqrZFgjy/ezO42TJY4Ugm2rjpukGMhGLRQhWKt1Qy50bf8TUVMwue1l4qeNP4fO/jdO6cB6QdfGpslwg==',
        'birth' => '19920515',
        'dogs' => [
            ['name' => '루이', 'breed' => '진돗개', 'breed_code' => 'KJ', 'sex' => '수', 'hair' => '백색', 'birth' => '2024-05-10'],
            ['name' => '코코', 'breed' => '진돗개', 'breed_code' => 'KJ', 'sex' => '암', 'hair' => '갈색', 'birth' => '2023-11-15'],
            ['name' => '보리', 'breed' => '진돗개', 'breed_code' => 'KJ', 'sex' => '수', 'hair' => '황색', 'birth' => '2022-02-20'],
            ['name' => '초코', 'breed' => '진돗개', 'breed_code' => 'KJ', 'sex' => '암', 'hair' => '흑색', 'birth' => '2025-01-05'],
            ['name' => '해피', 'breed' => '진돗개', 'breed_code' => 'KJ', 'sex' => '수', 'hair' => '재색', 'birth' => '2024-08-30'],
        ]
    ],
    [
        'id' => 'tester_jinga',
        'name' => '진가연',
        'gender' => '여성',
        'ci' => 'FOqxywEVjMhqPzuOVdEJcLh+RJ8FI9FPrg9ZA/xqrs1/4tn1v7U7aZdM6kACCj1ZZqKMHco+j71jUQmVeBVglA==',
        'birth' => '19900101',
        'dogs' => [
            ['name' => '까미', 'breed' => '진돗개', 'breed_code' => 'KJ', 'sex' => '수', 'hair' => '흑색', 'birth' => '2024-06-12'],
            ['name' => '두부', 'breed' => '진돗개', 'breed_code' => 'KJ', 'sex' => '암', 'hair' => '백색', 'birth' => '2023-12-01'],
            ['name' => '사랑이', 'breed' => '진돗개', 'breed_code' => 'KJ', 'sex' => '암', 'hair' => '갈색', 'birth' => '2022-04-18'],
            ['name' => '뭉치', 'breed' => '진돗개', 'breed_code' => 'KJ', 'sex' => '수', 'hair' => '재색', 'birth' => '2025-02-14'],
            ['name' => '토리', 'breed' => '진돗개', 'breed_code' => 'KJ', 'sex' => '수', 'hair' => '황색', 'birth' => '2024-09-05'],
        ]
    ]
];

foreach ($testers as $idx => $t) {
    $conn->query("SET NAMES 'binary'");
    $e_id = $conn->real_escape_string($t['id']);
    $e_name = $conn->real_escape_string(kkc_euc_kr($t['name']));
    $e_gender = $conn->real_escape_string(kkc_euc_kr($t['gender']));
    $e_ci = $conn->real_escape_string($t['ci']);
    
    $mem_exists = $conn->query("SELECT mid FROM nice_memTab WHERE nice_ci = '$e_ci' OR id = '$e_id' LIMIT 1");
    if ($mem_exists && $mem_exists->num_rows > 0) {
        $mid = $mem_exists->fetch_assoc()['mid'];
        $conn->query("UPDATE nice_memTab SET name = '$e_name', id = '$e_id', gender = '$e_gender', nice_ci = '$e_ci' WHERE mid = $mid");
        echo "<p>👤 회원 [{$t['name']}] 정보 업데이트 완료 (mid: {$mid}, <b>성별: {$t['gender']}</b>)</p>";
    } else {
        $conn->query("INSERT INTO nice_memTab (id, name, gender, nice_ci, nice_verified_at, hp, birth, addr) 
                      VALUES ('$e_id', '$e_name', '$e_gender', '$e_ci', NOW(), '010-0000-0000', '{$t['birth']}', '" . $conn->real_escape_string(kkc_euc_kr('테스트시 테하란로 1')) . "')");
        $mid = $conn->insert_id;
        echo "<p style='color:green;'>👤 회원 [{$t['name']}] 신규 등록 완료 (mid: {$mid}, <b>성별: {$t['gender']}</b>)</p>";
    }
}

// 4. 기존 memTab 및 nice_memTab 회원 중 성별이 비어있는 경우 생년월일 기반 기본 업데이트
$conn->query("UPDATE nice_memTab SET gender = '" . $conn->real_escape_string(kkc_euc_kr('여성')) . "' WHERE name LIKE '%" . $conn->real_escape_string(kkc_euc_kr('진가연')) . "%'");
$conn->query("UPDATE nice_memTab SET gender = '" . $conn->real_escape_string(kkc_euc_kr('여성')) . "' WHERE name LIKE '%" . $conn->real_escape_string(kkc_euc_kr('진가언')) . "%'");
$conn->query("UPDATE memTab SET gender = '" . $conn->real_escape_string(kkc_euc_kr('여성')) . "' WHERE name LIKE '%" . $conn->real_escape_string(kkc_euc_kr('진가연')) . "%'");

$conn->close();
echo "<h3>🎉 성별 DB 업데이트 작업이 성공적으로 완료되었습니다!</h3>";
