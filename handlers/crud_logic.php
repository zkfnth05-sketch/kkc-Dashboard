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

    // 🎯 [KSAHO FILTER] 견사호가 있는 사람만 검색 (번식자 전용)
    if (!empty($input['only_saho']) && $table === 'memTab') {
        $where .= " AND TRIM(IFNULL(`saho`, '')) != '' AND `saho` NOT LIKE 'null'";
    }

    if (!empty($input['post_type'])) {
        $pt = $wpdb->prepare("%s", $input['post_type']);
        $where .= " AND `post_type` = $pt";
    }

    // 🚀 [PID FILTER FIX] ds_pid가 명시적으로 전달된 경우 정확한 매칭 우선 (신청자 목록 전용)
    if (!empty($input['ds_pid'])) {
        $pid = (int)$input['ds_pid'];
        $where .= " AND `ds_pid` = $pid";
    }

    // 🚀 [FIX] competition_fee_options 조회 시 event_type 필터 적용 (다른 종목 옵션 섞임 방지)
    if (!empty($input['event_type']) && $table === 'competition_fee_options') {
        $et = $wpdb->prepare("%s", $input['event_type']);
        $where .= " AND `event_type` = $et";
    }

    if (!empty($input['search'])) {
        $q_hex = bin2hex(kkc_convert($input['search'], $enc, false));
        $fields = (!empty($input['field']) && $input['field'] !== 'all') ? [$input['field']] : ($conf['search_fields'] ?? [$conf['pk']]);
        
        if ($table === 'point' && ($input['field'] === 'all' || empty($input['field']))) {
            $fields = array_unique(array_merge($fields, ['reg_no', 'pt_title', 'dogShowName', 'pt_regdate']));
        }

        if (!empty($fields)) {
            $sub = [];
            foreach ($fields as $f) {
                if ($f === 'dogShowName') {
                    $sub[] = "d.ds_name LIKE CONCAT('%', UNHEX('$q_hex'), '%')";
                } else if ($table === 'point' && $f === 'pt_regdate') {
                    // 🚀 [DATE SEARCH FIX] pt_regdate는 타임스탬프(숫자)이므로 문자열로 변환하여 검색
                    // '%Y.%c.%e.' 형식은 '2026. 3. 14.' 패턴과 매칭됩니다.
                    $q_clean = str_replace(['.', ' '], '', $input['search']);
                    $q_hex_clean = bin2hex(kkc_convert($q_clean, $enc, false));
                    
                    $sub[] = "REPLACE(REPLACE(FROM_UNIXTIME(p.pt_regdate, '%Y.%m.%d'), '.', ''), ' ', '') LIKE CONCAT('%', UNHEX('$q_hex_clean'), '%')";
                    $sub[] = "FROM_UNIXTIME(p.pt_regdate, '%Y-%m-%d') LIKE CONCAT('%', UNHEX('$q_hex'), '%')";
                } else {
                    $prefix = ($table === 'point') ? "p." : "";
                    $sub[] = "{$prefix}`$f` LIKE CONCAT('%', UNHEX('$q_hex'), '%')";
                }
            }
            $where .= " AND (" . implode(" OR ", $sub) . ")";
        }
    }

    if ($table === 'point') {
        $sql = "SELECT p.*, d.ds_name as dogShowName 
                FROM `point` p 
                LEFT JOIN `dogshow` d ON p.ds_pid = d.ds_pid 
                WHERE $where 
                ORDER BY p.pt_pid DESC 
                LIMIT $limit OFFSET $offset";
        $data = $wpdb->get_results($sql, ARRAY_A);
        // 🚀 [COUNT FIX] 조인이 포함된 WHERE 절에 대응하도록 COUNT 쿼리도 조인 추가
        $total = $wpdb->get_var("SELECT COUNT(*) FROM `point` p LEFT JOIN `dogshow` d ON p.ds_pid = d.ds_pid WHERE $where");
    } else {
        $data = $wpdb->get_results("SELECT * FROM `$table` WHERE $where ORDER BY 1 DESC LIMIT $limit OFFSET $offset", ARRAY_A);
        $total = $wpdb->get_var("SELECT COUNT(*) FROM `$table` WHERE $where");
    }
    
    $wpdb->query("SET NAMES 'utf8mb4'");
    
    return [
        'success' => true, 
        'data' => kkc_convert($data ?: [], $enc, true), 
        'total' => (int)$total,
        'debug_where' => $where,
        'requested_only_saho' => !empty($input['only_saho'])
    ];
}

/**
 * 🚀 이미지 업로드 고도화 (바이너리 파일 지원)
 */
function kkc_handle_upload_image($input) {
    // 🛡️ [UPLOAD SECURITY BYPASS] 허용할 파일 확장자 강제 추가 (HWP, PDF, DOCX 등)
    add_filter('upload_mimes', function($mimes) {
        $mimes['hwp'] = 'application/haansofthwp';
        $mimes['hwpx'] = 'application/haansofthwp-xml';
        $mimes['pdf'] = 'application/pdf';
        $mimes['docx'] = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        $mimes['doc'] = 'application/msword';
        $mimes['xls'] = 'application/vnd.ms-excel';
        $mimes['xlsx'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        $mimes['zip'] = 'application/zip';
        return $mimes;
    }, 999);

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

/**
 * 🚀 DB 테이블 배치 내보내기 (SQL DUMP 스트리밍 방식)
 * mode=export_table_batch
 * params: table, offset, batch_size, include_header (첫 배치에만 CREATE TABLE 포함)
 */
function kkc_handle_export_table_batch($input) {
    global $wpdb;

    $table      = preg_replace('/[^a-zA-Z0-9_]/', '', $input['table'] ?? '');
    $offset     = max(0, intval($input['offset'] ?? 0));
    $batch_size = min(2000, max(1, intval($input['batch_size'] ?? 500)));
    $include_header = !empty($input['include_header']);

    if (!$table) {
        return ['success' => false, 'error' => '테이블명이 없습니다.'];
    }

    // 테이블 존재 여부 확인
    $exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table));
    if (!$exists) {
        return ['success' => false, 'error' => "테이블 '$table' 이(가) 존재하지 않습니다."];
    }

    $wpdb->query("SET NAMES 'binary'");

    // 전체 행 수
    $total = (int)$wpdb->get_var("SELECT COUNT(*) FROM `$table`");

    // CREATE TABLE 구문 (첫 배치에만)
    $sql_output = '';
    if ($include_header) {
        $create_row = $wpdb->get_row("SHOW CREATE TABLE `$table`", ARRAY_N);
        if ($create_row) {
            $create_sql = $create_row[1];
            $sql_output .= "-- KKC DB Export: $table\n";
            $sql_output .= "-- Total rows: $total\n";
            $sql_output .= "-- Generated: " . date('Y-m-d H:i:s') . "\n\n";
            $sql_output .= "DROP TABLE IF EXISTS `$table`;\n";
            $sql_output .= $create_sql . ";\n\n";
        }
    }

    // 데이터 SELECT
    $rows = $wpdb->get_results("SELECT * FROM `$table` LIMIT $batch_size OFFSET $offset", ARRAY_A);

    $wpdb->query("SET NAMES 'utf8mb4'");

    if (!empty($rows)) {
        // 컬럼명 추출
        $columns = array_keys($rows[0]);
        $col_list = '`' . implode('`, `', $columns) . '`';

        $insert_lines = [];
        foreach ($rows as $row) {
            $values = array_map(function($v) use ($wpdb) {
                if ($v === null) return 'NULL';
                // 바이너리 안전 hex 인코딩
                return "0x" . bin2hex($v);
            }, $row);
            $insert_lines[] = '(' . implode(', ', $values) . ')';
        }

        // 50행씩 묶어서 INSERT (가독성 + 안정성)
        $chunks = array_chunk($insert_lines, 50);
        foreach ($chunks as $chunk) {
            $sql_output .= "INSERT INTO `$table` ($col_list) VALUES\n";
            $sql_output .= implode(",\n", $chunk) . ";\n";
        }
    }

    $fetched_count = count($rows ?? []);
    $is_done = ($offset + $fetched_count) >= $total;

    return [
        'success'       => true,
        'sql'           => $sql_output,
        'fetched'       => $fetched_count,
        'offset'        => $offset,
        'total'         => $total,
        'is_done'       => $is_done,
        'next_offset'   => $offset + $fetched_count,
    ];
}

