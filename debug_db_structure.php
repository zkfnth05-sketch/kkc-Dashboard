<?php
/**
 * 🔍 데이터 구조 정밀 검사 스크립트 (Admin 1:1 대조용)
 */
header('Content-Type: text/plain; charset=utf-8');

function get_db() {
    $conn = new mysqli('localhost', 'kkc3349', 'kkcdog3349**', 'kkc3349');
    if ($conn->connect_error) die("DB Fail");
    return $conn;
}

$conn = get_db();

// 1. membership_applications 구조 확인
echo "--- [membership_applications Structure] ---\n";
$res = $conn->query("DESC membership_applications");
if ($res) {
    while($f = $res->fetch_assoc()) {
        echo "{$f['Field']} ({$f['Type']})\n";
    }
} else {
    echo "membership_applications table not found.\n";
}

// 2. dogshow_applicant 구조 확인
echo "--- [dogshow_applicant Structure] ---\n";
$res = $conn->query("DESC dogshow_applicant");
if ($res) {
    while($f = $res->fetch_assoc()) {
        echo "{$f['Field']} ({$f['Type']})\n";
    }
}

$conn->close();
