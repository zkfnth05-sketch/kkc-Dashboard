import React, { useRef } from 'react';
import { Search, Loader2, Image as ImageIcon } from 'lucide-react';
import { usePublicForm } from './usePublicForm';
import { FormShell } from './FormShell';

export const DiscDogForm: React.FC<{ competition: any, onClose: () => void, showAlert: (t: string, m: string) => void }> = ({
    competition, onClose, showAlert
}) => {
    const { 
        formData, setFormData, isSubmitting, isSearching, handleInputChange, handleImageUpload, handleSearchMember, handleSave,
        eventOptions, selectedOptionIds, totalAmount, handleOptionToggle
    } = usePublicForm(
        competition, 'discdog_applicant', onClose, showAlert
    );

    const fileRefs = {
        dog_photo: useRef<HTMLInputElement>(null),
        student_id_photo: useRef<HTMLInputElement>(null)
    };

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
        >
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
                    <label className="text-sm font-bold text-slate-600">성함 (영문)</label>
                    <input name="name_eng" value={formData.name_eng} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="English Name" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">연락처</label>
                    <input name="contact" value={formData.contact} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="010-0000-0000" />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">견명</label>
                    <input name="dog_name" value={formData.dog_name} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="견명" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">견명 (영문)</label>
                    <input name="dog_name_eng" value={formData.dog_name_eng} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Dog English Name" />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">견종</label>
                    <input name="dog_breed" value={formData.dog_breed} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="견종" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">팀명 (3인 이상)</label>
                    <input name="team_name" value={formData.team_name} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="팀명" />
                </div>

                <div className="md:col-span-2 space-y-4">
                    <label className="text-sm font-bold text-slate-600">종목 (중복 선택 가능)</label>
                    <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        {[
                            "노비스T/T", "전문가T/T", "학생부T/C", "스몰독T/C",
                            "노비스T/C", "전문가T/C", "페어T/C",
                            "컴바인(스몰독F/S+전문가T/C)", "컴바인(노비스F/S+전문가T/C)",
                            "컴바인(준전문가F/S+전문가T/C)", "컴바인(전문가F/S+전문가T/C)"
                        ].map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => {
                                    const subjects = formData.subject ? formData.subject.split(', ').filter(Boolean) : [];
                                    let next;
                                    if (subjects.includes(s)) {
                                        next = subjects.filter((x: string) => x !== s);
                                    } else {
                                        next = [...subjects, s];
                                    }
                                    setFormData({ ...formData, subject: next.join(', ') });
                                }}
                                className={`px-4 py-2 rounded-xl text-[11px] font-bold border transition-all shadow-sm ${formData.subject?.split(', ').includes(s) ? 'bg-teal-500 border-teal-500 text-white scale-105' : 'bg-white border-slate-200 text-slate-500 hover:border-teal-300'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-2 pt-4 border-t border-slate-100">
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-600">학생증 사진</label>
                        <div className="flex items-center gap-6">
                            <div onClick={() => fileRefs.student_id_photo.current?.click()} className="w-24 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden shadow-inner">
                                {formData.student_id_photo ? <img src={formData.student_id_photo} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center text-slate-300"><ImageIcon size={32} /></div>}
                            </div>
                            <input type="file" ref={fileRefs.student_id_photo} onChange={e => handleImageUpload(e, 'student_id_photo')} hidden accept="image/*" />
                            <div className="flex flex-col gap-2">
                                <button type="button" onClick={() => fileRefs.student_id_photo.current?.click()} className="text-[12px] font-black text-white px-6 py-2.5 bg-teal-500 rounded-xl shadow-md hover:bg-teal-600 transition-all">사진 업로드</button>
                                <p className="text-[10px] text-slate-400 font-medium">* 학생부 참가 시 필히 업로드</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FormShell>
    );
};
