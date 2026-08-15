import React, { useRef } from 'react';
import { Search, Loader2, Image as ImageIcon, Plus, Trash2, Copy } from 'lucide-react';
import { usePublicForm } from './usePublicForm';
import { FormShell } from './FormShell';

export const DiscDogForm: React.FC<{ competition: any, onClose: () => void, showAlert: (t: string, m: string) => void }> = ({
    competition, onClose, showAlert
}) => {
    const { 
        applicantInfo, handleApplicantChange, handleSearchMember,
        entries, addEntry, removeEntry, updateEntry, copyEntryFromFirst,
        isSubmitting, isSearching, handleImageUpload, handleSave,
        eventOptions, selectedOptionIds, totalAmount, handleOptionToggle,
        paymentMethod, setPaymentMethod
    } = usePublicForm(
        competition, 'discdog_applicant', onClose, showAlert
    );

    const fileRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    const discDogSubjects = [
        "노비스T/T", "전문가T/T", "학생부T/C", "스몰독T/C",
        "노비스T/C", "전문가T/C", "페어T/C",
        "컴바인(스몰독F/S+전문가T/C)", "컴바인(노비스F/S+전문가T/C)",
        "컴바인(준전문가F/S+전문가T/C)", "컴바인(전문가F/S+전문가T/C)"
    ];

    return (
        <FormShell 
            title={competition.title} 
            category="디스크독" 
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
                        신청자 (핸들러) 정보
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

                {/* 2. 출전 카드 목록 (Multi-Entry) */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-teal-500 rounded-full" />
                            출전 정보 목록 ({entries.length}건)
                        </h3>
                        <button
                            type="button"
                            onClick={addEntry}
                            className="px-4 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl hover:bg-teal-700 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                            <Plus size={14} /> 출전 추가하기
                        </button>
                    </div>

                    {entries.map((entry, index) => (
                        <div key={entry.id || index} className="p-6 bg-white border-2 border-slate-200 hover:border-teal-500/50 rounded-3xl space-y-4 transition-all shadow-sm">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-black">
                                    출전 {index + 1}
                                </span>
                                <div className="flex items-center gap-2">
                                    {index > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => copyEntryFromFirst(index)}
                                            className="px-2.5 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                            title="1번 출전견의 정보를 그대로 복사합니다"
                                        >
                                            <Copy size={12} /> 1번 견 정보 복사
                                        </button>
                                    )}
                                    {entries.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeEntry(index)}
                                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                            title="이 출전 정보 삭제"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600">견명 *</label>
                                    <input 
                                        value={entry.dog_name} 
                                        onChange={e => updateEntry(index, 'dog_name', e.target.value)} 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm" 
                                        placeholder="견명 입력" 
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600">견종</label>
                                    <input 
                                        value={entry.dog_breed} 
                                        onChange={e => updateEntry(index, 'dog_breed', e.target.value)} 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm" 
                                        placeholder="예: 보더콜리, 오지" 
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-600">팀명 (3인 이상 시)</label>
                                    <input 
                                        value={entry.team_name} 
                                        onChange={e => updateEntry(index, 'team_name', e.target.value)} 
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm" 
                                        placeholder="팀명" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <label className="text-xs font-bold text-slate-600 block">출진 종목 선택 *</label>
                                <div className="flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                                    {discDogSubjects.map(s => {
                                        const isSelected = entry.subject === s;
                                        return (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => updateEntry(index, 'subject', s)}
                                                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                                                    isSelected 
                                                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                                                    : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300'
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 학생증 사진 */}
                            <div className="pt-2 border-t border-slate-100">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-600 block">학생증 사진 (학생부T/C 참가 시 필수)</label>
                                    <div className="flex items-center gap-3">
                                        <div 
                                            onClick={() => fileRefs.current[`student_photo_${index}`]?.click()} 
                                            className="w-16 h-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden"
                                        >
                                            {entry.student_id_photo ? <img src={entry.student_id_photo} className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-slate-300" />}
                                        </div>
                                        <div className="space-y-1">
                                            <input 
                                                type="file" 
                                                ref={el => { fileRefs.current[`student_photo_${index}`] = el; }} 
                                                onChange={e => handleImageUpload(e, 'student_id_photo', index)} 
                                                hidden 
                                                accept="image/*" 
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => fileRefs.current[`student_photo_${index}`]?.click()} 
                                                className="text-[11px] font-bold text-teal-600 px-3 py-1.5 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                                            >
                                                사진 선택
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addEntry}
                        className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-teal-500 text-slate-600 hover:text-teal-600 rounded-3xl font-bold text-sm transition-all flex items-center justify-center gap-2 bg-slate-50/50 hover:bg-teal-50/30"
                    >
                        <Plus size={16} /> 다른 강아지 또는 다른 종목 출전 추가하기
                    </button>
                </div>
            </div>
        </FormShell>
    );
};
