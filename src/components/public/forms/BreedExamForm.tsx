import React from 'react';
import { Search, Loader2, Plus, Trash2 } from 'lucide-react';
import { usePublicForm } from './usePublicForm';
import { FormShell } from './FormShell';

export const BreedExamForm: React.FC<{ competition: any, onClose: () => void, showAlert: (t: string, m: string) => void }> = ({
    competition, onClose, showAlert
}) => {
    const { 
        applicantInfo, handleApplicantChange, handleSearchMember,
        entries, addEntry, removeEntry, updateEntry, handleSearchDogForEntry,
        isSubmitting, isSearching, handleSave,
        eventOptions, selectedOptionIds, totalAmount, handleOptionToggle,
        paymentMethod, setPaymentMethod
    } = usePublicForm(
        competition, 'breed_exam_applicant', onClose, showAlert
    );

    return (
        <FormShell 
            title={competition.title} 
            category={competition.category || '종견인정검사'} 
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
            <div className="space-y-8">
                {/* 1. 신청자 기본 정보 */}
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-teal-500 rounded-full" />
                        신청자 정보
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600">회원 ID</label>
                            <div className="flex gap-2">
                                <input 
                                    name="handler_id" 
                                    value={applicantInfo.handler_id} 
                                    onChange={handleApplicantChange} 
                                    className="flex-1 p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm" 
                                    placeholder="회원 ID" 
                                />
                                <button 
                                    type="button" 
                                    onClick={handleSearchMember} 
                                    disabled={isSearching} 
                                    className="px-3 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700 transition-all flex items-center gap-1"
                                >
                                    {isSearching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />} 조회
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600">성함 *</label>
                            <input 
                                name="name" 
                                value={applicantInfo.name} 
                                onChange={handleApplicantChange} 
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm" 
                                placeholder="신청자 성함" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-600">연락처 *</label>
                            <input 
                                name="contact" 
                                value={applicantInfo.contact} 
                                onChange={handleApplicantChange} 
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm" 
                                placeholder="010-0000-0000" 
                            />
                        </div>
                    </div>
                </div>

                {/* 2. 대상견 목록 (Multi-Entry) */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-teal-500 rounded-full" />
                            검사 대상견 목록 ({entries.length}두)
                        </h3>
                        <button
                            type="button"
                            onClick={addEntry}
                            className="px-4 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl hover:bg-teal-700 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                            <Plus size={14} /> 대상견 추가하기
                        </button>
                    </div>

                    {entries.map((entry, index) => (
                        <div key={entry.id || index} className="p-6 bg-white border-2 border-slate-200 hover:border-teal-500/50 rounded-3xl space-y-4 transition-all shadow-sm">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-black">
                                    대상견 {index + 1}
                                </span>
                                {entries.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeEntry(index)}
                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        title="이 대상견 삭제"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-600 block">혈통서 등록번호 (조회 시 견 정보 자동확인) *</label>
                                <div className="flex gap-3">
                                    <input 
                                        value={entry.pedigree_number || entry.pedigree_no} 
                                        onChange={e => {
                                            updateEntry(index, 'pedigree_number', e.target.value);
                                            updateEntry(index, 'pedigree_no', e.target.value);
                                        }} 
                                        className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none text-sm font-mono uppercase" 
                                        placeholder="등록번호 입력 (예: KJ-00-000000)" 
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleSearchDogForEntry(index)}
                                        disabled={isSearching}
                                        className="px-6 bg-slate-900 text-white rounded-2xl font-bold text-xs hover:bg-black transition-all flex items-center gap-2"
                                    >
                                        {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} 조회
                                    </button>
                                </div>

                                {entry.dog_name && (
                                    <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 flex gap-4 text-xs font-bold text-teal-900">
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
                        className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-teal-500 text-slate-600 hover:text-teal-600 rounded-3xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-slate-50/50 hover:bg-teal-50/30"
                    >
                        <Plus size={16} /> 다른 대상견 추가하기
                    </button>
                </div>
            </div>
        </FormShell>
    );
};
