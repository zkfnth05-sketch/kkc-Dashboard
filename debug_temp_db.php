<?php
$conn = new mysqli('localhost', 'kkc3349', 'kkcdog3349**', 'kkc3349');
$res = $conn->query("SHOW COLUMNS FROM membership_applications");
$cols = [];
while($f = $res->fetch_assoc()) $cols[] = $f['Field'];
echo json_encode($cols);
exit;
