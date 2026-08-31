<?php
/**
 * 파일명: handlers/nice_ipin_logic.php
 * 기능: NICE 통합인증 (아이핀 전용) API 요청, 결과 복호화 및 회원/비밀번호 매핑 기능 분리
 */
if (!defined('KKF_PORTAL')) exit;

/**
 * 📱 [Portal] NICE 아이핀 연동 설정
 */
if (!defined('NICE_CLIENT_ID')) define('NICE_CLIENT_ID', 'NI9690428a-4a82-4a5e-ae88-dccdb1602ef2');
if (!defined('NICE_CLIENT_SECRET')) define('NICE_CLIENT_SECRET', 'NWNlZTJiMGEtM2M4Yy00OTY3LTljNTctZTc4NDg2YTkyZjM5MUU4NkU5OTVDNjc4OUNFRjA0Qzg0REY0');

/**
 * 📱 [Portal] NICE 인증 URL 취득 (아이핀 svc_types => ['I'])
 */
function kkf_portal_get_nice_auth_url($input) {
    $client_id = defined('NICE_CLIENT_ID') ? NICE_CLIENT_ID : '';
    $client_secret = defined('NICE_CLIENT_SECRET') ? NICE_CLIENT_SECRET : '';
    
    $request_no = 'KKC_REQ_' . time() . mt_rand(1000, 9999);
    
    // 만약 NICE 인증 정보가 비어있다면 테스트용 Mock 모드로 동작하도록 유도
    if (empty($client_id) || empty($client_secret)) {
        $mock_web_tx = 'mock_tx_' . time() . mt_rand(1000, 9999);
        $mock_tran = 'mock_tran_' . time() . mt_rand(1000, 9999);
        
        $auth_url = 'https://kkc3349.mycafe24.com/portal_bridg.php?mode=nice_mock_popup&request_no=' . $request_no . '&transaction_id=' . $mock_tran . '&web_transaction_id=' . $mock_web_tx;
        
        return [
            'success' => true,
            'data' => [
                'auth_url' => $auth_url,
                'transaction_id' => $mock_tran,
                'request_no' => $request_no
            ]
        ];
    }
    
    try {
        // 1. NICE Access Token 발급 API 호출
        $token_url = "https://auth.niceid.co.kr/ido/intc/v1.0/auth/token";
        $auth_header = "Basic " . base64_encode($client_id . ":" . $client_secret);
        
        $ch = curl_init($token_url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'grant_type' => 'client_credentials',
            'request_no' => $request_no
        ]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: ' . $auth_header,
            'X-Intc-DevLang: Linux/PHP'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $res = curl_exec($ch);
        curl_close($ch);
        
        $token_res = json_decode($res, true);
        if (!$token_res || !isset($token_res['access_token'])) {
            return ['success' => false, 'error' => 'NICE 토큰 발급 실패: ' . ($token_res['result_message'] ?? $res)];
        }
        
        $access_token = $token_res['access_token'];
        $iterators = $token_res['iterators'];
        $ticket = $token_res['ticket'];
        
        // Decryption에 필요한 정보를 임시 저장 (10분)
        set_transient('nice_ticket_' . $request_no, json_encode([
            'ticket' => $ticket,
            'iterators' => $iterators,
            'access_token' => $access_token
        ]), 600);
        
        // 2. NICE 인증창 호출 URL 생성 API 호출
        $url_api = "https://auth.niceid.co.kr/ido/intc/v1.0/auth/url";
        
        // NICE 연동 후 돌아올 콜백 리턴 URL
        $return_url = "https://kkc3349.mycafe24.com/portal_bridg.php?mode=nice_callback"
                    . "&req_no=" . urlencode($request_no);
        
        $svc_types = (isset($input['svc_types']) && is_array($input['svc_types']) && !empty($input['svc_types']))
            ? $input['svc_types']
            : ['I']; // 아이핀 전용 (NICE 계약 Scope)

        $ch = curl_init($url_api);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'request_no' => $request_no,
            'return_url' => $return_url,
            'svc_types' => $svc_types,
            'method_type' => 'GET',
            'exp_mods' => ['closeButtonOn']
        ]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $access_token,
            'X-Intc-DevLang: Linux/PHP'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $url_res_raw = curl_exec($ch);
        curl_close($ch);
        
        $url_res = json_decode($url_res_raw, true);
        if (!$url_res || !isset($url_res['auth_url'])) {
            return ['success' => false, 'error' => 'NICE 인증 URL 요청 실패: ' . ($url_res['result_message'] ?? $url_res_raw)];
        }
        
        set_transient('nice_tran_' . $request_no, $url_res['transaction_id'], 600);
        
        return [
            'success' => true,
            'data' => [
                'auth_url' => $url_res['auth_url'],
                'transaction_id' => $url_res['transaction_id'],
                'request_no' => $request_no
            ]
        ];
        
    } catch (Throwable $e) {
        return ['success' => false, 'error' => 'NICE 인증 요청 오류: ' . $e->getMessage()];
    }
}

/**
 * 📱 [Portal] NICE 아이핀 인증 성공 후 리다이렉트 콜백 처리
 */
function kkf_portal_handle_nice_callback($input) {
    $web_tx = trim($input['web_transaction_id'] ?? '');
    $req_no = trim($input['req_no'] ?? '');
    
    if (empty($web_tx) || empty($req_no)) {
        echo "<h3>오류: 유효하지 않은 인증 세션입니다.</h3>";
        exit;
    }
    
    // Mock 모드 확인 및 처리
    if (strpos($web_tx, 'mock_tx_') === 0) {
        $mock_user_data = [
            'name' => '홍길동(아이핀테스트)',
            'birthdate' => '19900101',
            'gender' => '1',
            'national_info' => '0',
            'mobile_no' => '01012345678',
            'ci' => 'mock_ci_value_1234567890',
            'di' => 'mock_di_value_1234567890'
        ];
        set_transient('nice_verified_' . $web_tx, json_encode($mock_user_data), 600);
        
        echo "
        <!DOCTYPE html>
        <html>
        <head><title>NICE 본인인증 완료</title></head>
        <body>
        <p>인증 성공! 창을 닫는 중...</p>
        <script>
            if (window.opener) {
                window.opener.postMessage({
                    type: 'NICE_AUTH_SUCCESS',
                    web_transaction_id: " . json_encode($web_tx) . "
                }, '*');
            }
            window.close();
        </script>
        </body>
        </html>
        ";
        exit;
    }
    
    $client_id = defined('NICE_CLIENT_ID') ? NICE_CLIENT_ID : '';
    $client_secret = defined('NICE_CLIENT_SECRET') ? NICE_CLIENT_SECRET : '';
    
    $ticket_data = json_decode(get_transient('nice_ticket_' . $req_no), true);
    $transaction_id = get_transient('nice_tran_' . $req_no);
    
    if (!$ticket_data || !$transaction_id) {
        echo "<h3>오류: 만료된 인증 세션이거나 필수 키가 누락되었습니다.</h3>";
        exit;
    }
    
    try {
        $access_token = $ticket_data['access_token'];
        $ticket = $ticket_data['ticket'];
        $iterators = $ticket_data['iterators'];
        
        // 3. NICE 결과 요청 API 호출
        $result_url = "https://auth.niceid.co.kr/ido/intc/v1.0/auth/result";
        
        $ch = curl_init($result_url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'web_transaction_id' => $web_tx,
            'transaction_id' => $transaction_id,
            'request_no' => $req_no
        ]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $access_token,
            'X-Intc-DevLang: Linux/PHP'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        $res_raw = curl_exec($ch);
        curl_close($ch);
        
        $res = json_decode($res_raw, true);
        if (!$res || $res['result_code'] !== '0000') {
            echo "<h3>NICE 인증결과 조회 실패: " . htmlspecialchars($res['result_message'] ?? $res_raw) . "</h3>";
            exit;
        }
        
        $enc_data = $res['enc_data'];
        $integrity_value = $res['integrity_value'];
        
        // 4. 복호화 키 유도 (PBKDF2 - NICE OpenAPI 3.1 규격)
        $keyString = nice_get_key_value($ticket, $transaction_id, intval($iterators));
        $symmetric_key = substr($keyString, 0, 32);
        $hmac_key = substr($keyString, 48, 32);
        
        // 5. HMAC 무결성 검증 (NICE OpenAPI 3.2 규격)
        $my_hmac = nice_get_sha256_mac_base64_value($enc_data, $hmac_key);
        
        if ($my_hmac !== $integrity_value) {
            echo "<h3>무결성 검증 실패 (HMAC 불일치)</h3>";
            exit;
        }
        
        // 6. AES-256-GCM 복호화 진행 (NICE OpenAPI 3.3 규격)
        $decrypted = nice_aes_gcm_dec($enc_data, $symmetric_key);
        
        if ($decrypted === false) {
            echo "<h3>데이터 복호화 실패</h3>";
            exit;
        }
        
        set_transient('nice_verified_' . $web_tx, $decrypted, 600);
        
        echo "
        <!DOCTYPE html>
        <html>
        <head><title>NICE 본인인증 완료</title></head>
        <body>
        <p>인증 성공! 창을 닫는 중...</p>
        <script>
            if (window.opener) {
                window.opener.postMessage({
                    type: 'NICE_AUTH_SUCCESS',
                    web_transaction_id: " . json_encode($web_tx) . "
                }, '*');
            }
            window.close();
        </script>
        </body>
        </html>
        ";
        exit;
        
    } catch (Throwable $e) {
        echo "<h3>오류 발생: " . htmlspecialchars($e->getMessage()) . "</h3>";
        exit;
    }
}

/**
 * 📱 [Portal] NICE 아이핀 모의 테스트 팝업창 렌더링
 */
function kkf_portal_render_nice_mock_popup($input) {
    $req_no = htmlspecialchars($input['request_no'] ?? '');
    $web_tx = htmlspecialchars($input['web_transaction_id'] ?? '');
    
    $callback_url = "https://kkc3349.mycafe24.com/portal_bridg.php?mode=nice_callback"
                  . "&req_no=" . urlencode($req_no)
                  . "&web_transaction_id=" . urlencode($web_tx);
                  
    echo "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='utf-8'>
        <title>NICE 아이핀 인증 (테스트 모드)</title>
        <meta name='viewport' content='width=device-width, initial-scale=1'>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f1f5f9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 32px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); width: 100%; max-width: 360px; text-align: center; }
            h2 { color: #1e293b; margin-top: 0; font-size: 20px; font-weight: 800; }
            p { color: #64748b; font-size: 14px; line-height: 1.5; margin-bottom: 24px; }
            .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: left; font-size: 13px; color: #334155; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .info-row:last-child { margin-bottom: 0; }
            .info-label { font-weight: bold; color: #64748b; }
            button { width: 100%; background: #2563eb; color: white; border: none; padding: 14px; border-radius: 12px; font-weight: bold; font-size: 15px; cursor: pointer; transition: background 0.2s; }
            button:hover { background: #1d4ed8; }
        </style>
    </head>
    <body>
        <div class='card'>
            <h2>NICE 아이핀 본인인증</h2>
            <p>이 화면은 NICE 아이핀 인증의 테스트 화면입니다. [인증 완료] 버튼을 누르면 부모 창으로 인증 결과가 전달됩니다.</p>
            <div class='info-box'>
                <div class='info-row'>
                    <span class='info-label'>테스트 이름</span>
                    <span>홍길동(아이핀테스트)</span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>생년월일</span>
                    <span>1990년 01월 01일</span>
                </div>
                <div class='info-row'>
                    <span class='info-label'>인증수단</span>
                    <span>아이핀(i-PIN)</span>
                </div>
            </div>
            <button onclick=\"location.href='" . $callback_url . "'\">인증 완료하기</button>
        </div>
    </body>
    </html>
    ";
    exit;
}

/**
 * 📱 [Portal] 회원가입용 복호화 데이터 취득 및 회원가입 SMS 우회용 키 세팅
 */
function kkf_portal_nice_get_verified_data($input) {
    $web_tx = trim($input['web_transaction_id'] ?? '');
    $hp = trim($input['hp'] ?? '');
    
    if (empty($web_tx)) {
        return ['success' => false, 'error' => '트랜잭션 ID가 누락되었습니다.'];
    }
    
    $data_raw = get_transient('nice_verified_' . $web_tx);
    if (!$data_raw) {
        return ['success' => false, 'error' => '인증 데이터를 찾을 수 없거나 만료되었습니다.'];
    }
    
    $data = json_decode($data_raw, true);
    
    // 아이핀 정보가 매칭되면, 회원가입 시 backend에서 검증하는 SMS transient 우회용 키를 생성
    $phone_to_verify = !empty($data['mobile_no']) ? $data['mobile_no'] : $hp;
    if (!empty($phone_to_verify)) {
        $hp_clean = str_replace('-', '', $phone_to_verify);
        set_transient('kkf_sms_verified_' . $hp_clean, 'Y', 600);
    }
    
    delete_transient('nice_verified_' . $web_tx);
    
    return [
        'success' => true,
        'data' => $data
    ];
}

/**
 * 📱 [Portal] 비밀번호 찾기용 아이핀 검증 처리 및 비밀번호 재설정 우회용 키 세팅
 */
function kkf_portal_nice_find_pw_verify($input) {
    $web_tx = trim($input['web_transaction_id'] ?? '');
    if (empty($web_tx)) return ['success' => false, 'error' => '트랜잭션 ID가 누락되었습니다.'];
    
    $data_raw = get_transient('nice_verified_' . $web_tx);
    if (!$data_raw) {
        return ['success' => false, 'error' => '인증 데이터를 찾을 수 없거나 만료되었습니다.'];
    }
    
    $data = json_decode($data_raw, true);
    delete_transient('nice_verified_' . $web_tx);
    
    $name = trim($data['name'] ?? '');
    $birth = trim($data['birthdate'] ?? '');
    
    if (empty($name) || empty($birth)) {
        return ['success' => false, 'error' => 'NICE 인증 정보에 이름 또는 생년월일이 누락되었습니다.'];
    }
    
    $conn = get_kkc_portal_db();
    
    $e_name = $conn->real_escape_string(kkc_convert($name, 'EUC-KR', false));
    $birth_6 = (strlen($birth) >= 8) ? substr($birth, 2) : $birth; // YYMMDD
    $e_birth_6 = $conn->real_escape_string($birth_6);
    $e_birth_full = $conn->real_escape_string($birth);
    
    $conn->query("SET NAMES 'binary'");
    $res = $conn->query("SELECT * FROM memTab WHERE name = '$e_name' AND (birth = '$e_birth_6' OR birth = '$e_birth_full') LIMIT 1");
    $u_raw = $res ? $res->fetch_assoc() : null;
    
    if ($u_raw) {
        // 🛡️ [핵심] 비밀번호 재설정 시 본인인증된 CI/DI를 memTab에 영구 저장 (관리자 페이지 및 포털 즉시 연동)
        $e_ci = $conn->real_escape_string($data['ci'] ?? '');
        $e_di = $conn->real_escape_string($data['di'] ?? '');
        $u_mid = intval($u_raw['mid']);
        if (!empty($e_ci) && $u_mid > 0) {
            $conn->query("UPDATE memTab SET nice_ci = '$e_ci', nice_di = '$e_di', nice_verified_at = NOW() WHERE mid = $u_mid");
        }
    }
    $conn->close();
    
    if (!$u_raw) {
        return ['success' => false, 'error' => '인증된 정보(이름, 생년월일)와 일치하는 회원을 찾을 수 없습니다.'];
    }
    
    $u = kkc_convert($u_raw, 'EUC-KR', true);
    
    // 비밀번호 실제 변경 시 backend의 검사 조건을 충족하기 위해 reset transient 등록
    $hp_clean = str_replace('-', '', $u['hp'] ?? '');
    if (!empty($hp_clean)) {
        set_transient('kkf_sms_reset_verified_' . $hp_clean, 'Y', 600);
    }
    
    return [
        'success' => true,
        'id' => $u['id'],
        'hp' => $u['hp'],
        'name' => $u['name'],
        'birth' => $u['birth']
    ];
}

// 📱 별칭 호환성 유지
function kkf_portal_find_pw_nice_verify($input) {
    return kkf_portal_nice_find_pw_verify($input);
}


/**
 * 🔑 NICE 통합인증 키 유도 함수 (NICE OpenAPI 3.1 공식 PHP 규격)
 */
function nice_get_key_value(string $ticket, string $transaction_id, int $iterators): string {
    try {
        $key = hash_pbkdf2(
            'sha256',
            $ticket,
            $transaction_id,
            $iterators,
            64,
            true
        );
        return rtrim(strtr(base64_encode($key), '+/', '-_'), '=');
    } catch (Exception $e) {
        error_log("nice_get_key_value Error: " . $e->getMessage());
        return '';
    }
}

/**
 * 🛡️ NICE 통합인증 HMAC 무결성 검증 함수 (NICE OpenAPI 3.2 공식 PHP 규격)
 */
function nice_get_sha256_mac_base64_value($value, $hmacKey) {
    try {
        $hashValue = hash_hmac('sha256', $value, $hmacKey, true);
        $base64Value = base64_encode($hashValue);
        $urlSafeBase64 = strtr($base64Value, '+/', '-_');
        return rtrim($urlSafeBase64, '=');
    } catch (Exception $e) {
        error_log("nice_get_sha256_mac_base64_value Error: " . $e->getMessage());
        return null;
    }
}

/**
 * 🔓 NICE 통합인증 AES-256-GCM 복호화 함수 (NICE OpenAPI 3.3 공식 PHP 규격)
 */
function nice_aes_gcm_dec(string $enc_data, string $Key) {
    $cipherEnc = base64_decode(strtr($enc_data, '-_', '+/'));
    $iv = substr($cipherEnc, 0, 16);
    $cipherAndTag = substr($cipherEnc, 16);
    $cipherLen = strlen($cipherAndTag) - 16;
    $cipherText = substr($cipherAndTag, 0, $cipherLen);
    $tag        = substr($cipherAndTag, $cipherLen, 16);
    return openssl_decrypt(
        $cipherText,
        'aes-256-gcm',
        $Key,
        OPENSSL_RAW_DATA,
        $iv,
        $tag
    );
}
