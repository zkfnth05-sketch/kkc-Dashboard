import React from 'react';
import { usePublicForm } from './usePublicForm';
import { FormShell } from './FormShell';

export const SeminarForm: React.FC<{ competition: any, onClose: () => void, showAlert: (t: string, m: string) => void }> = ({
    competition, onClose, showAlert
}) => {
    const { 
        formData, isSubmitting, handleInputChange, handleSearchMember, handleSave,
        eventOptions, selectedOptionIds, totalAmount, handleOptionToggle
    } = usePublicForm(
        competition, 'seminar_applicant', onClose, showAlert
    );

    return (
        <FormShell 
            title={competition.title} 
            category={competition.category} 
            onClose={onClose} 
            onSave={handleSave} 
            isSubmitting={isSubmitting}
            options={eventOptions}
            selectedOptionIds={selectedOptionIds}
            onOptionToggle={handleOptionToggle}
            totalAmount={totalAmount}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">회원 ID 조회</label>
                    <div className="flex gap-2">
                        <input name="handler_id" value={formData.handler_id} onChange={handleInputChange} className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="ID 입력" />
                        <button type="button" onClick={handleSearchMember} className="px-4 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700">조회</button>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">이름 *</label>
                    <input name="name" value={formData.name} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="이름" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">연락처</label>
                    <input name="contact" value={formData.contact} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="010-0000-0000" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">생년월일</label>
                    <input name="birthdate" value={formData.birthdate} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="YYYY-MM-DD" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">이메일</label>
                    <input name="email" value={formData.email} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="example@email.com" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">소속 (직업)</label>
                    <input name="affiliation" value={formData.affiliation} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="소속기관 입력" />
                </div>
            </div>
        </FormShell>
    );
};
