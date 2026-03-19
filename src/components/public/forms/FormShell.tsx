import React from 'react';
import { X, Loader2, Check, Info } from 'lucide-react';

interface FormShellProps {
    title: string;
    category: string;
    onClose: () => void;
    onSave: () => void;
    isSubmitting: boolean;
    children: React.ReactNode;
}

export const FormShell: React.FC<FormShellProps> = ({
    title,
    category,
    onClose,
    onSave,
    isSubmitting,
    children
}) => {
    return (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 lg:p-10 font-sans">
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />

            <div className="relative bg-white w-full max-w-3xl max-h-[90vh] rounded-[48px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
                {/* Modal Header */}
                <div className="px-12 py-10 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-teal-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest">{category}</span>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">신청하기</h2>
                        </div>
                        <p className="text-xs font-bold text-slate-400 tracking-tight">{title}</p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 rounded-2xl transition-all shadow-sm">
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                    <div className="mb-10 p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50 flex gap-4 items-start">
                        <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="text-sm font-bold text-blue-900 mb-1">입력 안내</p>
                            <p className="text-xs font-medium text-blue-700/80 leading-relaxed">
                                별표(*) 표시가 된 항목은 필수 입력 사항입니다. 조회 기능을 이용하시면 회원 정보를 자동으로 불러올 수 있습니다.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-10">
                        {children}
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-12 py-10 bg-slate-50/50 border-t border-slate-100 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-3xl text-sm font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                        취소하기
                    </button>
                    <button
                        onClick={onSave}
                        disabled={isSubmitting}
                        className="flex-[2] py-5 bg-teal-500 !text-white rounded-3xl text-sm font-black uppercase tracking-widest shadow-xl shadow-teal-500/20 hover:bg-teal-600 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                        {isSubmitting ? '처리 중...' : '최종 신청 완료'}
                    </button>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
};
