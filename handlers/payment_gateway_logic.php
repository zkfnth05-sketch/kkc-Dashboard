<?php
/**
 * 파일명: handlers/payment_gateway_logic.php
 * 기능: KG모빌리언스(MobilPay) 결제 거래 등록 처리
 */

if (!defined('ABSPATH')) exit;

define('MOBILIANS_CARD_SID', '201203095040');
define('MOBILIANS_CARD_SKEY', '82ab74fcd82f64c306eb9f74ad319859');

function kkc_pg_register($input) {
    global $wpdb;

    $type = $input['type'] ?? '';
    $data = $input['data'] ?? [];
    $amount = intval($data['amount'] ?? $data['total_amount'] ?? 0);

    if ($amount <= 0) {
        return ['success' => false, 'error' => '결제 금액은 0원보다 커야 합니다.'];
    }

    $time_stamp = date('YmdHis');
    
    // 고유 거래 ID 생성 (최대 40자)
    $prefix = ($type === 'membership') ? 'MEM_' : 'APP_';
    $trade_id = $prefix . uniqid() . '_' . time();
    if (strlen($trade_id) > 40) {
        $trade_id = substr($trade_id, 0, 40);
    }

    // 콜백 주소 정의 (도메인 변경 시에도 자동 적응하도록 동적 site_url() 적용)
    $base_domain = function_exists('site_url') ? site_url() : 'https://kkc3349.mycafe24.com';
    $base_domain = rtrim($base_domain, '/');
    $ok_url = $base_domain . '/payment_callback.php';
    $fail_url = $ok_url . '?status=fail';
    $close_url = $ok_url . '?status=cancel';

    // 무결성 검증을 위한 HMAC 생성 (amount + ok_url + trade_id + time_stamp)
    $message = $amount . $ok_url . $trade_id . $time_stamp;
    $hmac = base64_encode(hash_hmac('sha256', $message, MOBILIANS_CARD_SKEY, true));

    // 세션 대용으로 WordPress Transient에 임시 결제 정보 저장 (2시간 유효)
    set_transient('kkc_pay_' . $trade_id, [
        'type' => $type,
        'targetTable' => $input['targetTable'] ?? '',
        'data' => $data
    ], 2 * HOUR_IN_SECONDS);

    // 결제 상품명 정의
    $product_name = ($type === 'membership') ? '한국애견협회 정회원 승급/갱신' : ($input['title'] ?? $data['event_title'] ?? $data['title'] ?? '대회 참가 신청');
    $product_name = mb_strimwidth($product_name, 0, 45, '...', 'UTF-8');

    // 사용자 정보
    $user_name = $data['name'] ?? '';
    $user_email = $data['email'] ?? '';
    $user_id = $data['handler_id'] ?? '';

    // KG모빌리언스 거래등록 페이로드 구성
    $payload = [
        'sid' => MOBILIANS_CARD_SID,
        'cash_code' => 'CN', // CN = 신용카드
        'product_name' => $product_name,
        'amount' => [
            'total' => $amount,
            'tax' => 0,
            'tax_free' => 0,
            'supply_value' => 0
        ],
        'trade_id' => $trade_id,
        'site_url' => $base_domain,
        'ok_url' => $ok_url,
        'fail_url' => $fail_url,
        'close_url' => $close_url,
        'call_type' => 'P', // P = Popup 방식결제
        'hybrid_pay' => 'Y',
        'time_stamp' => $time_stamp,
        'hmac' => $hmac,
        'user_id' => $user_id,
        'user_name' => $user_name,
        'user_email' => $user_email
    ];

    // API 호출 (cURL)
    $api_url = 'https://mup.mobilians.co.kr/MUP/api/registration';
    $ch = curl_init($api_url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_UNICODE));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response_raw = curl_exec($ch);
    $curl_error = curl_error($ch);
    curl_close($ch);

    if ($response_raw === false) {
        return ['success' => false, 'error' => 'PG사 서버 연결 실패: ' . $curl_error];
    }

    $response = json_decode($response_raw, true);
    if (empty($response)) {
        return ['success' => false, 'error' => 'PG사 응답 해석 불가: ' . substr($response_raw, 0, 200)];
    }

    if (($response['code'] ?? '') !== '0000') {
        return ['success' => false, 'error' => '결제 요청 실패: ' . ($response['message'] ?? '알 수 없는 오류')];
    }

    return [
        'success' => true,
        'pay_url' => $response['pay_url'],
        'tid' => $response['tid'],
        'trade_id' => $trade_id
    ];
}
