import React, { useRef } from 'react';
import { Search, Loader2, Image as ImageIcon } from 'lucide-react';
import { usePublicForm } from './usePublicForm';
import { FormShell } from './FormShell';

export const AgilityForm: React.FC<{ competition: any, onClose: () => void, showAlert: (t: string, m: string) => void }> = ({
    competition, onClose, showAlert
}) => {
    const { 
        formData, setFormData, isSubmitting, isSearching, handleInputChange, handleImageUpload, handleSearchMember, handleSave,
        eventOptions, selectedOptionIds, totalAmount, handleOptionToggle
    } = usePublicForm(
        competition, 'agility_applicant', onClose, showAlert
    );

    const fileRefs = {
        dog_photo: useRef<HTMLInputElement>(null),
        student_id_photo: useRef<HTMLInputElement>(null)
    };

    return (
        <FormShell 
            title={competition.title} 
            category="어질리티" 
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
                    <label className="text-sm font-bold text-slate-600">연락처</label>
                    <input name="contact" value={formData.contact} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="010-0000-0000" />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">종목</label>
                    <select name="subject" value={formData.subject} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none">
                        <option value="">종목 선택</option>
                        {['비기너1', '비기너2', '노비스1', '노비스2', '점핑1', '점핑2', '점핑3', '어질리티1', '어질리티2', '어질리티3'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">사이즈</label>
                    <select name="size" value={formData.size} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none">
                        <option value="">선택</option>
                        <option value="Toy">Toy</option>
                        <option value="Mini">Mini</option>
                        <option value="Medium">Medium</option>
                        <option value="Maxi">Maxi</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">구분</label>
                    <select name="division" value={formData.division} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none">
                        <option value="일반부">일반부</option>
                        <option value="학생부">학생부</option>
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

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">출진견 성별</label>
                    <div className="flex gap-4 p-1 bg-slate-100 rounded-xl">
                        <button type="button" onClick={() => setFormData({ ...formData, dog_gender: '수' })} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.dog_gender === '수' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400'}`}>수</button>
                        <button type="button" onClick={() => setFormData({ ...formData, dog_gender: '암' })} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.dog_gender === '암' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400'}`}>암</button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">발정유무</label>
                    <div className="flex gap-4 p-1 bg-slate-100 rounded-xl">
                        <button type="button" onClick={() => setFormData({ ...formData, is_heat: '무' })} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.is_heat === '무' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400'}`}>무</button>
                        <button type="button" onClick={() => setFormData({ ...formData, is_heat: '유' })} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${formData.is_heat === '유' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400'}`}>유</button>
                    </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100 mt-4">
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-600 block">출진견 사진</label>
                        <div className="flex items-center gap-4">
                            <div onClick={() => fileRefs.dog_photo.current?.click()} className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden shadow-inner">
                                {formData.dog_photo ? <img src={formData.dog_photo} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" />}
                            </div>
                            <div className="space-y-1">
                                <input type="file" ref={fileRefs.dog_photo} onChange={e => handleImageUpload(e, 'dog_photo')} hidden accept="image/*" />
                                <button type="button" onClick={() => fileRefs.dog_photo.current?.click()} className="text-[11px] font-bold text-teal-600 px-4 py-2 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors">사진 선택</button>
                                <p className="text-[10px] text-slate-400">정면/측면 전신 사진</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-600 block">학생증 사진 (학생부 필수)</label>
                        <div className="flex items-center gap-4">
                            <div onClick={() => fileRefs.student_id_photo.current?.click()} className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden shadow-inner">
                                {formData.student_id_photo ? <img src={formData.student_id_photo} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" />}
                            </div>
                            <div className="space-y-1">
                                <input type="file" ref={fileRefs.student_id_photo} onChange={e => handleImageUpload(e, 'student_id_photo')} hidden accept="image/*" />
                                <button type="button" onClick={() => fileRefs.student_id_photo.current?.click()} className="text-[11px] font-bold text-teal-600 px-4 py-2 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors">사진 선택</button>
                                <p className="text-[10px] text-slate-400">본인 확인용 원본 파일</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FormShell>
    );
};
