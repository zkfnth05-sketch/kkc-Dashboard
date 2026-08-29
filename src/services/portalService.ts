
const PORTAL_BRIDGE_URL = 'https://kkc3349.mycafe24.com/portal_bridg.php';

export const portalFetch = async (mode: string, data: any = {}) => {
  try {
    const response = await fetch(PORTAL_BRIDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': 'kkf-portal-secure-2025!@#'
      },
      body: JSON.stringify({
        mode,
        ...data
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Portal API Error (${mode}):`, error);
    return { success: false, error: '서버 통신 중 오류가 발생했습니다.' };
  }
};

export const portalLogin = (id: string, pw: string) => portalFetch('portal_login', { id, pw });
export const portalRegister = (data: any) => portalFetch('portal_register', { data });
export const portalGetMyData = (mid: number) => portalFetch('portal_get_my_data', { mid });
export const portalUpdateMyData = (mid: number, data: any) => portalFetch('portal_update_my_data', { mid, data });
export const portalApplyMembership = (mid: number, data: any) => portalFetch('portal_apply_membership', { mid, ...data });

// 🏆 대회 신청하기
export const applyToCompetition = async (applicationData: any) => {
  return await portalFetch('portal_apply_competition', applicationData);
};

export const portalCheckId = async (id: string) => {
  return await portalFetch('portal_check_id', { id });
};

export const portalSendSmsVerification = (hp: string) => portalFetch('portal_send_sms_verification', { hp });
export const portalVerifySmsCode = (hp: string, code: string) => portalFetch('portal_verify_sms_code', { hp, code });
export const portalFindPwSendSms = (data: { name: string, hp: string, birth: string }) => portalFetch('portal_find_pw_send_sms', data);
export const portalFindPwVerifySms = (data: { name: string, hp: string, birth: string, code: string }) => portalFetch('portal_find_pw_verify_sms', data);
export const portalFindPwReset = (data: { name: string, hp: string, birth: string, new_pw: string }) => portalFetch('portal_find_pw_reset', data);

export const portalGetNiceAuthUrl = () => portalFetch('portal_get_nice_auth_url');
export const portalNiceGetVerifiedData = (web_transaction_id: string, hp?: string) => portalFetch('portal_nice_get_verified_data', { web_transaction_id, hp });
export const portalNiceFindPwVerify = (web_transaction_id: string) => portalFetch('portal_nice_find_pw_verify', { web_transaction_id });



// 🏛️ 관리자 전용: 신청 내역 목록 및 삭제
export const portalFetchMembershipApplications = (page: number, search: string, status: string) => 
  portalFetch('portal_membership_applications_list', { page, search, status });

export const portalDeleteMembershipApplications = (uids: number[]) => 
  portalFetch('portal_delete_membership_applications', { uids });

export const portalApproveMembershipApplication = (uid: number, action: 'approve' | 'reject', memo: string = '') => 
  portalFetch('portal_membership_application_action', { uid, action, memo });

// ==============================================================================
// 🛡️ [NICE API ADMIN PORTAL SERVICE]
// ==============================================================================
const NICE_BRIDGE_URL = 'https://kkc3349.mycafe24.com/portal_bridg.php';

export const portalFetchNice = async (mode: string, data: any = {}) => {
  try {
    const response = await fetch(`${NICE_BRIDGE_URL}?t=${Date.now()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Token': 'kkc-super-secret-key-change-this-now-12345!'
      },
      body: JSON.stringify({
        mode,
        ...data
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Nice Portal API Error (${mode}):`, error);
    return { success: false, error: '서버 통신 중 오류가 발생했습니다.' };
  }
};

// NICE Member Admin
export const niceAdminFetchMembers = (page: number, search: string, field: string = 'all') =>
  portalFetchNice('admin_nice_member_list', { page, search, field });

export const niceAdminDeleteMember = (mid: number) =>
  portalFetchNice('admin_nice_member_delete', { mid });

// NICE Pedigree Admin
export const niceAdminFetchPedigrees = (page: number, search: string, field: string = 'all', status: string = 'all') =>
  portalFetchNice('admin_nice_pedigree_list', { page, search, field, status });

export const niceAdminPedigreeAction = (
  uid: number,
  action: 'approve' | 'reject',
  memo: string,
  extraData?: {
    hair?: string;
    breed_name?: string;
    dog_classTab_name?: string;
    reg_no?: string;
    dog_name?: string;
    name?: string;
    sex?: string;
    micro?: string;
    birth?: string;
    saho?: string;
    saho_eng?: string;
    breeder_name?: string;
    breeder_addr?: string;
    poss_name?: string;
    poss_addr?: string;
    birth_m?: number;
    birth_f?: number;
    reg_count_m?: number;
    reg_count_f?: number;
    reg_date?: string;
    fa_name?: string;
    fa_regno?: string;
    fa_saho?: string;
    mo_name?: string;
    mo_regno?: string;
    mo_saho?: string;
  }
) =>
  portalFetchNice('admin_nice_pedigree_action', {
    uid,
    action,
    memo,
    ...(extraData || {})
  });

export const niceAdminDeletePedigree = (uid: number) =>
  portalFetchNice('admin_nice_pedigree_delete', { uid });

export const niceAdminFetchBreedColors = (breedName: string, breedCd?: string) =>
  portalFetchNice('admin_nice_get_breed_colors', { breed_name: breedName, breed_cd: breedCd });

export const niceAdminGenerateRegNo = (breed: string, keyy?: string) =>
  portalFetchNice('admin_nice_generate_reg_no', { breed, keyy });



export const niceAdminLookupPedigreeTree = (
  fa_regno?: string,
  mo_regno?: string,
  reg_no?: string
) =>
  portalFetchNice('admin_nice_lookup_pedigree_tree', {
    fa_regno,
    mo_regno,
    reg_no
  });
