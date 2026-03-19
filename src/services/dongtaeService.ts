
import { DongtaeInfo } from '../types';
import { fetchBridge } from './memberService';

// 🐾 동태 정보 (Litter Info) 조회
export const fetchDongtaeInfo = async (dongtaeNo: string): Promise<DongtaeInfo | null> => {
    if (!dongtaeNo || dongtaeNo === '-' || dongtaeNo === '0') return null;
    const res = await fetchBridge({ mode: 'get_dongtae_info', dongtae_no: dongtaeNo });
    return res.data || null;
};

// 🐾 동태 정보 저장/수정 (Upsert)
export const saveDongtaeInfo = async (data: DongtaeInfo) => {
    // uid가 있으면 수정(update), 없으면 신규 생성(create) 모드로 동작합니다.
    const mode = (data.uid && data.uid !== '0') ? 'update_record' : 'create_record';
    return fetchBridge({ mode, table: 'dongtaeTab', data });
};

// 🐾 다음 동태번호 생성
export const generateDongtaeNo = async (): Promise<string> => {
    const res = await fetchBridge({ mode: 'get_next_dongtae_no' });
    return res.data;
};
// 🐾 동태 정보 삭제
export const deleteDongtaeInfo = async (uid: string) => {
    return fetchBridge({ mode: 'delete_record', table: 'dongtaeTab', id: uid });
};
