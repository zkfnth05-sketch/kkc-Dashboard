<?php
require_once 'wp-load.php';
$cats = get_terms([
    'taxonomy' => 'wpdmcategory',
    'hide_empty' => false,
]);
echo "--- WPDM Categories ---\n";
foreach ($cats as $cat) {
    echo "ID: {$cat->term_id} | Name: {$cat->name} | Slug: {$cat->slug}\n";
}
?>
