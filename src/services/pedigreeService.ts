
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
        coatType: row.hair_long,    // 👈 hair_long 매핑
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
        hairIndex: row.dog_etc,
        specBone: row.spec_bone,
        specDna: row.spec_dna,
        specTrain: row.spec_train,
        specRelate: row.spec_relate, // 👈 spec_relate 매핑
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
        editDate: row.sign_date,    // 👈 sign_date 매핑
        photo: row.pix1,
        type: 'dog'
    }));
    return { data: mapped, total: parseInt(res.total || '0') };
};

export const fetchHairs = async () => {
    const res = await fetchBridge({
        mode: 'list',
        table: 'hairTab',
        limit: 500 // 충분한 양을 가져옴
    });
    return (res.data || []).map((row: any) => row.hair).filter((h: string) => h && h.trim() !== '');
};

export const updatePedigree = async (table: string, data: any) => {
    // 🛡️ [DATA MAPPING CONSTITUTION - SECTION: PEDIGREE UPDATE]
    // HeidiSQL 스키마(dogTab) 컬럼명에 맞춰 1:1 역매핑
    const dbData: any = {
        uid: data.id,
        reg_type: data.regType,
        reg_no: data.regNo,
        name: data.name,
        fullname: data.fullName,
        groupp: data.group,
        dog_class: data.breed,
        saho: data.kennel,
        saho_eng: data.kennelNameEng,
        poss_id: data.ownerId,
        poss_name: data.owner,
        poss_phone: data.ownerPhone,
        poss_addr: data.ownerAddr,
        breed_name: data.breeder,
        breed_phone: data.breederPhone,
        breed_addr: data.breederAddr,
        sex: data.gender,
        hair: data.color,
        hair_long: data.coatType,
        birth: data.birthDate,
        mo_regno: data.damRegNo,
        fa_regno: data.sireRegNo,
        foreign_no: data.foreignNo,
        foreign_no2: data.foreignNo2,
        dog_etc: data.hairIndex,
        spec_bone: data.specBone,
        spec_train: data.specTrain,
        spec_dna: data.specDna,
        spec_win: data.specWin,
        spec_win2: data.specWin2,
        spec_male: data.okDate,
        spec_relate: data.specRelate,
        memo: data.memo,
        reg_date: data.joinDate,
        sign_date: data.editDate,   // 👈 sign_date 매핑
        dongtae_no: data.dongtaeNo,
        micro: data.microchip,
        foreign100: data.domesticNo,
        pix1: data.photo
    };

    return fetchBridge({ mode: 'update_record', table, data: dbData });
};

export const createPedigree = async (table: string, data: any) => {
    // 🛡️ [DATA MAPPING CONSTITUTION - SECTION: PEDIGREE CREATE]
    const dbData: any = {
        reg_type: data.regType,
        reg_no: data.regNo,
        name: data.name,
        fullname: data.fullName,
        groupp: data.group,
        dog_class: data.breed,
        saho: data.kennel,
        saho_eng: data.kennelNameEng,
        poss_id: data.ownerId || '',
        poss_name: data.owner || '',
        poss_phone: data.ownerPhone || '',
        poss_addr: data.ownerAddr || '',
        breed_name: data.breeder || '',
        breed_phone: data.breederPhone || '',
        breed_addr: data.breederAddr || '',
        sex: data.gender,
        hair: data.color || '',
        hair_long: data.coatType || '',
        birth: data.birthDate,
        mo_regno: data.damRegNo || '0',
        fa_regno: data.sireRegNo || '0',
        reg_date: data.registrationDate || new Date().toISOString().split('T')[0],
        memo: data.memo || '',
        micro: data.microchip || '',
        foreign100: data.otherOrg || '',
        foreign_no: data.foreignNo || '',
        foreign_no2: data.foreignNo2 || '',
        dog_etc: data.hairIndex || '',
        spec_bone: data.hipBone || '',
        spec_dna: data.dnaTest || '',
        spec_train: data.training || '',
        spec_win: data.highestAward || '',
        spec_relate: data.inbreeding || '',
        spec_male: data.breedApproval || '',
        spec_win2: data.highestAward2 || '',
        poss_name_eng: data.ownerEng || '',
        dongtae_no: data.dongtaeNo || '', // 👈 동태 번호 매핑 추가
        input_man: 'P',
        pt_key: 'R'
    };

    return fetchBridge({ mode: 'create_record', table, data: dbData });
};

/**
 * 특정 접두어로 시작하는 등록번호 중 가장 마지막 번호를 조회합니다.
 */
export const fetchLastRegNo = async (prefix: string) => {
    const res = await fetchBridge({
        mode: 'list',
        table: 'dogTab',
        page: 1,
        search: prefix,
        field: 'reg_no',
        limit: 1 // 최신 1건만 가져옴
    });

    if (res.data && res.data.length > 0) {
        return res.data[0].regNo; // 👈 매핑된 필드명 regNo 사용
    }
    return null;
};

/**
 * 특정 등록번호가 이미 존재하는지 조회합니다.
 */
export const checkRegNoExists = async (regNo: string) => {
    if (!regNo || regNo.trim() === '') return null;
    
    const res = await fetchBridge({
        mode: 'list',
        table: 'dogTab',
        page: 1,
        search: regNo.trim(),
        field: 'reg_no',
        limit: 1
    });

    if (res.data && res.data.length > 0) {
        // 정확히 일치하는지 확인
        const found = res.data.find((d: any) => d.reg_no === regNo.trim());
        return found ? found : null;
    }
    return null;
};

/**
 * DB의 dog_classTab에서 전체 견종 목록을 조회합니다.
 */
export const fetchDogClasses = async () => {
    const res = await fetchBridge({
        mode: 'list',
        table: 'dog_classTab',
        limit: 500 // 모든 견종을 가져옴
    });

    if (res.data) {
        return res.data.map((row: any) => ({
            uid: row.uid,
            keyy: (row.keyy || '').trim(),
            breed: row.kor_name,       // kor_name을 breed로 사용
            nameEng: row.name,         // name을 영문명으로 사용
            group: row.groupp          // groupp을 group으로 사용
        }));
    }
    return [];
};

/**
 * 특정 UID의 혈통서 데이터를 삭제합니다.
 */
export const deletePedigree = async (table: string, id: string) => {
    return fetchBridge({
        mode: 'delete_record',
        table: table,
        id: id
    });
};
