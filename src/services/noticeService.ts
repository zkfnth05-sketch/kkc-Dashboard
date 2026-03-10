
import { Notice } from '../types';
import { fetchBridge } from './memberService';

/**
 * 🛡️ 협회소식/공지 전용 서비스 (격리됨)
 */
export const fetchAssociationNotices = async (page: number, limit: number, query: string = '') => {
    const res = await fetchBridge({
        mode: 'get_notices',
        page,
        limit,
        search: query
    });

    const mapped = (res.data || []).map((row: any) => ({
        id: parseInt(row.ID),
        title: row.post_title,
        content: row.post_content,
        createdAt: row.post_date,
        views: 0,
        status: row.post_status
    }));

    return { data: mapped, total: parseInt(res.total || '0') };
};

export const deleteAssociationNotice = async (id: number) => {
    return fetchBridge({ mode: 'delete_record', table: 'wp_posts', id });
};

export const createAssociationNotice = async (data: any) => {
    return fetchBridge({ mode: 'save_notice', data });
};

export const updateAssociationNotice = async (data: any) => {
    return fetchBridge({ mode: 'save_notice', data });
};
