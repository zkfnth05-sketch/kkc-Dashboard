import React, { useState, useEffect } from 'react';
import { Search, Award, ShieldCheck, FileText, Calendar, Trash2, Edit, RefreshCw, Printer, Download, Eye, Check, X, Image as ImageIcon, Info } from 'lucide-react';
import { niceAdminFetchPedigrees, niceAdminPedigreeAction, niceAdminDeletePedigree } from '../services/portalService';

interface NicePedigree {
  uid: number;
  reg_no: string;
  dog_name: string;
  breed_name: string;
  gender: string;
  micro: string;
  owner_name: string;
  owner_id: string;
  sire_name: string;
  dam_name: string;
  registered_at: string;
  status: 'P' | 'Y' | 'N' | 'R';
  admin_memo: string;
  image1_path?: string;
  image2_path?: string;
  image3_path?: string;
  image4_path?: string;
  poss_ci: string;
  
  // 신규 추가 필드 (HeidiSQL 엑셀 정보 기반)
  saho_eng?: string;
  saho?: string;
  hair?: string;
  breeder_name?: string;
  breeder_addr?: string;
  poss_name?: string;
  poss_addr?: string;
  birth?: string;
  birth_m?: number;
  birth_f?: number;
  reg_count_m?: number;
  reg_count_f?: number;
  reg_date?: string;
  sire_reg_no?: string;
  dam_reg_no?: string;
  fa_name?: string;
  fa_regno?: string;
  mo_name?: string;
  mo_regno?: string;
  anc_name?: string;
  anc_saho?: string;
}

import { PedigreeManagementPage } from './PedigreeManagementPage';

interface NicePedigreeManagementProps {
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  onGoToPoints: (regNo: string) => void;
  onGoToPrizes: () => void;
  onGoToMember: (loginId: string) => void;
  initialSearch?: { query: string; field: string } | null;
  onSearchHandled?: () => void;
}

export const NicePedigreeManagement: React.FC<NicePedigreeManagementProps> = ({
  showAlert,
  showConfirm,
  onGoToPoints,
  onGoToPrizes,
  onGoToMember,
  initialSearch,
  onSearchHandled
}) => {
  const [pedigrees, setPedigrees] = useState<NicePedigree[]>([]);
  const [selectedPedigree, setSelectedPedigree] = useState<NicePedigree | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'reg_no' | 'dog_name' | 'owner_name' | 'micro'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'P' | 'Y' | 'N' | 'R'>('all');
  const [isLoading, setIsLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<'requests' | 'dogtab'>('requests');

  // 심사 처리 피드백 입력란
  const [actionMemo, setActionMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await niceAdminFetchPedigrees(currentPage, searchQuery, searchField, statusFilter);
      if (res && res.success) {
        setPedigrees(res.data || []);
        setTotalCount(res.total || 0);
        // 선택 항목 동기화
        if (selectedPedigree) {
          const currentSelected = res.data.find((p: any) => p.uid === selectedPedigree.uid);
          setSelectedPedigree(currentSelected || null);
        } else {
          setSelectedPedigree(null);
        }
      } else {
        showAlert('오류', res.error || '데이터 로딩 실패');
      }
    } catch (e) {
      console.error(e);
      showAlert('오류', '네트워크 통신 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage, statusFilter]);

  // 외부 연동 검색 파라미터 유도
  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch.query);
      setSearchField(initialSearch.field as any);
      if (onSearchHandled) onSearchHandled();
    }
  }, [initialSearch]);

  // 검색 디바운싱 트리거
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (currentPage === 1) {
        loadData();
      } else {
        setCurrentPage(1);
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, searchField]);

  const handleDelete = (pedigree: NicePedigree) => {
    showConfirm(
      'NICE 모바일 혈통서 신청 삭제',
      `정말로 [${pedigree.dog_name}] 개체의 모바일 혈통서 심사 신청 내역을 완전히 삭제하시겠습니까?`,
      async () => {
        setIsLoading(true);
        try {
          const res = await niceAdminDeletePedigree(pedigree.uid);
          if (res && res.success) {
            showAlert('삭제 완료', '신청 내역이 데이터베이스에서 완전히 삭제되었습니다.');
            loadData();
          } else {
            showAlert('삭제 실패', res.error || '삭제 처리 중 오류가 발생했습니다.');
          }
        } catch (e) {
          console.error(e);
          showAlert('오류', '통신 중 오류가 발생했습니다.');
        } finally {
          setIsLoading(false);
        }
      }
    );
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedPedigree) return;

    if (action === 'reject' && !actionMemo.trim()) {
      showAlert('반려 사유 누락', '반려 사유(의견)를 작성한 후에 반려 처리를 진행해 주세요.');
      return;
    }
    
    const actionText = action === 'approve' ? '승인' : '반려';
    showConfirm(
      `심사 ${actionText} 처리`,
      `[${selectedPedigree.dog_name}] 개체의 혈통서 신청을 ${actionText} 하시겠습니까?`,
      async () => {
        setIsSubmitting(true);
        try {
          const res = await niceAdminPedigreeAction(selectedPedigree.uid, action, actionMemo);
          if (res && res.success) {
            showAlert(action === 'approve' ? '발급 승인 완료' : '반려 완료', res.message || `${actionText} 처리가 완료되었습니다.`);
            setActionMemo('');
            setSelectedPedigree(null); // 상세 보기 모달 창을 닫아 데이터 갱신을 즉시 체감할 수 있도록 함
            loadData();
          } else {
            showAlert('처리 실패', res.error || '서버 오류가 발생했습니다.');
          }
        } catch (e) {
          console.error(e);
          showAlert('오류', '통신 중 오류가 발생했습니다.');
        } finally {
          setIsSubmitting(false);
        }
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'P':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-black">심사대기</span>;
      case 'Y':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black">발급완료</span>;
      case 'N':
        return <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-black">반려</span>;
      case 'R':
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-black">환불처리</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-50 text-slate-400 border border-slate-100 rounded-full text-xs font-black">알 수 없음</span>;
    }
  };

  if (activeSubTab === 'dogtab') {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 font-sans">
        {/* 서브 탭 전환기 */}
        <div className="flex border-b border-slate-200 bg-white px-8 py-3 gap-2 shadow-sm">
          <button
            onClick={() => setActiveSubTab('requests')}
            className="px-5 py-2 text-sm font-black rounded-xl transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          >
            📄 모바일 발급 심사 신청 목록
          </button>
          <button
            onClick={() => setActiveSubTab('dogtab')}
            className="px-5 py-2 text-sm font-black rounded-xl transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-100"
          >
            🐕 발급 완료 혈통서 관리 (nice_dogTab)
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <PedigreeManagementPage
            tableName="nice_dogTab"
            memberTableName="nice_memTab"
            showAlert={showAlert}
            showConfirm={showConfirm}
            onGoToPoints={onGoToPoints}
            onGoToPrizes={onGoToPrizes}
            onGoToMember={onGoToMember}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 font-sans">
      {/* 서브 탭 전환기 */}
      <div className="flex border-b border-slate-200 bg-white px-8 py-3 gap-2 shadow-sm">
        <button
          onClick={() => setActiveSubTab('requests')}
          className="px-5 py-2 text-sm font-black rounded-xl transition-all bg-indigo-600 text-white shadow-lg shadow-indigo-100"
        >
          📄 모바일 발급 심사 신청 목록
        </button>
        <button
          onClick={() => setActiveSubTab('dogtab')}
          className="px-5 py-2 text-sm font-black rounded-xl transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        >
          🐕 발급 완료 혈통서 관리 (nice_dogTab)
        </button>
      </div>
      {/* 1. 상단 타이틀 바 */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
              <Award size={22} />
            </span>
            NICE 모바일 혈통서 심사관리
            <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
              NICE PetPin 연동 DB
            </span>
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-medium">NICE 본인인증을 통과한 소유주가 PetPin 모바일 앱을 통해 신청한 모바일 혈통서 심사 목록입니다.</p>
        </div>

        {/* 통계 요약 */}
        <div className="flex gap-4">
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-5 py-2.5 text-center min-w-[90px]">
            <div className="text-xs font-bold text-slate-400">대기 건수</div>
            <div className="text-xl font-black text-amber-600 mt-0.5">
              {pedigrees.filter(p => p.status === 'P').length}건
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-5 py-2.5 text-center min-w-[90px]">
            <div className="text-xs font-bold text-slate-400">전체 요청</div>
            <div className="text-xl font-black text-slate-800 mt-0.5">{totalCount}건</div>
          </div>
        </div>
      </div>

      {/* 안내 및 도움말 카드 */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mx-8 mt-4 rounded-r-xl shadow-sm">
        <button 
          onClick={() => setIsHelpOpen(!isHelpOpen)} 
          className="flex items-center justify-between w-full text-left font-bold text-blue-800 text-xs hover:text-blue-900 outline-none cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Info size={16} />
            <span>NICE 모바일 혈통서 심사 처리 안내 {isHelpOpen ? '(접기)' : '(클릭하여 도움말 보기)'}</span>
          </div>
          <span className="text-[10px] text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full font-black">
            {isHelpOpen ? '닫기' : '열기'}
          </span>
        </button>
        
        {isHelpOpen && (
          <p className="text-xs text-blue-700 font-bold mt-2 leading-relaxed border-t border-blue-200/60 pt-2 transition-all">
            • <strong>심사 승인 (발급 완료)</strong>:<br />
            <span className="pl-4 block mt-1">• <strong>나이스핀(CI) 일치 시</strong>: 기존 협회 등록번호 끝에 -NP가 붙어 발급되며, 기존 정보에 8가지 신규 메타데이터(출산 수, 등록 수 등)가 함께 동기화됩니다.</span>
            <span className="pl-4 block mt-1">• <strong>나이스핀(CI) 불일치 (신규) 시</strong>: 펫핀 채번 규정(<code>[견종코드]-[기간코드_십][기간코드_일][4자리 순번]-NP</code>, 예: 2026년 진돗개 1번째 ➔ <code>KJ-C60000-NP</code>)에 따라 중복 없는 고유 번호가 자동 생성되어 발급됩니다.</span><br />
            • <strong>심사 반려</strong>: 사유(의견)를 필수로 입력해야 반려가 처리되며, 미입력 시 안내 메시지가 표시됩니다.<br />
            • <strong>오류 진단 안내</strong>: 승인/반려 시 모바일 앱(PetPin) 서버 통신이 실패하더라도 어드민 내부 데이터베이스(DB) 처리는 온전히 완료됩니다. 통신 실패나 DB 처리 오류 발생 시 팝업 창에 상세한 SQL 및 curl 원인 코드가 출력됩니다.
          </p>
        )}
      </div>

      {/* 2. 필터 컨트롤 바 */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div className="flex gap-3 flex-1 min-w-[300px] max-w-[700px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border-2 border-slate-100 text-slate-700 font-bold px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-sm transition-all"
          >
            <option value="all">모든 상태</option>
            <option value="P">심사대기 (Pending)</option>
            <option value="Y">발급완료 (Approved)</option>
            <option value="N">반려됨 (Rejected)</option>
            <option value="R">환불됨 (Refunded)</option>
          </select>

          <select
            value={searchField}
            onChange={(e) => setSearchField(e.target.value as any)}
            className="bg-slate-50 border-2 border-slate-100 text-slate-700 font-bold px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-sm transition-all"
          >
            <option value="all">전체 검색</option>
            <option value="reg_no">등록 번호</option>
            <option value="dog_name">견명 (공식명칭)</option>
            <option value="owner_name">신청자 실명</option>
            <option value="micro">마이크로칩 번호</option>
          </select>

          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="심사 정보 검색... (실시간 검색)"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:bg-white rounded-xl transition-all outline-none font-bold text-sm placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-all"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            동기화
          </button>
        </div>
      </div>

      {/* 3. 콘텐츠 레이아웃 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 리스트 테이블 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              <RefreshCw className="animate-spin text-indigo-500" size={32} />
              <div className="font-bold">심사 데이터 조회 중...</div>
            </div>
          ) : pedigrees.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
              <FileText size={48} className="text-slate-300" />
              <div className="font-bold text-lg">해당 조건의 심사 신청 건이 존재하지 않습니다.</div>
            </div>
          ) : (
            <table className="w-full border-collapse text-left bg-white">
              <thead>
                <tr className="bg-slate-100/70 text-slate-500 border-b border-slate-200 text-xs font-black tracking-wider uppercase sticky top-0 z-10">
                  <th className="py-4 px-6">신청 일시</th>
                  <th className="py-4 px-6">등록 번호</th>
                  <th className="py-4 px-6">견명 (Dog Name)</th>
                  <th className="py-4 px-6">견종 / 성별</th>
                  <th className="py-4 px-6">마이크로칩 번호</th>
                  <th className="py-4 px-6">신청인 (실명)</th>
                  <th className="py-4 px-6">상태</th>
                  <th className="py-4 px-6 text-center">심사</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                {pedigrees.map((p) => (
                  <tr
                    key={p.uid}
                    onClick={() => { setSelectedPedigree(p); setActionMemo(p.admin_memo || ''); }}
                    className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${selectedPedigree?.uid === p.uid ? 'bg-indigo-50/30' : ''}`}
                  >
                    <td className="py-4 px-6 text-slate-400 font-medium text-xs">{p.registered_at}</td>
                    <td className="py-4 px-6 text-slate-900 font-extrabold">{p.reg_no}</td>
                    <td className="py-4 px-6 text-indigo-600 font-black tracking-tight">{p.dog_name}</td>
                    <td className="py-4 px-6 text-slate-800">
                      <div>{p.breed_name}</div>
                      <div className="text-[10px] text-slate-400">{p.gender === 'M' ? '수컷 (Male)' : '암컷 (Female)'}</div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">{p.micro || '-'}</td>
                    <td className="py-4 px-6">
                      <div className="text-slate-900 font-black">{p.owner_name}</div>
                      <div className="text-slate-400 text-[10px] font-bold">ID: {p.owner_id}</div>
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(p.status)}</td>
                    <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1.5 justify-center">
                        <button
                          onClick={() => { setSelectedPedigree(p); setActionMemo(p.admin_memo || ''); }}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition-all"
                          title="상세 보기 / 심사"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="삭제"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 4. 페이지네이션 */}
      <div className="bg-white border-t border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="text-slate-400 text-xs font-bold">
          검색 결과: <span className="text-slate-700">{totalCount}</span>건 중 {totalCount > 0 ? (currentPage - 1) * 50 + 1 : 0}~{Math.min(currentPage * 50, totalCount)} 표시
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || isLoading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded-lg font-bold text-xs transition-all"
          >
            이전
          </button>
          <span className="px-3 py-1.5 text-slate-700 font-bold text-xs">
            {currentPage} / {Math.ceil(totalCount / 50) || 1}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / 50), prev + 1))}
            disabled={currentPage >= Math.ceil(totalCount / 50) || isLoading}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded-lg font-bold text-xs transition-all"
          >
            다음
          </button>
        </div>
      </div>

      {/* 5. 상세 심사 모달 다이얼로그 */}
      {selectedPedigree && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in-50 zoom-in-95 duration-200">
            {/* 헤더 */}
            <div className="bg-indigo-900 text-white px-8 py-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={24} className="text-indigo-300" />
                <div>
                  <h3 className="text-lg font-black tracking-tight">{selectedPedigree.dog_name}</h3>
                  <p className="text-xs text-indigo-200 font-medium">모바일 혈통서 심사 신청서 상세 (UID: {selectedPedigree.uid})</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPedigree(null)}
                className="text-indigo-200 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* 본문 (스크롤 영역) */}
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-2 gap-8">
              {/* 왼쪽: 기본 및 매핑 정보 */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-black text-slate-800 border-b pb-2 mb-3">🐾 개체 기본 정보</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="등록 번호" value={selectedPedigree.reg_no} />
                    <DetailItem label="견명" value={selectedPedigree.dog_name} />
                    <DetailItem label="견종" value={selectedPedigree.breed_name} />
                    <DetailItem label="성별" value={selectedPedigree.gender === 'M' ? '수컷 (Male)' : '암컷 (Female)'} />
                    <DetailItem label="마이크로칩" value={selectedPedigree.micro || '-'} />
                    <DetailItem label="모색 (Color)" value={selectedPedigree.hair || '-'} />
                    <DetailItem label="생년월일" value={selectedPedigree.birth || '-'} />
                    <DetailItem label="등록일 (발급일)" value={selectedPedigree.reg_date || '-'} />
                    <DetailItem label="출산 수 (M : F)" value={`${selectedPedigree.birth_m ?? 0} 남 : ${selectedPedigree.birth_f ?? 0} 여`} />
                    <DetailItem label="등록 수 (M : F)" value={`${selectedPedigree.reg_count_m ?? 0} 남 : ${selectedPedigree.reg_count_f ?? 0} 여`} />
                    <DetailItem label="견사호 (영문)" value={selectedPedigree.saho_eng || '-'} />
                    <DetailItem label="견사호 (국문)" value={selectedPedigree.saho || '-'} />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-800 border-b pb-2 mb-3">🌳 부모견 정보</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="부견 이름 (Sire)" value={selectedPedigree.fa_name || selectedPedigree.sire_name || '-'} />
                    <DetailItem label="부견 등록번호" value={selectedPedigree.fa_regno || selectedPedigree.sire_reg_no || '-'} />
                    <DetailItem label="모견 이름 (Dam)" value={selectedPedigree.mo_name || selectedPedigree.dam_name || '-'} />
                    <DetailItem label="모견 등록번호" value={selectedPedigree.mo_regno || selectedPedigree.dam_reg_no || '-'} />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-800 border-b pb-2 mb-3">🌳 조상견 정보</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="조상견 이름" value={selectedPedigree.anc_name || '-'} />
                    <DetailItem label="조상견 견사호" value={selectedPedigree.anc_saho || '-'} />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-800 border-b pb-2 mb-3">👤 번식자 정보</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="번식자 이름" value={selectedPedigree.breeder_name || '-'} />
                    <div className="col-span-2">
                      <DetailItem label="번식자 주소" value={selectedPedigree.breeder_addr || '-'} fullWidth />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-800 border-b pb-2 mb-3 font-sans">👤 소유자 및 신청인 정보 (클릭 시 회원관리로 이동)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-400">신청인 실명</span>
                      <button
                        onClick={() => {
                          if (onGoToMember && selectedPedigree.owner_name) {
                            onGoToMember(selectedPedigree.owner_name);
                            setSelectedPedigree(null);
                          }
                        }}
                        className="text-sm font-extrabold text-blue-600 hover:text-blue-800 hover:underline text-left mt-1 self-start"
                      >
                        {selectedPedigree.owner_name} ➔
                      </button>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-400">NICE ID / 핀</span>
                      <button
                        onClick={() => {
                          if (onGoToMember && selectedPedigree.owner_id) {
                            onGoToMember(selectedPedigree.owner_id);
                            setSelectedPedigree(null);
                          }
                        }}
                        className="text-sm font-extrabold text-blue-600 hover:text-blue-800 hover:underline text-left mt-1 self-start"
                      >
                        {selectedPedigree.owner_id || '-'} ➔
                      </button>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-400">소유자 이름</span>
                      <button
                        onClick={() => {
                          if (onGoToMember && selectedPedigree.poss_name) {
                            onGoToMember(selectedPedigree.poss_name);
                            setSelectedPedigree(null);
                          }
                        }}
                        className="text-sm font-extrabold text-blue-600 hover:text-blue-800 hover:underline text-left mt-1 self-start"
                      >
                        {selectedPedigree.poss_name || '-'} ➔
                      </button>
                    </div>

                    <div>{/* 빈 격자 보정용 */}</div>

                    <div className="col-span-2">
                      <DetailItem label="소유자 주소" value={selectedPedigree.poss_addr || '-'} fullWidth />
                    </div>

                    <div className="col-span-2 flex flex-col">
                      <span className="text-xs font-black text-slate-400">소유자 CI</span>
                      <button
                        onClick={() => {
                          if (onGoToMember && selectedPedigree.poss_ci) {
                            onGoToMember(selectedPedigree.poss_ci);
                            setSelectedPedigree(null);
                          }
                        }}
                        className="text-xs font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline text-left mt-1 bg-indigo-50/50 p-2 rounded border border-indigo-100 break-all w-full"
                      >
                        {selectedPedigree.poss_ci || '-'} ➔
                      </button>
                    </div>
                  </div>
                </div>

                {/* 심사 액션 폼 */}
                {selectedPedigree.status === 'P' ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                    <h5 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                      <Edit size={16} className="text-indigo-600" />
                      심사 의견 기술
                    </h5>
                    <textarea
                      value={actionMemo}
                      onChange={(e) => setActionMemo(e.target.value)}
                      placeholder="승인 또는 반려 사유를 입력하세요... (반려 시 필수)"
                      className="w-full h-24 p-3 bg-white border border-slate-200 focus:border-indigo-500 rounded-lg text-sm font-bold outline-none resize-none transition-all"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAction('approve')}
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-100 flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Check size={18} />
                        발급 승인
                      </button>
                      <button
                        onClick={() => handleAction('reject')}
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-lg shadow-rose-100 flex items-center justify-center gap-1.5 transition-all"
                      >
                        <X size={18} />
                        심사 반려
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                    <h5 className="text-sm font-black text-slate-400">심사 이력</h5>
                    <div className="mt-3 space-y-2.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">처리 결과</span>
                        <span>{getStatusBadge(selectedPedigree.status)}</span>
                      </div>
                      <div className="text-xs">
                        <div className="text-slate-400 font-bold mb-1">관리자 메모</div>
                        <div className="bg-white p-3 rounded-lg border border-slate-200 font-bold text-slate-700">
                          {selectedPedigree.admin_memo || '남겨진 메모가 없습니다.'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 오른쪽: 제출된 이미지/문서 문서고 */}
              <div className="flex flex-col">
                <h4 className="text-sm font-black text-slate-800 border-b pb-2 mb-3 flex items-center gap-1.5">
                  <ImageIcon size={16} className="text-indigo-600" />
                  제출된 증빙 문서 / 사진
                </h4>
                
                <div className="flex-1 grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto">
                  <ImageDocCard label="문서 1 (혈통서 원본)" path={selectedPedigree.image1_path} />
                  <ImageDocCard label="문서 2 (개체 전면)" path={selectedPedigree.image2_path} />
                  <ImageDocCard label="문서 3 (개체 측면)" path={selectedPedigree.image3_path} />
                  <ImageDocCard label="문서 4 (기타 증명)" path={selectedPedigree.image4_path} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DetailItem: React.FC<{ label: string; value: string; fullWidth?: boolean }> = ({ label, value, fullWidth }) => (
  <div className={fullWidth ? "col-span-2" : ""}>
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</div>
    <div className="text-sm font-extrabold text-slate-800 mt-0.5 break-all whitespace-pre-wrap">{value}</div>
  </div>
);

const ImageDocCard: React.FC<{ label: string; path?: string }> = ({ label, path }) => (
  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col h-48 shadow-sm">
    <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 text-[10px] font-black text-slate-500 truncate">
      {label}
    </div>
    <div className="flex-1 flex items-center justify-center p-2">
      {path ? (
        <a href={path} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative group">
          <img src={path} alt={label} className="w-full h-full object-contain rounded-lg transition-transform group-hover:scale-[1.02]" />
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity rounded-lg">
            새창에서 보기
          </div>
        </a>
      ) : (
        <div className="text-center text-slate-300">
          <ImageIcon size={32} className="mx-auto mb-1 opacity-60" />
          <span className="text-[10px] font-bold">미첨부</span>
        </div>
      )}
    </div>
  </div>
);
