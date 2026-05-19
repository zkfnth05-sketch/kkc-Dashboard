<?php
/**
 * 파일명: migrate_dataroom.php
 * 기능: 옛날 서식자료실(dataroomTab) 데이터를 다운로드 관리자 플러그인(wpdmpro)으로 한방에 마이그레이션
 * 안전 조치: 
 *   1. 기존 도그쇼, 회원, 포인트 등 다른 모든 테이블은 손대지 않습니다.
 *   2. 중복 방지 설계(Idempotent): 고유 UID를 저장하여 여러 번 실행해도 글이 중복 생성되지 않고 건너뜁니다.
 *   3. 실행 후 이 파일을 서버에서 즉시 삭제하세요.
 */

// 1. 워드프레스 코어 로드
$wp_load = dirname(__FILE__) . '/wp-load.php';
if (!file_exists($wp_load)) {
    die("에러: 워드프레스 최상위 폴더(wp-load.php가 있는 위치)에 업로드한 후 실행해 주세요.");
}
require_once($wp_load);

// 관리자 권한 및 DB 연결 확보
global $wpdb;
if (!current_user_can('manage_options') && $_GET['bypass'] !== 'true') {
    die("보안 경고: 워드프레스 관리자로 로그인한 후 실행하거나, 강제 실행을 위해 주소 뒤에 '?bypass=true'를 붙여주세요.");
}

echo "<html><head><title>서식 자료실 마이그레이션 도구</title></head><body style='font-family:sans-serif; line-height: 1.6; padding: 20px;'>";
echo "<h2>📂 서식 자료실 한방 마이그레이션 시작</h2>";
echo "<hr style='border: 1px solid #eee;' />";

// 2. 옛날 서식자료실 테이블 존재 여부 확인
$table_exists = $wpdb->get_var("SHOW TABLES LIKE 'dataroomTab'");
if (!$table_exists) {
    die("<p style='color:red; font-weight:bold;'>에러: 데이터베이스에 'dataroomTab' 테이블이 존재하지 않습니다.</p></body></html>");
}

// 3. WPDM "서식 자료실" 카테고리 ID 확보
$cat_name = '서식 자료실';
$term = get_term_by('name', $cat_name, 'wpdmcategory');
if (!$term) {
    $term = wp_insert_term($cat_name, 'wpdmcategory');
    $cat_id = is_array($term) ? $term['term_id'] : $term;
} else {
    $cat_id = $term->term_id;
}

if (is_wp_error($cat_id)) {
    die("<p style='color:red;'>에러: WPDM 카테고리 생성 실패: " . $cat_id->get_error_message() . "</p></body></html>");
}

// 4. 기존 서식자료실 데이터 전체 읽기 (첨부파일이 있는 것 위주)
$legacy_forms = $wpdb->get_results("SELECT * FROM dataroomTab WHERE userfile != '' ORDER BY CAST(uid AS UNSIGNED) ASC", ARRAY_A);
$total_legacy = count($legacy_forms);

echo "<p>총 <strong>{$total_legacy}개</strong>의 서식 데이터를 발견했습니다. 마이그레이션을 안전하게 진행합니다...</p>";
echo "<div style='background:#f5f5f5; padding: 15px; border-radius: 8px; max-height: 300px; overflow-y: scroll; border: 1px solid #ddd; margin-bottom: 20px;'>";

$created_count = 0;
$skipped_count = 0;

foreach ($legacy_forms as $form) {
    $uid = $form['uid'];
    $title = trim($form['subject']);
    $body = trim($form['body']);
    $file_name = trim($form['userfile']);
    
    // 신규 업로드 폴더 주소 매핑
    $file_url = "https://kkc3349.mycafe24.com/wp-content/uploads/dataroom/" . $file_name;

    // 🚀 [중복 방지 체크] 이미 해당 UID로 복사된 내역이 있는지 조회
    $existing_post = $wpdb->get_var(
        $wpdb->prepare(
            "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '__legacy_dataroom_uid' AND meta_value = %s LIMIT 1",
            $uid
        )
    );

    if ($existing_post) {
        echo "<p style='color: #666; margin: 5px 0;'>[건너뜀] ID {$uid} - '{$title}' 은(는) 이미 변환되어 존재합니다. (패스)</p>";
        $skipped_count++;
        continue;
    }

    // 5. 다운로드(wpdmpro) 포스트 등록
    $post_id = wp_insert_post([
        'post_title'   => $title,
        'post_content' => $body,
        'post_type'    => 'wpdmpro',
        'post_status'  => 'publish',
        'post_author'  => 1, // 관리자 ID 기본값 1
    ]);

    if (is_wp_error($post_id)) {
        echo "<p style='color: red; margin: 5px 0;'>[실패] ID {$uid} - '{$title}' 변환 중 오류: " . $post_id->get_error_message() . "</p>";
        continue;
    }

    // 6. 카테고리 지정 및 다운로드 관리자 메타데이터 한방에 매핑 주입
    wp_set_post_terms($post_id, [$cat_id], 'wpdmcategory');

    // WPDM 필수 메타 주입
    update_post_meta($post_id, '__legacy_dataroom_uid', $uid); // 중복 방지용 고유키
    update_post_meta($post_id, '__wpdm_files', [$file_url]);
    
    $fileinfo = [
        $file_url => [
            'title' => basename($file_url),
            'file'  => $file_url,
            'size'  => '',
            'icon'  => 'image/png'
        ]
    ];
    update_post_meta($post_id, '__wpdm_fileinfo', $fileinfo);
    update_post_meta($post_id, '__wpdm_download_count', 0);
    update_post_meta($post_id, '__wpdm_masterkey', uniqid());
    update_post_meta($post_id, '__wpdm_access', array('guest', 'member', 'administrator'));
    update_post_meta($post_id, '__wpdm_view_count', 0);
    update_post_meta($post_id, '__wpdm_quota', -1);
    update_post_meta($post_id, '__wpdm_package_size', '');
    update_post_meta($post_id, '__wpdm_template', 'link-template-panel.php');
    update_post_meta($post_id, '__wpdm_page_template', 'page-template-default.php');

    echo "<p style='color: green; margin: 5px 0;'>[성공] ID {$uid} - '{$title}' 연동 완료</p>";
    $created_count++;
}

echo "</div>";

echo "<div style='background: #e6f4ea; border: 1px solid #34a853; padding: 15px; border-radius: 8px;'>";
echo "<h4 style='margin-top:0; color: #137333;'>🎉 마이그레이션 작업 결과 통계</h4>";
echo "<ul>";
echo "<li>신규로 안전하게 변환된 서식: <strong>{$created_count}개</strong></li>";
echo "<li>이미 존재하여 안전하게 건너뛴 서식: <strong>{$skipped_count}개</strong></li>";
echo "<li>처리 실패 건수: <strong>" . ($total_legacy - $created_count - $skipped_count) . "개</strong></li>";
echo "</ul>";
echo "<p style='color: #d93025; font-weight:bold; margin-bottom: 0;'>⚠️ 중요: 작업이 끝났으므로, 보안을 위해 FTP를 통해 이 파일(migrate_dataroom.php)을 서버에서 즉시 영구 삭제해 주세요!</p>";
echo "</div>";

echo "</body></html>";
?>
