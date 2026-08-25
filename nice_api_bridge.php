<?php
/**
 * 파일명: nice_api_bridge.php
 * 기능: NICE ↔ 한국애견협회 API 연동 전용 독립 게이트웨이
 */

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
    define('NICE_API_ENV', 'UAT'); // UAT or PROD
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

// 핸들러 로드
require_once ABSPATH . 'handlers/nice_api_handler.php';

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
            switch ($mode) {
                case 'admin_nice_member_list':
                    $res_data = nice_admin_member_list($input_json);
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
    
    if (empty($enc_data) || empty($req_hmac)) {
        header("HTTP/1.1 400 Bad Request");
        header("GW_RSLT_CD: 1300");
        ob_end_clean();
        echo json_encode(['error' => 'Empty Request Body'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // 1. HMAC 서명 검증
    $sign_str = trim($enc_key_version) . trim($req_dttm) . trim($enc_data);
    $expected_hmac = base64_encode(hash_hmac('sha256', $sign_str, $hmac_key, true));
    
    if ($req_hmac !== $expected_hmac) {
        header("HTTP/1.1 400 Bad Request");
        header("GW_RSLT_CD: 1400");
        ob_end_clean();
        echo json_encode(['error' => 'Invalid HMAC Signature'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // 2. 복호화
    $dec = openssl_decrypt(base64_decode($enc_data), 'aes-256-cbc', $aes_key, OPENSSL_RAW_DATA, $aes_iv);
    if ($dec === false) {
        header("HTTP/1.1 400 Bad Request");
        header("GW_RSLT_CD: 1400");
        ob_end_clean();
        echo json_encode(['error' => 'Decryption Failed'], JSON_UNESCAPED_UNICODE);
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
