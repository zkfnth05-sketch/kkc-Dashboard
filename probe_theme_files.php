<?php
/**
 * 파일명: probe_theme_files.php
 * 기능: 서버의 테마 파일들을 샅샅이 뒤져서 'em_events' 쇼트코드를 강제로 주입하는 범인을 찾습니다.
 */

define('WP_USE_THEMES', false);
require_once 'wp-load.php';

header('Content-Type: text/plain; charset=utf-8');

echo "--- [KKC Theme Deep Search Tool] ---\n\n";

$theme_dir = get_template_directory();
echo "Target Theme Directory: $theme_dir\n\n";

function search_in_dir($dir) {
    echo "Scanning directory: $dir\n";
    $files = scandir($dir);
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;
        
        $path = $dir . '/' . $file;
        if (is_dir($path)) {
            search_in_dir($path);
        } else if (pathinfo($path, PATHINFO_EXTENSION) === 'php') {
            $content = file_get_contents($path);
            if (strpos($content, 'em_events') !== false) {
                echo "\n[!!! FOUND IT !!!] File: $path\n";
                
                // 해당 구절 주변 200자 출력
                $pos = strpos($content, 'em_events');
                $start = max(0, $pos - 100);
                $snippet = substr($content, $start, 300);
                echo "--- Code Snippet ---\n";
                echo $snippet;
                echo "\n-------------------\n\n";
            }
        }
    }
}

search_in_dir($theme_dir);

echo "\n--- Search Complete ---";
