<?php
/**
 * Plugin Name: KKC 견종백과 마이그레이션 및 관리 도구
 * Description: 테이블(dog_info)의 121종 견종 데이터를 워드프레스 정식 글(Custom Post Type: dog_breed)로 한방에 마이그레이션하고 관리하는 특급 격리형 플러그인입니다.
 * Version: 1.0.0
 * Author: Antigravity AI
 * License: GPL2
 */

if (!defined('ABSPATH')) exit;

// 🚀 1. '견종백과(dog_breed)' 커스텀 포스트 타입 등록
add_action('init', 'kkc_register_dog_breed_cpt');
function kkc_register_dog_breed_cpt() {
    $labels = [
        'name'               => '견종백과',
        'singular_name'      => '견종',
        'menu_name'          => '견종백과',
        'add_new'            => '새 견종 추가',
        'add_new_item'       => '새 견종 추가',
        'edit_item'          => '견종 수정',
        'new_item'           => '새 견종',
        'view_item'          => '견종 보기',
        'search_items'       => '견종 검색',
        'not_found'          => '등록된 견종이 없습니다.',
        'not_found_in_trash' => '휴지통에 견종이 없습니다.'
    ];

    $args = [
        'labels'              => $labels,
        'public'              => true,
        'has_archive'         => true,
        'publicly_queryable'  => true,
        'show_ui'             => true,
        'show_in_menu'        => true,
        'query_var'           => true,
        'rewrite'             => ['slug' => 'dog-breed', 'with_front' => false],
        'capability_type'     => 'post',
        'hierarchical'        => false,
        'menu_icon'           => 'dashicons-pets', // 발자국 아이콘
        'supports'            => ['title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'],
        'show_in_rest'        => true, // 구텐베르크 에디터 및 REST API 활성화 (SEO 최적화)
    ];

    register_post_type('dog_breed', $args);
}

// 🚀 2. 워드프레스 관리자창에 마이그레이션 관리 메뉴 추가
add_action('admin_menu', 'kkc_dog_breed_migration_menu');
function kkc_dog_breed_migration_menu() {
    add_submenu_page(
        'edit.php?post_type=dog_breed',
        '견종백과 일괄 가져오기',
        'DB 일괄 가져오기',
        'manage_options',
        'kkc-breed-migration',
        'kkc_dog_breed_migration_page'
    );
}

// 🚀 3. 마이그레이션 관리자 화면 UI 및 실행 로직
function kkc_dog_breed_migration_page() {
    global $wpdb;
    
    // 권한 확인
    if (!current_user_can('manage_options')) {
        wp_die('보안 오류: 접근 권한이 없습니다.');
    }

    echo '<div class="wrap">';
    echo '<h1>🐕 견종백과 DB 일괄 마이그레이션 및 연동 도구</h1>';
    echo '<p style="font-size:14px; color:#555;">기존 데이터베이스의 <code>dog_info</code> 테이블에 들어있는 121종의 견종 사전을 워드프레스 정식 게시글로 안전하게 이전합니다.</p>';

    // 실행 요청 처리
    if (isset($_POST['run_breed_migration']) && check_admin_referer('kkc_breed_migrate_action', 'kkc_breed_migrate_nonce')) {
        
        $legacy_breeds = $wpdb->get_results("SELECT * FROM dog_info ORDER BY CAST(idx AS UNSIGNED) ASC", ARRAY_A);
        
        if (empty($legacy_breeds)) {
            echo '<div class="notice notice-error"><p>에러: 데이터베이스에서 <code>dog_info</code> 테이블 또는 데이터를 찾을 수 없습니다.</p></div>';
        } else {
            $total = count($legacy_breeds);
            $created = 0;
            $skipped = 0;
            
            echo '<div style="background:#fff; border:1px solid #ccd0d4; padding:15px; margin:15px 0; border-radius:5px; max-height:400px; overflow-y:scroll; box-shadow:inset 0 1px 3px rgba(0,0,0,.05);">';
            echo '<h3>🔄 실시간 연동 로그:</h3>';
            
            foreach ($legacy_breeds as $breed) {
                $idx = $breed['idx'];
                $kor_name = trim($breed['dog_kor_name']);
                $eng_name = trim($breed['dog_eng_name']);
                $content = trim($breed['content1']);
                
                $title = $kor_name;
                if (!empty($eng_name)) {
                    $title .= " ({$eng_name})";
                }

                // 🚀 [중복 방지] 이미 이전된 견종인지 메타 데이터로 판별
                $existing_id = $wpdb->get_var(
                    $wpdb->prepare(
                        "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '__legacy_breed_idx' AND meta_value = %s LIMIT 1",
                        $idx
                    )
                );

                if ($existing_id) {
                    echo '<p style="color:#666; margin:4px 0;">[건너뜀] 번호 ' . $idx . ' - ' . $title . ' 은(는) 이미 정식 글로 이식되어 있습니다.</p>';
                    $skipped++;
                    continue;
                }

                // 🚀 워드프레스 '견종백과' 포스트 타입으로 등록
                $post_id = wp_insert_post([
                    'post_title'   => $title,
                    'post_content' => $content, // 백과사전 내용 그대로 주입
                    'post_type'    => 'dog_breed',
                    'post_status'  => 'publish',
                    'post_author'  => get_current_user_id(),
                ]);

                if (is_wp_error($post_id)) {
                    echo '<p style="color:red; margin:4px 0;">[실패] 번호 ' . $idx . ' - ' . $title . ' 등록 오류: ' . $post_id->get_error_message() . '</p>';
                    continue;
                }

                // 🚀 견종 규격 수치 및 기타 정보 Custom Fields(메타 데이터)로 매핑하여 주입
                update_post_meta($post_id, '__legacy_breed_idx', $idx);
                update_post_meta($post_id, 'dog_kor_name', $kor_name);
                update_post_meta($post_id, 'dog_eng_name', $eng_name);
                update_post_meta($post_id, 'dog_origin', $breed['dog_origin'] ?? '');
                update_post_meta($post_id, 'dog_group', $breed['dog_group'] ?? '');
                update_post_meta($post_id, 'dog_height_min', $breed['dog_height1'] ?? '');
                update_post_meta($post_id, 'dog_height_max', $breed['dog_height2'] ?? '');
                update_post_meta($post_id, 'dog_weight_min', $breed['dog_weight1'] ?? '');
                update_post_meta($post_id, 'dog_weight_max', $breed['dog_weight2'] ?? '');
                update_post_meta($post_id, 'dog_img1', $breed['dog_img1'] ?? '');
                update_post_meta($post_id, 'dog_img2', $breed['dog_img2'] ?? '');

                echo '<p style="color:green; margin:4px 0; font-weight:bold;">[성공] 번호 ' . $idx . ' - ' . $title . ' 정식 글 변환 성공!</p>';
                $created++;
            }
            
            echo '</div>';
            
            echo '<div class="notice notice-success is-dismissible" style="padding:10px; margin-bottom:15px;">';
            echo '<h3 style="margin-top:5px; color:#137333;">🎉 마이그레이션이 성공적으로 수행되었습니다!</h3>';
            echo '<p style="font-size:14px; margin-bottom:5px;">• 발견된 전체 레코드: <strong>' . $total . '개</strong></p>';
            echo '<p style="font-size:14px; margin-bottom:5px;">• 신규 변환된 견종: <strong style="color:green;">' . $created . '개</strong></p>';
            echo '<p style="font-size:14px; margin-bottom:5px;">• 중복으로 인해 안전하게 건너뛴 견종: <strong>' . $skipped . '개</strong></p>';
            echo '</div>';
        }
    }

    // 마이그레이션 실행 대기 버튼 폼
    echo '<div class="card" style="max-width:600px; padding:20px; margin-top:20px; background:#fff; border:1px solid #ccd0d4; border-radius:4px; box-shadow:0 1px 1px rgba(0,0,0,.04);">';
    echo '<h2>🚀 가져오기 실행 준비</h2>';
    echo '<p style="color:#666; line-height:1.5;">하단의 버튼을 클릭하시면 즉시 데이터베이스의 <code>dog_info</code> 테이블에서 121종 데이터를 검색해 워드프레스 "견종백과" 글로 안전하게 변환 등록합니다.<br>';
    echo '<strong>(여러 번 클릭해도 중복으로 등록되지 않고 안전하게 우회합니다)</strong></p>';
    
    echo '<form method="post" action="">';
    wp_nonce_field('kkc_breed_migrate_action', 'kkc_breed_migrate_nonce');
    echo '<input type="submit" name="run_breed_migration" class="button button-primary button-large" value="🐾 견종백과 DB 일괄 마이그레이션 실행" />';
    echo '</form>';
    echo '</div>';

    echo '</div>';
}
