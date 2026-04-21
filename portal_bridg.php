<?php
/**
 * 파일명: portal_bridg.php (오류 강제 출력 버전)
 * 기능: 500 에러 발생 시 원인을 화면에 표시하도록 설계
 */
header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

// 🚀 [DEBUG] 서버 에러를 JSON으로 잡기 위해 설정
ini_set('display_errors', 0);
error_reporting(E_ALL);

define('KKF_PORTAL', true);

try {
    $current_dir = dirname(__FILE__);
    $logic_file = $current_dir . '/handlers/member_portal_logic.php';

    if (file_exists($logic_file)) {
        require_once $logic_file;
    } else {
        throw new Exception("로직 파일을 찾을 수 없습니다: " . $logic_file);
    }

    $raw_input = file_get_contents('php://input');
    
    // 🔍 [ROOT GATEWAY LOG] 무조건 생성되는 로그
    $log_data = "\n--- [" . date('Y-m-d H:i:s') . "] ---\n" . "RAW GATEWAY: " . $raw_input . "\n";
    file_put_contents(dirname(__FILE__) . '/debug_gateway.txt', $log_data, FILE_APPEND);

    $input = json_decode($raw_input, true);
    if (!$input) $input = array_merge($_GET, $_POST);

    $mode = trim($input['mode'] ?? '');
    $output = ['success' => false, 'error' => '올바르지 않은 요청입니다.'];

    if ($mode === 'portal_login') {
        $output = kkf_portal_handle_login($input);
    } else if ($mode === 'portal_get_my_data') {
        $output = kkf_portal_get_my_data($input);
    } else if ($mode === 'portal_apply_membership') {
        $output = kkf_portal_apply_membership($input);
    } else if ($mode === 'portal_check_id') {
        $output = kkf_portal_check_id($input);
    } else if ($mode === 'portal_register') {
        $output = kkf_portal_register($input);
    } else if ($mode === 'portal_delete_membership_applications') {
        $output = kkf_portal_delete_membership_applications($input);
    } else if ($mode === 'portal_membership_applications_list') {
        $output = kkf_portal_membership_applications_list($input);
    } else if ($mode === 'portal_membership_application_action') {
        $output = kkf_portal_membership_application_action($input);
    } else if ($mode === 'portal_update_my_data') {
        $output = kkf_portal_update_my_data($input);
    } else {
        $output['error'] = '모드 없음: ' . $mode;
    }

    // 🪞 [MIRROR DEBUG] 서버가 받은 원본 데이터를 응답에 그대로 포함하여 반송
    $output['DEBUG_PAYLOAD'] = $input;

} catch (Throwable $t) {
    $output = ['success' => false, 'error' => 'PHP Fatal Error: ' . $t->getMessage()];
}

// JSON 출력 안정화
$json = json_encode($output, JSON_UNESCAPED_UNICODE);
if (!$json) {
    array_walk_recursive($output, function(&$i) { if(is_string($i)) $i = mb_convert_encoding($i, 'UTF-8', 'EUC-KR, CP949'); });
    $json = json_encode($output, JSON_UNESCAPED_UNICODE);
}
header('Content-Type: application/json; charset=utf-8');
echo $json;
exit;
