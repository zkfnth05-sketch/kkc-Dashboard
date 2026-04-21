<?php
header('Content-Type: text/plain; charset=utf-8');
$conn = new mysqli('localhost', 'kkc3349', 'kkcdog3349**', 'kkc3349');
if ($conn->connect_error) die("DB Fail");

echo "--- [dogTab Columns] ---\n";
$res = $conn->query("DESC dogTab");
while($row = $res->fetch_assoc()) {
    echo "{$row['Field']} ({$row['Type']})\n";
}

$conn->close();
