<?php
/**
 * test_portal_query.php
 */
include_once 'wp-load.php';
header('Content-Type: text/plain; charset=utf-8');

$conn = new mysqli('localhost', 'kkc3349', 'kkcdog3349**', 'kkc3349');
if ($conn->connect_error) die("DB 연결 실패");

$id = 'zkfnth01';
echo "Testing for ID: $id\n";

// 1. Get user info
$res = $conn->query("SELECT * FROM memTab WHERE id = '$id' OR mid = '$id' LIMIT 1");
$u_raw = $res->fetch_assoc();
if (!$u_raw) die("User not found in memTab");

// CP949 to UTF8
$u = [];
foreach($u_raw as $k => $v) {
    $u[$k] = mb_convert_encoding($v, 'UTF-8', 'CP949');
}

$e_id = $conn->real_escape_string($u['id'] ?? ''); 
$e_name = $conn->real_escape_string($u['name'] ?? ''); 
$e_hp = str_replace('-', '', $u['hp'] ?? '');

echo "Escaped ID: $e_id\n";
echo "Escaped Name: $e_name\n";
echo "Escaped HP: $e_hp\n";

$app_table = 'stylist_intl_applicant';
$evt_table = 'stylist';
$source = '스타일리스트(국제)';

$col_res = $conn->query("SHOW COLUMNS FROM $app_table");
$actual_cols = [];
while($cf = $col_res->fetch_assoc()) {
    $actual_cols[] = $cf['Field'];
}

$cols_to_check = [];
if (in_array('reg_no', $actual_cols)) $cols_to_check[] = "NULLIF(a.reg_no, '')";
if (in_array('pedigree_number', $actual_cols)) $cols_to_check[] = "NULLIF(a.pedigree_number, '')";
if (in_array('pedigree_no', $actual_cols)) $cols_to_check[] = "NULLIF(a.pedigree_no, '')";
$col_reg = !empty($cols_to_check) ? "COALESCE(" . implode(',', $cols_to_check) . ", '')" : "''";

$col_dog = in_array('dog_name', $actual_cols) ? 'a.dog_name' : (in_array('dog_breed', $actual_cols) ? 'a.dog_breed' : (in_array('subject', $actual_cols) ? 'a.subject' : "''"));

$where = " (a.name='$e_name' AND REPLACE(a.contact,'-','')='$e_hp') ";
if (!empty($e_id)) $where = " (a.handler_id='$e_id') OR " . $where;

$sql = "SELECT DISTINCT '$source' as source, a.created_at, b.ds_name as event_title, b.ds_date as event_date, 
               a.payment_status, a.total_amount, a.options_summary,
               $col_reg as reg_no, 
               IFNULL(d.name, $col_dog) as dog_name
          FROM $app_table a 
          LEFT JOIN $evt_table b ON a.ds_pid = b.ds_pid 
          LEFT JOIN dogTab d ON $col_reg = d.reg_no AND $col_reg != ''
          WHERE $where 
          ORDER BY a.created_at DESC";

echo "\nSQL Query:\n$sql\n";

$res = $conn->query($sql);
if (!$res) {
    echo "SQL Error: " . $conn->error . "\n";
} else {
    echo "Rows found: " . $res->num_rows . "\n";
    while($r = $res->fetch_assoc()) {
        print_r($r);
    }
}

$conn->close();
