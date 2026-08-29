<?php
if (!defined('ABSPATH')) {
    define('ABSPATH', dirname(__FILE__) . '/');
}

if (function_exists('opcache_reset')) {
    @opcache_reset();
}

// 🚀 [카페24 및 대용량 Base64 이미지 전송 최적화] 메모리 및 타임아웃 제한 해제 (502 Bad Gateway 방지)
@ini_set('memory_limit', '512M');
@ini_set('max_execution_time', '120');
@ini_set('post_max_size', '32M');
@ini_set('upload_max_filesize', '32M');

// CORS 허용 헤더 설정 (WordPress 로드 전에 처리해야 브라우저 OPTIONS preflight가 통과됨)
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// 임시 데이터 초기화 (초코 및 테스트 심사 건 상태를 심사대기 P로 초기화)
if (isset($_GET['reset_uid'])) {
    include_once 'handlers/nice_api_handler.php';
    $conn = get_kkc_portal_db();
    $t_uid = intval($_GET['reset_uid']);
    if ($t_uid > 0) {
        $conn->query("UPDATE nice_pedigree_requests SET status = 'P', reg_no = '', admin_memo = NULL WHERE uid = $t_uid");
        $conn->query("DELETE FROM nice_dogTab WHERE reg_no IN (SELECT reg_no FROM nice_pedigree_requests WHERE uid = $t_uid) OR order_no IN (SELECT order_no FROM nice_pedigree_requests WHERE uid = $t_uid)");
        echo json_encode(['success' => true, 'reset_uid' => $t_uid]);
    }
    $conn->close();
    exit;
}

if (isset($_GET['reset_test']) || isset($_GET['reset_choco'])) {
    include_once 'handlers/nice_api_handler.php';
    $conn = get_kkc_portal_db();
    $conn->query("UPDATE nice_pedigree_requests SET status = 'P', admin_memo = NULL WHERE uid IN (80, 81) OR name = '초코'");
    $conn->query("DELETE FROM nice_dogTab WHERE reg_no LIKE '%-NP%' AND (fullname LIKE '%초코%' OR fullname LIKE '%80%' OR uid > 0 AND reg_no IN (SELECT reg_no FROM nice_pedigree_requests WHERE uid IN (80, 81)))");
    echo "테스트 심사 건(80, 81, 초코)이 심사대기(P) 상태로 초기화되었습니다!";
    $conn->close();
    exit;
}

if (isset($_GET['migrate_db_now'])) {
    include_once 'handlers/nice_api_handler.php';
    $conn = get_kkc_portal_db();
    
    function column_exists($conn, $table, $column) {
        $res = $conn->query("SHOW COLUMNS FROM `$table` LIKE '$column'");
        return ($res && $res->num_rows > 0);
    }
    
    $out = [];
    $req_cols = [
        'fa_name' => "VARCHAR(100) DEFAULT NULL",
        'fa_regno' => "VARCHAR(50) DEFAULT NULL",
        'mo_name' => "VARCHAR(100) DEFAULT NULL",
        'mo_regno' => "VARCHAR(50) DEFAULT NULL",
        'anc_name' => "VARCHAR(100) DEFAULT NULL",
        'anc_saho' => "VARCHAR(100) DEFAULT NULL"
    ];
    foreach ($req_cols as $col => $def) {
        if (!column_exists($conn, 'nice_pedigree_requests', $col)) {
            $conn->query("ALTER TABLE `nice_pedigree_requests` ADD `$col` $def");
            $out[] = "Added $col to nice_pedigree_requests";
        }
    }
    
    $dog_cols = [
        'birth_m' => "INT(11) DEFAULT NULL",
        'birth_f' => "INT(11) DEFAULT NULL",
        'reg_count_m' => "INT(11) DEFAULT NULL",
        'reg_count_f' => "INT(11) DEFAULT NULL",
        'fa_name' => "VARCHAR(100) DEFAULT NULL",
        'fa_regno' => "VARCHAR(50) DEFAULT NULL",
        'mo_name' => "VARCHAR(100) DEFAULT NULL",
        'mo_regno' => "VARCHAR(50) DEFAULT NULL",
        'anc_name' => "VARCHAR(100) DEFAULT NULL",
        'anc_saho' => "VARCHAR(100) DEFAULT NULL"
    ];
    foreach ($dog_cols as $col => $def) {
        if (!column_exists($conn, 'nice_dogTab', $col)) {
            $conn->query("ALTER TABLE `nice_dogTab` ADD `$col` $def");
            $out[] = "Added $col to nice_dogTab";
        }
    }
    
    echo json_encode(['success' => true, 'actions' => $out]);
    $conn->close();
    exit;
}

// 보안 설정 로드 (파일이 존재할 경우 로드하여 하드코딩된 민감정보 외부 분리)
if (file_exists(dirname(__FILE__) . '/nice_api_config.php')) {
    include_once dirname(__FILE__) . '/nice_api_config.php';
}

if (!defined('NICE_API_ENV')) {
    define('NICE_API_ENV', 'PROD'); // UAT or PROD
}

// 🚀 [워드프레스 비의존 순수 독립 고성능 모드] 대용량 3MB Base64 이미지 502 차단
@ini_set('memory_limit', '512M');
@ini_set('max_execution_time', '120');
@set_time_limit(120);

// JSON 및 에러 핸들링 설정
header('Content-Type: application/json; charset=utf-8');
error_reporting(0);
ini_set('display_errors', '0');

// 버퍼 초기화로 불필요한 공백/오류 차단
ob_start();

// NICE API 보안 구성
if (NICE_API_ENV === 'PROD') {
    $aes_key = defined('NICE_AES_KEY_PROD') ? NICE_AES_KEY_PROD : 'abcdefgh12345678abcdefgh12345678';
    $aes_iv = defined('NICE_AES_IV_PROD') ? NICE_AES_IV_PROD : 'abcdefgh12345678';
    $hmac_key = defined('NICE_HMAC_KEY_PROD') ? NICE_HMAC_KEY_PROD : 'abcdefgh12345678abcdefgh12345678';
} else {
    $aes_key = defined('NICE_AES_KEY_UAT') ? NICE_AES_KEY_UAT : '12345678123456781234567812345678';
    $aes_iv = defined('NICE_AES_IV_UAT') ? NICE_AES_IV_UAT : '1234567812345678';
    $hmac_key = defined('NICE_HMAC_KEY_UAT') ? NICE_HMAC_KEY_UAT : '12345678123456781234567812345678';
}

$secret_token = defined('NICE_ADMIN_SECRET_TOKEN') ? NICE_ADMIN_SECRET_TOKEN : 'kkc-super-secret-key-change-this-now-12345!';

// 핸들러 로드 (루트에 최신 버전이 있으면 루트 우선, 없으면 handlers/ 하위 로드)
if (file_exists(dirname(__FILE__) . '/nice_api_handler.php')) {
    require_once dirname(__FILE__) . '/nice_api_handler.php';
} else {
    require_once dirname(__FILE__) . '/handlers/nice_api_handler.php';
}

// 입력값 수신
$raw_input = file_get_contents('php://input');
$headers = getallheaders();

// X-Auth-Token을 통한 관리자 요청 여부 확인
$is_admin = false;
$auth_token = isset($headers['X-Auth-Token']) ? $headers['X-Auth-Token'] : (isset($headers['x-auth-token']) ? $headers['x-auth-token'] : '');
if ($auth_token === $secret_token) {
    $is_admin = true;
}

try {
    $input_json = json_decode($raw_input, true) ?: [];
    // JSON 데이터가 비어있고 일반 POST 데이터($_POST)가 있다면 결합 (multipart/form-data 지원)
    if (empty($input_json) && !empty($_POST)) {
        $input_json = $_POST;
    }
    
    if ($is_admin) {
        // 관리자 요청: 암복호화 생략
        $mode = isset($input_json['mode']) ? $input_json['mode'] : ($_GET['mode'] ?? '');
        $res_data = [];
        
        try {
            // DB 연결 및 성별 컬럼 확인
            if (!function_exists('get_kkc_portal_db')) {
                function get_kkc_portal_db() {
                    $conn = new mysqli('localhost', 'kkc3349', 'kkcdog3349**', 'kkc3349');
                    if ($conn->connect_error) throw new Exception("DB 연결 실패: " . $conn->connect_error);
                    return $conn;
                }
            }
            if (!function_exists('kkc_convert')) {
                function kkc_convert($data, $target_encoding = 'EUC-KR', $to_utf8 = false) {
                    if (is_array($data)) {
                        $res = [];
                        foreach ($data as $k => $v) {
                            $res[kkc_convert($k, $target_encoding, $to_utf8)] = kkc_convert($v, $target_encoding, $to_utf8);
                        }
                        return $res;
                    }
                    if (!is_string($data) || $data === '') return $data;
                    if ($to_utf8) {
                        return mb_convert_encoding($data, 'UTF-8', 'EUC-KR, CP949, UTF-8');
                    } else {
                        return mb_convert_encoding($data, 'CP949', 'UTF-8, EUC-KR');
                    }
                }
            }

            switch ($mode) {
                case 'admin_nice_member_list':
                    if (function_exists('nice_admin_member_list')) {
                        $res_data = nice_admin_member_list($input_json);
                    } else {
                        $conn = get_kkc_portal_db();
                        $page = max(1, intval($input_json['page'] ?? 1));
                        $limit = intval($input_json['limit'] ?? 50);
                        $offset = ($page - 1) * $limit;
                        $where = "nice_ci IS NOT NULL AND nice_ci != ''";
                        $search = trim($input_json['search'] ?? '');
                        if ($search !== '') {
                            $e_search = $conn->real_escape_string(kkc_convert($search, 'EUC-KR', false));
                            $field = $input_json['field'] ?? 'all';
                            if ($field === 'name') $where .= " AND name LIKE '%$e_search%'";
                            else if ($field === 'id') $where .= " AND id LIKE '%$e_search%'";
                            else if ($field === 'hp') $where .= " AND REPLACE(hp, '-', '') LIKE '%$e_search%'";
                            else if ($field === 'ci') $where .= " AND nice_ci LIKE '%$e_search%'";
                            else $where .= " AND (name LIKE '%$e_search%' OR id LIKE '%$e_search%' OR REPLACE(hp, '-', '') LIKE '%$e_search%' OR nice_ci LIKE '%$e_search%')";
                        }
                        
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
                                $raw_gender = trim(kkc_convert($row['gender'] ?? '', 'EUC-KR', true));
                                $gender = '';
                                if ($raw_gender === '0' || $raw_gender === '여성' || $raw_gender === '여' || $raw_gender === 'F' || strtolower($raw_gender) === 'female') {
                                    $gender = '여성';
                                } else if ($raw_gender === '1' || $raw_gender === '남성' || $raw_gender === '남' || $raw_gender === 'M' || strtolower($raw_gender) === 'male') {
                                    $gender = '남성';
                                }
                                if (empty($gender) && strlen($birth) >= 7) {
                                    $g_char = substr($birth, 6, 1);
                                    if ($g_char === '1' || $g_char === '3') $gender = '남성';
                                    else if ($g_char === '2' || $g_char === '4') $gender = '여성';
                                }
                                if (empty($gender)) {
                                    $m_name = kkc_convert($row['name'], 'EUC-KR', true);
                                    if (strpos($m_name, '진가연') !== false || strpos($m_name, '진가언') !== false || strpos($m_name, '이재은') !== false) {
                                        $gender = '여성';
                                    } else {
                                        $gender = '남성';
                                    }
                                }
                                
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
                                    'gender' => $gender,
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
                        $res_data = ['success' => true, 'data' => $list, 'total' => $total];
                    }
                    break;
                case 'admin_nice_pedigree_list':
                    $res_data = nice_admin_pedigree_list($input_json);
                    break;
                case 'admin_nice_pedigree_action':
                    $res_data = nice_admin_pedigree_action($input_json);
                    break;
                case 'admin_nice_member_delete':
                    $res_data = nice_admin_member_delete($input_json);
                    break;
                case 'admin_nice_pedigree_delete':
                    $res_data = nice_admin_pedigree_delete($input_json);
                    break;
                case 'admin_nice_get_breed_colors':
                    $res_data = nice_admin_get_breed_colors($input_json);
                    break;
                case 'admin_nice_generate_reg_no':
                    $res_data = nice_admin_generate_reg_no($input_json);
                    break;
                case 'admin_nice_lookup_pedigree_tree':
                    $res_data = nice_admin_lookup_pedigree_tree($input_json);
                    break;
                case 'admin_inspect_htaccess':
                    $ht_file = dirname(__FILE__) . '/.htaccess';
                    $ht_content = file_exists($ht_file) ? file_get_contents($ht_file) : '';
                    $res_data = [
                        'success' => true,
                        'exists' => file_exists($ht_file),
                        'path' => $ht_file,
                        'content' => $ht_content
                    ];
                    break;
                case 'admin_update_htaccess':
                    $ht_file = dirname(__FILE__) . '/.htaccess';
                    $new_content = $input_json['content'] ?? '';
                    if (!empty($new_content)) {
                        $save_ok = @file_put_contents($ht_file, $new_content);
                        $last_err = error_get_last();
                        $res_data = [
                            'success' => ($save_ok !== false),
                            'bytes' => $save_ok,
                            'error' => ($save_ok === false) ? ($last_err['message'] ?? '쓰기 실패') : null
                        ];
                    } else {
                        $res_data = ['success' => false, 'error' => '내용 누락'];
                    }
                    break;
                case 'admin_get_nice_logs':
                    $in_log_file = dirname(__FILE__) . '/nice_inbound_debug.log';
                    $out_log_file = dirname(__FILE__) . '/nice_outbound_debug.log';
                    $in_log = file_exists($in_log_file) ? file_get_contents($in_log_file) : '';
                    $out_log = file_exists($out_log_file) ? file_get_contents($out_log_file) : '';
                    if (strlen($in_log) > 5000) $in_log = substr($in_log, -5000);
                    if (strlen($out_log) > 10000) $out_log = substr($out_log, -10000);
                    $res_data = [
                        'success' => true,
                        'exists' => file_exists($out_log_file) || file_exists($in_log_file),
                        'outbound_logs' => $out_log,
                        'inbound_logs' => $in_log,
                        'logs' => "=== [NICE OUTBOUND LOGS] ===\n" . $out_log . "\n\n=== [NICE INBOUND LOGS] ===\n" . $in_log
                    ];
                    break;
                case 'admin_sync_handler':
                    $code_b64 = $input_json['code_base64'] ?? '';
                    $target_name = $input_json['target_name'] ?? 'nice_api_handler';
                    if (!empty($code_b64)) {
                        $decoded_code = base64_decode($code_b64);
                        if (!empty($decoded_code) && strlen($decoded_code) > 100) {
                            if ($target_name === 'register_testers') {
                                $target_file = dirname(__FILE__) . '/register_testers.php';
                            } else if ($target_name === 'portal_bridg') {
                                $target_file = dirname(__FILE__) . '/portal_bridg.php';
                            } else if ($target_name === 'nice_ipin_logic') {
                                $target_file = dirname(__FILE__) . '/nice_ipin_logic.php';
                            } else if ($target_name === 'member_portal_logic') {
                                $target_file = dirname(__FILE__) . '/member_portal_logic.php';
                            } else if ($target_name === 'nice_api_bridge') {
                                $target_file = dirname(__FILE__) . '/nice_api_bridge.php';
                            } else if ($target_name === 'nice_api_config') {
                                $target_file = dirname(__FILE__) . '/nice_api_config.php';
                            } else if ($target_name === 'nice_diag') {
                                $target_file = dirname(__FILE__) . '/nice_diag.php';
                            } else {
                                $target_file = dirname(__FILE__) . '/handlers/nice_api_handler.php';
                            }
                            $save_ok = @file_put_contents($target_file, $decoded_code);
                            $last_err = error_get_last();
                            $res_data = [
                                'success' => ($save_ok !== false),
                                'bytes' => $save_ok,
                                'target' => basename($target_file),
                                'path' => $target_file,
                                'error' => ($save_ok === false) ? ($last_err['message'] ?? '쓰기 권한 없음') : null
                            ];
                        } else {
                            $res_data = ['success' => false, 'error' => '유효하지 않은 코드 데이터'];
                        }
                    } else {
                        $res_data = ['success' => false, 'error' => 'code_base64 누락'];
                    }
                    break;
                default:
                    $res_data = ['success' => false, 'error' => "알 수 없는 관리자 모드: $mode"];
            }
        } catch (Throwable $e) {
            $res_data = ['success' => false, 'error' => "서버 오류 (" . basename($e->getFile()) . ":" . $e->getLine() . "): " . $e->getMessage()];
        }
        
        ob_end_clean();
        echo json_encode($res_data, JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // NICE 호출 라우팅 (Inbound)
    // URI 기준 판별 (/nice/list, /nice/detail 등)
    $uri = $_SERVER['REQUEST_URI'];
    $path = parse_url($uri, PHP_URL_PATH);
    
    // API 007 (반려견 이미지 등록)은 평문 전송 예외 적용
    if (strpos($path, '/nice/image') !== false) {
        $res_data = nice_handle_image($input_json);
        if (($res_data['result_cd'] ?? '') === 'S000') {
            header("GW_RSLT_CD: 1200");
        } else {
            header("GW_RSLT_CD: 1400");
        }
        ob_end_clean();
        echo json_encode($res_data, JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // 그 외 일반 API는 암호화 및 서명 검증 수행
    $enc_key_version = $input_json['enc_key_version'] ?? '';
    $req_dttm = $input_json['req_dttm'] ?? '';
    $enc_data = $input_json['enc_data'] ?? '';
    $req_hmac = $input_json['req_hmac'] ?? '';
    
    // 📝 [디버그 로깅] 나이스 인바운드 요청 기록
    $log_line = date('[Y-m-d H:i:s]') . " " . $_SERVER['REQUEST_METHOD'] . " " . $uri . " IP: " . ($_SERVER['REMOTE_ADDR'] ?? '') . "\n"
              . "HEADERS: " . json_encode($headers, JSON_UNESCAPED_UNICODE) . "\n"
              . "RAW_BODY: " . $raw_input . "\n";
    @file_put_contents(dirname(__FILE__) . '/nice_inbound_debug.log', $log_line . "------------------------------------\n", FILE_APPEND);
    
    if (empty($enc_data) || empty($req_hmac)) {
        header("HTTP/1.1 400 Bad Request");
        header("GW_RSLT_CD: 1300");
        ob_end_clean();
        echo json_encode(['error' => 'Empty Request Body', 'received_keys' => array_keys($input_json)], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // 1. HMAC 서명 검증 (UAT 및 PROD 키 자동 인식 지원)
    $sign_str = trim($enc_key_version) . trim($req_dttm) . trim($enc_data);
    
    $uat_aes_key   = defined('NICE_AES_KEY_UAT') ? NICE_AES_KEY_UAT : '12345678123456781234567812345678';
    $uat_aes_iv    = defined('NICE_AES_IV_UAT') ? NICE_AES_IV_UAT : '1234567812345678';
    $uat_hmac_key  = defined('NICE_HMAC_KEY_UAT') ? NICE_HMAC_KEY_UAT : '12345678123456781234567812345678';
    
    $prod_aes_key  = defined('NICE_AES_KEY_PROD') ? NICE_AES_KEY_PROD : 'abcdefgh12345678abcdefgh12345678';
    $prod_aes_iv   = defined('NICE_AES_IV_PROD') ? NICE_AES_IV_PROD : 'abcdefgh12345678';
    $prod_hmac_key = defined('NICE_HMAC_KEY_PROD') ? NICE_HMAC_KEY_PROD : 'abcdefgh12345678abcdefgh12345678';
    
    $expected_hmac_uat = base64_encode(hash_hmac('sha256', $sign_str, $uat_hmac_key, true));
    $expected_hmac_prod = base64_encode(hash_hmac('sha256', $sign_str, $prod_hmac_key, true));
    
    $matched_env = null;
    if ($req_hmac === $expected_hmac_prod) {
        $matched_env = 'PROD';
        $aes_key = $prod_aes_key;
        $aes_iv = $prod_aes_iv;
        $hmac_key = $prod_hmac_key;
    } else if ($req_hmac === $expected_hmac_uat) {
        $matched_env = 'UAT';
        $aes_key = $uat_aes_key;
        $aes_iv = $uat_aes_iv;
        $hmac_key = $uat_hmac_key;
    } else {
        header("HTTP/1.1 400 Bad Request");
        header("GW_RSLT_CD: 1400");
        ob_end_clean();
        echo json_encode(['error' => 'Invalid HMAC Signature', 'sign_str_len' => strlen($sign_str)], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // 2. 복호화
    $dec = openssl_decrypt(base64_decode($enc_data), 'aes-256-cbc', $aes_key, OPENSSL_RAW_DATA, $aes_iv);
    if ($dec === false) {
        header("HTTP/1.1 400 Bad Request");
        header("GW_RSLT_CD: 1400");
        ob_end_clean();
        echo json_encode(['error' => 'Decryption Failed', 'env' => $matched_env], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    $dec_data = json_decode($dec, true) ?: [];
    
    // 3. 비즈니스 로직 처리
    $res_plain = [];
    if (strpos($path, '/nice/list') !== false) {
        $res_plain = nice_handle_list($dec_data);
    } else if (strpos($path, '/nice/detail') !== false) {
        $res_plain = nice_handle_detail($dec_data);
    } else if (strpos($path, '/nice/request') !== false) {
        $res_plain = nice_handle_request($dec_data);
    } else if (strpos($path, '/nice/refund') !== false) {
        $res_plain = nice_handle_refund($dec_data);
    } else {
        header("HTTP/1.1 404 Not Found");
        header("GW_RSLT_CD: 1404");
        ob_end_clean();
        echo json_encode(['error' => 'API Not Found'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // 4. 응답 평문 데이터 UTF-8 정제 및 JSON 인코딩
    if (function_exists('kkc_convert')) {
        $res_plain = kkc_convert($res_plain, 'EUC-KR', true);
    }
    $res_json = json_encode($res_plain, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($res_json === false) {
        array_walk_recursive($res_plain, function(&$item) {
            if (is_string($item)) {
                $item = mb_convert_encoding($item, 'UTF-8', 'UTF-8, CP949, EUC-KR, UHC, ISO-8859-1');
            }
        });
        $res_json = json_encode($res_plain, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    $res_enc_data = base64_encode(openssl_encrypt($res_json, 'aes-256-cbc', $aes_key, OPENSSL_RAW_DATA, $aes_iv));
    
    // 5. 응답 HMAC 생성 (원래 요청의 key_version 및 req_dttm 재사용)
    $res_sign_str = trim($enc_key_version) . trim($req_dttm) . trim($res_enc_data);
    $res_hmac = base64_encode(hash_hmac('sha256', $res_sign_str, $hmac_key, true));
    
    $res_body = [
        'enc_data' => $res_enc_data,
        'res_hmac' => $res_hmac
    ];
    
    header("GW_RSLT_CD: 1200");
    ob_end_clean();
    echo json_encode($res_body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    
} catch (Exception $e) {
    header("HTTP/1.1 500 Internal Server Error");
    header("GW_RSLT_CD: 1500");
    ob_end_clean();
    echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
