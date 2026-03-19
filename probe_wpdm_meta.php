<?php
require_once 'wp-load.php';
$id = 2553; 
$meta = get_post_meta($id);
echo "--- Meta for Download #$id ---\n";
print_r($meta);
?>
