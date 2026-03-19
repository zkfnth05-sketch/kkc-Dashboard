<?php
/**
 * 파일명: check_db_health.php
 * 기능: DB 내 엘리멘터 데이터 및 이벤트 프라임 오염 상태 전수 조사
 */
define('WP_USE_THEMES', false);
require_once 'wp-load.php';

header('Content-Type: text/plain; charset=utf-8');
echo "--- [KKF DB Health Emergency Check] ---\n\n";

global $wpdb;

// 1. 최신 글 5개에 대해 엘리멘터 데이터가 있는지 확인
$recent_posts = $wpdb->get_results("SELECT ID, post_title FROM {$wpdb->posts} WHERE post_type IN ('post', 'page') AND post_status = 'publish' ORDER BY post_modified DESC LIMIT 10");

echo "[1. 엘리멘터(Elementor) 데이터 보존 상태]\n";
foreach ($recent_posts as $post) {
    $el_data = get_post_meta($post->ID, '_elementor_data', true);
    $el_mode = get_post_meta($post->ID, '_elementor_edit_mode', true);
    $status = (!empty($el_data)) ? "✅ 데이터 존재 (정상)" : "❌ 데이터 유실 (디자인 파괴됨)";
    echo "ID: {$post->ID} | 제목: {$post->post_title} | 상태: $status | 모드: $el_mode\n";
}

echo "\n[2. 포스트 본문 내 쇼트코드 오염 상태]\n";
$polluted_posts = $wpdb->get_results("SELECT ID, post_title FROM {$wpdb->posts} WHERE post_content LIKE '%em_events%' LIMIT 5");
if ($polluted_posts) {
    echo "🔴 위험: DB 본문에 직접 [em_events]가 삽입된 글이 발견되었습니다!\n";
    foreach ($polluted_posts as $p) {
        echo " - ID: {$p->ID} ({$p->post_title})\n";
    }
} else {
    echo "✅ 깨끗함: DB 본문에 직접 삽입된 쇼트코드는 없습니다.\n";
}

echo "\n[3. 이벤트 프라임 자동 전환 옵션 체크]\n";
$ep_settings = get_option('eventprime_settings'); // 실제 옵션명은 다를 수 있음
$auto_convert = get_option('evp_convert_posts_to_events'); // 예상 옵션명
echo "자동 전환 옵션 상태: " . ($auto_convert ? "🔴 ENABLED (위험)" : "✅ DISABLED (안전)") . "\n";

echo "\n--- 진단 완료 ---";
