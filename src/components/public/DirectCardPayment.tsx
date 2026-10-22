import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard, User, Phone, DollarSign, FileText, ShieldCheck,
  Lock, KeyRound, Zap, CheckCircle2, Info, ArrowRight, ArrowLeft, BadgeCheck, Sparkles
} from 'lucide-react';
import { registerPgTransaction } from '../../services/memberService';
import { PaymentLayerModal } from '../common/PaymentLayerModal';

/**
 * 파일명: DirectCardPayment.tsx
 * 기능: (사)한국애견협회 온라인 카드결제 (KG모빌리언스)
 *  - 토스(Toss) / 스트라이프(Stripe) 스타일 모던 핀테크 UI
 *  - ⚠️ 워드프레스 테마 간섭 방지: h1/h2 태그 사용 금지 (p/div + 인라인 스타일 강제)
 *  - 📱 모바일 100% 최적화 (iOS 자동 확대 방지: input font-size 16px 이상)
 */

interface DirectCardPaymentProps {
  onBackToHome?: () => void;
}

type PayMode = 'MEMBER' | 'GUEST';

// 💳 표준 금액 빠른 선택 (이 6종 외 다른 버튼은 존재하지 않음)
const QUICK_AMOUNTS = [
  { label: '1만원', val: 10000 },
  { label: '3만원', val: 30000 },
  { label: '5만원', val: 50000 },
  { label: '10만원', val: 100000 },
  { label: '30만원', val: 300000 },
  { label: '50만원', val: 500000 }
];

// 🛡️ 워드프레스 테마(h1/h2 40px+ 강제 확대) 간섭을 원천 차단하는 인라인 타이틀 스타일
const TITLE_STYLE: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 800,
  lineHeight: 1.3,
  letterSpacing: '-0.02em',
  color: '#0f172a',
  margin: 0
};

const SUBTITLE_STYLE: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  lineHeight: 1.55,
  color: '#64748b',
  margin: 0
};

// 📱 iOS 자동 확대(Auto-zoom) 방지: 모바일에서 16px 이상 유지
const INPUT_CLASS =
  'w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-base md:text-sm font-bold text-slate-900 placeholder:text-slate-300 placeholder:font-medium outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10';

const INPUT_LOCKED_CLASS =
  'w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-base md:text-sm font-bold text-slate-500 outline-none cursor-not-allowed';

const LABEL_CLASS = 'flex items-center gap-1.5 text-[12px] font-black text-slate-600 mb-2 tracking-tight';

export const DirectCardPayment: React.FC<DirectCardPaymentProps> = ({ onBackToHome }) => {
  // ===== 세션 회원 정보 =====
  const [portalUser, setPortalUser] = useState<any>(null);
  const [mode, setMode] = useState<PayMode>('MEMBER');

  // ===== 입력 상태 =====
  const [memberId, setMemberId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerHp, setCustomerHp] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>(''); // 기본값: 빈 값 (직접 입력 유도)

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentState, setPaymentState] = useState<{ isOpen: boolean; payUrl: string | null }>({
    isOpen: false,
    payUrl: null
  });

  // 🔐 세션스토리지 회원 정보 로드
  useEffect(() => {
    try {
      const savedUser = sessionStorage.getItem('kkf_portal_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setPortalUser(u);
        if (u.id || u.mid) setMemberId(u.id || u.mid);
        if (u.name) setCustomerName(u.name);
        if (u.hp) setCustomerHp(u.hp);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const isMemberLoggedIn = !!portalUser;

  // 회원 정보 표시용 파생 값
  const displayName = portalUser?.name || customerName || '';
  const displayId = portalUser?.id || portalUser?.mid || memberId || '';
  const displayHp = portalUser?.hp || customerHp || '';
  const displayRank =
    portalUser?.rank || portalUser?.grade || portalUser?.level || portalUser?.mem_grade || portalUser?.degree || '';

  // 모드 전환 시 폼 초기화 (회원 모드에서는 세션 정보 복원)
  const handleModeChange = (next: PayMode) => {
    if (next === mode) return;
    setMode(next);
    setTitle('');
    setAmount('');
    if (next === 'MEMBER' && portalUser) {
      setMemberId(portalUser.id || portalUser.mid || '');
      setCustomerName(portalUser.name || '');
      setCustomerHp(portalUser.hp || '');
    } else if (next === 'GUEST') {
      setMemberId('');
      setCustomerName('');
      setCustomerHp('');
    }
  };

  // 🔑 마이페이지 로그인 이동 (결제 페이지로 복귀 redirect 포함)
  const goToPortalLogin = () => {
    // 🛡️ URL 파라미터가 제거/변조되어도 복귀 목적지가 유실되지 않도록 세션스토리지에 백업
    try {
      sessionStorage.setItem('kkf_portal_redirect', 'direct_payment');
    } catch (e) {
      console.error('redirect sessionStorage save failed:', e);
    }
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'portal_login');
    url.searchParams.set('redirect', 'direct_payment');
    window.location.href = url.href;
  };

  // ← 마이페이지(포털)로 돌아가기 (모바일 상단 뒤로가기 링크)
  const goBackToMyPage = () => {
    if (onBackToHome) {
      onBackToHome();
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'portal');
    window.location.href = url.href;
  };

  const handleAmountSelect = (val: number) => {
    setAmount(val);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();

    // 회원 모드인데 로그인이 안 되어 있으면 결제 진행 불가
    if (mode === 'MEMBER' && !isMemberLoggedIn) {
      alert('마이페이지 로그인 후 결제하실 수 있습니다.');
      return;
    }

    if (!customerName.trim()) {
      alert('성명을 입력해 주세요.');
      return;
    }
    const cleanHp = customerHp.replace(/[^0-9]/g, '');
    if (!cleanHp || cleanHp.length < 9) {
      alert('올바른 휴대폰번호를 입력해 주세요.');
      return;
    }
    if (!title.trim()) {
      alert('결제 내용(항목명)을 입력해 주세요.');
      return;
    }
    // ✅ 최소 결제 금액 100원 (직접 입력한 100원도 정상 통과)
    const finalAmount = Number(amount);
    if (!finalAmount || finalAmount < 100) {
      alert('결제 금액은 최소 100원 이상이어야 합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 고유 인보이스 코드 생성: INV-YYYYMMDD-랜덤
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randStr = Math.random().toString(36).substring(2, 7).toUpperCase();
      const invoiceCode = `INV-${dateStr}-${randStr}`;

      const res = await registerPgTransaction(
        'custom_invoice',
        {
          invoice_code: invoiceCode,
          amount: finalAmount,
          title: title.trim(),
          name: customerName.trim(),
          customer_name: customerName.trim(),
          customer_hp: cleanHp,
          hp: cleanHp,
          handler_id: memberId.trim(),
          member_id: memberId.trim(),
          // 🏷️ 회원/비회원 구분값 (마이페이지 영수증 보관함 노출 제어용)
          pay_mode: mode === 'MEMBER' ? 'member' : 'guest',
          is_member: mode === 'MEMBER' ? 'Y' : 'N'
        },
        undefined,
        title.trim()
      );

      if (res && res.pay_url) {
        setPaymentState({ isOpen: true, payUrl: res.pay_url });
      } else {
        alert(res?.error || '결제창을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } catch (err: any) {
      console.error('PG Error:', err);
      alert('결제 요청 중 오류가 발생했습니다: ' + (err.message || ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    if (mode === 'MEMBER') {
      alert('✅ 카드 결제가 성공적으로 완료되었습니다!\n마이페이지에 영수증이 안전하게 보관되었습니다.');
    } else {
      alert('✅ 카드 결제가 성공적으로 완료되었습니다!');
    }
    setPaymentState({ isOpen: false, payUrl: null });
    setTitle('');
    setAmount('');
  };

  // 회원 모드에서 로그인 상태일 때만 입력 잠금
  const isLocked = mode === 'MEMBER' && isMemberLoggedIn;

  const amountLabel = useMemo(
    () => (amount === '' ? '' : Number(amount).toLocaleString()),
    [amount]
  );

  // 💳 금액 빠른 선택 버튼 (QUICK_AMOUNTS 6종만 렌더 / 모바일 3열 그리드, 44px+ 터치 타겟)
  const renderQuickAmounts = () => (
    <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2 mt-3">
      {QUICK_AMOUNTS.map((item) => {
        const active = amount === item.val;
        return (
          <button
            key={item.val}
            type="button"
            onClick={() => handleAmountSelect(item.val)}
            className={`py-2.5 sm:py-2 px-2 sm:px-3.5 rounded-full text-[13px] sm:text-[13px] font-bold text-center transition-all cursor-pointer border ${
              active
                ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-300/50'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f8fa] py-4 sm:py-10 px-3 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-xl mx-auto">
        {/* ← 마이페이지로 돌아가기 + 보안 뱃지 (슬림 헤더) */}
        <div className="mb-4 sm:mb-5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={goBackToMyPage}
            className="inline-flex items-center gap-1.5 py-2 pr-2 text-[13px] font-bold text-slate-500 hover:text-slate-900 active:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            마이페이지로 돌아가기
          </button>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-black text-slate-500 shadow-sm whitespace-nowrap">
              <ShieldCheck size={11} className="text-emerald-500" />
              KG모빌리언스 공인 안전결제
            </span>
            <span className="hidden xs:inline-flex sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-black text-slate-500 shadow-sm whitespace-nowrap">
              <Lock size={10} className="text-blue-500" />
              256-bit SSL 암호화
            </span>
          </div>
        </div>

        {/* 🧭 세그먼트 탭 (토스 스타일 알약 탭) */}
        <div className="bg-slate-100/80 p-1 rounded-2xl mb-4 sm:mb-5 grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => handleModeChange('MEMBER')}
            className={`flex items-center justify-center gap-1.5 py-2.5 sm:py-3 rounded-xl text-[13px] sm:text-sm font-black transition-all cursor-pointer ${
              mode === 'MEMBER'
                ? 'bg-white shadow-sm text-slate-900'
                : 'bg-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <User size={15} className="shrink-0" />
            회원 로그인 결제
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('GUEST')}
            className={`flex items-center justify-center gap-1.5 py-2.5 sm:py-3 rounded-xl text-[13px] sm:text-sm font-black transition-all cursor-pointer ${
              mode === 'GUEST'
                ? 'bg-white shadow-sm text-slate-900'
                : 'bg-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Zap size={15} className="shrink-0" />
            비회원 바로 결제
          </button>
        </div>

        {/* ================= 👤 회원 로그인 결제 모드 ================= */}
        {mode === 'MEMBER' && (
          <>
            {isMemberLoggedIn ? (
              /* ✅ 로그인 완료 : 인증 요약 바 + 결제 폼 */
              <div className="bg-white rounded-3xl p-4 sm:p-7 shadow-[0_8px_30px_rgba(15,23,42,0.06)] border border-slate-100">
                {/* 인증 완료 뱃지 */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-black text-emerald-700">
                    <BadgeCheck size={13} />
                    회원 인증 완료
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-500">
                    <Lock size={10} /> 정보 잠금
                  </span>
                </div>

                {/* 회원 정보 요약 바 */}
                <div className="rounded-2xl bg-slate-50/80 border border-slate-100 p-3.5 sm:p-4 mb-5">
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-[12px] sm:text-[13px]">
                    <div className="min-w-0">
                      <dt className="font-bold text-slate-400 mb-0.5">성명</dt>
                      <dd className="font-black text-slate-900 break-all">{displayName || '-'}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="font-bold text-slate-400 mb-0.5">회원ID</dt>
                      <dd className="font-black text-slate-900 break-all">{displayId || '-'}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="font-bold text-slate-400 mb-0.5">연락처</dt>
                      <dd className="font-black text-slate-900 font-mono break-all">{displayHp || '-'}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="font-bold text-slate-400 mb-0.5">등급/직능</dt>
                      <dd className="font-black text-slate-900 break-all">{displayRank || '-'}</dd>
                    </div>
                  </dl>
                </div>

                <form onSubmit={handlePay} className="space-y-4 sm:space-y-5">
                  {/* 잠금된 회원 정보 (읽기 전용) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className={LABEL_CLASS}>
                        <User size={14} className="text-slate-400" />
                        성명
                        <Lock size={10} className="text-slate-300" />
                      </label>
                      <input type="text" readOnly value={customerName} className={INPUT_LOCKED_CLASS} />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>
                        <Phone size={14} className="text-slate-400" />
                        연락처
                        <Lock size={10} className="text-slate-300" />
                      </label>
                      <input type="tel" readOnly value={customerHp} className={INPUT_LOCKED_CLASS} />
                    </div>
                  </div>

                  <div>
                    <label className={LABEL_CLASS}>
                      <User size={14} className="text-slate-400" />
                      회원 아이디
                      <Lock size={10} className="text-slate-300" />
                    </label>
                    <input type="text" readOnly value={memberId} className={INPUT_LOCKED_CLASS} />
                  </div>

                  {/* 결제 내용 */}
                  <div>
                    <label className={LABEL_CLASS}>
                      <FileText size={14} className="text-blue-500" />
                      결제 내용 (항목명) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="예: 혈통서 발급비, 훈련 심사비, 연회비 등"
                      className={INPUT_CLASS}
                    />
                  </div>

                  {/* 결제 금액 */}
                  <div>
                    <label className={LABEL_CLASS}>
                      <DollarSign size={14} className="text-blue-500" />
                      결제 금액 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        value={amountLabel}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/[^0-9]/g, '');
                          setAmount(clean === '' ? '' : parseInt(clean, 10));
                        }}
                        placeholder="금액을 입력해 주세요"
                        className="w-full px-4 py-3.5 pr-11 rounded-2xl border border-slate-200 bg-white text-xl md:text-2xl font-black text-slate-900 placeholder:text-slate-300 placeholder:text-base placeholder:font-medium outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-right"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">원</span>
                    </div>

                    {renderQuickAmounts()}
                  </div>

                  {/* 안내 문구 */}
                  <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start gap-2.5">
                    <CheckCircle2 size={17} className="text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[11.5px] font-bold text-blue-900/80 leading-relaxed break-keep">
                      결제 완료 즉시 마이페이지의 '나의 결제 내역 및 영수증'에 자동 저장됩니다.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-2xl font-black text-[15px] shadow-lg shadow-slate-300/60 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none"
                  >
                    <CreditCard size={18} className="shrink-0" />
                    {amount ? `${Number(amount).toLocaleString()}원 카드 결제하기` : '카드 결제하기'}
                  </button>
                </form>
              </div>
            ) : (
              /* 🔒 로그인 필요 : 단일 미니멀 카드 */
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgba(15,23,42,0.06)] border border-slate-100 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 mb-4">
                  <Lock size={22} />
                </div>
                <p style={TITLE_STYLE} className="break-keep">마이페이지 로그인이 필요합니다</p>
                <p style={SUBTITLE_STYLE} className="mt-2 break-keep">
                  회원 계정으로 결제하시면 영수증이 마이페이지에 영구 보관되어
                  언제든지 다시 열람·인쇄하실 수 있습니다.
                </p>

                <button
                  type="button"
                  onClick={goToPortalLogin}
                  className="mt-5 w-full py-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-2xl font-black text-[15px] shadow-lg shadow-slate-300/60 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <KeyRound size={17} className="shrink-0" />
                  마이페이지 로그인하기
                  <ArrowRight size={17} className="shrink-0" />
                </button>

                <p className="mt-4 text-[11.5px] font-bold text-slate-400 leading-relaxed break-keep">
                  로그인 없이 바로 결제하시려면 상단의{' '}
                  <span className="text-slate-700 font-black">[비회원 바로 결제]</span> 탭을 선택해 주세요.
                </p>
              </div>
            )}
          </>
        )}

        {/* ================= ⚡ 비회원 바로 결제 모드 ================= */}
        {mode === 'GUEST' && (
          <div className="bg-white rounded-3xl p-4 sm:p-7 shadow-[0_8px_30px_rgba(15,23,42,0.06)] border border-slate-100">
            {/* 비회원 안내 배지 */}
            <div className="mb-5 p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-start gap-2.5">
              <Info size={17} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11.5px] font-bold text-amber-900/80 leading-relaxed break-keep">
                비회원 결제 건은 마이페이지 영수증 보관함이 지원되지 않습니다.
              </p>
            </div>

            <form onSubmit={handlePay} className="space-y-4 sm:space-y-5">
              {/* 회원 ID (선택) */}
              <div>
                <label className={LABEL_CLASS}>
                  <User size={14} className="text-slate-400" />
                  회원 아이디 <span className="text-slate-400 font-medium">(선택)</span>
                </label>
                <input
                  type="text"
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  placeholder="협회 회원 아이디가 있으시면 입력해 주세요"
                  className={INPUT_CLASS}
                />
              </div>

              {/* 고객 성명 (필수) */}
              <div>
                <label className={LABEL_CLASS}>
                  <User size={14} className="text-blue-500" />
                  성명 (이름) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="결제자 성함을 입력해 주세요"
                  className={INPUT_CLASS}
                />
              </div>

              {/* 휴대폰 번호 (필수) */}
              <div>
                <label className={LABEL_CLASS}>
                  <Phone size={14} className="text-blue-500" />
                  연락처 (휴대폰) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  required
                  value={customerHp}
                  onChange={(e) => setCustomerHp(e.target.value)}
                  placeholder="숫자만 입력 (예: 01012345678)"
                  className={INPUT_CLASS}
                />
              </div>

              {/* 결제 내용 (필수) */}
              <div>
                <label className={LABEL_CLASS}>
                  <FileText size={14} className="text-blue-500" />
                  결제 내용 (항목명) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 혈통서 발급비, 훈련 심사비, 연회비 등"
                  className={INPUT_CLASS}
                />
              </div>

              {/* 결제 금액 (필수) */}
              <div>
                <label className={LABEL_CLASS}>
                  <DollarSign size={14} className="text-blue-500" />
                  결제 금액 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={amountLabel}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/[^0-9]/g, '');
                      setAmount(clean === '' ? '' : parseInt(clean, 10));
                    }}
                    placeholder="금액을 입력해 주세요"
                    className="w-full px-4 py-3.5 pr-11 rounded-2xl border border-slate-200 bg-white text-xl md:text-2xl font-black text-slate-900 placeholder:text-slate-300 placeholder:text-base placeholder:font-medium outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-right"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">원</span>
                </div>

                {renderQuickAmounts()}
              </div>

              {/* 안내 배너 */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-2.5">
                <ShieldCheck size={17} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11.5px] text-slate-600 space-y-1">
                  <p className="font-black text-slate-800">KG모빌리언스 안전 결제 시스템</p>
                  <p className="font-bold break-keep">결제 완료 시 관리자 시스템에 실시간으로 결제 완료 내역이 안전하게 접수됩니다.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-2xl font-black text-[15px] shadow-lg shadow-slate-300/60 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none"
              >
                <CreditCard size={18} className="shrink-0" />
                {amount ? `${Number(amount).toLocaleString()}원 카드 결제하기` : '카드 결제하기'}
              </button>
            </form>
          </div>
        )}

        {/* 하단 보안 푸터 */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[10.5px] font-bold text-slate-400">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck size={11} className="text-emerald-500" />
            KG모빌리언스 공인 안전결제
          </span>
          <span className="text-slate-300">|</span>
          <span className="inline-flex items-center gap-1">
            <Lock size={10} className="text-blue-500" />
            256-bit SSL 암호화
          </span>
          <span className="text-slate-300">|</span>
          <span className="inline-flex items-center gap-1">
            <Sparkles size={10} className="text-amber-500" />
            (사)한국애견협회
          </span>
        </div>
      </div>

      {/* KG모빌리언스 결제 레이어 모달 */}
      <PaymentLayerModal
        isOpen={paymentState.isOpen}
        payUrl={paymentState.payUrl}
        title="한국애견협회 온라인 카드결제"
        onClose={() => setPaymentState({ isOpen: false, payUrl: null })}
        onSuccess={handlePaymentSuccess}
        onFail={(msg) => {
          alert(msg || '결제에 실패하였습니다.');
          setPaymentState({ isOpen: false, payUrl: null });
        }}
      />
    </div>
  );
};

export default DirectCardPayment;
