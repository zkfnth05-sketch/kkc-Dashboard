import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Loader2, X, Check, Download, Image as ImageIcon } from 'lucide-react';
import { fetchApplicants, createApplicant, deleteApplicant, updateApplicant } from '../services/eventService';
import { BRIDGE_URL, SECRET_KEY, uploadFile } from '../services/memberService';

interface Applicant {
    id: string;
    ds_pid: string | number;
    name: string;
    contact: string;
    birthdate: string;
    email: string;
    address: string;
    affiliation: string;
    dog_breed: string;
    entry_type: string;
    entry_category: string;
    student_id_photo: string;
    payment_status: '미입금' | '입금완료';
}

interface StylistCompetitionApplicantManagementProps {
    competitionId: string | number;
    competitionTitle: string;
    onClose: () => void;
    showAlert: (title: string, message: string) => void;
    showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export const StylistCompetitionApplicantManagement: React.FC<StylistCompetitionApplicantManagementProps> = ({
    competitionId,
    competitionTitle,
    onClose,
    showAlert,
    showConfirm
}) => {
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editTargetId, setEditTargetId] = useState<string | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        birthdate: '',
        email: '',
        address: '',
        affiliation: '',
        dog_breed: '',
        entry_type: '',
        entry_category: '',
        student_id_photo: '',
        payment_status: '미입금' as '미입금' | '입금완료'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const extractNumericId = (idStr: string | number) => {
        if (typeof idStr === 'number') return idStr;
        const match = idStr.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    };

    const parsedDsPid = extractNumericId(competitionId);

    const loadData = async () => {
        if (!parsedDsPid) return;
        setIsLoading(true);
        try {
            const res = await fetchApplicants(parsedDsPid, 'stylist_applicant');
            if (res.data) {
                setApplicants(res.data);
            }
        } catch (e: any) {
            showAlert('오류', '신청자 목록을 불러오지 못했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [parsedDsPid]);

    const handleOpenModal = (applicant?: Applicant) => {
        if (applicant) {
            setEditTargetId(applicant.id);
            setFormData({
                name: applicant.name || '',
                contact: applicant.contact || '',
                birthdate: applicant.birthdate || '',
                email: applicant.email || '',
                address: applicant.address || '',
                affiliation: applicant.affiliation || '',
                dog_breed: applicant.dog_breed || '',
                entry_type: applicant.entry_type || '',
                entry_category: applicant.entry_category || '',
                student_id_photo: applicant.student_id_photo || '',
                payment_status: applicant.payment_status || '미입금'
            });
        } else {
            setEditTargetId(null);
            setFormData({
                name: '',
                contact: '',
                birthdate: '',
                email: '',
                address: '',
                affiliation: '',
                dog_breed: '',
                entry_type: '',
                entry_category: '',
                student_id_photo: '',
                payment_status: '미입금'
            });
        }
        setIsModalOpen(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSubmitting(true);
        try {
            const result = await uploadFile(file);
            if (result && result.success) {
                setFormData(prev => ({ ...prev, student_id_photo: result.url }));
            } else {
                showAlert('오류', result?.error || '이미지 업로드에 실패했습니다.');
            }
        } catch (err: any) {
            showAlert('오류', err.message || '이미지 서버 통신 실패');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            showAlert('필수 입력 누락', '이름을 입력해주세요.');
            return;
        }
        if (!formData.contact.trim()) {
            showAlert('필수 입력 누락', '연락처를 입력해주세요.');
            return;
        }
        if (!formData.birthdate.trim()) {
            showAlert('필수 입력 누락', '생년월일을 입력해주세요.');
            return;
        }
        if (!formData.address.trim()) {
            showAlert('필수 입력 누락', '주소를 입력해주세요.');
            return;
        }
        if (!formData.affiliation.trim()) {
            showAlert('필수 입력 누락', '소속을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                ds_pid: parsedDsPid
            };

            let res;
            if (editTargetId) {
                res = await updateApplicant({ ...payload, id: editTargetId }, 'stylist_applicant');
            } else {
                res = await createApplicant(payload, 'stylist_applicant');
            }

            if (res.success) {
                showAlert('성공', editTargetId ? '수정되었습니다.' : '추가되었습니다.');
                setIsModalOpen(false);
                loadData();
            } else {
                throw new Error(res.error);
            }
        } catch (e: any) {
            showAlert('오류', '저장에 실패했습니다: ' + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id: string, name: string) => {
        showConfirm('신청자 삭제', `'${name}' 신청자를 삭제하시겠습니까?`, async () => {
            setIsLoading(true);
            try {
                const res = await deleteApplicant(id, 'stylist_applicant');
                if (res.success) {
                    showAlert('성공', '삭제되었습니다.');
                    loadData();
                } else {
                    throw new Error(res.error);
                }
            } catch (e: any) {
                showAlert('오류', '삭제 실패');
            } finally {
                setIsLoading(false);
            }
        });
    };

    return (
        <div className="flex flex-col h-full bg-white p-8 font-sans text-gray-800 animate-in fade-in duration-300">
            {/* HEADER */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-800 transition-colors p-2 hover:bg-gray-100 rounded-full"
                    >
                        <ChevronLeft size={28} />
                    </button>
                    <div>
                        <h2 className="text-[28px] font-black tracking-tight text-gray-900 flex items-center gap-4">
                            신청자 관리
                            <span className="text-[14px] font-bold text-gray-500 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-200 shadow-sm">
                                {competitionTitle}
                            </span>
                        </h2>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-lg text-[14px] font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                    >
                        <Plus size={18} strokeWidth={3} className="text-blue-500" /> 신청자 추가
                    </button>
                </div>
            </div>

            {/* TABLE */}
            <div className="flex-1 overflow-auto border border-gray-200 rounded-xl shadow-sm relative bg-white">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/60 z-30 flex items-center justify-center backdrop-blur-[2px]">
                        <Loader2 className="animate-spin text-blue-600" size={48} />
                    </div>
                )}
                <table className="w-full text-[13px] border-collapse text-center">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold sticky top-0 z-10">
                            <th className="py-4 px-3 w-[8%] font-black uppercase tracking-wider">이름</th>
                            <th className="py-4 px-3 w-[10%] font-black uppercase tracking-wider text-left">연락처</th>
                            <th className="py-4 px-3 w-[8%] font-black uppercase tracking-wider">생년월일</th>
                            <th className="py-4 px-3 w-[12%] font-black uppercase tracking-wider text-left">이메일</th>
                            <th className="py-4 px-3 w-[15%] font-black uppercase tracking-wider text-left">주소</th>
                            <th className="py-4 px-3 w-[8%] font-black uppercase tracking-wider">소속</th>
                            <th className="py-4 px-3 w-[8%] font-black uppercase tracking-wider">모종</th>
                            <th className="py-4 px-3 w-[10%] font-black uppercase tracking-wider">참가유형</th>
                            <th className="py-4 px-3 w-[10%] font-black uppercase tracking-wider">종목</th>
                            <th className="py-4 px-3 w-[8%] font-black uppercase tracking-wider">학생증 사진</th>
                            <th className="py-4 px-3 w-[8%] font-black uppercase tracking-wider">입금 상태</th>
                            <th className="py-4 px-3 w-[8%] font-black uppercase tracking-wider">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {applicants.length > 0 ? applicants.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="py-4 px-3 font-bold text-blue-600 text-[14px]">{item.name}</td>
                                <td className="py-4 px-3 text-left font-medium text-gray-700">{item.contact || '-'}</td>
                                <td className="py-4 px-3 text-gray-600 font-medium">{item.birthdate || '-'}</td>
                                <td className="py-4 px-3 text-left text-gray-500 break-all">{item.email || '-'}</td>
                                <td className="py-4 px-3 text-left text-gray-500 truncate max-w-[150px]" title={item.address}>{item.address || '-'}</td>
                                <td className="py-4 px-3 text-gray-600">{item.affiliation || '-'}</td>
                                <td className="py-4 px-3 text-gray-600">{item.dog_breed || '-'}</td>
                                <td className="py-4 px-3 text-gray-900 font-bold">{item.entry_type || '-'}</td>
                                <td className="py-4 px-3 text-gray-700 font-medium">{item.entry_category || '-'}</td>
                                <td className="py-4 px-3">
                                    {item.student_id_photo ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="w-16 h-20 bg-gray-100 border border-gray-200 rounded overflow-hidden shadow-sm relative group/img">
                                                <img src={item.student_id_photo} className="w-full h-full object-cover" alt="ID" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                    <a href={item.student_id_photo} target="_blank" rel="noreferrer" className="p-1.5 bg-white rounded-full text-gray-800 shadow-xl">
                                                        <Plus size={14} />
                                                    </a>
                                                </div>
                                            </div>
                                            <a href={item.student_id_photo} download className="text-[10px] text-gray-400 font-bold underline hover:text-blue-500">다운로드</a>
                                        </div>
                                    ) : (
                                        <div className="w-16 h-20 bg-gray-50 border border-gray-100 rounded mx-auto flex items-center justify-center text-gray-200">
                                            <ImageIcon size={24} />
                                        </div>
                                    )}
                                </td>
                                <td className="py-4 px-3">
                                    <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-tighter ${item.payment_status === '입금완료'
                                        ? 'bg-green-50 text-green-600 border border-green-200'
                                        : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
                                        {item.payment_status}
                                    </span>
                                </td>
                                <td className="py-4 px-3">
                                    <div className="flex justify-center gap-1.5">
                                        <button
                                            onClick={() => handleOpenModal(item)}
                                            className="px-3 py-1.5 bg-white border border-gray-200 rounded text-[11px] font-bold text-gray-600 hover:bg-gray-50 hover:border-blue-300 transition-all"
                                        >
                                            수정
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id, item.name)}
                                            className="px-3 py-1.5 bg-red-50 border border-red-100 rounded text-[11px] font-bold text-red-500 hover:bg-red-100 transition-all"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : !isLoading && (
                            <tr>
                                <td colSpan={12} className="py-40 text-center text-gray-400">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-4 bg-gray-50 rounded-full">
                                            <Plus size={32} className="text-gray-200" />
                                        </div>
                                        <span className="text-[15px] font-medium">등록된 신청자가 없습니다.</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-[20px] font-black tracking-tight text-gray-900">
                                {editTargetId ? '신청자 정보 수정' : '신청자 신규 추가'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-white rounded-full"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-600">이름 <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[14px] outline-none focus:border-blue-500 shadow-sm transition-all"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="이름 입력"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-600">연락처 <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[14px] outline-none focus:border-blue-500 shadow-sm transition-all"
                                        value={formData.contact}
                                        onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                        placeholder="010-0000-0000"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-600">생년월일 <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[14px] outline-none focus:border-blue-500 shadow-sm transition-all"
                                        value={formData.birthdate}
                                        onChange={e => setFormData({ ...formData, birthdate: e.target.value })}
                                        placeholder="YYYYMMDD"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-600">이메일</label>
                                    <input
                                        type="email"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[14px] outline-none focus:border-blue-500 shadow-sm transition-all"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="example@mail.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-600">주소 <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[14px] outline-none focus:border-blue-500 shadow-sm transition-all"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="상세 주소 입력"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-600">소속 <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[14px] outline-none focus:border-blue-500 shadow-sm transition-all"
                                        value={formData.affiliation}
                                        onChange={e => setFormData({ ...formData, affiliation: e.target.value })}
                                        placeholder="소속 단체/회사"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-600">모종</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[14px] outline-none focus:border-blue-500 shadow-sm transition-all bg-white"
                                        value={formData.dog_breed}
                                        onChange={e => setFormData({ ...formData, dog_breed: e.target.value })}
                                    >
                                        <option value="">모종을 선택하세요</option>
                                        <option value="위그">위그</option>
                                        <option value="실견">실견</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-600">참가유형</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[14px] outline-none focus:border-blue-500 shadow-sm transition-all bg-white"
                                        value={formData.entry_type}
                                        onChange={e => setFormData({ ...formData, entry_type: e.target.value })}
                                    >
                                        <option value="">참가유형을 선택하세요</option>
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
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-600">종목</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-[14px] outline-none focus:border-blue-500 shadow-sm transition-all bg-white"
                                        value={formData.entry_category}
                                        onChange={e => setFormData({ ...formData, entry_category: e.target.value })}
                                    >
                                        <option value="">종목을 선택하세요</option>
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
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-600">학생증 사진</label>
                                    <div className="flex gap-4 items-end">
                                        <div className="w-24 h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center overflow-hidden relative group">
                                            {formData.student_id_photo ? (
                                                <img src={formData.student_id_photo} className="w-full h-full object-cover" alt="ID Preview" />
                                            ) : (
                                                <ImageIcon size={24} className="text-gray-300" />
                                            )}
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={handleImageUpload}
                                                accept="image/*"
                                            />
                                        </div>
                                        <div className="flex-1 text-[11px] text-gray-400">
                                            <p>클릭하여 학생증 또는 신분증 사진을 업로드하세요.</p>
                                            <p className="mt-1">지원 형식: JPG, PNG, WEBP</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-600">입금 상태</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setFormData({ ...formData, payment_status: '미입금' })}
                                            className={`flex-1 py-3 border rounded-lg text-[14px] font-bold transition-all ${formData.payment_status === '미입금' ? 'bg-gray-800 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                                        >
                                            미입금
                                        </button>
                                        <button
                                            onClick={() => setFormData({ ...formData, payment_status: '입금완료' })}
                                            className={`flex-1 py-3 border rounded-lg text-[14px] font-bold transition-all ${formData.payment_status === '입금완료' ? 'bg-[#009292] border-[#009292] text-white' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                                        >
                                            {formData.payment_status === '입금완료' && <Check size={16} className="inline mr-1" />} 입금완료
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-4 bg-white border border-gray-300 text-gray-600 rounded-xl font-black text-[15px] hover:bg-gray-100 transition-all shadow-sm"
                                disabled={isSubmitting}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSubmitting}
                                className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-black text-[15px] hover:bg-blue-700 shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : null}
                                {isSubmitting ? '데이터 처리 중...' : (editTargetId ? '정보 업데이트' : '새 신청자 등록')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
