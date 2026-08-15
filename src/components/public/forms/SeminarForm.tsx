import React from 'react';
import { Search, Loader2, Check } from 'lucide-react';
import { usePublicForm } from './usePublicForm';
import { FormShell } from './FormShell';

export const SeminarForm: React.FC<{ competition: any, onClose: () => void, showAlert: (t: string, m: string) => void }> = ({
    competition, onClose, showAlert
}) => {
    const { 
        applicantInfo, handleApplicantChange, handleSearchMember, isSearching,
        isSubmitting, handleSave,
        eventOptions, selectedOptionIds, totalAmount, toggleEntryOption,
        paymentMethod, setPaymentMethod
    } = usePublicForm(
        competition, 'seminar_applicant', onClose, showAlert
    );

    return (
        <FormShell 
            title={competition.title} 
            category={competition.category || '세미나'} 
            onClose={onClose} 
            onSave={handleSave} 
            isSubmitting={isSubmitting}
            totalAmount={totalAmount}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600">회원 ID 조회</label>
                        <div className="flex gap-2">
                            <input name="handler_id" value={applicantInfo.handler_id} onChange={handleApplicantChange} className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs md:text-sm" placeholder="ID 입력" />
                            <button type="button" onClick={handleSearchMember} disabled={isSearching} className="px-3.5 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700 transition-all flex items-center gap-1">
                                {isSearching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />} 조회
                            </button>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600">이름 *</label>
                        <input name="name" value={applicantInfo.name} onChange={handleApplicantChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs md:text-sm" placeholder="이름" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600">연락처 *</label>
                        <input name="contact" value={applicantInfo.contact} onChange={handleApplicantChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs md:text-sm" placeholder="010-0000-0000" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600">생년월일</label>
                        <input name="birthdate" value={applicantInfo.birthdate} onChange={handleApplicantChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs md:text-sm" placeholder="YYYY-MM-DD" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600">이메일</label>
                        <input name="email" value={applicantInfo.email} onChange={handleApplicantChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs md:text-sm" placeholder="example@email.com" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600">소속 (직업)</label>
                        <input name="affiliation" value={applicantInfo.affiliation} onChange={handleApplicantChange} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs md:text-sm" placeholder="소속기관 입력" />
                    </div>
                </div>

                {/* 💰 [SEMINAR FEE / OPTIONS SELECTION] */}
                {eventOptions.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                        <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                            <span>💰</span> 참가비 / 교육 옵션 선택 *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {eventOptions.map(opt => {
                                const idStr = String(opt.id);
                                const isSelected = selectedOptionIds.has(idStr);
                                const isRequired = opt.is_required === 1 || opt.is_required === '1';
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => toggleEntryOption(0, idStr)}
                                        className={`p-3 rounded-xl border-2 text-left transition-all flex justify-between items-center ${
                                            isSelected 
                                            ? 'bg-teal-50/90 border-teal-500 shadow-xs' 
                                            : 'bg-white border-slate-200 hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                                isSelected ? 'bg-teal-600 border-teal-600' : 'bg-white border-slate-300'
                                            }`}>
                                                {isSelected && <Check size={10} className="text-white" />}
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className={`text-xs font-bold ${isSelected ? 'text-teal-950' : 'text-slate-700'}`}>
                                                    {opt.option_name}
                                                    {isRequired && <span className="ml-1.5 px-1.5 py-0.2 bg-rose-500 text-white text-[9px] rounded font-bold">필수</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-black ${isSelected ? 'text-teal-600' : 'text-slate-600'}`}>
                                            +{Number(opt.option_price || opt.amount || 0).toLocaleString()}원
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </FormShell>
    );
};
