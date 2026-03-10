
import { DongtaeInfo } from '../types';
import { fetchBridge } from './memberService';

// 🐾 동태 정보 (Litter Info) 조회
export const fetchDongtaeInfo = async (dongtaeNo: string): Promise<DongtaeInfo | null> => {
    if (!dongtaeNo || dongtaeNo === '-' || dongtaeNo === '0') return null;
    const res = await fetchBridge({ mode: 'get_dongtae_info', dongtae_no: dongtaeNo });
    return res.data || null;
};

// 🐾 동태 정보 저장/수정
export const updateDongtaeInfo = async (data: DongtaeInfo) => {
    return fetchBridge({ mode: 'update_record', table: 'dongtaeTab', data });
};

// 🐾 다음 동태번호 생성
export const generateDongtaeNo = async (): Promise<string> => {
    const res = await fetchBridge({ mode: 'get_next_dongtae_no' });
    return res.data;
};
