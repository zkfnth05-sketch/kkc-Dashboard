import React, { useRef } from 'react';
import { Search, Loader2, Image as ImageIcon } from 'lucide-react';
import { usePublicForm } from './usePublicForm';
import { FormShell } from './FormShell';

export const StylistForm: React.FC<{ competition: any, onClose: () => void, showAlert: (t: string, m: string) => void }> = ({
    competition, onClose, showAlert
}) => {
    const { 
        formData, isSubmitting, isSearching, handleInputChange, handleImageUpload, handleSearchMember, handleSave,
        eventOptions, selectedOptionIds, totalAmount, handleOptionToggle
    } = usePublicForm(
        competition, 'stylist_applicant', onClose, showAlert
    );

    const fileRefs = {
        student_id_photo: useRef<HTMLInputElement>(null)
    };

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
                    <label className="text-sm font-bold text-slate-600">아이디 (ID) 조회</label>
                    <div className="flex gap-2">
                        <input name="handler_id" value={formData.handler_id} onChange={handleInputChange} className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="회원 ID 입력" />
                        <button
                            type="button"
                            onClick={handleSearchMember}
                            disabled={isSearching}
                            className="px-4 bg-slate-800 !text-white rounded-xl font-bold text-xs hover:bg-slate-700 transition-all flex items-center gap-2"
                        >
                            {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} 조회
                        </button>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">이름 *</label>
                    <input name="name" value={formData.name} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="실명을 입력하세요" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">생년월일 *</label>
                    <input name="birthdate" value={formData.birthdate} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="YYYY-MM-DD" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">연락처 *</label>
                    <input name="contact" value={formData.contact} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="010-0000-0000" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">이메일</label>
                    <input name="email" value={formData.email} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="example@email.com" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">소속 *</label>
                    <input name="affiliation" value={formData.affiliation} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="학원 또는 소속기관" />
                </div>
                <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-600">주소 *</label>
                    <input name="address" value={formData.address} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="상세 주소를 입력하세요" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">모종</label>
                    <select name="dog_breed" value={formData.dog_breed} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none">
                        <option value="">모종 선택</option>
                        <option value="위그">위그</option>
                        <option value="실견">실견</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">참가유형</label>
                    <select name="entry_type" value={formData.entry_type} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none">
                        <option value="">유형 선택</option>
                        <option value="노비스">노비스</option>
                        <option value="Level C">Level C</option>
                        <option value="Level B">Level B</option>
                        <option value="Level A">Level A</option>
                        <option value="학생부">학생부</option>
                        <option value="프리스타일-살롱">프리스타일-살롱</option>
                        <option value="프리스타일-아트">프리스타일-아트</option>
                        <option value="프리스타일-그외">프리스타일-그외</option>
                    </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-600">종목</label>
                    <select name="entry_category" value={formData.entry_category} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none">
                        <option value="">종목 선택</option>
                        <option value="(Level C)-램클립">(Level C)-램클립</option>
                        <option value="(Level C)-모던클립">(Level C)-모던클립</option>
                        <option value="(Level B)-다이아몬드">(Level B)-다이아몬드</option>
                        <option value="(Level B)-더치클립">(Level B)-더치클립</option>
                        <option value="(Level B)-맨하탄클립">(Level B)-맨하탄클립</option>
                        <option value="(Level B)-볼레로맨하탄">(Level B)-볼레로맨하탄</option>
                        <option value="(Level B)-소리터리">(Level B)-소리터리</option>
                        <option value="(Level B)-피츠버그클립">(Level B)-피츠버그클립</option>
                        <option value="(Level B)-저먼클립">(Level B)-저먼클립</option>
                        <option value="(Level A)-퍼피클립">(Level A)-퍼피클립</option>
                        <option value="(Level A)-세컨드클립">(Level A)-세컨드클립</option>
                        <option value="(Level A)-콘티넨탈">(Level A)-콘티넨탈</option>
                        <option value="(Level A)-잉글리쉬새들">(Level A)-잉글리쉬새들</option>
                        <option value="(Level A)-스칸디나비아">(Level A)-스칸디나비아</option>
                        <option value="마스타">마스타</option>
                    </select>
                </div>
                <div className="md:col-span-2 space-y-3 pt-4 border-t border-slate-100">
                    <label className="text-sm font-bold text-slate-600">학생증 사진 (학생부 필수)</label>
                    <div className="flex items-center gap-4">
                        <div onClick={() => fileRefs.student_id_photo.current?.click()} className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden border-teal-100">
                            {formData.student_id_photo ? <img src={formData.student_id_photo} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" />}
                        </div>
                        <input type="file" ref={fileRefs.student_id_photo} onChange={e => handleImageUpload(e, 'student_id_photo')} hidden accept="image/*" />
                        <div className="flex flex-col gap-1">
                            <button type="button" onClick={() => fileRefs.student_id_photo.current?.click()} className="w-fit text-[11px] font-black text-teal-600 px-4 py-2 bg-teal-50 rounded-lg hover:bg-teal-100 transition-all">사진 선택</button>
                            <p className="text-[10px] text-slate-400">학생부 참가 시에만 첨부해주세요.</p>
                        </div>
                    </div>
                </div>
            </div>
        </FormShell>
    );
};

