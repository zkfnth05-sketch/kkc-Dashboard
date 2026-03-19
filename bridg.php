<?php
/**
 * 파일명: bridg.php
 * 기능: 고용량 데이터 및 보안 필터(WAF) 대응 브릿지 (Multipart 대응 버전)
 */

// 🚀 1. CORS 및 기본 헤더
$allowed_origins = [
    'https://kkc-admin-dashboard.vercel.app',
    'https://kkf-admin-dashboard.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://kkc3349.mycafe24.com'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // 보안을 위해 기본적으로는 Vercel 메인 주소만 허용 응답을 보냅니다.
    header("Access-Control-Allow-Origin: https://kkc-admin-dashboard.vercel.app");
}
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, X-Auth-Token, Origin, Accept");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=utf-8");

// 🚀 [DEBUG] 긴급 추적용 로깅 함수
function kkc_debug_log($msg, $data = null) {
    $log_file = dirname(__FILE__) . '/kkc_bridge_debug.log';
    $time = date('[Y-m-d H:i:s]');
    $content = $time . " " . $msg;
    if ($data !== null) {
        $content .= "\nDATA: " . print_r($data, true);
    }
    file_put_contents($log_file, $content . "\n-------------------\n", FILE_APPEND);
}

kkc_debug_log(">>> Request Start: " . $_SERVER['REQUEST_METHOD'] . " from " . ($_SERVER['HTTP_ORIGIN'] ?? 'N/A') . " to " . $_SERVER['REQUEST_URI']);

// 🚀 JSON 응답을 위한 헬퍼 함수
function kkc_output_json($data) {
    if (ob_get_level() > 0) {
        ob_clean(); // 🚀 [해결] 앞서 출력된 모든 공백 및 에러 메시지(빈 줄 포함) 깔끔하게 소거
    }
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// 🚀 2. 서버 자원 제한 최적화
@ini_set('memory_limit', '2048M'); 
@ini_set('max_execution_time', '1200');
@ini_set('post_max_size', '128M'); 
@ini_set('upload_max_filesize', '128M');
@ini_set('display_errors', 0);
error_reporting(0);

// 🚀 3. 수신 데이터 검증 (JSON 또는 Multipart)
$input = [];
$raw_input = file_get_contents('php://input');

// 🛡️ Multipart/Form-Data 형식인 경우 $_POST 확인
if (!empty($_POST['mode'])) {
    $input = $_POST;
} else if (!empty($raw_input)) {
    $input = json_decode($raw_input, true);
}

ob_start();

define('SECRET_KEY', 'kkc-super-secret-key-change-this-now-12345!');
if (($_SERVER['HTTP_X_AUTH_TOKEN'] ?? '') !== SECRET_KEY) {
    if (ob_get_length()) ob_clean();
    echo json_encode(['success' => false, 'error' => '인증 토큰이 유효하지 않습니다.']);
    exit();
}

$current_dir = dirname(__FILE__);
if (!defined('ABSPATH')) {
    $wp_load = $current_dir . '/wp-load.php';
    if (file_exists($wp_load)) { require_once($wp_load); }
    else { 
        if (ob_get_length()) ob_clean();
        echo json_encode(['success' => false, 'error' => '워드프레스 로드 실패']); 
        exit; 
    }
}

require_once $current_dir . '/lib/kkc_constitution.php';
$handler_root = $current_dir . '/handlers/';

try {
    if (empty($input)) {
        throw new Exception("수신된 데이터가 없습니다.");
    }

    $mode = strtolower($input['mode'] ?? '');
    $table = $input['table'] ?? '';
    $output = ['success' => false, 'error' => "처리 모드 미정의: " . $mode];

    function safe_req($file, $dir) { 
        $path = $dir . $file;
        if (file_exists($path)) { require_once($path); }
        else { throw new Exception("핸들러 분실: " . $file); }
    }

    switch ($mode) {
        case 'list':
            if ($table === 'memTab') { safe_req('member_logic.php', $handler_root); $output = kkc_handle_member_list($input); }
            else if ($table === 'dogTab') { safe_req('dog_logic.php', $handler_root); $output = kkc_handle_pedigree_list($input); }
            else if ($table === 'legacy_events') { safe_req('event_logic.php', $handler_root); $output = kkc_handle_event_list($input); }
            else if ($table === 'wp_posts') { 
                if (($input['post_type'] ?? '') === 'kkf_event') {
                    safe_req('event_logic.php', $handler_root); $output = kkc_handle_event_list($input); 
                } else {
                    safe_req('post_logic.php', $handler_root); $output = kkc_handle_get_notices($input); 
                }
            }
            else if ($table === 'wpdmpro') {
                safe_req('download_logic.php', $handler_root); $output = kkc_handle_download_list($input);
            }
            else { safe_req('crud_logic.php', $handler_root); $output = kkc_handle_general_list($input); }
            break;
        case 'get_notices':
        case 'save_notice':
        case 'get_categories': safe_req('post_logic.php', $handler_root); $output = ($mode === 'get_notices') ? kkc_handle_get_notices($input) : (($mode === 'save_notice') ? kkc_handle_save_notice($input) : kkc_handle_get_categories($input)); break;
        case 'create_record':
        case 'update_record':
            if ($table === 'wp_posts' && ($input['data']['post_type'] ?? '') === 'kkf_event') {
                safe_req('event_logic.php', $handler_root); $output = kkc_handle_event_save($input);
            } else {
                safe_req('crud_logic.php', $handler_root); $output = ($mode === 'create_record') ? kkc_handle_create($input) : kkc_handle_update($input);
            }
            break;
        case 'delete_record':
            if ($table === 'wp_posts' && (strpos($input['id'] ?? '', 'ds_') === 0 || strpos($input['id'] ?? '', 'st_') === 0)) {
                safe_req('event_logic.php', $handler_root); $output = kkc_handle_event_delete($input);
            } else {
                safe_req('crud_logic.php', $handler_root); $output = kkc_handle_delete($input);
            }
            break;
        
        // 🚀 이미지 업로드 핸들링
        case 'upload_image': 
            safe_req('crud_logic.php', $handler_root); 
            $output = kkc_handle_upload_image($input); 
            break;

        case 'get_dongtae_info':
        case 'get_next_dongtae_no':
        case 'get_owner_history': safe_req('dog_logic.php', $handler_root); $output = ($mode === 'get_dongtae_info') ? kkc_handle_get_dongtae($input) : (($mode === 'get_next_dongtae_no') ? kkc_handle_next_dongtae_no($input) : kkc_handle_owner_history($input)); break;
        case 'get_events': safe_req('event_logic.php', $handler_root); $output = kkc_handle_get_events($input); break;
        case 'save_event': safe_req('event_logic.php', $handler_root); $output = kkc_handle_event_save($input); break;
        case 'delete_event': safe_req('event_logic.php', $handler_root); $output = kkc_handle_event_delete($input); break;
        case 'get_dogshows': safe_req('crud_logic.php', $handler_root); $output = kkc_handle_get_dogshows(); break;
        case 'execute_sql': safe_req('crud_logic.php', $handler_root); $output = kkc_handle_sql_batch($input); break;
        case 'get_all_tables': safe_req('crud_logic.php', $handler_root); $output = kkc_handle_show_tables(); break;
        case 'save_download': safe_req('download_logic.php', $handler_root); $output = kkc_handle_save_download($input); break;
        case 'update_download': safe_req('download_logic.php', $handler_root); $output = kkc_handle_update_download($input); break;
        case 'pin_download': safe_req('download_logic.php', $handler_root); $output = kkc_handle_pin_download($input); break;
        case 'export_members': safe_req('member_logic.php', $handler_root); $output = kkc_handle_member_export($input); break;
        case 'export_table_batch': safe_req('crud_logic.php', $handler_root); $output = kkc_handle_export_table_batch($input); break;
    }
} catch (Exception $e) { 
    $output = ['success' => false, 'error' => $e->getMessage()]; 
}

// 🚀 [에러 출력 강제 활성화] 치명적 오류 등 숨겨진 메시지 노출 (디버깅용)
ini_set('display_errors', 1);
error_reporting(E_ALL);

// 🚀 [핵심 해결] 워드프레스나 다른 플러그인에서 출력한 잡다한 공백(\n\n\n)을 완벽히 소거
while (ob_get_level()) {
    ob_end_clean();
}

$json_result = json_encode($output, JSON_UNESCAPED_UNICODE);

// 🚨 [진짜 범인!] DB 에러가 한글(EUC-KR)로 날아와 JSON 인코딩이 깨져 빈 화면이 송출됐던 현상 완벽 방어
if ($json_result === false) {
    // 배열 순회하며 깨진 문자열(EUC-KR 등)을 강제로 UTF-8로 정제
    array_walk_recursive($output, function(&$item, $key) {
        if (is_string($item)) {
            $item = mb_convert_encoding($item, 'UTF-8', 'UTF-8, EUC-KR, UHC, ISO-8859-1');
        }
    });
    $json_result = json_encode($output, JSON_UNESCAPED_UNICODE);
    
    if ($json_result === false) {
        // 그래도 실패하면 최후의 에러 원인 송출
        $json_result = json_encode(['success' => false, 'error' => 'JSON 인코딩 실패: ' . json_last_error_msg()]);
    }
}

echo $json_result;
exit;
