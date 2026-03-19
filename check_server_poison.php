<?php
/**
 * 파일명: check_server_poison.php
 * 기능: 서버 내 비정상적인 필터나 쇼트코드 강제 삽입 로직을 진단합니다.
 */

define('WP_USE_THEMES', false);
require_once 'wp-load.php';

header('Content-Type: text/plain; charset=utf-8');

echo "--- [KKC Server Diagnostic Tool] ---\n\n";

// 1. the_content 필터 조사
global $wp_filter;
if (isset($wp_filter['the_content'])) {
    echo "Found 'the_content' filters:\n";
    foreach ($wp_filter['the_content']->callbacks as $priority => $callbacks) {
        foreach ($callbacks as $idx => $cb) {
            $func_name = 'Unknown';
            if (is_string($cb['function'])) $func_name = $cb['function'];
            else if (is_array($cb['function'])) {
                $func_name = (is_object($cb['function'][0]) ? get_class($cb['function'][0]) : $cb['function'][0]) . '::' . $cb['function'][1];
            }
            echo " - Priority $priority: $func_name\n";
        }
    }
}

// 2. 테마 functions.php 확인
$current_theme_path = get_template_directory() . '/functions.php';
echo "\nChecking Theme Functions.php: $current_theme_path\n";
if (file_exists($current_theme_path)) {
    $content = file_get_contents($current_theme_path);
    if (strpos($content, 'em_events') !== false) {
        echo "!!! ALERT: 'em_events' string found in functions.php !!!\n";
        // 위치 확인을 위해 주변 코드 출력 (보안상 조심스럽게)
        $pos = strpos($content, 'em_events');
        echo "Context: " . substr($content, max(0, $pos - 50), 100) . "...\n";
    } else {
        echo "No 'em_events' phrase in functions.php.\n";
    }
}

// 3. 특정 포스트 (최근 글) RAW 데이터 확인
$latest_post = $wpdb->get_row("SELECT * FROM {$wpdb->posts} WHERE post_type = 'post' ORDER BY ID DESC LIMIT 1", ARRAY_A);
if ($latest_post) {
    echo "\nRAW DB Content for Post ID {$latest_post['ID']} ({$latest_post['post_title']}):\n";
    echo "----------------------------------------\n";
    echo $latest_post['post_content'] . "\n";
    echo "----------------------------------------\n";
}

echo "\n--- Diagnostic Complete ---";
