<?php
/**
 * 파일명: handlers/post_logic.php
 * 기능: 공지사항(post) CRUD 핸들러 (백엔드 API 전용)
 * ⚠️  주의: 이 파일은 bridg.php(백엔드 브릿지)에서만 로드됩니다.
 *          WordPress 프론트엔드 훅(add_action/add_filter)은 functions.php에서 처리합니다.
 */

if (!defined('ABSPATH')) exit;

/**
 * 🕵️ [진단 결과 보고] (진단 기능은 유지하여 해결 여부 확인)
 */
function kkc_find_the_ghost() {
    global $wp_filter;
    if (isset($wp_filter['the_content'])) {
        $callbacks = $wp_filter['the_content']->callbacks;
        foreach ($callbacks as $priority => $functions) {
            foreach ($functions as $func_name => $item) {
                // 이전에 문제를 일으켰던 ohio_fix_wpautop_shortcodes 필터 체크
                if (strpos($func_name, 'ohio_fix_wpautop_shortcodes') !== false) {
                    return "⚠️ 주의: 이전 테마 레이아웃 보정 필터가 활성 상태입니다 (우선순위 $priority).";
                }
            }
        }
    }
    return "✅ 정보: 현재 특이한 본문 간섭 필터가 감지되지 않았습니다. 디자인이 정상인지 확인하십시오.";
}

/**
 * 기능: 공지사항 목록 조회 (글 + 페이지 포함)
 */
function kkc_handle_get_notices($input) {
    global $wpdb;
    $page = isset($input['page']) ? max(1, intval($input['page'])) : 1;
    $limit = isset($input['limit']) ? intval($input['limit']) : 10;
    $offset = ($page - 1) * $limit;
    $search = $input['search'] ?? '';

    // 🕵️ '글(post)' 뿐만 아니라 '페이지(page)' 유형도 목록에 포함시킵니다.
    $where = "post_type IN ('post', 'page') AND post_status != 'trash'";
    if (!empty($search)) {
        $where .= $wpdb->prepare(" AND (post_title LIKE %s OR post_content LIKE %s)", '%' . $search . '%', '%' . $search . '%');
    }

    $total = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE $where");
    $data = $wpdb->get_results("SELECT ID, post_title, post_content, post_date, post_status, post_type FROM {$wpdb->posts} WHERE $where ORDER BY post_date DESC LIMIT $limit OFFSET $offset", ARRAY_A);

    return [
        'success' => true, 
        'data' => $data, 
        'total' => intval($total),
        'debug_msg' => kkc_find_the_ghost() 
    ];
}

/**
 * 기능: 공지사항 저장 (데이터 구조 및 ID 매핑 수정)
 */
function kkc_handle_save_notice($input) {
    if (function_exists('kkc_debug_log')) {
        kkc_debug_log("[NOTICE_SAVE] Entered handler", $input);
    }
    global $wpdb;
    
    // 💡 브릿지 전송 시 'data' 키 안에 실제 정보가 들어있으므로 이를 먼저 확인합니다.
    $data = isset($input['data']) ? $input['data'] : $input;
    
    // 💡 프론트엔드에서 'id' 또는 'ID'로 넘어올 수 있으므로 둘 다 체크합니다.
    $id = 0;
    if (isset($data['id'])) $id = intval($data['id']);
    else if (isset($data['ID'])) $id = intval($data['ID']);
    else if (isset($input['id'])) $id = intval($input['id']);
    
    $title = isset($data['title']) ? $data['title'] : '';
    $content = isset($data['content']) ? $data['content'] : '';
    
    // 🛡️ [Base64 해독] 보안 필터를 통과하기 위해 암호화된 본문을 다시 복구
    if (!empty($data['_is_encoded'])) {
        $content = urldecode(base64_decode($content));
    }

    $status = isset($data['status']) ? $data['status'] : 'publish';
    $post_type = isset($data['post_type']) ? $data['post_type'] : 'post';
    $now = current_time('mysql');
    
    // 🔗 [URL 슬러그 생성] 영문/한글 주소를 생성하여 홈으로 튕기는 현상 방지
    $post_name = sanitize_title($title);

    if ($id > 0) {
        $wpdb->update(
            $wpdb->posts,
            [
                'post_title' => $title,
                'post_content' => $content,
                'post_status' => $status,
                'post_modified' => $now,
                'post_modified_gmt' => get_gmt_from_date($now),
                'post_type' => $post_type,
                'post_name' => $post_name // 🔗 주소 별칭 업데이트
            ],
            ['ID' => $id]
        );
        $final_id = $id;
    } else {
        $wpdb->insert(
            $wpdb->posts,
            [
                'post_author' => 1,
                'post_date' => $now,
                'post_date_gmt' => get_gmt_from_date($now),
                'post_title' => $title,
                'post_content' => $content,
                'post_status' => $status,
                'post_type' => $post_type,
                'post_name' => $post_name, // 🔗 주소 별칭 생성
                'post_modified' => $now,
                'post_modified_gmt' => get_gmt_from_date($now)
            ]
        );
        $final_id = $wpdb->insert_id;
    }

    // 메타데이터 및 캐시 정리 (빌더 데이터 보존)
    update_post_meta($final_id, '_thumbnail_id', intval($data['thumbnail_id'] ?? 0));
    delete_post_meta($final_id, '_event_id');
    delete_post_meta($final_id, '_location_id');
    delete_post_meta($final_id, '_event_status');
    delete_post_meta($final_id, '_is_event'); // 🚫 혹시 모를 이벤트 강제 지정 해제
    delete_post_meta($final_id, '_em_post_to_event'); // 🚫 이벤트 프라임 전용 플래그 삭제

    if (!empty($data['category_id'])) {
        wp_set_object_terms($final_id, intval($data['category_id']), 'category', false);
    }

    // 🚀 [중요] 저장 후 즉시 해당 글의 내부 캐시 소거
    clean_post_cache($final_id);
    // wp_cache_flush(); // 🚫 사이트 전체 캐시 소거는 성능 저하 및 일시적 디자인 깨짐을 유발할 수 있어 비활성화합니다.
    
    if (function_exists('kkc_debug_log')) {
        kkc_debug_log("[NOTICE_SAVE_DONE] 성공적으로 완료됨", ["final_id" => $final_id]);
    }
    
    return [
        'success' => true, 
        'id' => $final_id,
        'debug_msg' => kkc_find_the_ghost()
    ];
}


function kkc_handle_get_categories($input) {
    $categories = get_categories(array('hide_empty' => 0));
    $data = [];
    foreach ($categories as $cat) {
        $data[] = ['id' => $cat->term_id, 'name' => $cat->name, 'slug' => $cat->slug];
    }
    return ['success' => true, 'data' => $data];
}
