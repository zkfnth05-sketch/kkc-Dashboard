import React from 'react';
import { X, Loader2, Check, Info } from 'lucide-react';

interface FormShellProps {
    title: string;
    category: string;
    onClose: () => void;
    onSave: () => void;
    isSubmitting: boolean;
    children: React.ReactNode;
    options?: any[];
    selectedOptionIds?: Set<string>;
    onOptionToggle?: (id: string | number) => void;
    totalAmount?: number;
    paymentMethod?: 'card' | 'bank';
    setPaymentMethod?: (method: 'card' | 'bank') => void;
}

export const FormShell: React.FC<FormShellProps> = ({
    title,
    category,
    onClose,
    onSave,
    isSubmitting,
    children,
    options = [],
    selectedOptionIds = new Set(),
    onOptionToggle,
    totalAmount = 0,
    paymentMethod,
    setPaymentMethod
}) => {
    return (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 lg:p-10 font-sans">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative bg-white w-full max-w-3xl max-h-[90vh] rounded-[48px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                {/* Modal Header */}
                <div className="px-6 md:px-8 py-5 md:py-6 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <span className="px-3 py-1 bg-teal-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider">{category}</span>
                            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">신청하기</h2>
                        </div>
                        <p className="text-xs font-bold text-slate-500 tracking-tight line-clamp-1">{title}</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 rounded-2xl transition-all shadow-sm shrink-0">
                        <X size={20} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-6" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100 flex gap-3 items-center">
                        <Info className="text-teal-600 shrink-0" size={18} />
                        <p className="text-xs font-bold text-teal-950 leading-relaxed">
                            신청자 정보를 입력한 후 아래로 스크롤하여 <span className="text-teal-700 font-extrabold">[출전견 등록번호]</span> 및 결제 정보를 확인해 주세요.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {children}
                    </div>

                    {/* 💳 [PAYMENT SECTION] */}
                    {totalAmount > 0 && (
                        <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                            <div className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                <span className="text-xs font-bold text-slate-600">결제 예정 금액</span>
                                <span className="text-lg md:text-xl font-black text-teal-600">{totalAmount.toLocaleString()}원</span>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 block">결제 방식 선택</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod?.('card')}
                                        className={`py-3 px-4 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                            paymentMethod === 'card'
                                            ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        💳 신용카드
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod?.('bank')}
                                        className={`py-3 px-4 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                                            paymentMethod === 'bank'
                                            ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        🏦 무통장 입금
                                    </button>
                                </div>
                            </div>
                            {paymentMethod === 'bank' && (
                                <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100/50 text-xs font-bold text-blue-900/80 leading-relaxed">
                                    📌 KEB하나은행 222-910031-29404 (사단법인 한국애견협회)<br/>
                                    신청 완료 후 위 계좌로 참가비를 입금해 주셔야 최종 접수가 완료됩니다.
                                </div>
                            )}
                            {paymentMethod === 'card' && (
                                <div className="bg-orange-50/70 p-3.5 rounded-xl border border-orange-100/50 text-xs font-bold text-orange-950/80 leading-relaxed">
                                    📌 [최종 신청 완료] 버튼 클릭 시 PG 결제 팝업창이 표시되며 결제 완료 즉시 접수 처리됩니다.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 md:px-8 py-4 md:py-5 bg-slate-50/80 border-t border-slate-100 flex gap-3 shrink-0">
                    <button onClick={onClose} className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs md:text-sm font-black uppercase tracking-wider hover:bg-slate-100 transition-all">
                        취소하기
                    </button>
                    <button
                        onClick={onSave}
                        disabled={isSubmitting}
                        className="flex-[2] py-3.5 bg-teal-600 !text-white rounded-2xl text-xs md:text-sm font-black uppercase tracking-wider shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                        {isSubmitting ? '처리 중...' : '최종 신청 완료'}
                    </button>
                </div>
            </div>

            <style>{`
                .custom-scrollbar {
                    scrollbar-width: thin;
                    scrollbar-color: #0d9488 #f1f5f9;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    display: block;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #0d9488;
                    border-radius: 8px;
                    border: 2px solid #f1f5f9;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
};
