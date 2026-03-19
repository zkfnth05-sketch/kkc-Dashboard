<?php
/**
 * 파일명: diagnose_content.php
 * 기능: [em_events] 문제 완전 진단 - 서버 루트에 업로드 후 브라우저에서 실행
 * 실행 후: 결과를 캡처해서 개발자에게 전달하세요
 */

define('WP_USE_THEMES', false);
require_once 'wp-load.php';

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>KKF 진단 리포트</title>
<style>
  body { font-family: monospace; background:#1e1e1e; color:#d4d4d4; padding:20px; }
  h2 { color:#4ec9b0; border-bottom:1px solid #4ec9b0; padding-bottom:5px; }
  h3 { color:#dcdcaa; }
  .ok    { color:#4ec9b0; }
  .warn  { color:#ce9178; font-weight:bold; }
  .error { color:#f44747; font-weight:bold; }
  .box   { background:#252526; border:1px solid #3c3c3c; padding:12px; margin:10px 0; border-radius:4px; }
  table  { border-collapse:collapse; width:100%; }
  td, th { border:1px solid #3c3c3c; padding:6px 10px; text-align:left; }
  th     { background:#2d2d2d; color:#9cdcfe; }
</style>
</head>
<body>

<h2>🔬 [KKF 진단 리포트] - <?= date('Y-m-d H:i:s') ?></h2>

<?php

// ─────────────────────────────────────────────────────────────
// 1. DB 원본 본문 확인 (가장 중요!)
// ─────────────────────────────────────────────────────────────
echo '<h2>📦 1. 최근 공지사항 DB 원본 내용 (post_content 날것)</h2>';
echo '<p class="warn">⚠️ 여기서 [em_events]가 보이면, DB 자체에 저장된 것입니다. 필터 문제가 아닙니다!</p>';

global $wpdb;
$posts = $wpdb->get_results("
    SELECT ID, post_title, post_status, post_content
    FROM {$wpdb->posts}
    WHERE post_type = 'post' AND post_status != 'trash'
    ORDER BY post_date DESC
    LIMIT 5
", ARRAY_A);

echo '<div class="box"><table>';
echo '<tr><th>ID</th><th>제목</th><th>상태</th><th>DB 원본 본문 (처음 300자)</th><th>em_events 포함?</th></tr>';
foreach ($posts as $p) {
    $has_em = (strpos($p['post_content'], 'em_events') !== false);
    $content_preview = htmlspecialchars(substr($p['post_content'], 0, 300));
    $class = $has_em ? 'error' : 'ok';
    $flag  = $has_em ? '🔴 YES - DB에 저장됨!' : '✅ NO - 깨끗함';
    echo "<tr>
        <td>{$p['ID']}</td>
        <td>{$p['post_title']}</td>
        <td>{$p['post_status']}</td>
        <td class='$class'>$content_preview</td>
        <td class='$class'>$flag</td>
    </tr>";
}
echo '</table></div>';


// ─────────────────────────────────────────────────────────────
// 2. the_content 훅에 등록된 모든 필터 목록
// ─────────────────────────────────────────────────────────────
echo '<h2>🕵️ 2. the_content 훅에 등록된 모든 필터 (범인 목록)</h2>';
echo '<p>우선순위가 낮을수록 먼저 실행됩니다. [em_events] 관련 함수가 있으면 범인입니다.</p>';

global $wp_filter;
if (isset($wp_filter['the_content'])) {
    $callbacks = $wp_filter['the_content']->callbacks;
    ksort($callbacks);

    echo '<div class="box"><table>';
    echo '<tr><th>우선순위</th><th>함수명 / 설명</th><th>em 관련?</th></tr>';

    foreach ($callbacks as $priority => $functions) {
        foreach ($functions as $func_key => $func_data) {
            $callback = $func_data['function'];

            // 함수명 추출
            if (is_string($callback)) {
                $name = $callback;
            } elseif (is_array($callback)) {
                $obj  = is_object($callback[0]) ? get_class($callback[0]) : $callback[0];
                $name = $obj . '::' . $callback[1];
            } elseif ($callback instanceof Closure) {
                $name = '[익명 Closure]';
            } else {
                $name = '[알 수 없음]';
            }

            $is_em = (
                stripos($name, 'em_') !== false ||
                stripos($name, 'event') !== false ||
                stripos($name, 'ohio') !== false
            );
            $class = $is_em ? 'warn' : '';
            $flag  = $is_em ? '⚠️ 의심' : '';

            echo "<tr class='$class'>
                <td>$priority</td>
                <td>$name</td>
                <td>$flag</td>
            </tr>";
        }
    }
    echo '</table></div>';
} else {
    echo '<p class="ok">the_content 훅에 등록된 필터가 없습니다.</p>';
}


// ─────────────────────────────────────────────────────────────
// 3. Events Manager 플러그인 설정 확인
// ─────────────────────────────────────────────────────────────
echo '<h2>⚙️ 3. Events Manager 플러그인 설정</h2>';

$em_options = get_option('em_options');
if ($em_options) {
    echo '<div class="box"><table>';
    echo '<tr><th>설정 키</th><th>값</th></tr>';
    $suspicious_keys = ['display_events_on_post', 'events_in_the_loop', 'loop', 'content', 'placeholder'];
    foreach ($em_options as $key => $val) {
        $is_sus = false;
        foreach ($suspicious_keys as $sk) {
            if (stripos($key, $sk) !== false) $is_sus = true;
        }
        if ($is_sus) {
            $class = 'warn';
            echo "<tr class='$class'><td>⚠️ $key</td><td>" . htmlspecialchars(print_r($val, true)) . "</td></tr>";
        }
    }
    echo '</table></div>';

    // 전체 옵션도 출력
    echo '<h3>전체 EM 옵션 (접기)</h3>';
    echo '<details><summary>클릭하여 펼치기</summary><div class="box"><pre>';
    foreach ($em_options as $key => $val) {
        echo htmlspecialchars("$key => " . print_r($val, true)) . "\n";
    }
    echo '</pre></div></details>';
} else {
    echo '<p class="ok">Events Manager 옵션이 없습니다 (플러그인 미설치 또는 옵션 없음).</p>';
}


// ─────────────────────────────────────────────────────────────
// 4. 활성화된 플러그인 목록
// ─────────────────────────────────────────────────────────────
echo '<h2>🔌 4. 활성화된 플러그인 목록</h2>';
$active_plugins = get_option('active_plugins', []);
echo '<div class="box"><table><tr><th>플러그인</th><th>em 관련?</th></tr>';
foreach ($active_plugins as $plugin) {
    $is_em = stripos($plugin, 'event') !== false;
    $class = $is_em ? 'warn' : '';
    $flag  = $is_em ? '⚠️ 의심' : '';
    echo "<tr class='$class'><td>$plugin</td><td>$flag</td></tr>";
}
echo '</table></div>';


// ─────────────────────────────────────────────────────────────
// 5. functions.php 적용 확인
// ─────────────────────────────────────────────────────────────
echo '<h2>✅ 5. functions.php 적용 확인</h2>';
$func_applied = function_exists('kkc_force_restore_original_content');
if ($func_applied) {
    echo '<p class="ok">✅ kkc_force_restore_original_content 함수가 등록되어 있습니다. (functions.php 적용 확인됨)</p>';
} else {
    echo '<p class="error">🔴 kkc_force_restore_original_content 함수가 없습니다! functions.php가 제대로 적용되지 않았습니다!</p>';
}

// the_content에 우리 함수가 등록됐는지 확인
$our_filter_found = false;
if (isset($wp_filter['the_content'])) {
    foreach ($wp_filter['the_content']->callbacks as $priority => $functions) {
        foreach ($functions as $key => $data) {
            if (is_string($data['function']) && $data['function'] === 'kkc_force_restore_original_content') {
                $our_filter_found = true;
                echo "<p class='ok'>✅ 필터가 우선순위 $priority 로 등록되어 있습니다.</p>";
            }
        }
    }
}
if (!$our_filter_found) {
    echo '<p class="error">🔴 kkc_force_restore_original_content 필터가 the_content에 등록되지 않았습니다!</p>';
}

?>

<h2>📋 진단 완료</h2>
<p>위 내용을 전체 캡처하거나 복사해서 개발자에게 전달해주세요.</p>

</body>
</html>
