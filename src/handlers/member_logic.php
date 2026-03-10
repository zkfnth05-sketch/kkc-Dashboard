<?php
/**
 * 파일명: handlers/member_logic.php
 * 수정사항: 지역 및 키워드 검색 시 16진수 바이너리 매칭(UNHEX) 적용하여 "부산" -> "부산광역시" 매칭 보장
 */

if (!defined('ABSPATH')) exit;

function kkc_handle_member_list($input) {
    global $wpdb, $KKC_TABLE_MAP;
    $conf = $KKC_TABLE_MAP['memTab'];
    $enc = $conf['encoding'];
    
    $page = max(1, intval($input['page'] ?? 1));
    $limit = intval($input['limit'] ?? 50);
    $offset = ($page - 1) * $limit;
    
    @set_time_limit(0);
    // 🛡️ [Binary 모드] 데이터 왜곡 방지를 위해 바이너리 세션 활성화
    $wpdb->query("SET NAMES 'binary'");
    
    $where = ["1=1"];
    
    // 🔍 1. 키워드 검색 (아이디, 이름, 연락처 등)
    if (isset($input['search']) && trim($input['search']) !== '') {
        $q = trim($input['search']);
        // 🎯 헌법에 정의된 대로 CP949로 변환 후 16진수 추출
        $q_hex = bin2hex(kkc_convert($q, $enc, false));
        
        $search_field_input = $input['field'] ?? 'all';
        $fields = (!empty($search_field_input) && $search_field_input !== 'all') ? [$search_field_input] : $conf['search_fields'];
        
        $sub = [];
        foreach ($fields as $f) { 
            // 🛡️ 한글 데이터가 포함된 binary 세션에서 UPPER() 사용은 데이터 망실 위험이 있어 제거
            $sub[] = "`$f` LIKE CONCAT('%', UNHEX('$q_hex'), '%')"; 
        }
        $where[] = "(" . implode(" OR ", $sub) . ")";
    }

    // 📍 2. 지역 검색 (부산 -> 부산광역시 매칭 보장 로직)
    if (isset($input['region']) && trim($input['region']) !== '') {
        $region_input = trim($input['region']);
        $parts = preg_split('/\s+/', $region_input); 
        $region_conditions = [];
        
        // 헌법에 정의된 지역 필드 사용 (없을 경우 기본 주소 필드들 강제 지정)
        $target_region_fields = $conf['region_fields'] ?? ['addr', 'addr_1', 'addr2', 'addr2_1'];
        
        foreach ($parts as $part) {
            if (!$part) continue;
            
            // 🎯 "부산"의 CP949 바이트를 16진수 코드로 변환
            $p_hex = bin2hex(kkc_convert($part, $enc, false));
            
            $sub = [];
            foreach ($target_region_fields as $rf) {
                // 🛡️ DB 엔진이 바이트 시퀀스를 직접 비교하게 하여 "부산"이 "부산광역시" 내에 있는지 확인
                $sub[] = "`$rf` LIKE CONCAT('%', UNHEX('$p_hex'), '%')";
            }
            $region_conditions[] = "(" . implode(" OR ", $sub) . ")";
        }
        
        if (!empty($region_conditions)) {
            // 여러 단어 입력 시 (예: 부산 해운대) 모두 포함된 데이터 필터링
            $where[] = "(" . implode(" AND ", $region_conditions) . ")";
        }
    }

    // 🎖️ 3. 등급 필터 (정확한 매칭을 위해 16진수 리터럴 사용)
    if (isset($input['rank']) && $input['rank'] !== 'all' && trim($input['rank']) !== '') {
        $rank_val = trim($input['rank']);
        $rank_hex = bin2hex(kkc_convert($rank_val, $enc, false));
        $where[] = "`mem_degree` = UNHEX('$rank_hex')";
    }

    // 📅 4. 가입일 필터
    if (!empty($input['date_start']) && !empty($input['date_end'])) {
        $ts_start = strtotime($input['date_start']);
        $ts_end = strtotime($input['date_end'] . ' 23:59:59');
        if ($ts_start && $ts_end) {
            $where[] = "(`firstdate` BETWEEN $ts_start AND $ts_end)";
        }
    }

    // 🏆 5. 전문 등급(pro_class) 필터 추가 (하이픈 사이의 독립 단위 정밀 검색)
    if (isset($input['pro_class']) && trim($input['pro_class']) !== '') {
        $p_class_raw = trim($input['pro_class']);
        $p_hex = bin2hex(kkc_convert($p_class_raw, $enc, false));
        
        // 🛡️ [TOKEN MATCH 알고리즘]
        // 1. BINARY: 대소문자를 엄격하게 구분합니다.
        // 2. CONCAT('-', ..., '-'): 필드와 검색어 앞뒤에 하이픈을 강제로 붙여 비교합니다.
        // 이로써 'PS1' 검색 시 'PS10'이나 'APS1'이 걸러지는 것을 방지하고, 하이픈 사이의 '정확한 단위'만 추출합니다.
        // 또한 'TR5-TR2' 같은 긴 문자열도 전체가 하나의 단위로 취급되어 포함 여부를 정확히 판단합니다.
        $where[] = "BINARY CONCAT('-', `pro_class`, '-') LIKE CONCAT('%-', UNHEX('$p_hex'), '-%')";
    }

    $final_where = implode(" AND ", $where);
    $sql = "SELECT * FROM `memTab` WHERE $final_where ORDER BY mid DESC LIMIT $limit OFFSET $offset";
    $data = $wpdb->get_results($sql, ARRAY_A);
    
    $total = $wpdb->get_var("SELECT COUNT(*) FROM `memTab` WHERE $final_where");
    
    // 🛡️ 세션 원복 (워드프레스 기본 통신용)
    $wpdb->query("SET NAMES 'utf8mb4'");
    
    return [
        'success' => true, 
        'data' => kkc_convert($data, $enc, true), 
        'total' => (int)$total,
        'debug_sql' => $sql 
    ];
}

function kkc_handle_member_export($input) {
    return kkc_handle_member_list($input);
}

function kkc_handle_admin_login($input) {
    $id = $input['id'] ?? '';
    $pw = $input['pw'] ?? '';

    if (empty($id) || empty($pw)) {
        return ['success' => false, 'error' => '아이디와 비밀번호를 입력해주세요.'];
    }

    // 🛡️ 워드프레스 인증 함수 사용
    $user = wp_authenticate($id, $pw);

    if (is_wp_error($user)) {
        return ['success' => false, 'error' => $user->get_error_message()];
    } else {
        // 로그인 성공 시 사용자 세션 설정 (필요에 따라)
        wp_set_current_user($user->ID);
        wp_set_auth_cookie($user->ID, true);

        return ['success' => true, 'message' => '로그인 성공'];
    }
}
