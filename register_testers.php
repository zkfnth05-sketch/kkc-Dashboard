<?php
/**
 * register_testers.php
 * 테스터 CI 계정 및 임의의 반려견 5마리 맵핑 등록 스크립트 (어드민 대시보드 목록 노출 포함)
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

require_once 'handlers/nice_api_handler.php';

$conn = get_kkc_portal_db();
nice_api_db_init($conn);

$testers = [
    [
        'id' => 'tester_leeje',
        'name' => '이재은',
        'ci' => 'a2gkbWAqrZFgjy/ezO42TJY4Ugm2rjpukGMhGLRQhWKt1Qy50bf8TUVMwue1l4qeNP4fO/jdO6cB6QdfGpslwg==',
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
        'name' => '진가언',
        'ci' => 'FOqxywEVjMhqPzuOVdEJcLh+RJ8FI9FPrg9ZA/xqrs1/4tn1v7U7aZdM6kACCj1ZZqKMHco+j71jUQmVeBVglA==',
        'dogs' => [
            ['name' => '까미', 'breed' => '진돗개', 'breed_code' => 'KJ', 'sex' => '수', 'hair' => '흑색', 'birth' => '2024-06-12'],
            ['name' => '두부', 'breed' => '진돗개', 'breed_code' => 'KJ', 'sex' => '암', 'hair' => '백색', 'birth' => '2023-12-01'],
            ['name' => '사랑이', 'breed' => '진돗개', 'breed_code' => 'KJ', 'sex' => '암', 'hair' => '갈색', 'birth' => '2022-04-18'],
            ['name' => '뭉치', 'breed' => '진돗개', 'breed_code' => 'KJ', 'sex' => '수', 'hair' => '재색', 'birth' => '2025-02-14'],
            ['name' => '토리', 'breed' => '진돗개', 'breed_code' => 'KJ', 'sex' => '수', 'hair' => '황색', 'birth' => '2024-09-05'],
        ]
    ]
];

echo "<h2>👥 테스터 및 반려견 DB 등록 결과 (대시보드 연동)</h2>";

foreach ($testers as $idx => $t) {
    // ────────── 1. nice_memTab 등록 (EUC-KR) ──────────
    $conn->query("SET NAMES 'binary'");
    
    $e_id = $conn->real_escape_string($t['id']);
    $e_name = $conn->real_escape_string(kkc_convert($t['name'], 'EUC-KR', false));
    $e_ci = $conn->real_escape_string($t['ci']);
    
    $mem_exists = $conn->query("SELECT mid FROM nice_memTab WHERE nice_ci = '$e_ci' LIMIT 1");
    if ($mem_exists && $mem_exists->num_rows > 0) {
        $row = $mem_exists->fetch_assoc();
        $mid = $row['mid'];
        $conn->query("UPDATE nice_memTab SET name = '$e_name', id = '$e_id' WHERE nice_ci = '$e_ci'");
        echo "<p>👤 테스터 [{$t['name']}] 회원 정보 업데이트 완료 (mid: {$mid})</p>";
    } else {
        $conn->query("INSERT INTO nice_memTab (id, name, nice_ci, nice_verified_at, hp, birth, addr) 
                      VALUES ('$e_id', '$e_name', '$e_ci', NOW(), '010-0000-0000', '19900101', '" . $conn->real_escape_string(kkc_convert('테스트시 테하란로 1', 'EUC-KR', false)) . "')");
        $mid = $conn->insert_id;
        echo "<p style='color:green; font-weight:bold;'>👤 테스터 [{$t['name']}] 신규 회원 등록 성공 (mid: {$mid})</p>";
    }
    
    // ────────── 2. 반려견 등록 ──────────
    $dog_seq = 1;
    foreach ($t['dogs'] as $dog) {
        $prefix = "KJ-C65" . ($idx + 1) . "0" . $dog_seq; // 예: KJ-C65101, KJ-C65201
        $order_no = "TEST-ORDER-" . $prefix;
        
        // 2-A. nice_dogTab 등록/업데이트 (EUC-KR)
        $conn->query("SET NAMES 'binary'");
        
        $e_reg = $conn->real_escape_string(kkc_convert($prefix, 'EUC-KR', false));
        $e_fullname = $conn->real_escape_string(kkc_convert($dog['name'], 'EUC-KR', false));
        $e_breed_code = $conn->real_escape_string(kkc_convert($dog['breed_code'], 'EUC-KR', false));
        $e_sex = $conn->real_escape_string(kkc_convert($dog['sex'], 'EUC-KR', false));
        $e_hair = $conn->real_escape_string(kkc_convert($dog['hair'], 'EUC-KR', false));
        $e_birth = $conn->real_escape_string(kkc_convert($dog['birth'], 'EUC-KR', false));
        $e_poss_name = $e_name;
        $e_poss_addr = $conn->real_escape_string(kkc_convert('테스트시 테하란로 1', 'EUC-KR', false));
        // DB 테이블의 reg_date는 varchar(10) 이므로 YYYY-MM-DD로 저장해야 함 (Data too long 오류 방지)
        $e_reg_date = $conn->real_escape_string(kkc_convert(date('Y-m-d'), 'EUC-KR', false));
        
        $dog_exists = $conn->query("SELECT uid FROM nice_dogTab WHERE reg_no = '$e_reg' LIMIT 1");
        if ($dog_exists && $dog_exists->num_rows > 0) {
            $duid = $dog_exists->fetch_assoc()['uid'];
            $conn->query("UPDATE nice_dogTab SET 
                fullname = '$e_fullname', name = '$e_fullname', dog_class = '$e_breed_code', 
                sex = '$e_sex', hair = '$e_hair', birth = '$e_birth', poss_id = '$e_id', 
                poss_name = '$e_poss_name', poss_addr = '$e_poss_addr', reg_date = '$e_reg_date' 
                WHERE uid = $duid");
            echo "   🐶 반려견 [{$dog['name']}] ($prefix) nice_dogTab 정보 업데이트 완료<br>";
        } else {
            $conn->query("INSERT INTO nice_dogTab (
                reg_no, fullname, name, dog_class, sex, hair, birth,
                poss_id, poss_name, poss_addr, breed_name, breed_addr,
                fa_regno, mo_regno, fa_name, mo_name, reg_date, saho_eng, saho, anc_name, anc_saho
            ) VALUES (
                '$e_reg', '$e_fullname', '$e_fullname', '$e_breed_code', '$e_sex', '$e_hair', '$e_birth',
                '$e_id', '$e_poss_name', '$e_poss_addr', '" . $conn->real_escape_string(kkc_convert('번식자테스트', 'EUC-KR', false)) . "', '$e_poss_addr',
                '', '', '', '', '$e_reg_date', '', '', '', ''
            )");
            echo "   🐶 <span style='color:green'>반려견 [{$dog['name']}] ($prefix) nice_dogTab 신규 등록 완료</span><br>";
        }
        
        // 2-B. nice_pedigree_requests 등록/업데이트 (어드민 대시보드 노출용 - UTF-8)
        $conn->query("SET NAMES 'utf8mb4'");
        
        $ue_order = $conn->real_escape_string($order_no);
        $ue_name = $conn->real_escape_string($dog['name']);
        $ue_reg = $conn->real_escape_string($prefix);
        $ue_ci = $conn->real_escape_string($t['ci']);
        $ue_id = $conn->real_escape_string($t['id']);
        $ue_req_name = $conn->real_escape_string($t['name']);
        $ue_breed_code = $conn->real_escape_string($dog['breed']);
        $ue_sex = $conn->real_escape_string($dog['sex']);
        $ue_hair = $conn->real_escape_string($dog['hair']);
        $ue_birth = $conn->real_escape_string($dog['birth']);
        // DB 테이블의 reg_date는 varchar(10) 이므로 YYYY-MM-DD로 저장해야 함 (Data too long 오류 방지)
        $ue_reg_date = $conn->real_escape_string(date('Y-m-d'));
        
        $req_exists = $conn->query("SELECT uid FROM nice_pedigree_requests WHERE order_no = '$ue_order' LIMIT 1");
        if ($req_exists && $req_exists->num_rows > 0) {
            $ruid = $req_exists->fetch_assoc()['uid'];
            $conn->query("UPDATE nice_pedigree_requests SET 
                name = '$ue_name', reg_no = '$ue_reg', poss_ci = '$ue_ci', petpin = '$ue_id',
                req_name = '$ue_req_name', dog_classTab_name = '$ue_breed_code', sex = '$ue_sex',
                hair = '$ue_hair', birth = '$ue_birth', reg_date = '$ue_reg_date', status = 'Y'
                WHERE uid = $ruid");
            echo "   📋 어드민 심사 내역(nice_pedigree_requests) 업데이트 완료 (상태: 발급완료)<br>";
        } else {
            $conn->query("INSERT INTO nice_pedigree_requests (
                req_name, req_mobile, poss_ci, petpin, order_no, order_dttm, req_gbn, reg_no,
                name, dog_classTab_name, sex, hair, breed_name, breed_addr, poss_name, poss_addr,
                birth, reg_date, status, created_at
            ) VALUES (
                '$ue_req_name', '01000000000', '$ue_ci', '$ue_id', '$ue_order', '" . date('YmdHis') . "', '1', '$ue_reg',
                '$ue_name', '$ue_breed_code', '$ue_sex', '$ue_hair', '번식자테스트', '테스트시 테헤란로 1', '$ue_req_name', '테스트시 테헤란로 1',
                '$ue_birth', '$ue_reg_date', 'Y', NOW()
            )");
            echo "   📋 <span style='color:blue'>어드민 심사 내역(nice_pedigree_requests) 신규 등록 완료 (상태: 발급완료)</span><br>";
        }
        
        $dog_seq++;
    }
    echo "<hr>";
}

$conn->close();
echo "<h3>✅ 어드민 대시보드 동기화를 포함한 모든 작업이 완료되었습니다!</h3>";
