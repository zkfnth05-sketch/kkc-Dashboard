
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

export const portalFindPw = (data: { name: string, hp: string, birth: string, new_pw?: string }) => 
  portalFetch('portal_find_pw', data);

// 🏛️ 관리자 전용: 신청 내역 목록 및 삭제
export const portalFetchMembershipApplications = (page: number, search: string, status: string) => 
  portalFetch('portal_membership_applications_list', { page, search, status });

export const portalDeleteMembershipApplications = (uids: number[]) => 
  portalFetch('portal_delete_membership_applications', { uids });

export const portalApproveMembershipApplication = (uid: number, action: 'approve' | 'reject', memo: string = '') => 
  portalFetch('portal_membership_application_action', { uid, action, memo });
