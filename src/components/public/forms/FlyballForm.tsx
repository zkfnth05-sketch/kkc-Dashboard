import React, { useRef } from 'react';
// [STATUS: LOCKED] - This file is completed and should not be modified.
import { Search, Loader2 } from 'lucide-react';
import { usePublicForm } from './usePublicForm';
import { FormShell } from './FormShell';

export const FlyballForm: React.FC<{ competition: any, onClose: () => void, showAlert: (t: string, m: string) => void }> = ({
    competition, onClose, showAlert
}) => {
    const { formData, setFormData, isSubmitting, isSearching, handleInputChange, handleSearchMember, handleSave } = usePublicForm(
        competition, 'flyball_applicant', onClose, showAlert
    );

    return (
        <FormShell title={competition.title} category="플라이볼" onClose={onClose} onSave={handleSave} isSubmitting={isSubmitting}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">아이디 (ID) 및 정보 조회</label>
                    <div className="flex gap-2">
                        <input name="handler_id" value={formData.handler_id} onChange={handleInputChange} className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="회원 ID 입력" />
                        <button type="button" onClick={handleSearchMember} disabled={isSearching} className="px-4 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700 transition-all flex items-center gap-2">
                            {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} 조회
                        </button>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">성함 *</label>
                    <input name="name" value={formData.name} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="성함" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">연락처</label>
                    <input name="contact" value={formData.contact} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="010-0000-0000" />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">종목</label>
                    <select name="subject" value={formData.subject} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none">
                        <option value="">종목 선택</option>
                        {['개인전', '페어', '단체전'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">견종</label>
                    <input name="dog_breed" value={formData.dog_breed} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="견종" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">견명</label>
                    <input name="dog_name" value={formData.dog_name} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="견명" />
                </div>
            </div>
        </FormShell>
    );
};
