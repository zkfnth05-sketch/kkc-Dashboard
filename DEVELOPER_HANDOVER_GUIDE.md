# 📘 한국애견협회(KKC) 시스템 개발자 인수인계 및 기술 바이블 (Master Handover Bible)
> **문서 버전:** v3.0.0 (Ultimate Complete Technical Bible)  
> **최종 작성일:** 2026년 9월  
> **인수인계 대상:** 신규 백엔드 / 프론트엔드 / 풀스택 엔지니어  
> **적용 시스템:** KKC 관리자 대시보드, 회원 포털(MyPage), 8종 대회 온라인 신청 시스템, NICE 평가정보 모바일 혈통서 연동 시스템

---

## 📑 마스터 목차 (Table of Contents)
1. [프로젝트 개요 및 시스템 아키텍처](#1-프로젝트-개요-및-시스템-아키텍처)
2. [개발 환경 구축, 로컬 실행 & 배포 절차](#2-개발-환경-구축-로컬-실행--배포-절차)
3. [백엔드 PHP 아키텍처 및 소스 파일/함수 전수 명세](#3-백엔드-php-아키텍처-및-소스-파일함수-전수-명세)
   - 3.1 루트 게이트웨이 브릿지 (`bridg.php`, `portal_bridg.php`, `nice_api_bridge.php`, `nice_api_config.php`, `payment_callback.php`)
   - 3.2 데이터 헌법 라이브러리 (`lib/kkc_constitution.php`)
   - 3.3 비즈니스 로직 핸들러 10종 전수 분석 (`handlers/*.php`)
4. [데이터베이스(DB) 테이블 및 모든 컬럼 필드 전수 사전](#4-데이터베이스db-테이블-및-모든-컬럼-필드-전수-사전)
   - 4.1 인코딩 체계(EUC-KR vs UTF-8)와 바이너리 세션(Binary-Safe) 핵심 원리
   - 4.2 회원 및 권한/자격 테이블군 (`memTab`, `membership_applications`, `pro_classTab`, `skillTab`)
   - 4.3 혈통서/반려견 및 동태 관리 테이블군 (`dogTab`, `dongtaeTab`, `poss_changeTab`, `hairTab`, `dog_classTab`)
   - 4.4 대회/행사 5종 및 신청자 8종 테이블군 (`dogshow`, `stylist`, `sports_event`, `seminar`, `breed_exam` 및 `*_applicant`)
   - 4.5 상력 및 포인트 테이블군 (`point`, `prize_dogTab`, `breed_dogTab`)
   - 4.6 워드프레스 코어 및 시스템 테이블군 (`wp_posts`, `wp_postmeta`, `kkc_transients`)
5. [🌟 [특집] NICE 모바일 혈통서 연동 시스템 완전 해부](#5-특집-nice-모바일-혈통서-연동-시스템-완전-해부)
   - 5.1 대외계 통신 보안 아키텍처 (AES-256-CBC & HMAC-SHA256)
   - 5.2 인바운드 5대 API 상세 스펙 및 JSON 전문 (API 001, 002, 003, 005, 007)
   - 5.3 아웃바운드 2대 푸시 API 상세 스펙 및 JSON 전문 (API 004, 006)
   - 5.4 4대 조상 혈통 트리(14마리 계보) 재귀 탐색 알고리즘
   - 5.5 모바일 5000번대 등록번호 자동 채번 공식 (`nice_generate_unique_reg_no`)
   - 5.6 반려견 사진(API 007) 고속 파일 쓰기 파이프라인
   - 5.7 관리자 심사 전표(승인/반려/수정/명의변경) 라이프사이클
   - 5.8 NICE 전용 이원화 DB 테이블 구조 (`nice_pedigree_requests`, `nice_dogTab`, `nice_memTab`, `nice_poss_changeTab`)
6. [프론트엔드 React 19 아키텍처 및 화면-서비스 매핑](#6-프론트엔드-react-19-아키텍처-및-화면-서비스-매핑)
7. [기타 대외 연동 시스템 (NICE 아이핀, KG모빌리언스 결제, 알리고 SMS)](#7-기타-대외-연동-시스템)
8. [실무 필수 트러블슈팅 및 절대 금기 수칙](#8-실무-필수-트러블슈팅-및-절대-금기-수칙)

---

## 1. 프로젝트 개요 및 시스템 아키텍처

### 1.1 시스템 목적
사단법인 한국애견협회(KKC, Korea Kennel Club)는 대한민국 반려동물 문화 및 혈통 보존을 주도하는 공인 단체입니다.  
본 시스템은 지난 30여 년간 축적된 방대한 지류 혈통 데이터 및 회원 정보를 현대적인 클라우드 기반 웹 시스템으로 일원화하고, 나이스평가정보(NICE) 모바일 신분증/혈통서 앱(펫핀 등)과 실시간 연동하여 혈통서 발급 및 조회를 디지털화하기 위해 개발되었습니다.

### 1.2 기술 스택 (Tech Stack)
- **Frontend:** React 19, TypeScript (~5.9), Vite (v7), Tailwind CSS (v4), Lucide React, ExcelJS, PapaParse, React-Quill-New
- **Frontend Hosting:** Vercel (`https://kkc-admin-dashboard.vercel.app`)
- **Backend:** PHP 8.x (Apache, Linux, Cafe24 가상 호스팅), WordPress Core 6.x 연동
- **Backend Host:** `https://kkc.or.kr`
- **Database:** MariaDB 10.x / MySQL 5.7 (EUC-KR 및 UTF-8 혼재 하이브리드 구성)
- **External Services:**
  - **NICE 평가정보:** 모바일 혈통서 API (AES-256 대칭키 암호화 통신), NICE 통합인증 (아이핀)
  - **KG모빌리언스:** 온라인 신용카드 팝업 결제 (MUP API)
  - **알리고(Aligo):** 회원가입 및 비밀번호 찾기 SMS 문자 발송 API

---

## 2. 개발 환경 구축, 로컬 실행 & 배포 절차

### 2.1 로컬 개발 환경 기동
```bash
# 1. 패키지 설치
npm install

# 2. 로컬 개발 서버 실행
npm run dev

# 3. 로컬 브라우저 확인
http://localhost:5173
```
- 로컬에서 개발 서버를 기동하더라도 프론트엔드의 기본 API 엔드포인트(`src/services/*.ts`)가 원격 Cafe24 서버(`https://kkc.or.kr/bridg.php`)를 바라보고 있으므로, 로컬에서 실시간으로 원격 DB 데이터를 조회/수정하며 개발할 수 있습니다.

### 2.2 빌드 및 프로덕션 검증
```bash
npm run build
```
빌드 결과물은 `dist/` 폴더에 번들링됩니다.

### 2.3 서버 배포 구조
1. **프론트엔드 (Vercel):** GitHub 저장소의 `main` 브랜치에 변경 사항이 반영되면 Vercel CI/CD에 의해 자동 빌드 및 배포됩니다.
2. **백엔드 PHP (Cafe24):** 루트의 PHP 파일들 및 `handlers/`, `lib/` 폴더를 Cafe24 FTP를 통해 웹 루트 디렉토리에 업로드합니다.  
   서버의 `.user.ini`에 아래 내용이 반드시 포함되어 있어야 합니다:
   ```ini
   memory_limit = 512M
   max_execution_time = 120
   post_max_size = 128M
   upload_max_filesize = 128M
   ```

---

## 3. 백엔드 PHP 아키텍처 및 소스 파일/함수 전수 명세

### 3.1 루트 게이트웨이 브릿지 (Gateways)

#### 1) `bridg.php` (관리자 대시보드 메인 브릿지)
- **경로:** `/bridg.php`
- **역할:** 관리자 대시보드(React)에서 들어오는 모든 데이터 통신의 메인 게이트웨이.
- **인증 토큰:** HTTP Request Header `X-Auth-Token`의 값이 `kkc-super-secret-key-change-this-now-12345!`와 일치해야 통과.
- **동작 흐름:**
  1. CORS 헤더(`Access-Control-Allow-Origin`, `X-Auth-Token` 등) 출력 및 `OPTIONS` 프리플라이트 요청 즉시 200 반환.
  2. 서버 리소스 확장: `memory_limit: 2048M`, `max_execution_time: 1200` (대용량 엑셀 및 DB 덤프 대응).
  3. `php://input`에서 JSON을 읽어 `$input` 배열로 디코딩 (또는 Multipart FormData 파싱).
  4. `wp-load.php`를 로드하여 워드프레스 `$wpdb` 글로벌 객체 활성화.
  5. `lib/kkc_constitution.php` 로드.
  6. `$mode` 값에 따라 `handlers/` 내의 해당 파일 로드 및 함수 호출:
     - `list`: 대상 테이블(`table`)에 따라 `member_logic.php`, `dog_logic.php`, `event_logic.php`, `download_logic.php`, `crud_logic.php`로 분기.
     - `create_record`, `update_record`, `delete_record`: `crud_logic.php` (또는 행사 건은 `event_logic.php`).
     - `upload_image`: `crud_logic.php`의 `kkc_handle_upload_image` 호출.
     - `get_dongtae_info`, `get_next_dongtae_no`, `get_owner_history`: `dog_logic.php` 호출.
     - `membership_applications_list`, `membership_application_action`: `member_logic.php` 호출.
     - `pg_register`: `payment_gateway_logic.php` 호출.
     - `execute_sql`: `crud_logic.php`의 `kkc_handle_sql_batch` 호출.
  7. **출력 정제:** `while (ob_get_level()) { ob_end_clean(); }`를 실행하여 워드프레스 플러그인이 출력한 빈 줄이나 경고 문자를 100% 제거.
  8. **인코딩 방어:** DB 에러가 CP949(EUC-KR)로 날아와 `json_encode`가 실패(`false`)할 경우, 재귀적으로 `mb_convert_encoding($item, 'UTF-8', 'UTF-8, EUC-KR, UHC')`를 실행하여 빈 화면 전송을 방지.

#### 2) `portal_bridg.php` (회원 포털 & 본인인증 게이트웨이)
- **경로:** `/portal_bridg.php`
- **역할:** 일반 회원이 이용하는 포털 마이페이지, 알리고 SMS 인증, NICE 아이핀 인증, 관리자 모바일 혈통서 API 게이트웨이.
- **특징:** 워드프레스 무거운 코어를 배제하고 순수 `mysqli` 객체(`get_kkc_portal_db()`)를 사용하여 수밀리초 내 초고속 응답.
- **모드별 라우팅:**
  - `portal_login`: 일반 회원 로그인 (`kkf_portal_handle_login`)
  - `portal_get_my_data`: 회원 프로필 + 신청 내역 8종 + 반려견 목록 원스톱 조회 (`kkf_portal_get_my_data`)
  - `portal_apply_membership`: 회원 등급 신청 (`kkf_portal_apply_membership`)
  - `portal_check_id`: 아이디 중복 검사 (`kkf_portal_check_id`)
  - `portal_register`: 신규 회원가입 (`kkf_portal_register`)
  - `portal_send_sms_verification` / `portal_verify_sms_code`: 알리고 SMS 가입 인증
  - `portal_find_pw_*`: 비밀번호 찾기 (정보조회 -> SMS발송 -> 검증 -> 재설정)
  - `portal_get_nice_auth_url` / `nice_callback` / `portal_nice_get_verified_data`: NICE 아이핀 팝업 생성 및 콜백 처리
  - `admin_nice_*`: `handlers/nice_api_handler.php`로 디스패치 (어드민 모바일 혈통서 심사/발급/채번 등)

#### 3) `nice_api_bridge.php` (NICE 평가정보 공식 대외계 게이트웨이)
- **경로:** `/nice_api_bridge.php`
- **역할:** 외부 NICE 서버와의 공식 대외계 암호화 전문 통신 게이트웨이.
- **보안 검증 흐름:**
  1. 수신 헤더 및 본문 검증: `enc_key_version`, `req_dttm`, `enc_data`, `req_hmac`.
  2. HMAC 서명 검증: `sign_str = trim(enc_key_version) . trim(req_dttm) . trim(enc_data);`
     `base64_encode(hash_hmac('sha256', $sign_str, $hmac_key, true))` 값과 `$req_hmac` 일치 여부 검증.
  3. `openssl_decrypt($enc_data, 'aes-256-cbc', $aes_key, OPENSSL_RAW_DATA, $aes_iv)` 복호화.
  4. 요청 URI에 따른 비즈니스 핸들러 호출:
     - `/nice/list` -> `nice_handle_list()`
     - `/nice/detail` -> `nice_handle_detail()`
     - `/nice/request` -> `nice_handle_request()`
     - `/nice/refund` -> `nice_handle_refund()`
     - `/nice/image` -> `nice_handle_image()` (평문 JSON 통신 예외 규격)
  5. 응답 평문 데이터 UTF-8 변환 후 `openssl_encrypt()`로 암호화 및 응답 HMAC 서명 생성 반환.
  6. HTTP 응답 헤더에 `GW_RSLT_CD: 1200` 전송.

#### 4) `nice_api_config.php` (NICE 보안 설정)
- **경로:** `/nice_api_config.php`
- **역할:** 환경별 암호화 키 정의:
  - UAT(테스트): AES Key, AES IV, HMAC Key, Client ID(`771accb9-...`), Client Secret(`e226...`), Product ID(`2601687173`)
  - PROD(운영): AES Key, AES IV, HMAC Key, Client ID(`369a3882-...`), Client Secret(`949c...`), Product ID(`2601941116`)

#### 5) `payment_callback.php` (KG모빌리언스 결제 콜백)
- **경로:** `/payment_callback.php`
- **역할:** 사용자가 PG사 창에서 결제를 마치면 결과를 받아 KG모빌리언스 최종 승인 API(`https://mup.mobilians.co.kr/MUP/api/approval`)를 호출하고, DB에 성공 내역 반영 후 부모 창에 `postMessage` 송신 후 자동 닫힘.

---

### 3.2 데이터 헌법 라이브러리 (`lib/kkc_constitution.php`)

이 파일은 시스템 전체의 데이터 무결성을 보장하는 **기준 헌법**입니다:
- **`$KKC_TABLE_MAP`**: 각 테이블의 기본키(PK), 문자 인코딩(EUC-KR vs UTF-8), 기본 검색 컬럼을 선언.
- **`kkc_convert($data, $enc = 'EUC-KR', $to_utf8 = true)`**:
  배열과 문자열을 재귀 순회하며 EUC-KR(CP949) <-> UTF-8 변환. 이미 완성형 한글 UTF-8인 경우 중복 변환을 방지하는 가드 내장.

---

### 3.3 비즈니스 로직 핸들러 10종 전수 분석 (`handlers/*.php`)

| 핸들러 파일명 | 주요 기능 및 함수 목록 |
|---|---|
| **`handlers/crud_logic.php`** | `kkc_handle_general_list()` (16진수 바이너리 UNHEX 검색, 페이징)<br>`kkc_handle_create()`, `kkc_handle_update()`, `kkc_handle_delete()` (기본 CRUD)<br>`kkc_handle_upload_image()` (WP 미디어 라이브러리 등록)<br>`kkc_handle_sql_batch()` (단일 트랜잭션 일괄 실행)<br>`kkc_handle_get_dogshows()` (포인트/상력용 대회 목록)<br>`kkc_handle_export_table_batch()` (SQL DUMP 스트리밍 배치) |
| **`handlers/dog_logic.php`** | `kkc_handle_pedigree_list()` (부모견 `LEFT JOIN` 결합, 4종 타단체 번호 교차 검색)<br>`kkc_handle_get_dongtae()` (동태 번호 상세 조회)<br>`kkc_handle_next_dongtae_no()` (동태 번호 다음 일련번호 채번)<br>`kkc_handle_owner_history()` (소유자 변경 이력 목록)<br>`kkc_handle_save_pedigree_layout()`, `kkc_handle_get_pedigree_layout()` (혈통서 인쇄 좌표 저장/로드) |
| **`handlers/member_logic.php`** | `kkc_handle_member_list()` (생년월일 포맷 통합검색, 주소 4종 통합검색, 직능 토큰 매칭)<br>`kkc_handle_membership_applications_list()` (회원 등급 신청 목록)<br>`kkc_handle_membership_application_action()` (승인 시 만65세 평생회원 계산 및 유효기간 연장) |
| **`handlers/event_logic.php`** | `kkc_get_target_table()` (카테고리별 대상 테이블 매핑)<br>`kkc_handle_event_list()` (행사 5종 분할 테이블 통합 조회, 신청자 수 배치 집계)<br>`kkc_handle_event_save()` (행사 생성/수정, 접수기간 시/분 파싱)<br>`kkc_handle_event_delete()` (행사 삭제) |
| **`handlers/download_logic.php`** | `kkc_handle_download_list()` (WPDM 서식 자료실 목록)<br>`kkc_handle_save_download()`, `kkc_handle_update_download()` (WPDM 패키지 등록/수정)<br>`kkc_handle_pin_download()` (상단 고정 핀 토글) |
| **`handlers/post_logic.php`** | `kkc_handle_get_notices()` (공지사항 및 페이지 목록)<br>`kkc_handle_save_notice()` (WAF 우회 Base64 본문 디코딩 저장, 캐시 클리어)<br>`kkc_handle_get_categories()` (카테고리 목록) |
| **`handlers/payment_gateway_logic.php`** | `kkc_pg_register()` (KG모빌리언스 MUP 거래등록 API 호출, HMAC 생성, Transient 보관) |
| **`handlers/member_portal_logic.php`** | `kkf_portal_get_my_data()` (회원+신청내역 8종+반려견+직능 원스톱 조합)<br>`kkf_portal_register()` (SMS 인증 완료 검증 후 회원가입)<br>`kkf_portal_send_sms_verification()`, `kkf_portal_verify_sms_code()` (알리고 SMS 발송/검증)<br>`kkf_portal_find_pw_*()` (비밀번호 재설정 3단계)<br>`set_transient()`, `get_transient()` (자체 DB 임시 저장소) |
| **`handlers/nice_ipin_logic.php`** | `kkf_portal_get_nice_auth_url()` (NICE OAuth 토큰 및 인증 URL 발급)<br>`kkf_portal_handle_nice_callback()` (콜백 수신, PBKDF2 키 유도, AES-GCM 복호화) |
| **`handlers/nice_api_handler.php`** | 🌟 **(141KB 대형 모듈)**<br>`nice_handle_list()` (API 001 소유견 목록 조회)<br>`nice_handle_detail()` (API 002 반려견 상세 및 4대 혈통 트리)<br>`nice_build_ancestors_list()` (14마리 조상 계보 재귀 구축)<br>`nice_handle_request()` (API 003 발급 신청 접수 전표)<br>`nice_handle_refund()` (API 005 발급 취소/환불)<br>`nice_handle_image()` (API 007 사진 등록 고속 파일 저장)<br>`nice_notify_screening_result()` (API 004 심사 결과 아웃바운드 푸시)<br>`nice_notify_ownership_transfer()` (API 006 소유권 이전 아웃바운드 푸시)<br>`nice_generate_unique_reg_no()` (모바일 5000번대 등록번호 자동 채번)<br>`nice_admin_pedigree_action()` (관리자 승인/반려/수정)<br>`nice_admin_pedigree_transfer()` (관리자 소유권 이전) |

---

## 4. 데이터베이스(DB) 테이블 및 모든 컬럼 필드 전수 사전

### 4.1 인코딩 체계와 바이너리 세션(Binary-Safe) 핵심 원리
Cafe24의 MariaDB는 수십 년 전 레거시 구조(`euckr`)와 최신 웹 구조(`utf8mb4`)가 공존합니다.  
레거시 테이블을 다룰 때 일반 SQL(`WHERE name LIKE '%홍길동%'`)을 날리면 한글이 깨지거나 빈 결과가 나옵니다.  
**반드시 아래 3단계 규칙을 지켜야 합니다:**
1. `$wpdb->query("SET NAMES 'binary'");`
2. PHP에서 `$q_hex = bin2hex(kkc_convert($keyword, 'EUC-KR', false));`
3. SQL에서 `WHERE column LIKE CONCAT('%', UNHEX('$q_hex'), '%')`
4. 조회가 끝나면 `$wpdb->query("SET NAMES 'utf8mb4'");`

---

### 4.2 회원 및 권한/자격 테이블군

#### 1) `memTab` (회원 원장 - EUC-KR)
| 컬럼명 | 데이터 타입 | 설명 및 비즈니스 용도 | 매핑 TypeScript 필드 |
|---|---|---|---|
| `mid` | INT(11) AUTO_INCREMENT | **[PK]** 회원 고유 번호 | `mid` |
| `id` | VARCHAR(50) | 로그인 아이디 및 회원번호 | `id`, `loginId`, `mem_no` |
| `passwd` | VARCHAR(50) | 비밀번호 (평문 또는 레거시 암호화) | `passwd` |
| `name` | VARCHAR(50) | 회원 성명 (한글 CP949) | `name` |
| `name_eng` | VARCHAR(50) | 회원 영문 성명 | `name_eng` |
| `birth` | VARCHAR(20) | 생년월일 (`YYYYMMDD`, `YYYY-MM-DD` 등) | `birth` |
| `gender` | VARCHAR(10) | 성별 (`1`/`남성`, `0` or `2`/`여성`) | `gender` |
| `hp` | VARCHAR(20) | 휴대전화 번호 | `hp` |
| `phone` | VARCHAR(20) | 일반 유선전화 번호 | `tel` |
| `email` | VARCHAR(100) | 이메일 주소 | `email` |
| `zipcode`, `addr`, `addr_1` | VARCHAR | 자택 우편번호, 기본주소, 상세주소 | `zipcode`, `addr`, `addr1` |
| `zipcode2`, `addr2`, `addr2_1`| VARCHAR | 사업장/직장 우편번호, 기본주소, 상세주소 | `zipcode_dm`, `addr_dm`, `addr1_dm` |
| `saho` | VARCHAR(50) | 공인 번식 견사호 (한글 Kennel Name) | `saho` |
| `saho_eng` | VARCHAR(50) | 공인 번식 견사호 영문명 | `saho_eng` |
| `saho_no` | VARCHAR(30) | 견사호 등록번호 | `saho_no` |
| `saho_date` | VARCHAR(20) | 견사호 등록 승인일자 | `saho_date` |
| `mem_degree` | VARCHAR(10) | 회원 등급 (`B0` 준회원, `A0`~`A3` 정회원, `S0`/`C0` 평생회원) | `rank` |
| `mem_type` | VARCHAR(10) | 회원 구분 (`P` 개인, `C` 단체) | `mem_type` |
| `firstdate` | INT(11) | 최초 가입일 (Unix Timestamp) | `joinDate` |
| `signdate` | VARCHAR(20) | 최종 갱신일자 | `signdate` |
| `end_date` | DATE / VARCHAR(20)| 정회원 자격 만료일자 (`YYYY-MM-DD`) | `expiryDate` |
| `pro_class` | VARCHAR(100) | 취득 전문직능 코드 (예: `PS1-TR2`) | `proClass` |
| `nice_ci` | VARCHAR(100) | NICE 본인인증 연계정보 (CI - 88자리) | `nice_ci` |
| `nice_di` | VARCHAR(100) | NICE 중복가입확인정보 (DI - 64자리) | `nice_di` |
| `nice_verified_at` | DATETIME | 실명인증 완료 일시 | `nice_verified_at` |
| `memo` | TEXT | 관리자 특이사항 메모 | `memo` |

#### 2) `membership_applications` (회원 등급 신청 - UTF-8)
- `uid` [PK], `mid`, `mem_no`, `name`, `req_degree` (`A0`: 정회원, `S0`: 평생회원), `req_years` (1~3년, 특별회원은 99), `amount` (금액), `depositor` (입금자명), `status` (`P` 대기, `Y` 승인, `N` 반려), `apply_date`, `process_date`, `admin_memo`.

#### 3) `pro_classTab` & `skillTab`
- `pro_classTab`: `uid`, `keyy` (예: `PS1`, `TR1`), `name` (애견미용사 1급, 훈련사 등).
- `skillTab`: `uid`, `mb_id` (회원 ID), `skill_name` (자격증명), `name` (취득자 성명).

---

### 4.3 혈통서/반려견 및 동태 관리 테이블군

#### 1) `dogTab` (반려견 혈통서 원장 - EUC-KR)
| 컬럼명 | 데이터 타입 | 설명 및 비즈니스 용도 | 매핑 TypeScript 필드 |
|---|---|---|---|
| `uid` | INT(11) AUTO_INCREMENT | **[PK]** 견 고유 식별 번호 | `uid`, `id` |
| `reg_no` | VARCHAR(50) | **공식 혈통 등록번호** (예: `POM-B-2600001`) | `regNo` |
| `name` | VARCHAR(50) | 반려견 호출명 (Call Name) | `name` |
| `fullname` | VARCHAR(100) | 견 공식 전체 명칭 (견사호 + 호출명) | `fullName` |
| `sex` | VARCHAR(10) | 성별 (`1` or `M`: 수컷, `2` or `F`: 암컷) | `gender` |
| `birth` | VARCHAR(20) | 생년월일 (`YYYY-MM-DD`) | `birthDate` |
| `dog_class` | VARCHAR(50) | 견종 분류 코드 | `group` |
| `breed_name` | VARCHAR(50) | 견종 한글명 (예: 포메라니안, 저먼 셰퍼드) | `breed` |
| `hair` | VARCHAR(50) | 모색 코드 또는 한글 모색명 | `color` |
| `hair_long` | VARCHAR(20) | 모질 및 장모 여부 | `coatType` |
| `index_no` | VARCHAR(50) | 색인 번호 | `indexNo` |
| `micro` | VARCHAR(50) | 동물등록 마이크로칩 15자리 번호 | `microchip` |
| `saho` | VARCHAR(50) | 번식 견사호 (한글) | `kennel` |
| `saho_eng` | VARCHAR(50) | 번식 견사호 (영문) | `kennelNameEng` |
| `poss_id` | VARCHAR(50) | 소유자 회원 아이디 (`memTab.id`) | `ownerId` |
| `poss_name` | VARCHAR(50) | 소유자 성명 | `owner` |
| `poss_addr`, `poss_phone` | VARCHAR | 소유자 주소, 연락처 | `ownerAddr`, `ownerPhone` |
| `breeder_id`, `breeder` | VARCHAR | 번식자 회원 아이디, 번식자 성명 | `breederId`, `breeder` |
| `fa_regno` | VARCHAR(50) | **부견(Sire)의 dogTab.uid** (또는 등록번호) | `sireUid`, `sireRegNo` |
| `mo_regno` | VARCHAR(50) | **모견(Dam)의 dogTab.uid** (또는 등록번호) | `damUid`, `damRegNo` |
| `foreign100` | VARCHAR(50) | 국내 타단체 등록번호 (KKF 등) | `domesticNo` |
| `foreign_no`, `foreign_no2`| VARCHAR(50) | 해외 타단체 등록번호 1, 2 (AKC, FCI 등) | `foreignNo`, `foreignNo2` |
| `spec_bone` | VARCHAR(50) | 고관절(HD/ED) 검사 결과 | `specBone` |
| `spec_dna` | VARCHAR(50) | DNA 검사 일련번호/결과 | `specDna` |
| `spec_train` | VARCHAR(50) | 공인 훈련 타이틀 (BH, IGP 등) | `specTrain` |
| `spec_win`, `spec_win2` | VARCHAR(100) | 도그쇼 챔피언 타이틀 (KKC CH, INT.CH 등) | `specWin`, `specWin2` |
| `dongtae_no` | VARCHAR(50) | 동태 번호 (`dongtaeTab.dongtae_no`와 매핑) | `dongtaeNo` |
| `ok_date` | VARCHAR(20) | 혈통서 최종 승인/발행 일자 | `okDate` |
| `signdate`, `moddate` | VARCHAR(20) | 데이터 등록일자, 최종 수정일자 | `signdate`, `moddate` |

#### 2) `dongtaeTab` (동태 관리 원장 - EUC-KR)
동복 형제자매(같은 배 자견) 묶음 관리 테이블 (39개 컬럼):
- `uid` [PK], `dongtae_no` (예: `{FFFFF66452`)
- `birth_M`, `birth_F` (수컷/암컷 출산 두수), `dead_M`, `dead_F` (사산 두수), `cancel_M`, `cancel_F` (취소 두수)
- `dead2_M`, `dead2_F` (등록전 사망), `missing_M`, `missing_F` (불명), `bringup_M`, `bringup_F` (포유/육성)
- `reg_count_M`, `reg_count_F` (최종 혈통 등록 두수)
- `dongtae_name` ~ `dongtae_name14` (각 자견 호출명 최대 14마리)
- `regno_start`, `regno_end` (발급 시작/종료 등록번호)
- `fa_reg_no`, `mo_reg_no`, `breeder`, `reg_date`, `sign_date`, `memo`.

#### 3) `poss_changeTab` (소유자 명의변경 이력 - EUC-KR)
- `uid` [PK], `dog_uid` (`dogTab.uid`), `reg_no` (등록번호), `change_date` (변경승인일자), `poss_id` (새 소유자 ID), `poss_name` (새 소유자 성명), `poss_addr`, `poss_phone`, `sign_date`.

#### 4) `hairTab` (모색 마스터 - EUC-KR)
- `uid` [PK], `hair` (모색 한글명 - 화이트, 세이블 등), `short_key` (견종코드), `hair_eng` (영문 모색명).

---

### 4.4 대회/행사 5종 및 신청자 8종 테이블군

#### 1) 행사 마스터 5종 (`ds_pid` PK, UTF-8)
1. `dogshow`: 도그쇼, 셰퍼드 전람회, 진도견 선발대회 (접두사 `ds_`)
2. `stylist`: 반려견 스타일리스트 경연대회 (접두사 `st_`)
3. `sports_event`: 어질리티, 디스크독, 플라이볼, 훈련경기대회 (접두사 `sp_`)
4. `seminar`: 세미나 및 교육 (접두사 `sm_`)
5. `breed_exam`: 종견인정검사, 번식자격시험 (접두사 `be_`)

- **공통 컬럼:** `ds_pid` [PK], `ds_name` (대회명), `ds_subtitle`, `ds_type`, `ds_place`, `ds_date` (시작일), `ds_end_date` (종료일), `ds_start_time`, `ds_end_time`, `reg_start_date`, `reg_start_time`, `reg_end_date`, `reg_end_time` (온라인 접수기간), `ds_thumbnail`, `ds_content` (요강 HTML), `ds_etc` (심사위원), `ds_organizer`.

#### 2) 신청자 테이블 8종 (UTF-8)
- `dogshow_applicant`, `stylist_applicant`, `stylist_intl_applicant`, `agility_applicant`, `discdog_applicant`, `flyball_applicant`, `sports_applicant`, `seminar_applicant`, `breed_exam_applicant`
- **공통 컬럼:** `id` (또는 `uid`) [PK], `ds_pid` (행사 ID), `handler_id` (회원 ID), `name`, `contact`, `payment_status` (`입금대기`, `입금완료`, `취소`), `total_amount`, `created_at`.
- **종목별 특화 컬럼:** 체고(`size`), 과목(`subject`), 출전구분(`division`), 소속학원(`affiliation`), 응시급수(`grade`), 팀명(`team_name`), 발정여부(`is_heat`) 등.

#### 3) `competition_fee_options` (대회 참가비 옵션 - UTF-8)
- `id` [PK], `event_type` (종목명), `event_id` (`ds_pid`), `option_name` (옵션명), `option_price` (금액), `is_required` (필수 여부).

---

### 4.5 상력 및 포인트 테이블군
- `point`: `pt_pid` [PK], `ds_pid` (`dogshow.ds_pid`), `reg_no`, `pt_title`, `pt_points`, `pt_award`, `pt_regdate`.
- `prize_dogTab`: `uid` [PK], `reg_no`, `event_name`, `referee`, `prize_date`, `prize_rank`.
- `breed_dogTab`: `uid` [PK], `reg_no`, `dog_name`, `start_date`, `end_date`, `referee`, `comment`.

---

### 4.6 워드프레스 코어 및 시스템 테이블군
- `wp_posts`: 공지사항, 일반 페이지, WPDM 서식 자료실(`post_type = 'wpdmpro'`).
- `wp_postmeta`: 첨부파일 경로, 다운로드 카운트, 상단 고정(`__wpdm_featured`).
- `kkc_transients`: 알리고 SMS 인증코드(180초) 및 임시 세션 보관용 자체 테이블 (`t_key`, `t_value`, `expires`).

---

## 5. 🌟 [특집] NICE 모바일 혈통서 연동 시스템 완전 해부

이 장은 신규 개발자가 가장 주의 깊게 인계받아야 하는 대외계 통신 규격 전체를 기술합니다.

### 5.1 대외계 통신 보안 아키텍처 (AES-256-CBC & HMAC-SHA256)

```
[NICE 대외계 서버]                                       [협회 Cafe24 서버]
       │                                                         │
       │ ── 1. 인바운드 암호화 요청 (/nice/list, /nice/detail 등) ─> │ nice_api_bridge.php
       │    Body: {enc_key_version, req_dttm, enc_data, req_hmac}│
       │                                                         │ (1) HMAC-SHA256 무결성 검증
       │                                                         │ (2) AES-256-CBC 복호화
       │                                                         │ (3) handlers/nice_api_handler.php 실행
       │                                                         │ (4) AES-256-CBC 암호화 & res_hmac 생성
       │ <── 2. HTTP 200 OK + Header(GW_RSLT_CD: 1200) ──────── │
       │    Body: {enc_data, res_hmac}                           │
       │                                                         │
       │ <── 3. 심사결과 푸시 (/pet/pedigree/result) ───────────── │ nice_notify_screening_result()
       │    (관리자가 어드민에서 승인/반려 시 실시간 발송)       │
```

- **암호화 규격:** `AES-256-CBC` (Key: 32바이트, IV: 16바이트, PKCS7 패딩)
- **무결성 검증 규격:** `HMAC-SHA256`
- **서명 대상 문자열(Sign String) 공식:**  
  ⚠️ **절대 주의:** `trim()`을 생략하면 공백/개행으로 인해 무결성 검증 에러(`GW_RSLT_CD: 1400`)가 발생합니다.  
  `$sign_str = trim($enc_key_version) . trim($req_dttm) . trim($enc_data);`
- **게이트웨이 헤더:** 성공 시 `GW_RSLT_CD: 1200` 필수 전송.

---

### 5.2 인바운드 5대 API 상세 스펙 및 JSON 전문

#### 1) [API 001] 혈통서 발급 목록 조회 (`/nice/list`)
- **수신 JSON:**
  ```json
  { "poss_ci": "88자리_NICE_CI_문자열" }
  ```
- **응답 JSON:**
  ```json
  {
    "result_cd": "S000",
    "list_cnt": 1,
    "list": [
      {
        "reg_no": "POM-C65001-NP",
        "name": "초코",
        "dog_classTab_name": "Pomeranian"
      }
    ]
  }
  ```

#### 2) [API 002] 혈통서 상세 정보 조회 (`/nice/detail`)
- **수신 JSON:**
  ```json
  {
    "poss_ci": "88자리_NICE_CI_문자열",
    "reg_no": "POM-C65001-NP"
  }
  ```
- **응답 JSON:**
  ```json
  {
    "result_cd": "S000",
    "reg_no": "POM-C65001-NP",
    "name": "초코",
    "saho_eng": "ROYAL KENNEL",
    "saho": "로얄켄넬",
    "dog_classTab_name": "Pomeranian",
    "micro": "410123456789012",
    "sex": "M",
    "hair": "오렌지 세이블",
    "breed_name": "김번식",
    "breed_addr": "경기도 광주시...",
    "poss_name": "홍길동",
    "poss_addr": "서울특별시 강남구...",
    "birth": "20240510",
    "reg_date": "20260315143000",
    "birth_m": 3,
    "birth_f": 2,
    "reg_count_m": 2,
    "reg_count_f": 2,
    "father_name": "KING",
    "father_reg_no": "POM-B-20001",
    "father_saho": "ROYAL",
    "mother_name": "QUEEN",
    "mother_reg_no": "POM-B-20002",
    "mother_saho": "ROYAL",
    "anc_name": "초코",
    "anc_saho": "ROYAL KENNEL",
    "ancestors": [
      { "type": "fatherFather", "name": "GRAND KING", "saho": "ROYAL", "reg_no": "POM-101" }
      /* 총 14마리 계보 슬롯 */
    ]
  }
  ```

#### 3) [API 003] 모바일 혈통서 발급 신청 접수 (`/nice/request`)
- **수신 파라미터:** `order_no`, `order_dttm`, `poss_ci`, `req_name`, `req_mobile`, `petpin`, `name`, `dog_classTab_name`, `micro`, `sex`, `hair`, `birth`, `father_name`, `father_reg_no`, `mother_name`, `mother_reg_no`, `image1_hmac` ~ `image4_hmac`.
- **처리:** `nice_pedigree_requests` 테이블에 `status = 'P'`(심사대기)로 저장.
- **응답:** `{"result_cd": "S000"}`

#### 4) [API 005] 발급 취소 및 환불 (`/nice/refund`)
- **수신:** `order_no`, `refund_dttm`, `refund_ci`
- **처리:** `nice_pedigree_requests`에서 해당 주문 `status = 'C'`(결제취소) 갱신.

#### 5) [API 007] 반려견 사진 등록 (`/nice/image`)
- **특이사항:** 암호화 전문이 아닌 **평문 JSON 전송 규격**.
- **수신 JSON:**
  ```json
  {
    "order_no": "P202609060001",
    "image_idx": 1,
    "image_base64": "/9j/4AAQSkZJRgABAQ..."
  }
  ```
- **핵심 로직:**
  - 이미지 용량 검증: **10KB ~ 3MB 허용** (300KB 미만 압축 이미지도 정상 수신).
  - Cafe24 CPU 부하 방지: 고속 다이렉트 바이너리 파일 쓰기(`file_put_contents`) 적용.
  - 저장 위치: `/wp-content/uploads/nice_pedigree/nice_ped_req_{uid}_img_{idx}.jpg`
  - `nice_pedigree_requests.image{N}_path` 업데이트.

---

### 5.3 아웃바운드 2대 푸시 API 상세 스펙 및 JSON 전문

#### 1) [API 004] 심사 결과 통보 (`POST /pet/pedigree/result`)
- **발송 시점:** 관리자 화면(`NicePedigreeManagement.tsx`)에서 [승인] 또는 [반려] 클릭 시 실시간 푸시.
- **승인 시 (`reg_result: 'S'`):**
  - 발급된 등록번호(`reg_no`), 견명, 견사호, 표준견종명, 성별, 마이크로칩, 생년월일, 출산/등록두수, 부모견 정보, **4대 조상 혈통 트리(`ancestors`) 14마리 계보 전체 필드를 필수로 포함**.
- **반려 시 (`reg_result: 'F'`):**
  - 엑셀 가이드 Sheet 6 R05 규격: 원본 신청 데이터 전체 필드 반환 + **`ancestors: []` 빈 배열을 반드시 포함**해야 함.

#### 2) [API 006] 소유권 이전 통보 (`POST /pet/pedigree/transfer`)
- **발송 시점:** 모바일 혈통서 명의변경 승인 시 실시간 푸시.
- **발송 JSON:**
  ```json
  {
    "poss_ci": "기존_양도인_CI",
    "move_ci": "신규_양수인_CI",
    "reg_no": "POM-C65001-NP"
  }
  ```

---

### 5.4 4대 조상 혈통 트리(14마리 계보) 재귀 탐색 알고리즘
`handlers/nice_api_handler.php`의 `nice_build_ancestors_list()` 함수:
- **부견 라인 (7마리):**
  - 조부모: `fatherFather`, `fatherMother`
  - 증조부모: `fatherFatherFather`, `fatherFatherMother`, `fatherMotherFather`, `fatherMotherMother`
- **모견 라인 (7마리):**
  - 조부모: `motherFather`, `motherMother`
  - 증조부모: `motherFatherFather`, `motherFatherMother`, `motherMotherFather`, `motherMotherMother`
- 각 노드 형식: `{"type": "슬롯명", "name": "견명", "saho": "견사호", "reg_no": "등록번호"}`

---

### 5.5 모바일 5000번대 등록번호 자동 채번 공식 (`nice_generate_unique_reg_no`)
- **공식:** `[견종코드 3자리]-[기간코드_십][기간코드_일][4자리 순번]-NP`
  - 기간코드_십: 2020년대 = **C**, 2030년대 = **D**
  - 기간코드_일: 2026년 = **6**
  - 4자리 순번: 모바일 전용 5000번대 대역 (`5001`부터 시작하여 해당 견종/연도 내 1씩 증가)
  - 식별 접미사: **`-NP`**
  - 예시: 2026년 포메라니안 1번째 모바일 혈통서 ➔ **`POM-C65001-NP`**
- **기존 협회 등록견:** 새로운 번호를 따지 않고 기존 등록번호 끝에 `-NP`만 붙여 발급 (예: `KKC-B-2300123-NP`).

---

### 5.6 관리자 심사 전표 라이프사이클
```
[모바일 앱 발급 신청 접수]
          │
          ▼
[nice_pedigree_requests (상태: P - 심사대기)]
          │
          ├─────────────────────────────────────────────────┐
          ▼                                                 ▼
    [관리자: 승인 처리]                               [관리자: 반려 처리]
          │                                                 │
  (1) 견종별 5000번대 자동 채번                             (1) 반려 사유 입력
  (2) nice_pedigree_requests.reg_no 동기화                  (2) status = 'N' 갱신
  (3) nice_dogTab 및 dogTab에 정식 혈통서 인서트            (3) NICE 푸시 통보 (API 004: reg_result='F')
  (4) nice_memTab에 소유자 계정 자동 연결                   (4) 모바일 앱 사용자에게 반려 안내
  (5) status = 'Y' 갱신
  (6) NICE 푸시 통보 (API 004: reg_result='S', 4대혈통트리)
  (7) NICE GW_RSLT_CD: 1200 확인 후 완료
```

---

### 5.7 NICE 전용 격리 DB 테이블
- `nice_pedigree_requests`: 모바일 혈통서 심사 신청 전표 원장
- `nice_dogTab`: 발급 완료된 모바일 혈통서 공식 원장
- `nice_memTab`: NICE 인증 회원 전용 복제 원장
- `nice_poss_changeTab`: 모바일 혈통서 명의변경 이력

---

## 6. 프론트엔드 React 19 아키텍처 및 화면-서비스 매핑

### 6.1 프론트엔드 주요 파일 맵
```
src/
├── App.tsx                     # 메인 애플리케이션 (라우팅, 탭 전환, 모달)
├── types.ts                    # TypeScript 타입 정의 (Member, Pedigree, Dongtae 등)
│
├── services/                   # API 통신 서비스 계층
│   ├── memberService.ts        # 회원 관리, 엑셀 대량 등록
│   ├── pedigreeService.ts      # 혈통서 목록, 부모견 검색
│   ├── eventService.ts         # 행사 5종 및 출진자 관리
│   ├── portalService.ts        # 회원 포털 & NICE 관리자 API
│   ├── dongtaeService.ts       # 동태 관리 API
│   └── noticeService.ts        # 공지사항 관리 API (Base64 WAF 인코딩)
│
└── components/                 # UI 컴포넌트 계층
    ├── MemberManagementPage.tsx # 회원 관리 화면
    ├── PedigreeManagementPage.tsx # 혈통서 관리 및 동태 조회
    ├── PedigreeDetailModal.tsx # 혈통서 상세 모달 (4대 혈통 트리 시각화)
    ├── EventManagementPage.tsx # 행사 등록 및 출진 리스트
    ├── NicePedigreeManagement.tsx # 🌟 NICE 모바일 혈통서 관리자 심사 센터
    ├── NiceMemberManagement.tsx   # NICE 본인인증 회원 관리 센터
    └── MemberPortal.tsx        # 회원 마이페이지
```

---

## 7. 기타 대외 연동 시스템

1. **NICE 통합인증 (아이핀):**
   `handlers/nice_ipin_logic.php`에서 OAuth2 Access Token 발급 -> 인증창 URL 호출 -> 콜백에서 `web_transaction_id` 수신 -> 결과 조회 -> `PBKDF2` 키 유도 및 `AES-256-GCM` 복호화로 CI/DI 추출.
2. **KG모빌리언스 결제 (MobilPay):**
   `handlers/payment_gateway_logic.php`에서 거래등록(MUP API)을 호출하여 팝업 URL(`pay_url`) 획득 -> 결제 완료 시 `payment_callback.php`에서 MUP 4.6 승인 처리 및 DB 즉시 갱신.
3. **알리고(Aligo) SMS:**
   `handlers/member_portal_logic.php`의 `kkf_portal_send_aligo_sms`를 통해 6자리 난수 코드를 발송하고 `kkc_transients`에 180초 TTL로 보관/검증.

---

## 8. 실무 필수 트러블슈팅 및 절대 금기 수칙

1. **🚨 [EUC-KR 한글 검색 수칙]:**
   `memTab`, `dogTab` 등 레거시 테이블에 일반 `WHERE name LIKE '%홍길동%'` 쿼리를 절대 실행하지 마십시오. 항상 `SET NAMES 'binary'` 후 16진수 `LIKE CONCAT('%', UNHEX('...'), '%')` 방식을 사용하십시오.
2. **🚨 [WAF 웹 방화벽 차단 방어]:**
   공지사항 본문이나 행사 요강 저장 시 HTML 태그로 인한 403 Forbidden 에러를 방지하기 위해 프론트엔드의 Base64 인코딩 전송 방식을 유지하십시오.
3. **🚨 [NICE 아웃바운드 푸시 trim() 누락 금지]:**
   서명 문자열(`enc_key_version + req_dttm + enc_data`)에 `trim()`을 반드시 적용하십시오.
4. **🚨 [NICE JSON 슬래시 이스케이프 방어]:**
   NICE 통보 시 `JSON_UNESCAPED_SLASHES` 옵션을 포함하여 URL 슬래시(`/`)가 `\/`로 변환되는 것을 방지하십시오.
5. **🚨 [대용량 이미지 502 Bad Gateway 방어]:**
   PHP 메모리 제한(512M) 및 120초 타임아웃 설정을 유지하십시오.

---

**문서 보관 위치:** `/DEVELOPER_HANDOVER_GUIDE.md` (프로젝트 루트)  
**작성자:** Antigravity AI Senior Systems Architecture Team
