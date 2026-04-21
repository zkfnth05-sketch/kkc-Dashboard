<?php
/**
 * 파일명: handlers/event_logic.php
 * 기능: 프론트엔드 하드코딩(KKC) 우회 및 상세창 누락 해결 (백엔드 강제 주입 버전)
 */

if (!defined('ABSPATH')) exit;

// 🚀 [STRICT MAPPING HELPERS] - 1:1 Table mapping as requested
function kkc_get_target_table($cat) {
    if (!$cat || $cat === '전체') return 'all';
    if (in_array($cat, ['도그쇼', '셰퍼드 전람회', '진도견 선발대회'])) return 'dogshow';
    if (strpos($cat, '스타일리스트') !== false) return 'stylist';
    if (in_array($cat, [
        '훈련 경기대회', '어질리티', '디스크독', '플라이볼', '훈련 대회', '훈련대회', 
        '독스포츠'
    ])) return 'sports_event';
    if (strpos($cat, '세미나') !== false || strpos($cat, '교육') !== false || $cat === '세미나 및 교육') return 'seminar';
    if (strpos($cat, '종견') !== false || strpos($cat, '인성평가') !== false || strpos($cat, '인정검사') !== false || $cat === '종견인정검사') return 'breed_exam';
    return 'dogshow';
}

function kkc_get_applicant_table_by_cat($cat) {
    if (strpos($cat, '종견') !== false || strpos($cat, '인성평가') !== false || strpos($cat, '인정검사') !== false) return 'breed_exam_applicant';
    if (strpos($cat, '어질리티') !== false) return 'agility_applicant';
    if (strpos($cat, '디스크독') !== false) return 'discdog_applicant';
    if (strpos($cat, '플라이볼') !== false) return 'flyball_applicant';
    if (strpos($cat, '훈련') !== false) return 'sports_applicant';
    if (strpos($cat, '스타일리스트') !== false) {
        if (strpos($cat, '(국제)') !== false) return 'stylist_intl_applicant';
        return 'stylist_applicant';
    }
    if (strpos($cat, '세미나') !== false || strpos($cat, '교육') !== false) return 'seminar_applicant';
    return 'dogshow_applicant';
}

function kkc_handle_event_list($input) {
    global $wpdb;
    $search = $input['search'] ?? '';
    $filter_cat = $input['category'] ?? '전체';
    $page = isset($input['page']) ? max(1, (int)$input['page']) : 1;
    $limit = isset($input['limit']) ? max(1, (int)$input['limit']) : 20;
    $offset = ($page - 1) * $limit;

    $target = kkc_get_target_table($filter_cat);
    $all_filtered_events = [];

    $tables_to_query = [];
    if ($target === 'all') {
        $tables_to_query = ['dogshow', 'stylist', 'sports_event', 'seminar', 'breed_exam'];
    } else {
        $tables_to_query = [$target];
    }

    foreach ($tables_to_query as $table) {
        $where = "1=1";
        if (!empty($search)) $where .= $wpdb->prepare(" AND ds_name LIKE %s", '%' . $search . '%');
        
        // 🚀 Fetch 300 instead of 1000 for better performance
        $results = $wpdb->get_results("SELECT * FROM $table WHERE $where ORDER BY ds_date DESC LIMIT 300", ARRAY_A);
        if (empty($results)) continue;

        // 🚀 [BATCH COUNT OPTIMIZATION] 행마다 쿼리하지 않고 한 번에 가져오기
        $pids = array_column($results, 'ds_pid');
        $id_list = implode(',', array_map('intval', $pids));
        
        // 테이블별 신청자 수 미리 취합
        $counts_by_table = [];
        $app_tables_needed = [];
        foreach ($results as $row) {
            $cat_for_table = trim($row['ds_type'] ?? '');
            if (!$cat_for_table) {
                if ($table === 'dogshow') $cat_for_table = '도그쇼';
                else if ($table === 'stylist') $cat_for_table = '반려견 스타일리스트 경연대회';
                else if ($table === 'sports_event') $cat_for_table = '훈련 경기대회';
                else if ($table === 'seminar') $cat_for_table = '세미나';
                else if ($table === 'breed_exam') $cat_for_table = '종견인정검사';
            }
            $app_table_name = kkc_get_applicant_table_by_cat($cat_for_table);
            $app_tables_needed[$app_table_name][] = (int)$row['ds_pid'];
        }

        $all_counts = [];
        foreach ($app_tables_needed as $t_name => $ids) {
            $id_str = implode(',', $ids);
            $count_results = $wpdb->get_results("SELECT ds_pid, COUNT(*) as cnt FROM $t_name WHERE ds_pid IN ($id_str) GROUP BY ds_pid", ARRAY_A);
            foreach ($count_results as $cr) {
                $all_counts[$t_name . '_' . $cr['ds_pid']] = (int)$cr['cnt'];
            }
        }

        foreach ($results as $row) {
            $raw_type = trim($row['ds_type'] ?? '');
            
            // 🚀 [LOGICAL MAPPING]
            $cat = $raw_type;
            if (!$cat) {
                if ($table === 'dogshow') $cat = '도그쇼';
                else if ($table === 'stylist') $cat = '반려견 스타일리스트 경연대회';
                else if ($table === 'sports_event') $cat = '훈련 경기대회';
                else if ($table === 'seminar') $cat = '세미나';
                else if ($table === 'breed_exam') $cat = '종견인정검사';
            }

            // [STRICT FILTER]
            if ($filter_cat !== '전체' && $cat !== $filter_cat) continue;

            // 🚀 [STANDARD CATEGORY & PREFIX RE-MAPPING] 
            $prefix = 'ds_'; 
            if (strpos($cat, '스타일리스트') !== false) {
                $prefix = 'st_';
            } else if (in_array($cat, ['훈련 경기대회', '어질리티', '디스크독', '플라이볼', '독스포츠'])) {
                $prefix = 'sp_';
            } else if (strpos($cat, '세미나') !== false || strpos($cat, '교육') !== false) {
                $prefix = 'sm_';
                $cat = '세미나';
            } else if (strpos($cat, '종견') !== false || strpos($cat, '인정') !== false || strpos($cat, '인성평가') !== false) {
                $prefix = 'be_';
                $cat = '종견인정검사';
            } else if (strpos($cat, '셰퍼드') !== false || strpos($cat, '세퍼트') !== false) {
                $cat = '셰퍼드 전람회'; 
            } else if (strpos($cat, '진도') !== false) {
                $cat = '진도견 선발대회';
            }

            $app_table = kkc_get_applicant_table_by_cat($cat);
            $count = $all_counts[$app_table . '_' . $row['ds_pid']] ?? 0;

            $s_time = (!empty($row['ds_start_time']) && $row['ds_start_time'] !== '00:00:00') ? substr($row['ds_start_time'], 0, 5) : '10:00';
            $e_time = (!empty($row['ds_end_time']) && $row['ds_end_time'] !== '00:00:00') ? substr($row['ds_end_time'], 0, 5) : '18:00';
            $organizer = trim($row['ds_organizer'] ?? '');
            if (!$organizer || $organizer === '주최 미지정') $organizer = "(사)한국애견협회";

            $reg_s_h = !empty($row['reg_start_time']) ? substr($row['reg_start_time'], 0, 2) : '00';
            $reg_s_m = !empty($row['reg_start_time']) ? substr($row['reg_start_time'], 3, 2) : '00';
            $reg_e_h = !empty($row['reg_end_time']) ? substr($row['reg_end_time'], 0, 2) : '23';
            $reg_e_m = !empty($row['reg_end_time']) ? substr($row['reg_end_time'], 3, 2) : '59';

            $all_filtered_events[] = [
                'id' => $prefix . $row['ds_pid'],
                'ID' => $prefix . $row['ds_pid'],
                'title' => $row['ds_name'],
                'subtitle' => $row['ds_subtitle'] ?? '',
                'category' => $cat,
                'ds_type' => $raw_type, 
                'type_names' => $cat, 
                'startDate' => $row['ds_date'],
                'endDate' => (isset($row['ds_end_date']) && $row['ds_end_date'] !== '0000-00-00') ? $row['ds_end_date'] : $row['ds_date'],
                'startTime' => $s_time,
                'endTime' => $e_time,
                'actual_start_dt' => $row['ds_date'] . ' ' . $s_time,
                'actual_end_dt' => ($row['ds_end_date'] ?? $row['ds_date']) . ' ' . $e_time,
                'reg_start_date' => $row['reg_start_date'] ?? '',
                'reg_start_h' => $reg_s_h,
                'reg_start_m' => $reg_s_m,
                'reg_end_date' => $row['reg_end_date'] ?? '',
                'reg_end_h' => $reg_e_h,
                'reg_end_m' => $reg_e_m,
                'venue' => $row['ds_place'] ?? '',
                'organizer' => $organizer,
                'judges' => $row['ds_etc'] ?? '',
                'content' => $row['ds_content'] ?? '',
                'thumbnail_url' => $row['ds_thumbnail'] ?? '',
                'applicant_count' => (int)$count,
                'source' => $table
            ];
        }
    }

    // 🚀 Sort combined results by date (if multiple tables)
    usort($all_filtered_events, function($a, $b) {
        return strcmp($b['startDate'], $a['startDate']);
    });

    $total_count = count($all_filtered_events);
    $paged_events = array_slice($all_filtered_events, $offset, $limit);

    return ['success' => true, 'data' => $paged_events, 'total' => $total_count];
}

function kkc_handle_event_save($input) {
    global $wpdb; $data = $input['data'];
    $category = $data['type_names'] ?? $data['category'] ?? '도그쇼';
    $id_raw = $data['ID'] ?? $data['id'] ?? '';
    
    $table = kkc_get_target_table($category);
    
    $prefix = 'ds_';
    if ($table === 'stylist') $prefix = 'st_';
    else if ($table === 'sports_event') $prefix = 'sp_';
    else if ($table === 'seminar') $prefix = 'sm_';
    else if ($table === 'breed_exam') $prefix = 'be_';

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
    
    $prefix = substr($id, 0, 3);
    $table = 'dogshow';
    if ($prefix === 'st_') $table = 'stylist';
    else if ($prefix === 'sp_') $table = 'sports_event';
    else if ($prefix === 'sm_') $table = 'seminar';
    else if ($prefix === 'be_') $table = 'breed_exam';
    
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
