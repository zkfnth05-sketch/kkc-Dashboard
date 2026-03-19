<?php
/**
 * 파일명: handlers/dog_logic.php
 */

if (!defined('ABSPATH')) exit;

function kkc_handle_pedigree_list($input) {
    global $wpdb, $KKC_TABLE_MAP;
    $conf = $KKC_TABLE_MAP['dogTab'];
    $enc = $conf['encoding'];
    
    $page = max(1, intval($input['page'] ?? 1));
    $limit = intval($input['limit'] ?? 50);
    $offset = ($page - 1) * $limit;
    
    $wpdb->query("SET NAMES 'binary'");
    
    $where = ["1=1"];
    $field_input = $input['field'] ?? 'all';
    $search_query = isset($input['search']) ? trim($input['search']) : '';

    if ($search_query !== '') {
        $q_hex = bin2hex(kkc_convert($search_query, $enc, false));
        $fields = ($field_input !== 'all') ? [$field_input] : $conf['search_fields'];
        
        $sub = [];
        foreach ($fields as $f) { 
            $sub[] = "`$f` LIKE CONCAT('%', UNHEX('$q_hex'), '%')"; 
        }
        $where[] = "(" . implode(" OR ", $sub) . ")";
    } else if ($field_input !== 'all') {
        $where[] = "(`$field_input` IS NOT NULL AND `$field_input` <> '' AND `$field_input` <> '0')";
    }

    $final_where = implode(" AND ", $where);
    $total = $wpdb->get_var("SELECT COUNT(*) FROM `dogTab` WHERE $final_where");
    $sql = "SELECT * FROM `dogTab` WHERE $final_where ORDER BY uid DESC LIMIT $limit OFFSET $offset";
    $data = $wpdb->get_results($sql, ARRAY_A);
    
    $wpdb->query("SET NAMES 'utf8mb4'");
    
    return ['success' => true, 'data' => kkc_convert($data, $enc, true), 'total' => (int)$total];
}

// 🎯 종견 인정 평가 전용 핸들러
function kkc_handle_evaluation_list($input) {
    global $wpdb, $KKC_TABLE_MAP;
    $conf = $KKC_TABLE_MAP['breed_dogTab'];
    $enc = $conf['encoding'];
    
    $page = max(1, intval($input['page'] ?? 1));
    $limit = intval($input['limit'] ?? 20);
    $offset = ($page - 1) * $limit;
    
    $wpdb->query("SET NAMES 'binary'");
    $where = "1=1";
    if (!empty($input['search'])) {
        $q_hex = bin2hex(kkc_convert($input['search'], $enc, false));
        $f = ($input['field'] === 'regNo') ? 'reg_no' : 'dog_name';
        $where .= " AND `$f` LIKE CONCAT('%', UNHEX('$q_hex'), '%')";
    }
    
    $data = $wpdb->get_results("SELECT * FROM `breed_dogTab` WHERE $where ORDER BY uid DESC LIMIT $limit OFFSET $offset", ARRAY_A);
    $total = $wpdb->get_var("SELECT COUNT(*) FROM `breed_dogTab` WHERE $where");
    $wpdb->query("SET NAMES 'utf8mb4'");
    
    return ['success' => true, 'data' => kkc_convert($data, $enc, true), 'total' => (int)$total];
}

// 🎯 상력 관리 전용 핸들러
function kkc_handle_prize_list($input) {
    global $wpdb, $KKC_TABLE_MAP;
    $conf = $KKC_TABLE_MAP['prize_dogTab'];
    $enc = $conf['encoding'];
    
    $page = max(1, intval($input['page'] ?? 1));
    $limit = intval($input['limit'] ?? 20);
    $offset = ($page - 1) * $limit;
    
    $wpdb->query("SET NAMES 'binary'");
    $where = "1=1";
    if (!empty($input['search'])) {
        $q_hex = bin2hex(kkc_convert($input['search'], $enc, false));
        $f = ($input['field'] === 'reg_no' || $input['field'] === 'regNo') ? 'reg_no' : 'event_name';
        $where .= " AND `$f` LIKE CONCAT('%', UNHEX('$q_hex'), '%')";
    }
    
    $data = $wpdb->get_results("SELECT * FROM `prize_dogTab` WHERE $where ORDER BY uid DESC LIMIT $limit OFFSET $offset", ARRAY_A);
    $total = $wpdb->get_var("SELECT COUNT(*) FROM `prize_dogTab` WHERE $where");
    $wpdb->query("SET NAMES 'utf8mb4'");
    
    return ['success' => true, 'data' => kkc_convert($data, $enc, true), 'total' => (int)$total];
}

function kkc_handle_get_dongtae($input) {
    global $wpdb, $KKC_TABLE_MAP;
    $enc = $KKC_TABLE_MAP['dongtaeTab']['encoding'];
    $wpdb->query("SET NAMES 'binary'");
    $dongtae_no = kkc_convert(trim($input['dongtae_no'] ?? ''), $enc, false);
    $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM `dongtaeTab` WHERE dongtae_no = %s", $dongtae_no), ARRAY_A);
    $wpdb->query("SET NAMES 'utf8mb4'");
    return ['success' => true, 'data' => kkc_convert($row, $enc, true)];
}

function kkc_handle_next_dongtae_no($input) {
    global $wpdb;
    // 가장 최근의 동태 번호를 가져옵니다.
    $last = $wpdb->get_var("SELECT dongtae_no FROM `dongtaeTab` ORDER BY uid DESC LIMIT 1");
    
    // {FFFFF66452 와 같은 형식에서 숫자 부분만 추출하여 1을 더합니다.
    if (preg_match('/^(.*?)(\d+)$/', $last, $matches)) {
        $prefix = $matches[1];    // 예: {FFFFF
        $numPart = intval($matches[2]); // 예: 66452
        $nextNum = $numPart + 1;
        $newData = $prefix . $nextNum;
    } else {
        // 숫자 형식이 아닐 경우에 대한 안전한 폴백
        $newData = (string)(intval($last) + 1);
    }
    
    return ['success' => true, 'data' => $newData];
}

function kkc_handle_owner_history($input) {
    global $wpdb;
    $id = intval($input['dog_id'] ?? 0);
    $wpdb->query("SET NAMES 'binary'");
    $rows = $wpdb->get_results($wpdb->prepare("SELECT * FROM `poss_changeTab` WHERE dog_uid = %d ORDER BY uid DESC", $id), ARRAY_A);
    $wpdb->query("SET NAMES 'utf8mb4'");
    return ['success' => true, 'data' => kkc_convert($rows, 'EUC-KR', true)];
}
