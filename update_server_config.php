<?php
/**
 * 파일명: update_server_config.php
 * 기능: 서버의 lib/kkc_constitution.php 파일을 최신화합니다.
 */
require_once 'wp-load.php';

$lib_dir = dirname(__FILE__) . '/lib/';
if (!file_exists($lib_dir)) {
    mkdir($lib_dir, 0755, true);
}

$constitution_code = <<<'EOD'
<?php
/**
 * 파일명: lib/kkc_constitution.php
 * 기능: 데이터 변환 및 테이블 매핑 헌법 (Constitution)
 */

if (!function_exists('kkc_convert')) {
    function kkc_convert($data, $enc = 'UTF-8', $to_utf8 = true) {
        if (empty($data)) return $data;
        if (is_array($data)) {
            foreach ($data as $k => $v) { $data[$k] = kkc_convert($v, $enc, $to_utf8); }
            return $data;
        }
        if (!is_string($data)) return $data;
        if ($enc === 'UTF-8') return $data;
        
        return $to_utf8 
            ? mb_convert_encoding($data, 'UTF-8', $enc) 
            : mb_convert_encoding($data, $enc, 'UTF-8');
    }
}

global $KKC_TABLE_MAP;
$KKC_TABLE_MAP = [
    'memTab' => [
        'pk' => 'uid',
        'encoding' => 'EUC-KR',
        'search_fields' => ['m_name', 'm_tel', 'm_hp', 'm_mail', 'm_addr1', 'm_id']
    ],
    'dogTab' => [
        'pk' => 'uid',
        'encoding' => 'EUC-KR',
        'search_fields' => ['dog_name', 'dongtae_no', 'owner_name', 'birth_date']
    ],
    'schednieTab' => [
        'pk' => 'uid',
        'encoding' => 'EUC-KR',
        'search_fields' => ['ds_name', 'ds_place']
    ],
    'breed_dogTab' => [
        'pk' => 'bd_pid',
        'encoding' => 'EUC-KR',
        'search_fields' => ['bd_name', 'bd_ename']
    ],
    'dogshow' => [
        'pk' => 'ds_pid',
        'encoding' => 'UTF-8',
        'search_fields' => ['ds_name', 'ds_place', 'ds_organizer']
    ],
    'stylist' => [
        'pk' => 'ds_pid',
        'encoding' => 'UTF-8',
        'search_fields' => ['ds_name', 'ds_place', 'ds_organizer']
    ],
    'point' => [
        'pk' => 'pt_pid',
        'encoding' => 'UTF-8',
        'search_fields' => ['dogShowName', 'dog_name', 'owner_name']
    ],
    'prize' => [
        'pk' => 'pz_pid',
        'encoding' => 'UTF-8',
        'search_fields' => ['ds_name', 'dog_name', 'owner_name']
    ],
    // 🚀 스타일리스트 신청자 테이블 추가
    'stylist_applicant' => [
        'pk' => 'id',
        'encoding' => 'UTF-8',
        'search_fields' => ['name', 'contact', 'email', 'address', 'affiliation', 'dog_breed']
    ],
    // 🚀 도그쇼 신청자 테이블 (원복)
    'dogshow_applicant' => [
        'pk' => 'id',
        'encoding' => 'UTF-8',
        'search_fields' => ['name', 'contact']
    ]
];
EOD;

if (file_put_contents($lib_dir . 'kkc_constitution.php', $constitution_code)) {
    echo "✅ kkc_constitution.php 업데이트 완료";
} else {
    echo "❌ 업데이트 실패";
}
exit;
