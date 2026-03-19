
import { Member, Pedigree, Notice, PostCategory, ParentDogInfo, PersonSearchResult, OwnerHistory, Point, Prize, Evaluation } from '../types';

export let BRIDGE_URL = 'https://kkc3349.mycafe24.com/bridg.php';
export const SECRET_KEY = 'kkc-super-secret-key-change-this-now-12345!';

export const setApiConfig = (url: string) => {
    let cleanUrl = url.replace(/\/$/, '');
    if (!cleanUrl.endsWith('.php')) cleanUrl = `${cleanUrl}/bridg.php`;
    BRIDGE_URL = cleanUrl;
};

/**
 * 🛡️ 일반 데이터 전송 엔진 (JSON)
 */
export const fetchBridge = async (payload: any) => {
    const jsonString = JSON.stringify(payload);
    const sizeInBytes = new Blob([jsonString]).size;
    const sizeInMB = sizeInBytes / (1024 * 1024);

    try {
        const response = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Auth-Token': SECRET_KEY
            },
            body: jsonString
        });

        if (!response.ok) {
            if (response.status === 413 || response.status === 403) {
                throw new Error(`[보안 정책 차단] 전송량(${sizeInMB.toFixed(2)}MB)이 서버 허용 범위를 벗어났습니다.`);
            }
            const errorText = await response.text();
            throw new Error(`서버 응답 오류 (HTTP ${response.status}): ${errorText.substring(0, 100)}`);
        }

        const rawText = await response.text();

        let data;
        try {
            data = JSON.parse(rawText);
        } catch (parseError) {
            // 🚨 JSON 파싱 에러 (Unexpected end of JSON input 등) 시 
            // 서버가 뱉어낸 실제 오류 내용(HTML이나 PHP 에러 로그)을 가감없이 끄집어냅니다.
            console.error("%c🚨 [FATAL: JSON PARSE ERROR] 서버에서 넘어온 원본 내용입니다:", "color: white; background: red; font-size: 14px; font-weight: bold;", "\n\n" + rawText);
            throw new Error(`서버 응답 오류 (JSON이 아님):\n${rawText.substring(0, 300)}... (콘솔창을 확인하세요)`);
        }

        if (data.success === false) {
            console.error("%c[Server Error Details]", "color: #f04444; font-weight: bold; background: #fee2e2; padding: 4px;", data);
            const errMsg = data.error + (data.query ? `\n\n[실행된 쿼리]:\n${data.query}` : "");
            throw new Error(errMsg || "알 수 없는 서버 오류");
        }
        return data;
    } catch (e: any) {
        if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
            if (sizeInMB > 0.4) {
                throw new Error(`연결 실패: 데이터량(${sizeInMB.toFixed(2)}MB)이 카페24 보안 한계를 초과했습니다. 본문의 사진을 삭제하거나 줄여주세요.`);
            }
            throw new Error(`네트워크 연결이 차단되었습니다. 잠시 후 다시 시도해주세요.`);
        }
        throw e;
    }
};

/**
 * 🚀 [ULTIMATE FIX] 이미지 업로드 전용 엔진 (WAF 우회용 Multipart 방식)
 */
export const uploadImage = async (base64: string, filename: string) => {
    // 1. Base64를 Blob 객체로 변환 (바이너리 데이터화)
    const byteString = atob(base64.split(',')[1]);
    const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });

    // 2. FormData 생성 (보안 필터가 가장 신뢰하는 전송 방식)
    const formData = new FormData();
    formData.append('mode', 'upload_image');
    formData.append('image_file', blob, filename);
    formData.append('filename', filename);

    try {
        const response = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: {
                'X-Auth-Token': SECRET_KEY // 인증 토큰만 헤더에 포함
                // Content-Type은 FormData 전송 시 브라우저가 자동으로 boundary를 포함하여 설정함
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`사진 업로드 실패 (HTTP ${response.status})`);
        }

        const data = await response.json();
        if (!data.success) throw new Error(data.error || "업로드 실패");
        return data;
    } catch (e: any) {
        console.error("%c[Upload Fail]", "color: red; font-weight: bold;", e);
    }
};

/**
 * 🚀 [IMAGE OPTIMIZATION] 이미지 압축 유틸리티
 */
export const compressImage = (file: File, maxWidth = 2560, quality = 0.9): Promise<File> => {
    // 🛡️ [SMART PASS-THROUGH] If file is already small (< 0.9MB) or not an image, don't touch it.
    if (file.size < 0.9 * 1024 * 1024 || !file.type.startsWith('image/')) {
        return Promise.resolve(file);
    }

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                }
                canvas.toBlob((blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: file.type || 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    } else {
                        resolve(file);
                    }
                }, file.type || 'image/jpeg', quality);
            };
        };
    });
};

/**
 * 🚀 [MULTIPART UPLOAD] File 객체를 직접 업로드하는 엔진 (자동 압축 포함)
 */
export const uploadFile = async (file: File) => {
    let fileToUpload: File | Blob = file;
    if (file.size >= 0.9 * 1024 * 1024 && file.type.startsWith('image/')) {
        fileToUpload = await compressImage(file, 1600, 0.8);
    }

    const formData = new FormData();
    formData.append('mode', 'upload_image');
    formData.append('image_file', fileToUpload, file.name);
    formData.append('filename', file.name);

    // WAF Bypass: Add mode to URL as well
    const uploadUrl = `${BRIDGE_URL}${BRIDGE_URL.includes('?') ? '&' : '?'}mode=upload_image`;

    try {
        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: { 'X-Auth-Token': SECRET_KEY },
            body: formData
        });

        const rawText = await response.text();
        try {
            // PHP 경고 메시지가 섞여 나올 경우를 대비해 JSON 부분만 추출
            const jsonStart = rawText.indexOf('{');
            const jsonEnd = rawText.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                return JSON.parse(rawText.substring(jsonStart, jsonEnd + 1));
            }
            return JSON.parse(rawText);
        } catch (e) {
            console.error("Upload parse error:", rawText);
            throw new Error("서버 응답 처리 중 오류가 발생했습니다.");
        }
    } catch (e: any) {
        throw new Error(e.message || "업로드 실패");
    }
};

/**
 * 🛡️ [DATA MAPPING CONSTITUTION - SECTION: CORE LISTS]
 */
export const fetchMemberStats = async (tableName: string, q: string = '', f: string = 'all', ds: string = '', de: string = '', region: string = '') => {
    try {
        const ranks = ['C0', 'A3', 'A2', 'A1', 'B0'];
        // 🎯 모든 등급별 쿼리에 현재 검색 조건(날짜, 지역 등)을 포함시켜 리얼타임 통계 산출
        const promises = ranks.map(rank => fetchMembers(tableName, 1, q, f, 1, ds, de, rank, region));
        const res = await Promise.all(promises);
        return {
            C0: res[0].total,
            A3: res[1].total,
            A2: res[2].total,
            A1: res[3].total,
            B0: res[4].total,
        };
    } catch (e) {
        console.error("Failed to fetch member stats", e);
        return { C0: 0, A3: 0, A2: 0, A1: 0, B0: 0 };
    }
};

export const fetchMembers = async (t: string, p: number, q: string, f: string, limit: number = 50, ds: string = '', de: string = '', rank: string = 'all', region: string = '', postType: string = '', job: string = '', proClass: string = '') => {
    // job, pro_class 파라미터가 있을 경우 mode='list'에서 필터링으로 작동하도록 백엔드와 통신
    const res = await fetchBridge({ mode: 'list', table: t, page: p, search: q, field: f, limit, date_start: ds, date_end: de, rank: rank, region: region, post_type: postType, job: job, pro_class: proClass });
    if (t === 'memTab') {
        const mapped = (res.data || []).map((m: any) => ({
            id: m.mid?.toString(), mid: m.mid?.toString(), loginId: m.id, mem_no: m.mid?.toString(), name: m.name, name_eng: m.name_eng || '', tel: m.phone || '', hp: m.hp || '', zipcode: m.zipcode || '', addr: m.addr || '', addr1: m.addr_1 || '', zipcode_dm: m.zipcode2 || '', addr_dm: m.addr2 || '', addr1_dm: m.addr2_1 || '', email: m.email || '', birth: m.birth || '', jumin: m.zumin || '', saho: m.saho || '', saho_eng: m.saho_eng || '', saho_no: m.saho_no || '', saho_date: m.saho_reg_date || '', rank: m.mem_degree || '일반', expiryDate: m.end_date || '0000-00-00', joinDate: m.firstdate ? new Date(parseInt(m.firstdate) * 1000).toISOString().split('T')[0] : '', memo: m.memo || '', status: '정상', proClass: m.pro_class || '', company: m.company || m.mb_1 || '', skills: [], dogs: []
        }));
        return { data: mapped, total: parseInt(res.total || '0') };
    }
    if (t === 'skillTab') {
        return { data: (res.data || []).map((s: any) => ({ id: s.uid?.toString(), loginId: s.mb_id, memberName: s.name, name: s.skill_name, date: s.skill_date, memo: s.memo || '' })), total: parseInt(res.total || '0') };
    }
    if (t === 'dogshow' || t === 'dogShowTab') {
        return {
            data: (res.data || []).map((d: any) => ({
                ds_pid: d.ds_pid,
                ds_name: d.ds_name,
                ds_date: d.ds_date,
                ds_place: d.ds_place || '',
                ds_etc: d.ds_etc || '',
                // UI 호환을 위한 매핑
                id: d.ds_pid?.toString(),
                name: d.ds_name,
                date: d.ds_date,
                location: d.ds_place || '',
                judge: d.ds_etc || ''
            })), total: parseInt(res.total || '0')
        };
    }
    return res;
};

export const fetchEventItems = async (activeTab: string, tableName: string) => {
    let table = 'wp_posts', postType = '', taxonomy = '';
    if (activeTab === 'type') {
        table = 'wp_terms';
        taxonomy = 'ep_event_categories';
    }
    else if (activeTab === 'venue') { postType = 'em_location'; }
    else if (activeTab === 'organizer') { postType = 'em_organizer'; }
    else { table = tableName; postType = 'em_event'; }
    const res = await fetchBridge({ mode: 'list', table, post_type: postType, taxonomy, limit: 100 });
    return { data: (res.data || []).map((i: any) => ({ id: i.ID || i.term_id || i.uid, name: i.post_title || i.name || i.title })), total: parseInt(res.total || '0') };
};

export const fetchNotices = async (t: string, p: number, q: string, f: string) => {
    const res = await fetchBridge({ mode: 'list', table: t, page: p, search: q, field: f, limit: 10 });
    return { data: (res.data || []).map((row: any) => ({ id: parseInt(row.ID || row.uid), title: row.post_title || row.wr_subject, content: row.post_content || row.wr_content, createdAt: row.post_date || row.wr_datetime, views: 0, status: row.post_status || 'publish' })), total: parseInt(res.total || '0') };
};

export const fetchDogsByUids = async (uids: string[], table: string = 'dogTab'): Promise<Record<string, ParentDogInfo>> => {
    const result: Record<string, ParentDogInfo> = {};
    const filteredUids = uids.map(u => (u || '').toString().trim()).filter(u => u !== '' && u !== '0');
    await Promise.all(filteredUids.map(async (uid) => {
        try {
            const res = await fetchBridge({ mode: 'list', table, search: uid, field: 'uid', limit: 1 });
            if (res.data && res.data.length > 0) result[uid] = res.data[0];
        } catch (e) { console.error(`UID 조회 실패: ${uid}`, e); }
    }));
    return result;
};

export const fetchDogsByRegNos = async (regNos: string[], table: string = 'dogTab'): Promise<Record<string, ParentDogInfo>> => {
    const result: Record<string, ParentDogInfo> = {};
    const filteredRegNos = regNos.map(r => (r || '').toString().trim()).filter(r => r !== '' && r !== '0');
    await Promise.all(filteredRegNos.map(async (regNo) => {
        try {
            const res = await fetchBridge({ mode: 'list', table, search: regNo, field: 'reg_no', limit: 1 });
            if (res.data && res.data.length > 0) result[regNo] = res.data[0];
        } catch (e) { console.error(`RegNo 조회 실패: ${regNo}`, e); }
    }));
    return result;
};

export const searchAllPersons = async (query: string, table: string = 'memTab'): Promise<{ data: PersonSearchResult[], debug: any }> => {
    const res = await fetchBridge({ mode: 'list', table, search: query, field: 'all', limit: 50 });
    return { data: (res.data || []).map((m: any) => ({ id: m.mid?.toString() || m.uid?.toString() || m.id, name: m.name || m.mb_name, source: table, context: table === 'memTab' ? '회원' : '관련인', data: { id: m.id || m.mb_id || m.mid?.toString(), name: m.name || m.mb_name, nameEng: m.name_eng || m.mb_name_eng || '', phone: m.hp || m.mb_hp || m.phone || '', address: (m.addr || m.mb_addr1 || '') + ' ' + (m.addr_1 || m.mb_addr2 || '') } })), debug: res };
};

export const fetchOwnerHistory = async (dogId: string): Promise<OwnerHistory[]> => {
    const res = await fetchBridge({ mode: 'get_owner_history', dog_id: dogId });
    return res.data || [];
};

export const updateMember = async (table: string, data: any) => {
    // 🎯 프론트엔드 속성명을 DB 컬럼명으로 정밀 역매핑 (HeidiSQL 구조 기준)
    const dbData: any = {};

    if (table === 'memTab') {
        const pKey = data.mid || data.id || data.mem_no;
        if (!pKey) {
            console.error("No primary key found in:", data);
            throw new Error("유효한 회원 번호(mid)가 없습니다. 목록을 새로고침 해주세요.");
        }
        dbData.mid = parseInt(pKey, 10);

        dbData.id = data.loginId || '';
        dbData.name = data.name || '';
        dbData.name_eng = data.name_eng || '';
        dbData.zumin = data.jumin || '';
        dbData.birth = data.birth || '';
        dbData.mem_degree = data.rank || '';
        dbData.zipcode = data.zipcode || '';
        dbData.addr = data.addr || '';
        dbData.addr_1 = data.addr1 || '';
        dbData.zipcode2 = data.zipcode_dm || '';
        dbData.addr2 = data.addr_dm || '';
        dbData.addr2_1 = data.addr1_dm || '';
        dbData.phone = data.tel || '';
        dbData.hp = data.hp || '';
        dbData.email = data.email || '';
        dbData.pro_class = data.proClass || '';
        dbData.memo = data.memo || '';
        dbData.end_date = data.expiryDate || '0000-00-00';
        dbData.saho = data.saho || '';
        dbData.saho_eng = data.saho_eng || '';
        dbData.saho_no = data.saho_no || '';
        dbData.saho_reg_date = (data.saho_date && data.saho_date.length >= 8) ? data.saho_date : '0000-00-00';
    } else {
        return fetchBridge({ mode: 'update_record', table, data: { ...data } });
    }

    // 🚀 [DEBUG] 전송 데이터 로그 출력
    console.log("%c[DB Update Request]", "color: #5c5fef; font-weight: bold; font-size: 14px;", { table, dbData, originalData: data });

    try {
        const res = await fetchBridge({ mode: 'update_record', table, data: dbData });
        if (!res.success) {
            console.error("%c[DB Update FAILED by Server]", "color: #f04444; font-weight: bold; font-size: 14px; background: #fee2e2; padding: 4px;");
            console.error("-> Error Message:", res.error);
            if (res.query) console.error("-> Failed SQL Query:", res.query);
            throw new Error(res.error || "Unknown server response");
        }
        console.log("%c[DB Update Success]", "color: #22c55e; font-weight: bold; font-size: 14px;", res);
        return res;
    } catch (e: any) {
        throw new Error(`DB 업데이트 실패: ${e.message}`);
    }
};

export const createMember = async (table: string, data: any) => {
    const dbData: any = {};
    if (table === 'memTab') {
        if (data.mem_no) dbData.mid = parseInt(data.mem_no, 10); // 🚀 [FIX] 수동 입력된 회원번호(mid) 처리
        dbData.id = data.loginId || '';
        dbData.name = data.name || '';
        dbData.name_eng = data.name_eng || '';
        dbData.zumin = data.jumin || '';
        dbData.birth = data.birth || '';
        dbData.mem_degree = data.rank || '';
        dbData.zipcode = data.zipcode || '';
        dbData.addr = data.addr || '';
        dbData.addr_1 = data.addr1 || '';
        dbData.zipcode2 = data.zipcode_dm || '';
        dbData.addr2 = data.addr_dm || '';
        dbData.addr2_1 = data.addr1_dm || '';
        dbData.phone = data.tel || '';
        dbData.hp = data.hp || '';
        dbData.email = data.email || '';
        dbData.pro_class = data.proClass || '';
        dbData.memo = data.memo || '';
        dbData.end_date = data.expiryDate || '0000-00-00';
        dbData.saho = data.saho || '';
        dbData.saho_eng = data.saho_eng || '';
        dbData.saho_no = data.saho_no || '';
        dbData.saho_reg_date = (data.saho_date && data.saho_date.length >= 8) ? data.saho_date : '0000-00-00';

        // 🗓️ 가입일 (YYYY-MM-DD -> Unix Timestamp)
        if (data.joinDate) {
            dbData.firstdate = Math.floor(new Date(data.joinDate).getTime() / 1000).toString();
        } else {
            // 신규 가입 시 없으면 오늘 날짜
            dbData.firstdate = Math.floor(Date.now() / 1000).toString();
        }
    } else {
        Object.assign(dbData, data);
    }

    try {
        const res = await fetchBridge({ mode: 'create_record', table, data: dbData });
        if (!res.success) throw new Error(res.error || "Unknown server response");
        return res;
    } catch (e: any) {
        throw new Error(`DB 추가 실패: ${e.message}`);
    }
};

export const deleteMember = async (table: string, id: string | number) => fetchBridge({ mode: 'delete_record', table, id });


export const createRecord = async (table: string, data: any) => fetchBridge({ mode: 'create_record', table, data });
export const fetchAllTableNames = async () => (await fetchBridge({ mode: 'get_all_tables' })).data || [];
export const fetchCategories = async () => (await fetchBridge({ mode: 'get_categories' })).data || [];
export const deletePost = async (table: string, id: number) => fetchBridge({ mode: 'delete_record', table, id });
export const createPost = async (table: string, data: any) => fetchBridge({ mode: 'create_record', table, data });
export const updatePost = async (table: string, data: any) => fetchBridge({ mode: 'update_record', table, data });
export const runSqlBatch = async (queries: string[]) => fetchBridge({ mode: 'execute_sql', queries });

/**
 * 🚀 DB 테이블 배치 내보내기 (SQL DUMP 스트리밍)
 * offset=0, include_header=true 부터 시작해서 is_done=true 까지 반복 호출
 */
export const fetchTableBatch = async (
    table: string,
    offset: number,
    batchSize: number,
    includeHeader: boolean = false
): Promise<{
    success: boolean;
    sql: string;
    fetched: number;
    offset: number;
    total: number;
    is_done: boolean;
    next_offset: number;
}> => {
    return fetchBridge({
        mode: 'export_table_batch',
        table,
        offset,
        batch_size: batchSize,
        include_header: includeHeader,
    });
};


export const fetchDogShows = async () => {
    const res = await fetchBridge({ mode: 'get_dogshows' });
    return Array.isArray(res.data) ? res.data : [];
};

export const fetchPrizes = async (t: string, p: number, q: string, f: string) => {
    const res = await fetchBridge({ mode: 'list', table: t, page: p, search: q, field: f === 'regNo' ? 'reg_no' : 'event_name', limit: 20 });
    return { data: (res.data || []).map((p: any) => ({ id: p.uid, regNo: p.reg_no, dogShowName: p.event_name, date: p.event_date, location: p.event_place, judge: p.referee, points: p.jum, detail: p.comment })), total: parseInt(res.total || '0') };
};

export const fetchPoints = async (t: string, p: number, q: string, f: string) => {
    let searchField = f;
    if (f === 'regNo') searchField = 'reg_no';
    else if (f === 'dogShow') searchField = 'dogShowName';
    else if (f === 'regDate') searchField = 'pt_regdate';
    else if (f === 'all') searchField = 'all';
    
    const res = await fetchBridge({ mode: 'list', table: t, page: p, search: (q || '').trim(), field: searchField, limit: 50 });
    return { data: (res.data || []).map((pt: any) => ({ id: pt.pt_pid, regNo: pt.reg_no, dogShow: pt.ds_pid, dogShowName: pt.dogShowName || pt.ds_pid, title: pt.pt_title, className: pt.pt_class, points: pt.pt_point, award: pt.pt_prize, regDate: pt.pt_regdate, other: pt.pt_etc })), total: parseInt(res.total || '0') };
};

export const createPoint = async (data: any) => fetchBridge({ mode: 'create_record', table: 'point', data: { reg_no: data.regNo, ds_pid: data.dogShow, pt_title: data.title, pt_class: data.className, pt_point: data.points, pt_prize: data.award, pt_regdate: data.regDate, pt_etc: data.other } });
export const updatePoint = async (table: string, data: any) => fetchBridge({ mode: 'update_record', table, data: { pt_pid: data.id, reg_no: data.regNo, ds_pid: data.dogShow, pt_title: data.title, pt_class: data.className, pt_point: data.points, pt_prize: data.award, pt_regdate: data.regDate, pt_etc: data.other } });
export const deletePoint = async (table: string, id: string) => fetchBridge({ mode: 'delete_record', table, id });

export const createPrize = async (data: Partial<Prize>) => fetchBridge({ mode: 'create_record', table: 'prize_dogTab', data: { reg_no: (data.regNo || '').trim(), event_name: data.dogShowName, event_date: data.date, event_place: data.location, referee: data.judge, jum: data.points, comment: data.detail, signdate: 0, serial_no: 0 } });
export const updatePrize = async (data: Prize) => fetchBridge({ mode: 'update_record', table: 'prize_dogTab', data: { uid: data.id, reg_no: (data.regNo || '').trim(), event_name: data.dogShowName, event_date: data.date, event_place: data.location, referee: data.judge, jum: data.points, comment: data.detail } });

export const fetchEvaluations = async (p: number, q: string, f: string) => {
    const res = await fetchBridge({ mode: 'list', table: 'breed_dogTab', page: p, search: q, field: f === 'regNo' ? 'reg_no' : 'dog_name', limit: 20 });
    return { data: (res.data || []).map((d: any) => ({ id: d.uid, name: d.dog_name, breed: d.dog_class, regNo: d.reg_no, judge: d.referee, startDate: d.start_date, endDate: d.end_date, memo: d.comment })), total: parseInt(res.total || '0') };
};

export const fetchPrizesByRegNo = async (regNo: string) => {
    const res = await fetchBridge({ mode: 'list', table: 'prize_dogTab', search: (regNo || '').trim(), field: 'reg_no', limit: 100 });
    return (res.data || []).map((p: any) => ({ id: p.uid, regNo: p.reg_no, dogShowName: p.event_name, date: p.event_date, location: p.event_place, judge: p.referee, points: p.jum, detail: p.comment }));
};
export const fetchPointsByRegNo = async (regNo: string) => {
    const res = await fetchBridge({ list: 'point', mode: 'list', table: 'point', search: (regNo || '').trim(), field: 'reg_no', limit: 100 });
    return (res.data || []).map((p: any) => ({ id: p.pt_pid, regNo: p.reg_no, dogShow: p.ds_pid, dogShowName: p.dogShowName || p.ds_pid, title: p.pt_title, className: p.pt_class, points: p.pt_point, award: p.pt_prize, regDate: p.pt_regdate, other: p.pt_etc }));
};

/**
 * 🎯 pro_classTab (직능 목록) 관리
 */
export const fetchProClasses = async () => {
    const res = await fetchBridge({ mode: 'list', table: 'pro_classTab', limit: 300 });
    const list = (res.data || []).map((row: any) => ({
        uid: row.uid.toString(),
        keyy: row.keyy,
        name: row.name
    }));
    // ㄱ, ㄴ, ㄷ... 순으로 정렬
    return list.sort((a: any, b: any) => a.name.localeCompare(b.name, 'ko'));
};

export const createProClass = async (data: { keyy: string, name: string }) => {
    return fetchBridge({ mode: 'create_record', table: 'pro_classTab', data });
};

export const deleteProClass = async (id: string) => {
    return fetchBridge({ mode: 'delete_record', table: 'pro_classTab', id: id });
};

export const updatePedigree = async (table: string, data: any) => fetchBridge({ mode: 'update_record', table, data });
export const addOwnerChange = async (data: any, table: string) => fetchBridge({ mode: 'create_record', table: 'poss_changeTab', data });
export const deleteOwnerHistory = async (id: string) => fetchBridge({ id, mode: 'delete_record', table: 'poss_changeTab' });

export const bulkUpdateProClass = async (membersToUpdate: any[], selectedSkill: string, isSkillDisabled: boolean) => {
    let successCount = 0;
    let failCount = 0;

    for (const m of membersToUpdate) {
        try {
            // ID로 회원 검색 (mid 확보)
            const searchRes = await fetchBridge({ mode: 'list', table: 'memTab', search: m.loginId, field: 'id', limit: 100 });
            let match = searchRes.data?.find((r: any) => r.id === m.loginId);

            // 로그인 아이디로 못 찾은 경우 이름+생년월일로 보조 검색 시도
            if (!match && m.name) {
                const nameRes = await fetchBridge({ mode: 'list', table: 'memTab', search: m.name, field: 'name', limit: 100 });
                match = nameRes.data?.find((r: any) => r.id === m.loginId || (r.name === m.name && r.birth === m.birth));
            }

            if (match) {
                // [기존 회원: 업데이트 로직]
                const currentProClass = match.pro_class || '';
                let newProClass = currentProClass;

                if (!isSkillDisabled && selectedSkill) {
                    const skills = currentProClass.split('-').filter((s: string) => s.trim() !== '');
                    if (!skills.includes(selectedSkill)) {
                        newProClass = currentProClass ? `${currentProClass}-${selectedSkill}` : selectedSkill;
                    }
                }

                const currentMemo = match.memo || '';
                let newMemo = currentMemo;
                if (m.memo) {
                    const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\.\s/g, '-').replace(/\.$/, '');
                    const memoLine = `[${today}] ${m.memo}`;
                    newMemo = currentMemo ? `${currentMemo}\n${memoLine}` : memoLine;
                }

                const updateData: any = {
                    mid: match.mid,
                    pro_class: newProClass,
                    memo: newMemo
                };

                if (m.hp) updateData.hp = m.hp;
                if (m.addr) updateData.addr = m.addr;
                if (m.email) updateData.email = m.email;
                if (m.rank) updateData.mem_degree = m.rank;
                if (m.joinDate) {
                    updateData.firstdate = Math.floor(new Date(m.joinDate).getTime() / 1000).toString();
                }

                const updateRes = await fetchBridge({ mode: 'update_record', table: 'memTab', data: updateData });
                if (updateRes.success) successCount++;
                else failCount++;

            } else {
                // [신규 회원: 자동 등록 로직]
                console.log(`%c[Smart Insert] New member detected: ${m.loginId}`, "color: #3b82f6; font-weight: bold;");

                const createData: any = {
                    loginId: m.loginId,
                    name: m.name,
                    birth: m.birth,
                    hp: m.hp || '',
                    addr: m.addr || '',
                    email: m.email || '',
                    rank: m.rank || 'B0',
                    joinDate: m.joinDate,
                    proClass: (!isSkillDisabled && selectedSkill) ? selectedSkill : '',
                    memo: m.memo ? `[${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\.\s/g, '-').replace(/\.$/, '')}] ${m.memo}` : ''
                };

                const createRes = await createMember('memTab', createData);
                if (createRes.success) successCount++;
                else failCount++;
            }
        } catch (e) {
            console.error("Bulk update/create execution error:", e);
            failCount++;
        }
    }
    return { successCount, failCount };
};
