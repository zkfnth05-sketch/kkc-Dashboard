<?php
header('Content-Type: application/json');
$table = $_GET['table'] ?? 'stylist_intl_applicant';
$conn = new mysqli('127.0.0.1:4550', 'kkc3349', 'kkcdog3349**', 'kkc3349');
if ($conn->connect_error) { die(json_encode(['error' => 'Connection failed'])); }
$res = $conn->query("DESCRIBE `$table`");
$cols = [];
while($row = $res->fetch_assoc()) $cols[] = $row;
echo json_encode(['table' => $table, 'columns' => $cols]);
$conn->close();
?>
