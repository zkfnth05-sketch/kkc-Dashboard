<?php
/**
 * nice_diag.php
 * NICE API 연동 독립 진단 스크립트 (WordPress 의존성 전혀 없음)
 * 사용법: https://kkc3349.mycafe24.com/nice_diag.php?pw=kkc1234
 */

// ─────────────────────────────────────────────
// 0. 접근 보호
// ─────────────────────────────────────────────
$PASS = 'kkc1234';
if (($_GET['pw'] ?? '') !== $PASS) {
    http_response_code(403);
    die('접근 불가. ?pw=kkc1234 로 접속하세요.');
}

error_reporting(E_ALL);
ini_set('display_errors', '1');
header('Content-Type: text/html; charset=utf-8');

// ─────────────────────────────────────────────
// 1. NICE UAT 접속 정보
// ─────────────────────────────────────────────
$HOST       = 'https://usvc.niceapi.co.kr:32501';
$AES_KEY    = '12345678123456781234567812345678';
$AES_IV     = '1234567812345678';
$HMAC_KEY   = '12345678123456781234567812345678';
$CLIENT_ID  = '369a3882-32bb-4a65-8376-2357619517c9';
$CLIENT_SEC = '949c318d591d34ee19b2495302314776883cf39';
$KEY_VER    = '0001';

$test = $_GET['test'] ?? 'ping';
$pw   = $PASS;

echo '<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>NICE API 진단</title><style>
body{font-family:monospace;background:#1a1a2e;color:#eee;padding:20px}
h1{color:#00d4ff}h2{color:#ffd700;margin-top:30px}
pre{background:#0f0f1a;border:1px solid #333;padding:15px;border-radius:8px;overflow-x:auto;white-space:pre-wrap}
.ok{color:#00ff88;font-weight:bold}.err{color:#ff4466;font-weight:bold}
.btn{display:inline-block;margin:5px;padding:10px 20px;background:#007bff;color:#fff;text-decoration:none;border-radius:6px}
table{border-collapse:collapse;width:100%}th,td{border:1px solid #444;padding:8px 12px;text-align:left}
th{background:#2a2a4a;color:#00d4ff}tr:nth-child(even){background:#1e1e3a}
</style></head><body>';

echo "<h1>NICE API 연동 진단</h1>";
echo "<p>환경: <strong>UAT</strong> | 서버: <code>{$HOST}</code></p>";
echo "<p>
  <a class='btn' href='?pw={$pw}&test=ping'>PHP 환경 확인</a>
  <a class='btn' href='?pw={$pw}&test=api004_approve'>API 004 승인 테스트</a>
  <a class='btn' href='?pw={$pw}&test=api004_reject'>API 004 반려 테스트</a>
  <a class='btn' href='?pw={$pw}&test=api005'>API 005 소유권이전 테스트</a>
</p><hr>";

// ─────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────
function nice_enc($plain, $key, $iv) {
    return base64_encode(openssl_encrypt($plain, 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv));
}
function nice_dec($enc, $key, $iv) {
    return openssl_decrypt(base64_decode($enc), 'aes-256-cbc', $key, OPENSSL_RAW_DATA, $iv);
}

function nice_call($host, $uri, $pid, $plain, $aes_key, $aes_iv, $hmac_key, $cid, $csec, $kver) {
    $json     = json_encode($plain, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $enc      = nice_enc($json, $aes_key, $aes_iv);
    $dttm     = date('YmdHis');
    $sign     = trim($kver) . trim($dttm) . trim($enc);
    $hmac     = base64_encode(hash_hmac('sha256', $sign, $hmac_key, true));

    $body = json_encode(['enc_key_version'=>$kver,'req_dttm'=>$dttm,'enc_data'=>$enc,'req_hmac'=>$hmac],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $auth = base64_encode($cid . ':' . $csec);

    $ch = curl_init($host . $uri);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Authorization: Basic '.$auth, 'ProductID: '.$pid]);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

    $hdrs = [];
    curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($c, $h) use (&$hdrs) {
        $len = strlen($h); $p = explode(':', $h, 2);
        if (count($p) === 2) $hdrs[strtolower(trim($p[0]))] = trim($p[1]);
        return $len;
    });

    $resp = curl_exec($ch);
    $cerr = curl_error($ch);
    $hcd  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $dec = null; $hmac_ok = null;
    $rj  = json_decode($resp, true);
    if ($rj && !empty($rj['enc_data'])) {
        $re  = $rj['enc_data'];
        $rh  = $rj['res_hmac'] ?? '';
        $vs  = trim($kver) . trim($dttm) . trim($re);
        $exh = base64_encode(hash_hmac('sha256', $vs, $hmac_key, true));
        $hmac_ok = ($rh === $exh);
        $dec = nice_dec($re, $aes_key, $aes_iv);
    }

    return ['url'=>$host.$uri,'req_plain'=>$json,'req_dttm'=>$dttm,'http_cd'=>$hcd,
            'curl_err'=>$cerr,'res_headers'=>$hdrs,'res_raw'=>$resp,'hmac_ok'=>$hmac_ok,'dec_plain'=>$dec];
}

function show_result($r) {
    $ok  = ($r['http_cd'] === 200 && empty($r['curl_err']));
    $cls = $ok ? 'ok' : 'err';
    $gw  = $r['res_headers']['gw_rslt_cd'] ?? '(없음)';

    echo "<h2>전송 결과</h2><table>";
    echo "<tr><th>항목</th><th>값</th></tr>";
    echo "<tr><td>요청 URL</td><td><code>{$r['url']}</code></td></tr>";
    echo "<tr><td>req_dttm</td><td>{$r['req_dttm']}</td></tr>";
    echo "<tr><td>HTTP 코드</td><td class='{$cls}'><strong>{$r['http_cd']}</strong></td></tr>";
    echo "<tr><td>GW_RSLT_CD</td><td><strong>{$gw}</strong></td></tr>";
    $ce = empty($r['curl_err']) ? '<span class="ok">없음</span>' : "<span class='err'>{$r['curl_err']}</span>";
    echo "<tr><td>cURL 에러</td><td>{$ce}</td></tr>";

    if ($r['hmac_ok'] !== null) {
        $h = $r['hmac_ok'] ? '<span class="ok">HMAC 일치</span>' : '<span class="err">HMAC 불일치</span>';
        echo "<tr><td>응답 HMAC</td><td>{$h}</td></tr>";
    }

    if ($r['dec_plain']) {
        $da = json_decode($r['dec_plain'], true);
        $rc = $da['result_cd'] ?? '?';
        $rc_cls = ($rc === 'S000') ? 'ok' : 'err';
        echo "<tr><td>result_cd</td><td class='{$rc_cls}'><strong>{$rc}</strong></td></tr>";
    }
    echo "</table>";

    echo "<h2>전송한 평문 JSON</h2><pre>" . htmlspecialchars($r['req_plain']) . "</pre>";

    if ($r['dec_plain']) {
        $pretty = json_encode(json_decode($r['dec_plain'], true), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        echo "<h2>복호화된 응답</h2><pre>" . htmlspecialchars($pretty) . "</pre>";
    } else {
        echo "<h2>원본 응답 (복호화 불가)</h2><pre>" . htmlspecialchars($r['res_raw']) . "</pre>";
    }
}

// ─────────────────────────────────────────────
// PHP 환경 확인
// ─────────────────────────────────────────────
if ($test === 'ping') {
    echo "<h2>PHP 환경 확인</h2><table><tr><th>항목</th><th>값</th></tr>";
    echo "<tr><td>PHP 버전</td><td>" . PHP_VERSION . "</td></tr>";
    echo "<tr><td>OpenSSL</td><td>" . (function_exists('openssl_encrypt') ? '<span class="ok">사용 가능</span>' : '<span class="err">없음</span>') . "</td></tr>";
    echo "<tr><td>cURL</td><td>" . (function_exists('curl_init') ? '<span class="ok">사용 가능</span>' : '<span class="err">없음</span>') . "</td></tr>";
    echo "<tr><td>hash_hmac</td><td>" . (function_exists('hash_hmac') ? '<span class="ok">사용 가능</span>' : '<span class="err">없음</span>') . "</td></tr>";
    echo "<tr><td>AES-256-CBC</td><td>" . (in_array('aes-256-cbc', openssl_get_cipher_methods()) ? '<span class="ok">지원</span>' : '<span class="err">미지원</span>') . "</td></tr>";
    
    // 진짜 아웃바운드 IP 탐지
    $ip_ch = curl_init('https://api.ipify.org');
    curl_setopt($ip_ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ip_ch, CURLOPT_TIMEOUT, 5);
    $outbound_ip = curl_exec($ip_ch);
    curl_close($ip_ch);
    $outbound_ip = $outbound_ip ? trim($outbound_ip) : '확인 실패';
    
    echo "<tr><td>서버 실제 아웃바운드 IP</td><td><strong style='color:#ffd700; font-size:16px;'>{$outbound_ip}</strong> (NICE에 이 IP가 등록되어야 합니다)</td></tr>";
    
    echo "<tr><td>NICE UAT 연결</td><td>";
    $ch = curl_init($HOST); curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10); curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); curl_setopt($ch, CURLOPT_NOBODY, true);
    curl_exec($ch); $cerr = curl_error($ch); $hcd = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    echo empty($cerr) ? "<span class='ok'>연결됨 (HTTP {$hcd})</span>" : "<span class='err'>연결 실패: {$cerr}</span>";
    echo "</td></tr></table>";
}

// ─────────────────────────────────────────────
// API 004 승인
// ─────────────────────────────────────────────
if ($test === 'api004_approve') {
    echo "<h2>API 004 — 승인(S) 통보 테스트</h2>";
    $plain = [
        'poss_ci'=>'TESTCI88XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        'order_no'=>'TEST-ORDER-'.date('YmdHis'), 'reg_result'=>'S', 'reg_no'=>'KSZ-C65001-NP',
        'name'=>'테스트견', 'saho'=>'TEST-SAHO-001', 'dog_classTab_name'=>'진돗개',
        'micro'=>'900000000000001', 'sex'=>'수', 'hair'=>'황',
        'breed_name'=>'테스트견사', 'breed_addr'=>'서울시 강남구 테스트로 1',
        'poss_name'=>'홍길동', 'poss_addr'=>'서울시 강남구 테헤란로 1',
        'birth'=>'2023-01-01', 'reg_date'=>date('Y-m-d'),
        'birth_m'=>3, 'birth_f'=>3, 'reg_count_m'=>1, 'reg_count_f'=>0,
        'father_name'=>'부견테스트', 'father_reg_no'=>'KSZ-C64001-NP', 'father_saho'=>'FA-001',
        'mother_name'=>'모견테스트', 'mother_reg_no'=>'KSZ-C64002-NP', 'mother_saho'=>'MO-001',
        'ancestors'=>[]
    ];
    show_result(nice_call($HOST, '/api/v1.0/pet/pedigree/result', '2601228117',
        $plain, $AES_KEY, $AES_IV, $HMAC_KEY, $CLIENT_ID, $CLIENT_SEC, $KEY_VER));
}

// ─────────────────────────────────────────────
// API 004 반려
// ─────────────────────────────────────────────
if ($test === 'api004_reject') {
    echo "<h2>API 004 — 반려(F) 통보 테스트</h2>";
    $plain = [
        'poss_ci'=>'TESTCI88XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        'order_no'=>'TEST-ORDER-'.date('YmdHis'), 'reg_result'=>'F', 'reg_no'=>'',
        'name'=>'테스트견', 'saho'=>'', 'dog_classTab_name'=>'진돗개',
        'micro'=>'900000000000001', 'sex'=>'수', 'hair'=>'황',
        'breed_name'=>'테스트견사', 'breed_addr'=>'서울시 강남구 테스트로 1',
        'poss_name'=>'홍길동', 'poss_addr'=>'서울시 강남구 테헤란로 1',
        'birth'=>'2023-01-01', 'reg_date'=>'',
        'birth_m'=>3, 'birth_f'=>3, 'reg_count_m'=>1, 'reg_count_f'=>0,
        'father_name'=>'', 'father_reg_no'=>'', 'father_saho'=>'',
        'mother_name'=>'', 'mother_reg_no'=>'', 'mother_saho'=>'',
        'ancestors'=>[]
    ];
    show_result(nice_call($HOST, '/api/v1.0/pet/pedigree/result', '2601228117',
        $plain, $AES_KEY, $AES_IV, $HMAC_KEY, $CLIENT_ID, $CLIENT_SEC, $KEY_VER));
}

// ─────────────────────────────────────────────
// API 005 소유권이전
// ─────────────────────────────────────────────
if ($test === 'api005') {
    echo "<h2>API 005 — 소유권 이전 통보 테스트</h2>";
    $plain = [
        'poss_ci'=>'TESTCI88XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        'move_ci'=>'MOVECI88XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
        'reg_no'=>'KSZ-C65001-NP'
    ];
    show_result(nice_call($HOST, '/api/v1.0/pet/pedigree/transfer', '2601941116',
        $plain, $AES_KEY, $AES_IV, $HMAC_KEY, $CLIENT_ID, $CLIENT_SEC, $KEY_VER));
}

echo "</body></html>";
