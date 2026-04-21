import React from 'react';
import { Search, Loader2 } from 'lucide-react';
import { usePublicForm } from './usePublicForm';
import { FormShell } from './FormShell';

export const DogShowForm: React.FC<{ competition: any, onClose: () => void, showAlert: (t: string, m: string) => void }> = ({
    competition, onClose, showAlert
}) => {
    const { 
        formData, isSubmitting, isSearching, handleInputChange, handleSearchMember, handleSave,
        eventOptions, selectedOptionIds, totalAmount, handleOptionToggle
    } = usePublicForm(
        competition, 'dogshow_applicant', onClose, showAlert
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
            <div className="grid grid-cols-1 gap-8">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">성함 *</label>
                    <input name="name" value={formData.name} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-inner" placeholder="신청자 성함을 입력하세요" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">연락처</label>
                        <input name="contact" value={formData.contact} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-inner" placeholder="010-0000-0000" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">혈통서 등록번호</label>
                        <div className="flex gap-2">
                            <input name="pedigree_number" value={formData.pedigree_number} onChange={handleInputChange} className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none transition-all shadow-inner uppercase font-mono" placeholder="KCC-CC-000000" />
                                <button
                                    type="button"
                                    onClick={handleSearchMember}
                                    disabled={isSearching}
                                    className="px-6 bg-slate-900 !text-white rounded-2xl font-bold text-xs hover:bg-black transition-all flex items-center gap-2"
                                >
                                    {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                                    조회
                                </button>
                        </div>
                    </div>
                </div>
            </div>
        </FormShell>
    );
};
