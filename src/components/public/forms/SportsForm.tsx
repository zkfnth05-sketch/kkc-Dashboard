import React, { useRef } from 'react';
import { Search, Loader2, Image as ImageIcon } from 'lucide-react';
import { usePublicForm } from './usePublicForm';
import { FormShell } from './FormShell';

export const SportsForm: React.FC<{ competition: any, onClose: () => void, showAlert: (t: string, m: string) => void }> = ({
    competition, onClose, showAlert
}) => {
    const categoryName = competition.category || '';
    const isTraining = categoryName.includes('훈련');
    const isAgility = categoryName.includes('어질리티');
    const isDiscDog = categoryName.includes('디스크독');
    const isFlyball = categoryName.includes('플라이볼');

    let targetTable = 'sports_applicant';
    if (isAgility) targetTable = 'agility_applicant';
    else if (isDiscDog) targetTable = 'discdog_applicant';
    else if (isFlyball) targetTable = 'flyball_applicant';

    const { 
        formData, setFormData, isSubmitting, isSearching, handleInputChange, handleImageUpload, handleSearchMember, handleSave,
        eventOptions, selectedOptionIds, totalAmount, handleOptionToggle
    } = usePublicForm(
        competition, targetTable, onClose, showAlert
    );

    const fileRefs = {
        dog_photo: useRef<HTMLInputElement>(null),
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
                    <label className="text-sm font-bold text-slate-600">아이디 (ID) 및 정보 조회</label>
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
                    <label className="text-sm font-bold text-slate-600">성함 *</label>
                    <input name="name" value={formData.name} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="성함" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">연락처</label>
                    <input name="contact" value={formData.contact} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="010-0000-0000" />
                </div>

                {isDiscDog && (
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">성함 (영문)</label>
                        <input name="name_eng" value={formData.name_eng} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="English Name" />
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">{isAgility ? '종목' : (isDiscDog || isFlyball ? '종목' : '종목/과목')}</label>
                    {isDiscDog ? (
                        <div className="space-y-2">
                            <textarea name="subject" value={formData.subject} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none h-[80px]" placeholder="참가할 종목들을 입력하세요" />
                            <div className="flex flex-wrap gap-2 mt-2">
                                {['프리스타일(국내)', '프리스타일(국제)', '수퍼-G(국내)', '수퍼-G(국제)', '타임트라이얼', '베이직', '장거리', '멀티독'].map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => {
                                            const subjects = formData.subject ? formData.subject.split(',').map((x: string) => x.trim()) : [];
                                            if (subjects.includes(s)) {
                                                setFormData({ ...formData, subject: subjects.filter((x: string) => x !== s).join(', ') });
                                            } else {
                                                setFormData({ ...formData, subject: [...subjects, s].filter(x => x).join(', ') });
                                            }
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${formData.subject?.includes(s) ? 'bg-teal-500 border-teal-500 text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-teal-200'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <select name="subject" value={formData.subject} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none">
                            <option value="">{isTraining ? '과목 선택' : '종목 선택'}</option>
                            {isTraining && [
                                'SD1', 'SD2', 'SD3', 'TT1', 'TT2', 'TT3', 'FD1', 'FD2', 'FD3', 'CD1', 'CD2', 'CD3', 'BH', 'OB1', 'OB2', '국가자격대비(2급)', '물품선별(ADS)'
                            ].map(s => <option key={s} value={s}>{s}</option>)}
                            {isAgility && [
                                '비기너1', '비기너2', '노비스1', '노비스2', '점핑1', '점핑2', '점핑3', '어질리티1', '어질리티2', '어질리티3'
                            ].map(s => <option key={s} value={s}>{s}</option>)}
                            {isFlyball && [
                                '개인전', '2인전', '팀(4인)'
                            ].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    )}
                </div>

                {isAgility && (
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
                )}

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">구분</label>
                    <select name="division" value={formData.division} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none">
                        <option value="일반부">일반부</option>
                        <option value="학생부">학생부</option>
                        {isDiscDog && <option value="프로부">프로부</option>}
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

                {isDiscDog && (
                    <>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600">견명 (영문)</label>
                            <input name="dog_name_eng" value={formData.dog_name_eng} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Dog English Name" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-600">팀명 (3인 이상)</label>
                            <input name="team_name" value={formData.team_name} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="팀명" />
                        </div>
                    </>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600">{isAgility ? '출진견 성별' : '성별'}</label>
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

                {isTraining && (
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-bold text-slate-600">혈통서 번호 (IGP 출진견)</label>
                        <div className="flex gap-2">
                            <input name="pedigree_no" value={formData.pedigree_no} onChange={handleInputChange} className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="등록번호 입력 (해당 시)" />
                            <button
                                type="button"
                                onClick={handleSearchMember}
                                disabled={isSearching}
                                className="px-4 bg-slate-800 text-white rounded-xl font-bold text-xs hover:bg-slate-700 transition-all flex items-center gap-2"
                            >
                                {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} 조회
                            </button>
                        </div>
                    </div>
                )}

                {/* Images Section - Enhanced Visibility Layout */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 pb-12 border-t border-slate-100 mt-4">
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-600 block">출진견 사진</label>
                        <div className="flex items-center gap-6">
                            <div onClick={() => fileRefs.dog_photo.current?.click()} className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden shadow-inner">
                                {formData.dog_photo ? <img src={formData.dog_photo} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" size={32} />}
                            </div>
                            <div className="space-y-2">
                                <input type="file" ref={fileRefs.dog_photo} onChange={e => handleImageUpload(e, 'dog_photo')} hidden accept="image/*" />
                                <button type="button" onClick={() => fileRefs.dog_photo.current?.click()} className="text-[12px] font-bold text-teal-600 px-5 py-2.5 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors">사진 선택</button>
                                <p className="text-[10px] text-slate-400">정면 또는 측면 전신 사진</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-bold text-slate-600 block">학생증 사진 (학생부 필수)</label>
                        <div className="flex items-center gap-6">
                            <div onClick={() => fileRefs.student_id_photo.current?.click()} className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden shadow-inner">
                                {formData.student_id_photo ? <img src={formData.student_id_photo} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" size={32} />}
                            </div>
                            <div className="space-y-2">
                                <input type="file" ref={fileRefs.student_id_photo} onChange={e => handleImageUpload(e, 'student_id_photo')} hidden accept="image/*" />
                                <button type="button" onClick={() => fileRefs.student_id_photo.current?.click()} className="text-[12px] font-bold text-teal-600 px-5 py-2.5 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors">사진 선택</button>
                                <p className="text-[10px] text-slate-400">본인 확인용 원본 사진</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </FormShell>
    );
};
