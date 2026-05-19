<?php
/**
 * Plugin Name: KKC 견종백과 마이그레이션 및 관리 도구
 * Description: 테이블(dog_info)의 121종 견종 데이터를 워드프레스 정식 글(Custom Post Type: dog_breed)로 한방에 마이그레이션하고 관리하는 특급 격리형 플러그인입니다.
 * Version: 1.0.0
 * Author: Antigravity AI
 * License: GPL2
 */

if (!defined('ABSPATH')) exit;

// 🚀 1. '견종백과(dog_breed)' 커스텀 포스트 타입 등록
add_action('init', 'kkc_register_dog_breed_cpt');
function kkc_register_dog_breed_cpt() {
    $labels = [
        'name'               => '견종백과',
        'singular_name'      => '견종',
        'menu_name'          => '견종백과',
        'add_new'            => '새 견종 추가',
        'add_new_item'       => '새 견종 추가',
        'edit_item'          => '견종 수정',
        'new_item'           => '새 견종',
        'view_item'          => '견종 보기',
        'search_items'       => '견종 검색',
        'not_found'          => '등록된 견종이 없습니다.',
        'not_found_in_trash' => '휴지통에 견종이 없습니다.'
    ];

    $args = [
        'labels'              => $labels,
        'public'              => true,
        'has_archive'         => true,
        'publicly_queryable'  => true,
        'show_ui'             => true,
        'show_in_menu'        => true,
        'query_var'           => true,
        'rewrite'             => ['slug' => 'dog-breed', 'with_front' => false],
        'capability_type'     => 'post',
        'hierarchical'        => false,
        'menu_icon'           => 'dashicons-pets', // 발자국 아이콘
        'supports'            => ['title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'],
        'show_in_rest'        => true, // 구텐베르크 에디터 및 REST API 활성화 (SEO 최적화)
    ];

    register_post_type('dog_breed', $args);
}

// 🚀 2. 워드프레스 관리자창에 마이그레이션 관리 메뉴 추가
add_action('admin_menu', 'kkc_dog_breed_migration_menu');
function kkc_dog_breed_migration_menu() {
    add_submenu_page(
        'edit.php?post_type=dog_breed',
        '견종백과 일괄 가져오기',
        'DB 일괄 가져오기',
        'manage_options',
        'kkc-breed-migration',
        'kkc_dog_breed_migration_page'
    );
}

// 🚀 3. 마이그레이션 관리자 화면 UI 및 실행 로직
function kkc_dog_breed_migration_page() {
    global $wpdb;
    
    // 권한 확인
    if (!current_user_can('manage_options')) {
        wp_die('보안 오류: 접근 권한이 없습니다.');
    }

    echo '<div class="wrap">';
    echo '<h1>🐕 견종백과 DB 일괄 마이그레이션 및 연동 도구</h1>';
    echo '<p style="font-size:14px; color:#555;">기존 데이터베이스의 <code>dog_info</code> 테이블에 들어있는 121종의 견종 사전을 워드프레스 정식 게시글로 안전하게 이전합니다.</p>';

    // 실행 요청 처리
    if (isset($_POST['run_breed_migration']) && check_admin_referer('kkc_breed_migrate_action', 'kkc_breed_migrate_nonce')) {
        
        $legacy_breeds = $wpdb->get_results("SELECT * FROM dog_info ORDER BY CAST(idx AS UNSIGNED) ASC", ARRAY_A);
        
        if (empty($legacy_breeds)) {
            echo '<div class="notice notice-error"><p>에러: 데이터베이스에서 <code>dog_info</code> 테이블 또는 데이터를 찾을 수 없습니다.</p></div>';
        } else {
            $total = count($legacy_breeds);
            $created = 0;
            $skipped = 0;
            
            echo '<div style="background:#fff; border:1px solid #ccd0d4; padding:15px; margin:15px 0; border-radius:5px; max-height:400px; overflow-y:scroll; box-shadow:inset 0 1px 3px rgba(0,0,0,.05);">';
            echo '<h3>🔄 실시간 연동 로그:</h3>';
            
            foreach ($legacy_breeds as $breed) {
                $idx = $breed['idx'];
                $kor_name = trim($breed['dog_kor_name']);
                $eng_name = trim($breed['dog_eng_name']);
                $content = trim($breed['content1']);
                
                $title = $kor_name;
                if (!empty($eng_name)) {
                    $title .= " ({$eng_name})";
                }

                // 🚀 [중복 방지] 이미 이전된 견종인지 메타 데이터로 판별
                $existing_id = $wpdb->get_var(
                    $wpdb->prepare(
                        "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '__legacy_breed_idx' AND meta_value = %s LIMIT 1",
                        $idx
                    )
                );

                if ($existing_id) {
                    echo '<p style="color:#666; margin:4px 0;">[건너뜀] 번호 ' . $idx . ' - ' . $title . ' 은(는) 이미 정식 글로 이식되어 있습니다.</p>';
                    $skipped++;
                    continue;
                }

                // 🚀 워드프레스 '견종백과' 포스트 타입으로 등록
                $post_id = wp_insert_post([
                    'post_title'   => $title,
                    'post_content' => $content, // 백과사전 내용 그대로 주입
                    'post_type'    => 'dog_breed',
                    'post_status'  => 'publish',
                    'post_author'  => get_current_user_id(),
                ]);

                if (is_wp_error($post_id)) {
                    echo '<p style="color:red; margin:4px 0;">[실패] 번호 ' . $idx . ' - ' . $title . ' 등록 오류: ' . $post_id->get_error_message() . '</p>';
                    continue;
                }

                // 🚀 견종 규격 수치 및 기타 정보 Custom Fields(메타 데이터)로 매핑하여 주입
                update_post_meta($post_id, '__legacy_breed_idx', $idx);
                update_post_meta($post_id, 'dog_kor_name', $kor_name);
                update_post_meta($post_id, 'dog_eng_name', $eng_name);
                update_post_meta($post_id, 'dog_origin', $breed['dog_origin'] ?? '');
                update_post_meta($post_id, 'dog_group', $breed['dog_group'] ?? '');
                update_post_meta($post_id, 'dog_height_min', $breed['dog_height1'] ?? '');
                update_post_meta($post_id, 'dog_height_max', $breed['dog_height2'] ?? '');
                update_post_meta($post_id, 'dog_weight_min', $breed['dog_weight1'] ?? '');
                update_post_meta($post_id, 'dog_weight_max', $breed['dog_weight2'] ?? '');
                update_post_meta($post_id, 'dog_img1', $breed['dog_img1'] ?? '');
                update_post_meta($post_id, 'dog_img2', $breed['dog_img2'] ?? '');

                echo '<p style="color:green; margin:4px 0; font-weight:bold;">[성공] 번호 ' . $idx . ' - ' . $title . ' 정식 글 변환 성공!</p>';
                $created++;
            }
            
            echo '</div>';
            
            echo '<div class="notice notice-success is-dismissible" style="padding:10px; margin-bottom:15px;">';
            echo '<h3 style="margin-top:5px; color:#137333;">🎉 마이그레이션이 성공적으로 수행되었습니다!</h3>';
            echo '<p style="font-size:14px; margin-bottom:5px;">• 발견된 전체 레코드: <strong>' . $total . '개</strong></p>';
            echo '<p style="font-size:14px; margin-bottom:5px;">• 신규 변환된 견종: <strong style="color:green;">' . $created . '개</strong></p>';
            echo '<p style="font-size:14px; margin-bottom:5px;">• 중복으로 인해 안전하게 건너뛴 견종: <strong>' . $skipped . '개</strong></p>';
            echo '</div>';
        }
    }

    // 마이그레이션 실행 대기 버튼 폼
    echo '<div class="card" style="max-width:600px; padding:20px; margin-top:20px; background:#fff; border:1px solid #ccd0d4; border-radius:4px; box-shadow:0 1px 1px rgba(0,0,0,.04);">';
    echo '<h2>🚀 가져오기 실행 준비</h2>';
    echo '<p style="color:#666; line-height:1.5;">하단의 버튼을 클릭하시면 즉시 데이터베이스의 <code>dog_info</code> 테이블에서 121종 데이터를 검색해 워드프레스 "견종백과" 글로 안전하게 변환 등록합니다.<br>';
    echo '<strong>(여러 번 클릭해도 중복으로 등록되지 않고 안전하게 우회합니다)</strong></p>';
    
    echo '<form method="post" action="">';
    wp_nonce_field('kkc_breed_migrate_action', 'kkc_breed_migrate_nonce');
    echo '<input type="submit" name="run_breed_migration" class="button button-primary button-large" value="🐾 견종백과 DB 일괄 마이그레이션 실행" />';
    echo '</form>';
    echo '</div>';

    echo '</div>';
}

// 🚀 4. 퍼블릭용 실시간 AJAX 데이터 조회 API 등록
add_action('wp_ajax_kkc_get_public_breeds', 'kkc_ajax_get_public_breeds');
add_action('wp_ajax_nopriv_kkc_get_public_breeds', 'kkc_ajax_get_public_breeds');
function kkc_ajax_get_public_breeds() {
    global $wpdb;
    $results = $wpdb->get_results("SELECT * FROM dog_info ORDER BY dog_kor_name ASC", ARRAY_A);
    
    // 데이터 가공 및 클렌징
    foreach ($results as &$r) {
        $r['dog_kor_name'] = trim($r['dog_kor_name']);
        $r['dog_eng_name'] = trim($r['dog_eng_name']);
        $r['dog_origin'] = trim($r['dog_origin']);
        $r['content1'] = trim($r['content1']);
    }
    wp_send_json_success($results);
}

// 🚀 5. [kkc_dog_breed_catalog] 숏코드 등록 (원페이지 명품 견종도감)
add_shortcode('kkc_dog_breed_catalog', 'kkc_dog_breed_catalog_shortcode');
function kkc_dog_breed_catalog_shortcode() {
    ob_start();
    ?>
    <div id="kkc-breed-portal" class="kkc-breed-portal-wrap">
        <!-- 🎨 프리미엄 검색 & 필터 헤더 바 -->
        <div class="kkc-filter-section">
            <div class="kkc-search-box-wrap">
                <span class="kkc-search-icon">🔍</span>
                <input type="text" id="kkc-breed-search" placeholder="견종 이름 또는 원산지를 입력해 주세요..." />
            </div>
            <div class="kkc-group-filters">
                <button class="kkc-filter-btn active" data-group="all">전체 견종</button>
                <button class="kkc-filter-btn" data-origin="독일">독일</button>
                <button class="kkc-filter-btn" data-origin="미국">미국</button>
                <button class="kkc-filter-btn" data-origin="영국">영국</button>
                <button class="kkc-filter-btn" data-origin="일본">일본</button>
                <button class="kkc-filter-btn" data-origin="프랑스">프랑스</button>
            </div>
        </div>

        <!-- 🔄 로딩 스피너 -->
        <div id="kkc-breed-loading" class="kkc-loading-spinner">
            <div class="spinner-circle"></div>
            <p>신선한 견종 데이터 사전 로딩 중...</p>
        </div>

        <!-- 🐾 메인 견종 카드 그리드 (한 페이지에 아름답게 정렬) -->
        <div id="kkc-breed-grid" class="kkc-breed-grid-layout" style="display:none;"></div>

        <!-- 🚫 검색 결과 없음 안내 -->
        <div id="kkc-breed-no-results" class="kkc-no-results-alert" style="display:none;">
            <span>🐕</span>
            <p>검색 결과와 매칭되는 견종이 없습니다. 철자를 확인해 주세요!</p>
        </div>

        <!-- 🖼️ 프리미엄 모달 팝업창 (동일 페이지에서 상세 보기 완벽 작동!) -->
        <div id="kkc-breed-modal" class="kkc-glass-modal" style="display:none;">
            <div class="kkc-modal-overlay" onclick="kkcCloseBreedModal()"></div>
            <div class="kkc-modal-content">
                <button class="kkc-modal-close-btn" onclick="kkcCloseBreedModal()">&times;</button>
                <div class="kkc-modal-body-wrap">
                    <div class="kkc-modal-header-img">
                        <div class="kkc-avatar-silhouette">🐾</div>
                    </div>
                    <div class="kkc-modal-main-detail">
                        <h2 id="modal-dog-title" class="modal-title-text">견종 이름</h2>
                        <div class="kkc-meta-badges">
                            <span id="modal-dog-origin" class="meta-badge-item origin-badge">원산지</span>
                            <span id="modal-dog-group" class="meta-badge-item group-badge">그룹</span>
                        </div>
                        
                        <div class="kkc-spec-grid">
                            <div class="spec-card">
                                <span class="spec-label">표준 체고(키)</span>
                                <strong id="modal-dog-height" class="spec-value">- cm</strong>
                            </div>
                            <div class="spec-card">
                                <span class="spec-label">표준 체중(몸무게)</span>
                                <strong id="modal-dog-weight" class="spec-value">- kg</strong>
                            </div>
                        </div>

                        <hr class="modal-divider" />
                        <h3 class="section-subtitle">📖 견종 사전 및 성격 특징</h3>
                        <div id="modal-dog-description" class="modal-description-content">
                            여기에 상세 사전 설명글이 들어갑니다.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 🎨 프리미엄 스타일링 (Vanilla CSS) -->
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
    
    .kkc-breed-portal-wrap {
        font-family: 'Outfit', 'Noto Sans KR', sans-serif;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px 10px;
    }

    /* 필터 영역 */
    .kkc-filter-section {
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin-bottom: 30px;
        background: rgba(255, 255, 255, 0.8);
        padding: 20px;
        border-radius: 16px;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.18);
    }
    .kkc-search-box-wrap {
        position: relative;
        width: 100%;
    }
    .kkc-search-icon {
        position: absolute;
        left: 15px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 18px;
        color: #888;
    }
    #kkc-breed-search {
        width: 100%;
        padding: 14px 14px 14px 45px;
        border: 2px solid #eef2f5;
        border-radius: 12px;
        font-size: 15px;
        outline: none;
        transition: all 0.3s ease;
        box-sizing: border-box;
    }
    #kkc-breed-search:focus {
        border-color: #2196f3;
        box-shadow: 0 0 0 4px rgba(33, 150, 243, 0.15);
    }
    .kkc-group-filters {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }
    .kkc-filter-btn {
        padding: 8px 16px;
        border: 1px solid #e2e8f0;
        background: #fff;
        border-radius: 30px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.25s ease;
        font-weight: 500;
        color: #4a5568;
    }
    .kkc-filter-btn:hover {
        background: #f7fafc;
        border-color: #cbd5e0;
    }
    .kkc-filter-btn.active {
        background: #2196f3;
        color: #fff;
        border-color: #2196f3;
        box-shadow: 0 4px 14px rgba(33, 150, 243, 0.3);
    }

    /* 그리드 레이아웃 */
    .kkc-breed-grid-layout {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 20px;
    }
    
    /* 견종 카드 */
    .kkc-breed-card {
        background: #fff;
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid #edf2f7;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
    }
    .kkc-breed-card:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        border-color: rgba(33, 150, 243, 0.2);
    }
    .kkc-card-img-wrap {
        height: 140px;
        background: linear-gradient(135deg, #f6f8fb 0%, #eef2f7 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    }
    .kkc-card-placeholder {
        font-size: 38px;
        filter: grayscale(0.2);
        animation: pulse 2s infinite ease-in-out;
    }
    .kkc-card-info {
        padding: 16px;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
    }
    .kkc-card-title {
        font-size: 17px;
        font-weight: 700;
        color: #1a202c;
        margin: 0 0 4px 0;
    }
    .kkc-card-sub {
        font-size: 12px;
        color: #718096;
        margin: 0 0 12px 0;
        font-style: italic;
    }
    .kkc-card-bottom {
        margin-top: auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid #edf2f7;
        padding-top: 12px;
        font-size: 11px;
        color: #a0aec0;
    }
    .kkc-card-origin {
        background: #edf2f7;
        color: #4a5568;
        padding: 3px 8px;
        border-radius: 4px;
        font-weight: 600;
    }

    /* 로딩 및 에러 알림 */
    .kkc-loading-spinner {
        text-align: center;
        padding: 50px 0;
        color: #718096;
    }
    .spinner-circle {
        width: 40px;
        height: 40px;
        border: 4px solid #e2e8f0;
        border-top-color: #2196f3;
        border-radius: 50%;
        margin: 0 auto 15px auto;
        animation: spin 1s infinite linear;
    }
    .kkc-no-results-alert {
        text-align: center;
        padding: 50px 0;
        color: #a0aec0;
    }
    .kkc-no-results-alert span {
        font-size: 50px;
    }

    /* 🖼️ 프리미엄 글래스모피즘 모달창 */
    .kkc-glass-modal {
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
    }
    .kkc-modal-overlay {
        position: absolute;
        width: 100%;
        height: 100%;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(8px);
    }
    .kkc-modal-content {
        position: relative;
        background: rgba(255, 255, 255, 0.95);
        width: 100%;
        max-width: 650px;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        max-height: 85vh;
        display: flex;
        flex-direction: column;
    }
    .kkc-modal-close-btn {
        position: absolute;
        right: 15px;
        top: 15px;
        background: rgba(0, 0, 0, 0.05);
        border: none;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        font-size: 22px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        transition: all 0.2s ease;
    }
    .kkc-modal-close-btn:hover {
        background: rgba(0, 0, 0, 0.1);
        transform: rotate(90deg);
    }
    .kkc-modal-body-wrap {
        overflow-y: auto;
        display: flex;
        flex-direction: column;
    }
    .kkc-modal-header-img {
        height: 160px;
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .kkc-avatar-silhouette {
        font-size: 60px;
        color: rgba(255, 255, 255, 0.8);
        animation: float 3s infinite ease-in-out;
    }
    .kkc-modal-main-detail {
        padding: 30px;
    }
    .modal-title-text {
        font-size: 26px;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 10px 0;
    }
    .kkc-meta-badges {
        display: flex;
        gap: 8px;
        margin-bottom: 25px;
    }
    .meta-badge-item {
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
    }
    .origin-badge {
        background: #e0f2fe;
        color: #0369a1;
    }
    .group-badge {
        background: #fef3c7;
        color: #b45309;
    }
    
    /* 규격 그리드 */
    .kkc-spec-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 25px;
    }
    .spec-card {
        background: #f8fafc;
        border: 1px solid #f1f5f9;
        padding: 15px;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
    }
    .spec-label {
        font-size: 12px;
        color: #64748b;
        margin-bottom: 4px;
    }
    .spec-value {
        font-size: 16px;
        color: #0f172a;
        font-weight: 700;
    }

    .modal-divider {
        border: 0;
        border-top: 1px solid #edf2f7;
        margin: 20px 0;
    }
    .section-subtitle {
        font-size: 16px;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 12px 0;
    }
    .modal-description-content {
        font-size: 14.5px;
        color: #334155;
        line-height: 1.7;
        max-height: 250px;
        overflow-y: auto;
        padding-right: 8px;
    }

    /* Keyframes */
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.08); opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    </style>

    <!-- ⚡ 실시간 고성능 비동기 자바스크립트 -->
    <script>
    let kkcAllBreeds = [];

    document.addEventListener("DOMContentLoaded", function() {
        kkcLoadBreedCatalog();

        // 실시간 타이핑 검색 바인딩
        const searchInput = document.getElementById("kkc-breed-search");
        if (searchInput) {
            searchInput.addEventListener("input", function(e) {
                kkcRenderBreedGrid(e.target.value);
            });
        }

        // 퀵 필터 버튼 바인딩
        const filterBtns = document.querySelectorAll(".kkc-filter-btn");
        filterBtns.forEach(btn => {
            btn.addEventListener("click", function() {
                filterBtns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                
                const origin = btn.getAttribute("data-origin");
                if (origin) {
                    document.getElementById("kkc-breed-search").value = "";
                    kkcRenderBreedGrid(origin);
                } else {
                    document.getElementById("kkc-breed-search").value = "";
                    kkcRenderBreedGrid("");
                }
            });
        });
    });

    // 🚀 REST API로부터 121종 실시간 로딩
    function kkcLoadBreedCatalog() {
        const loadingEl = document.getElementById("kkc-breed-loading");
        const gridEl = document.getElementById("kkc-breed-grid");
        
        fetch("<?php echo admin_url('admin-ajax.php'); ?>?action=kkc_get_public_breeds")
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data) {
                    kkcAllBreeds = res.data;
                    loadingEl.style.display = "none";
                    gridEl.style.display = "grid";
                    kkcRenderBreedGrid("");
                } else {
                    loadingEl.innerHTML = "<p style='color:red;'>데이터를 가져오는데 실패했습니다.</p>";
                }
            })
            .catch(err => {
                loadingEl.innerHTML = "<p style='color:red;'>네트워크 오류 발생: " + err.message + "</p>";
            });
    }

    // 🎨 견종 그리드 동적 생성 및 필터링
    function kkcRenderBreedGrid(keyword) {
        const gridEl = document.getElementById("kkc-breed-grid");
        const noResultsEl = document.getElementById("kkc-breed-no-results");
        gridEl.innerHTML = "";

        const cleanKeyword = keyword.trim().toLowerCase();
        
        // 검색 필터 적용
        const filtered = kkcAllBreeds.filter(item => {
            if (!cleanKeyword) return true;
            return (
                item.dog_kor_name.toLowerCase().includes(cleanKeyword) ||
                item.dog_eng_name.toLowerCase().includes(cleanKeyword) ||
                item.dog_origin.toLowerCase().includes(cleanKeyword)
            );
        });

        if (filtered.length === 0) {
            gridEl.style.display = "none";
            noResultsEl.style.display = "block";
            return;
        }

        gridEl.style.display = "grid";
        noResultsEl.style.display = "none";

        filtered.forEach(item => {
            const card = document.createElement("div");
            card.className = "kkc-breed-card";
            card.onclick = () => kkcOpenBreedModal(item);

            const displayEng = item.dog_eng_name ? item.dog_eng_name : "Unknown Breed";
            const displayOrigin = item.dog_origin ? item.dog_origin : "미지정";
            const displayGroup = item.dog_group ? (item.dog_group.length > 5 ? item.dog_group.substring(0, 5) : item.dog_group) : "일반";

            card.innerHTML = `
                <div class="kkc-card-img-wrap">
                    <div class="kkc-card-placeholder">🐾</div>
                </div>
                <div class="kkc-card-info">
                    <h3 class="kkc-card-title">${item.dog_kor_name}</h3>
                    <p class="kkc-card-sub">${displayEng}</p>
                    <div class="kkc-card-bottom">
                        <span class="kkc-card-origin">${displayOrigin}</span>
                        <span>그룹: ${displayGroup}</span>
                    </div>
                </div>
            `;
            gridEl.appendChild(card);
        });
    }

    // 🖼️ 모달 팝업 열기 (동일 페이지에서 상세 보기 완벽 처리)
    function kkcOpenBreedModal(item) {
        const modal = document.getElementById("kkc-breed-modal");
        
        document.getElementById("modal-dog-title").innerText = item.dog_kor_name + (item.dog_eng_name ? " (" + item.dog_eng_name + ")" : "");
        document.getElementById("modal-dog-origin").innerText = "📍 원산지: " + (item.dog_origin ? item.dog_origin : "미지정");
        document.getElementById("modal-dog-group").innerText = "🐾 분류그룹: " + (item.dog_group ? item.dog_group : "일반견");
        
        const hMin = item.dog_height1 ? item.dog_height1 + " cm" : "";
        const hMax = item.dog_height2 ? " ~ " + item.dog_height2 + " cm" : "";
        document.getElementById("modal-dog-height").innerText = (hMin || hMax) ? hMin + hMax : "정보 준비중";

        const wMin = item.dog_weight1 ? item.dog_weight1 + " kg" : "";
        const wMax = item.dog_weight2 ? " ~ " + item.dog_weight2 + " kg" : "";
        document.getElementById("modal-dog-weight").innerText = (wMin || wMax) ? wMin + wMax : "정보 준비중";

        const descEl = document.getElementById("modal-dog-description");
        if (item.content1 && item.content1.trim() !== "") {
            descEl.innerHTML = item.content1;
        } else {
            descEl.innerHTML = "<p style='color:#a0aec0; font-style:italic;'>등록된 견종 사전 설명 본문이 없습니다. 최신 정보 수집 중입니다.</p>";
        }

        modal.style.display = "flex";
        document.body.style.overflow = "hidden"; // 배경 스크롤 방지
    }

    // 🖼️ 모달 팝업 닫기
    function kkcCloseBreedModal() {
        document.getElementById("kkc-breed-modal").style.display = "none";
        document.body.style.overflow = "auto";
    }
    </script>
    <?php
    return ob_get_clean();
}
