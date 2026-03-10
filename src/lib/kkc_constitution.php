<?php
/**
 * 파일명: lib/kkc_constitution.php
 * 기능: 시스템 전체 데이터 매핑 규격 및 인코딩 변환 엔진 (데이터 헌법)
 */

if (!defined('ABSPATH')) {
    // 직접 실행 방지: bridg.php를 통해서만 로드되어야 함
    return;
}

/**
 * 🛡️ [KKC TABLE MAPPING CONSTITUTION]
 * 이 매핑 테이블은 HeidiSQL DB 구조와 UI 필드명을 동기화하는 기준점입니다.
 * "기존의 헌법 주석(Constitution)이 있는 구간은 절대 건드리지 마" - 지시사항 준수
 */
global $KKC_TABLE_MAP;
$KKC_TABLE_MAP = [
    'memTab' => [
        'pk' => 'mid',
        'encoding' => 'EUC-KR',
        // 🎯 검색 및 지역 필터에서 addr, addr2, addr_1, addr2_1 4종 세트 강제 지정
        'search_fields' => ['name', 'id', 'hp', 'mid', 'phone', 'addr', 'addr_1', 'addr2', 'addr2_1'],
        'region_fields' => ['addr', 'addr_1', 'addr2', 'addr2_1'] 
    ],
    'dogTab' => [
        'pk' => 'uid',
        'encoding' => 'EUC-KR',
        'search_fields' => ['name', 'reg_no', 'micro', 'saho_eng', 'saho', 'poss_name', 'breed_name', 'fa_regno', 'mo_regno']
    ],
    'skillTab' => [
        'pk' => 'uid',
        'encoding' => 'EUC-KR',
        'search_fields' => ['skill_name', 'mb_id', 'name']
    ],
    'wp_posts' => [
        'pk' => 'ID',
        'encoding' => 'UTF-8',
        'search_fields' => ['post_title', 'post_content']
    ],
    'point' => [
        'pk' => 'pt_pid',
        'encoding' => 'EUC-KR', // 🎯 HeidiSQL 확인 결과 EUC-KR임
        'search_fields' => ['reg_no', 'pt_title', 'pt_etc']
    ],
    'dogshow' => [
        'pk' => 'ds_pid',
        'encoding' => 'UTF-8',
        'search_fields' => ['ds_name', 'ds_place', 'ds_etc']
    ],
    'stylist' => [
        'pk' => 'ds_pid',
        'encoding' => 'UTF-8',
        'search_fields' => ['ds_name', 'ds_place', 'ds_etc']
    ],
    'sports_event' => [
        'pk' => 'ds_pid',
        'encoding' => 'UTF-8',
        'search_fields' => ['ds_name', 'ds_place', 'ds_etc']
    ],
    'prize_dogTab' => [
        'pk' => 'uid',
        'encoding' => 'EUC-KR',
        'search_fields' => ['reg_no', 'event_name', 'referee']
    ],
    'breed_dogTab' => [
        'pk' => 'uid',
        'encoding' => 'EUC-KR',
        'search_fields' => ['reg_no', 'dog_name', 'referee']
    ],
    'dongtaeTab' => [
        'pk' => 'uid',
        'encoding' => 'EUC-KR',
        'search_fields' => ['dongtae_no', 'fa_reg_no', 'mo_reg_no', 'dongtae_name']
    ],
    'dogshow_applicant' => [
        'pk' => 'id',
        'encoding' => 'UTF-8',
        'search_fields' => ['name', 'contact']
    ],
    'stylist_applicant' => [
        'pk' => 'id',
        'encoding' => 'UTF-8',
        'search_fields' => ['name', 'contact', 'email', 'address', 'affiliation', 'dog_breed']
    ],
    'sports_applicant' => [
        'pk' => 'id',
        'encoding' => 'UTF-8',
        'search_fields' => ['handler_id', 'name', 'contact', 'dog_name', 'dog_breed', 'pedigree_no']
    ],
    'agility_applicant' => [
        'pk' => 'id',
        'encoding' => 'UTF-8',
        'search_fields' => ['handler_id', 'name', 'contact', 'subject', 'size', 'dog_breed', 'dog_name']
    ],
    'discdog_applicant' => [
        'pk' => 'id',
        'encoding' => 'UTF-8',
        'search_fields' => ['handler_id', 'name', 'name_eng', 'contact', 'dog_name', 'dog_name_eng', 'dog_breed', 'subject', 'team_name']
    ],
    'flyball_applicant' => [
        'pk' => 'id',
        'encoding' => 'UTF-8',
        'search_fields' => ['handler_id', 'name', 'contact', 'dog_name', 'dog_breed']
    ],
    'seminar' => [
        'pk' => 'ds_pid',
        'encoding' => 'UTF-8',
        'search_fields' => ['ds_name', 'ds_place', 'ds_etc', 'organizer']
    ],
    'seminar_applicant' => [
        'pk' => 'id',
        'encoding' => 'UTF-8',
        'search_fields' => ['handler_id', 'name', 'contact', 'email', 'affiliation', 'birthdate']
    ]
];

/**
 * 🐾 [지능형 인코딩 변환기 - V5.0 Binary Safe]
 */
function kkc_convert($data, $enc = 'EUC-KR', $to_utf8 = true) {
    if (is_array($data)) {
        foreach ($data as $k => $v) {
            $data[$k] = kkc_convert($v, $enc, $to_utf8);
        }
        return $data;
    }

    if (!is_string($data) || $data === '') return $data;
    
    if (strtoupper($enc) === 'UTF-8') return $data;

    if ($to_utf8) {
        return @mb_convert_encoding($data, 'UTF-8', 'CP949');
    } else {
        return @mb_convert_encoding($data, 'CP949', 'UTF-8');
    }
}