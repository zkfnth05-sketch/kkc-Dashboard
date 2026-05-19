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
        $q_utf8_hex = bin2hex($search_query); 
        $fields = ($field_input !== 'all') ? [$field_input] : $conf['search_fields'];
        
        // 🎯 [FUZZY REGISTRATION SEARCH] 하이픈(-), 슬러시(/), 점(.), 밑줄(_), 공백 제거 버전 생성
        $clean_query = str_replace(['-', '/', '.', ' ', '_'], '', $search_query);
        $clean_hex = bin2hex($clean_query);
        
        $sub = [];
        foreach ($fields as $f) { 
            if ($f === 'fa_regno') {
                // 부견 번호로 검색 시, 부견의 모든 가능한 등록번호 필드(reg_no, foreign100, foreign_no, foreign_no2)를 체크
                $sub[] = "(
                    (REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CONVERT(`p_fa`.`reg_no` USING utf8mb4), '-', ''), '/', ''), '.', ''), ' ', ''), '_', '') LIKE CONCAT('%', UNHEX('$clean_hex'), '%'))
                    OR (REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CONVERT(`p_fa`.`foreign100` USING utf8mb4), '-', ''), '/', ''), '.', ''), ' ', ''), '_', '') LIKE CONCAT('%', UNHEX('$clean_hex'), '%'))
                    OR (REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CONVERT(`p_fa`.`foreign_no` USING utf8mb4), '-', ''), '/', ''), '.', ''), ' ', ''), '_', '') LIKE CONCAT('%', UNHEX('$clean_hex'), '%'))
                    OR (REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CONVERT(`p_fa`.`foreign_no2` USING utf8mb4), '-', ''), '/', ''), '.', ''), ' ', ''), '_', '') LIKE CONCAT('%', UNHEX('$clean_hex'), '%'))
                    OR `dogTab`.`fa_regno` LIKE CONCAT('%', UNHEX('$q_utf8_hex'), '%')
                )";
            } else if ($f === 'mo_regno') {
                // 모견 번호로 검색 시, 모견의 모든 가능한 등록번호 필드(reg_no, foreign100, foreign_no, foreign_no2)를 체크
                $sub[] = "(
                    (REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CONVERT(`p_mo`.`reg_no` USING utf8mb4), '-', ''), '/', ''), '.', ''), ' ', ''), '_', '') LIKE CONCAT('%', UNHEX('$clean_hex'), '%'))
                    OR (REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CONVERT(`p_mo`.`foreign100` USING utf8mb4), '-', ''), '/', ''), '.', ''), ' ', ''), '_', '') LIKE CONCAT('%', UNHEX('$clean_hex'), '%'))
                    OR (REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CONVERT(`p_mo`.`foreign_no` USING utf8mb4), '-', ''), '/', ''), '.', ''), ' ', ''), '_', '') LIKE CONCAT('%', UNHEX('$clean_hex'), '%'))
                    OR (REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CONVERT(`p_mo`.`foreign_no2` USING utf8mb4), '-', ''), '/', ''), '.', ''), ' ', ''), '_', '') LIKE CONCAT('%', UNHEX('$clean_hex'), '%'))
                    OR `dogTab`.`mo_regno` LIKE CONCAT('%', UNHEX('$q_utf8_hex'), '%')
                )";
            } else if ($f === 'reg_no') {
                // 등록번호(reg_no)로 검색 시, 본인 등록번호뿐만 아니라 국내타단체번호, 외국타단체번호1/2도 같이 검사
                $sub[] = "(
                    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CONVERT(`dogTab`.`reg_no` USING utf8mb4), '-', ''), '/', ''), '.', ''), ' ', ''), '_', '') LIKE CONCAT('%', UNHEX('$clean_hex'), '%')
                    OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CONVERT(`dogTab`.`foreign100` USING utf8mb4), '-', ''), '/', ''), '.', ''), ' ', ''), '_', '') LIKE CONCAT('%', UNHEX('$clean_hex'), '%')
                    OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CONVERT(`dogTab`.`foreign_no` USING utf8mb4), '-', ''), '/', ''), '.', ''), ' ', ''), '_', '') LIKE CONCAT('%', UNHEX('$clean_hex'), '%')
                    OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CONVERT(`dogTab`.`foreign_no2` USING utf8mb4), '-', ''), '/', ''), '.', ''), ' ', ''), '_', '') LIKE CONCAT('%', UNHEX('$clean_hex'), '%')
                )";
            } else if (in_array($f, ['foreign_no', 'foreign_no2'])) {
                // 외국타단체 번호 검색 시, 1과 2 모두 교차 검사하여 누락 방지
                $sub[] = "(
                    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CONVERT(`dogTab`.`foreign_no` USING utf8mb4), '-', ''), '/', ''), '.', ''), ' ', ''), '_', '') LIKE CONCAT('%', UNHEX('$clean_hex'), '%')
                    OR REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CONVERT(`dogTab`.`foreign_no2` USING utf8mb4), '-', ''), '/', ''), '.', ''), ' ', ''), '_', '') LIKE CONCAT('%', UNHEX('$clean_hex'), '%')
                )";
            } else if (in_array($f, ['foreign100', 'micro'])) {
                // 기타 식별 관련 필드들은 특수 기호를 소거하여 느슨하게 매칭
                $sub[] = "REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(CONVERT(`dogTab`.`$f` USING utf8mb4), '-', ''), '/', ''), '.', ''), ' ', ''), '_', '') LIKE CONCAT('%', UNHEX('$clean_hex'), '%')";
            } else {
                $sub[] = "CONVERT(`dogTab`.`$f` USING utf8mb4) LIKE CONCAT('%', UNHEX('$q_utf8_hex'), '%')"; 
            }
        }
        $where[] = "(" . implode(" OR ", $sub) . ")";
    } else if ($field_input !== 'all') {
        if ($field_input === 'mo_regno') {
            $where[] = "(`p_mo`.`reg_no` IS NOT NULL AND `p_mo`.`reg_no` <> '')";
        } else if ($field_input === 'fa_regno') {
            $where[] = "(`p_fa`.`reg_no` IS NOT NULL AND `p_fa`.`reg_no` <> '')";
        } else {
            $where[] = "(`dogTab`.`$field_input` IS NOT NULL AND `dogTab`.`$field_input` <> '' AND `dogTab`.`$field_input` <> '0')";
        }
    }

    $final_where = implode(" AND ", $where);
    $rank_filter = isset($input['rank']) && $input['rank'] !== 'all' && $input['rank'] !== '' ? $input['rank'] : null;

    // 🚀 [JOIN OPTIMIZATION] 부모 정보를 항상 조인하여 검색 및 표시 정합성 확보
    $base_join = " LEFT JOIN `dogTab` as p_fa ON `dogTab`.fa_regno = p_fa.uid 
                   LEFT JOIN `dogTab` as p_mo ON `dogTab`.mo_regno = p_mo.uid ";

    if ($rank_filter) {
        $rank_hex = bin2hex(kkc_convert($rank_filter, $enc, false));
        $full_join = " INNER JOIN `memTab` ON `dogTab`.`poss_id` = `memTab`.`id` " . $base_join;
        
        $total = $wpdb->get_var("SELECT COUNT(*) FROM `dogTab` $full_join WHERE $final_where AND `memTab`.`mem_degree` LIKE UNHEX('$rank_hex')");
        $sql = "SELECT `dogTab`.*, p_fa.reg_no as sire_reg_no_text, p_fa.fullname as sire_name_text, p_mo.reg_no as dam_reg_no_text, p_mo.fullname as dam_name_text 
                FROM `dogTab` $full_join
                WHERE $final_where AND `memTab`.`mem_degree` LIKE UNHEX('$rank_hex') 
                ORDER BY `dogTab`.uid DESC LIMIT $limit OFFSET $offset";
    } else {
        $total = $wpdb->get_var("SELECT COUNT(*) FROM `dogTab` $base_join WHERE $final_where");
        $sql = "SELECT `dogTab`.*, p_fa.reg_no as sire_reg_no_text, p_fa.fullname as sire_name_text, p_mo.reg_no as dam_reg_no_text, p_mo.fullname as dam_name_text 
                FROM `dogTab` $base_join
                WHERE $final_where ORDER BY `dogTab`.uid DESC LIMIT $limit OFFSET $offset";
    }

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
