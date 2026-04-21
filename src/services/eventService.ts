
import { fetchBridge } from './memberService';

/**
 * 🛡️ [DATA MAPPING - LEGACY_EVENTS]
 * dogshow, stylist 등 레거시 테이블을 직접 관리합니다.
 * wp_posts와의 연결을 완전히 차단합니다.
 */
export const fetchDogShows = async (page: number, query: string = '', limit: number = 200, category?: string) => {
    return fetchBridge({
        mode: 'list',
        table: 'legacy_events',
        page,
        limit,
        search: query,
        category
    });
};

export const createDogShow = async (data: any) => {
    return fetchBridge({
        mode: 'save_event',
        data
    });
};

export const updateDogShow = async (data: any) => {
    return fetchBridge({
        mode: 'save_event',
        data
    });
};

export const deleteDogShow = async (id: string | number) => {
    return fetchBridge({
        mode: 'delete_event',
        id
    });
};

// 🎯 [EXTENDED SERVICE: SUB-ENTITIES] - 유형, 장소, 주최자 관리용
// 장소/주최 관리는 기존 wp_posts(kkf_venue, kkf_organizer)를 활용하되 조회만 함
export const fetchEventSubItems = async (type: 'type' | 'venue' | 'organizer') => {
    return fetchBridge({ mode: 'get_events', type });
};

export const createEventSubItem = async (type: 'type' | 'venue' | 'organizer', name: string) => {
    const isTerm = type === 'type';
    return fetchBridge({
        mode: 'create_record',
        table: isTerm ? 'wp_terms' : 'wp_posts',
        data: isTerm ? { name, taxonomy: 'kkf_event_category' } : {
            post_title: name,
            post_type: type === 'venue' ? 'kkf_venue' : 'kkf_organizer',
            post_status: 'publish',
            post_author: 1
        }
    });
};

export const updateEventSubItem = async (id: string | number, name: string, type: 'type' | 'venue' | 'organizer' = 'venue') => {
    const isTerm = type === 'type';
    return fetchBridge({
        mode: 'update_record',
        table: isTerm ? 'wp_terms' : 'wp_posts',
        data: isTerm ? { term_id: id, name, taxonomy: 'kkf_event_category' } : { ID: id, post_title: name }
    });
};

export const deleteEventSubItem = async (id: string | number, type: 'type' | 'venue' | 'organizer' = 'venue') => {
    const isTerm = type === 'type';
    return fetchBridge({
        mode: 'delete_record',
        table: isTerm ? 'wp_terms' : 'wp_posts',
        id
    });
};

// 🎯 [APPLICANT MANAGEMENT]
export const fetchApplicants = async (ds_pid: string | number, table: string = 'dogshow_applicant') => {
    return fetchBridge({
        mode: 'list',
        table: table,
        ds_pid: ds_pid, // 🚀 [EXACT MATCH] Pass explicitly to trigger exact filtering
        search: String(ds_pid),
        field: 'ds_pid',
        limit: 1000
    });
};

export const createApplicant = async (data: any, table: string = 'dogshow_applicant') => {
    return fetchBridge({
        mode: 'create_record',
        table: table,
        data
    });
};

export const updateApplicant = async (data: any, table: string = 'dogshow_applicant') => {
    return fetchBridge({
        mode: 'update_record',
        table: table,
        data
    });
};

export const deleteApplicant = async (id: string | number, table: string = 'dogshow_applicant') => {
    return fetchBridge({
        mode: 'delete_record',
        table: table,
        id
    });
};

// 💰 [FEE OPTIONS MANAGEMENT]
export const fetchEventOptions = async (eventType: string, eventId: number) => {
    return fetchBridge({
        mode: 'list',
        table: 'competition_fee_options',
        search: eventId.toString(),
        field: 'event_id',
        limit: 100,
        // 🚀 [PRECISION FILTER] 유형까지 일치시켜야 섞이지 않습니다.
        event_type: eventType 
    });
};

export const saveEventOptions = async (eventType: string, eventId: number, options: any[]) => {
    // 🚀 [WAF SAFE BATCH] DELETE & INSERT combined
    const queries = [
        `DELETE FROM competition_fee_options WHERE event_type = '${eventType}' AND event_id = ${eventId}`
    ];

    options.forEach(opt => {
        if (!opt.label || opt.label.trim() === '') return;
        const label = opt.label.replace(/'/g, "''");
        const price = opt.price || 0;
        const required = opt.is_required ? 1 : 0;
        queries.push(
            `INSERT INTO competition_fee_options (event_type, event_id, option_name, option_price, is_required) VALUES ('${eventType}', ${eventId}, '${label}', ${price}, ${required})`
        );
    });

    return fetchBridge({
        mode: 'execute_sql',
        queries
    });
};
