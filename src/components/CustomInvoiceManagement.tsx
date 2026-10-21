import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Plus, RefreshCw, Search, CheckCircle, Clock, 
  AlertCircle, X, Send, Copy, Ban, Check, DollarSign, User, Phone 
} from 'lucide-react';
import { 
  getCustomInvoiceList, 
  createCustomInvoice, 
  actionCustomInvoice 
} from '../services/memberService';
import { PersonSearchModal } from './MemberSearchModal';
import { PersonSearchResult } from '../types';

interface CustomInvoiceManagementProps {
  showAlert?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
  showConfirm?: (title: string, message: string, onConfirm: () => void) => void;
}

export const CustomInvoiceManagement: React.FC<CustomInvoiceManagementProps> = ({
  showAlert,
  showConfirm
}) => {
  // 상태 선언
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [limit] = useState<number>(20);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // 모달 상태
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isMemberSearchOpen, setIsMemberSearchOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState({
    customer_name: '',
    customer_hp: '',
    member_id: '',
    title: '',
    amount: '',
    expire_days: 7,
    admin_memo: '',
    send_sms: true
  });

  // 데이터 로드
  const loadData = async (targetPage = page, targetStatus = statusFilter, targetSearch = searchTerm) => {
    setLoading(true);
    try {
      const res = await getCustomInvoiceList({
        page: targetPage,
        limit,
        status: targetStatus,
        search: targetSearch
      });
      if (res && res.success !== false) {
        setInvoices(res.data || []);
        setTotal(res.total || 0);
      }
    } catch (e: any) {
      if (showAlert) showAlert('error', '데이터 조회 실패', e?.message || '목록을 불러오지 못했습니다.');
      else alert(e?.message || '목록 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1, statusFilter, searchTerm);
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData(1, statusFilter, searchTerm);
  };

  // 회원 검색 모달에서 선택 시 3개 필드 자동 채우기
  const handleSelectMember = (person: PersonSearchResult) => {
    const name = person.name || person.data.name || '';
    const hp = person.data.phone || '';
    const memberId = person.data.id || person.id || '';
    setCreateForm(prev => ({
      ...prev,
      customer_name: name,
      customer_hp: hp,
      member_id: memberId
    }));
    setIsMemberSearchOpen(false);
  };

  // 신규 등록
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.customer_name.trim()) {
      alert('고객 이름을 입력해 주세요.');
      return;
    }
    const cleanHp = createForm.customer_hp.replace(/[^0-9]/g, '');
    if (cleanHp.length < 9) {
      alert('올바른 휴대폰 번호를 입력해 주세요.');
      return;
    }
    if (!createForm.title.trim()) {
      alert('결제 항목명을 입력해 주세요.');
      return;
    }
    const numAmount = parseInt(createForm.amount.replace(/[^0-9]/g, ''), 10);
    if (!numAmount || numAmount < 100) {
      alert('결제 금액은 최소 100원 이상이어야 합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createCustomInvoice({
        customer_name: createForm.customer_name.trim(),
        customer_hp: cleanHp,
        member_id: createForm.member_id.trim() || undefined,
        title: createForm.title.trim(),
        amount: numAmount,
        expire_days: Number(createForm.expire_days) || 7,
        admin_memo: createForm.admin_memo.trim(),
        send_sms: createForm.send_sms
      });

      if (showAlert) {
        showAlert('success', '청구서 등록 완료', res?.message || '개인결제 청구가 등록되었습니다.');
      } else {
        alert(res?.message || '개인결제 청구가 등록되었습니다.');
      }

      setIsCreateOpen(false);
      setCreateForm({
        customer_name: '',
        customer_hp: '',
        member_id: '',
        title: '',
        amount: '',
        expire_days: 7,
        admin_memo: '',
        send_sms: true
      });
      loadData(1, statusFilter, searchTerm);
    } catch (e: any) {
      if (showAlert) showAlert('error', '등록 실패', e?.message || '청구 등록 중 오류가 발생했습니다.');
      else alert(e?.message || '등록 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 무통장 입금 확인 처리
  const handleConfirmCash = (code: string, name: string, amount: number) => {
    const action = async () => {
      try {
        const res = await actionCustomInvoice(code, 'confirm_cash');
        if (showAlert) showAlert('success', '입금 확인 완료', res?.message || '결제완료 처리되었습니다.');
        else alert('입금 확인 완료');
        loadData();
      } catch (e: any) {
        if (showAlert) showAlert('error', '처리 실패', e?.message);
        else alert(e?.message);
      }
    };

    const msg = `[${name}] 님의 ${amount.toLocaleString()}원 무통장 입금을 확인하고 결제완료 처리하시겠습니까?`;
    if (showConfirm) showConfirm('입금 확인 승인', msg, action);
    else if (window.confirm(msg)) action();
  };

  // 청구 취소
  const handleCancel = (code: string, name: string) => {
    const action = async () => {
      try {
        const res = await actionCustomInvoice(code, 'cancel');
        if (showAlert) showAlert('info', '청구 취소', res?.message || '청구가 취소되었습니다.');
        else alert('청구 취소 완료');
        loadData();
      } catch (e: any) {
        if (showAlert) showAlert('error', '취소 실패', e?.message);
        else alert(e?.message);
      }
    };

    const msg = `[${name}] 님의 청구 건(${code})을 취소하시겠습니까?`;
    if (showConfirm) showConfirm('청구 취소', msg, action);
    else if (window.confirm(msg)) action();
  };

  // SMS 재발송
  const handleResendSms = async (code: string) => {
    try {
      const res = await actionCustomInvoice(code, 'resend_sms');
      if (showAlert) showAlert('success', 'SMS 발송', res?.message || '안내 SMS가 발송되었습니다.');
      else alert(res?.message || 'SMS 발송 완료');
    } catch (e: any) {
      if (showAlert) showAlert('error', '발송 실패', e?.message);
      else alert(e?.message);
    }
  };

  // 코드 복사
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    if (showAlert) showAlert('info', '복사 완료', `청구코드 [${code}]가 클립보드에 복사되었습니다.`);
    else alert(`청구코드 [${code}] 복사 완료`);
  };

  // 통계 계산
  const pendingCount = invoices.filter(i => i.status === 'PENDING').length;
  const waitingCashCount = invoices.filter(i => i.status === 'WAITING_CASH').length;
  const paidCount = invoices.filter(i => i.status === 'PAID').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-y-auto p-6 md:p-8">
      {/* 상단 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <CreditCard size={22} />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">개인결제 청구 관리</h1>
          </div>
          <p className="text-sm font-bold text-slate-500">
            고객 맞춤형 결제 청구서 생성 및 수납(카드/무통장) 내역을 관리합니다.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={18} />
          <span>신규 개인결제 생성</span>
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <div className="text-xs font-bold text-slate-400 mb-1">전체 청구</div>
          <div className="text-2xl font-black text-slate-900">{total}건</div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-sm">
          <div className="text-xs font-bold text-amber-500 mb-1">결제 대기</div>
          <div className="text-2xl font-black text-amber-600">{pendingCount}건</div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-orange-100 shadow-sm">
          <div className="text-xs font-bold text-orange-500 mb-1">입금 확인 대기</div>
          <div className="text-2xl font-black text-orange-600">{waitingCashCount}건</div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm">
          <div className="text-xs font-bold text-emerald-500 mb-1">결제 완료</div>
          <div className="text-2xl font-black text-emerald-600">{paidCount}건</div>
        </div>
      </div>

      {/* 검색 & 필터 바 */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* 필터 탭 */}
        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-slate-50 rounded-2xl">
          {[
            { id: 'all', label: '전체' },
            { id: 'PENDING', label: '결제대기' },
            { id: 'WAITING_CASH', label: '입금확인대기' },
            { id: 'PAID', label: '결제완료' },
            { id: 'CANCELLED', label: '취소' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 검색 폼 */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <input
              type="text"
              placeholder="고객명, 연락처, 항목명, 청구코드..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
          >
            검색
          </button>
          <button
            type="button"
            onClick={() => loadData(page, statusFilter, searchTerm)}
            className="p-2.5 border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer"
            title="새로고침"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </form>
      </div>

      {/* 테이블 목록 */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black uppercase tracking-widest text-[10px]">
              <tr>
                <th className="py-4 px-6">청구코드</th>
                <th className="py-4 px-4">고객정보</th>
                <th className="py-4 px-4">청구항목</th>
                <th className="py-4 px-4">청구금액</th>
                <th className="py-4 px-4">상태</th>
                <th className="py-4 px-4">결제정보</th>
                <th className="py-4 px-4">등록/만료일</th>
                <th className="py-4 px-6 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 font-bold">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={18} className="animate-spin text-blue-600" />
                      <span>데이터를 불러오는 중입니다...</span>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 font-bold">
                    조회된 개인결제 청구 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                invoices.map((inv: any) => {
                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
                      <Clock size={12} /> 결제대기
                    </span>
                  );
                  if (inv.status === 'WAITING_CASH') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-600 border border-orange-200">
                        <AlertCircle size={12} /> 입금확인대기
                      </span>
                    );
                  } else if (inv.status === 'PAID') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        <CheckCircle size={12} /> 결제완료
                      </span>
                    );
                  } else if (inv.status === 'CANCELLED') {
                    statusBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-400 border border-slate-200">
                        <Ban size={12} /> 취소됨
                      </span>
                    );
                  }

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* 청구코드 */}
                      <td className="py-4 px-6 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{inv.invoice_code}</span>
                          <button
                            onClick={() => handleCopyCode(inv.invoice_code)}
                            className="text-slate-400 hover:text-blue-600 cursor-pointer"
                            title="코드 복사"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </td>

                      {/* 고객정보 */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">{inv.customer_name}</div>
                        <div className="text-[11px] text-slate-500">{inv.customer_hp}</div>
                        {inv.member_id && (
                          <div className="text-[10px] text-blue-600 font-semibold">ID: {inv.member_id}</div>
                        )}
                      </td>

                      {/* 청구항목 */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800">{inv.title}</div>
                        {inv.admin_memo && (
                          <div className="text-[10px] text-slate-400 max-w-xs truncate" title={inv.admin_memo}>
                            {inv.admin_memo}
                          </div>
                        )}
                      </td>

                      {/* 청구금액 */}
                      <td className="py-4 px-4 font-black text-slate-900 text-sm">
                        {parseInt(inv.amount, 10).toLocaleString()}원
                      </td>

                      {/* 상태 */}
                      <td className="py-4 px-4">{statusBadge}</td>

                      {/* 결제정보 */}
                      <td className="py-4 px-4 text-[11px] text-slate-500">
                        {inv.status === 'PENDING' ? (
                          <span className="text-slate-400 font-semibold">결제 전 (선택 대기)</span>
                        ) : (
                          <>
                            <div className="font-semibold text-slate-700">
                              방법: {inv.pay_method === 'CASH' ? '무통장입금' : '신용카드'}
                            </div>
                            {inv.depositor_name && (
                              <div className="text-orange-600 font-bold">입금자: {inv.depositor_name}</div>
                            )}
                            {inv.paid_at && <div className="text-emerald-600 font-semibold">{inv.paid_at}</div>}
                            {inv.tid && <div className="text-[10px] text-slate-400 font-mono">TID: {inv.tid}</div>}
                          </>
                        )}
                      </td>

                      {/* 등록/만료일 */}
                      <td className="py-4 px-4 text-[11px] text-slate-400">
                        <div>등록: {inv.created_at ? inv.created_at.substring(0, 10) : '-'}</div>
                        <div>만료: {inv.expires_at ? inv.expires_at.substring(0, 10) : '-'}</div>
                      </td>

                      {/* 관리 버튼 */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.status === 'WAITING_CASH' && (
                            <button
                              onClick={() => handleConfirmCash(inv.invoice_code, inv.customer_name, parseInt(inv.amount, 10))}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              <Check size={12} />
                              <span>입금확인</span>
                            </button>
                          )}
                          {inv.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleResendSms(inv.invoice_code)}
                                className="px-2.5 py-1.5 bg-slate-100 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="SMS 재발송"
                              >
                                <Send size={12} />
                                <span>SMS</span>
                              </button>
                              <button
                                onClick={() => handleCancel(inv.invoice_code, inv.customer_name)}
                                className="px-2.5 py-1.5 bg-slate-100 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                title="청구 취소"
                              >
                                취소
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 팝업 모달: 신규 개인결제 청구 생성 */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* 모달 헤더 */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                  <Plus size={18} />
                </div>
                <h3 className="text-lg font-black text-slate-900">신규 개인결제 청구 등록</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* 모달 폼 */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    고객 이름 <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsMemberSearchOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <Search size={13} />
                    <span>회원 검색하여 자동 채우기</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="예: 홍길동"
                  value={createForm.customer_name}
                  onChange={e => setCreateForm({ ...createForm, customer_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  휴대폰 번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="예: 010-1234-5678"
                  value={createForm.customer_hp}
                  onChange={e => setCreateForm({ ...createForm, customer_hp: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  회원 아이디 <span className="text-slate-400 font-normal">(선택 - 마이페이지 연동용)</span>
                </label>
                <input
                  type="text"
                  placeholder="회원 아이디가 있으면 입력 (없으면 비워둠)"
                  value={createForm.member_id}
                  onChange={e => setCreateForm({ ...createForm, member_id: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  결제 항목명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 견사호 등록 추가 수수료, 훈련사 자격 심사비"
                  value={createForm.title}
                  onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    청구 금액 (원) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    step="100"
                    placeholder="예: 150000"
                    value={createForm.amount}
                    onChange={e => setCreateForm({ ...createForm, amount: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    만료 기한 (일수)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={createForm.expire_days}
                    onChange={e => setCreateForm({ ...createForm, expire_days: parseInt(e.target.value, 10) || 7 })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  관리자 메모 <span className="text-slate-400 font-normal">(고객에게 노출되지 않음)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="특이사항이나 비고 입력"
                  value={createForm.admin_memo}
                  onChange={e => setCreateForm({ ...createForm, admin_memo: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3">
                <input
                  type="checkbox"
                  id="send_sms_checkbox"
                  checked={createForm.send_sms}
                  onChange={e => setCreateForm({ ...createForm, send_sms: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="send_sms_checkbox" className="text-xs font-bold text-blue-900 cursor-pointer">
                  등록 즉시 고객 휴대폰으로 알리고 안내 SMS 발송
                </label>
              </div>

              {/* 제출 버튼 */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>등록 중...</span>
                    </>
                  ) : (
                    <span>청구서 발행하기</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 회원 검색 모달 (이름/아이디/휴대폰으로 검색 → 3개 필드 자동 입력) */}
      {isMemberSearchOpen && (
        <PersonSearchModal
          isOpen={isMemberSearchOpen}
          onClose={() => setIsMemberSearchOpen(false)}
          onSelectPerson={handleSelectMember}
          title="개인결제 대상 회원 검색"
          initialQuery={createForm.customer_name || createForm.member_id || ''}
        />
      )}
    </div>
  );
};
