
import { Pedigree } from '../types';
import { fetchBridge } from './memberService';

/**
 * ==============================================================================
 * 🛡️ [DATA MAPPING CONSTITUTION - SECTION: PEDIGREES (dogTab)]
 * ==============================================================================
 */
export const fetchPedigrees = async (t: string, p: number, q: string, f: string) => {
    const res = await fetchBridge({
        mode: 'list',
        table: t,
        page: p,
        search: q,
        field: f,
        limit: 50
    });

    const mapped = (res.data || []).map((row: any) => ({
        id: row.uid?.toString(),
        regType: row.reg_type,
        regNo: (row.reg_no || '').trim(),
        name: row.name,
        fullName: row.fullname,
        group: row.groupp,
        breed: row.dog_class,
        gender: row.sex,
        birthDate: row.birth,
        color: row.hair,
        coatType: '',
        kennel: row.saho,
        kennelNameEng: row.saho_eng,
        ownerId: row.poss_id,
        owner: row.poss_name,
        ownerPhone: row.poss_phone,
        ownerAddr: row.poss_addr,
        breeder: row.breed_name,
        breederPhone: row.breed_phone,
        breederAddr: row.breed_addr,
        sireRegNo: (row.fa_regno || '').toString().trim(),
        damRegNo: (row.mo_regno || '').toString().trim(),
        microchip: row.micro,
        specBone: row.spec_bone,
        specDna: row.spec_dna,
        specTrain: row.spec_train,
        specWin: row.spec_win,
        specWin2: row.spec_win2,
        domesticNo: row.foreign100,
        foreignNo: row.foreign_no,
        foreignNo2: row.foreign_no2,
        memo: row.memo,
        okDate: row.spec_male,
        okStat: (row.spec_male && row.spec_male.trim() !== '') ? 'Y' : 'N',
        dongtaeNo: row.dongtae_no,
        joinDate: row.reg_date,
        photo: row.pix1,
        type: 'dog'
    }));
    return { data: mapped, total: parseInt(res.total || '0') };
};

export const updatePedigree = async (table: string, data: any) => {
    return fetchBridge({ mode: 'update_record', table, data });
};
