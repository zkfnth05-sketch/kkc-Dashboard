import React from 'react';
import { Search, Loader2, Plus, Trash2 } from 'lucide-react';
import { usePublicForm } from './usePublicForm';
import { FormShell } from './FormShell';

export const DogShowForm: React.FC<{ competition: any, onClose: () => void, showAlert: (t: string, m: string) => void }> = ({
    competition, onClose, showAlert
}) => {
    const { 
        applicantInfo, handleApplicantChange,
        entries, addEntry, removeEntry, updateEntry, handleSearchDogForEntry,
        isSubmitting, isSearching, handleSave,
        eventOptions, selectedOptionIds, totalAmount, handleOptionToggle,
        paymentMethod, setPaymentMethod
    } = usePublicForm(
        competition, 'dogshow_applicant', onClose, showAlert
    );

    return (
        <FormShell 
            title={competition.title} 
            category={competition.category || '도그쇼 / 전람회'} 
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
            <div className="space-y-5">
                {/* 1. 신청자 기본 정보 */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                        <div className="w-1.5 h-3.5 bg-teal-500 rounded-full" />
                        신청자 정보
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600">성함 *</label>
                            <input 
                                name="name" 
                                value={applicantInfo.name} 
                                onChange={handleApplicantChange} 
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs md:text-sm" 
                                placeholder="신청자 성함" 
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600">연락처 *</label>
                            <input 
                                name="contact" 
                                value={applicantInfo.contact} 
                                onChange={handleApplicantChange} 
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs md:text-sm" 
                                placeholder="010-0000-0000" 
                            />
                        </div>
                    </div>
                </div>

                {/* 2. 출전견 목록 (Multi-Entry) */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                            <div className="w-1.5 h-3.5 bg-teal-500 rounded-full" />
                            출전견 정보 목록 ({entries.length}두)
                        </h3>
                        <button
                            type="button"
                            onClick={addEntry}
                            className="px-3.5 py-1.5 bg-teal-600 text-white font-bold text-xs rounded-xl hover:bg-teal-700 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                            <Plus size={13} /> 출전견 추가하기
                        </button>
                    </div>

                    {entries.map((entry, index) => (
                        <div key={entry.id || index} className="p-5 bg-white border-2 border-slate-200 hover:border-teal-500/50 rounded-2xl space-y-3 transition-all shadow-sm">
                            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                                <span className="px-2.5 py-0.5 bg-teal-100 text-teal-800 rounded-full text-xs font-black">
                                    출전견 {index + 1}
                                </span>
                                {entries.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeEntry(index)}
                                        className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        title="이 출전견 삭제"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-600 block">혈통서 등록번호 (조회 시 견명/견종 자동 확인) *</label>
                                <div className="flex gap-2">
                                    <input 
                                        value={entry.pedigree_number || entry.pedigree_no} 
                                        onChange={e => {
                                            updateEntry(index, 'pedigree_number', e.target.value);
                                            updateEntry(index, 'pedigree_no', e.target.value);
                                        }} 
                                        className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs md:text-sm font-mono uppercase" 
                                        placeholder="KCC-CC-000000" 
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleSearchDogForEntry(index)}
                                        disabled={isSearching}
                                        className="px-4 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-black transition-all flex items-center gap-1.5"
                                    >
                                        {isSearching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />} 조회
                                    </button>
                                </div>

                                {entry.dog_name && (
                                    <div className="p-2.5 bg-teal-50 rounded-xl border border-teal-200 flex flex-wrap gap-3 text-xs font-bold text-teal-900">
                                        <span>🐶 견명: {entry.dog_name}</span>
                                        <span>📋 견종: {entry.dog_breed || '-'}</span>
                                        <span>⚥ 성별: {entry.dog_gender || '-'}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addEntry}
                        className="w-full py-3.5 border-2 border-dashed border-slate-300 hover:border-teal-500 text-slate-600 hover:text-teal-600 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 bg-slate-50/50 hover:bg-teal-50/30"
                    >
                        <Plus size={15} /> 다른 강아지 출전 추가하기
                    </button>
                </div>
            </div>
        </FormShell>
    );
};
