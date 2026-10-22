import React, { useEffect } from 'react';
import { Printer, X, ShieldCheck, Receipt, Building2, User, CreditCard } from 'lucide-react';

/**
 * 파일명: PaymentReceiptModal.tsx
 * 기능: (사)한국애견협회 공식 온라인 매출전표 / 전자영수증 모달
 *  - KG모빌리언스 신용카드 결제 완료 건을 영수증 형태로 표시
 *  - @media print 로 영수증 영역만 깔끔하게 인쇄
 *  - 📱 모바일(360px~) 반응형 최적화: 좁은 화면에서도 콘텐츠 영역 최대 확보
 */

interface PaymentReceiptModalProps {
  isOpen: boolean;
  invoice: any;
  onClose: () => void;
}

const SUPPLIER = {
  name: '(사)한국애견협회 (KKC)',
  bizNo: '206-82-03349',
  ceo: '박애경',
  address: '서울특별시 광진구 능동로 255 (군자동)',
  tel: '02-2265-3349'
};

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({ isOpen, invoice, onClose }) => {
  // 🖨️ 인쇄 시 body 스크롤 잠금 및 ESC 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const inv = invoice || {};

  const rawAmount = Number(String(inv.amount ?? 0).replace(/[^0-9.-]/g, '')) || 0;
  const totalAmount = rawAmount;
  const supplyAmount = Math.round(totalAmount / 1.1);
  const vatAmount = totalAmount - supplyAmount;

  const customerName = inv.customer_name || '회원';
  const customerHp = inv.customer_hp || '-';
  const memberId = inv.member_id || '-';
  const title = inv.title || '온라인 결제';
  const paidAt = inv.paid_at || '-';
  const tid = inv.tid || '-';
  const invoiceCode = inv.invoice_code || '-';

  const fmt = (n: number) => n.toLocaleString('ko-KR');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-2 sm:p-8 print:static print:block print:overflow-visible print:bg-white print:p-0 print:backdrop-blur-none">
      {/* 🖨️ 인쇄 전용 스타일 */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * { visibility: hidden !important; }
          #kkc-receipt-print-area,
          #kkc-receipt-print-area * { visibility: visible !important; }
          #kkc-receipt-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .kkc-no-print { display: none !important; }
        }
      `}</style>

      <div className="w-full max-w-2xl my-2 sm:my-4 print:my-0 print:max-w-full">
        {/* ================= 영수증 본문 (인쇄 대상) ================= */}
        <div
          id="kkc-receipt-print-area"
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print:rounded-none print:shadow-none"
        >
          {/* 상단 타이틀 바 */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 sm:px-8 py-4 sm:py-6 text-white">
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <Receipt size={18} className="text-amber-300 sm:hidden" />
                  <Receipt size={22} className="text-amber-300 hidden sm:block" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] sm:text-[11px] font-bold tracking-[0.14em] sm:tracking-[0.18em] text-amber-300/90 uppercase">KKC Official Receipt</p>
                  <h2 className="text-sm sm:text-xl font-black tracking-tight leading-snug break-keep">
                    사단법인 한국애견협회 온라인 매출전표 / 영수증
                  </h2>
                </div>
              </div>
              <div className="hidden sm:flex flex-col items-end shrink-0">
                <span className="text-[10px] font-bold tracking-widest text-slate-300">THE KOREAN KENNEL CLUB</span>
                <span className="text-[10px] font-bold tracking-widest text-slate-400">SINCE 1996</span>
              </div>
            </div>
          </div>

          {/* 승인 상태 배지 */}
          <div className="px-4 sm:px-8 pt-4 sm:pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 pb-4 border-b-2 border-dashed border-slate-200">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] sm:text-xs font-black whitespace-nowrap">
                  <ShieldCheck size={13} className="sm:hidden" />
                  <ShieldCheck size={14} className="hidden sm:block" />
                  결제완료 (정상승인)
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] sm:text-xs font-bold whitespace-nowrap">
                  <CreditCard size={12} className="sm:hidden" />
                  <CreditCard size={13} className="hidden sm:block" />
                  신용카드 (KG모빌리언스)
                </span>
              </div>
              <div className="text-left sm:text-right min-w-0">
                <p className="text-[10px] font-bold text-slate-400 tracking-wider">영수증번호</p>
                <p className="text-[11px] sm:text-xs font-black text-slate-700 font-mono break-all">{invoiceCode}</p>
              </div>
            </div>
          </div>

          {/* 공급자 / 결제자 정보 */}
          <div className="px-4 sm:px-8 py-4 sm:py-5 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 print:grid-cols-2">
            {/* 공급자 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4">
              <div className="flex items-center gap-1.5 mb-2.5 sm:mb-3">
                <Building2 size={14} className="text-slate-500" />
                <h3 className="text-[11px] font-black tracking-widest text-slate-500 uppercase">공급자 정보</h3>
              </div>
              <dl className="space-y-1.5 text-[12px] sm:text-[12.5px] leading-relaxed">
                <div className="flex gap-2">
                  <dt className="w-[68px] sm:w-[74px] shrink-0 font-bold text-slate-400">상호</dt>
                  <dd className="font-black text-slate-800 break-keep">{SUPPLIER.name}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-[68px] sm:w-[74px] shrink-0 font-bold text-slate-400">사업자번호</dt>
                  <dd className="font-bold text-slate-700 font-mono break-all">{SUPPLIER.bizNo}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-[68px] sm:w-[74px] shrink-0 font-bold text-slate-400">대표자</dt>
                  <dd className="font-bold text-slate-700">{SUPPLIER.ceo}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-[68px] sm:w-[74px] shrink-0 font-bold text-slate-400">주소</dt>
                  <dd className="font-bold text-slate-700 break-keep">{SUPPLIER.address}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-[68px] sm:w-[74px] shrink-0 font-bold text-slate-400">연락처</dt>
                  <dd className="font-bold text-slate-700 font-mono">{SUPPLIER.tel}</dd>
                </div>
              </dl>
            </div>

            {/* 결제자 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4">
              <div className="flex items-center gap-1.5 mb-2.5 sm:mb-3">
                <User size={14} className="text-slate-500" />
                <h3 className="text-[11px] font-black tracking-widest text-slate-500 uppercase">결제자 정보</h3>
              </div>
              <dl className="space-y-1.5 text-[12px] sm:text-[12.5px] leading-relaxed">
                <div className="flex gap-2">
                  <dt className="w-[68px] sm:w-[74px] shrink-0 font-bold text-slate-400">고객명</dt>
                  <dd className="font-black text-slate-800 break-keep">{customerName}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-[68px] sm:w-[74px] shrink-0 font-bold text-slate-400">연락처</dt>
                  <dd className="font-bold text-slate-700 font-mono break-all">{customerHp}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-[68px] sm:w-[74px] shrink-0 font-bold text-slate-400">회원ID</dt>
                  <dd className="font-bold text-slate-700 break-all">{memberId}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* 결제 상세 */}
          <div className="px-4 sm:px-8 pb-2">
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-xs sm:text-sm table-fixed">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <th className="w-[92px] sm:w-[130px] bg-slate-50 text-left py-2.5 sm:py-3.5 px-2 sm:px-4 font-bold text-slate-500 align-top">결제 항목</th>
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 font-black text-slate-800 break-keep">{title}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <th className="bg-slate-50 text-left py-2.5 sm:py-3.5 px-2 sm:px-4 font-bold text-slate-500 align-top">승인 일시</th>
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 font-bold text-slate-700 font-mono break-all">{paidAt}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <th className="bg-slate-50 text-left py-2.5 sm:py-3.5 px-2 sm:px-4 font-bold text-slate-500 align-top">결제 수단</th>
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 font-bold text-slate-700 break-keep">신용카드 (KG모빌리언스)</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <th className="bg-slate-50 text-left py-2.5 sm:py-3.5 px-2 sm:px-4 font-bold text-slate-500 align-top">승인 번호 (TID)</th>
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 font-bold text-slate-700 font-mono break-all">{tid}</td>
                  </tr>
                  <tr>
                    <th className="bg-slate-50 text-left py-2.5 sm:py-3.5 px-2 sm:px-4 font-bold text-slate-500 align-top">결제 상태</th>
                    <td className="py-2.5 sm:py-3.5 px-2 sm:px-4 font-black text-emerald-700 break-keep">결제완료 (정상승인)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 금액 계산 */}
          <div className="px-4 sm:px-8 py-4 sm:py-5">
            <div className="rounded-xl border-2 border-slate-900/10 bg-slate-50 p-3.5 sm:p-5">
              <div className="space-y-2 text-[12px] sm:text-[13px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-500">공급가액</span>
                  <span className="font-black text-slate-700 font-mono">{fmt(supplyAmount)} 원</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-500">부가가치세 (VAT 10%)</span>
                  <span className="font-black text-slate-700 font-mono">{fmt(vatAmount)} 원</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t-2 border-dashed border-slate-300 flex items-end justify-between gap-2">
                <span className="text-[13px] sm:text-sm font-black text-slate-900 shrink-0">총 결제금액</span>
                <span className="text-xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight text-right break-all">
                  {fmt(totalAmount)}<span className="text-sm sm:text-base font-black text-slate-500 ml-1">원</span>
                </span>
              </div>
            </div>
          </div>

          {/* 하단 안내 문구 */}
          <div className="px-4 sm:px-8 pb-5 sm:pb-6">
            <p className="text-[10px] sm:text-[11px] leading-relaxed text-slate-400 text-center break-keep">
              본 영수증은 (사)한국애견협회 온라인 결제 시스템을 통해 발급된 전자 매출전표입니다.<br className="hidden sm:block" />
              결제 관련 문의는 협회 대표번호 {SUPPLIER.tel} 로 연락 주시기 바랍니다.
            </p>
          </div>
        </div>

        {/* ================= 하단 버튼 (인쇄 제외) ================= */}
        <div className="kkc-no-print mt-3 sm:mt-4 flex flex-col sm:flex-row justify-end gap-2.5 sm:gap-3 pb-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-3.5 sm:py-3 min-h-[44px] rounded-xl bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 text-sm font-black transition-all active:scale-95 cursor-pointer"
          >
            <X size={16} />
            닫기
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-3.5 sm:py-3 min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-black shadow-lg shadow-slate-300 transition-all active:scale-95 cursor-pointer"
          >
            <Printer size={16} />
            인쇄하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceiptModal;
