
import { Member } from '../types';
import { fetchBridge } from './memberService';

/**
 * 🛡️ 회원 대량 추출 전용 서비스 (격리됨)
 */
export const fetchExportMembers = async (
    page: number,
    limit: number,
    query: string = '',
    field: string = 'all',
    rank: string = 'all',
    region: string = '',
    ds: string = '',
    de: string = '',
    proClass: string = ''
) => {
    // 🎯 bridg.php 로그 확인 및 서버 로직의 일관성을 위해 field 추가
    const res = await fetchBridge({
        mode: 'export_members',
        table: 'memTab',
        page,
        limit,
        search: query,
        field: field,
        rank,
        region,
        date_start: ds,
        date_end: de,
        pro_class: proClass
    });

    // 🐾 UI 규격에 맞게 매핑
    const mapped = (res.data || []).map((m: any) => ({
        id: m.mid?.toString(),
        mid: m.mid?.toString(),
        loginId: m.id,
        mem_no: m.mid?.toString(),
        name: m.name,
        name_eng: m.name_eng || '',
        tel: m.phone || '',
        hp: m.hp || '',
        zipcode: m.zipcode || '',
        addr: m.addr || '',
        addr1: m.addr_1 || '',
        addr_dm: m.addr2 || '',
        addr1_dm: m.addr2_1 || '',
        email: m.email || '',
        birth: m.birth || '',
        rank: m.mem_degree || '일반',
        joinDate: m.firstdate ? new Date(parseInt(m.firstdate) * 1000).toISOString().split('T')[0] : '',
        memo: m.memo || ''
    }));

    return { data: mapped, total: parseInt(res.total || '0') };
};
