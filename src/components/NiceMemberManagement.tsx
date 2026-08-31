import React, { useState, useEffect } from 'react';
import { Search, UserCheck, ShieldAlert, ShieldCheck, Calendar, MapPin, Download, RefreshCw, Trash2, Edit, CheckCircle, Dog } from 'lucide-react';
import { niceAdminFetchMembers, niceAdminDeleteMember } from '../services/portalService';

interface NiceMember {
  mid: number;
  id: string;
  name: string;
  birth: string;
  hp: string;
  ci: string;
  di: string;
  addr: string;
  verified_at: string;
  owned_dogs?: string[];
}

interface NiceMemberManagementProps {
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  onSearchPedigree?: (regNo: string) => void;
  initialSearch?: { query: string; field: string } | null;
  onSearchHandled?: () => void;
}

export const NiceMemberManagement: React.FC<NiceMemberManagementProps> = ({
  showAlert,
  showConfirm,
  onSearchPedigree,
  initialSearch,
  onSearchHandled
}) => {
  const [members, setMembers] = useState<NiceMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<NiceMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [displaySearchQuery, setDisplaySearchQuery] = useState('');
  const [searchField, setSearchField] = useState<'all' | 'name' | 'id' | 'hp' | 'ci'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const rawCiRef = React.useRef<string>('');

  const maskCi = (ci?: string) => {
    if (!ci) return '-';
    if (ci.length <= 16) return ci;
    const start = ci.slice(0, 8);
    const end = ci.slice(-6);
    return `${start}****************************************${end}`;
  };

  const isFirstRender = React.useRef(true);
  const isInitialSearchHandled = React.useRef(false);

  const loadData = async (page = currentPage, query = searchQuery, field = searchField) => {
    setIsLoading(true);
    try {
      // 🚀 rawCiRef가 있으면 마스킹되지 않은 원본 CI로 정확히 서버 호출
      const actualQuery = (field === 'ci' && rawCiRef.current) ? rawCiRef.current : query;
      const res = await niceAdminFetchMembers(page, actualQuery, field);
      if (res && res.success) {
        setMembers(res.data || []);
        setTotalCount(res.total || 0);
        if (res.data && res.data.length > 0) {
          setSelectedMember(res.data[0]);
        } else {
          setSelectedMember(null);
        }
      } else {
        showAlert('오류', res.error || '데이터 로딩 실패');
      }
    } catch (error) {
      console.error(error);
      showAlert('오류', '네트워크 통신 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 1. 외부 연동 검색 파라미터 (혈통서에서 회원 조회로 넘어올 때 즉시 1회 정확히 로딩)
  useEffect(() => {
    if (initialSearch) {
      const q = initialSearch.query;
      const f = (initialSearch.field || 'all') as 'all' | 'name' | 'id' | 'hp' | 'ci';
      isInitialSearchHandled.current = true;
      
      if (f === 'ci' && q.length > 20) {
        rawCiRef.current = q;
        setSearchQuery(q);
        setDisplaySearchQuery(maskCi(q));
      } else {
        rawCiRef.current = '';
        setSearchQuery(q);
        setDisplaySearchQuery(q);
      }
      
      setSearchField(f);
      setCurrentPage(1);
      loadData(1, q, f);
      if (onSearchHandled) onSearchHandled();
    }
  }, [initialSearch]);

  // 2. 검색창 수동 입력 시 디바운스(300ms) 검색
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (!initialSearch) {
        loadData(1, '', 'all');
      }
      return;
    }

    if (isInitialSearchHandled.current) {
      isInitialSearchHandled.current = false;
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      if (currentPage === 1) {
        loadData(1, searchQuery, searchField);
      } else {
        setCurrentPage(1);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchField]);

  // 3. 페이지 변경 시 로딩
  useEffect(() => {
    if (!isFirstRender.current && !isInitialSearchHandled.current) {
      loadData(currentPage, searchQuery, searchField);
    }
  }, [currentPage]);

  const handleDelete = (member: NiceMember) => {
    showConfirm(
      'NICE 실명회원 삭제',
      `정말로 [${member.name}] 회원의 실명인증 기록(CI/DI)을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      async () => {
        setIsLoading(true);
        try {
          const res = await niceAdminDeleteMember(member.mid);
          if (res && res.success) {
            showAlert('삭제 완료', '회원의 NICE 본인인증 정보가 초기화되었습니다.');
            loadData();
          } else {
            showAlert('삭제 실패', res.error || '삭제 작업 도중 오류가 발생했습니다.');
          }
        } catch (e) {
          console.error(e);
          showAlert('오류', '통신 오류가 발생했습니다.');
        } finally {
          setIsLoading(false);
        }
      }
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 font-sans">
      {/* 1. 상단 상태 바 및 요약 통계 */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
              <UserCheck size={22} />
            </span>
            NICE 실명인증 회원관리
            <span className="text-xs font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full border border-green-200">
              NICE 본인확인 연동
            </span>
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-medium">나이스 본인 확인 서비스를 거쳐 정상적으로 가입 및 전환된 회원 정보 데이터베이스입니다.</p>
        </div>

        {/* 통계 카드 */}
        <div className="flex gap-4">
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-5 py-2.5 text-center min-w-[100px]">
            <div className="text-xs font-bold text-slate-400">총 인증 회원</div>
            <div className="text-xl font-black text-slate-800 mt-0.5">{totalCount}명</div>
          </div>
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl px-5 py-2.5 text-center min-w-[110px]">
            <div className="text-xs font-bold text-blue-500">소유견 보유 회원</div>
            <div className="text-xl font-black text-blue-600 mt-0.5">
              {members.filter(m => m.owned_dogs && m.owned_dogs.length > 0).length}명
            </div>
          </div>
        </div>
      </div>

      {/* 2. 컨트롤 필터 영역 */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div className="flex gap-3 flex-1 min-w-[300px] max-w-[650px]">
          <select
            value={searchField}
            onChange={(e) => {
              const nf = e.target.value as any;
              setSearchField(nf);
              if (rawCiRef.current) {
                rawCiRef.current = '';
                setSearchQuery('');
                setDisplaySearchQuery('');
              }
            }}
            className="bg-slate-50 border-2 border-slate-100 text-slate-700 font-bold px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-sm transition-all"
          >
            <option value="all">전체 필드</option>
            <option value="name">실명</option>
            <option value="id">아이디</option>
            <option value="hp">휴대폰 번호</option>
            <option value="ci">NICE CI</option>
          </select>

          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type="text"
              value={displaySearchQuery}
              onChange={(e) => {
                const val = e.target.value;
                rawCiRef.current = '';
                setDisplaySearchQuery(val);
                setSearchQuery(val);
              }}
              placeholder="검색어를 입력해 주세요... (실시간 자동 검색)"
              className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 focus:bg-white rounded-xl transition-all outline-none font-bold text-sm placeholder:text-slate-300 font-mono"
            />
            {displaySearchQuery && (
              <button
                type="button"
                onClick={() => {
                  rawCiRef.current = '';
                  setDisplaySearchQuery('');
                  setSearchQuery('');
                  loadData(1, '', searchField);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-all text-xs font-black"
                title="검색어 지우기"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-sm transition-all"
            title="새로고침"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            동기화
          </button>

          <button
            onClick={() => showAlert('엑셀 추출', 'NICE 실명인증 회원 정보를 엑셀로 내보냅니다.')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm"
          >
            <Download size={16} />
            엑셀 내보내기
          </button>
        </div>
      </div>

      {/* 3. 메인 콘텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 테이블 리스트 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
              <RefreshCw className="animate-spin text-blue-500" size={32} />
              <div className="font-bold">데이터베이스 동기화 중...</div>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
              <ShieldAlert size={48} className="text-slate-300" />
              <div className="font-bold text-lg">조건에 맞는 회원이 없습니다.</div>
              <p className="text-xs">검색어를 확인해 주세요.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left bg-white">
              <thead>
                <tr className="bg-slate-100/70 text-slate-500 border-b border-slate-200 text-xs font-black tracking-wider uppercase sticky top-0 z-10">
                  <th className="py-4 px-6">아이디 / 회원번호</th>
                  <th className="py-4 px-6">실명</th>
                  <th className="py-4 px-6">생년월일</th>
                  <th className="py-4 px-6">휴대폰 번호</th>
                  <th className="py-4 px-6">소유견 등록번호</th>
                  <th className="py-4 px-6">NICE 본인인증 상태</th>
                  <th className="py-4 px-6">인증/가입일시</th>
                  <th className="py-4 px-6 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
                {members.map((m) => (
                  <tr
                    key={m.mid}
                    onClick={() => setSelectedMember(m)}
                    className={`hover:bg-slate-50/50 cursor-pointer transition-colors ${selectedMember?.mid === m.mid ? 'bg-blue-50/30' : ''}`}
                  >
                    <td className="py-4 px-6">
                      <div className="text-slate-900 font-extrabold">{m.id}</div>
                      <div className="text-slate-400 text-xs">MID-{m.mid}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-900 font-black">{m.name}</td>
                    <td className="py-4 px-6 text-slate-500">{m.birth || '-'}</td>
                    <td className="py-4 px-6 text-slate-600">{m.hp || '-'}</td>
                    <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {m.owned_dogs && m.owned_dogs.length > 0 ? (
                          m.owned_dogs.map((regNo, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                if (onSearchPedigree) {
                                  onSearchPedigree(regNo);
                                }
                              }}
                              className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-600 rounded text-[11px] font-extrabold transition-all whitespace-nowrap"
                            >
                              {regNo}
                            </button>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black shadow-xs">
                        <ShieldCheck size={13} className="text-emerald-600" />
                        NICE 인증완료
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-medium text-xs">{m.verified_at || '-'}</td>
                    <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDelete(m)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="회원 삭제"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 우측 상세 정보 패널 */}
        {selectedMember && (
          <div className="w-[380px] border-l border-slate-200 bg-white flex flex-col h-full animate-in slide-in-from-right duration-200">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-800">{selectedMember.name}</h3>
                <p className="text-xs text-slate-400 font-bold">인증 회원 상세 정보</p>
              </div>
              <button 
                onClick={() => setSelectedMember(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                닫기
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h4 className="text-xs font-black text-indigo-600 mb-3 uppercase tracking-wider">👤 기본 프로필</h4>
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2">
                  <DetailRow label="아이디" value={selectedMember.id} />
                  <DetailRow label="회원번호" value={`MID-${selectedMember.mid}`} />
                  <DetailRow label="실명" value={selectedMember.name} />
                  <DetailRow label="생년월일" value={selectedMember.birth || '-'} />
                  <DetailRow label="휴대폰" value={selectedMember.hp || '-'} />
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-indigo-600 mb-3 uppercase tracking-wider">🏠 주소 정보</h4>
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs font-black text-slate-400 mb-1">인증 등록 주소</div>
                  <div className="text-sm font-extrabold text-slate-800 break-all whitespace-pre-wrap">
                    {selectedMember.addr || '등록된 주소가 없습니다.'}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-indigo-600 mb-3 uppercase tracking-wider">🐕 소유 반려견 ({selectedMember.owned_dogs?.length ?? 0})</h4>
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2">
                  {selectedMember.owned_dogs && selectedMember.owned_dogs.length > 0 ? (
                    selectedMember.owned_dogs.map((regNo, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-b-0">
                        <span className="text-sm font-extrabold text-slate-800">{regNo}</span>
                        {onSearchPedigree && (
                          <button
                            onClick={() => onSearchPedigree(regNo)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            조회 ➔
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 font-bold py-2 text-center">소유한 반려견이 없습니다.</div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black text-indigo-600 mb-3 uppercase tracking-wider">🛡️ NICE 본인확인 정보</h4>
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <div>
                    <div className="text-xs font-black text-slate-400 mb-1.5">NICE 실명인증 상태</div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black">
                      <ShieldCheck size={13} className="text-emerald-600" />
                      NICE 실명인증 완료 (안전 보관)
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-400 mb-1">인증 완료 일시</div>
                    <div className="text-xs font-mono font-bold text-slate-700">{selectedMember.verified_at || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
    </div>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-50">
    <span className="text-xs font-black text-slate-400">{label}</span>
    <span className="text-sm font-extrabold text-slate-800">{value}</span>
  </div>
);
