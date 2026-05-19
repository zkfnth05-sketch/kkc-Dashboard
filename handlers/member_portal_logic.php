<?php
/**
 * 파일명: handlers/member_portal_logic.php (v25 - 인코딩 지능형 분리 최종본)
 * 기능: EUC-KR(회원)과 UTF-8(자격증/신청내역) 데이터를 완벽하게 혼합 처리
 */
if (!defined('KKF_PORTAL')) exit;

if (!function_exists('kkc_convert')) {
    function kkc_convert($data, $enc = 'EUC-KR', $to_utf8 = true) {
        if (is_array($data)) {
            foreach ($data as $k => $v) $data[$k] = kkc_convert($v, $enc, $to_utf8);
            return $data;
        }
        if (!is_string($data) || empty($data)) return $data;
        // 이미 UTF-8인 데이터는 변환 생략 (감지 로직)
        if ($to_utf8 && mb_check_encoding($data, 'UTF-8')) return $data;
        return $to_utf8 ? @mb_convert_encoding($data, 'UTF-8', 'CP949') : @mb_convert_encoding($data, 'CP949', 'UTF-8');
    }
}

function get_kkc_portal_db() {
    $conn = new mysqli('localhost', 'kkc3349', 'kkcdog3349**', 'kkc3349');
    if ($conn->connect_error) throw new Exception("DB 연결 실패");
    return $conn;
}

function kkf_portal_get_my_data($input) {
    try {
        $conn = get_kkc_portal_db();
        $u_id = trim($input['id'] ?? '');
        $u_mid = intval($input['mid'] ?? 0);
        
        // 🔒 [BINARY] memTab (EUC-KR)
        $conn->query("SET NAMES 'binary'");
        $sql_user = "SELECT * FROM memTab WHERE mid = $u_mid ";
        if (!empty($u_id)) $sql_user .= " OR id = '".$conn->real_escape_string($u_id)."' ";
        $u_raw = $conn->query($sql_user . " LIMIT 1")->fetch_assoc();
        
        if (!$u_raw) { $conn->close(); return ['success' => false, 'error' => '회원 조회 실패']; }
        $u = kkc_convert($u_raw, 'EUC-KR', true);

        // 🔒 [UTF8] pro_classTab & Applicant Tables (Already UTF-8)
        $conn->query("SET NAMES 'utf8mb4'");
        
        // 1. 자격증 마스터
        $pro_master = [];
        $res_master = $conn->query("SELECT * FROM pro_classTab ORDER BY uid ASC");
        if ($res_master) {
            while ($pm = $res_master->fetch_assoc()) {
                // 이미 UTF-8이므로 컨버터 없이 바로 수집
                $pro_master[] = $pm; 
            }
        }

        // 2. 신청 내역 조회
        $conn->query("SET NAMES 'utf8mb4'"); // 🛡️ [ROBUST CHARSET] UTF-8로 통신 설정

        $e_id = $conn->real_escape_string($u['id'] ?? ''); 
        $e_name = $conn->real_escape_string($u['name'] ?? ''); 
        $e_hp = str_replace('-', '', $u['hp'] ?? '');
        
        $apps = [];
        $targets = [
            '도그쇼' => ['dogshow_applicant', 'dogshow', true],
            '스타일리스트' => ['stylist_applicant', 'stylist', true],
            '어질리티' => ['agility_applicant', 'sports_event', true],
            '훈련경기' => ['sports_applicant', 'sports_event', true],
            '디스크독' => ['discdog_applicant', 'sports_event', true],
            '플라이볼' => ['flyball_applicant', 'sports_event', true],
            '세미나' => ['seminar_applicant', 'seminar', true],
            '종견인정' => ['breed_exam_applicant', 'breed_exam', true],
            '스타일리스트(국제)' => ['stylist_intl_applicant', 'stylist', true]
        ];

        foreach ($targets as $source => $info) {
            list($app_table, $evt_table, $has_id) = $info;

            // 🧬 [DYNAMIC COLUMN DETECTION] 
            // DB에 직접 물어봐서 진짜 컬럼명이 뭔지 알아냅니다.
            $actual_cols = [];
            $col_res = $conn->query("SHOW COLUMNS FROM $app_table");
            if ($col_res) {
                while($cf = $col_res->fetch_assoc()) {
                    $actual_cols[] = $cf['Field'];
                }
            }
            
            // 🧬 [ULTRA ROBUST COLUMN SELECTION] 
            // 혈통서 번호용 컬럼 후보들 중 값이 가장 먼저 발견되는 필드를 선택하도록 지능적 추출 (COALESCE 사용)
            $cols_to_check = [];
            if (in_array('reg_no', $actual_cols)) $cols_to_check[] = "NULLIF(a.reg_no, '')";
            if (in_array('pedigree_number', $actual_cols)) $cols_to_check[] = "NULLIF(a.pedigree_number, '')";
            if (in_array('pedigree_no', $actual_cols)) $cols_to_check[] = "NULLIF(a.pedigree_no, '')";

            $col_reg = !empty($cols_to_check) ? "COALESCE(" . implode(',', $cols_to_check) . ", '')" : "''";

            // 강아지 이름용 컬럼 찾기
            $col_dog = in_array('dog_name', $actual_cols) ? 'a.dog_name' : (in_array('dog_breed', $actual_cols) ? 'a.dog_breed' : (in_array('subject', $actual_cols) ? 'a.subject' : "''"));

            $where = " (a.name='$e_name' AND REPLACE(a.contact,'-','')='$e_hp') ";
            if ($has_id && !empty($e_id)) $where = " (a.handler_id='$e_id') OR " . $where;

            // 🚀 [ULTRA ROBUST QUERY]
            // 모든 대회 테이블은 공통적으로 ds_name을 사용합니다.
            $sql = "SELECT DISTINCT '$source' as source, a.created_at, b.ds_name as event_title, b.ds_date as event_date, 
                           a.payment_status, a.total_amount, a.options_summary,
                           $col_reg as reg_no, 
                           IFNULL(d.name, $col_dog) as dog_name
                      FROM $app_table a 
                      LEFT JOIN $evt_table b ON a.ds_pid = b.ds_pid 
                      LEFT JOIN dogTab d ON $col_reg = d.reg_no AND $col_reg != ''
                      WHERE $where 
                      ORDER BY a.created_at DESC";
            
            $res = $conn->query($sql);
            if ($res) {
                while($r = $res->fetch_assoc()) {
                    // DB가 Binary/EUC-KR일 수 있으므로 이름 및 옵션 컨버팅
                    if (!empty($r['dog_name'])) $r['dog_name'] = kkc_convert($r['dog_name'], 'EUC-KR', true);
                    if (!empty($r['options_summary'])) $r['options_summary'] = kkc_convert($r['options_summary'], 'EUC-KR', true);
                    if (!empty($r['event_title'])) $r['event_title'] = kkc_convert($r['event_title'], 'EUC-KR', true);
                    
                    $r['apply_date'] = $r['created_at'] ? date('Y-m-d', strtotime($r['created_at'])) : '';
                    $apps[] = $r;
                }
            }
        }

        // 3. 반려견 정보 (EUC-KR 로직으로 다시 Binary 세션 일시 전환 후 복구하거나 혹은 위에서 미리 받았어야 함)
        // 위 순서를 고려하여 미리 처리하거나, 다시 바이너리로 조회
        $conn->query("SET NAMES 'binary'");
        $dogs = [];
        $res_dogs = $conn->query("SELECT * FROM dogTab WHERE poss_id = '$e_id' OR poss_id = '$u_mid'");
        if ($res_dogs) {
            while($d = $res_dogs->fetch_assoc()) {
                $item = kkc_convert($d, 'EUC-KR', true);
                if(($item['sex'] ?? '') == '1') $item['sex'] = 'M';
                $dogs[] = $item;
            }
        }

        // 4. 직능(pro_class) 파서 (0/1 및 하이픈 하이브리드)
        $raw_pro_class = trim($u['pro_class'] ?? '');
        if (strpos($raw_pro_class, ',') !== false && (strpos($raw_pro_class, '1') !== false || strpos($raw_pro_class, '0') !== false)) {
            $bits = explode(',', $raw_pro_class);
            $my_pro_codes = [];
            foreach ($bits as $idx => $val) {
                if (trim($val) === '1' && isset($pro_master[$idx])) $my_pro_codes[] = $pro_master[$idx]['keyy']; 
            }
            if(!empty($my_pro_codes)) $u['pro_class'] = implode('-', $my_pro_codes);
        }

        $conn->close();
        usort($apps, function($a, $b) { return strcmp($b['created_at'] ?? '', $a['created_at'] ?? ''); });

        return [
            'success' => true, 
            'data' => [
                'profile' => $u, 
                'dogs' => $dogs, 
                'recentApplications' => array_slice($apps, 0, 20),
                'proClasses' => $pro_master
            ]
        ];

    } catch (Throwable $e) { return ['success' => false, 'error' => '데이터 조회 중 오류: ' . $e->getMessage()]; }
}

function kkf_portal_handle_login($input) {
    try {
        $conn = get_kkc_portal_db();
        $conn->query("SET NAMES 'binary'");
        $id = $conn->real_escape_string(trim($input['id'] ?? ''));
        $pw = $conn->real_escape_string(trim($input['pw'] ?? ''));
        $res = $conn->query("SELECT * FROM memTab WHERE id='$id' AND passwd='$pw' LIMIT 1");
        $u_raw = $res ? $res->fetch_assoc() : null;
        $conn->close();
        return $u_raw ? ['success'=>true, 'data'=>kkc_convert($u_raw, 'EUC-KR', true)] : ['success'=>false, 'error'=>'인증 실패'];
    } catch (Throwable $e) { return ['success'=>false, 'error'=>'로그인 오류: ' . $e->getMessage()]; }
}

/**
 * 🏅 [Portal] 회원 등급 신청 처리
 */
function kkf_portal_apply_membership($input) {
    try {
        $conn = get_kkc_portal_db();
        $conn->query("SET NAMES 'utf8'"); // 신청 내역은 UTF-8로 저장 시도

        // 🔍 [SERVER DEBUG LOG] - 루트 디렉토리에 로그를 남깁니다.
        $log_data = "\n--- [" . date('Y-m-d H:i:s') . "] ---\n" . "DATA: " . json_encode($input, JSON_UNESCAPED_UNICODE) . "\n";
        file_put_contents(dirname(dirname(__FILE__)) . '/debug_portal.txt', $log_data, FILE_APPEND);

        // 🧬 [FLEXIBLE INPUT PARSING] 
        $src = isset($input['data']) && is_array($input['data']) ? array_merge($input, $input['data']) : $input;

        $mid = intval($src['mid'] ?? 0);
        $req_degree = $conn->real_escape_string($src['req_degree'] ?? '');
        $req_years = intval($src['req_years'] ?? 1);
        $amount = intval($src['amount'] ?? 0);
        $depositor = $conn->real_escape_string($src['depositor'] ?? '');
        
        if (!$mid) {
             $mid = intval($input['mid'] ?? 0);
        }

        if (!$mid) {
             $conn->close();
             return ['success' => false, 'error' => '회원 고유번호(mid)를 찾을 수 없습니다.'];
        }

        // 1. 회원 정보 가져오기 (memTab 조회 - Binary 고려)
        $conn->query("SET NAMES 'binary'");
        $nm_res = $conn->query("SELECT name, id FROM memTab WHERE mid = $mid");
        $u = $nm_res ? $nm_res->fetch_assoc() : null;
        
        $name = $u ? kkc_convert($u['name'], 'EUC-KR', true) : '알수없음';
        $mem_no = $u['id'] ?? '';
        $e_name = $conn->real_escape_string($name);

        // 🧬 [DYNAMIC COLUMN DETECTION] 
        // membership_applications 테이블의 진짜 컬럼명을 알아옵니다.
        $actual_cols = [];
        $col_res = $conn->query("SHOW COLUMNS FROM membership_applications");
        if ($col_res) {
            while($cf = $col_res->fetch_assoc()) {
                $actual_cols[] = trim($cf['Field']); // 공백 등 혹시 모를 에러 방지용 trim
            }
        }

        // 2. 신청 데이터 구성 (에러 유발 가능성이 있는 필드 전면 제외)
        $data_map = [
            'mid' => $mid,
            'mem_no' => $mem_no,
            'name' => $e_name,
            'req_degree' => $req_degree,
            'req_years' => $req_years,
            'amount' => $amount,
            'depositor' => $depositor,
            'status' => 'P',
            'apply_date' => time() 
        ];
        
        $final_fields = [];
        $final_values = [];
        foreach ($data_map as $key => $val) {
            if (in_array($key, $actual_cols)) {
                $final_fields[] = "`$key`";
                $final_values[] = "'$val'";
            }
        }

        if (empty($final_fields)) {
            $conn->close();
            return ['success' => false, 'error' => '테이블 구조를 확인할 수 없습니다.'];
        }

        // 3. 신청 내역 저장
        $sql = "INSERT INTO membership_applications (" . implode(',', $final_fields) . ") 
                VALUES (" . implode(',', $final_values) . ")";
        
        $res = $conn->query($sql);
        $conn->close();

        if ($res) {
            return ['success' => true, 'message' => '회원 등급 신청이 완료되었습니다. 관리자 확인 후 처리됩니다.'];
        } else {
            return ['success' => false, 'error' => '데이터 저장 실패: ' . $conn->error];
        }

    } catch (Throwable $e) {
        return ['success' => false, 'error' => '신청 처리 중 오류: ' . $e->getMessage()];
    }
}

/**
 * 🔍 [Portal] 아이디 중복 검사
 */
function kkf_portal_check_id($input) {
    try {
        $conn = get_kkc_portal_db();
        $id = $conn->real_escape_string(trim($input['id'] ?? ''));
        if (empty($id)) return ['success' => false, 'error' => '아이디를 입력해 주세요.'];

        $res = $conn->query("SELECT mid FROM memTab WHERE id = '$id' LIMIT 1");
        $exists = ($res && $res->num_rows > 0);
        $conn->close();

        if ($exists) {
            return ['success' => true, 'available' => false, 'message' => '이미 사용 중인 아이디입니다.'];
        } else {
            return ['success' => true, 'available' => true, 'message' => '사용 가능한 아이디입니다.'];
        }
    } catch (Throwable $e) {
        return ['success' => false, 'error' => '중복 확인 도중 오류: ' . $e->getMessage()];
    }
}

/**
 * ✍️ [Portal] 신규 회원 가입
 */
function kkf_portal_register($input) {
    try {
        $conn = get_kkc_portal_db();
        $conn->query("SET NAMES 'binary'"); // DB가 EUC-KR(CP949)이므로 바이너리로 처리

        $src = isset($input['data']) && is_array($input['data']) ? $input['data'] : $input;
        
        // 🔒 필수 데이터 추출 및 인코딩 변환 (UTF8 -> CP949)
        $id = $conn->real_escape_string(trim($src['id'] ?? ''));
        $pw = $conn->real_escape_string(trim($src['passwd'] ?? ''));
        $name = kkc_convert(trim($src['name'] ?? ''), 'EUC-KR', false);
        $name_eng = $conn->real_escape_string(trim($src['name_eng'] ?? ''));
        $birth = $conn->real_escape_string(trim($src['birth'] ?? ''));
        $hp = $conn->real_escape_string(trim($src['hp'] ?? ''));
        $email = $conn->real_escape_string(trim($src['email'] ?? ''));
        
        if (empty($id) || empty($pw) || empty($name)) {
            $conn->close();
            return ['success' => false, 'error' => '필수 항목이 누락되었습니다.'];
        }

        // 🔒 휴대폰 번호 인증 확인 (개발자/테스트 환경이나 실서버 모두 보안 우회 방지)
        $hp_clean = str_replace('-', '', $hp);
        $verified_key = 'kkf_sms_verified_' . $hp_clean;
        if (!get_transient($verified_key)) {
            $conn->close();
            return ['success' => false, 'error' => '휴대폰 번호 인증이 완료되지 않았습니다.'];
        }

        // 🧬 [DYNAMIC COLUMN DETECTION] - memTab의 컬럼 존재 여부 확인
        $actual_cols = [];
        $col_res = $conn->query("SHOW COLUMNS FROM memTab");
        if ($col_res) {
            while($cf = $col_res->fetch_assoc()) $actual_cols[] = $cf['Field'];
        }

        // 🗺️ 데이터 매핑 (필드명이 존재하는 것만 골라냄)
        $data_map = [
            'id' => $id,
            'passwd' => $pw,
            'name' => $conn->real_escape_string($name),
            'name_eng' => $name_eng,
            'birth' => $birth,
            'hp' => $hp,
            'phone' => $conn->real_escape_string(trim($src['phone'] ?? '')),
            'email' => $email,
            'zipcode' => $conn->real_escape_string(trim($src['zipcode'] ?? '')),
            'addr' => kkc_convert($src['addr'] ?? '', 'EUC-KR', false),
            'addr_1' => kkc_convert($src['addr_1'] ?? '', 'EUC-KR', false),
            'zipcode2' => $conn->real_escape_string(trim($src['zipcode2'] ?? '')),
            'addr2' => kkc_convert($src['addr2'] ?? '', 'EUC-KR', false),
            'addr2_1' => kkc_convert($src['addr2_1'] ?? '', 'EUC-KR', false),
            'mem_degree' => 'B0', // 일반(가족)회원 기본값
            'mem_type' => 'P',   // 개인회원 기본값
            'signdate' => time(),
            'firstdate' => time(), // 🚀 [FIX] 가입일(1970-01-01 표기 오류) 누락 수정
            'client_ip' => $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'
        ];

        $fields = []; $values = [];
        foreach ($data_map as $key => $val) {
            if (in_array($key, $actual_cols)) {
                $fields[] = "`$key`";
                $values[] = "'$val'";
            }
        }

        $sql = "INSERT INTO memTab (" . implode(',', $fields) . ") VALUES (" . implode(',', $values) . ")";
        $res = $conn->query($sql);
        $conn->close();

        if ($res) {
            delete_transient($verified_key);
            return ['success' => true, 'message' => '회원 가입이 완료되었습니다.'];
        } else {
            return ['success' => false, 'error' => 'DB 저장 실패'];
        }

    } catch (Throwable $e) {
        return ['success' => false, 'error' => '회원 가입 중 오류: ' . $e->getMessage()];
    }
}

/**
 * 🗑️ [Portal] 신청 내역 삭제 처리
 */
function kkf_portal_delete_membership_applications($input) {
    try {
        $conn = get_kkc_portal_db();
        
        $uids = $input['uids'] ?? [];
        if (empty($uids) || !is_array($uids)) {
            $conn->close();
            return ['success' => false, 'error' => '삭제할 항목이 선택되지 않았습니다.'];
        }

        // 🛡️ 보안을 위해 숫자로 강제 변환
        $clean_uids = array_map('intval', $uids);
        $uid_list = implode(',', $clean_uids);

        $sql = "DELETE FROM membership_applications WHERE uid IN ($uid_list)";
        $res = $conn->query($sql);
        $count = $conn->affected_rows;
        $conn->close();

        if ($res) {
            return ['success' => true, 'message' => "성공적으로 {$count}건의 신청 내역을 삭제했습니다."];
        } else {
            return ['success' => false, 'error' => '삭제 도중 데이터베이스 오류가 발생했습니다.'];
        }
    } catch (Throwable $e) {
        return ['success' => false, 'error' => '삭제 처리 중 오류: ' . $e->getMessage()];
    }
}

/**
 * 🏛️ [Portal] 관리자용 신청 전체 목록 조회
 */
function kkf_portal_membership_applications_list($input) {
    try {
        $conn = get_kkc_portal_db();
        
        $page = intval($input['page'] ?? 1);
        $limit = 20;
        $offset = ($page - 1) * $limit;
        $search = $conn->real_escape_string(trim($input['search'] ?? ''));
        $status = $conn->real_escape_string(trim($input['status'] ?? 'all'));

        $where = " 1=1 ";
        if ($status !== 'all') $where .= " AND status = '$status' ";
        if ($search !== '') $where .= " AND (name LIKE '%$search%' OR depositor LIKE '%$search%') ";

        // 전체 카운트
        $total_res = $conn->query("SELECT COUNT(*) as cnt FROM membership_applications WHERE $where");
        $total = ($total_res) ? intval($total_res->fetch_assoc()['cnt']) : 0;

        // 목록 조회
        $sql = "SELECT * FROM membership_applications WHERE $where ORDER BY uid DESC LIMIT $offset, $limit";
        $res = $conn->query($sql);
        
        $data = [];
        if ($res) {
            while($row = $res->fetch_assoc()) {
                $data[] = $row;
            }
        }
        $conn->close();

        return [
            'success' => true,
            'data' => $data,
            'total' => $total,
            'page' => $page
        ];
    } catch (Throwable $e) {
        return ['success' => false, 'error' => '목록 조회 중 오류: ' . $e->getMessage()];
    }
}

/**
 * ⚖️ [Portal] 신청 내역 승인 또는 거절 처리
 */
function kkf_portal_membership_application_action($input) {
    try {
        $conn = get_kkc_portal_db();
        
        $uid = intval($input['uid'] ?? 0);
        $action = $input['action'] ?? ''; // 'approve' or 'reject'
        $memo = $conn->real_escape_string($input['memo'] ?? '');
        
        if (!$uid || !in_array($action, ['approve', 'reject'])) {
            $conn->close();
            return ['success' => false, 'error' => '유효하지 않은 요청입니다.'];
        }

        $new_status = ($action === 'approve') ? 'Y' : 'N';
        $process_date = time();

        // 1. 신청 내역 정보 가져오기
        $app_res = $conn->query("SELECT * FROM membership_applications WHERE uid = $uid LIMIT 1");
        $app = $app_res ? $app_res->fetch_assoc() : null;
        if (!$app) {
            $conn->close();
            return ['success' => false, 'error' => '신청 내역을 찾을 수 없습니다.'];
        }

        $mid = intval($app['mid']);
        $req_degree = $app['req_degree'];
        $req_years = intval($app['req_years']);

        // 2. 신청 내역 상태 업데이트
        $sql_up = "UPDATE membership_applications 
                    SET status = '$new_status', process_date = $process_date, admin_memo = '$memo' 
                    WHERE uid = $uid";
        $conn->query($sql_up);

        // 3. 승인 시 실제 회원 등급 및 유효기간 갱신
        if ($action === 'approve') {
            // 새 유효기간 계산 (오늘 기준)
            $new_end_date = ($req_years === 99) ? '2099-12-31' : date('Y-m-d', strtotime("+$req_years years"));
            
            $sql_member = "UPDATE memTab 
                           SET mem_degree = '$req_degree', end_date = '$new_end_date' 
                           WHERE mid = $mid";
            $conn->query($sql_member);
        }

        $conn->close();
        return ['success' => true, 'message' => ($action === 'approve' ? '승인 처리가 완료되었으며 회원 정보가 반영되었습니다.' : '거절 처리가 완료되었습니다.')];

    } catch (Throwable $e) {
        return ['success' => false, 'error' => '처리 중 오류: ' . $e->getMessage()];
    }
}

/**
 * 📝 [Portal] 내 정보 수정 (비밀번호, 연락처, 주소 등)
 */
function kkf_portal_update_my_data($input) {
    try {
        $conn = get_kkc_portal_db();
        $conn->query("SET NAMES 'binary'"); // DB 인코딩(CP949) 대응
        
        $mid = intval($input['mid'] ?? 0);
        if (!$mid) return ['success' => false, 'error' => '회원 식별 번호가 누락되었습니다.'];

        $src = $input['data'] ?? [];
        if (empty($src)) return ['success' => false, 'error' => '수정할 데이터가 없습니다.'];

        // 🧬 [DYNAMIC COLUMN DETECTION] - memTab의 실제 컬럼 확인
        $actual_cols = [];
        $col_res = $conn->query("SHOW COLUMNS FROM memTab");
        if ($col_res) {
            while($cf = $col_res->fetch_assoc()) $actual_cols[] = $cf['Field'];
        }

        // 🗺️ 수정 가능한 필드 매핑 및 인코딩 변환
        $fields_to_update = [];
        $allowed_fields = [
            'passwd' => 'plain', 'name' => 'euc-kr', 'name_eng' => 'euc-kr', // 🔠 영문명도 EUC-KR 처리 (DB 충돌 방지)
            'birth' => 'plain', 'email' => 'plain', 'hp' => 'plain', 'phone' => 'plain',
            'zipcode' => 'plain', 'addr' => 'euc-kr', 'addr_1' => 'euc-kr',
            'zipcode2' => 'plain', 'addr2' => 'euc-kr', 'addr2_1' => 'euc-kr'
        ];

        foreach ($allowed_fields as $key => $type) {
            if (isset($src[$key]) && in_array($key, $actual_cols)) {
                $val = trim($src[$key]);
                if (empty($val) && $key === 'passwd') continue; // 비밀번호 빈 값이면 수정 안 함
                
                if ($type === 'euc-kr') {
                    $val = kkc_convert($val, 'EUC-KR', false);
                }
                $safe_val = $conn->real_escape_string($val);
                $fields_to_update[] = "`$key` = '$safe_val'";
            }
        }

        if (empty($fields_to_update)) {
            $conn->close();
            return ['success' => false, 'error' => '수정 가능한 필드가 없습니다.'];
        }

        $sql = "UPDATE memTab SET " . implode(', ', $fields_to_update) . " WHERE mid = $mid";
        $res = $conn->query($sql);
        $conn->close();

        if ($res) return ['success' => true, 'message' => '정보가 성공적으로 수정되었습니다.'];
        else return ['success' => false, 'error' => '데이터베이스 업데이트 실패'];

    } catch (Throwable $e) {
        return ['success' => false, 'error' => '정보 수정 중 오류: ' . $e->getMessage()];
    }
}

/**
 * 🔒 [Portal] 자체 Transient(만료기능 임시 저장소) 구현 (워드프레스 비종속)
 */
function kkc_init_transient_table($conn) {
    $sql = "CREATE TABLE IF NOT EXISTS kkc_transients (
        t_key VARCHAR(100) PRIMARY KEY,
        t_value TEXT NOT NULL,
        expires INT NOT NULL,
        INDEX (expires)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8";
    $conn->query($sql);
}

if (!function_exists('set_transient')) {
    function set_transient($key, $value, $duration) {
        try {
            $conn = get_kkc_portal_db();
            kkc_init_transient_table($conn);
            $key_esc = $conn->real_escape_string($key);
            $val_esc = $conn->real_escape_string($value);
            $expires = time() + intval($duration);
            
            $sql = "INSERT INTO kkc_transients (t_key, t_value, expires) 
                    VALUES ('$key_esc', '$val_esc', $expires) 
                    ON DUPLICATE KEY UPDATE t_value = '$val_esc', expires = $expires";
            $conn->query($sql);
            $conn->close();
            return true;
        } catch (Throwable $e) {
            return false;
        }
    }
}

if (!function_exists('get_transient')) {
    function get_transient($key) {
        try {
            $conn = get_kkc_portal_db();
            kkc_init_transient_table($conn);
            $key_esc = $conn->real_escape_string($key);
            $now = time();
            
            // 1% 확률로 만료 데이터 청소
            if (mt_rand(1, 100) === 1) {
                $conn->query("DELETE FROM kkc_transients WHERE expires < $now");
            }
            
            $sql = "SELECT t_value FROM kkc_transients WHERE t_key = '$key_esc' AND expires >= $now LIMIT 1";
            $res = $conn->query($sql);
            $row = $res ? $res->fetch_assoc() : null;
            $conn->close();
            
            return $row ? $row['t_value'] : false;
        } catch (Throwable $e) {
            return false;
        }
    }
}

if (!function_exists('delete_transient')) {
    function delete_transient($key) {
        try {
            $conn = get_kkc_portal_db();
            kkc_init_transient_table($conn);
            $key_esc = $conn->real_escape_string($key);
            $sql = "DELETE FROM kkc_transients WHERE t_key = '$key_esc'";
            $conn->query($sql);
            $conn->close();
            return true;
        } catch (Throwable $e) {
            return false;
        }
    }
}

/**
 * 📱 알리고 SMS 전송 헬퍼 함수
 */
function kkf_portal_send_aligo_sms($receiver, $msg) {
    $api_url = "https://apis.aligo.in/send/";
    
    $post_data = [
        'key' => '0igka2rc8xvodn3dfaa1trcit0egkjai',
        'userid' => 'kkcdog',
        'sender' => '010-9999-3349',
        'receiver' => str_replace('-', '', $receiver),
        'msg' => $msg,
        'msg_type' => 'SMS'
    ];

    $ch = curl_init($api_url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $res = curl_exec($ch);
    curl_close($ch);

    $json = json_decode($res, true);
    if ($json && intval($json['result_code'] ?? 0) === 1) {
        return ['success' => true, 'data' => $json];
    } else {
        $err = $json['message'] ?? '알리고 API 전송 응답 오류';
        return ['success' => false, 'error' => $err];
    }
}

/**
 * 📱 [Portal] 회원가입용 SMS 인증번호 발송
 */
function kkf_portal_send_sms_verification($input) {
    try {
        $hp = trim($input['hp'] ?? '');
        $hp_clean = str_replace('-', '', $hp);
        if (empty($hp_clean) || strlen($hp_clean) < 10) {
            return ['success' => false, 'error' => '올바른 휴대폰 번호를 입력해 주세요.'];
        }

        $code = sprintf("%06d", mt_rand(100000, 999999));
        set_transient('kkf_sms_reg_' . $hp_clean, $code, 180);

        $msg = "[KKC 한국애견협회] 본인인증 번호는 [" . $code . "] 입니다. (3분 이내 입력)";
        $res = kkf_portal_send_aligo_sms($hp_clean, $msg);

        // 📝 알리고 잔액 충전 전에도 테스트가 가능하도록 debug_sms.txt 에 인증코드 기록
        $debug_msg = "[" . date('Y-m-d H:i:s') . "] 수신: $hp_clean, 내용: $msg (코드: $code)\n";
        @file_put_contents(dirname(__FILE__) . '/../debug_sms.txt', $debug_msg);
        @file_put_contents(dirname(__FILE__) . '/debug_sms.txt', $debug_msg);

        if ($res['success']) {
            return ['success' => true, 'message' => '인증번호가 발송되었습니다.'];
        } else {
            return [
                'success' => true, 
                'message' => '인증번호 생성 완료 (알리고 잔액 부족으로 문자 발송실패). 테스트용 코드가 debug_sms.txt에 임시 저장되었습니다.'
            ];
        }
    } catch (Throwable $e) {
        return ['success' => false, 'error' => '인증번호 발송 중 오류: ' . $e->getMessage()];
    }
}

/**
 * 📱 [Portal] 회원가입용 SMS 인증번호 검증
 */
function kkf_portal_verify_sms_code($input) {
    try {
        $hp = trim($input['hp'] ?? '');
        $hp_clean = str_replace('-', '', $hp);
        $code = trim($input['code'] ?? '');

        if (empty($hp_clean) || empty($code)) {
            return ['success' => false, 'error' => '휴대폰 번호와 인증번호를 모두 입력해 주세요.'];
        }

        $saved_code = get_transient('kkf_sms_reg_' . $hp_clean);
        if (!$saved_code) {
            return ['success' => false, 'error' => '인증 코드가 만료되었거나 발송 내역이 없습니다.'];
        }

        if ($saved_code === $code) {
            set_transient('kkf_sms_verified_' . $hp_clean, 'Y', 600);
            delete_transient('kkf_sms_reg_' . $hp_clean);
            return ['success' => true, 'message' => '휴대폰 인증이 성공적으로 완료되었습니다.'];
        } else {
            return ['success' => false, 'error' => '인증번호가 일치하지 않습니다. 다시 확인해 주세요.'];
        }
    } catch (Throwable $e) {
        return ['success' => false, 'error' => '인증번호 확인 중 오류: ' . $e->getMessage()];
    }
}

/**
 * 🔒 [Portal] 비밀번호 찾기 (이름, 생년월일, 연락처 체크 후 SMS 인증번호 발송)
 */
function kkf_portal_find_pw_send_sms($input) {
    try {
        $conn = get_kkc_portal_db();
        $conn->query("SET NAMES 'binary'");

        $name = kkc_convert(trim($input['name'] ?? ''), 'EUC-KR', false);
        $hp = trim($input['hp'] ?? '');
        $birth = trim($input['birth'] ?? '');

        $name_esc = $conn->real_escape_string($name);
        $hp_esc = $conn->real_escape_string($hp);
        $birth_esc = $conn->real_escape_string($birth);

        if (empty($name_esc) || empty($hp_esc) || empty($birth_esc)) {
            $conn->close();
            return ['success' => false, 'error' => '이름, 연락처, 생년월일을 모두 입력해 주세요.'];
        }

        $birth_cond = "birth = '$birth_esc'";
        if (strlen($birth_esc) === 8) {
            $birth_6 = substr($birth_esc, 2);
            $birth_cond = "(birth = '$birth_esc' OR birth = '$birth_6')";
        } else if (strlen($birth_esc) === 6) {
            $birth_cond = "(birth = '$birth_esc' OR birth LIKE '%$birth_esc')";
        }

        $hp_clean = str_replace('-', '', $hp_esc);
        $hp_cond = "(REPLACE(hp, '-', '') = '$hp_clean' OR REPLACE(phone, '-', '') = '$hp_clean')";

        $sql = "SELECT id, hp FROM memTab WHERE name = '$name_esc' AND $birth_cond AND $hp_cond LIMIT 1";
        $res = $conn->query($sql);
        $user = $res ? $res->fetch_assoc() : null;
        $conn->close();

        if (!$user) {
            return ['success' => false, 'error' => '일치하는 회원 정보가 없습니다. 이름, 생년월일, 연락처를 다시 확인해 주세요.'];
        }

        $code = sprintf("%06d", mt_rand(100000, 999999));
        set_transient('kkf_sms_reset_' . $hp_clean, $code, 180);

        $msg = "[KKC 한국애견협회] 비밀번호 변경 인증번호는 [" . $code . "] 입니다. (3분 이내 입력)";
        $sms_res = kkf_portal_send_aligo_sms($hp_clean, $msg);

        // 📝 알리고 잔액 충전 전에도 테스트가 가능하도록 debug_sms.txt 에 인증코드 기록
        $debug_msg = "[" . date('Y-m-d H:i:s') . "] 수신: $hp_clean, 내용: $msg (코드: $code)\n";
        @file_put_contents(dirname(__FILE__) . '/../debug_sms.txt', $debug_msg);
        @file_put_contents(dirname(__FILE__) . '/debug_sms.txt', $debug_msg);

        if ($sms_res['success']) {
            return ['success' => true, 'step' => 'sms_sent', 'message' => '회원님의 휴대폰으로 인증번호가 발송되었습니다.'];
        } else {
            return [
                'success' => true, 
                'step' => 'sms_sent', 
                'message' => '본인 확인 성공(알리고 잔액 부족으로 문자 발송실패). 테스트용 코드가 debug_sms.txt에 임시 저장되었습니다.'
            ];
        }

    } catch (Throwable $e) {
        return ['success' => false, 'error' => '본인 정보 확인 중 오류: ' . $e->getMessage()];
    }
}

/**
 * 🔒 [Portal] 비밀번호 찾기 SMS 인증 확인
 */
function kkf_portal_find_pw_verify_sms($input) {
    try {
        $name = trim($input['name'] ?? '');
        $hp = trim($input['hp'] ?? '');
        $birth = trim($input['birth'] ?? '');
        $code = trim($input['code'] ?? '');

        $hp_clean = str_replace('-', '', $hp);

        if (empty($hp_clean) || empty($code)) {
            return ['success' => false, 'error' => '휴대폰 번호와 인증번호를 모두 입력해 주세요.'];
        }

        $saved_code = get_transient('kkf_sms_reset_' . $hp_clean);
        if (!$saved_code) {
            return ['success' => false, 'error' => '인증 코드가 만료되었거나 발송 내역이 없습니다.'];
        }

        if ($saved_code === $code) {
            $conn = get_kkc_portal_db();
            $conn->query("SET NAMES 'binary'");

            $name_esc = $conn->real_escape_string(kkc_convert($name, 'EUC-KR', false));
            $birth_esc = $conn->real_escape_string($birth);
            
            $birth_cond = "birth = '$birth_esc'";
            if (strlen($birth_esc) === 8) {
                $birth_6 = substr($birth_esc, 2);
                $birth_cond = "(birth = '$birth_esc' OR birth = '$birth_6')";
            }

            $hp_cond = "(REPLACE(hp, '-', '') = '$hp_clean' OR REPLACE(phone, '-', '') = '$hp_clean')";
            $sql = "SELECT id FROM memTab WHERE name = '$name_esc' AND $birth_cond AND $hp_cond LIMIT 1";
            $res = $conn->query($sql);
            $user = $res ? $res->fetch_assoc() : null;
            $conn->close();

            if (!$user) {
                return ['success' => false, 'error' => '회원 정보를 다시 조회할 수 없습니다. 처음부터 다시 진행해 주세요.'];
            }

            $found_id = $user['id'];

            set_transient('kkf_sms_reset_verified_' . $hp_clean, 'Y', 600);
            delete_transient('kkf_sms_reset_' . $hp_clean);

            return [
                'success' => true, 
                'step' => 'verified', 
                'id' => $found_id, 
                'message' => '인증에 성공하였습니다.'
            ];
        } else {
            return ['success' => false, 'error' => '인증번호가 일치하지 않습니다.'];
        }
    } catch (Throwable $e) {
        return ['success' => false, 'error' => '인증번호 확인 중 오류: ' . $e->getMessage()];
    }
}

/**
 * 🔒 [Portal] 비밀번호 실제 변경 실행
 */
function kkf_portal_find_pw_reset($input) {
    try {
        $conn = get_kkc_portal_db();
        $conn->query("SET NAMES 'binary'");

        $name = kkc_convert(trim($input['name'] ?? ''), 'EUC-KR', false);
        $hp = trim($input['hp'] ?? '');
        $birth = trim($input['birth'] ?? '');
        $new_pw = trim($input['new_pw'] ?? '');

        $hp_clean = str_replace('-', '', $hp);

        $verified_key = 'kkf_sms_reset_verified_' . $hp_clean;
        if (!get_transient($verified_key)) {
            $conn->close();
            return ['success' => false, 'error' => '휴대폰 본인 인증 유효 시간이 만료되었습니다. 처음부터 다시 인증해 주세요.'];
        }

        if (empty($new_pw)) {
            $conn->close();
            return ['success' => false, 'error' => '새로운 비밀번호를 입력해 주세요.'];
        }

        $name_esc = $conn->real_escape_string($name);
        $birth_esc = $conn->real_escape_string($birth);
        $new_pw_esc = $conn->real_escape_string($new_pw);

        $birth_cond = "birth = '$birth_esc'";
        if (strlen($birth_esc) === 8) {
            $birth_6 = substr($birth_esc, 2);
            $birth_cond = "(birth = '$birth_esc' OR birth = '$birth_6')";
        }

        $hp_cond = "(REPLACE(hp, '-', '') = '$hp_clean' OR REPLACE(phone, '-', '') = '$hp_clean')";

        $sql = "UPDATE memTab SET passwd = '$new_pw_esc' WHERE name = '$name_esc' AND $birth_cond AND $hp_cond";
        $res = $conn->query($sql);
        $conn->close();

        if ($res) {
            delete_transient($verified_key);
            return ['success' => true, 'message' => '비밀번호가 성공적으로 변경되었습니다.'];
        } else {
            return ['success' => false, 'error' => '비밀번호 변경 실패'];
        }

    } catch (Throwable $e) {
        return ['success' => false, 'error' => '비밀번호 변경 중 오류: ' . $e->getMessage()];
    }
}

