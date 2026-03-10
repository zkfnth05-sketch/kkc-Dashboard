<?php
/**
 * 파일명: handlers/post_logic.php
 * 기능: 워드프레스 일반 포스트(공지사항, 협회소식) 관리 전용 로직
 */

if (!defined('ABSPATH')) exit;

/**
 * 🎯 일반 공지사항/뉴스 리스트 조회
 */
function kkc_handle_get_notices($input) {
    global $wpdb;
    $page = max(1, intval($input['page'] ?? 1)); 
    $limit = intval($input['limit'] ?? 10); 
    $offset = ($page - 1) * $limit;
    
    $where = "post_type = 'post' AND post_status != 'trash'";
    if (!empty($input['category_id'])) {
        $cat_ids = [intval($input['category_id'])];
        // 카테고리 필터링이 필요한 경우 조인이나 서브쿼리 추가 가능
    }

    $data = $wpdb->get_results("SELECT ID, post_title, post_content, post_date, post_status FROM {$wpdb->posts} WHERE $where ORDER BY post_date DESC LIMIT $limit OFFSET $offset", ARRAY_A);
    $total = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE $where");
    
    return [
        'success' => true, 
        'data' => kkc_convert($data ?: [], 'UTF-8', true), 
        'total' => (int)$total
    ];
}

/**
 * 🎯 카테고리 목록 조회
 */
function kkc_handle_get_categories($input) {
    $cats = get_categories(['hide_empty' => false]);
    $data = array_map(function($c) { 
        return ['id' => $c->term_id, 'name' => $c->name, 'slug' => $c->slug, 'count' => $c->count]; 
    }, $cats);
    return ['success' => true, 'data' => kkc_convert($data, 'UTF-8', true)];
}

/**
 * 🎯 일반 공지사항/뉴스 저장 및 수정
 */
function kkc_handle_save_notice($input) {
    global $wpdb;
    $data = $input['data'] ?? [];
    $id = isset($data['ID']) ? intval($data['ID']) : 0;

    $post_arr = [
        'ID' => $id,
        'post_title' => $data['title'] ?? '',
        'post_content' => $data['content'] ?? '',
        'post_type' => 'post',
        'post_status' => $data['status'] ?? 'publish',
        'post_author' => 1
    ];

    $final_id = ($id > 0) ? wp_update_post($post_arr, true) : wp_insert_post($post_arr, true);
    if (is_wp_error($final_id)) return ['success' => false, 'error' => $final_id->get_error_message()];

    // 썸네일 등록
    if (!empty($data['thumbnail_id'])) {
        update_post_meta($final_id, '_thumbnail_id', intval($data['thumbnail_id']));
    }

    // 카테고리 지정
    if (!empty($data['category_id'])) {
        wp_set_object_terms($final_id, intval($data['category_id']), 'category', false);
    }

    clean_post_cache($final_id);
    return ['success' => true, 'id' => $final_id];
}
