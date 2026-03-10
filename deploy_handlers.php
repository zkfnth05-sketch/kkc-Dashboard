<?php
/**
 * 파일명: deploy_handlers.php
 * 기능: 서버의 handlers 폴더에 최신 로직을 배포합니다.
 */
require_once 'wp-load.php';

$handlers_dir = dirname(__FILE__) . '/handlers/';
if (!file_exists($handlers_dir)) {
    mkdir($handlers_dir, 0755, true);
}

// 🚀 최신 event_logic.php 데이터
// (이 파일의 내용은 Antigravity가 로컬에서 작성한 최신 버전입니다)
$event_logic_code = <<<'EOD'
<?php
/**
 * 파일명: handlers/event_logic.php
 * 기능: 프론트엔드 하드코딩(KKC) 우회 및 상세창 누락 해결 (백엔드 강제 주입 버전)
 */

if (!defined('ABSPATH')) exit;

function kkc_handle_event_list($input) {
    global $wpdb;
    $search = $input['search'] ?? '';
    $filter_cat = $input['category'] ?? '전체';
    $events = [];

    // 🚀 [FILTER OPTIMIZATION] 각 탭에 맞는 테이블만 조회하여 속도 및 정확도 향상
    // dogshow 테이블은 통합 저장소 성격이 강하므로 거의 대부분의 경우 조회합니다.
    $show_dogshow = ($filter_cat === '전체' || in_array($filter_cat, ['도그쇼', '셰퍼드 전람회', '진도견 선발대회', '훈련 경기대회', '어질리티', '디스크독', '플라이볼', '세미나', '교육 및 세미나']));
    $show_stylist = ($filter_cat === '전체' || strpos($filter_cat, '스타일리스트') !== false);
    $show_sports = ($filter_cat === '전체' || in_array($filter_cat, ['훈련 경기대회', '어질리티', '디스크독', '플라이볼']));
    $show_seminar = ($filter_cat === '전체' || strpos($filter_cat, '세미나') !== false || strpos($filter_cat, '교육') !== false);
    $show_breed = ($filter_cat === '전체' || strpos($filter_cat, '종견') !== false);

    // 1. 도그쇼 (dogshow) 조회
    if ($show_dogshow) {
        $where_ds = "1=1";
        if (!empty($search)) $where_ds .= $wpdb->prepare(" AND ds_name LIKE %s", '%' . $search . '%');
        
        // ds_pid가 기본 PK이므로 이를 기준으로 조회
        $dogshow_data = $wpdb->get_results("
            SELECT d.*, 
            CASE 
                WHEN (ds_type LIKE '%어질리티%' OR ds_name LIKE '%어질리티%') THEN (SELECT COUNT(*) FROM agility_applicant WHERE ds_pid = d.ds_pid)
                WHEN (ds_type LIKE '%디스크독%' OR ds_name LIKE '%디스크독%') THEN (SELECT COUNT(*) FROM discdog_applicant WHERE ds_pid = d.ds_pid)
                WHEN (ds_type LIKE '%플라이볼%' OR ds_name LIKE '%플라이볼%') THEN (SELECT COUNT(*) FROM flyball_applicant WHERE ds_pid = d.ds_pid)
                WHEN (ds_type LIKE '%스타일리스트%' OR ds_name LIKE '%스타일리스트%') AND (ds_type LIKE '%(국제)%' OR ds_name LIKE '%(국제)%') THEN (SELECT COUNT(*) FROM stylist_intl_applicant WHERE ds_pid = d.ds_pid)
                WHEN (ds_type LIKE '%스타일리스트%' OR ds_name LIKE '%스타일리스트%') THEN (SELECT COUNT(*) FROM stylist_applicant WHERE ds_pid = d.ds_pid)
                WHEN (ds_type LIKE '%세미나%' OR ds_name LIKE '%세미나%' OR ds_type LIKE '%교육%') THEN (SELECT COUNT(*) FROM seminar_applicant WHERE ds_pid = d.ds_pid)
                WHEN (ds_type LIKE '%훈련%' OR ds_name LIKE '%훈련%') THEN (SELECT COUNT(*) FROM sports_applicant WHERE ds_pid = d.ds_pid)
                WHEN (ds_type LIKE '%종견%' OR ds_name LIKE '%종견%') THEN (SELECT COUNT(*) FROM breed_exam_applicant WHERE ds_pid = d.ds_pid)
                ELSE (SELECT COUNT(*) FROM dogshow_applicant WHERE ds_pid = d.ds_pid)
            END as applicant_count
            FROM dogshow d WHERE $where_ds ORDER BY ds_date DESC, ds_pid DESC LIMIT 300", ARRAY_A);

        foreach ($dogshow_data as $row) {
            $raw_cat = trim($row['ds_type'] ?? '도그쇼');
            $original_cat = (empty($raw_cat) || $raw_cat === 'b5b1plus') ? '도그쇼' : $raw_cat;
            
            // [GROUP FIX] 도그쇼, 셰퍼드 전람회, 진도견 선발대회 통합
            $cat = $original_cat;
            if (in_array($original_cat, ['셰퍼드 전람회', '진도견 선발대회'])) {
                $cat = '도그쇼';
            } else if (in_array($original_cat, ['훈련 대회', '훈련대회', '훈련 경기대회', '어질리티', '디스크독', '플라이볼'])) {
                $cat = '훈련 경기대회';
            } else if (in_array($original_cat, ['세미나', '교육 및 테스트', '교육'])) {
                $cat = '세미나';
            }

            if ($filter_cat !== '전체') {
                // 특정 탭 선택 시 정확한 매칭 우선
                if ($filter_cat === '도그쇼') {
                    if ($cat !== '도그쇼') continue;
                } else {
                    if (strpos($cat, $filter_cat) === false && strpos($filter_cat, $cat) === false && strpos($original_cat, $filter_cat) === false) continue;
                }
            }

            $venue = trim($row['ds_place'] ?? '');
            if (!$venue) $venue = " "; 

            $s_time = (!empty($row['ds_start_time']) && $row['ds_start_time'] !== '00:00:00') ? substr($row['ds_start_time'], 0, 5) : '10:00';
            $e_time = (!empty($row['ds_end_time']) && $row['ds_end_time'] !== '00:00:00') ? substr($row['ds_end_time'], 0, 5) : '18:00';

            // 🚀 [DT FIX] ds_organizer 추가 (전역 혹은 row 데이터에서 로드)
            $organizer = trim($row['ds_organizer'] ?? '');
            if (!$organizer || $organizer === '주최 미지정') $organizer = "(사)한국애견협회";

            $events[] = [
                'id' => 'ds_' . ($row['ds_pid'] ?? 0),
                'ID' => 'ds_' . ($row['ds_pid'] ?? 0),
                'title' => $row['ds_name'],
                'post_title' => $row['ds_name'],
                'category' => $cat,
                'type_names' => $original_cat,
                'startDate' => $row['ds_date'],
                'endDate' => (isset($row['ds_end_date']) && $row['ds_end_date'] !== '0000-00-00') ? $row['ds_end_date'] : $row['ds_date'],
                'startTime' => $s_time,
                'endTime' => $e_time,
                'actual_start_dt' => $row['ds_date'] . ' ' . $s_time,
                'actual_end_dt' => ($row['ds_end_date'] ?? $row['ds_date']) . ' ' . $e_time,

                // 🚀 [REG LOAD] 접수 기간 로드
                'reg_start_date' => $row['reg_start_date'] ?? '',
                'reg_end_date' => $row['reg_end_date'] ?? '',
                'reg_start_h' => isset($row['reg_start_time']) ? substr($row['reg_start_time'], 0, 2) : '09',
                'reg_start_m' => isset($row['reg_start_time']) ? substr($row['reg_start_time'], 3, 2) : '00',
                'reg_end_h' => isset($row['reg_end_time']) ? substr($row['reg_end_time'], 0, 2) : '17',
                'reg_end_m' => isset($row['reg_end_time']) ? substr($row['reg_end_time'], 3, 2) : '00',
                
                // 리액트 앱이 찾는 모든 변수명에 데이터를 꽉 채움
                'venue' => $venue,
                'event_venue' => $venue,
                'venue_name' => $venue,
                'location' => $venue,
                
                'organizer' => $organizer,
                'organizer_name' => $organizer,
                'event_organizer' => $organizer,
                
                'content' => $row['ds_content'] ?? '',
                'post_content' => $row['ds_content'] ?? '',
                'thumbnail_url' => $row['ds_thumbnail'] ?? '',
                'is_multi_day' => (int)($row['is_multi_day'] ?? 0),
                'judges' => $row['ds_etc'] ?? '',
                'ds_etc' => $row['ds_etc'] ?? '',
                'applicant_count' => (int)($row['applicant_count'] ?? 0),
                'source' => 'dogshow'
            ];
        }
    }

    // 2. 스타일리스트 조회
    if ($show_stylist) {
        $stylist_data = $wpdb->get_results("
            SELECT s.*, 
            CASE 
                WHEN ds_type LIKE '%어질리티%' THEN (SELECT COUNT(*) FROM agility_applicant WHERE ds_pid = s.ds_pid)
                WHEN ds_type LIKE '%디스크독%' THEN (SELECT COUNT(*) FROM discdog_applicant WHERE ds_pid = s.ds_pid)
                WHEN ds_type LIKE '%플라이볼%' THEN (SELECT COUNT(*) FROM flyball_applicant WHERE ds_pid = s.ds_pid)
                WHEN ds_type LIKE '%스타일리스트%' AND ds_type LIKE '%(국제)%' THEN (SELECT COUNT(*) FROM stylist_intl_applicant WHERE ds_pid = s.ds_pid)
                WHEN ds_type LIKE '%스타일리스트%' THEN (SELECT COUNT(*) FROM stylist_applicant WHERE ds_pid = s.ds_pid)
                WHEN (ds_type LIKE '%세미나%' OR ds_type LIKE '%교육%') THEN (SELECT COUNT(*) FROM seminar_applicant WHERE ds_pid = s.ds_pid)
                WHEN ds_type LIKE '%훈련%' THEN (SELECT COUNT(*) FROM sports_applicant WHERE ds_pid = s.ds_pid)
                ELSE (SELECT COUNT(*) FROM stylist_applicant WHERE ds_pid = s.ds_pid)
            END as applicant_count
            FROM stylist s ORDER BY ds_date DESC, ds_pid DESC LIMIT 100", ARRAY_A);
        foreach ($stylist_data as $row) {
            $raw_cat = trim($row['ds_type'] ?? '반려견 스타일리스트 경연대회');
            $original_cat = (empty($raw_cat)) ? '반려견 스타일리스트 경연대회' : $raw_cat;
            
            // [GROUP FIX]
            $cat = $original_cat;
            if ($original_cat === '반려견 스타일리스트 경연대회(국제)') {
                $cat = '반려견 스타일리스트 경연대회(국제)';
            } else if (strpos($original_cat, '반려견 스타일리스트 경연대회') !== false) {
                $cat = '반려견 스타일리스트 경연대회';
            } else if (in_array($original_cat, ['세미나', '교육 및 테스트', '교육'])) {
                $cat = '세미나';
            }

            if ($filter_cat !== '전체') {
                if ($filter_cat === '반려견 스타일리스트 경연대회' || $filter_cat === '반려견 스타일리스트 경연대회(국제)') {
                    if ($cat !== $filter_cat && $original_cat !== $filter_cat) continue;
                } else {
                    if (strpos($cat, $filter_cat) === false && strpos($filter_cat, $cat) === false && strpos($original_cat, $filter_cat) === false) continue;
                }
            }

            $venue = trim($row['ds_place'] ?? ' ');
            if (!$venue) $venue = " ";
            
            $organizer = trim($row['ds_organizer'] ?? '');
            if (!$organizer || $organizer === '주최 미지정') $organizer = "(사)한국애견협회";

            $s_time = (!empty($row['ds_start_time']) && $row['ds_start_time'] !== '00:00:00') ? substr($row['ds_start_time'], 0, 5) : '10:00';
            $e_time = (!empty($row['ds_end_time']) && $row['ds_end_time'] !== '00:00:00') ? substr($row['ds_end_time'], 0, 5) : '18:00';

            $events[] = [
                'id' => 'st_' . ($row['ds_pid'] ?? 0),
                'ID' => 'st_' . ($row['ds_pid'] ?? 0),
                'title' => $row['ds_name'],
                'post_title' => $row['ds_name'],
                'category' => $cat,
                'type_names' => $original_cat,
                'startDate' => $row['ds_date'],
                'endDate' => (isset($row['ds_end_date']) && $row['ds_end_date'] !== '0000-00-00') ? $row['ds_end_date'] : $row['ds_date'],
                'startTime' => $s_time,
                'endTime' => $e_time,
                'actual_start_dt' => $row['ds_date'] . ' ' . $s_time,
                'actual_end_dt' => ($row['ds_end_date'] ?? $row['ds_date']) . ' ' . $e_time,

                // 접수 기간 로드
                'reg_start_date' => $row['reg_start_date'] ?? '',
                'reg_end_date' => $row['reg_end_date'] ?? '',
                'reg_start_h' => isset($row['reg_start_time']) ? substr($row['reg_start_time'], 0, 2) : '09',
                'reg_start_m' => isset($row['reg_start_time']) ? substr($row['reg_start_time'], 3, 2) : '00',
                'reg_end_h' => isset($row['reg_end_time']) ? substr($row['reg_end_time'], 0, 2) : '17',
                'reg_end_m' => isset($row['reg_end_time']) ? substr($row['reg_end_time'], 3, 2) : '00',

                'venue' => $venue,
                'event_venue' => $venue,
                'venue_name' => $venue,
                'location' => $venue,
                
                'organizer' => $organizer,
                'organizer_name' => $organizer,
                'event_organizer' => $organizer,
                
                'content' => $row['ds_content'] ?? '',
                'post_content' => $row['ds_content'] ?? '',
                'thumbnail_url' => $row['ds_thumbnail'] ?? '',
                'is_multi_day' => (int)($row['is_multi_day'] ?? 0),
                'judges' => $row['ds_etc'] ?? '',
                'ds_etc' => $row['ds_etc'] ?? '',
                'applicant_count' => (int)($row['applicant_count'] ?? 0),
                'source' => 'stylist'
            ];
        }
    }
    // 3. 훈련/스포츠 (sports_event) 조회
    if ($show_sports) {
        $where_sp = "1=1";
        if (!empty($search)) $where_sp .= $wpdb->prepare(" AND ds_name LIKE %s", '%' . $search . '%');
        $sports_data = $wpdb->get_results("
            SELECT sp.*,
            CASE 
                WHEN ds_type LIKE '%어질리티%' THEN (SELECT COUNT(*) FROM agility_applicant WHERE ds_pid = sp.ds_pid)
                WHEN ds_type LIKE '%디스크독%' THEN (SELECT COUNT(*) FROM discdog_applicant WHERE ds_pid = sp.ds_pid)
                WHEN ds_type LIKE '%플라이볼%' THEN (SELECT COUNT(*) FROM flyball_applicant WHERE ds_pid = sp.ds_pid)
                WHEN ds_type LIKE '%스타일리스트%' AND ds_type LIKE '%(국제)%' THEN (SELECT COUNT(*) FROM stylist_intl_applicant WHERE ds_pid = sp.ds_pid)
                WHEN ds_type LIKE '%스타일리스트%' THEN (SELECT COUNT(*) FROM stylist_applicant WHERE ds_pid = sp.ds_pid)
                WHEN (ds_type LIKE '%세미나%' OR ds_type LIKE '%교육%') THEN (SELECT COUNT(*) FROM seminar_applicant WHERE ds_pid = sp.ds_pid)
                WHEN ds_type LIKE '%훈련%' THEN (SELECT COUNT(*) FROM sports_applicant WHERE ds_pid = sp.ds_pid)
                ELSE (SELECT COUNT(*) FROM sports_applicant WHERE ds_pid = sp.ds_pid)
            END as applicant_count
            FROM sports_event sp WHERE $where_sp ORDER BY ds_date DESC, ds_pid DESC LIMIT 100", ARRAY_A);
        foreach ($sports_data as $row) {
            $raw_cat = trim($row['ds_type'] ?? '훈련 경기대회');
            $original_cat = (empty($raw_cat)) ? '훈련 경기대회' : $raw_cat;

            // [GROUP FIX]
            $cat = $original_cat;
            if (in_array($original_cat, ['훈련 대회', '훈련대회', '훈련 경기대회', '어질리티', '디스크독', '플라이볼'])) {
                $cat = '훈련 경기대회';
            } else if (in_array($original_cat, ['세미나', '교육 및 테스트', '교육'])) {
                $cat = '세미나';
            }

            if ($filter_cat !== '전체' && strpos($cat, $filter_cat) === false && strpos($filter_cat, $cat) === false && strpos($original_cat, $filter_cat) === false) continue;

            $venue = trim($row['ds_place'] ?? ' ');
            if (!$venue) $venue = " ";
            $organizer = trim($row['ds_organizer'] ?? '(사)한국애견협회');
            $s_time = (!empty($row['ds_start_time']) && $row['ds_start_time'] !== '00:00:00') ? substr($row['ds_start_time'], 0, 5) : '10:00';
            $e_time = (!empty($row['ds_end_time']) && $row['ds_end_time'] !== '00:00:00') ? substr($row['ds_end_time'], 0, 5) : '18:00';

            $events[] = [
                'id' => 'sp_' . ($row['ds_pid'] ?? 0),
                'ID' => 'sp_' . ($row['ds_pid'] ?? 0),
                'title' => $row['ds_name'],
                'post_title' => $row['ds_name'],
                'category' => $cat,
                'type_names' => $original_cat,
                'startDate' => $row['ds_date'],
                'endDate' => (isset($row['ds_end_date']) && $row['ds_end_date'] !== '0000-00-00') ? $row['ds_end_date'] : $row['ds_date'],
                'startTime' => $s_time,
                'endTime' => $e_time,
                'actual_start_dt' => $row['ds_date'] . ' ' . $s_time,
                'actual_end_dt' => ($row['ds_end_date'] ?? $row['ds_date']) . ' ' . $e_time,
                'reg_start_date' => $row['reg_start_date'] ?? '',
                'reg_end_date' => $row['reg_end_date'] ?? '',
                'reg_start_h' => isset($row['reg_start_time']) ? substr($row['reg_start_time'], 0, 2) : '09',
                'reg_start_m' => isset($row['reg_start_time']) ? substr($row['reg_start_time'], 3, 2) : '00',
                'reg_end_h' => isset($row['reg_end_time']) ? substr($row['reg_end_time'], 0, 2) : '17',
                'reg_end_m' => isset($row['reg_end_time']) ? substr($row['reg_end_time'], 3, 2) : '00',
                'venue' => $venue,
                'organizer' => $organizer,
                'content' => $row['ds_content'] ?? '',
                'thumbnail_url' => $row['ds_thumbnail'] ?? '',
                'is_multi_day' => (int)($row['is_multi_day'] ?? 0),
                'judges' => $row['ds_etc'] ?? '',
                'applicant_count' => (int)($row['applicant_count'] ?? 0),
                'source' => 'sports'
            ];
        }
    }

    // 4. 세미나 (seminar) 조회
    if ($show_seminar) {
        $where_sm = "1=1";
        if (!empty($search)) $where_sm .= $wpdb->prepare(" AND ds_name LIKE %s", '%' . $search . '%');
        $seminar_data = $wpdb->get_results("
            SELECT sm.*, 
            CASE 
                WHEN ds_type LIKE '%어질리티%' THEN (SELECT COUNT(*) FROM agility_applicant WHERE ds_pid = sm.ds_pid)
                WHEN ds_type LIKE '%디스크독%' THEN (SELECT COUNT(*) FROM discdog_applicant WHERE ds_pid = sm.ds_pid)
                WHEN ds_type LIKE '%플라이볼%' THEN (SELECT COUNT(*) FROM flyball_applicant WHERE ds_pid = sm.ds_pid)
                WHEN ds_type LIKE '%스타일리스트%' AND ds_type LIKE '%(국제)%' THEN (SELECT COUNT(*) FROM stylist_intl_applicant WHERE ds_pid = sm.ds_pid)
                WHEN ds_type LIKE '%스타일리스트%' THEN (SELECT COUNT(*) FROM stylist_applicant WHERE ds_pid = sm.ds_pid)
                WHEN (ds_type LIKE '%세미나%' OR ds_type LIKE '%교육%') THEN (SELECT COUNT(*) FROM seminar_applicant WHERE ds_pid = sm.ds_pid)
                WHEN ds_type LIKE '%훈련%' THEN (SELECT COUNT(*) FROM sports_applicant WHERE ds_pid = sm.ds_pid)
                ELSE (SELECT COUNT(*) FROM seminar_applicant WHERE ds_pid = sm.ds_pid)
            END as applicant_count
            FROM seminar sm WHERE $where_sm ORDER BY ds_date DESC, ds_pid DESC LIMIT 100", ARRAY_A);
        foreach ($seminar_data as $row) {
            $raw_cat = trim($row['ds_type'] ?? '세미나');
            $original_cat = (empty($raw_cat)) ? '세미나' : $raw_cat;
            $cat = $original_cat;
            $venue = trim($row['ds_place'] ?? ' ');
            $organizer = trim($row['ds_organizer'] ?? '(사)한국애견협회');
            $s_time = (!empty($row['ds_start_time']) && $row['ds_start_time'] !== '00:00:00') ? substr($row['ds_start_time'], 0, 5) : '10:00';
            $e_time = (!empty($row['ds_end_time']) && $row['ds_end_time'] !== '00:00:00') ? substr($row['ds_end_time'], 0, 5) : '18:00';

            $events[] = [
                'id' => 'sm_' . ($row['ds_pid'] ?? 0),
                'ID' => 'sm_' . ($row['ds_pid'] ?? 0),
                'title' => $row['ds_name'],
                'post_title' => $row['ds_name'],
                'category' => $cat,
                'type_names' => $original_cat,
                'startDate' => $row['ds_date'],
                'endDate' => (isset($row['ds_end_date']) && $row['ds_end_date'] !== '0000-00-00') ? $row['ds_end_date'] : $row['ds_date'],
                'startTime' => $s_time,
                'endTime' => $e_time,
                'actual_start_dt' => $row['ds_date'] . ' ' . $s_time,
                'actual_end_dt' => ($row['ds_end_date'] ?? $row['ds_date']) . ' ' . $e_time,
                'reg_start_date' => $row['reg_start_date'] ?? '',
                'reg_end_date' => $row['reg_end_date'] ?? '',
                'reg_start_h' => isset($row['reg_start_time']) ? substr($row['reg_start_time'], 0, 2) : '09',
                'reg_start_m' => isset($row['reg_start_time']) ? substr($row['reg_start_time'], 3, 2) : '00',
                'reg_end_h' => isset($row['reg_end_time']) ? substr($row['reg_end_time'], 0, 2) : '17',
                'reg_end_m' => isset($row['reg_end_time']) ? substr($row['reg_end_time'], 3, 2) : '00',
                'venue' => $venue,
                'organizer' => $organizer,
                'content' => $row['ds_content'] ?? '',
                'thumbnail_url' => $row['ds_thumbnail'] ?? '',
                'is_multi_day' => (int)($row['is_multi_day'] ?? 0),
                'judges' => $row['ds_etc'] ?? '',
                'applicant_count' => (int)($row['applicant_count'] ?? 0),
                'source' => 'seminar'
            ];
        }
    }

    // 5. 종견 인정 평가 (breed_exam) 조회
    if ($show_breed) {
        $where_be = "1=1";
        if (!empty($search)) $where_be .= $wpdb->prepare(" AND ds_name LIKE %s", '%' . $search . '%');
        $breed_exam_data = $wpdb->get_results("
            SELECT be.*, 
            (SELECT COUNT(*) FROM breed_exam_applicant WHERE ds_pid = be.ds_pid) as applicant_count
            FROM breed_exam be WHERE $where_be ORDER BY ds_date DESC, ds_pid DESC LIMIT 100", ARRAY_A);
        foreach ($breed_exam_data as $row) {
            $raw_cat = trim($row['ds_type'] ?? '종견인정검사');
            $original_cat = (empty($raw_cat)) ? '종견인정검사' : $raw_cat;

            // [GROUP FIX]
            $cat = $original_cat;
            if (strpos($original_cat, '종견') !== false) {
                $cat = '종견인정검사';
            }

            if ($filter_cat !== '전체' && strpos($cat, $filter_cat) === false && strpos($filter_cat, $cat) === false && strpos($original_cat, $filter_cat) === false) continue;

            $venue = trim($row['ds_place'] ?? ' ');
            $organizer = trim($row['ds_organizer'] ?? '(사)한국애견협회');
            $s_time = (!empty($row['ds_start_time']) && $row['ds_start_time'] !== '00:00:00') ? substr($row['ds_start_time'], 0, 5) : '10:00';
            $e_time = (!empty($row['ds_end_time']) && $row['ds_end_time'] !== '00:00:00') ? substr($row['ds_end_time'], 0, 5) : '18:00';

            $events[] = [
                'id' => 'be_' . ($row['ds_pid'] ?? 0),
                'ID' => 'be_' . ($row['ds_pid'] ?? 0),
                'title' => $row['ds_name'],
                'post_title' => $row['ds_name'],
                'category' => $cat,
                'type_names' => $original_cat,
                'startDate' => $row['ds_date'],
                'endDate' => (isset($row['ds_end_date']) && $row['ds_end_date'] !== '0000-00-00') ? $row['ds_end_date'] : $row['ds_date'],
                'startTime' => $s_time,
                'endTime' => $e_time,
                'actual_start_dt' => $row['ds_date'] . ' ' . $s_time,
                'actual_end_dt' => ($row['ds_end_date'] ?? $row['ds_date']) . ' ' . $e_time,
                'reg_start_date' => $row['reg_start_date'] ?? '',
                'reg_end_date' => $row['reg_end_date'] ?? '',
                'reg_start_h' => isset($row['reg_start_time']) ? substr($row['reg_start_time'], 0, 2) : '09',
                'reg_start_m' => isset($row['reg_start_time']) ? substr($row['reg_start_time'], 3, 2) : '00',
                'reg_end_h' => isset($row['reg_end_time']) ? substr($row['reg_end_time'], 0, 2) : '17',
                'reg_end_m' => isset($row['reg_end_time']) ? substr($row['reg_end_time'], 3, 2) : '00',
                'venue' => $venue,
                'organizer' => $organizer,
                'content' => $row['ds_content'] ?? '',
                'thumbnail_url' => $row['ds_thumbnail'] ?? '',
                'is_multi_day' => (int)($row['is_multi_day'] ?? 0),
                'judges' => $row['ds_etc'] ?? '',
                'applicant_count' => (int)($row['applicant_count'] ?? 0),
                'source' => 'breed_exam'
            ];
        }
    }

    return ['success' => true, 'data' => $events, 'total' => count($events)];
}

function kkc_handle_event_save($input) {
    global $wpdb; $data = $input['data'];
    $category = $data['type_names'] ?? $data['category'] ?? '도그쇼';
    $id_raw = $data['ID'] ?? $data['id'] ?? '';
    
    $sports_cats = ['훈련 대회', '훈련대회', '훈련 경기대회', '어질리티', '디스크독', '플라이볼'];
    $is_sports = false;
    foreach ($sports_cats as $sc) { if (strpos($category, $sc) !== false) $is_sports = true; }
    
    $is_stylist = (bool)strpos($category, '스타일리스트');
    $is_seminar = (bool)strpos($category, '세미나');
    $is_breed = (bool)strpos($category, '종견');
    
    $table = 'dogshow';
    $prefix = 'ds_';
    if ($is_stylist) { $table = 'stylist'; $prefix = 'st_'; }
    else if ($is_sports) { $table = 'sports_event'; $prefix = 'sp_'; }
    else if ($is_seminar) { $table = 'seminar'; $prefix = 'sm_'; }
    else if ($is_breed) { $table = 'breed_exam'; $prefix = 'be_'; }

    // 🚀 [DT FIX] event_start_datetime 이 있으면 이를 우선적으로 파싱합니다.
    $s_datetime = $data['event_start_datetime'] ?? '';
    if ($s_datetime && strpos($s_datetime, ' ') !== false) {
        $parts = explode(' ', $s_datetime);
        $s_date = $parts[0];
        $s_time = $parts[1];
    } else {
        $s_date = $data['startDate'] ?? date('Y-m-d');
        $s_time = (isset($data['startTime']) && strlen($data['startTime']) >= 5) ? substr($data['startTime'], 0, 5) . ':00' : '10:00:00';
    }

    $e_datetime = $data['event_end_datetime'] ?? '';
    if ($e_datetime && strpos($e_datetime, ' ') !== false) {
        $parts = explode(' ', $e_datetime);
        $e_date = $parts[0];
        $e_time = $parts[1];
    } else {
        $e_date = $data['endDate'] ?? $s_date;
        $e_time = (isset($data['endTime']) && strlen($data['endTime']) >= 5) ? substr($data['endTime'], 0, 5) . ':00' : '18:00:00';
    }

    // 🚀 [REG FIX] 접수 기간 파싱
    $reg_start_date = !empty($data['reg_start_date']) ? $data['reg_start_date'] : null;
    $reg_start_h = $data['reg_start_h'] ?? '09';
    $reg_start_m = $data['reg_start_m'] ?? '00';
    $reg_start_time = "$reg_start_h:$reg_start_m:00";

    $reg_end_date = !empty($data['reg_end_date']) ? $data['reg_end_date'] : null;
    $reg_end_h = $data['reg_end_h'] ?? '17';
    $reg_end_m = $data['reg_end_m'] ?? '00';
    $reg_end_time = "$reg_end_h:$reg_end_m:00";

    $map = [
        'ds_type' => $category, 
        'ds_name' => $data['post_title'] ?? $data['title'] ?? '제목없음',
        'ds_subtitle' => $data['subtitle'] ?? $data['ds_subtitle'] ?? '', 
        'ds_place' => $data['event_venue'] ?? $data['venue'] ?? '',
        'ds_date' => $s_date, 
        'ds_start_time' => $s_time,
        'ds_end_date' => $e_date, 
        'ds_end_time' => $e_time,
        'is_multi_day' => (int)($data['is_multi_day'] ?? 0),
        'reg_start_date' => $reg_start_date,
        'reg_start_time' => $reg_start_time,
        'reg_end_date' => $reg_end_date,
        'reg_end_time' => $reg_end_time,
        'ds_thumbnail' => $data['thumbnail_url'] ?? '',
        'ds_content' => $data['post_content'] ?? $data['content'] ?? '',
        'ds_etc' => $data['judges'] ?? ''
    ];

    // 주최(ds_organizer) 컬럼이 존재하는지 확인 후 데이터 추가 (Unknown column 오류 방지)
    $column_exists = $wpdb->get_results($wpdb->prepare("SHOW COLUMNS FROM `$table` LIKE %s", 'ds_organizer'));
    if (!empty($column_exists)) {
        $map['ds_organizer'] = $data['event_organizer'] ?? $data['organizer'] ?? '(사)한국애견협회';
    }

    $pid = (int)preg_replace('/[^0-9]/', '', (string)$id_raw);
    if ($pid > 0) $wpdb->update($table, $map, ['ds_pid' => $pid]);
    else { $wpdb->insert($table, $map); $pid = $wpdb->insert_id; }
    return ['success' => true, 'id' => $prefix . $pid];
}

function kkc_handle_event_delete($input) {
    global $wpdb; $id = $input['id'] ?? '';
    if (!$id) return ['success' => false];
    
    $table = 'dogshow';
    if (strpos($id, 'st_') === 0) $table = 'stylist';
    else if (strpos($id, 'sp_') === 0) $table = 'sports_event';
    else if (strpos($id, 'sm_') === 0) $table = 'seminar';
    else if (strpos($id, 'be_') === 0) $table = 'breed_exam';
    
    $pid = (int)preg_replace('/[^0-9]/', '', $id);
    return ['success' => $wpdb->delete($table, ['ds_pid' => $pid]) !== false];
}

function kkc_handle_get_events($input) {
    global $wpdb; $type = $input['type'] ?? ''; $data = [];
    if ($type === 'type') {
        $results = $wpdb->get_results("SELECT t.term_id as id, t.name FROM {$wpdb->terms} t INNER JOIN {$wpdb->term_taxonomy} tt ON t.term_id = tt.term_id WHERE tt.taxonomy = 'kkf_event_category'");
        foreach($results as $r) $data[] = ['id' => $r->id, 'name' => $r->name];
    } else if ($type === 'venue' || $type === 'organizer') {
        $pt = ($type === 'venue') ? 'kkf_venue' : 'kkf_organizer';
        $results = $wpdb->get_results($wpdb->prepare("SELECT ID as id, post_title as name FROM {$wpdb->posts} WHERE post_type = %s AND post_status = 'publish'", $pt));
        foreach($results as $r) $data[] = ['id' => $r->id, 'name' => $r->name];
    }
    return ['success' => true, 'data' => $data];
}
EOD;


file_put_contents($handlers_dir . 'event_logic.php', $event_logic_code);

echo "✅ event_logic.php 배포 완료";
exit;
