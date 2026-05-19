<?php
/**
 * 파일명: payment_callback.php
 * 기능: KG모빌리언스 결제 인증/승인 콜백 수신 및 DB 동기화
 */

header('Access-Control-Allow-Origin: *'); 
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

// 🚀 1. 워드프레스 코어 로드
$current_dir = dirname(__FILE__);
$wp_load = $current_dir . '/wp-load.php';
if (file_exists($wp_load)) {
    require_once($wp_load);
} else {
    die("워드프레스 로드 실패");
}

define('MOBILIANS_CARD_SID', '201203095040');
define('MOBILIANS_CARD_SKEY', '82ab74fcd82f64c306eb9f74ad319859');

function kkc_show_parent_message($status, $message, $type = '') {
    header('Content-Type: text/html; charset=utf-8');
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title>결제 완료</title>
        <script>
            try {
                if (window.opener) {
                    window.opener.postMessage({
                        status: '<?php echo esc_js($status); ?>',
                        message: '<?php echo esc_js($message); ?>',
                        type: '<?php echo esc_js($type); ?>'
                    }, '*');
                }
            } catch (e) {
                console.error("Parent communication error", e);
            }
            window.close();
        </script>
    </head>
    <body style="background: #F8FAFB; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
        <div style="padding: 40px; text-align: center; font-family: sans-serif; background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); max-width: 320px; width: 100%;">
            <div style="font-size: 16px; font-weight: bold; color: #334155; margin-bottom: 10px;">
                <?php echo esc_html($message); ?>
            </div>
            <div style="font-size: 13px; color: #94A3B8;">이 창은 자동으로 닫힙니다.</div>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// 🚀 2. 취소 또는 실패 시 예외 처리
$status = $_GET['status'] ?? '';
if ($status === 'fail' || $status === 'cancel') {
    kkc_show_parent_message('fail', '결제가 중단되었거나 취소되었습니다.');
}

// 🚀 3. POST 파라미터 수신 및 EUC-KR -> UTF-8 변환
$code = $_POST['code'] ?? '';
$message_raw = $_POST['message'] ?? '결제 오류';
$message = mb_convert_encoding($message_raw, 'UTF-8', 'CP949');
$sid = $_POST['sid'] ?? '';
$tid = $_POST['tid'] ?? '';
$trade_id = $_POST['trade_id'] ?? '';
$pay_token = $_POST['pay_token'] ?? '';
$amount = $_POST['amount'] ?? '';

if ($code !== '0000') {
    kkc_show_parent_message('fail', '결제 인증 실패: ' . $message);
}

// 🚀 4. 최종 결제 승인 요청 (API 4.6 호출)
$approval_url = 'https://mup.mobilians.co.kr/MUP/api/approval';
$payload = [
    'sid' => MOBILIANS_CARD_SID,
    'tid' => $tid,
    'cash_code' => 'CN',
    'pay_token' => $pay_token,
    'amount' => $amount
];

$ch = curl_init($approval_url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response_raw = curl_exec($ch);
curl_close($ch);

$response = json_decode($response_raw, true);
if (empty($response) || ($response['code'] ?? '') !== '0000') {
    $err_msg = $response['message'] ?? '승인 처리 실패';
    $err_msg_utf8 = mb_convert_encoding($err_msg, 'UTF-8', 'CP949, UTF-8');
    kkc_show_parent_message('fail', '결제 승인 오류: ' . $err_msg_utf8);
}

// 🚀 5. DB 동기화 및 트랜잭션 완료 처리
global $wpdb;
$pay_data = get_transient('kkc_pay_' . $trade_id);

if (!$pay_data) {
    kkc_show_parent_message('fail', '임시 결제 세션 정보를 찾을 수 없습니다. (만료됨)');
}

$type = $pay_data['type'];
$data = $pay_data['data'];

if ($type === 'membership') {
    // 🏅 정회원 승급/갱신 처리
    $mid = intval($data['mid']);
    $req_degree = $data['req_degree'];
    $req_years = intval($data['req_years'] ?? 1);
    
    // 유효기간 계산
    $new_end_date = ($req_years === 99) ? '2099-12-31' : date('Y-m-d', strtotime("+$req_years years"));
    
    // memTab 정보 즉시 반영 (EUC-KR 변환 불필요, EndDate/Degree는 바이너리/영어 영역)
    $wpdb->query("SET NAMES 'binary'");
    $wpdb->update('memTab', [
        'mem_degree' => $req_degree,
        'end_date' => $new_end_date
    ], ['mid' => $mid]);
    
    // membership_applications 내역 저장 (UTF-8)
    $wpdb->query("SET NAMES 'utf8'");
    $wpdb->insert('membership_applications', [
        'mid' => $mid,
        'mem_no' => $data['mem_no'] ?? '',
        'name' => $data['name'] ?? '',
        'req_degree' => $req_degree,
        'req_years' => $req_years,
        'amount' => intval($amount),
        'depositor' => $data['depositor'] ?? '',
        'status' => 'Y', // 승인 완료
        'apply_date' => time(),
        'process_date' => time(),
        'admin_memo' => '신용카드 결제 즉시 자동 승인'
    ]);
} 
else if ($type === 'applicant') {
    // 🏆 대회/세미나 신청서 처리
    $targetTable = $pay_data['targetTable'];
    $data['payment_status'] = '입금완료'; // 카드 결제이므로 즉시 입금 완료
    $data['total_amount'] = intval($amount);
    
    // WAF 우회 및 인코딩 통일
    $wpdb->query("SET NAMES 'utf8'");
    
    // DB 데이터 삽입
    $wpdb->insert($targetTable, $data);
}

// 🚀 6. 세션(Transient) 파기 및 성공 알림
delete_transient('kkc_pay_' . $trade_id);
kkc_show_parent_message('success', '결제가 성공적으로 완료되었습니다.', $type);
