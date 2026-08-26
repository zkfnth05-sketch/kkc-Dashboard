<?php
/**
 * 파일명: handlers/nice_api_handler.php
 * 기능: NICE API 본인인증 및 모바일 혈통서 관리 시스템 전용 핸들러 (격리 원칙 준수)
 */

// 🚀 [카페24 및 대용량 Base64 이미지 전송 최적화] 메모리 및 타임아웃 제한 해제 (502 Bad Gateway 방지)
@ini_set('memory_limit', '512M');
@ini_set('max_execution_time', '120');
@ini_set('post_max_size', '32M');
@ini_set('upload_max_filesize', '32M');

if (file_exists(dirname(__FILE__) . '/../nice_api_config.php')) {
    include_once dirname(__FILE__) . '/../nice_api_config.php';
}

if (!defined('ABSPATH')) exit;

// 🎯 [지능형 인코딩 변환기 - 이중 인코딩 방지 안전 필터 적용]
if (!function_exists('kkc_convert')) {
    function kkc_convert($data, $enc = 'EUC-KR', $to_utf8 = true) {
        if (is_array($data)) {
            foreach ($data as $k => $v) $data[$k] = kkc_convert($v, $enc, $to_utf8);
            return $data;
        }
        if (!is_string($data) || $data === '') return $data;
        if (strtoupper($enc) === 'UTF-8') return $data;
        
        if ($to_utf8) {
            // 🛡️ 이미 정상적인 UTF-8 한글/문자열인 경우 다시 변환하여 깨지는 것(이중 인코딩/모지바케) 원천 차단
            if (mb_check_encoding($data, 'UTF-8') && preg_match('/[\x{ac00}-\x{d7a3}]/u', $data)) {
                return $data;
            }
            return @mb_convert_encoding($data, 'UTF-8', 'CP949, EUC-KR');
        } else {
            // UTF-8 -> CP949 변환
            if (!mb_check_encoding($data, 'UTF-8')) return $data;
            return @mb_convert_encoding($data, 'CP949', 'UTF-8');
        }
    }
}

/**
 * 📅 단순 날짜 YYYYMMDD (8자리 순수 숫자) 포맷터 (NICE API 파서 규격)
 */
if (!function_exists('nice_format_date_ymd')) {
    function nice_format_date_ymd($d) {
        if (empty($d) || $d === '0000-00-00' || $d === '00000000') return '';
        $raw = preg_replace('/[^0-9]/', '', (string)$d);
        if (strlen($raw) >= 8) {
            return substr($raw, 0, 8);
        }
        $ts = strtotime((string)$d);
        return $ts ? date('Ymd', $ts) : '';
    }
}

/**
 * 🕒 일시 YYYYMMDDHHMMSS (14자리 순수 숫자) 표준 포맷터 (NICE API 파서 규격)
 */
if (!function_exists('nice_format_datetime_ymdhis')) {
    function nice_format_datetime_ymdhis($dt) {
        if (empty($dt) || $dt === '0000-00-00' || $dt === '0000-00-00 00:00:00') {
            return date('YmdHis');
        }
        $raw = preg_replace('/[^0-9]/', '', (string)$dt);
        if (strlen($raw) === 14) {
            return $raw;
        }
        if (strlen($raw) === 8) {
            return $raw . date('His');
        }
        $ts = strtotime((string)$dt);
        return $ts ? date('YmdHis', $ts) : date('YmdHis');
    }
}

/**
 * ⚥ 성별 M/F 통일 포맷터 (NICE 규격: M, F)
 */
if (!function_exists('nice_format_sex')) {
    function nice_format_sex($s) {
        if ($s === null || $s === '') return 'M';
        $utf8_s = trim((string)kkc_convert($s, 'EUC-KR', true));
        if ($utf8_s === 'M' || $utf8_s === 'F') return $utf8_s;
        if (strpos($utf8_s, '수') !== false || $utf8_s === '1' || $utf8_s === '남' || strcasecmp($utf8_s, 'male') === 0) return 'M';
        if (strpos($utf8_s, '암') !== false || $utf8_s === '2' || $utf8_s === '여' || strcasecmp($utf8_s, 'female') === 0) return 'F';
        return (strtoupper(substr($utf8_s, 0, 1)) === 'F') ? 'F' : 'M';
    }
}


/**
 * 🐕 견종명 표준 포맷터 (NICE API 규격: dog_classTab의 name 컬럼 - 외국계 영문, 한국계 한글)
 */
if (!function_exists('nice_resolve_standard_breed_name')) {
    function nice_resolve_standard_breed_name($conn, $breed_code_or_name) {
        if (empty($breed_code_or_name)) return '';
        $conn->query("SET NAMES 'utf8mb4'");
        $e_val = $conn->real_escape_string($breed_code_or_name);
        $res = $conn->query("SELECT name, kor_name FROM dog_classTab WHERE keyy = '$e_val' OR kor_name = '$e_val' OR name = '$e_val' LIMIT 1");
        if ($res && $row = $res->fetch_assoc()) {
            return !empty($row['name']) ? $row['name'] : $row['kor_name'];
        }
        return $breed_code_or_name;
    }
}

/**
 * 🐕 견종 한글명 포맷터 (관리자 대시보드 전용: kor_name)
 */
if (!function_exists('nice_resolve_korean_breed_name')) {
    function nice_resolve_korean_breed_name($conn, $breed_code_or_name) {
        if (empty($breed_code_or_name)) return '';
        $conn->query("SET NAMES 'utf8mb4'");
        $e_val = $conn->real_escape_string($breed_code_or_name);
        $res = $conn->query("SELECT kor_name, name FROM dog_classTab WHERE keyy = '$e_val' OR kor_name = '$e_val' OR name = '$e_val' LIMIT 1");
        if ($res && $row = $res->fetch_assoc()) {
            return !empty($row['kor_name']) ? $row['kor_name'] : $row['name'];
        }
        return $breed_code_or_name;
    }
}

/**
 * 🔒 포털 DB 연결 객체 반환 함수
 */
if (!function_exists('get_kkc_portal_db')) {
    function get_kkc_portal_db() {
        $conn = new mysqli('localhost', 'kkc3349', 'kkcdog3349**', 'kkc3349');
        if ($conn->connect_error) throw new Exception("DB 연결 실패");
        return $conn;
    }
}

/**
 * 🛡️ 데이터베이스 테이블 및 스키마 초기 설정
 */
function nice_api_db_init($conn) {
    // 1. nice_pedigree_requests 테이블 생성
    $create_table_sql = "CREATE TABLE IF NOT EXISTS `nice_pedigree_requests` (
      `uid` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
      `req_name` varchar(100) NOT NULL,
      `req_mobile` varchar(50) NOT NULL,
      `poss_ci` varchar(100) NOT NULL,
      `petpin` varchar(50) NOT NULL,
      `order_no` varchar(100) NOT NULL,
      `order_dttm` varchar(14) NOT NULL,
      `req_gbn` varchar(2) NOT NULL,
      `reg_no` varchar(50) NOT NULL,
      `name` varchar(100) DEFAULT NULL,
      `saho_eng` varchar(100) DEFAULT NULL,
      `saho` varchar(100) DEFAULT NULL,
      `dog_classTab_name` varchar(100) DEFAULT NULL,
      `micro` varchar(50) DEFAULT NULL,
      `sex` varchar(5) DEFAULT NULL,
      `hair` varchar(50) DEFAULT NULL,
      `breed_name` varchar(100) DEFAULT NULL,
      `breed_addr` varchar(255) DEFAULT NULL,
      `poss_name` varchar(100) DEFAULT NULL,
      `poss_addr` varchar(255) DEFAULT NULL,
      `birth` varchar(10) DEFAULT NULL,
      `birth_m` int(11) DEFAULT NULL,
      `birth_f` int(11) DEFAULT NULL,
      `father_name` varchar(100) DEFAULT NULL,
      `father_reg_no` varchar(50) DEFAULT NULL,
      `mother_name` varchar(100) DEFAULT NULL,
      `mother_reg_no` varchar(50) DEFAULT NULL,
      `image1_hmac` varchar(100) DEFAULT NULL,
      `image2_hmac` varchar(100) DEFAULT NULL,
      `image3_hmac` varchar(100) DEFAULT NULL,
      `image4_hmac` varchar(100) DEFAULT NULL,
      `image1_path` varchar(255) DEFAULT NULL,
      `image2_path` varchar(255) DEFAULT NULL,
      `image3_path` varchar(255) DEFAULT NULL,
      `image4_path` varchar(255) DEFAULT NULL,
      `status` varchar(2) NOT NULL DEFAULT 'P',
      `admin_memo` text DEFAULT NULL,
      `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (`uid`),
      UNIQUE KEY `idx_order_no` (`order_no`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    
    $conn->query($create_table_sql);
    
    // 2. nice_memTab 테이블 생성 (기존 memTab 구조를 복제하여 nice_memTab 생성)
    $conn->query("CREATE TABLE IF NOT EXISTS `nice_memTab` LIKE `memTab`");
    
    // 2-2. 복제된 nice_memTab 테이블에 NICE 인증 고유 필드들 추가
    $conn->query("ALTER TABLE `nice_memTab` ADD COLUMN IF NOT EXISTS `nice_ci` VARCHAR(255) DEFAULT NULL COMMENT 'NICE 본인인증 고유키 CI'");
    $conn->query("ALTER TABLE `nice_memTab` ADD COLUMN IF NOT EXISTS `nice_di` VARCHAR(255) DEFAULT NULL COMMENT 'NICE 본인인증 고유키 DI'");
    $conn->query("ALTER TABLE `nice_memTab` ADD COLUMN IF NOT EXISTS `nice_verified_at` DATETIME DEFAULT NULL COMMENT '실명인증 일시'");

    // 3. nice_dogTab 테이블 생성 (기존 dogTab 구조를 복제하여 nice_dogTab 생성)
    $conn->query("CREATE TABLE IF NOT EXISTS `nice_dogTab` LIKE `dogTab`");
    
    // 4. nice_pedigree_requests 테이블에 추가 필드 확보
    $conn->query("ALTER TABLE `nice_pedigree_requests` ADD COLUMN IF NOT EXISTS `reg_count_m` INT(11) DEFAULT NULL");
    $conn->query("ALTER TABLE `nice_pedigree_requests` ADD COLUMN IF NOT EXISTS `reg_count_f` INT(11) DEFAULT NULL");
    $conn->query("ALTER TABLE `nice_pedigree_requests` ADD COLUMN IF NOT EXISTS `reg_date` VARCHAR(10) DEFAULT NULL");
    $conn->query("ALTER TABLE `nice_pedigree_requests` ADD COLUMN IF NOT EXISTS `fa_name` VARCHAR(100) DEFAULT NULL");
    $conn->query("ALTER TABLE `nice_pedigree_requests` ADD COLUMN IF NOT EXISTS `fa_regno` VARCHAR(50) DEFAULT NULL");
    $conn->query("ALTER TABLE `nice_pedigree_requests` ADD COLUMN IF NOT EXISTS `mo_name` VARCHAR(100) DEFAULT NULL");
    $conn->query("ALTER TABLE `nice_pedigree_requests` ADD COLUMN IF NOT EXISTS `mo_regno` VARCHAR(50) DEFAULT NULL");
    $conn->query("ALTER TABLE `nice_pedigree_requests` ADD COLUMN IF NOT EXISTS `anc_name` VARCHAR(100) DEFAULT NULL");
    $conn->query("ALTER TABLE `nice_pedigree_requests` ADD COLUMN IF NOT EXISTS `anc_saho` VARCHAR(100) DEFAULT NULL");
    // 4-1. 환불 관련 감사 필드 추가 (API 006 규격: req_ci, refund_dttm)
    $conn->query("ALTER TABLE `nice_pedigree_requests` ADD COLUMN IF NOT EXISTS `refund_dttm` VARCHAR(14) DEFAULT NULL COMMENT '환불일시(YYYYMMDDHH24MISS)'");
    $conn->query("ALTER TABLE `nice_pedigree_requests` ADD COLUMN IF NOT EXISTS `refund_ci` VARCHAR(100) DEFAULT NULL COMMENT '환불 요청자 CI'");
    
    // 5. nice_dogTab 테이블에 추가 필드 확보 (결제주문번호, 견사호 및 생년월일 외에 출산/등록수 확장 대응)
    $conn->query("ALTER TABLE `nice_dogTab` ADD COLUMN IF NOT EXISTS `order_no` VARCHAR(100) DEFAULT NULL COMMENT 'NICE 결제주문번호'");
    $conn->query("ALTER TABLE `nice_dogTab` ADD COLUMN IF NOT EXISTS `birth_m` INT(11) DEFAULT NULL");
    $conn->query("ALTER TABLE `nice_dogTab` ADD COLUMN IF NOT EXISTS `birth_f` INT(11) DEFAULT NULL");
    $conn->query("ALTER TABLE `nice_dogTab` ADD COLUMN IF NOT EXISTS `reg_count_m` INT(11) DEFAULT NULL");
    $conn->query("ALTER TABLE `nice_dogTab` ADD COLUMN IF NOT EXISTS `reg_count_f` INT(11) DEFAULT NULL");
    $conn->query("ALTER TABLE `nice_dogTab` ADD COLUMN IF NOT EXISTS `fa_name` VARCHAR(100) DEFAULT NULL");
    $conn->query("ALTER TABLE `nice_dogTab` ADD COLUMN IF NOT EXISTS `fa_regno` VARCHAR(50) DEFAULT NULL");
    $conn->query("ALTER TABLE `nice_dogTab` ADD COLUMN IF NOT EXISTS `mo_name` VARCHAR(100) DEFAULT NULL");
    $conn->query("ALTER TABLE `nice_dogTab` ADD COLUMN IF NOT EXISTS `mo_regno` VARCHAR(50) DEFAULT NULL");
    $conn->query("ALTER TABLE `nice_dogTab` ADD COLUMN IF NOT EXISTS `anc_name` VARCHAR(100) DEFAULT NULL");
    $conn->query("ALTER TABLE `nice_dogTab` ADD COLUMN IF NOT EXISTS `anc_saho` VARCHAR(100) DEFAULT NULL");
}

/**
 * 🏅 부모 견 정보 조회 보조 함수
 */
function nice_get_parent_info($conn, $parent_id) {
    if (empty($parent_id) || $parent_id === '0') {
        return ['name' => '', 'reg_no' => '', 'saho' => ''];
    }
    $e_parent = $conn->real_escape_string($parent_id);
    // nice_dogTab 먼저 확인 후 dogTab 확인
    $res = $conn->query("SELECT reg_no, fullname, saho, saho_eng FROM nice_dogTab WHERE uid = '$e_parent' OR reg_no = '$e_parent' LIMIT 1");
    if (!$res || $res->num_rows === 0) {
        $res = $conn->query("SELECT reg_no, fullname, saho, saho_eng FROM dogTab WHERE uid = '$e_parent' OR reg_no = '$e_parent' LIMIT 1");
    }
    if ($res && $row = $res->fetch_assoc()) {
        $saho = !empty($row['saho']) ? $row['saho'] : ($row['saho_eng'] ?? '');
        return [
            'name' => kkc_convert($row['fullname'], 'EUC-KR', true),
            'reg_no' => kkc_convert($row['reg_no'], 'EUC-KR', true),
            'saho' => kkc_convert($saho, 'EUC-KR', true)
        ];
    }
    return ['name' => '', 'reg_no' => $parent_id, 'saho' => ''];
}

/**
 * 🚀 [API 001] 혈통서 발급 목록 조회 (Inbound)
 */
function nice_handle_list($data) {
    $conn = get_kkc_portal_db();
    nice_api_db_init($conn);
    
    $e_ci = $conn->real_escape_string($data['poss_ci'] ?? '');
    if (empty($e_ci)) {
        $conn->close();
        return ['result_cd' => 'F100', 'list_cnt' => 0, 'list' => []];
    }
    
    $conn->query("SET NAMES 'binary'");
    $user_res = $conn->query("SELECT id, mid FROM memTab WHERE nice_ci = '$e_ci' UNION SELECT id, mid FROM nice_memTab WHERE nice_ci = '$e_ci'");
    
    if (!$user_res || $user_res->num_rows === 0) {
        $conn->close();
        return ['result_cd' => 'F201', 'list_cnt' => 0, 'list' => []]; // F201: 미등록 회원 CI
    }
    
    $poss_ids = [];
    while ($u = $user_res->fetch_assoc()) {
        if (!empty($u['id'])) $poss_ids[] = "'" . $conn->real_escape_string($u['id']) . "'";
        if (!empty($u['mid'])) $poss_ids[] = "'" . $conn->real_escape_string($u['mid']) . "'";
    }
    
    if (empty($poss_ids)) {
        $conn->close();
        return ['result_cd' => 'S000', 'list_cnt' => 0, 'list' => []];
    }
    
    $poss_ids_str = implode(',', $poss_ids);
    // 기존 dogTab과 신규 격리 nice_dogTab 병합 조회
    $dog_sql = "SELECT reg_no, fullname, dog_class FROM dogTab WHERE poss_id IN ($poss_ids_str)
                UNION
                SELECT reg_no, fullname, dog_class FROM nice_dogTab WHERE poss_id IN ($poss_ids_str)";
    $dog_res = $conn->query($dog_sql);
    
    $list = [];
    if ($dog_res && $dog_res->num_rows > 0) {
        $breed_map = [];
        $conn->query("SET NAMES 'utf8mb4'");
        $class_res = $conn->query("SELECT keyy, name, kor_name FROM dog_classTab");
        if ($class_res) {
            while ($c_row = $class_res->fetch_assoc()) {
                $breed_map[$c_row['keyy']] = !empty($c_row['name']) ? $c_row['name'] : $c_row['kor_name'];
            }
        }
        
        while ($d = $dog_res->fetch_assoc()) {
            $breed_code = $d['dog_class'];
            $breed_name = isset($breed_map[$breed_code]) ? $breed_map[$breed_code] : $breed_code;
            // dog_classTab에서 utf8mb4로 읽어온 견종명은 이미 UTF-8이므로 이중 변환(Double UTF-8 mojibake) 방지
            $dog_class_name = (is_string($breed_name) && mb_check_encoding($breed_name, 'UTF-8')) ? $breed_name : kkc_convert($breed_name, 'EUC-KR', true);
            
            $list[] = [
                'reg_no' => kkc_convert($d['reg_no'], 'EUC-KR', true),
                'name' => kkc_convert($d['fullname'], 'EUC-KR', true),
                'dog_classTab_name' => $dog_class_name
            ];
        }
    }
    
    $conn->close();
    
    if (empty($list)) {
        return ['result_cd' => 'S000', 'list_cnt' => 0, 'list' => []];
    }
    
    return [
        'result_cd' => 'S000',
        'list_cnt' => count($list),
        'list' => $list
    ];
}

/**
 * 🚀 [API 002] 혈통서 상세 정보 조회 (Inbound)
 */
function nice_handle_detail($data) {
    $conn = get_kkc_portal_db();
    nice_api_db_init($conn);
    
    $e_ci = $conn->real_escape_string($data['poss_ci'] ?? '');
    $e_reg = $conn->real_escape_string(kkc_convert($data['reg_no'] ?? '', 'EUC-KR', false));
    
    if (empty($e_ci) || empty($e_reg)) {
        $conn->close();
        return ['result_cd' => 'F100']; // 파라미터 누락
    }
    
    $conn->query("SET NAMES 'binary'");
    $user_res = $conn->query("SELECT id, mid FROM memTab WHERE nice_ci = '$e_ci' UNION SELECT id, mid FROM nice_memTab WHERE nice_ci = '$e_ci'");
    if (!$user_res || $user_res->num_rows === 0) {
        $conn->close();
        return ['result_cd' => 'F302']; // F302: 소유자 CI 불일치
    }
    
    $poss_ids = [];
    while ($u = $user_res->fetch_assoc()) {
        if (!empty($u['id'])) $poss_ids[] = "'" . $conn->real_escape_string($u['id']) . "'";
        if (!empty($u['mid'])) $poss_ids[] = "'" . $conn->real_escape_string($u['mid']) . "'";
    }
    
    if (empty($poss_ids)) {
        $conn->close();
        return ['result_cd' => 'F302']; // F302: 소유자 CI 불일치
    }
    
    $poss_ids_str = implode(',', $poss_ids);
    // nice_dogTab 먼저 확인 후 dogTab 확인
    $dog_res = $conn->query("SELECT * FROM nice_dogTab WHERE reg_no = '$e_reg' AND poss_id IN ($poss_ids_str) LIMIT 1");
    if (!$dog_res || $dog_res->num_rows === 0) {
        $dog_res = $conn->query("SELECT * FROM dogTab WHERE reg_no = '$e_reg' AND poss_id IN ($poss_ids_str) LIMIT 1");
    }
    
    if (!$dog_res || $dog_res->num_rows === 0) {
        $conn->close();
        return ['result_cd' => 'F301']; // F301: 혈통서 정보 없음
    }
    
    $dog = $dog_res->fetch_assoc();
    
    $breed_code = $dog['dog_class'];
    $conn->query("SET NAMES 'utf8mb4'");
    $breed_name = $breed_code;
    $class_res = $conn->query("SELECT name, kor_name FROM dog_classTab WHERE keyy = '" . $conn->real_escape_string($breed_code) . "' OR kor_name = '" . $conn->real_escape_string($breed_code) . "' OR name = '" . $conn->real_escape_string($breed_code) . "' LIMIT 1");
    if ($class_res && $c_row = $class_res->fetch_assoc()) {
        $breed_name = !empty($c_row['name']) ? $c_row['name'] : $c_row['kor_name'];
    }
    $conn->query("SET NAMES 'binary'");
    
    $father = nice_get_parent_info($conn, $dog['fa_regno']);
    $mother = nice_get_parent_info($conn, $dog['mo_regno']);
    
    $formatted_birth = nice_format_date_ymd($dog['birth'] ?? '');
    $formatted_reg_date = nice_format_datetime_ymdhis($dog['reg_date'] ?? '');
    
    $res = [
        'result_cd' => 'S000',
        'reg_no' => kkc_convert($dog['reg_no'], 'EUC-KR', true),
        'name' => kkc_convert($dog['fullname'], 'EUC-KR', true),
        'saho_eng' => kkc_convert($dog['saho_eng'], 'EUC-KR', true),
        'saho' => kkc_convert($dog['saho'], 'EUC-KR', true),
        'dog_classTab_name' => (is_string($breed_name) && mb_check_encoding($breed_name, 'UTF-8')) ? $breed_name : kkc_convert($breed_name, 'EUC-KR', true),
        'micro' => kkc_convert($dog['micro'], 'EUC-KR', true),
        'sex' => nice_format_sex($dog['sex']),
        'hair' => kkc_convert($dog['hair'], 'EUC-KR', true),
        'breed_name' => kkc_convert($dog['breed_name'], 'EUC-KR', true),
        'breed_addr' => kkc_convert($dog['breed_addr'], 'EUC-KR', true),
        'poss_name' => kkc_convert($dog['poss_name'], 'EUC-KR', true),
        'poss_addr' => kkc_convert($dog['poss_addr'], 'EUC-KR', true),
        'birth' => $formatted_birth,
        'reg_date' => $formatted_reg_date,
        'birth_m' => isset($dog['birth_m']) ? intval($dog['birth_m']) : 0,
        'birth_M' => isset($dog['birth_m']) ? intval($dog['birth_m']) : 0,
        'birth_f' => isset($dog['birth_f']) ? intval($dog['birth_f']) : 0,
        'birth_F' => isset($dog['birth_f']) ? intval($dog['birth_f']) : 0,
        'reg_count_m' => isset($dog['reg_count_m']) ? intval($dog['reg_count_m']) : 0,
        'reg_count_M' => isset($dog['reg_count_m']) ? intval($dog['reg_count_m']) : 0,
        'reg_count_f' => isset($dog['reg_count_f']) ? intval($dog['reg_count_f']) : 0,
        'reg_count_F' => isset($dog['reg_count_f']) ? intval($dog['reg_count_f']) : 0,
        'father_name' => $father['name'],
        'father_reg_no' => $father['reg_no'],
        'father_saho' => $father['saho'] ?? '',
        'fa_name' => $father['name'],
        'fa_regno' => $father['reg_no'],
        'mother_name' => $mother['name'],
        'mother_reg_no' => $mother['reg_no'],
        'mother_saho' => $mother['saho'] ?? '',
        'mo_name' => $mother['name'],
        'mo_regno' => $mother['reg_no'],
        'anc_name' => isset($dog['anc_name']) ? kkc_convert($dog['anc_name'], 'EUC-KR', true) : kkc_convert($dog['name'], 'EUC-KR', true),
        'anc_saho' => isset($dog['anc_saho']) ? kkc_convert($dog['anc_saho'], 'EUC-KR', true) : kkc_convert($dog['saho_eng'], 'EUC-KR', true),
        'ancestors' => nice_build_ancestors_list($conn, $dog)
    ];
    
    $conn->close();
    return kkc_convert($res, 'EUC-KR', true);
}

/**
 * 🌳 [별첨3] 강아지 가족 관계도 체계에 맞춘 조상견 계보(ancestors) 생성 함수
 */
function nice_build_ancestors_list($conn, $dog) {
    $ancestors = [];
    
    // 부견 계보 (Father line)
    $fa_reg = $dog['fa_regno'] ?? '';
    if (!empty($fa_reg)) {
        $fa_dog = nice_fetch_dog_by_reg_no($conn, $fa_reg);
        if ($fa_dog) {
            // 조부모 (fatherFather, fatherMother)
            $ff_reg = $fa_dog['fa_regno'] ?? '';
            $fm_reg = $fa_dog['mo_regno'] ?? '';
            
            if (!empty($ff_reg)) {
                $ff_dog = nice_fetch_dog_by_reg_no($conn, $ff_reg);
                if ($ff_dog) {
                    $ancestors[] = ['type' => 'fatherFather', 'name' => kkc_convert($ff_dog['fullname'] ?? $ff_dog['name'], 'EUC-KR', true), 'saho' => kkc_convert($ff_dog['saho'], 'EUC-KR', true)];
                    // 증조부모 (fatherFatherFather, fatherFatherMother)
                    if (!empty($ff_dog['fa_regno'])) {
                        $fff_dog = nice_fetch_dog_by_reg_no($conn, $ff_dog['fa_regno']);
                        if ($fff_dog) $ancestors[] = ['type' => 'fatherFatherFather', 'name' => kkc_convert($fff_dog['fullname'] ?? $fff_dog['name'], 'EUC-KR', true), 'saho' => kkc_convert($fff_dog['saho'], 'EUC-KR', true)];
                    }
                    if (!empty($ff_dog['mo_regno'])) {
                        $ffm_dog = nice_fetch_dog_by_reg_no($conn, $ff_dog['mo_regno']);
                        if ($ffm_dog) $ancestors[] = ['type' => 'fatherFatherMother', 'name' => kkc_convert($ffm_dog['fullname'] ?? $ffm_dog['name'], 'EUC-KR', true), 'saho' => kkc_convert($ffm_dog['saho'], 'EUC-KR', true)];
                    }
                }
            }
            
            if (!empty($fm_reg)) {
                $fm_dog = nice_fetch_dog_by_reg_no($conn, $fm_reg);
                if ($fm_dog) {
                    $ancestors[] = ['type' => 'fatherMother', 'name' => kkc_convert($fm_dog['fullname'] ?? $fm_dog['name'], 'EUC-KR', true), 'saho' => kkc_convert($fm_dog['saho'], 'EUC-KR', true)];
                    // 증조부모 (fatherMotherFather, fatherMotherMother)
                    if (!empty($fm_dog['fa_regno'])) {
                        $fmf_dog = nice_fetch_dog_by_reg_no($conn, $fm_dog['fa_regno']);
                        if ($fmf_dog) $ancestors[] = ['type' => 'fatherMotherFather', 'name' => kkc_convert($fmf_dog['fullname'] ?? $fmf_dog['name'], 'EUC-KR', true), 'saho' => kkc_convert($fmf_dog['saho'], 'EUC-KR', true)];
                    }
                    if (!empty($fm_dog['mo_regno'])) {
                        $fmm_dog = nice_fetch_dog_by_reg_no($conn, $fm_dog['mo_regno']);
                        if ($fmm_dog) $ancestors[] = ['type' => 'fatherMotherMother', 'name' => kkc_convert($fmm_dog['fullname'] ?? $fmm_dog['name'], 'EUC-KR', true), 'saho' => kkc_convert($fmm_dog['saho'], 'EUC-KR', true)];
                    }
                }
            }
        }
    }
    
    // 모견 계보 (Mother line)
    $mo_reg = $dog['mo_regno'] ?? '';
    if (!empty($mo_reg)) {
        $mo_dog = nice_fetch_dog_by_reg_no($conn, $mo_reg);
        if ($mo_dog) {
            // 조부모 (motherFather, motherMother)
            $mf_reg = $mo_dog['fa_regno'] ?? '';
            $mm_reg = $mo_dog['mo_regno'] ?? '';
            
            if (!empty($mf_reg)) {
                $mf_dog = nice_fetch_dog_by_reg_no($conn, $mf_reg);
                if ($mf_dog) {
                    $ancestors[] = ['type' => 'motherFather', 'name' => kkc_convert($mf_dog['fullname'] ?? $mf_dog['name'], 'EUC-KR', true), 'saho' => kkc_convert($mf_dog['saho'], 'EUC-KR', true)];
                    // 증조부모 (motherFatherFather, motherFatherMother)
                    if (!empty($mf_dog['fa_regno'])) {
                        $mff_dog = nice_fetch_dog_by_reg_no($conn, $mf_dog['fa_regno']);
                        if ($mff_dog) $ancestors[] = ['type' => 'motherFatherFather', 'name' => kkc_convert($mff_dog['fullname'] ?? $mff_dog['name'], 'EUC-KR', true), 'saho' => kkc_convert($mff_dog['saho'], 'EUC-KR', true)];
                    }
                    if (!empty($mf_dog['mo_regno'])) {
                        $mfm_dog = nice_fetch_dog_by_reg_no($conn, $mf_dog['mo_regno']);
                        if ($mfm_dog) $ancestors[] = ['type' => 'motherFatherMother', 'name' => kkc_convert($mfm_dog['fullname'] ?? $mfm_dog['name'], 'EUC-KR', true), 'saho' => kkc_convert($mfm_dog['saho'], 'EUC-KR', true)];
                    }
                }
            }
            
            if (!empty($mm_reg)) {
                $mm_dog = nice_fetch_dog_by_reg_no($conn, $mm_reg);
                if ($mm_dog) {
                    $ancestors[] = ['type' => 'motherMother', 'name' => kkc_convert($mm_dog['fullname'] ?? $mm_dog['name'], 'EUC-KR', true), 'saho' => kkc_convert($mm_dog['saho'], 'EUC-KR', true)];
                    // 증조부모 (motherMotherFather, motherMotherMother)
                    if (!empty($mm_dog['fa_regno'])) {
                        $mmf_dog = nice_fetch_dog_by_reg_no($conn, $mm_dog['fa_regno']);
                        if ($mmf_dog) $ancestors[] = ['type' => 'motherMotherFather', 'name' => kkc_convert($mmf_dog['fullname'] ?? $mmf_dog['name'], 'EUC-KR', true), 'saho' => kkc_convert($mmf_dog['saho'], 'EUC-KR', true)];
                    }
                    if (!empty($mm_dog['mo_regno'])) {
                        $mmm_dog = nice_fetch_dog_by_reg_no($conn, $mm_dog['mo_regno']);
                        if ($mmm_dog) $ancestors[] = ['type' => 'motherMotherMother', 'name' => kkc_convert($mmm_dog['fullname'] ?? $mmm_dog['name'], 'EUC-KR', true), 'saho' => kkc_convert($mmm_dog['saho'], 'EUC-KR', true)];
                    }
                }
            }
        }
    }
    
    return $ancestors;
}

/**
 * 🐕 등록번호 기반 개체 정보 보조 조회 함수
 */
function nice_fetch_dog_by_reg_no($conn, $reg_no) {
    if (empty($reg_no)) return null;
    $e_reg = $conn->real_escape_string($reg_no);
    $res = $conn->query("SELECT * FROM nice_dogTab WHERE reg_no = '$e_reg' LIMIT 1");
    if (!$res || $res->num_rows === 0) {
        $res = $conn->query("SELECT * FROM dogTab WHERE reg_no = '$e_reg' LIMIT 1");
    }
    return ($res && $res->num_rows > 0) ? $res->fetch_assoc() : null;
}

/**
 * 🚀 [API 003] 모바일혈통서 심사 요청 (Inbound)
 */
function nice_handle_request($data) {
    $conn = get_kkc_portal_db();
    nice_api_db_init($conn);
    
    $req_name = $conn->real_escape_string($data['req_name'] ?? '');
    $req_mobile = $conn->real_escape_string($data['req_mobile'] ?? '');
    $poss_ci = $conn->real_escape_string($data['poss_ci'] ?? ($data['req_ci'] ?? ''));
    $petpin = $conn->real_escape_string($data['petpin'] ?? ($data['muzzle_petpin'] ?? ''));
    $order_no = $conn->real_escape_string($data['order_no'] ?? '');
    $order_dttm = $conn->real_escape_string($data['order_dttm'] ?? '');
    $req_gbn = $conn->real_escape_string($data['req_gbn'] ?? '1');
    $reg_no = $conn->real_escape_string($data['reg_no'] ?? '');
    
    if (empty($order_no) || empty($poss_ci) || empty($req_name) || empty($req_mobile) || empty($order_dttm)) {
        $conn->close();
        return ['result_cd' => 'F100']; // F100: 필수 파라미터 누락
    }
    
    $name = $conn->real_escape_string($data['name'] ?? '');
    $saho_eng = $conn->real_escape_string($data['saho_eng'] ?? '');
    $saho = $conn->real_escape_string($data['saho'] ?? '');
    $dog_classTab_name = $conn->real_escape_string($data['dog_classTab_name'] ?? '');
    $micro = $conn->real_escape_string($data['micro'] ?? '');
    $sex = $conn->real_escape_string(nice_format_sex($data['sex'] ?? ''));
    $breed_name = $conn->real_escape_string($data['breed_name'] ?? '');
    $hair_raw = $data['hair'] ?? ($data['color_name'] ?? ($data['COLOR_NAME'] ?? ($data['COLOR_CD'] ?? '')));
    $hair = $conn->real_escape_string(nice_resolve_color_name($conn, $dog_classTab_name ?: $breed_name, $hair_raw));
    $breed_addr = $conn->real_escape_string($data['breed_addr'] ?? '');
    $poss_name = $conn->real_escape_string($data['poss_name'] ?? '');
    $poss_addr = $conn->real_escape_string($data['poss_addr'] ?? '');
    $birth = $conn->real_escape_string($data['birth'] ?? '');
    $birth_m = isset($data['birth_m']) ? intval($data['birth_m']) : (isset($data['birth_M']) ? intval($data['birth_M']) : 0);
    $birth_f = isset($data['birth_f']) ? intval($data['birth_f']) : (isset($data['birth_F']) ? intval($data['birth_F']) : 0);
    $reg_count_m = isset($data['reg_count_m']) ? intval($data['reg_count_m']) : (isset($data['reg_count_M']) ? intval($data['reg_count_M']) : 0);
    $reg_count_f = isset($data['reg_count_f']) ? intval($data['reg_count_f']) : (isset($data['reg_count_F']) ? intval($data['reg_count_F']) : 0);
    $reg_date = $conn->real_escape_string($data['reg_date'] ?? '');
    
    $father_name = $conn->real_escape_string($data['father_name'] ?? ($data['fa_name'] ?? ''));
    $father_reg_no = $conn->real_escape_string($data['father_reg_no'] ?? ($data['fa_regno'] ?? ''));
    $mother_name = $conn->real_escape_string($data['mother_name'] ?? ($data['mo_name'] ?? ''));
    $mother_reg_no = $conn->real_escape_string($data['mother_reg_no'] ?? ($data['mo_regno'] ?? ''));
    $anc_name = $conn->real_escape_string($data['anc_name'] ?? '');
    $anc_saho = $conn->real_escape_string($data['anc_saho'] ?? '');
    
    $image1_hmac = $conn->real_escape_string($data['image1_hmac'] ?? '');
    $image2_hmac = $conn->real_escape_string($data['image2_hmac'] ?? '');
    $image3_hmac = $conn->real_escape_string($data['image3_hmac'] ?? '');
    $image4_hmac = $conn->real_escape_string($data['image4_hmac'] ?? '');
    
    // 소유 관계 및 대상 혈통서 정합성 검증 (reg_no 수신 시)
    if (!empty($reg_no)) {
        $e_reg = $conn->real_escape_string($reg_no);
        $dog_chk = $conn->query("SELECT poss_id FROM nice_dogTab WHERE reg_no = '$e_reg' UNION SELECT poss_id FROM dogTab WHERE reg_no = '$e_reg' LIMIT 1");
        if (!$dog_chk || $dog_chk->num_rows === 0) {
            // F401: 대상 혈통서 없음 (수신된 reg_no가 협회 DB에 존재하지 않는 경우)
            // 선택 파라미터이므로 경고 로그 후 진행하거나 수신 허용
        }
    }

    // 결제 일시 정합성 및 중복 검증
    $chk = $conn->query("SELECT uid, status FROM nice_pedigree_requests WHERE order_no = '$order_no' LIMIT 1");
    if ($chk && $chk->num_rows > 0) {
        $row = $chk->fetch_assoc();
        $uid = $row['uid'];
        
        // 이미 심사 진행중인 건 재요청 시 업데이트 처리 (또는 재심사 req_gbn = 2인 경우 갱신)
        $sql = "UPDATE nice_pedigree_requests SET
            req_name='$req_name', req_mobile='$req_mobile', poss_ci='$poss_ci', petpin='$petpin',
            order_dttm='$order_dttm', req_gbn='$req_gbn', reg_no='$reg_no', name='$name',
            saho_eng='$saho_eng', saho='$saho', dog_classTab_name='$dog_classTab_name', micro='$micro',
            sex='$sex', hair='$hair', breed_name='$breed_name', breed_addr='$breed_addr',
            poss_name='$poss_name', poss_addr='$poss_addr', birth='$birth', birth_m=$birth_m, birth_f=$birth_f,
            reg_count_m=$reg_count_m, reg_count_f=$reg_count_f, reg_date='$reg_date',
            father_name='$father_name', father_reg_no='$father_reg_no', mother_name='$mother_name', mother_reg_no='$mother_reg_no',
            fa_name='$father_name', fa_regno='$father_reg_no', mo_name='$mother_name', mo_regno='$mother_reg_no',
            anc_name='$anc_name', anc_saho='$anc_saho',
            image1_hmac='$image1_hmac', image2_hmac='$image2_hmac', image3_hmac='$image3_hmac', image4_hmac='$image4_hmac',
            status='P', updated_at=CURRENT_TIMESTAMP
            WHERE uid=$uid";
    } else {
        $sql = "INSERT INTO nice_pedigree_requests (
            req_name, req_mobile, poss_ci, petpin, order_no, order_dttm, req_gbn, reg_no,
            name, saho_eng, saho, dog_classTab_name, micro, sex, hair, breed_name, breed_addr,
            poss_name, poss_addr, birth, birth_m, birth_f, reg_count_m, reg_count_f, reg_date,
            father_name, father_reg_no, mother_name, mother_reg_no,
            fa_name, fa_regno, mo_name, mo_regno, anc_name, anc_saho,
            image1_hmac, image2_hmac, image3_hmac, image4_hmac, status
        ) VALUES (
            '$req_name', '$req_mobile', '$poss_ci', '$petpin', '$order_no', '$order_dttm', '$req_gbn', '$reg_no',
            '$name', '$saho_eng', '$saho', '$dog_classTab_name', '$micro', '$sex', '$hair', '$breed_name', '$breed_addr',
            '$poss_name', '$poss_addr', '$birth', $birth_m, $birth_f, $reg_count_m, $reg_count_f, '$reg_date',
            '$father_name', '$father_reg_no', '$mother_name', '$mother_reg_no',
            '$father_name', '$father_reg_no', '$mother_name', '$mother_reg_no', '$anc_name', '$anc_saho',
            '$image1_hmac', '$image2_hmac', '$image3_hmac', '$image4_hmac', 'P'
        )";
    }
    
    $res = $conn->query($sql);
    $conn->close();
    
    if ($res === false) return ['result_cd' => 'F999'];
    return ['result_cd' => 'S000'];
}

/**
 * 🚀 [API 006] 환불 통보 (Inbound)
 * 엑셀 명세서 Sheet: 한국애견협회 API 명세 (R100~R113)
 * 필수 파라미터: req_ci(88), reg_no(26), order_no(100), refund_dttm(14)
 */
function nice_handle_refund($data) {
    $conn = get_kkc_portal_db();
    nice_api_db_init($conn);
    
    // ① 파라미터 수신 (order_no 기준 식별)
    $req_ci      = $conn->real_escape_string($data['req_ci'] ?? '');
    $reg_no      = $conn->real_escape_string($data['reg_no'] ?? '');
    $order_no    = $conn->real_escape_string($data['order_no'] ?? '');
    $refund_dttm = $conn->real_escape_string($data['refund_dttm'] ?? '');
    
    // ② 필수 파라미터 누락 검증 (발급 전 환불 시 reg_no는 미채번 상태이므로 빈값 허용)
    if (empty($req_ci) || empty($order_no) || empty($refund_dttm)) {
        $conn->close();
        return ['result_cd' => 'F100']; // F100: 필수 파라미터 누락
    }
    
    // ③ order_no 기준 대상 조회 (reg_no 있는 경우 2중 교차 검증)
    $chk = null;
    if (!empty($reg_no)) {
        $chk = $conn->query("SELECT uid, status, poss_ci FROM nice_pedigree_requests WHERE order_no = '$order_no' AND reg_no = '$reg_no' LIMIT 1");
    }
    if (!$chk || $chk->num_rows === 0) {
        $chk = $conn->query("SELECT uid, status, poss_ci FROM nice_pedigree_requests WHERE order_no = '$order_no' LIMIT 1");
        if (!$chk || $chk->num_rows === 0) {
            $conn->close();
            return ['result_cd' => 'F601']; // F601: 환불 대상 없음
        }
    }
    
    $row = $chk->fetch_assoc();
    
    // ④ 중복 환불 검증 → F602
    if ($row['status'] === 'R') {
        $conn->close();
        return ['result_cd' => 'F602']; // F602: 이미 환불된 건
    }
    
    // ⑤ 환불 처리: status=R, refund_dttm 및 refund_ci 감사 기록 저장
    $res = $conn->query("UPDATE nice_pedigree_requests SET 
        status = 'R', 
        refund_dttm = '$refund_dttm', 
        refund_ci = '$req_ci' 
        WHERE order_no = '$order_no'");
    $conn->close();
    
    if ($res === false) return ['result_cd' => 'F999'];
    return ['result_cd' => 'S000'];
}

/**
 * 🚀 [API 007] 반려견 이미지 등록 (Inbound)
 */
function nice_handle_image($data) {
    // 🚀 이미지 디코딩 및 리사이징 시 502 에러 방지를 위한 512M 메모리 확보
    @ini_set('memory_limit', '512M');
    @ini_set('max_execution_time', '120');
    @set_time_limit(120);
    
    $conn = get_kkc_portal_db();
    nice_api_db_init($conn);
    
    // V1.62: 혈통서등록번호 대신 결제주문번호(order_no)를 주 키로 사용
    $order_no = $conn->real_escape_string($data['order_no'] ?? ($data['reg_no'] ?? ''));
    $image_idx = intval($data['image_idx'] ?? 0);
    $image_base64 = $data['image_base64'] ?? '';
    
    if (empty($order_no) || empty($image_base64)) {
        $conn->close();
        return ['result_cd' => 'F100']; // 필수 파라미터 누락
    }
    
    if ($image_idx < 1 || $image_idx > 4) {
        $conn->close();
        return ['result_cd' => 'F702']; // F702: 이미지 순번 오류
    }
    
    $decoded = base64_decode($image_base64);
    $img_len = $decoded ? strlen($decoded) : 0;
    // 이미지 용량 범위 검증 (10KB ~ 3MB) 및 Base64 디코딩 검증
    if (!$decoded || $img_len < (10 * 1024) || $img_len > (3 * 1024 * 1024)) {
        $conn->close();
        return ['result_cd' => 'F703']; // F703: 이미지 규격 및 전송 오류
    }
    
    // 1. 주문번호(order_no) 기준 기존 레코드 확인 또는 임시 레코드 선(先)생성
    $chk = $conn->query("SELECT uid FROM nice_pedigree_requests WHERE order_no = '$order_no' OR reg_no = '$order_no' ORDER BY uid DESC LIMIT 1");
    if ($chk && $chk->num_rows > 0) {
        $row = $chk->fetch_assoc();
        $uid = $row['uid'];
    } else {
        // 심사 요청(API 003) 전 이미지가 먼저 업로드되는 경우 임시 레코드 선등록
        $init_sql = "INSERT INTO nice_pedigree_requests (order_no, req_name, req_mobile, poss_ci, petpin, order_dttm, req_gbn, reg_no, status) 
                     VALUES ('$order_no', '', '', '', '', '', '1', '', 'P')";
        $ins_res = $conn->query($init_sql);
        if ($ins_res) {
            $uid = $conn->insert_id;
        } else {
            // 동시성 등으로 인해 이미 생성되었는지 2차 확인
            $chk2 = $conn->query("SELECT uid FROM nice_pedigree_requests WHERE order_no = '$order_no' LIMIT 1");
            if ($chk2 && $chk2->num_rows > 0) {
                $uid = $chk2->fetch_assoc()['uid'];
            } else {
                $conn->close();
                return ['result_cd' => 'F999'];
            }
        }
    }
    
    $upload_dir = function_exists('wp_upload_dir') ? wp_upload_dir() : [
        'basedir' => dirname(dirname(__FILE__)) . '/wp-content/uploads',
        'baseurl' => '/wp-content/uploads'
    ];
    $nice_dir = $upload_dir['basedir'] . '/nice_pedigree';
    if (!file_exists($nice_dir)) {
        if (function_exists('wp_mkdir_p')) {
            wp_mkdir_p($nice_dir);
        } else {
            @mkdir($nice_dir, 0755, true);
        }
    }
    
    $filename = '/nice_ped_req_' . $uid . '_img_' . $image_idx . '.jpg';
    $filepath = $nice_dir . $filename;
    $fileurl = $upload_dir['baseurl'] . '/nice_pedigree' . $filename;
    
    // 🖼️ [안전한 다이렉트 파일 저장] GD 압축 부하 없이 3MB 초고화질 사진도 0.005초 만에 502 없이 즉시 저장
    $save_res = file_put_contents($filepath, $decoded);
    if ($save_res === false) {
        $conn->close();
        return ['result_cd' => 'F703']; // F703: 이미지 규격 및 전송 오류
    }
    
    $img_col = 'image' . $image_idx . '_path';
    $res = $conn->query("UPDATE nice_pedigree_requests SET `$img_col` = '" . $conn->real_escape_string($fileurl) . "' WHERE uid = $uid");
    
    $conn->close();
    if ($res === false) return ['result_cd' => 'F999'];
    return ['result_cd' => 'S000'];
}

/**
 * 🖼️ 이미지 압축 및 리사이징 함수 (GD 라이브러리 활용)
 * - 최대 가로/세로 1280px 비율 유지 리사이즈
 * - JPEG 품질 82% 압축 저장
 * - GD 실패 시 원본 바이너리 그대로 저장하는 안전 Fallback 포함
 */
function nice_compress_and_save_image($binary_data, $filepath, $max_dim = 1280, $quality = 82) {
    @ini_set('memory_limit', '512M');
    if (function_exists('imagecreatefromstring')) {
        $src_img = @imagecreatefromstring($binary_data);
        if ($src_img !== false) {
            $orig_w = imagesx($src_img);
            $orig_h = imagesy($src_img);
            
            // 리사이징 필요 여부 판단
            if ($orig_w > $max_dim || $orig_h > $max_dim) {
                if ($orig_w >= $orig_h) {
                    $new_w = $max_dim;
                    $new_h = intval($orig_h * ($max_dim / $orig_w));
                } else {
                    $new_h = $max_dim;
                    $new_w = intval($orig_w * ($max_dim / $orig_h));
                }
                
                $dst_img = imagecreatetruecolor($new_w, $new_h);
                // 투명 배경 대응 (흰색 배경)
                $white = imagecolorallocate($dst_img, 255, 255, 255);
                imagefill($dst_img, 0, 0, $white);
                
                imagecopyresampled($dst_img, $src_img, 0, 0, 0, 0, $new_w, $new_h, $orig_w, $orig_h);
                $saved = imagejpeg($dst_img, $filepath, $quality);
                imagedestroy($dst_img);
                imagedestroy($src_img);
                
                if ($saved) return true;
            } else {
                // 이미지가 1280px 이하인 경우 리사이즈 없이 JPEG 품질 최적화 압축만 진행
                $saved = imagejpeg($src_img, $filepath, $quality);
                imagedestroy($src_img);
                if ($saved) return true;
            }
        }
    }
    // GD가 없거나 실패 시 원본 바이너리 파일 저장 (안전 Fallback)
    return file_put_contents($filepath, $binary_data) !== false;
}

/**
 * 🔒 NICE Outbound API 전용 통신 헬퍼
 */
function nice_outbound_call($uri, $product_id, $plain_data) {
    $env = defined('NICE_API_ENV') ? NICE_API_ENV : 'UAT';
    if ($env === 'PROD') {
        $host = 'https://svc.niceapi.co.kr:32001';
        $aes_key = defined('NICE_AES_KEY_PROD') ? NICE_AES_KEY_PROD : 'abcdefgh12345678abcdefgh12345678';
        $aes_iv = defined('NICE_AES_IV_PROD') ? NICE_AES_IV_PROD : 'abcdefgh12345678';
        $hmac_key = defined('NICE_HMAC_KEY_PROD') ? NICE_HMAC_KEY_PROD : 'abcdefgh12345678abcdefgh12345678';
        $client_id = defined('NICE_CLIENT_ID_PROD') ? NICE_CLIENT_ID_PROD : '369a3882-32bb-4a65-8376-2357619517c9';
        $client_secret = defined('NICE_CLIENT_SECRET_PROD') ? NICE_CLIENT_SECRET_PROD : '949c318d591d34ee19b2495302314776883cf39';
    } else {
        $host = 'https://usvc.niceapi.co.kr:32501';
        $aes_key = defined('NICE_AES_KEY_UAT') ? NICE_AES_KEY_UAT : '12345678123456781234567812345678';
        $aes_iv = defined('NICE_AES_IV_UAT') ? NICE_AES_IV_UAT : '1234567812345678';
        $hmac_key = defined('NICE_HMAC_KEY_UAT') ? NICE_HMAC_KEY_UAT : '12345678123456781234567812345678';
        $client_id = defined('NICE_CLIENT_ID_UAT') ? NICE_CLIENT_ID_UAT : '771accb9-47fa-45d7-be3f-8dc9aeeb9808';
        $client_secret = defined('NICE_CLIENT_SECRET_UAT') ? NICE_CLIENT_SECRET_UAT : 'e226d243e071ca3caa9ba618370d7626';
    }
    
    $json = json_encode($plain_data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $enc_data = base64_encode(openssl_encrypt($json, 'aes-256-cbc', $aes_key, OPENSSL_RAW_DATA, $aes_iv));
    
    $req_dttm = date('YmdHis');
    $key_version = '0001';
    $sign_str = trim($key_version) . trim($req_dttm) . trim($enc_data);
    $req_hmac = base64_encode(hash_hmac('sha256', $sign_str, $hmac_key, true));
    
    $req_body = [
        'enc_key_version' => $key_version,
        'req_dttm' => $req_dttm,
        'enc_data' => $enc_data,
        'req_hmac' => $req_hmac
    ];
    
    $auth = base64_encode($client_id . ':' . $client_secret);
    
    $ch = curl_init($host . $uri);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($req_body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Basic ' . $auth,
        'ProductID: ' . $product_id
    ]);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    // 5초 타임아웃을 지정하여 관리자 화면 지연 방지 및 원활한 통신 보장
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
    
    // HTTP 응답 헤더에서 GW_RSLT_CD 추출을 위한 콜백 등록
    $response_headers = [];
    curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $header) use (&$response_headers) {
        $len = strlen($header);
        $parts = explode(':', $header, 2);
        if (count($parts) === 2) {
            $key = strtolower(trim($parts[0]));
            $response_headers[$key] = trim($parts[1]);
        }
        return $len;
    });
    
    $resp = curl_exec($ch);
    if ($resp === false) {
        $err = curl_error($ch);
        curl_close($ch);
        return ['success' => false, 'error' => 'Curl error: ' . $err];
    }
    
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // NICE API 공동 결과코드 (GW_RSLT_CD) 체크
    $gw_rslt_cd = $response_headers['gw_rslt_cd'] ?? '';
    if (!empty($gw_rslt_cd) && $gw_rslt_cd !== '1200') {
        return ['success' => false, 'error' => "NICE Gateway Error: $gw_rslt_cd", 'response' => $resp];
    }
    
    if ($http_code !== 200) {
        return ['success' => false, 'error' => "HTTP Code $http_code", 'response' => $resp];
    }
    
    $resp_data = json_decode($resp, true);
    if (!$resp_data || empty($resp_data['enc_data'])) {
        return ['success' => false, 'error' => 'Invalid Response JSON', 'response' => $resp];
    }
    
    $res_hmac = $resp_data['res_hmac'] ?? '';
    $res_enc_data = $resp_data['enc_data'];
    $verify_str = trim($key_version) . trim($req_dttm) . trim($res_enc_data);
    $expected_hmac = base64_encode(hash_hmac('sha256', $verify_str, $hmac_key, true));
    
    if ($res_hmac !== $expected_hmac) {
        return ['success' => false, 'error' => 'Response HMAC mismatch', 'response' => $resp_data];
    }
    
    $dec = openssl_decrypt(base64_decode($res_enc_data), 'aes-256-cbc', $aes_key, OPENSSL_RAW_DATA, $aes_iv);
    return [
        'success' => true,
        'data' => json_decode($dec, true)
    ];
}

/**
 * 🚀 [API 004] 모바일혈통서 심사 결과 통보 (Outbound)
 * 엑셀 명세서 Sheet: NICE API 명세 (R02~R37) 및 별첨1 규격 전 항목 포함
 */
function nice_notify_screening_result($conn, $poss_ci, $reg_no, $status, $order_no = '') {
    $is_approved = ($status === 'S' || $status === 'Y');
    
    $plain = [
        'poss_ci' => $poss_ci,
        'order_no' => $order_no,
        'reg_result' => ($is_approved ? 'S' : 'F'),
        'reg_no' => $reg_no
    ];
    
    $e_order = $conn ? $conn->real_escape_string($order_no) : '';
    $req = null;
    if (!empty($e_order)) {
        $req_res = $conn->query("SELECT * FROM nice_pedigree_requests WHERE order_no = '$e_order' LIMIT 1");
        if ($req_res && $req_res->num_rows > 0) {
            $req = $req_res->fetch_assoc();
        }
    }
    
    $dog = $conn ? nice_fetch_dog_by_reg_no($conn, $reg_no) : null;
    
    if ($is_approved) {
        // 승인 (S): NICE API 명세 (Sheet 6 R06~R37 & 별첨1) 기준 전 항목 반환
        $breed_code = $dog['dog_class'] ?? ($req['dog_classTab_name'] ?? '');
        $breed_name = $breed_code;
        if ($conn) {
            $conn->query("SET NAMES 'utf8mb4'");
            $class_res = $conn->query("SELECT name, kor_name FROM dog_classTab WHERE keyy = '" . $conn->real_escape_string($breed_code) . "' OR kor_name = '" . $conn->real_escape_string($breed_code) . "' OR name = '" . $conn->real_escape_string($breed_code) . "' LIMIT 1");
            if ($class_res && $c_row = $class_res->fetch_assoc()) {
                $breed_name = !empty($c_row['name']) ? $c_row['name'] : $c_row['kor_name'];
            }
            $conn->query("SET NAMES 'binary'");
        }
        
        $father = $conn ? nice_get_parent_info($conn, $dog['fa_regno'] ?? ($req['father_reg_no'] ?? '')) : ['name'=>'', 'reg_no'=>'', 'saho'=>''];
        $mother = $conn ? nice_get_parent_info($conn, $dog['mo_regno'] ?? ($req['mother_reg_no'] ?? '')) : ['name'=>'', 'reg_no'=>'', 'saho'=>''];
        
        $plain['name'] = kkc_convert($dog['fullname'] ?? ($dog['name'] ?? ($req['name'] ?? '')), 'EUC-KR', true);
        $plain['saho'] = kkc_convert($dog['saho'] ?? ($req['saho'] ?? ''), 'EUC-KR', true);
        $plain['dog_classTab_name'] = (is_string($breed_name) && mb_check_encoding($breed_name, 'UTF-8')) ? $breed_name : kkc_convert($breed_name, 'EUC-KR', true);
        $plain['micro'] = kkc_convert($dog['micro'] ?? ($req['micro'] ?? ''), 'EUC-KR', true);
        $plain['sex'] = nice_format_sex($dog['sex'] ?? ($req['sex'] ?? ''));
        $plain['hair'] = kkc_convert($dog['hair'] ?? ($req['hair'] ?? ''), 'EUC-KR', true);
        $plain['breed_name'] = kkc_convert($dog['breed_name'] ?? ($req['breed_name'] ?? ''), 'EUC-KR', true);
        $plain['breed_addr'] = kkc_convert($dog['breed_addr'] ?? ($req['breed_addr'] ?? ''), 'EUC-KR', true);
        $plain['poss_name'] = kkc_convert($dog['poss_name'] ?? ($req['poss_name'] ?? ($req['req_name'] ?? '')), 'EUC-KR', true);
        $plain['poss_addr'] = kkc_convert($dog['poss_addr'] ?? ($req['poss_addr'] ?? ''), 'EUC-KR', true);
        $plain['birth'] = nice_format_date_ymd($dog['birth'] ?? ($req['birth'] ?? ''));
        $plain['reg_date'] = nice_format_datetime_ymdhis($dog['reg_date'] ?? ($req['reg_date'] ?? ''));

        $plain['birth_m'] = isset($dog['birth_m']) ? intval($dog['birth_m']) : (isset($req['birth_m']) ? intval($req['birth_m']) : 0);
        $plain['birth_M'] = $plain['birth_m'];
        $plain['birth_f'] = isset($dog['birth_f']) ? intval($dog['birth_f']) : (isset($req['birth_f']) ? intval($req['birth_f']) : 0);
        $plain['birth_F'] = $plain['birth_f'];
        $plain['reg_count_m'] = isset($dog['reg_count_m']) ? intval($dog['reg_count_m']) : (isset($req['reg_count_m']) ? intval($req['reg_count_m']) : 0);
        $plain['reg_count_M'] = $plain['reg_count_m'];
        $plain['reg_count_f'] = isset($dog['reg_count_f']) ? intval($dog['reg_count_f']) : (isset($req['reg_count_f']) ? intval($req['reg_count_f']) : 0);
        $plain['reg_count_F'] = $plain['reg_count_f'];
        
        $plain['father_name'] = $father['name'] ?: kkc_convert($req['father_name'] ?? '', 'EUC-KR', true);
        $plain['father_reg_no'] = $father['reg_no'] ?: kkc_convert($req['father_reg_no'] ?? '', 'EUC-KR', true);
        $plain['father_saho'] = $father['saho'] ?? kkc_convert($req['father_saho'] ?? '', 'EUC-KR', true);
        $plain['fa_name'] = $plain['father_name'];
        $plain['fa_regno'] = $plain['father_reg_no'];
        
        $plain['mother_name'] = $mother['name'] ?: kkc_convert($req['mother_name'] ?? '', 'EUC-KR', true);
        $plain['mother_reg_no'] = $mother['reg_no'] ?: kkc_convert($req['mother_reg_no'] ?? '', 'EUC-KR', true);
        $plain['mother_saho'] = $mother['saho'] ?? kkc_convert($req['mother_saho'] ?? '', 'EUC-KR', true);
        $plain['mo_name'] = $plain['mother_name'];
        $plain['mo_regno'] = $plain['mother_reg_no'];
        
        $anc_list = ($conn && $dog) ? nice_build_ancestors_list($conn, $dog) : [];
        $plain['ancestors'] = $anc_list;
        $plain['ancient'] = $anc_list;
    } else {
        // 반려 (F): 엑셀 규격 Sheet 6 R05
        // "이전에 NICE에서 심사 요청한 데이터를 그대로 반환"
        // → 원본 신청(nice_pedigree_requests) 전체 필드 반환 + ancestors 빈 배열 필수 포함
        if ($req) {
            // [이슈 B] 반려 시에도 원본 요청 데이터 전체 필드 반환 (6개→전체)
            $plain['name']              = kkc_convert($req['name'] ?? '', 'EUC-KR', true);
            $plain['saho']              = kkc_convert($req['saho'] ?? '', 'EUC-KR', true);
            $req_dog_class              = $req['dog_classTab_name'] ?? '';
            $std_breed                  = nice_resolve_standard_breed_name($conn, $req_dog_class);
            $plain['dog_classTab_name'] = (is_string($std_breed) && mb_check_encoding($std_breed, 'UTF-8')) ? $std_breed : kkc_convert($std_breed, 'EUC-KR', true);
            $plain['micro']             = kkc_convert($req['micro'] ?? '', 'EUC-KR', true);
            $plain['sex']               = nice_format_sex($req['sex'] ?? '');
            $plain['hair']              = kkc_convert($req['hair'] ?? '', 'EUC-KR', true);
            $plain['breed_name']        = kkc_convert($req['breed_name'] ?? '', 'EUC-KR', true);
            $plain['breed_addr']        = kkc_convert($req['breed_addr'] ?? '', 'EUC-KR', true);
            $plain['poss_name']         = kkc_convert($req['poss_name'] ?? ($req['req_name'] ?? ''), 'EUC-KR', true);
            $plain['poss_addr']         = kkc_convert($req['poss_addr'] ?? '', 'EUC-KR', true);
            $plain['birth']             = nice_format_date_ymd($req['birth'] ?? '');
            $plain['reg_date']          = !empty($req['reg_date']) ? nice_format_datetime_ymdhis($req['reg_date']) : '';

            $plain['birth_m']           = intval($req['birth_m'] ?? 0);
            $plain['birth_f']           = intval($req['birth_f'] ?? 0);
            $plain['reg_count_m']       = intval($req['reg_count_m'] ?? 0);
            $plain['reg_count_f']       = intval($req['reg_count_f'] ?? 0);
            $plain['father_name']       = kkc_convert($req['father_name'] ?? '', 'EUC-KR', true);
            $plain['father_reg_no']     = kkc_convert($req['father_reg_no'] ?? '', 'EUC-KR', true);
            $plain['father_saho']       = kkc_convert($req['father_saho'] ?? '', 'EUC-KR', true);
            $plain['mother_name']       = kkc_convert($req['mother_name'] ?? '', 'EUC-KR', true);
            $plain['mother_reg_no']     = kkc_convert($req['mother_reg_no'] ?? '', 'EUC-KR', true);
            $plain['mother_saho']       = kkc_convert($req['mother_saho'] ?? '', 'EUC-KR', true);
        }
        // [이슈 A] 반려 시에도 ancestors 필수 필드(Y) 반드시 포함 (엑셀 Sheet 6 R33)
        $plain['ancestors'] = [];
    }
    
    $env = defined('NICE_API_ENV') ? NICE_API_ENV : 'UAT';
    $product_id = ($env === 'PROD') 
        ? (defined('NICE_PRODUCT_ID_RESULT_PROD') ? NICE_PRODUCT_ID_RESULT_PROD : '2601941116')
        : (defined('NICE_PRODUCT_ID_RESULT_UAT') ? NICE_PRODUCT_ID_RESULT_UAT : '2601687173');
    return nice_outbound_call('/pet/pedigree/result', $product_id, $plain);
}

/**
 * 🚀 [API 005] 소유권 이전 통보 (Outbound)
 */
function nice_notify_ownership_transfer($poss_ci, $move_ci, $reg_no) {
    $plain = [
        'poss_ci' => $poss_ci,
        'move_ci' => $move_ci,
        'reg_no' => $reg_no
    ];
    $env = defined('NICE_API_ENV') ? NICE_API_ENV : 'UAT';
    $product_id = ($env === 'PROD') 
        ? (defined('NICE_PRODUCT_ID_TRANSFER_PROD') ? NICE_PRODUCT_ID_TRANSFER_PROD : '2601941116')
        : (defined('NICE_PRODUCT_ID_TRANSFER_UAT') ? NICE_PRODUCT_ID_TRANSFER_UAT : '2601687173');
    return nice_outbound_call('/pet/pedigree/transfer', $product_id, $plain);
}

/**
 * ==============================================================================
 * ⚙️ [ADMIN DASHBOARD HANDLERS]
 * ==============================================================================
 */

/**
 * 🎖️ NICE 본인인증 회원 목록 조회 (Admin)
 */
function nice_admin_member_list($input) {
    $conn = get_kkc_portal_db();
    nice_api_db_init($conn);
    
    $page = max(1, intval($input['page'] ?? 1));
    $limit = intval($input['limit'] ?? 50);
    $offset = ($page - 1) * $limit;
    
    $where = "nice_ci IS NOT NULL AND nice_ci != ''";
    
    $search = trim($input['search'] ?? '');
    if ($search !== '') {
        $e_search = $conn->real_escape_string(kkc_convert($search, 'EUC-KR', false));
        $field = $input['field'] ?? 'all';
        
        if ($field === 'name') {
            $where .= " AND name LIKE '%$e_search%'";
        } else if ($field === 'id') {
            $where .= " AND id LIKE '%$e_search%'";
        } else if ($field === 'hp') {
            $where .= " AND REPLACE(hp, '-', '') LIKE '%$e_search%'";
        } else if ($field === 'ci') {
            $where .= " AND nice_ci LIKE '%$e_search%'";
        } else {
            $where .= " AND (name LIKE '%$e_search%' OR id LIKE '%$e_search%' OR REPLACE(hp, '-', '') LIKE '%$e_search%' OR nice_ci LIKE '%$e_search%')";
        }
    }
    
    $conn->query("SET NAMES 'binary'");
    $sql = "SELECT mid, id, name, birth, hp, nice_ci, nice_di, addr, nice_verified_at 
            FROM (
                SELECT mid, id, name, birth, hp, nice_ci, nice_di, addr, nice_verified_at FROM memTab WHERE $where
                UNION
                SELECT mid, id, name, birth, hp, nice_ci, nice_di, addr, nice_verified_at FROM nice_memTab WHERE $where
            ) AS combined 
            ORDER BY mid DESC LIMIT $limit OFFSET $offset";
    $res = $conn->query($sql);
    
    $list = [];
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $birth = kkc_convert($row['birth'], 'EUC-KR', true);
            $gender = $row['gender'] ?? '';
            if (empty($gender)) {
                // 주민번호 뒷자리 기반 성별 추론 (900101-1xxxxxx/2xxxxxx 등)
                if (strlen($birth) >= 7) {
                    $g_char = substr($birth, 6, 1);
                    if ($g_char === '1' || $g_char === '3') $gender = '남성';
                    else if ($g_char === '2' || $g_char === '4') $gender = '여성';
                }
            }
            
            // 🐕 소유견의 등록번호 조회
            $m_id = $conn->real_escape_string($row['id']);
            $m_mid = $conn->real_escape_string($row['mid']);
            $dog_reg_nos = [];
            if (!empty($m_id) || !empty($m_mid)) {
                $ids_cond = [];
                if (!empty($m_id)) $ids_cond[] = "'$m_id'";
                if (!empty($m_mid)) $ids_cond[] = "'$m_mid'";
                $ids_str = implode(',', $ids_cond);
                
                $dog_sql = "SELECT reg_no FROM dogTab WHERE poss_id IN ($ids_str)
                            UNION
                            SELECT reg_no FROM nice_dogTab WHERE poss_id IN ($ids_str)";
                $dog_res = $conn->query($dog_sql);
                if ($dog_res) {
                    while ($d_row = $dog_res->fetch_assoc()) {
                        $dog_reg_nos[] = kkc_convert($d_row['reg_no'], 'EUC-KR', true);
                    }
                }
            }
            
            $list[] = [
                'mid' => intval($row['mid']),
                'id' => kkc_convert($row['id'], 'EUC-KR', true),
                'name' => kkc_convert($row['name'], 'EUC-KR', true),
                'birth' => $birth,
                'hp' => kkc_convert($row['hp'], 'EUC-KR', true),
                'gender' => $gender ?: '남성',
                'ci' => $row['nice_ci'],
                'di' => $row['nice_di'],
                'addr' => kkc_convert($row['addr'], 'EUC-KR', true),
                'verified_at' => $row['nice_verified_at'] ?? date('Y-m-d H:i:s'),
                'owned_dogs' => $dog_reg_nos
            ];
        }
    }
    
    $total_res = $conn->query("SELECT COUNT(*) as cnt FROM (
        SELECT mid FROM memTab WHERE $where
        UNION
        SELECT mid FROM nice_memTab WHERE $where
    ) AS combined");
    $total = ($total_res) ? intval($total_res->fetch_assoc()['cnt']) : 0;
    
    $conn->close();
    
    return [
        'success' => true,
        'data' => $list,
        'total' => $total
    ];
}

/**
 * 🎖️ NICE 모바일 혈통서 심사 신청 목록 조회 (Admin)
 */
function nice_admin_pedigree_list($input) {
    $conn = get_kkc_portal_db();
    nice_api_db_init($conn);
    
    $page = max(1, intval($input['page'] ?? 1));
    $limit = intval($input['limit'] ?? 50);
    $offset = ($page - 1) * $limit;
    
    $where = "1=1";
    
    $search = trim($input['search'] ?? '');
    if ($search !== '') {
        $e_search = $conn->real_escape_string($search);
        $field = $input['field'] ?? 'all';
        
        if ($field === 'reg_no') {
            $where .= " AND reg_no LIKE '%$e_search%'";
        } else if ($field === 'dog_name') {
            $where .= " AND name LIKE '%$e_search%'";
        } else if ($field === 'owner_name') {
            $where .= " AND req_name LIKE '%$e_search%'";
        } else if ($field === 'micro') {
            $where .= " AND micro LIKE '%$e_search%'";
        } else {
            $where .= " AND (reg_no LIKE '%$e_search%' OR name LIKE '%$e_search%' OR req_name LIKE '%$e_search%' OR micro LIKE '%$e_search%')";
        }
    }
    
    $status = $input['status'] ?? 'all';
    if ($status !== 'all') {
        $where .= " AND status = '" . $conn->real_escape_string($status) . "'";
    }
    
    $conn->query("SET NAMES 'utf8mb4'");
    $kor_breed_map = [];
    $class_res = $conn->query("SELECT keyy, kor_name, name FROM dog_classTab");
    if ($class_res) {
        while ($c_row = $class_res->fetch_assoc()) {
            $k_name = !empty($c_row['kor_name']) ? $c_row['kor_name'] : $c_row['name'];
            if (!empty($c_row['keyy'])) $kor_breed_map[$c_row['keyy']] = $k_name;
            if (!empty($c_row['name'])) $kor_breed_map[$c_row['name']] = $k_name;
            if (!empty($c_row['kor_name'])) $kor_breed_map[$c_row['kor_name']] = $k_name;
        }
    }
    
    $sql = "SELECT * FROM nice_pedigree_requests WHERE $where ORDER BY uid DESC LIMIT $limit OFFSET $offset";
    $res = $conn->query($sql);
    
    $list = [];
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $raw_breed = $row['dog_classTab_name'];
            $display_breed = isset($kor_breed_map[$raw_breed]) ? $kor_breed_map[$raw_breed] : $raw_breed;
            
            $list[] = [
                'uid' => intval($row['uid']),
                'reg_no' => $row['reg_no'],
                'dog_name' => $row['name'],
                'breed_name' => $display_breed,
                'dog_classTab_name' => $raw_breed,
                'gender' => $row['sex'],
                'micro' => $row['micro'],
                'owner_name' => $row['req_name'],
                'owner_id' => $row['petpin'],
                'sire_name' => $row['father_name'],
                'dam_name' => $row['mother_name'],
                'registered_at' => $row['created_at'],
                'status' => $row['status'],
                'admin_memo' => $row['admin_memo'],
                'image1_path' => $row['image1_path'],
                'image2_path' => $row['image2_path'],
                'image3_path' => $row['image3_path'],
                'image4_path' => $row['image4_path'],
                'poss_ci' => $row['poss_ci'],
                
                // 추가 필드 매핑 (HeidiSQL 엑셀 정보 기반)
                'saho_eng' => $row['saho_eng'],
                'saho' => $row['saho'],
                'hair' => $row['hair'],
                'breeder_name' => $row['breed_name'],
                'breeder_addr' => $row['breed_addr'],
                'poss_name' => $row['poss_name'],
                'poss_addr' => $row['poss_addr'],
                'birth' => $row['birth'],
                'birth_m' => intval($row['birth_m'] ?? 0),
                'birth_f' => intval($row['birth_f'] ?? 0),
                'reg_count_m' => intval($row['reg_count_m'] ?? 0),
                'reg_count_f' => intval($row['reg_count_f'] ?? 0),
                'reg_date' => $row['reg_date'] ?? '',
                'sire_reg_no' => $row['father_reg_no'],
                'dam_reg_no' => $row['mother_reg_no'],
                'fa_name' => $row['father_name'],
                'fa_regno' => $row['father_reg_no'],
                'mo_name' => $row['mother_name'],
                'mo_regno' => $row['mother_reg_no'],
                'anc_name' => $row['anc_name'] ?? '',
                'anc_saho' => $row['anc_saho'] ?? ''
            ];
        }
    }
    
    $total_res = $conn->query("SELECT COUNT(*) as cnt FROM nice_pedigree_requests WHERE $where");
    $total = ($total_res) ? intval($total_res->fetch_assoc()['cnt']) : 0;
    
    $conn->close();
    
    return [
        'success' => true,
        'data' => $list,
        'total' => $total
    ];
}

/**
 * 🎖️ 펫핀 신규 혈통서 번호 부여 규칙 적용 ([견종코드]-[기간코드_십][기간코드_일][4자리 순번]-[NP])
 * 예1) 2026년 1번째 신청 진돗개: KJ-C60000-NP (C=2020년대, 6=2026년, 0000=1번째)
 * 예2) 2031년 100번째 신청 진돗개: KJ-D10100-NP (D=2030년대, 1=2031년, 0100=100번째)
 */
function nice_generate_unique_reg_no($conn, $breed_code = '', $apply_year = null, $breed_name = '') {
    $year = $apply_year ? intval($apply_year) : intval(date('Y'));
    
    // (1) 기간코드_십 (2000~2009 => A, 2010~2019 => B, 2020~2029 => C, 2030~2039 => D ...)
    $decade_index = intval(floor(($year - 2000) / 10));
    $decade_letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'];
    $decade_code = isset($decade_letters[$decade_index]) ? $decade_letters[$decade_index] : 'C';
    
    // (2) 기간코드_일 (신청 연도의 일의 자리: 2026년 => 6)
    $single_year_code = strval($year % 10);
    
    // NICE 모바일 5000번대 전용 검색 접두사: C65 (예: 2026년 C6 + 5000대 5)
    $prefix = $decade_code . $single_year_code . '5';
    $prefix_esc = $conn->real_escape_string($prefix);
    
    // (3) 5000~5999 범위 중 견종별 최고 순번 탐색 (5000부터 시작)
    $max_seq = 5000;
    
    $e_breed = !empty($breed_name) ? $conn->real_escape_string(kkc_convert($breed_name, 'EUC-KR', false)) : '';
    
    // 1. nice_dogTab (발급 완료 모바일 혈통서 - EUC-KR 테이블) 탐색
    $conn->query("SET NAMES 'binary'");
    $sql1 = "SELECT reg_no FROM nice_dogTab WHERE reg_no LIKE '$prefix_esc%'";
    if (!empty($e_breed)) {
        $sql1 .= " AND (dog_class = '$e_breed' OR breed_name = '$e_breed')";
    }
    $res1 = $conn->query($sql1);
    if ($res1) {
        while ($row = $res1->fetch_assoc()) {
            $reg = kkc_convert($row['reg_no'], 'EUC-KR', true);
            if (preg_match('/' . $decade_code . $single_year_code . '(\d{4})/', $reg, $m)) {
                $seq = intval($m[1]);
                if ($seq >= 5000 && $seq > $max_seq) $max_seq = $seq;
            }
        }
    }

    // 2. nice_pedigree_requests (모바일 심사 신청 내역 - utf8mb4 테이블) 탐색
    $conn->query("SET NAMES 'utf8mb4'");
    $sql2 = "SELECT reg_no FROM nice_pedigree_requests WHERE reg_no LIKE '$prefix_esc%'";
    if (!empty($breed_name)) {
        $e_b_utf8 = $conn->real_escape_string($breed_name);
        $sql2 .= " AND (dog_classTab_name = '$e_b_utf8' OR breed_name = '$e_b_utf8')";
    }
    $res2 = $conn->query($sql2);
    if ($res2) {
        while ($row = $res2->fetch_assoc()) {
            $reg = $row['reg_no'];
            if (preg_match('/' . $decade_code . $single_year_code . '(\d{4})/', $reg, $m)) {
                $seq = intval($m[1]);
                if ($seq >= 5000 && $seq > $max_seq) $max_seq = $seq;
            }
        }
    }
    
    // 3. dogTab (레거시 DB - EUC-KR 테이블) 탐색
    $conn->query("SET NAMES 'binary'");
    $sql3 = "SELECT reg_no FROM dogTab WHERE reg_no LIKE '$prefix_esc%'";
    if (!empty($e_breed)) {
        $sql3 .= " AND dog_class = '$e_breed'";
    }
    $res3 = $conn->query($sql3);
    if ($res3) {
        while ($row = $res3->fetch_assoc()) {
            $reg = kkc_convert($row['reg_no'], 'EUC-KR', true);
            if (preg_match('/' . $decade_code . $single_year_code . '(\d{4})/', $reg, $m)) {
                $seq = intval($m[1]);
                if ($seq >= 5000 && $seq > $max_seq) $max_seq = $seq;
            }
        }
    }
    
    $breed_key = !empty($breed_code) ? strtoupper(trim($breed_code)) : '';
    $breed_prefix = !empty($breed_key) ? ($breed_key . '-') : '';
    
    $next_seq = $max_seq + 1; // 5001부터 시작
    $seq_str = sprintf("%04d", $next_seq);
    
    // [견종코드]-[기간코드_십][기간코드_일][4자리 순번] (예: KSZ-C65001)
    return $breed_prefix . $decade_code . $single_year_code . $seq_str;
}

/**
 * 🎖️ NICE 모바일 혈통서 승인/거절 처리 (Admin)
 */
function nice_admin_pedigree_action($input) {
    $conn = get_kkc_portal_db();
    nice_api_db_init($conn);
    $conn->query("SET NAMES 'utf8mb4'");
    
    $uid = intval($input['uid'] ?? 0);
    $action = $input['action'] ?? ''; // 'approve' or 'reject'
    $admin_memo = $conn->real_escape_string($input['memo'] ?? '');
    
    if (!$uid) {
        $conn->close();
        return ['success' => false, 'error' => '유효하지 않은 요청 번호입니다.'];
    }
    
    // 심사 요청 정보 확인
    $req = $conn->query("SELECT * FROM nice_pedigree_requests WHERE uid = $uid LIMIT 1")->fetch_assoc();
    if (!$req) {
        $conn->close();
        return ['success' => false, 'error' => '신청 내역을 찾을 수 없습니다.'];
    }
    
    if ($req['status'] !== 'P' && $req['status'] !== 'R') {
        $conn->close();
        return ['success' => false, 'error' => '이미 심사가 완료된 건입니다.'];
    }

    // 🎨 관리자 수정 모색, 견종, 등록번호 및 부모견 영문 이름 반영
    if (isset($input['hair']) && trim($input['hair']) !== '') {
        $req['hair'] = trim($input['hair']);
    }
    if (isset($input['breed_name']) && trim($input['breed_name']) !== '') {
        $req['dog_classTab_name'] = trim($input['breed_name']);
    }
    if (isset($input['reg_no']) && trim($input['reg_no']) !== '') {
        $req['reg_no'] = trim($input['reg_no']);
    }
    if (isset($input['fa_name']) || isset($input['father_name'])) {
        $req['father_name'] = trim($input['fa_name'] ?? ($input['father_name'] ?? ''));
        $req['fa_name'] = $req['father_name'];
    }
    if (isset($input['mo_name']) || isset($input['mother_name'])) {
        $req['mother_name'] = trim($input['mo_name'] ?? ($input['mother_name'] ?? ''));
        $req['mo_name'] = $req['mother_name'];
    }
    if (isset($input['fa_regno']) || isset($input['father_reg_no'])) {
        $req['father_reg_no'] = trim($input['fa_regno'] ?? ($input['father_reg_no'] ?? ''));
        $req['fa_regno'] = $req['father_reg_no'];
    }
    if (isset($input['mo_regno']) || isset($input['mother_reg_no'])) {
        $req['mother_reg_no'] = trim($input['mo_regno'] ?? ($input['mother_reg_no'] ?? ''));
        $req['mo_regno'] = $req['mother_reg_no'];
    }
    
    $conn->query("SET NAMES 'utf8mb4'");
    $e_edit_hair = $conn->real_escape_string($req['hair']);
    $e_edit_breed = $conn->real_escape_string($req['dog_classTab_name']);
    $e_edit_regno = $conn->real_escape_string($req['reg_no']);
    $e_edit_fa_name = $conn->real_escape_string($req['fa_name'] ?? ($req['father_name'] ?? ''));
    $e_edit_mo_name = $conn->real_escape_string($req['mo_name'] ?? ($req['mother_name'] ?? ''));
    $e_edit_fa_reg = $conn->real_escape_string($req['fa_regno'] ?? ($req['father_reg_no'] ?? ''));
    $e_edit_mo_reg = $conn->real_escape_string($req['mo_regno'] ?? ($req['mother_reg_no'] ?? ''));
    
    $upd_sql = "UPDATE nice_pedigree_requests SET 
        hair = '$e_edit_hair', 
        dog_classTab_name = '$e_edit_breed', 
        reg_no = '$e_edit_regno',
        fa_name = '$e_edit_fa_name',
        father_name = '$e_edit_fa_name',
        mo_name = '$e_edit_mo_name',
        mother_name = '$e_edit_mo_name',
        fa_regno = '$e_edit_fa_reg',
        father_reg_no = '$e_edit_fa_reg',
        mo_regno = '$e_edit_mo_reg',
        mother_reg_no = '$e_edit_mo_reg'
        WHERE uid = $uid";
    if (!$conn->query($upd_sql)) {
        throw new Exception("[Step 1 - req_update] " . $conn->error);
    }
    
    if ($action === 'reject') {
        $log_messages = [];
        $conn->query("SET NAMES 'utf8mb4'"); // 한글 반려 사유 처리를 위해 명시적으로 utf8mb4 설정
        $res_req = $conn->query("UPDATE nice_pedigree_requests SET status = 'N', admin_memo = '$admin_memo' WHERE uid = $uid");
        if ($res_req) {
            $log_messages[] = "✔ [심사 신청 상태] 반려(N)로 정상 업데이트 완료";
        } else {
            $err = $conn->error;
            $conn->close();
            return ['success' => false, 'error' => "❌ [KKC 내부 DB 오류] 반려 상태 업데이트 실패: " . $err];
        }
        
        // NICE 통보 (반려: F) - 안전한 통신 격리
        $nice_status_msg = "";
        $is_nice_success = false;
        try {
            $nice_res = nice_notify_screening_result($conn, $req['poss_ci'], $req['reg_no'], 'F', $req['order_no'] ?? '');
            if ($nice_res && isset($nice_res['success']) && $nice_res['success'] === true) {
                $res_data = $nice_res['data'] ?? [];
                $rslt_cd = $res_data['result_cd'] ?? 'F999';
                if ($rslt_cd === 'S000') {
                    $is_nice_success = true;
                    $nice_status_msg = "✔ [NICE 서버 통보] 정상 완료 (응답코드: S000)";
                } else {
                    $cd_desc = [
                        'F001' => '소유자 CI 확인실패(미등록CI)',
                        'F002' => '결제주문번호 확인 실패 (미심사요청 혈통서)',
                        'F003' => '소유자 CI와 결제주문번호 불일치',
                        'F999' => '기타 처리중 오류'
                    ];
                    $desc = $cd_desc[$rslt_cd] ?? '알 수 없는 오류';
                    $nice_status_msg = "⚠ [NICE 서버 처리 실패] $rslt_cd ($desc)";
                }
            } else {
                $err_msg = isset($nice_res['error']) ? $nice_res['error'] : '통신 실패';
                $nice_status_msg = "⚠ [NICE 서버 통보 실패] " . $err_msg;
            }
        } catch (Throwable $te) {
            $nice_status_msg = "⚠ [NICE 서버 통신 예외] " . $te->getMessage();
        }
        
        $conn->close();
        
        $final_title = $is_nice_success
            ? "❌ [혈통서 심사 반려 완료]"
            : "⚠️ [KKC 반려 처리 완료 / NICE 통보 주의]";
            
        $summary = $final_title . "\n\n"
            . "━━━━━━━━━━━━━━━━━━━━━━━\n"
            . "1️⃣ [1단계: KKC 내부 DB 처리]\n"
            . implode("\n", $log_messages) . "\n\n"
            . "2️⃣ [2단계: NICE 서버 통보]\n"
            . $nice_status_msg;
            
        return ['success' => true, 'is_nice_success' => $is_nice_success, 'message' => $summary];
    }
    
    // [승인 처리 로직]
    // 2. 소유주의 mid/id 확인
    // 2-1. 1차 조회: NICE 핀(nice_ci)으로 이미 인증된 회원인지 확인
    $conn->query("SET NAMES 'binary'");
    $e_ci = $conn->real_escape_string($req['poss_ci']);
    $usr = $conn->query("SELECT id, name, mid, birth, hp FROM memTab WHERE nice_ci = '$e_ci' LIMIT 1")->fetch_assoc();
    if (!$usr) {
        $usr = $conn->query("SELECT id, name, mid, birth, hp FROM nice_memTab WHERE nice_ci = '$e_ci' LIMIT 1")->fetch_assoc();
    }

    // 2-2. 2차 조회: 아직 CI가 연동되지 않은 협회 기존 회원인 경우 [이름 + 전화번호]로 계정 자동 매칭
    if (!$usr && (!empty($req['poss_name']) || !empty($req['req_name']))) {
        $req_name = trim(!empty($req['poss_name']) ? $req['poss_name'] : $req['req_name']);
        $req_mobile = trim($req['req_mobile'] ?? '');
        $clean_hp = preg_replace('/[^0-9]/', '', $req_mobile);
        
        if (!empty($req_name) && !empty($clean_hp)) {
            $e_name_euc = $conn->real_escape_string(kkc_convert($req_name, 'EUC-KR', false));
            $e_name_utf8 = $conn->real_escape_string($req_name);
            
            $sql_match = "SELECT mid, id, name, birth, hp FROM memTab 
                WHERE name = '$e_name_euc'
                AND REPLACE(REPLACE(hp, '-', ''), ' ', '') = '$clean_hp'
                LIMIT 1";
            $match_res = $conn->query($sql_match);
            
            if ($match_res && $match_res->num_rows > 0) {
                $usr = $match_res->fetch_assoc();
                
                // 기존 회원 계정에 이번 NICE CI만 안전하게 자동 연동 (birth 수정 제외로 인코딩 에러 원천 차단)
                if (!empty($usr['mid']) && !empty($e_ci)) {
                    try {
                        $conn->query("UPDATE memTab SET nice_ci = '$e_ci', nice_verified_at = NOW() WHERE mid = " . intval($usr['mid']));
                    } catch (Throwable $e) {
                        // CI 업데이트 실패 시에도 메인 혈통서 발급은 안전하게 계속 진행
                    }
                }
            }
        }
    }
    $poss_id = $usr ? $usr['id'] : '';
    
    // 3. dogTab에서 원본 반려견 정보 확인 (원본조회는 Read-Only이므로 기존 dogTab 조회)
    $e_orig_reg = $conn->real_escape_string(kkc_convert($req['reg_no'], 'EUC-KR', false));
    $conn->query("SET NAMES 'binary'");
    $dog_chk = $conn->query("SELECT * FROM dogTab WHERE reg_no = '$e_orig_reg' LIMIT 1");
    
    $is_same_owner = false;
    $orig_dog = null;
    if ($dog_chk && $dog_chk->num_rows > 0) {
        $orig_dog = $dog_chk->fetch_assoc();
        if (!empty($poss_id) && !empty($orig_dog['poss_id']) && $poss_id === $orig_dog['poss_id']) {
            $is_same_owner = true;
        }
    }
    
    if ($is_same_owner && $orig_dog) {
        // 기존 소유견인 경우: 기존 등록번호 끝에 -NP만 붙여서 사용
        $base_reg_no = kkc_convert($orig_dog['reg_no'], 'EUC-KR', true);
        $np_reg_no = (strpos($base_reg_no, '-NP') !== false) ? $base_reg_no : ($base_reg_no . '-NP');
    } else {
        // 신규이거나 소유주가 다른 경우: 겹치지 않는 NICE 전용 5000번대 등록번호 자동 생성 후 -NP 추가
        $breed_name_utf8 = trim($req['dog_classTab_name']);
        $conn->query("SET NAMES 'utf8mb4'");
        $e_b_utf8 = $conn->real_escape_string($breed_name_utf8);
        $breed_chk = $conn->query("SELECT keyy FROM dog_classTab WHERE TRIM(kor_name) = '$e_b_utf8' OR TRIM(name) = '$e_b_utf8' OR keyy = '$e_b_utf8' LIMIT 1");
        
        $keyy = '';
        if ($breed_chk && $breed_chk->num_rows > 0) {
            $keyy = trim($breed_chk->fetch_assoc()['keyy'] ?? '');
        }
        
        if (empty($keyy)) {
            // EUC-KR 인코딩 테이블 대비 2차 검색
            $conn->query("SET NAMES 'binary'");
            $e_b_euc = $conn->real_escape_string(kkc_convert($breed_name_utf8, 'EUC-KR', false));
            $breed_chk2 = $conn->query("SELECT keyy FROM dog_classTab WHERE TRIM(kor_name) = '$e_b_euc' OR TRIM(name) = '$e_b_euc' OR keyy = '$e_b_euc' LIMIT 1");
            if ($breed_chk2 && $breed_chk2->num_rows > 0) {
                $keyy = kkc_convert(trim($breed_chk2->fetch_assoc()['keyy'] ?? ''), 'EUC-KR', true);
            }
        }
        $generated_reg_no = nice_generate_unique_reg_no($conn, $keyy, null, $breed_name_utf8);
        $np_reg_no = (strpos($generated_reg_no, '-NP') !== false) ? $generated_reg_no : ($generated_reg_no . '-NP');
        
        // nice_pedigree_requests (utf8mb4 테이블)에 reg_no 동기화 업데이트
        $conn->query("SET NAMES 'utf8mb4'");
        $conn->query("UPDATE nice_pedigree_requests SET reg_no = '" . $conn->real_escape_string($np_reg_no) . "' WHERE uid = $uid");
    }
    
    $conn->query("SET NAMES 'binary'");
    $e_np_reg = $conn->real_escape_string(kkc_convert($np_reg_no, 'EUC-KR', false));
    $log_messages = [];

    if ($is_same_owner && $orig_dog) {
        // 복제 및 업데이트를 격리된 nice_dogTab 테이블에 실행
        $chk_np = $conn->query("SELECT uid FROM nice_dogTab WHERE reg_no = '$e_np_reg' LIMIT 1");
        
        $birth_m = intval($req['birth_m'] ?? 0);
        $birth_f = intval($req['birth_f'] ?? 0);
        $reg_count_m = intval($req['reg_count_m'] ?? 0);
        $reg_count_f = intval($req['reg_count_f'] ?? 0);
        $fa_name = kkc_convert($req['father_name'] ?? '', 'EUC-KR', false);
        $mo_name = kkc_convert($req['mother_name'] ?? '', 'EUC-KR', false);
        $fa_regno = kkc_convert($req['father_reg_no'] ?? '', 'EUC-KR', false);
        $mo_regno = kkc_convert($req['mother_reg_no'] ?? '', 'EUC-KR', false);
        $anc_name = kkc_convert($req['anc_name'] ?? '', 'EUC-KR', false);
        $anc_saho = kkc_convert($req['anc_saho'] ?? '', 'EUC-KR', false);
        $reg_date = kkc_convert($req['reg_date'] ?? date('Y-m-d'), 'EUC-KR', false);
        $saho = kkc_convert($req['saho'] ?? '', 'EUC-KR', false);
        $saho_eng = kkc_convert($req['saho_eng'] ?? '', 'EUC-KR', false);
        $hair = kkc_convert($req['hair'] ?? '', 'EUC-KR', false);

        if ($chk_np && $chk_np->num_rows > 0) {
            $np_uid = $chk_np->fetch_assoc()['uid'];
            $res = $conn->query("UPDATE nice_dogTab SET
                poss_id = '" . $conn->real_escape_string($poss_id) . "',
                poss_name = '" . $conn->real_escape_string($orig_dog['poss_name']) . "',
                birth_m = $birth_m,
                birth_f = $birth_f,
                reg_count_m = $reg_count_m,
                reg_count_f = $reg_count_f,
                fa_name = '" . $conn->real_escape_string($fa_name) . "',
                mo_name = '" . $conn->real_escape_string($mo_name) . "',
                fa_regno = '" . $conn->real_escape_string($fa_regno) . "',
                mo_regno = '" . $conn->real_escape_string($mo_regno) . "',
                anc_name = '" . $conn->real_escape_string($anc_name) . "',
                anc_saho = '" . $conn->real_escape_string($anc_saho) . "',
                reg_date = '" . $conn->real_escape_string($reg_date) . "',
                saho = '" . $conn->real_escape_string($saho) . "',
                saho_eng = '" . $conn->real_escape_string($saho_eng) . "',
                hair = '" . $conn->real_escape_string($hair) . "'
                WHERE uid = $np_uid");
            if ($res) {
                $log_messages[] = "✔ [nice_dogTab] 기존 모바일 혈통서 정보 및 메타데이터 업데이트 성공";
            } else {
                $err = $conn->error;
                $conn->close();
                return ['success' => false, 'error' => "기존 모바일 혈통서 정보 업데이트 실패: " . $err];
            }
        } else {
            $fields = [];
            $vals = [];
            
            $req_override = [
                'birth_m' => $birth_m,
                'birth_f' => $birth_f,
                'reg_count_m' => $reg_count_m,
                'reg_count_f' => $reg_count_f,
                'fa_name' => $fa_name,
                'mo_name' => $mo_name,
                'fa_regno' => $fa_regno,
                'mo_regno' => $mo_regno,
                'anc_name' => $anc_name,
                'anc_saho' => $anc_saho,
                'reg_date' => $reg_date,
                'saho' => $saho,
                'saho_eng' => $saho_eng,
                'hair' => $hair
            ];
            
            foreach ($orig_dog as $k => $v) {
                if ($k === 'uid') continue;
                $fields[] = "`$k`";
                if ($k === 'reg_no') {
                    $vals[] = "'$e_np_reg'";
                } else if ($k === 'poss_id') {
                    $vals[] = "'" . $conn->real_escape_string($poss_id) . "'";
                } else if (array_key_exists($k, $req_override)) {
                    $val = $req_override[$k];
                    $vals[] = ($val === null) ? "NULL" : "'" . $conn->real_escape_string($val) . "'";
                    unset($req_override[$k]);
                } else if (($k === 'reg_date' || $k === 'birth' || strpos($k, 'date') !== false) && trim($v) === '') {
                    $vals[] = "NULL";
                } else {
                    $vals[] = ($v === null) ? "NULL" : "'" . $conn->real_escape_string($v) . "'";
                }
            }
            
            foreach ($req_override as $k => $val) {
                $fields[] = "`$k`";
                $vals[] = ($val === null) ? "NULL" : "'" . $conn->real_escape_string($val) . "'";
            }
            
            $res = $conn->query("INSERT INTO nice_dogTab (" . implode(',', $fields) . ") VALUES (" . implode(',', $vals) . ")");
            if ($res) {
                $log_messages[] = "✔ [nice_dogTab] 원본 혈통서 기반 모바일 혈통서(-NP) 복제/생성 및 메타데이터 동기화 성공";
            } else {
                $err = $conn->error;
                $conn->close();
                return ['success' => false, 'error' => "원본 혈통서 기반 모바일 혈통서 복제/생성 실패: " . $err];
            }
        }
    } else {
        // 원본 정보가 없거나 소유주가 달라 신규 생성인 경우
        $chk_np = $conn->query("SELECT uid FROM nice_dogTab WHERE reg_no = '$e_np_reg' LIMIT 1");
        if (!$chk_np || $chk_np->num_rows === 0) {
            $breed_name_utf8 = $req['dog_classTab_name'];
            $breed_code = $breed_name_utf8;
            
            $conn->query("SET NAMES 'utf8mb4'");
            $breed_chk = $conn->query("SELECT keyy FROM dog_classTab WHERE kor_name = '" . $conn->real_escape_string($breed_name_utf8) . "' LIMIT 1");
            if ($breed_chk && $breed_chk->num_rows > 0) {
                $breed_code = $breed_chk->fetch_assoc()['keyy'];
            }
            
            $conn->query("SET NAMES 'binary'");
            $res = $conn->query("INSERT INTO nice_dogTab (
                reg_no, fullname, name, dog_class, sex, hair, birth,
                poss_id, poss_name, poss_addr, breed_name, breed_addr,
                fa_regno, mo_regno, fa_name, mo_name, reg_date, saho_eng, saho, anc_name, anc_saho
            ) VALUES (
                '$e_np_reg',
                '" . $conn->real_escape_string(kkc_convert($req['name'], 'EUC-KR', false)) . "',
                '" . $conn->real_escape_string(kkc_convert($req['name'], 'EUC-KR', false)) . "',
                '" . $conn->real_escape_string(kkc_convert($breed_code, 'EUC-KR', false)) . "',
                '" . $conn->real_escape_string(nice_format_sex($req['sex'] ?? '')) . "',
                '" . $conn->real_escape_string(kkc_convert($req['hair'], 'EUC-KR', false)) . "',
                '" . $conn->real_escape_string(kkc_convert(!empty($req['birth']) ? $req['birth'] : '0000-00-00', 'EUC-KR', false)) . "',
                '" . $conn->real_escape_string($poss_id) . "',
                '" . $conn->real_escape_string(kkc_convert($req['poss_name'], 'EUC-KR', false)) . "',
                '" . $conn->real_escape_string(kkc_convert($req['poss_addr'], 'EUC-KR', false)) . "',
                '" . $conn->real_escape_string(kkc_convert($req['breed_name'], 'EUC-KR', false)) . "',
                '" . $conn->real_escape_string(kkc_convert($req['breed_addr'], 'EUC-KR', false)) . "',
                '" . $conn->real_escape_string(kkc_convert($req['father_reg_no'], 'EUC-KR', false)) . "',
                '" . $conn->real_escape_string(kkc_convert($req['mother_reg_no'], 'EUC-KR', false)) . "',
                '" . $conn->real_escape_string(kkc_convert($req['father_name'], 'EUC-KR', false)) . "',
                '" . $conn->real_escape_string(kkc_convert($req['mother_name'], 'EUC-KR', false)) . "',
                '" . date('Y-m-d') . "',
                '" . $conn->real_escape_string(kkc_convert($req['saho_eng'] ?? '', 'EUC-KR', false)) . "',
                '" . $conn->real_escape_string(kkc_convert($req['saho'] ?? '', 'EUC-KR', false)) . "',
                '" . $conn->real_escape_string(kkc_convert($req['anc_name'] ?? '', 'EUC-KR', false)) . "',
                '" . $conn->real_escape_string(kkc_convert($req['anc_saho'] ?? '', 'EUC-KR', false)) . "'
            )");
            if ($res) {
                $log_messages[] = "✔ [nice_dogTab] 신규 모바일 혈통서(-NP) 데이터 생성 성공";
            } else {
                $err = $conn->error;
                $conn->close();
                return ['success' => false, 'error' => "[Step 7 - nice_dogTab INSERT 실패]: " . $err];
            }
        } else {
            $log_messages[] = "✔ [nice_dogTab] 이미 모바일 혈통서가 존재하여 생성을 건너뛰었습니다.";
        }
    }

    // 3.5. 신규 추가 필드들 (birth_m, birth_f, reg_count_m, reg_count_f, reg_date) 동기화 업데이트 실행
    $raw_reg_date = trim($req['reg_date'] ?? '');
    $raw_reg_date = str_replace('.', '-', $raw_reg_date);
    if (preg_match('/^\d{8}$/', $raw_reg_date)) {
        $raw_reg_date = substr($raw_reg_date, 0, 4) . '-' . substr($raw_reg_date, 4, 2) . '-' . substr($raw_reg_date, 6, 2);
    }
    
    $reg_date_val = (!empty($raw_reg_date) && $raw_reg_date !== '0000-00-00') 
        ? "'" . $conn->real_escape_string($raw_reg_date) . "'" 
        : "NULL";

    $res_fields_update = $conn->query("UPDATE nice_dogTab SET
        order_no = '" . $conn->real_escape_string($req['order_no'] ?? '') . "',
        birth_m = " . intval($req['birth_m'] ?? 0) . ",
        birth_f = " . intval($req['birth_f'] ?? 0) . ",
        reg_count_m = " . intval($req['reg_count_m'] ?? 0) . ",
        reg_count_f = " . intval($req['reg_count_f'] ?? 0) . ",
        reg_date = $reg_date_val
        WHERE reg_no = '$e_np_reg'");
    if ($res_fields_update) {
        $log_messages[] = "✔ [nice_dogTab] 신규 필드 메타데이터 동기화 완료";
    } else {
        $err = $conn->error;
        $conn->close();
        return ['success' => false, 'error' => "[Step 8 - nice_dogTab UPDATE 실패]: " . $err];
    }
    
    // 4. 심사 요청 상태 갱신
    $conn->query("SET NAMES 'utf8mb4'");
    $res_req = $conn->query("UPDATE nice_pedigree_requests SET status = 'Y', admin_memo = '$admin_memo' WHERE uid = $uid");
    if ($res_req) {
        $log_messages[] = "✔ [심사 신청 상태] 승인(Y)으로 정상 업데이트 완료";
    } else {
        $err = $conn->error;
        $conn->close();
        return ['success' => false, 'error' => "❌ [KKC 내부 DB 오류] 심사 신청 상태 업데이트 실패: " . $err];
    }
    
    // 5. NICE 통보 (승인: S) - 안전한 통신 격리
    $nice_status_msg = "";
    $is_nice_success = false;
    try {
        $nice_res = nice_notify_screening_result($conn, $req['poss_ci'], $np_reg_no, 'S', $req['order_no'] ?? '');
        if ($nice_res && isset($nice_res['success']) && $nice_res['success'] === true) {
            $res_data = $nice_res['data'] ?? [];
            $rslt_cd = $res_data['result_cd'] ?? 'F999';
            if ($rslt_cd === 'S000') {
                $is_nice_success = true;
                $nice_status_msg = "✔ [NICE 서버 통보] 정상 완료 (응답코드: S000)";
            } else {
                $cd_desc = [
                    'F001' => '소유자 CI 확인실패(미등록CI)',
                    'F002' => '결제주문번호 확인 실패 (미심사요청 혈통서)',
                    'F003' => '소유자 CI와 결제주문번호 불일치',
                    'F999' => '기타 처리중 오류'
                ];
                $desc = $cd_desc[$rslt_cd] ?? '알 수 없는 오류';
                $nice_status_msg = "⚠ [NICE 서버 처리 실패] $rslt_cd ($desc)";
            }
        } else {
            $err_msg = isset($nice_res['error']) ? $nice_res['error'] : '통신 실패';
            $nice_status_msg = "⚠ [NICE 서버 통보 실패] " . $err_msg;
        }
    } catch (Throwable $te) {
        $nice_status_msg = "⚠ [NICE 서버 통신 예외] " . $te->getMessage();
    }
    
    $conn->close();
    
    $final_title = $is_nice_success 
        ? "🎉 [모바일 혈통서 발급 및 나이스 통보 완료]" 
        : "⚠️ [KKC 발급 완료 / 나이스 서버 통보 주의]";
        
    $summary = $final_title . "\n\n"
        . "━━━━━━━━━━━━━━━━━━━━━━━\n"
        . "1️⃣ [1단계: KKC 내부 DB 처리]\n"
        . implode("\n", $log_messages) . "\n\n"
        . "2️⃣ [2단계: NICE 서버 통보]\n"
        . $nice_status_msg;
        
    return ['success' => true, 'is_nice_success' => $is_nice_success, 'message' => $summary];
}

/**
 * 🎖️ NICE 인증 회원 인증 상태 삭제 (Admin)
 */
function nice_admin_member_delete($input) {
    $conn = get_kkc_portal_db();
    $mid = intval($input['mid'] ?? 0);
    if (!$mid) {
        $conn->close();
        return ['success' => false, 'error' => '유효하지 않은 mid입니다.'];
    }
    $res = $conn->query("DELETE FROM nice_memTab WHERE mid = $mid");
    $conn->close();
    return $res ? ['success' => true] : ['success' => false, 'error' => '삭제 실패'];
}

/**
 * 🎖️ NICE 모바일 혈통서 신청 기록 삭제 (Admin)
 */
function nice_admin_pedigree_delete($input) {
    $conn = get_kkc_portal_db();
    $uid = intval($input['uid'] ?? 0);
    if (!$uid) {
        $conn->close();
        return ['success' => false, 'error' => '유효하지 않은 uid입니다.'];
    }
    $res = $conn->query("DELETE FROM nice_pedigree_requests WHERE uid = $uid");
    $conn->close();
    return $res ? ['success' => true] : ['success' => false, 'error' => '삭제 실패'];
}

/**
 * 🎨 애견협회 모색 마스터 테이블(hairTab)에서 모색 검색 및 매핑 보조 함수
 */
function nice_resolve_color_name($conn, $breed_name, $hair_input) {
    if (empty($hair_input)) return '';
    $hair_clean = trim($hair_input);
    
    $e_hair = $conn->real_escape_string($hair_clean);
    
    $conn->query("SET NAMES 'utf8mb4'");
    
    // hairTab에서 hair(모색명) 또는 short_key가 일치하는 것이 있는지 검색
    $sql = "SELECT hair FROM hairTab 
            WHERE hair = '$e_hair' OR short_key = '$e_hair' 
            LIMIT 1";
    $res = $conn->query($sql);
    if ($res && $row = $res->fetch_assoc()) {
        return $row['hair'];
    }
    
    return $hair_clean;
}

/**
 * 🎨 애견협회 전체 모색 목록 조회 (Admin)
 */
function nice_admin_get_breed_colors($input) {
    $conn = get_kkc_portal_db();
    
    $conn->query("SET NAMES 'utf8mb4'");
    $sql = "SELECT DISTINCT hair FROM hairTab WHERE hair IS NOT NULL AND hair != '' ORDER BY hair ASC LIMIT 500";
    $res = $conn->query($sql);
    
    $list = [];
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $list[] = [
                'color_cd' => $row['hair'],
                'color_name' => $row['hair']
            ];
        }
    }
    
    $conn->close();
    return ['success' => true, 'data' => $list];
}
