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
    $ipin_file = $current_dir . '/handlers/nice_ipin_logic.php';

    if (file_exists($logic_file)) {
        require_once $logic_file;
    } else {
        throw new Exception("로직 파일을 찾을 수 없습니다: " . $logic_file);
    }

    if (file_exists($ipin_file)) {
        require_once $ipin_file;
    }

    $raw_input = file_get_contents('php://input');
    
    // 🔍 [ROOT GATEWAY LOG] 무조건 생성되는 로그
    $log_data = "\n--- [" . date('Y-m-d H:i:s') . "] ---\n" . "RAW GATEWAY: " . $raw_input . "\n";
    file_put_contents(dirname(__FILE__) . '/debug_gateway.txt', $log_data, FILE_APPEND);

    $input = json_decode($raw_input, true);
    if (!$input) $input = array_merge($_GET, $_POST);

    $mode = trim($input['mode'] ?? '');

    // 📱 NICE i-PIN HTML 팝업 / 콜백 처리 (JSON 대신 HTML 출력 후 종료)
    if ($mode === 'nice_callback') {
        kkf_portal_handle_nice_callback($input);
    } else if ($mode === 'nice_mock_popup') {
        kkf_portal_render_nice_mock_popup($input);
    }

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
    } else if ($mode === 'portal_send_sms_verification') {
        $output = kkf_portal_send_sms_verification($input);
    } else if ($mode === 'portal_verify_sms_code') {
        $output = kkf_portal_verify_sms_code($input);
    } else if ($mode === 'portal_find_pw_send_sms') {
        $output = kkf_portal_find_pw_send_sms($input);
    } else if ($mode === 'portal_find_pw_verify_sms') {
        $output = kkf_portal_find_pw_verify_sms($input);
    } else if ($mode === 'portal_find_pw_reset') {
        $output = kkf_portal_find_pw_reset($input);
    } else if ($mode === 'portal_get_nice_auth_url') {
        $output = kkf_portal_get_nice_auth_url($input);
    } else if ($mode === 'portal_nice_get_verified_data') {
        $output = kkf_portal_nice_get_verified_data($input);
    } else if ($mode === 'portal_nice_find_pw_verify') {
        if (function_exists('kkf_portal_nice_find_pw_verify')) {
            $output = kkf_portal_nice_find_pw_verify($input);
        } else if (function_exists('kkf_portal_find_pw_nice_verify')) {
            $output = kkf_portal_find_pw_nice_verify($input);
        } else {
            $output = ['success' => false, 'error' => '아이핀 검증 핸들러 함수를 찾을 수 없습니다.'];
        }
    } else if ($mode === 'admin_nice_member_list') {
        $conn = get_kkc_portal_db();
        $page = max(1, intval($input['page'] ?? 1));
        $limit = intval($input['limit'] ?? 50);
        $offset = ($page - 1) * $limit;
        $where = "nice_ci IS NOT NULL AND nice_ci != ''";
        $search = trim($input['search'] ?? '');
        if ($search !== '') {
            $e_search = $conn->real_escape_string(kkc_convert($search, 'EUC-KR', false));
            $field = $input['field'] ?? 'all';
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
                
                // 🐕 소유견의 등록번호 조회
                $m_id = $conn->real_escape_string($row['id']);
                $m_mid = $conn->real_escape_string($row['mid']);
                $dog_reg_nos = [];
                if (!empty($m_id) || !empty($m_mid)) {
                    $dog_sql = "SELECT reg_no FROM nice_dogTab WHERE poss_id = '$m_id' OR poss_id = '$m_mid' ORDER BY uid DESC";
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
        $output = ['success' => true, 'data' => $list, 'total' => $total];
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
