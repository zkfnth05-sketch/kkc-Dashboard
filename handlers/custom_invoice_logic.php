<?php
/**
 * 파일명: handlers/custom_invoice_logic.php
 * 기능: 관리자(bridg.php) + 마이페이지(portal_bridg.php) 양쪽에서 동작하는
 *       "개인결제 관리(Custom Invoice)" 하이브리드 백엔드 및 알리고 SMS 엔진
 *
 * 설계 원칙:
 *  - 관리자 경로: wp-load.php 로드 → $wpdb 사용 가능
 *  - 마이페이지 경로: KKF_PORTAL 정의 → $wpdb 없음 → mysqli(get_kkc_portal_db) 사용
 *  - 두 환경을 kkc_get_custom_invoice_db() 게이트웨이 하나로 통합
 */

// 🛡️ [GUARD] 워드프레스(ABSPATH) 또는 마이페이지 게이트웨이(KKF_PORTAL) 둘 중 하나면 통과
if (!defined('ABSPATH') && !defined('KKF_PORTAL')) exit;

/**
 * 🗄️ 테이블 DDL 정의 (wpdb / mysqli 공용)
 */
if (!function_exists('kkc_custom_invoices_ddl')) {
    function kkc_custom_invoices_ddl() {
        return "CREATE TABLE IF NOT EXISTS `kkc_custom_invoices` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `invoice_code` VARCHAR(32) NOT NULL UNIQUE,
            `member_id` VARCHAR(50) NULL,
            `customer_name` VARCHAR(50) NOT NULL,
            `customer_hp` VARCHAR(20) NOT NULL,
            `title` VARCHAR(150) NOT NULL,
            `amount` INT NOT NULL,
            `pay_method` VARCHAR(20) DEFAULT 'CARD',
            `status` VARCHAR(20) DEFAULT 'PENDING',
            `depositor_name` VARCHAR(50) NULL,
            `cash_receipt_no` VARCHAR(30) NULL,
            `tid` VARCHAR(100) NULL,
            `paid_at` DATETIME NULL,
            `admin_memo` TEXT NULL,
            `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            `expires_at` DATETIME NULL,
            INDEX (`member_id`),
            INDEX (`customer_hp`),
            INDEX (`status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
    }
}

/**
 * 🔌 하이브리드 DB 게이트웨이
 * @return array ['type' => 'wpdb'|'mysqli', 'conn' => object]
 * @throws Exception
 */
if (!function_exists('kkc_get_custom_invoice_db')) {
    function kkc_get_custom_invoice_db() {
        global $wpdb;

        // 1) 워드프레스 환경 (관리자 bridg.php)
        if (!empty($wpdb) && is_object($wpdb)) {
            return ['type' => 'wpdb', 'conn' => $wpdb];
        }

        // 2) 마이페이지 게이트웨이 환경 (portal_bridg.php)
        if (function_exists('get_kkc_portal_db')) {
            $conn = get_kkc_portal_db();
            if ($conn instanceof mysqli) {
                @$conn->set_charset('utf8mb4');
            }
            return ['type' => 'mysqli', 'conn' => $conn];
        }

        // 3) 최후 폴백: 직접 mysqli 연결
        $conn = new mysqli('localhost', 'kkc3349', 'kkcdog3349**', 'kkc3349');
        if ($conn->connect_error) {
            throw new Exception('DB 연결 실패: ' . $conn->connect_error);
        }
        $conn->set_charset('utf8mb4');
        return ['type' => 'mysqli', 'conn' => $conn];
    }
}

/**
 * 🔤 mysqli 결과셋을 연관배열 리스트로 변환
 */
if (!function_exists('kkc_mysqli_fetch_all_assoc')) {
    function kkc_mysqli_fetch_all_assoc($result) {
        $rows = [];
        if (!$result) return $rows;
        if ($result instanceof mysqli_result) {
            while ($row = $result->fetch_assoc()) {
                $rows[] = $row;
            }
        }
        return $rows;
    }
}

/**
 * 🧹 mysqli 문자열 이스케이프 헬퍼
 */
if (!function_exists('kkc_mysqli_escape')) {
    function kkc_mysqli_escape($conn, $value) {
        if ($value === null) return '';
        return $conn->real_escape_string((string)$value);
    }
}

/**
 * 🗄️ 테이블 자동 생성 (없을 경우 무인 자동 생성)
 */
if (!function_exists('kkc_ensure_custom_invoices_table')) {
    function kkc_ensure_custom_invoices_table() {
        try {
            $db   = kkc_get_custom_invoice_db();
            $ddl  = kkc_custom_invoices_ddl();

            if ($db['type'] === 'wpdb') {
                /** @var wpdb $wpdb */
                $wpdb = $db['conn'];
                $wpdb->query($ddl);
                return true;
            }

            /** @var mysqli $conn */
            $conn = $db['conn'];
            $conn->query($ddl);
            return true;
        } catch (Throwable $e) {
            return false;
        }
    }
}

/**
 * 📝 [ADMIN] 신규 개인결제 청구 생성 및 알리고 SMS 발송
 */
if (!function_exists('kkc_handle_create_custom_invoice')) {
    function kkc_handle_create_custom_invoice($input) {
        kkc_ensure_custom_invoices_table();

        $customer_name = trim($input['customer_name'] ?? '');
        $customer_hp   = trim($input['customer_hp'] ?? '');
        $title         = trim($input['title'] ?? '');
        $amount        = intval($input['amount'] ?? 0);
        $member_id     = trim($input['member_id'] ?? '');
        $admin_memo    = trim($input['admin_memo'] ?? '');
        $send_sms      = !empty($input['send_sms']);

        if ($customer_name === '') {
            return ['success' => false, 'error' => '고객 이름을 입력해 주세요.'];
        }

        $hp_clean = preg_replace('/[^0-9]/', '', $customer_hp);
        if (strlen($hp_clean) < 9) {
            return ['success' => false, 'error' => '올바른 휴대폰 번호를 입력해 주세요.'];
        }

        if ($title === '') {
            return ['success' => false, 'error' => '결제 항목명을 입력해 주세요.'];
        }

        if ($amount < 1000) {
            return ['success' => false, 'error' => '최소 결제 금액은 1,000원 이상이어야 합니다.'];
        }

        // 고유 코드 생성
        $random_suffix = strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 6));
        $invoice_code  = 'INV_' . date('Ymd') . '_' . $random_suffix;

        // 만료일: 기본 7일 후 23:59:59
        $expire_days = intval($input['expire_days'] ?? 7);
        if ($expire_days <= 0) $expire_days = 7;
        $expires_at = date('Y-m-d 23:59:59', strtotime("+{$expire_days} days"));

        $created_at = date('Y-m-d H:i:s');
        $member_val = ($member_id !== '') ? $member_id : null;

        try {
            $db = kkc_get_custom_invoice_db();

            if ($db['type'] === 'wpdb') {
                /** @var wpdb $wpdb */
                $wpdb = $db['conn'];
                $insert_res = $wpdb->insert(
                    'kkc_custom_invoices',
                    [
                        'invoice_code'  => $invoice_code,
                        'member_id'     => $member_val,
                        'customer_name' => $customer_name,
                        'customer_hp'   => $hp_clean,
                        'title'         => $title,
                        'amount'        => $amount,
                        'pay_method'    => 'CARD',
                        'status'        => 'PENDING',
                        'admin_memo'    => $admin_memo,
                        'created_at'    => $created_at,
                        'expires_at'    => $expires_at
                    ],
                    ['%s', '%s', '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%s']
                );

                if ($insert_res === false) {
                    return ['success' => false, 'error' => 'DB 등록 중 오류가 발생했습니다: ' . $wpdb->last_error];
                }
            } else {
                /** @var mysqli $conn */
                $conn = $db['conn'];

                $e_code   = kkc_mysqli_escape($conn, $invoice_code);
                $e_member = ($member_val === null) ? 'NULL' : "'" . kkc_mysqli_escape($conn, $member_val) . "'";
                $e_name   = kkc_mysqli_escape($conn, $customer_name);
                $e_hp     = kkc_mysqli_escape($conn, $hp_clean);
                $e_title  = kkc_mysqli_escape($conn, $title);
                $e_amount = intval($amount);
                $e_memo   = kkc_mysqli_escape($conn, $admin_memo);
                $e_created = kkc_mysqli_escape($conn, $created_at);
                $e_expires = kkc_mysqli_escape($conn, $expires_at);

                $sql = "INSERT INTO `kkc_custom_invoices`
                        (`invoice_code`, `member_id`, `customer_name`, `customer_hp`, `title`, `amount`,
                         `pay_method`, `status`, `admin_memo`, `created_at`, `expires_at`)
                        VALUES
                        ('{$e_code}', {$e_member}, '{$e_name}', '{$e_hp}', '{$e_title}', {$e_amount},
                         'CARD', 'PENDING', '{$e_memo}', '{$e_created}', '{$e_expires}')";

                $ok = $conn->query($sql);
                if (!$ok) {
                    $err = $conn->error;
                    return ['success' => false, 'error' => 'DB 등록 중 오류가 발생했습니다: ' . $err];
                }
            }
        } catch (Throwable $e) {
            return ['success' => false, 'error' => 'DB 등록 중 예외가 발생했습니다: ' . $e->getMessage()];
        }

        // 알리고 SMS 발송 (선택)
        $sms_res = null;
        if ($send_sms) {
            $member_logic = dirname(__FILE__) . '/member_logic.php';
            if (file_exists($member_logic)) {
                require_once $member_logic;
            }
            $fmt_amount = number_format($amount);
            $sms_msg = "[KKC 한국애견협회] {$customer_name}님, [{$title}] 결제({$fmt_amount}원)가 청구되었습니다. 협회 마이페이지 로그인 후 결제 바랍니다.";
            if (function_exists('kkc_send_aligo_sms')) {
                $sms_res = kkc_send_aligo_sms($hp_clean, $sms_msg);
            }
        }

        return [
            'success'       => true,
            'message'       => '개인결제 청구가 등록되었습니다.' . ($send_sms ? ' (SMS 발송 요청 완료)' : ''),
            'invoice_code'  => $invoice_code,
            'amount'        => $amount,
            'customer_name' => $customer_name,
            'customer_hp'   => $hp_clean,
            'sms_result'    => $sms_res
        ];
    }
}

/**
 * 📋 [ADMIN] 개인결제 목록 조회 (상태별 / 검색어별 / 페이징)
 */
if (!function_exists('kkc_handle_get_custom_invoices')) {
    function kkc_handle_get_custom_invoices($input) {
        kkc_ensure_custom_invoices_table();

        $page   = max(1, intval($input['page'] ?? 1));
        $limit  = max(1, min(100, intval($input['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $status = trim($input['status'] ?? 'all');
        $search = trim($input['search'] ?? '');

        try {
            $db = kkc_get_custom_invoice_db();

            if ($db['type'] === 'wpdb') {
                /** @var wpdb $wpdb */
                $wpdb = $db['conn'];

                $where = ["1=1"];

                if ($status !== 'all' && $status !== '') {
                    $where[] = $wpdb->prepare("status = %s", $status);
                }

                if ($search !== '') {
                    $like = '%' . $wpdb->esc_like($search) . '%';
                    $where[] = $wpdb->prepare(
                        "(customer_name LIKE %s OR customer_hp LIKE %s OR title LIKE %s OR invoice_code LIKE %s OR member_id LIKE %s)",
                        $like, $like, $like, $like, $like
                    );
                }

                $where_sql = implode(' AND ', $where);
                $total = (int)$wpdb->get_var("SELECT COUNT(*) FROM `kkc_custom_invoices` WHERE {$where_sql}");
                $rows  = $wpdb->get_results(
                    "SELECT * FROM `kkc_custom_invoices` WHERE {$where_sql} ORDER BY id DESC LIMIT {$limit} OFFSET {$offset}",
                    ARRAY_A
                );

                return [
                    'success' => true,
                    'data'    => $rows ?: [],
                    'total'   => $total,
                    'page'    => $page,
                    'limit'   => $limit
                ];
            }

            /** @var mysqli $conn */
            $conn = $db['conn'];

            $where = ["1=1"];

            if ($status !== 'all' && $status !== '') {
                $where[] = "status = '" . kkc_mysqli_escape($conn, $status) . "'";
            }

            if ($search !== '') {
                $s = kkc_mysqli_escape($conn, $search);
                $where[] = "(customer_name LIKE '%{$s}%' OR customer_hp LIKE '%{$s}%' OR title LIKE '%{$s}%' OR invoice_code LIKE '%{$s}%' OR member_id LIKE '%{$s}%')";
            }

            $where_sql = implode(' AND ', $where);

            $total = 0;
            $cnt_res = $conn->query("SELECT COUNT(*) AS cnt FROM `kkc_custom_invoices` WHERE {$where_sql}");
            if ($cnt_res && ($cnt_row = $cnt_res->fetch_assoc())) {
                $total = intval($cnt_row['cnt']);
            }

            $rows = [];
            $res = $conn->query("SELECT * FROM `kkc_custom_invoices` WHERE {$where_sql} ORDER BY id DESC LIMIT {$offset}, {$limit}");
            if ($res) {
                while ($row = $res->fetch_assoc()) {
                    $rows[] = $row;
                }
            }

            return [
                'success' => true,
                'data'    => $rows,
                'total'   => $total,
                'page'    => $page,
                'limit'   => $limit
            ];
        } catch (Throwable $e) {
            return ['success' => false, 'error' => '목록 조회 중 오류: ' . $e->getMessage(), 'data' => [], 'total' => 0];
        }
    }
}

/**
 * ⚡ [ADMIN] 개인결제 관리 액션 (무통장 입금 승인 / 청구 취소 / SMS 재발송)
 */
if (!function_exists('kkc_handle_custom_invoice_action')) {
    function kkc_handle_custom_invoice_action($input) {
        kkc_ensure_custom_invoices_table();

        $invoice_code = trim($input['invoice_code'] ?? '');
        $action       = trim($input['action'] ?? '');

        if ($invoice_code === '') {
            return ['success' => false, 'error' => '청구 코드가 유효하지 않습니다.'];
        }

        try {
            $db = kkc_get_custom_invoice_db();

            // 1) 청구 내역 조회
            $invoice = null;

            if ($db['type'] === 'wpdb') {
                /** @var wpdb $wpdb */
                $wpdb = $db['conn'];
                $invoice = $wpdb->get_row(
                    $wpdb->prepare("SELECT * FROM `kkc_custom_invoices` WHERE invoice_code = %s", $invoice_code),
                    ARRAY_A
                );
            } else {
                /** @var mysqli $conn */
                $conn = $db['conn'];
                $e_code = kkc_mysqli_escape($conn, $invoice_code);
                $res = $conn->query("SELECT * FROM `kkc_custom_invoices` WHERE invoice_code = '{$e_code}' LIMIT 1");
                if ($res && $res->num_rows > 0) {
                    $invoice = $res->fetch_assoc();
                }
            }

            if (!$invoice) {
                return ['success' => false, 'error' => '해당 청구 내역을 찾을 수 없습니다.'];
            }

            $now_str = date('Y-m-d H:i:s');
            $memo_stamp = '[' . date('Y-m-d H:i') . ']';

            // 2) 무통장 입금 승인 완료 처리
            if ($action === 'confirm_cash') {
                if ($invoice['status'] === 'PAID') {
                    return ['success' => false, 'error' => '이미 결제 완료된 건입니다.'];
                }

                $new_memo = trim(($invoice['admin_memo'] ?? '') . "\n" . $memo_stamp . ' 관리자 무통장 입금확인 완료');

                if ($db['type'] === 'wpdb') {
                    /** @var wpdb $wpdb */
                    $wpdb = $db['conn'];
                    $res_up = $wpdb->update(
                        'kkc_custom_invoices',
                        [
                            'status'     => 'PAID',
                            'pay_method' => 'CASH',
                            'paid_at'    => $now_str,
                            'admin_memo' => $new_memo
                        ],
                        ['invoice_code' => $invoice_code],
                        ['%s', '%s', '%s', '%s'],
                        ['%s']
                    );
                    $ok = ($res_up !== false);
                } else {
                    /** @var mysqli $conn */
                    $conn = $db['conn'];
                    $e_code = kkc_mysqli_escape($conn, $invoice_code);
                    $e_memo = kkc_mysqli_escape($conn, $new_memo);
                    $e_now  = kkc_mysqli_escape($conn, $now_str);
                    $sql = "UPDATE `kkc_custom_invoices`
                            SET `status` = 'PAID', `pay_method` = 'CASH', `paid_at` = '{$e_now}', `admin_memo` = '{$e_memo}'
                            WHERE `invoice_code` = '{$e_code}'";
                    $ok = ($conn->query($sql) !== false);
                }

                return [
                    'success' => $ok,
                    'message' => $ok ? '입금 확인이 완료되어 결제완료 처리되었습니다.' : '입금 확인 처리 중 오류가 발생했습니다.'
                ];
            }

            // 3) 청구 취소
            if ($action === 'cancel') {
                if ($invoice['status'] === 'PAID') {
                    return ['success' => false, 'error' => '이미 결제 완료된 건은 취소할 수 없습니다. 환불 절차를 진행해 주세요.'];
                }

                $new_memo = trim(($invoice['admin_memo'] ?? '') . "\n" . $memo_stamp . ' 관리자 청구 취소');

                if ($db['type'] === 'wpdb') {
                    /** @var wpdb $wpdb */
                    $wpdb = $db['conn'];
                    $res_up = $wpdb->update(
                        'kkc_custom_invoices',
                        [
                            'status'     => 'CANCELLED',
                            'admin_memo' => $new_memo
                        ],
                        ['invoice_code' => $invoice_code],
                        ['%s', '%s'],
                        ['%s']
                    );
                    $ok = ($res_up !== false);
                } else {
                    /** @var mysqli $conn */
                    $conn = $db['conn'];
                    $e_code = kkc_mysqli_escape($conn, $invoice_code);
                    $e_memo = kkc_mysqli_escape($conn, $new_memo);
                    $sql = "UPDATE `kkc_custom_invoices`
                            SET `status` = 'CANCELLED', `admin_memo` = '{$e_memo}'
                            WHERE `invoice_code` = '{$e_code}'";
                    $ok = ($conn->query($sql) !== false);
                }

                return [
                    'success' => $ok,
                    'message' => $ok ? '청구가 취소 처리되었습니다.' : '청구 취소 처리 중 오류가 발생했습니다.'
                ];
            }

            // 4) 알리고 안내 SMS 재발송
            if ($action === 'resend_sms') {
                $member_logic = dirname(__FILE__) . '/member_logic.php';
                if (file_exists($member_logic)) {
                    require_once $member_logic;
                }

                if (!function_exists('kkc_send_aligo_sms')) {
                    return ['success' => false, 'error' => 'SMS 발송 모듈을 불러올 수 없습니다.'];
                }

                $fmt_amount = number_format(intval($invoice['amount']));
                $sms_msg = "[KKC 한국애견협회] {$invoice['customer_name']}님, [{$invoice['title']}] 결제({$fmt_amount}원) 안내드립니다. 마이페이지 로그인 후 결제 바랍니다.";
                $sms_res = kkc_send_aligo_sms($invoice['customer_hp'], $sms_msg);

                $sms_ok = !empty($sms_res['success']);
                $sms_err = $sms_res['error'] ?? ($sms_res['message'] ?? '');

                return [
                    'success'    => $sms_ok,
                    'message'    => $sms_ok ? 'SMS가 재발송되었습니다.' : ('SMS 발송 실패: ' . $sms_err),
                    'sms_result' => $sms_res
                ];
            }

            return ['success' => false, 'error' => '유효하지 않은 관리 액션입니다: ' . $action];
        } catch (Throwable $e) {
            return ['success' => false, 'error' => '처리 중 오류: ' . $e->getMessage()];
        }
    }
}

/**
 * 👤 [PORTAL] 로그인한 회원의 청구 목록 조회 (마이페이지용)
 * - $wpdb 없으면 mysqli 로 완벽하게 SELECT 수행
 * - PENDING / WAITING_CASH 미결제 건 우선 정렬
 */
if (!function_exists('kkc_handle_portal_my_invoices')) {
    function kkc_handle_portal_my_invoices($input) {
        kkc_ensure_custom_invoices_table();

        $member_id = trim($input['member_id'] ?? '');
        $hp        = trim($input['hp'] ?? '');
        $hp_clean  = preg_replace('/[^0-9]/', '', $hp);

        if ($member_id === '' && $hp_clean === '') {
            return ['success' => false, 'error' => '회원 식별 정보가 없습니다.', 'data' => []];
        }

        try {
            $db = kkc_get_custom_invoice_db();

            if ($db['type'] === 'wpdb') {
                /** @var wpdb $wpdb */
                $wpdb = $db['conn'];

                $where = [];
                if ($member_id !== '') {
                    $where[] = $wpdb->prepare("member_id = %s", $member_id);
                }
                if ($hp_clean !== '') {
                    $where[] = $wpdb->prepare("customer_hp = %s", $hp_clean);
                }
                $where_sql = "(" . implode(' OR ', $where) . ") AND status != 'CANCELLED'";

                $sql = "SELECT * FROM `kkc_custom_invoices`
                        WHERE {$where_sql}
                        ORDER BY CASE WHEN status IN ('PENDING', 'WAITING_CASH') THEN 1 ELSE 2 END, id DESC
                        LIMIT 10";

                $rows = $wpdb->get_results($sql, ARRAY_A);

                return [
                    'success' => true,
                    'data'    => $rows ?: []
                ];
            }

            /** @var mysqli $conn */
            $conn = $db['conn'];

            $where = [];
            if ($member_id !== '') {
                $where[] = "member_id = '" . kkc_mysqli_escape($conn, $member_id) . "'";
            }
            if ($hp_clean !== '') {
                $where[] = "customer_hp = '" . kkc_mysqli_escape($conn, $hp_clean) . "'";
            }
            $where_sql = "(" . implode(' OR ', $where) . ") AND status != 'CANCELLED'";

            $sql = "SELECT * FROM `kkc_custom_invoices`
                    WHERE {$where_sql}
                    ORDER BY CASE WHEN status IN ('PENDING', 'WAITING_CASH') THEN 1 ELSE 2 END, id DESC
                    LIMIT 10";

            $res  = $conn->query($sql);
            $rows = kkc_mysqli_fetch_all_assoc($res);

            return [
                'success' => true,
                'data'    => $rows
            ];
        } catch (Throwable $e) {
            return ['success' => false, 'error' => '청구 목록 조회 중 오류: ' . $e->getMessage(), 'data' => []];
        }
    }
}

/**
 * 🏦 [PORTAL] 무통장 입금 신청 처리 (마이페이지용)
 * - $wpdb 없으면 mysqli 로 UPDATE 수행
 */
if (!function_exists('kkc_handle_portal_apply_cash')) {
    function kkc_handle_portal_apply_cash($input) {
        kkc_ensure_custom_invoices_table();

        $invoice_code    = trim($input['invoice_code'] ?? '');
        $depositor_name  = trim($input['depositor_name'] ?? '');
        $cash_receipt_no = trim($input['cash_receipt_no'] ?? '');

        if ($invoice_code === '') {
            return ['success' => false, 'error' => '청구 코드가 유효하지 않습니다.'];
        }
        if ($depositor_name === '') {
            return ['success' => false, 'error' => '입금자명을 입력해 주세요.'];
        }

        try {
            $db = kkc_get_custom_invoice_db();

            // 1) 청구 내역 조회
            $invoice = null;

            if ($db['type'] === 'wpdb') {
                /** @var wpdb $wpdb */
                $wpdb = $db['conn'];
                $invoice = $wpdb->get_row(
                    $wpdb->prepare("SELECT * FROM `kkc_custom_invoices` WHERE invoice_code = %s", $invoice_code),
                    ARRAY_A
                );
            } else {
                /** @var mysqli $conn */
                $conn = $db['conn'];
                $e_code = kkc_mysqli_escape($conn, $invoice_code);
                $res = $conn->query("SELECT * FROM `kkc_custom_invoices` WHERE invoice_code = '{$e_code}' LIMIT 1");
                if ($res && $res->num_rows > 0) {
                    $invoice = $res->fetch_assoc();
                }
            }

            if (!$invoice) {
                return ['success' => false, 'error' => '청구 내역을 찾을 수 없습니다.'];
            }
            if ($invoice['status'] === 'PAID') {
                return ['success' => false, 'error' => '이미 결제 완료된 건입니다.'];
            }
            if ($invoice['status'] === 'CANCELLED') {
                return ['success' => false, 'error' => '취소된 청구 건입니다.'];
            }

            // 2) 무통장 입금 신청 상태로 UPDATE
            if ($db['type'] === 'wpdb') {
                /** @var wpdb $wpdb */
                $wpdb = $db['conn'];
                $res_up = $wpdb->update(
                    'kkc_custom_invoices',
                    [
                        'status'          => 'WAITING_CASH',
                        'pay_method'      => 'CASH',
                        'depositor_name'  => $depositor_name,
                        'cash_receipt_no' => ($cash_receipt_no !== '') ? $cash_receipt_no : null
                    ],
                    ['invoice_code' => $invoice_code],
                    ['%s', '%s', '%s', '%s'],
                    ['%s']
                );
                $ok = ($res_up !== false);
            } else {
                /** @var mysqli $conn */
                $conn = $db['conn'];

                $e_code    = kkc_mysqli_escape($conn, $invoice_code);
                $e_dep     = kkc_mysqli_escape($conn, $depositor_name);
                $e_receipt = ($cash_receipt_no !== '')
                    ? "'" . kkc_mysqli_escape($conn, $cash_receipt_no) . "'"
                    : 'NULL';

                $sql = "UPDATE `kkc_custom_invoices`
                        SET `status` = 'WAITING_CASH',
                            `pay_method` = 'CASH',
                            `depositor_name` = '{$e_dep}',
                            `cash_receipt_no` = {$e_receipt}
                        WHERE `invoice_code` = '{$e_code}'";

                $ok = ($conn->query($sql) !== false);
            }

            if (!$ok) {
                return ['success' => false, 'error' => '무통장 입금 신청 저장 중 오류가 발생했습니다.'];
            }

            return [
                'success' => true,
                'message' => '무통장 입금 신청이 접수되었습니다. 안내된 계좌로 입금해 주시면 관리자 확인 후 완료 처리됩니다.'
            ];
        } catch (Throwable $e) {
            return ['success' => false, 'error' => '무통장 입금 신청 중 오류: ' . $e->getMessage()];
        }
    }
}

/**
 * 🔁 하위 호환 별칭 (기존 bridg.php / 프론트엔드 액션명 대응)
 */
if (!function_exists('kkc_handle_list_custom_invoices')) {
    function kkc_handle_list_custom_invoices($input) {
        return kkc_handle_get_custom_invoices($input);
    }
}

if (!function_exists('kkc_handle_action_custom_invoice')) {
    function kkc_handle_action_custom_invoice($input) {
        return kkc_handle_custom_invoice_action($input);
    }
}
