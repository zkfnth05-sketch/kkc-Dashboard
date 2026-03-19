<?php
/**
 * 파일명: handlers/download_logic.php
 * 기능: WordPress Download Manager (WPDM) 연동 핸들러
 */

if (!defined('ABSPATH')) exit;

/**
 * 기능: 다운로드(서식 자료실) 목록 조회
 */
function kkc_handle_download_list($input) {
    global $wpdb;
    $page = isset($input['page']) ? max(1, intval($input['page'])) : 1;
    $limit = isset($input['limit']) ? intval($input['limit']) : 20;
    $offset = ($page - 1) * $limit;
    $search = $input['search'] ?? '';

    $where = "post_type = 'wpdmpro' AND post_status = 'publish'";
    if (!empty($search)) $where .= $wpdb->prepare(" AND post_title LIKE %s", '%' . $search . '%');

    $total = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE $where");
    $sql = "SELECT p.ID, p.post_title, p.post_date, p.menu_order, u.display_name as post_author_name
            FROM {$wpdb->posts} p
            LEFT JOIN {$wpdb->users} u ON p.post_author = u.ID
            WHERE $where ORDER BY p.menu_order DESC, p.post_date DESC LIMIT $limit OFFSET $offset";
    $posts = $wpdb->get_results($sql, ARRAY_A);
    
    foreach ($posts as &$post) {
        $post['is_pinned'] = intval($post['menu_order']) > 0 || get_post_meta($post['ID'], '__wpdm_featured', true) == '1';
        $post['download_count'] = get_post_meta($post['ID'], '__wpdm_download_count', true) ?: 0;
        $files = get_post_meta($post['ID'], '__wpdm_files', true);
        $post['file_url'] = is_array($files) ? reset($files) : $files;
    }
    return ['success' => true, 'data' => $posts, 'total' => intval($total)];
}

function kkc_handle_pin_download($input) {
    global $wpdb;
    $data = $input['data'] ?? $input;
    $id = intval($data['id']);
    $pin = isset($data['pin']) ? (bool)$data['pin'] : true;
    
    if (!$id) return ['success' => false, 'error' => 'ID가 없습니다.'];
    
    // 1. menu_order를 1로 설정 (목록 정렬 기준)
    wp_update_post([
        'ID' => $id,
        'menu_order' => $pin ? 1 : 0
    ]);

    // 2. __wpdm_featured 메타 데이터 추가 (WPDM 템플릿 우선 순위 반영)
    update_post_meta($id, '__wpdm_featured', $pin ? '1' : '0');
    
    return ['success' => true];
}

/**
 * 기능: 신규 다운로드 패키지 생성 (WPDM 연동)
 */
function kkc_handle_save_download($input) {
    global $wpdb;
    $data = $input['data'] ?? $input;
    $title = $data['title'] ?? '새 다운로드';
    $file_url = $data['file_url'] ?? ''; 
    $filename = basename($file_url);

    $post_id = wp_insert_post([
        'post_title' => $title,
        'post_type' => 'wpdmpro',
        'post_status' => 'publish',
        'post_author' => get_current_user_id() ?: 1,
    ]);

    if (is_wp_error($post_id)) return ['success' => false, 'error' => $post_id->get_error_message()];

    // 🚀 [WPDM Category Setup] "서식 자료실" 카테고리 자동 지정
    $cat_name = '서식 자료실';
    $term = get_term_by('name', $cat_name, 'wpdmcategory');
    if (!$term) {
        $term = wp_insert_term($cat_name, 'wpdmcategory');
        $cat_id = is_array($term) ? $term['term_id'] : $term;
    } else {
        $cat_id = $term->term_id;
    }
    if (!is_wp_error($cat_id)) {
        wp_set_post_terms($post_id, [$cat_id], 'wpdmcategory');
    }

    // 🚀 [WPDM 3.x 필수 메타데이터]
    update_post_meta($post_id, '__wpdm_files', [$file_url]);
    
    $fileinfo = [
        $file_url => [
            'title' => $filename,
            'file' => $file_url,
            'size' => '', 
            'icon' => 'image/png' 
        ]
    ];
    update_post_meta($post_id, '__wpdm_fileinfo', $fileinfo);
    
    update_post_meta($post_id, '__wpdm_download_count', 0);
    update_post_meta($post_id, '__wpdm_masterkey', uniqid());
    update_post_meta($post_id, '__wpdm_access', array('guest', 'member', 'administrator')); 
    update_post_meta($post_id, '__wpdm_view_count', 0);
    update_post_meta($post_id, '__wpdm_quota', -1); 
    update_post_meta($post_id, '__wpdm_package_size', '');

    // 🎨 [WPDM 디자인 템플릿 고정] 가로로 길게(Full-width) 나오는 Panel 템플릿 적용
    update_post_meta($post_id, '__wpdm_template', 'link-template-panel.php');
    update_post_meta($post_id, '__wpdm_page_template', 'page-template-default.php');

    return ['success' => true, 'id' => $post_id, 'category' => $cat_name];
}

function kkc_handle_update_download($input) {
    global $wpdb;
    $data = $input['data'] ?? $input;
    $post_id = intval($data['id']);
    if (!$post_id) return ['success' => false, 'error' => 'ID가 없습니다.'];

    $update_data = [];
    if (isset($data['title'])) $update_data['post_title'] = $data['title'];
    
    if (!empty($update_data)) {
        wp_update_post(array_merge(['ID' => $post_id], $update_data));
    }

    if (!empty($data['file_url'])) {
        update_post_meta($post_id, '__wpdm_files', [$data['file_url']]);
        $filename = basename($data['file_url']);
        $fileinfo = [
            $data['file_url'] => [
                'title' => $filename,
                'file' => $data['file_url'],
                'size' => '', 
                'icon' => 'image/png' 
            ]
        ];
        update_post_meta($post_id, '__wpdm_fileinfo', $fileinfo);
    }

    return ['success' => true];
}




