<?php
/**
 * 파일명: handlers/member_logic.php
 * 수정사항: 지역 및 키워드 검색 시 16진수 바이너리 매칭(UNHEX) 적용하여 "부산" -> "부산광역시" 매칭 보장
 *           + [ADMIN] 관리자 전용 6자리 임시비밀번호 발급 및 알리고(Aligo) SMS 발송 핸들러 추가
 *           + [FIX] kkc_send_aligo_sms 를 운영 검증된 kkf_portal_send_aligo_sms 와 100% 동일 로직으로 교체
 *                   (mb_strcut EUC-KR 90바이트 절단 제거 → UTF-8 원본 메시지 그대로 전송, 한글 깨짐/문자 유실 해결)
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
    
    // 🎯 [KSAHO FILTER] 견사호가 있는 사람만 검색 (번식자 전용)
    if (!empty($input['only_saho'])) {
        $where[] = "TRIM(IFNULL(`saho`, '')) != '' AND `saho` NOT LIKE 'null'";
    }
    
    // 🔍 1. 키워드 검색 (아이디, 이름, 연락처 등)
    if (isset($input['search']) && trim($input['search']) !== '') {
        $q = trim($input['search']);
        // 🎯 헌법에 정의된 대로 CP949로 변환 후 16진수 추출
        $q_hex = bin2hex(kkc_convert($q, $enc, false));
        
        $search_field_input = $input['field'] ?? 'all';
        $fields = (!empty($search_field_input) && $search_field_input !== 'all') ? [$search_field_input] : $conf['search_fields'];
        
        $sub = [];
        foreach ($fields as $f) { 
            if ($f === 'birth') {
                // 🗓️ 생년월일 포맷 통합 검색 (890917, 19890917, 89-09-17, 1989-09-17, 8909, 198909 등 혼용 검색 완벽 대응)
                $clean_q = preg_replace('/[^0-9]/', '', $q);
                if (!empty($clean_q)) {
                    $sub[] = "(
                        REPLACE(`birth`, '-', '') LIKE '%{$clean_q}%'
                        OR (LENGTH(REPLACE(`birth`, '-', '')) = 8 AND SUBSTRING(REPLACE(`birth`, '-', ''), 3) LIKE '%{$clean_q}%')
                        OR (
                            ('{$clean_q}' LIKE '19%' OR '{$clean_q}' LIKE '20%') AND (
                                REPLACE(`birth`, '-', '') LIKE CONCAT('%', SUBSTRING('{$clean_q}', 3), '%')
                            )
                        )
                    )";
                } else {
                    $sub[] = "`birth` LIKE CONCAT('%', UNHEX('$q_hex'), '%')";
                }
            } else {
                // 🛡️ 한글 데이터가 포함된 binary 세션에서 UPPER() 사용은 데이터 망실 위험이 있어 제거
                $sub[] = "`$f` LIKE CONCAT('%', UNHEX('$q_hex'), '%')"; 
            }
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
        $where[] = "`mem_degree` LIKE UNHEX('$rank_hex')";
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

/**
 * 🏅 [ADMIN] 회원 등급 신청 목록 조회
 */
function kkc_handle_membership_applications_list($input) {
    global $wpdb;
    $page = max(1, intval($input['page'] ?? 1));
    $limit = 20;
    $offset = ($page - 1) * $limit;
    $status = $input['status'] ?? 'all';
    $search = trim($input['search'] ?? '');

    $where = ["1=1"];
    if ($status !== 'all') $where[] = $wpdb->prepare("status = %s", $status);
    if ($search !== '') $where[] = $wpdb->prepare("name LIKE %s", '%' . $search . '%');

    $where_sql = implode(" AND ", $where);
    $sql = "SELECT * FROM membership_applications WHERE $where_sql ORDER BY uid DESC LIMIT $limit OFFSET $offset";
    $list = $wpdb->get_results($sql, ARRAY_A);
    $total = $wpdb->get_var("SELECT COUNT(*) FROM membership_applications WHERE $where_sql");

    return [
        'success' => true,
        'data' => $list,
        'total' => (int)$total,
        'debug_sql' => $sql
    ];
}

/**
 * 🏅 [ADMIN] 회원 등급 신청 승인/거절 처리 (memTab 실시간 연동)
 */
function kkc_handle_membership_application_action($input) {
    global $wpdb, $KKC_TABLE_MAP;
    $uid = intval($input['uid'] ?? 0);
    $action = $input['action'] ?? ''; // 'approve' or 'reject'
    $admin_memo = $input['memo'] ?? '';

    if (!$uid) return ['success' => false, 'error' => '유효하지 않은 신청입니다.'];

    // 1. 신청 내역 조회
    $app = $wpdb->get_row($wpdb->prepare("SELECT * FROM membership_applications WHERE uid = %d", $uid), ARRAY_A);
    if (!$app) return ['success' => false, 'error' => '신청 내역을 찾을 수 없습니다.'];
    if ($app['status'] !== 'P') return ['success' => false, 'error' => '이미 처리가 완료된 건입니다.'];

    if ($action === 'reject') {
        $wpdb->update('membership_applications', 
            ['status' => 'N', 'process_date' => time(), 'admin_memo' => $admin_memo], 
            ['uid' => $uid]
        );
        return ['success' => true, 'message' => '거절 처리되었습니다.'];
    }

    // 🚀 [APPROVAL LOGIC] 승인 시 memTab 데이터 갱신
    $mid = $app['mid'];
    
    // 🛡️ 바이너리 세션 (memTab 접근용)
    $wpdb->query("SET NAMES 'binary'");
    $mem = $wpdb->get_row($wpdb->prepare("SELECT mid, id, birth, end_date FROM memTab WHERE mid = %d", $mid), ARRAY_A);
    
    if (!$mem) {
        $wpdb->query("SET NAMES 'utf8mb4'");
        return ['success' => false, 'error' => '연동된 회원을 찾을 수 없습니다.'];
    }

    $req_degree = $app['req_degree'] ?? 'A0';
    $req_years = intval($app['req_years'] ?? 1);
    $new_end_date = '0000-00-00';
    $current_date = date('Y-m-d');

    if ($req_degree === 'S0') {
        // 🎖️ 특별회원 (평생): 만 65세 유효일 계산 (생일 YYYYMMDD 가정)
        $birth = trim($mem['birth'] ?? '');
        if (strlen($birth) >= 4) {
            $birth_year = intval(substr($birth, 0, 4));
            $expiry_year = $birth_year + 65;
            $new_end_date = "$expiry_year-12-31";
        } else {
            $new_end_date = "2099-12-31"; // 생일 정보 없을 시 최대한 길게
        }
    } else {
        // 🎖️ 정회원: 연수 단위 연장
        $base_date = (!empty($mem['end_date']) && $mem['end_date'] > $current_date) ? $mem['end_date'] : $current_date;
        $new_end_date = date('Y-m-d', strtotime("+$req_years year", strtotime($base_date)));
    }

    // 🎯 memTab 업데이트 (등급, 유효기간, 승인일자)
    $enc = $KKC_TABLE_MAP['memTab']['encoding'] ?? 'CP949';
    $enc_degree = mb_convert_encoding($req_degree, $enc, 'UTF-8');
    $enc_end_date = mb_convert_encoding($new_end_date, $enc, 'UTF-8');
    $enc_signdate = mb_convert_encoding($current_date, $enc, 'UTF-8');

    $up_res = $wpdb->query($wpdb->prepare(
        "UPDATE memTab SET mem_degree = %s, end_date = %s, signdate = %s WHERE mid = %d",
        $enc_degree, $enc_end_date, $enc_signdate, $mid
    ));

    // 🛡️ 세션 원복
    $wpdb->query("SET NAMES 'utf8mb4'");

    if ($up_res === false) {
        return ['success' => false, 'error' => '회원 정보 갱신 중 오류가 발생했습니다.'];
    }

    // 2. 신청 내역 상태 업데이트 (최종)
    $wpdb->update('membership_applications', 
        ['status' => 'Y', 'process_date' => time(), 'admin_memo' => $admin_memo], 
        ['uid' => $uid]
    );

    return ['success' => true, 'message' => "승인 완료! 회원 등급이 [{$req_degree}]로, 유효기간이 [{$new_end_date}]로 갱신되었습니다."];
}

/* =========================================================================
 * 📱 [ALIGO SMS] 알리고 문자 발송 헬퍼
 * ========================================================================= */

/**
 * 알리고(Aligo) SMS 발송 헬퍼
 *
 * 🚀 [운영 검증 로직 이식]
 * handlers/member_portal_logic.php 의 kkf_portal_send_aligo_sms() 와
 * 토씨 하나 틀리지 않고 완전히 동일한 로직으로 동작합니다.
 *
 * ⚠️ [치명적 버그 수정 이력]
 * 기존 코드는 mb_strcut($msg, 0, 90, 'EUC-KR') 로 UTF-8 메시지를 90바이트에서 강제 절단했습니다.
 * UTF-8 한글은 1글자당 3바이트이므로 90바이트 경계에서 한글 중간이 잘려
 * 깨진 바이트(0x80~0xBF 단독 바이트)가 생성되었고, 이통사 단말에서
 * 문자 전체가 유실되는 장애가 발생했습니다.
 * → 절단 로직을 전면 제거하고 UTF-8 원본 메시지를 그대로 전송합니다.
 *
 * @param string $receiver 수신번호 ('-' 포함 가능, 내부에서 제거)
 * @param string $msg      발송할 메시지 (UTF-8 원본 그대로)
 * @return array ['success' => bool, 'code' => string, 'message' => string, 'error' => string, 'raw' => array, 'data' => array]
 */
if (!function_exists('kkc_send_aligo_sms')) {
    function kkc_send_aligo_sms($receiver, $msg) {
        $api_url = "https://apis.aligo.in/send/";

        // 🛡️ 수신번호 정규화 ('-' 제거) — 운영 검증 로직과 동일
        $receiver = str_replace('-', '', (string)$receiver);

        if ($receiver === '') {
            return [
                'success' => false,
                'code'    => '-1',
                'message' => '수신번호가 유효하지 않습니다.',
                'error'   => '수신번호가 유효하지 않습니다.',
                'raw'     => [],
                'data'    => []
            ];
        }

        // ✅ UTF-8 원본 메시지 그대로 전달 (절단 없음)
        $post_data = [
            'key'      => '0igka2rc8xvodn3dfaa1trcit0egkjai',
            'userid'   => 'kkcdog',
            'sender'   => '010-9999-3349',
            'receiver' => $receiver,
            'msg'      => (string)$msg,
            'msg_type' => 'SMS'
        ];

        $ch = curl_init($api_url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $res = curl_exec($ch);
        curl_close($ch);

        $json = json_decode($res, true);

        // 알리고 성공 코드는 '1'
        if ($json && intval($json['result_code'] ?? 0) === 1) {
            return [
                'success' => true,
                'code'    => '1',
                'message' => 'SMS 발송 성공',
                'raw'     => $json,
                'data'    => $json
            ];
        }

        $err = $json['message'] ?? '알리고 API 전송 응답 오류';

        return [
            'success' => false,
            'code'    => (string)($json['result_code'] ?? '-1'),
            'message' => $err,
            'error'   => $err,
            'raw'     => $json,
            'data'    => $json
        ];
    }
}

/* =========================================================================
 * 🔐 [ADMIN] 관리자 전용 6자리 임시비밀번호 발급 + SMS 발송
 * ========================================================================= */

/**
 * 관리자 전용 임시비밀번호(6자리) 발급 및 알리고 SMS 발송
 *
 * @param array $input ['mid' => int, 'hp' => string, 'name' => string]
 * @return array JSON 직렬화 대상 결과 배열
 */
function kkc_handle_admin_reset_temp_password($input) {
    global $wpdb, $KKC_TABLE_MAP;

    $mid  = intval($input['mid'] ?? 0);
    $hp   = trim((string)($input['hp'] ?? ''));
    $name = trim((string)($input['name'] ?? ''));

    // ✅ 1. 유효성 검사
    if (!$mid) {
        return ['success' => false, 'error' => '유효하지 않은 회원 식별자(mid)입니다.'];
    }

    $hp_digits = preg_replace('/[^0-9]/', '', $hp);
    if ($hp_digits === '' || strlen($hp_digits) < 9) {
        return ['success' => false, 'error' => '휴대폰 번호가 유효하지 않습니다.'];
    }

    if ($name === '') {
        return ['success' => false, 'error' => '회원 이름이 유효하지 않습니다.'];
    }

    // ✅ 2. 6자리 숫자 임시비밀번호 생성
    $temp_pw = sprintf("%06d", mt_rand(100000, 999999));

    // ✅ 3. memTab 비밀번호 갱신 (바이너리 세션 + 이스케이프)
    $enc = $KKC_TABLE_MAP['memTab']['encoding'] ?? 'CP949';

    $wpdb->query("SET NAMES 'binary'");

    // 🛡️ 회원 존재 여부 확인
    $exists = $wpdb->get_var($wpdb->prepare("SELECT mid FROM memTab WHERE mid = %d", $mid));
    if ($exists === null) {
        $wpdb->query("SET NAMES 'utf8mb4'");
        return ['success' => false, 'error' => '해당 회원을 찾을 수 없습니다.'];
    }

    // 🛡️ 이스케이프 처리된 비밀번호 (바이너리 세션 대응)
    $esc_pw = esc_sql($temp_pw);

    $up_res = $wpdb->query($wpdb->prepare(
        "UPDATE memTab SET passwd = %s WHERE mid = %d",
        $esc_pw, $mid
    ));

    if ($up_res === false) {
        $wpdb->query("SET NAMES 'utf8mb4'");
        return ['success' => false, 'error' => '비밀번호 갱신 중 DB 오류가 발생했습니다.'];
    }

    // ✅ 4. memo 컬럼에 감사 로그 추가 (기존 메모 보존 + append)
    $log_stamp = date('Y-m-d H:i');
    $log_text  = "[{$log_stamp} 관리자 임시비밀번호(6자리) SMS 발송]";

    $prev_memo = $wpdb->get_var($wpdb->prepare("SELECT memo FROM memTab WHERE mid = %d", $mid));
    $prev_memo = ($prev_memo === null) ? '' : (string)$prev_memo;

    $new_memo = ($prev_memo === '') ? $log_text : ($prev_memo . "\n" . $log_text);

    // 🛡️ CP949(바이너리) 저장을 위한 인코딩 변환 + 이스케이프
    $enc_memo = mb_convert_encoding($new_memo, $enc, 'UTF-8');
    $esc_memo = esc_sql($enc_memo);

    $wpdb->query($wpdb->prepare(
        "UPDATE memTab SET memo = %s WHERE mid = %d",
        $esc_memo, $mid
    ));

    // 🛡️ 세션 원복
    $wpdb->query("SET NAMES 'utf8mb4'");

    // ✅ 5. SMS 발송 (UTF-8 원본 메시지 그대로 전달)
    $msg = "[KKC 한국애견협회] 임시비밀번호는 [" . $temp_pw . "] 입니다. 로그인 후 변경 바랍니다.";
    $sms = kkc_send_aligo_sms($hp_digits, $msg);

    // ✅ 6. 결과 JSON 반환 (기존 호출부와 완벽 호환)
    if (empty($sms['success'])) {
        return [
            'success'     => false,
            'error'       => '임시비밀번호는 발급되었으나 SMS 발송에 실패했습니다. (' . ($sms['message'] ?? $sms['error'] ?? '알 수 없는 오류') . ')',
            'mid'         => $mid,
            'name'        => $name,
            'hp'          => $hp_digits,
            'sms_sent'    => false,
            'sms_code'    => $sms['code'] ?? '',
            'sms_message' => $sms['message'] ?? '',
            'sms_raw'     => $sms['raw'] ?? []
        ];
    }

    return [
        'success'     => true,
        'message'     => "[{$name}] 회원의 임시비밀번호가 발급되어 SMS로 발송되었습니다.",
        'mid'         => $mid,
        'name'        => $name,
        'hp'          => $hp_digits,
        'sms_sent'    => true,
        'sms_code'    => $sms['code'] ?? '',
        'sms_message' => $sms['message'] ?? '',
        'sms_raw'     => $sms['raw'] ?? []
    ];
}
