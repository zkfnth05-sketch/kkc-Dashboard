
export interface Notice {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  views: number;
  status?: string;
}

export interface PostCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface Dog { id: string; regNo: string; name: string; birthDate: string; }
export interface Skill { id: string; name: string; dateAcquired: string; }
export interface Member {
  id: string;
  mid: string;
  loginId: string;
  mem_no: string;
  name: string;
  name_eng: string;
  tel: string;
  hp: string;
  zipcode: string;
  addr: string;
  addr1: string;
  zipcode_dm: string;
  addr_dm: string;
  addr1_dm: string;
  email: string;
  birth: string;
  jumin?: string;
  saho: string;
  saho_eng: string;
  saho_no?: string;
  saho_date?: string;
  rank: string;
  expiryDate: string;
  memo: string;
  joinDate?: string;
  status?: string;
  proClass?: string; // 🎯 memTab의 pro_class 필드 매핑
  skills: Skill[];
  dogs: Dog[];
}

export interface Pedigree { id: string; regNo: string; regType: string; name: string; fullName: string; group: string; breed: string; gender: string; birthDate: string; color: string; coatType: string; kennel: string; kennelNameEng: string; ownerId: string; owner: string; ownerPhone: string; ownerAddr: string; breederId: string; breeder: string; breederPhone: string; breederAddr: string; sireUid: string; sireRegNo: string; sireName: string; damUid: string; damRegNo: string; damName: string; microchip: string; specBone: string; specDna: string; specTrain: string; specWin: string; specWin2?: string; specRelate: string; domesticNo: string; foreignNo: string; foreignNo2: string; memo: string; okDate: string; okStat: string; dongtaeNo: string; type: string; joinDate?: string; }

export interface Point {
  id: string;
  regNo: string;
  dogShow: string;
  dogShowName?: string;
  title: string;
  className: string;
  other: string;
  points: number;
  award: string;
  regDate: string;
}

export interface Prize {
  id: string;
  regNo: string;
  dogShowName: string;
  date: string;
  location: string;
  judge: string;
  points: string | number;
  detail: string;
}

export interface Evaluation {
  id: string;
  name: string;
  breed: string;
  regNo: string;
  judge: string;
  startDate: string;
  endDate: string;
  memo: string;
}

/**
 * 🐾 HeidiSQL dongtaeTab 실제 39개 컬럼 정밀 매핑 (데이터 헌법)
 */
export interface DongtaeInfo {
  uid?: number | string;        // 1. uid (INT 10)
  dongtae_no: string;           // 2. dongtae_no (VARCHAR 50)
  birth_M?: string;             // 3. birth_M (VARCHAR 2)
  birth_F?: string;             // 4. birth_F (VARCHAR 2)
  dead_M?: string;              // 5. dead_M (VARCHAR 2) - 사산
  dead_F?: string;              // 6. dead_F (VARCHAR 2)
  cancel_M?: string;            // 7. cancel_M (VARCHAR 2) - 취소/제거
  cancel_F?: string;            // 8. cancel_F (VARCHAR 2)
  dead2_M?: string;             // 9. dead2_M (VARCHAR 2) - 등록전사망
  dead2_F?: string;             // 10. dead2_F (VARCHAR 2)
  missing_M?: string;           // 11. missing_M (VARCHAR 2) - 불명
  missing_F?: string;           // 12. missing_F (VARCHAR 2)
  bringup_M?: string;           // 13. bringup_M (VARCHAR 2) - 수유/육성
  bringup_F?: string;           // 14. bringup_F (VARCHAR 2)
  reg_count_M?: string;         // 15. reg_count_M (VARCHAR 2) - 등록견
  reg_count_F?: string;         // 16. reg_count_F (VARCHAR 2)
  dongtae_name?: string;        // 17. dongtae_name
  dongtae_name2?: string;       // 18. dongtae_name2
  dongtae_name3?: string;       // 19
  dongtae_name4?: string;       // 20
  dongtae_name5?: string;       // 21
  dongtae_name6?: string;       // 22
  dongtae_name7?: string;       // 23
  dongtae_name8?: string;       // 24
  dongtae_name9?: string;       // 25
  dongtae_name10?: string;      // 26
  dongtae_name11?: string;      // 27
  dongtae_name12?: string;      // 28
  dongtae_name13?: string;      // 29
  dongtae_name14?: string;      // 30
  regno_start?: string;         // 31. regno_start
  regno_end?: string;           // 32. regno_end
  spec_relate?: string;         // 33. spec_relate
  fa_reg_no?: string;           // 34. fa_reg_no
  mo_reg_no?: string;           // 35. mo_reg_no
  breeder?: string;             // 36. breeder
  reg_date?: string;            // 37. reg_date (DATE)
  sign_date?: string;           // 38. sign_date (DATE)
  memo?: string;                // 39. memo (VARCHAR 255)
}

export interface ParentDogInfo { uid: string; name: string; fullname: string; reg_no: string; birth: string; dog_class: string; hair: string; saho_eng: string; foreign100: string; foreign_no: string; foreign_no2: string; }
export interface PersonSearchResult { id: string; name: string; source: string; context: string; data: { id: string; name: string; nameEng: string; phone: string; address: string; }; }
export interface OwnerHistory { uid: string; dog_uid: string; ok_date: string; poss_id: string; poss_name: string; poss_name_eng: string; poss_addr: string; }

export const MEMBER_RANK_MAP: Record<string, string> = {
  'B0': '준회원',
  'C0': '특별회원',
  'A1': '정회원1년',
  'A2': '정회원2년',
  'A3': '정회원 3년'
};

export const formatMemberRank = (rankCode: string | undefined): string => {
  if (!rankCode) return '';
  const normalized = rankCode.trim().toUpperCase().replace(/^BO$/, 'B0').replace(/^CO$/, 'C0');
  return MEMBER_RANK_MAP[normalized] || rankCode;
};
