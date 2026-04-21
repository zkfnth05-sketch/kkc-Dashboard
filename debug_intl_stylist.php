<?php
/**
 * debug_intl_stylist.php
 * 반려견 스타일리스트 국제 대회 신청 내역 디버깅
 */
$conn = new mysqli('localhost', 'kkc3349', 'kkcdog3349**', 'kkc3349');
if ($conn->connect_error) die("DB 연결 실패");

$id = 'zkfnth01';

echo "--- User Info (memTab) ---\n";
$conn->query("SET NAMES 'binary'");
$res = $conn->query("SELECT * FROM memTab WHERE id = '$id'");
$u = $res->fetch_assoc();
if (!$u) {
    echo "User not found\n";
} else {
    foreach ($u as $k => $v) {
        if ($k == 'name' || $k == 'addr') $v = mb_convert_encoding($v, 'UTF-8', 'CP949');
        echo "$k: $v\n";
    }
}

$u_name = $u['name']; // EUC-KR
$u_hp = str_replace('-', '', $u['hp']);

echo "\n--- stylus_intl_applicant Table structure ---\n";
$conn->query("SET NAMES 'utf8mb4'");
$res = $conn->query("SHOW COLUMNS FROM stylist_intl_applicant");
while($row = $res->fetch_assoc()) {
    echo "[".$row['Field']."] " . $row['Type'] . "\n";
}

echo "\n--- Applications in stylist_intl_applicant for $id ---\n";
// Try searching by handler_id
$res = $conn->query("SELECT * FROM stylist_intl_applicant WHERE handler_id = '$id'");
echo "By handler_id: " . $res->num_rows . " rows found\n";
while($row = $res->fetch_assoc()) {
    print_r($row);
}

// Try searching by name and contact
$res = $conn->query("SELECT * FROM stylist_intl_applicant WHERE name = '$u_name' AND REPLACE(contact, '-', '') = '$u_hp'");
echo "By name/contact (raw): " . $res->num_rows . " rows found\n";

$u_name_utf8 = mb_convert_encoding($u_name, 'UTF-8', 'CP949');
$res = $conn->query("SELECT * FROM stylist_intl_applicant WHERE name = '$u_name_utf8' AND REPLACE(contact, '-', '') = '$u_hp'");
echo "By name/contact (utf8): " . $res->num_rows . " rows found\n";
while($row = $res->fetch_assoc()) {
    print_r($row);
}

echo "\n--- Recent events in stylist table ---\n";
$res = $conn->query("SELECT * FROM stylist ORDER BY ds_pid DESC LIMIT 5");
while($row = $res->fetch_assoc()) {
    echo "ID: " . $row['ds_pid'] . " | Title: " . $row['ds_name'] . "\n";
}

$conn->close();
