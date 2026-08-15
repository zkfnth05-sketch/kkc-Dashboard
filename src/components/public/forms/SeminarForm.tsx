import React from 'react';
import { Search, Loader2 } from 'lucide-react';
import { usePublicForm } from './usePublicForm';
import { FormShell } from './FormShell';

export const SeminarForm: React.FC<{ competition: any, onClose: () => void, showAlert: (t: string, m: string) => void }> = ({
    competition, onClose, showAlert
}) => {
    const { 
        applicantInfo, handleApplicantChange, handleSearchMember, isSearching,
        isSubmitting, handleSave,
        eventOptions, selectedOptionIds, totalAmount, handleOptionToggle,
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
            options={eventOptions}
            selectedOptionIds={selectedOptionIds}
            onOptionToggle={handleOptionToggle}
            totalAmount={totalAmount}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">회원 ID 조회</label>
                    <div className="flex gap-2">
                        <input name="handler_id" value={applicantInfo.handler_id} onChange={handleApplicantChange} className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="ID 입력" />
                        <button type="button" onClick={handleSearchMember} disabled={isSearching} className="px-4 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700 transition-all flex items-center gap-1.5">
                            {isSearching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />} 조회
                        </button>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">이름 *</label>
                    <input name="name" value={applicantInfo.name} onChange={handleApplicantChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="이름" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">연락처 *</label>
                    <input name="contact" value={applicantInfo.contact} onChange={handleApplicantChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="010-0000-0000" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">생년월일</label>
                    <input name="birthdate" value={applicantInfo.birthdate} onChange={handleApplicantChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="YYYY-MM-DD" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">이메일</label>
                    <input name="email" value={applicantInfo.email} onChange={handleApplicantChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="example@email.com" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">소속 (직업)</label>
                    <input name="affiliation" value={applicantInfo.affiliation} onChange={handleApplicantChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="소속기관 입력" />
                </div>
            </div>
        </FormShell>
    );
};
