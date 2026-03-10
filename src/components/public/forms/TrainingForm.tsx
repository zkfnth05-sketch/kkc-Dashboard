import React, { useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { usePublicForm } from './usePublicForm';
import { FormShell } from './FormShell';

export const TrainingForm: React.FC<{ competition: any, onClose: () => void, showAlert: (t: string, m: string) => void }> = ({
    competition, onClose, showAlert
}) => {
    const { formData, setFormData, isSubmitting, isSearching, handleInputChange, handleSearchMember, handleSave } = usePublicForm(
        competition, 'sports_applicant', onClose, showAlert
    );

    return (
        <FormShell title={competition.title} category="훈련 경기대회" onClose={onClose} onSave={handleSave} isSubmitting={isSubmitting}>
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
                        {['SD1', 'SD2', 'SD3', 'TT1', 'TT2', 'TT3', 'FD1', 'FD2', 'FD3', 'CD1', 'CD2', 'CD3', 'BH', 'OB1', 'OB2', '국가자격대비(2급)', '물품선별(ADS)'].map(s => <option key={s} value={s}>{s}</option>)}
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
                    <label className="text-sm font-bold text-slate-600">성별</label>
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

                <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-600">혈통서 번호 (IGP 출진견)</label>
                    <div className="flex gap-2">
                        <input name="pedigree_no" value={formData.pedigree_no} onChange={handleInputChange} className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="등록번호 입력 (해당 시)" />
                        <button type="button" onClick={handleSearchMember} disabled={isSearching} className="px-4 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700 transition-all flex items-center gap-2">
                            {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} 조회
                        </button>
                    </div>
                </div>
            </div>
        </FormShell>
    );
};
