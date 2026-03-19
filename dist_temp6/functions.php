<?php
/**
 * 📱 KKF 협회 관리자 & 공개용 시스템 통합
 * 배포일: 2026-03-18 (디자인 완벽 복구 + 리다이렉트 최적화 + 이벤트 프라임 차단 최종본)
 */

$ohio_inc_directory = get_template_directory() . '/inc/';

// 1. 테마 핵심 기능 로드
require_once $ohio_inc_directory . 'init/theme.php';
require_once $ohio_inc_directory . 'init/customizer.php';
require_once $ohio_inc_directory . 'init/custom_header.php';
require_once $ohio_inc_directory . 'init/extras.php';
require_once $ohio_inc_directory . 'framework/bootstrap.php';
require_once $ohio_inc_directory . 'tgmpa/class-tgm-plugin-activation.php';
require_once $ohio_inc_directory . 'tgmpa/register_plugins.php';
require_once $ohio_inc_directory . 'tgmpa/vc_setup.php';
require_once $ohio_inc_directory . 'tgmpa/acf_setup.php';
require_once $ohio_inc_directory . 'tgmpa/woocommerce_setup.php';
require_once $ohio_inc_directory . 'tgmpa/ocdi_setup.php';
require_once $ohio_inc_directory . 'template_tags.php';
require_once $ohio_inc_directory . 'sidebars.php';
require_once $ohio_inc_directory . 'menu.php';
require_once $ohio_inc_directory . 'wp_overrides.php';
require_once $ohio_inc_directory . 'enqueue.php';

/**
 * 🚀 통합 시스템 렌더러 (UI 디자인 및 모바일 대응 완벽 복구)
 */
function kkf_integrated_system_renderer($view_mode) {
    $asset_base = get_template_directory_uri() . '/app/';
    $js_url = $asset_base . 'index-BVV9frPj.js'; 
    $css_url = $asset_base . 'index-fCZMxsGt.css';

    return '
    <script>
        window.KKF_VIEW = "' . $view_mode . '";
        // 🚀 [FIX] URL 파라미터가 없을 때만 조심스럽게 추가 (강제 리다이렉트 방지)
        if(!window.location.search.includes("view=")) {
            var url = new URL(window.location.href);
            url.searchParams.set("view", "' . $view_mode . '");
            window.history.replaceState(null, "", url.href);
        }
    </script>

    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100;400;700;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css" />
    <link rel="stylesheet" crossorigin href="' . $css_url . '">
    
    <style>
        body { font-family: "Noto Sans KR", sans-serif; }
        #root { 
            display: flex !important;
            flex-direction: column !important;
            width: 100%; 
            min-height: 800px; 
            background: transparent; 
            border-radius: 20px; 
            overflow: hidden !important; 
            margin-top: 20px;
            box-shadow: 0 10px 40px -15px rgba(0,0,0,0.08);
            color: #1e293b;
        }

        /* 🚀 [RESTORE] 깨진 UI 버튼 및 텍스트 컬러 복구 */
        #root button.bg-slate-900, #root button.bg-slate-800, #root button.bg-teal-500,
        #root .bg-slate-900, #root .bg-teal-500 { color: #ffffff !important; }
        #root button.bg-slate-900 *, #root button.bg-slate-800 *, #root button.bg-teal-500 * { color: #ffffff !important; fill: #ffffff !important; }
        #root .text-white, #root .!text-white { color: #ffffff !important; }

        /* 🚀 [RESTORE] 테마 레이아웃 필수 클래스 복구 */
        #root * { box-sizing: border-box; outline: none !important; }
        .entry-content { max-width: 100% !important; padding: 0 !important; overflow: hidden !important; }
        
        .desktop-only { display: block !important; }
        .mobile-only { display: none !important; }

        @media (max-width: 1023px) {
            #root { margin-top: 10px; border-radius: 12px; min-height: 500px; }
            .desktop-only { display: none !important; }
            .mobile-only { display: flex !important; }
        }
    </style>

    <script type="module" crossorigin src="' . $js_url . '"></script>
    <div id="root"></div>
    ';
}

add_shortcode('kkf_calendar', function() { return kkf_integrated_system_renderer('public_event'); });
add_shortcode('kkf_competition', function() { return kkf_integrated_system_renderer('public_competition'); });

/**
 * 🚫 [EventPrime] 템플릿 및 스크립트 차단 (디자인 보호를 위해 차단만 유지하고 본문 강제 수정은 중단)
 */
add_action('wp_enqueue_scripts', function() {
    if (is_singular(array('post', 'page'))) {
        wp_dequeue_script('eventprime-js');
        wp_dequeue_style('eventprime-css');
        wp_dequeue_style('em-events-style');
    }
}, 9999);

add_filter('template_include', function($template) {
    // 🏠 [홈페이지 리다이렉트 방어] 강제로 홈으로 튕기는 현상 차단
    if (is_singular(array('post', 'page'))) {
        remove_action('template_redirect', 'redirect_canonical'); // 정규화 리다이렉트 일시 중단
    }
    
    if (is_singular(array('post', 'page'))) {
        if (strpos($template, 'eventprime') !== false) {
            $theme_template = is_singular('post') ? get_query_template('single-post') : get_query_template('page');
            if ($theme_template) return $theme_template;
        }
    }
    return $template;
}, 9999);

/**
 * 🛡️ [UPLOAD SECURITY BYPASS] 허용할 파일 확장자 강제 추가 (HWP, PDF, DOCX 등)
 */
add_filter('upload_mimes', function($mimes) {
    $mimes['hwp'] = 'application/haansofthwp';
    $mimes['hwpx'] = 'application/haansofthwp-xml';
    $mimes['pdf'] = 'application/pdf';
    $mimes['docx'] = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    $mimes['doc'] = 'application/msword';
    $mimes['xls'] = 'application/vnd.ms-excel';
    $mimes['xlsx'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    $mimes['zip'] = 'application/zip';
    return $mimes;
}, 999);





