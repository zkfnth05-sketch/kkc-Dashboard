<?php
/**
 * 파일명: handlers/crud_logic.php
 */
if (!defined('ABSPATH')) exit;

function kkc_handle_general_list($input) {
    global $wpdb, $KKC_TABLE_MAP;
    $table = $input['table'];
    $conf = $KKC_TABLE_MAP[$table] ?? ['pk' => 'uid', 'encoding' => 'UTF-8', 'search_fields' => []];
    $enc = $conf['encoding'];
    
    $page = max(1, intval($input['page'] ?? 1));
    $limit = intval($input['limit'] ?? 50);
    $offset = ($page - 1) * $limit;
    
    $wpdb->query("SET NAMES 'binary'");
    
    $where = "1=1";

    if (!empty($input['post_type'])) {
        $pt = $wpdb->prepare("%s", $input['post_type']);
        $where .= " AND `post_type` = $pt";
    }

    // 🚀 [PID FILTER FIX] ds_pid가 명시적으로 전달된 경우 정확한 매칭 우선 (신청자 목록 전용)
    if (!empty($input['ds_pid'])) {
        $pid = (int)$input['ds_pid'];
        $where .= " AND `ds_pid` = $pid";
    }

    if (!empty($input['search'])) {
        $q_hex = bin2hex(kkc_convert($input['search'], $enc, false));
        $fields = (!empty($input['field']) && $input['field'] !== 'all') ? [$input['field']] : ($conf['search_fields'] ?? [$conf['pk']]);
        
        if (!empty($fields)) {
            $sub = [];
            foreach ($fields as $f) { $sub[] = "`$f` LIKE CONCAT('%', UNHEX('$q_hex'), '%')"; }
            $where .= " AND (" . implode(" OR ", $sub) . ")";
        }
    }

    // 🚀 [JOIN FIX] 포인트 테이블 조회 시 도그쇼 명칭을 함께 가져옵니다.
    if ($table === 'point') {
        $sql = "SELECT p.*, d.ds_name as dogShowName 
                FROM `point` p 
                LEFT JOIN `dogshow` d ON p.ds_pid = d.ds_pid 
                WHERE $where 
                ORDER BY p.pt_pid DESC 
                LIMIT $limit OFFSET $offset";
        $data = $wpdb->get_results($sql, ARRAY_A);
    } else {
        $data = $wpdb->get_results("SELECT * FROM `$table` WHERE $where ORDER BY 1 DESC LIMIT $limit OFFSET $offset", ARRAY_A);
    }

    $total = $wpdb->get_var("SELECT COUNT(*) FROM `$table` WHERE $where");
    
    $wpdb->query("SET NAMES 'utf8mb4'");
    
    return ['success' => true, 'data' => kkc_convert($data ?: [], $enc, true), 'total' => (int)$total];
}

/**
 * 🚀 이미지 업로드 고도화 (바이너리 파일 지원)
 */
function kkc_handle_upload_image($input) {
    $filename = sanitize_file_name($input['filename'] ?? 'kkc_upload_' . time() . '.jpg');
    $decoded_data = null;

    if (!empty($_FILES['image_file']['tmp_name'])) {
        $decoded_data = file_get_contents($_FILES['image_file']['tmp_name']);
        $filename = sanitize_file_name($_FILES['image_file']['name']);
    } 
    else if (!empty($input['base64'])) {
        $data = $input['base64'];
        if (preg_match('/^data:image\/(\w+);base64,/', $data, $type)) {
            $data = substr($data, strpos($data, ',') + 1);
        }
        $decoded_data = base64_decode($data);
    }

    if (!$decoded_data) throw new Exception("이미지 데이터 수신 실패");
    
    $upload = wp_upload_bits($filename, null, $decoded_data);
    if ($upload['error']) throw new Exception($upload['error']);
    
    $file_path = $upload['file'];
    $file_type = wp_check_filetype(basename($file_path), null);
    
    $attachment = array(
        'post_mime_type' => $file_type['type'],
        'post_title'     => preg_replace( '/\.[^.]+$/', '', basename($file_path) ),
        'post_content'   => '',
        'post_status'    => 'inherit'
    );
    
    $attach_id = wp_insert_attachment($attachment, $file_path);
    require_once(ABSPATH . 'wp-admin/includes/image.php');
    $attach_data = wp_generate_attachment_metadata($attach_id, $file_path);
    wp_update_attachment_metadata($attach_id, $attach_data);
    
    return ['success' => true, 'url' => set_url_scheme($upload['url'], 'https'), 'id' => $attach_id];
}

function kkc_handle_create($input) {
    global $wpdb, $KKC_TABLE_MAP;
    $table = $input['table']; 
    $data = $input['data'];

    if ($table === 'wp_terms') {
        $term = wp_insert_term($data['name'], $data['taxonomy'] ?? 'kkf_event_category');
        if (is_wp_error($term)) {
            if ($term->get_error_code() === 'term_exists') return ['success' => true, 'id' => $term->get_error_data()];
            return ['success' => false, 'error' => $term->get_error_message()];
        }
        return ['success' => true, 'id' => $term['term_id']];
    }

    $res = $wpdb->insert($table, $data);
    
    if ($res === false) return ['success' => false, 'error' => "DB 삽입 실패: " . $wpdb->last_error, 'query' => $wpdb->last_query];
    return ['success' => true, 'id' => $wpdb->insert_id];
}

function kkc_handle_update($input) {
    global $wpdb, $KKC_TABLE_MAP;
    $table = $input['table']; 
    $data = $input['data'];

    $conf = $KKC_TABLE_MAP[$table] ?? ['pk' => 'uid', 'encoding' => 'UTF-8'];
    $pk = $conf['pk']; 
    $pk_val = $data[$pk]; 
    unset($data[$pk]);

    $res = $wpdb->update($table, $data, [$pk => $pk_val]);

    if ($res === false) {
        $last_error = $wpdb->last_error;
        return [
            'success' => false, 
            'error' => "DB 업데이트 실패: " . ($last_error ? $last_error : "알 수 없는 에러"),
            'query' => $wpdb->last_query
        ];
    }
    return ['success' => true];
}

function kkc_handle_delete($input) {
    global $wpdb, $KKC_TABLE_MAP;
    $table = $input['table']; 
    $id_raw = $input['id'];
    
    // 🚀 [SYNC FIX] 접두사가 붙은 ID 처리 (레거시 통합 대응)
    if (is_string($id_raw)) {
        if (strpos($id_raw, 'ds_') === 0) {
            $id = (int)substr($id_raw, 3);
            return $wpdb->delete('dogshow', ['ds_pid' => $id]) === false ? ['success' => false, 'error' => $wpdb->last_error] : ['success' => true];
        } else if (strpos($id_raw, 'st_') === 0) {
            $id = (int)substr($id_raw, 3);
            return $wpdb->delete('stylist', ['ds_pid' => $id]) === false ? ['success' => false, 'error' => $wpdb->last_error] : ['success' => true];
        } else if (strpos($id_raw, 'sm_') === 0) {
            $id = (int)substr($id_raw, 3);
            return $wpdb->delete('seminar', ['ds_pid' => $id]) === false ? ['success' => false, 'error' => $wpdb->last_error] : ['success' => true];
        } else if (strpos($id_raw, 'bd_') === 0) {
            $id = (int)substr($id_raw, 3);
            return $wpdb->delete('breed_dogTab', ['bd_pid' => $id]) === false ? ['success' => false, 'error' => $wpdb->last_error] : ['success' => true];
        }
    }
    
    $id = (int)$id_raw;

    if ($table === 'wp_terms') {
        $taxonomy = $input['taxonomy'] ?? 'kkf_event_category';
        $res = wp_delete_term($id, $taxonomy);
        return is_wp_error($res) ? ['success' => false, 'error' => $res->get_error_message()] : ['success' => true];
    }

    $pk = $KKC_TABLE_MAP[$table]['pk'] ?? 'uid';
    $res = $wpdb->delete($table, [$pk => $id]);
    
    if ($res === false) return ['success' => false, 'error' => "DB 삭제 실패: " . $wpdb->last_error];
    return ['success' => true];
}

function kkc_handle_show_tables() {
    global $wpdb;
    return ['success' => true, 'data' => $wpdb->get_col("SHOW TABLES")];
}

function kkc_handle_sql_batch($input) {
    global $wpdb;
    $queries = $input['queries'] ?? []; 
    $count = 0;
    $wpdb->query("START TRANSACTION");
    foreach ($queries as $sql) { 
        $sql = trim($sql);
        if ($sql) { 
            $res = $wpdb->query($sql); 
            if ($res === false) {
                $err = $wpdb->last_error;
                $wpdb->query("ROLLBACK");
                return ['success' => false, 'error' => "SQL 실행 오류: " . $err];
            }
            $count++; 
        } 
    }
    $wpdb->query("COMMIT");
    return ['success' => true, 'count' => $count];
}

/**
 * 🚀 포인트 관리 페이지용 도그쇼 목록 가져오기
 */
/**
 * 🚀 포인트/상력 관리용 도그쇼 목록 가져오기 (Legacy dogshow 테이블 연동)
 */
function kkc_handle_get_dogshows() {
    global $wpdb;
    $results = $wpdb->get_results("SELECT ds_pid as id, ds_name as name FROM dogshow ORDER BY ds_pid DESC LIMIT 300", ARRAY_A);
    return [
        'success' => true,
        'data' => $results ?: []
    ];
}

