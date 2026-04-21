import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Clock, Filter, Loader2, User, Banknote, Trash2, CheckSquare, Square } from 'lucide-react';
import { portalFetchMembershipApplications, portalApproveMembershipApplication, portalDeleteMembershipApplications } from '../services/portalService';

interface MembershipApplicationPageProps {
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  onGoToMember?: (name: string) => void;
}

export const MembershipApplicationPage: React.FC<MembershipApplicationPageProps> = ({ showAlert, showConfirm, onGoToMember }) => {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    setSelectedIds([]); // 로드 시 선택 초기화
    try {
      const res = await portalFetchMembershipApplications(page, search, statusFilter);
      if (res.success) {
        setApplications(res.data || []);
        setTotal(res.total || 0);
      }
    } catch (e: any) {
      showAlert('오류', e.message || '데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter]);

  const handleAction = (uid: number, action: 'approve' | 'reject', name: string) => {
    const title = action === 'approve' ? '회원 등급 승인' : '회원 등급 거절';
    const message = action === 'approve' 
        ? `[${name}]님의 입금을 확인하셨습니까? 승인 시 실제 회원 정보의 등급과 유효기간이 즉시 갱신됩니다.` 
        : `[${name}]님의 신청을 거절하시겠습니까?`;

    showConfirm(title, message, async () => {
        try {
            const res = await portalApproveMembershipApplication(uid, action);
            if (res.success) {
                showAlert('완료', res.message);
                loadData();
            } else {
                showAlert('실패', res.error || '처리 중 오류가 발생했습니다.');
            }
        } catch (e: any) {
            showAlert('오류', e.message);
        }
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;

    showConfirm('신청서 삭제', `선택한 ${selectedIds.length}건의 신청 내역을 영구적으로 삭제하시겠습니까? (테스트 데이터 정리용)`, async () => {
      try {
        const res = await portalDeleteMembershipApplications(selectedIds);
        if (res.success) {
          showAlert('완료', res.message);
          loadData();
        } else {
          showAlert('오류', res.error || '삭제 중 오류가 발생했습니다.');
        }
      } catch (e: any) {
        showAlert('오류', e.message);
      }
    });
  };

  const toggleSelect = (uid: number) => {
    setSelectedIds(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
  };

  const toggleAll = () => {
    if (selectedIds.length === applications.length && applications.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(applications.map(app => app.uid));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'P': return <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-[11px] font-black uppercase tracking-widest border border-orange-200"><Clock size={12} /> 입금대기</span>;
      case 'Y': return <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[11px] font-black uppercase tracking-widest border border-green-200"><CheckCircle size={12} /> 승인완료</span>;
      case 'N': return <span className="flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-[11px] font-black uppercase tracking-widest border border-red-200"><XCircle size={12} /> 거절됨</span>;
      default: return <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[11px] font-bold">{status}</span>;
    }
  };

  const decodeDegree = (degree: string) => {
      if (degree === 'A0' || degree === 'A1') return '정회원 (1년)';
      if (degree === 'A2') return '정회원 (2년)';
      if (degree === 'A3') return '정회원 (3년)';
      if (degree === 'C0' || degree === 'S0') return '특별회원 (평생)';
      if (degree === 'B0') return '가족회원';
      return degree;
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden font-sans">
      {/* 🚀 Header Section */}
      <div className="bg-white border-b border-slate-100 p-8 shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 max-w-[1920px] mx-auto">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
                <Banknote size={24} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">회원 등급 신청 관리</h1>
            </div>
            <p className="text-sm text-slate-400 font-medium ml-12">입금 확인 및 등급 전환 신청을 실시간으로 관리하고 승인합니다.</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {selectedIds.length > 0 && (
                <button 
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 border border-red-100 hover:bg-red-600 hover:text-white rounded-2xl font-black text-sm transition-all shadow-sm animate-in fade-in slide-in-from-right-4 duration-300"
                >
                  <Trash2 size={18} />
                  선택 {selectedIds.length}건 삭제
                </button>
            )}
            <div className="relative flex-1 md:w-72 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
              <input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadData()}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-900 transition-all outline-none" 
                placeholder="신청자/입금자명 검색..." 
              />
            </div>
            <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0">
                {['all', 'P', 'Y'].map(f => (
                    <button 
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {f === 'all' ? '전체' : f === 'P' ? '대기' : '승인'}
                    </button>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 Table Section */}
      <div className="flex-1 overflow-auto p-8 pt-0">
        <div className="max-w-[1920px] mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
              <Loader2 className="animate-spin mb-4 text-blue-600" size={48} />
              <p className="font-bold">신청 내역을 불러오는 중...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-100 p-20 text-center text-slate-300">
               <p className="text-xl font-bold">표시할 신청 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-5 w-12 text-center">
                        <button onClick={toggleAll} className="text-slate-400 hover:text-blue-600 transition-colors">
                            {(selectedIds.length === applications.length && applications.length > 0) ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20}/>}
                        </button>
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">번호</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">신청자 정보</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">신청 등급/기간</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">입금 금액/입금자</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">상태</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">신청일자</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">승인관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {applications.map((app) => (
                    <tr key={app.uid} className={`hover:bg-slate-50/50 transition-colors group ${selectedIds.includes(app.uid) ? 'bg-blue-50/30' : ''}`}>
                      <td className="px-6 py-6 text-center">
                          <button onClick={() => toggleSelect(app.uid)} className="text-slate-300 hover:text-blue-600 transition-colors">
                              {selectedIds.includes(app.uid) ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18}/>}
                          </button>
                      </td>
                      <td className="px-8 py-6 text-sm font-bold text-slate-400">{app.uid}</td>
                      <td className="px-8 py-6">
                        <div 
                          className={`flex items-center gap-3 ${onGoToMember ? 'cursor-pointer hover:bg-white p-2 -ml-2 rounded-2xl transition-all hover:shadow-sm border border-transparent hover:border-slate-200 group/member' : ''}`}
                          onClick={() => onGoToMember && onGoToMember(app.name)}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-colors shadow-sm ${selectedIds.includes(app.uid) ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                            {app.name?.[0]}
                          </div>
                          <div>
                            <div className="font-black text-slate-900 group-hover/member:text-blue-600 transition-colors">{app.name}</div>
                            <div className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">MID: {app.mid} / ID: {app.mem_no}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-800">{decodeDegree(app.req_degree)}</span>
                            <span className="text-[11px] text-slate-400 font-bold italic">{app.req_years === 99 ? '만 65세까지 (평생회원)' : `${app.req_years}년 연장`}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-orange-600 tracking-tight">
                                ₩{app.amount ? Number(app.amount).toLocaleString() : '0'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-bold group-hover:text-blue-600 transition-colors">입금자: {app.depositor || '-'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">{getStatusBadge(app.status)}</td>
                      <td className="px-8 py-6 text-xs font-bold text-slate-400 whitespace-nowrap">
                        {new Date((app.apply_date) * 1000).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center gap-2">
                              <button 
                                onClick={() => handleAction(app.uid, 'approve', app.name)}
                                className={`px-4 py-2 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all hover:scale-105 active:scale-95 ${app.status === 'Y' ? 'bg-green-500 shadow-green-200' : 'bg-blue-600 shadow-blue-100'}`}
                              >
                                {app.status === 'Y' ? '완료됨' : '승인'}
                              </button>
                              <button 
                                onClick={() => handleAction(app.uid, 'reject', app.name)}
                                className={`px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${app.status === 'N' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100'}`}
                              >
                                {app.status === 'N' ? '거절됨' : '거절'}
                              </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
