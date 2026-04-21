import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Plus, Loader2, X, Image as ImageIcon, Search, Check } from 'lucide-react';
import { fetchApplicants, createApplicant, deleteApplicant, updateApplicant } from '../services/eventService';
import { fetchMembers, uploadFile } from '../services/memberService';

interface DiscDogApplicant {
    id: string;
    ds_pid: string | number;
    handler_id: string;     // 핸들러 ID
    name: string;           // 이름
    name_eng: string;       // 이름(영문)
    contact: string;        // 연락처
    dog_name: string;       // 견명
    dog_name_eng: string;   // 견명(영문)
    dog_breed: string;      // 견종
    subject: string;        // 종목
    team_name: string;      // 팀명 (3인 이상)
    dog_photo: string;      // 견사진
    student_id_photo: string; // 학생증 사진
    payment_status: '미입금' | '입금완료';
    size: string;
    division: string;
    dog_gender: string;
    is_heat: string;
}

interface DiscDogApplicantManagementProps {
    competitionId: string | number;
    competitionTitle: string;
    onClose: () => void;
    showAlert: (title: string, message: string) => void;
    showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export const DiscDogApplicantManagement: React.FC<DiscDogApplicantManagementProps> = ({
    competitionId,
    competitionTitle,
    onClose,
    showAlert,
    showConfirm
}) => {
    const [applicants, setApplicants] = useState<DiscDogApplicant[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOptionsApp, setSelectedOptionsApp] = useState<any>(null);
    const [editTargetId, setEditTargetId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        handler_id: '',
        name: '',
        name_eng: '',
        contact: '',
        dog_name: '',
        dog_name_eng: '',
        dog_breed: '',
        subject: '',
        team_name: '',
        size: 'Medium',
        division: '일반부',
        dog_gender: '수',
        is_heat: '무',
        dog_photo: '',
        student_id_photo: '',
        payment_status: '미입금' as '미입금' | '입금완료'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearchingMember, setIsSearchingMember] = useState(false);
    const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const discDogSubjects = [
        '노비스T/T', '전문가T/T', '학생부T/C', '스몰독T/C',
        '노비스T/C', '전문가T/C', '페어T/C',
        '컴바인(스몰독F/S+전문가T/C)',
        '컴바인(노비스F/S+전문가T/C)',
        '컴바인(준전문가F/S+전문가T/C)',
        '컴바인(전문가F/S+전문가T/C)'
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsSubjectDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
            const res = await fetchApplicants(parsedDsPid, 'discdog_applicant');
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

    const handleOpenModal = (applicant?: DiscDogApplicant) => {
        if (applicant) {
            setEditTargetId(applicant.id);
            setFormData({
                handler_id: applicant.handler_id || '',
                name: applicant.name || '',
                name_eng: applicant.name_eng || '',
                contact: applicant.contact || '',
                dog_name: applicant.dog_name || '',
                dog_name_eng: applicant.dog_name_eng || '',
                dog_breed: applicant.dog_breed || '',
                subject: applicant.subject || '',
                team_name: applicant.team_name || '',
                size: applicant.size || 'Medium',
                division: applicant.division || '일반부',
                dog_gender: applicant.dog_gender || '수',
                is_heat: applicant.is_heat || '무',
                dog_photo: applicant.dog_photo || '',
                student_id_photo: applicant.student_id_photo || '',
                payment_status: applicant.payment_status || '미입금'
            });
        } else {
            setEditTargetId(null);
            setFormData({
                handler_id: '',
                name: '',
                name_eng: '',
                contact: '',
                dog_name: '',
                dog_name_eng: '',
                dog_breed: '',
                subject: '',
                team_name: '',
                size: 'Medium',
                division: '일반부',
                dog_gender: '수',
                is_heat: '무',
                dog_photo: '',
                student_id_photo: '',
                payment_status: '미입금'
            });
        }
        setIsModalOpen(true);
    };

    const handleSearchMember = async () => {
        if (!formData.handler_id.trim()) {
            showAlert('조회 불가', '핸들러(ID)를 입력해주세요.');
            return;
        }

        setIsSearchingMember(true);
        try {
            const res = await fetchMembers('memTab', 1, formData.handler_id, 'id', 1);
            if (res.data && res.data.length > 0) {
                const member = res.data[0];
                setFormData(prev => ({
                    ...prev,
                    name: member.name || '',
                    name_eng: member.name_eng || '',
                    contact: member.tel || member.hp || ''
                }));
                showAlert('조회 성공', `'${member.name}' 회원의 정보를 불러왔습니다.`);
            } else {
                showAlert('조회 실패', '해당 ID를 가진 회원을 찾을 수 없습니다.');
            }
        } catch (e: any) {
            showAlert('오류', '회원 조회 중 문제가 발생했습니다.');
        } finally {
            setIsSearchingMember(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'student_id_photo' | 'dog_photo') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsSubmitting(true);
        try {
            const result = await uploadFile(file);
            if (result && result.success) {
                setFormData(prev => ({ ...prev, [field]: result.url }));
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
            showAlert('필수 입력 누락', '성함을 입력해주세요.');
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
                res = await updateApplicant({ ...payload, id: editTargetId }, 'discdog_applicant');
            } else {
                res = await createApplicant(payload, 'discdog_applicant');
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
                const res = await deleteApplicant(id, 'discdog_applicant');
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
                            디스크독 신청자 관리
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
                            <th className="py-4 px-2 w-[8%] font-black uppercase tracking-wider border-r border-gray-100">핸들러(ID)</th>
                            <th className="py-4 px-2 w-[8%] font-black uppercase tracking-wider border-r border-gray-100">이름</th>
                            <th className="py-4 px-2 w-[8%] font-black uppercase tracking-wider border-r border-gray-100 font-medium whitespace-nowrap">이름(영문)</th>
                            <th className="py-4 px-2 w-[10%] font-black uppercase tracking-wider border-r border-gray-100 text-left px-4">연락처</th>
                            <th className="py-4 px-2 w-[8%] font-black uppercase tracking-wider border-r border-gray-100">견명</th>
                            <th className="py-4 px-2 w-[8%] font-black uppercase tracking-wider border-r border-gray-100 font-medium whitespace-nowrap">견명(영문)</th>
                            <th className="py-4 px-2 w-[8%] font-black uppercase tracking-wider border-r border-gray-100">견종</th>
                            <th className="py-4 px-2 w-[10%] font-black uppercase tracking-wider border-r border-gray-100">종목</th>
                            <th className="py-4 px-2 w-[10%] font-black uppercase tracking-wider border-r border-gray-100">팀명 (3명 이상)</th>
                            <th className="py-4 px-2 w-[8%] font-black uppercase tracking-wider border-r border-gray-100">학생증사진</th>
                            <th className="py-4 px-2 w-[8%] font-black uppercase tracking-wider border-r border-gray-100">입금 상태</th>
                            <th className="py-4 px-3 w-[6%] font-black uppercase tracking-wider">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {applicants.length > 0 ? applicants.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="py-4 px-2 border-r border-gray-50 text-[11px] text-gray-400 font-medium">{item.handler_id || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 font-bold text-gray-900">{item.name}</td>
                                <td className="py-4 px-2 border-r border-gray-50 text-gray-500 italic">{item.name_eng || '-'}</td>
                                <td className="py-4 px-4 border-r border-gray-50 text-left text-gray-700">{item.contact || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 font-bold text-gray-800">{item.dog_name || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 text-gray-500">{item.dog_name_eng || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 text-gray-600 font-medium">{item.dog_breed || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 font-black text-gray-900">{item.subject || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 text-gray-600">{item.team_name || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50">
                                    <div className="flex justify-center">
                                        <div className="w-12 h-16 bg-gray-100 border border-gray-200 rounded overflow-hidden shadow-sm relative group/img" title="학생증">
                                            {item.student_id_photo ? <img src={item.student_id_photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={14} /></div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-2 border-r border-gray-50">
                                    <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-tighter ${item.payment_status === '입금완료'
                                        ? 'bg-green-50 text-green-600 border border-green-200'
                                        : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                                        {item.payment_status}
                                    </span>
                                </td>
                                <td className="py-4 px-3">
                                    <div className="flex justify-center gap-1.5">
                                        <button
                                            onClick={() => setSelectedOptionsApp(item)}
                                            className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition-all"
                                        >
                                            옵션보기
                                        </button>
                                        <button onClick={() => handleOpenModal(item)} className="px-3 py-1.5 bg-white border border-gray-200 rounded text-[11px] font-bold text-gray-600 hover:bg-gray-50 hover:border-blue-300 transition-all">수정</button>
                                        <button onClick={() => handleDelete(item.id, item.name)} className="px-3 py-1.5 bg-red-50 border border-red-100 rounded text-[11px] font-bold text-red-500 hover:bg-red-100 transition-all">삭제</button>
                                    </div>
                                </td>
                            </tr>
                        )) : !isLoading && (
                            <tr>
                                <td colSpan={13} className="py-40 text-center text-gray-300 font-bold">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-4 bg-gray-50 rounded-full">
                                            <Plus size={32} className="text-gray-200" />
                                        </div>
                                        <span className="text-[15px] font-medium text-gray-400">등록된 신청 데이터가 없습니다.</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {selectedOptionsApp && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedOptionsApp(null)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 bg-[#f8f9fa]">
                            <div>
                                <h3 className="text-[15px] font-black text-gray-800">신청 옵션 상세</h3>
                                <p className="text-[12px] text-gray-500 mt-0.5">{selectedOptionsApp.name} 님의 신청 항목</p>
                            </div>
                            <button onClick={() => setSelectedOptionsApp(null)} className="text-gray-400 hover:text-gray-600 p-1"><X size={18} /></button>
                        </div>
                        <div className="p-5">
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                <p className="text-[13px] font-bold text-blue-900 leading-relaxed whitespace-pre-wrap">{selectedOptionsApp.options_summary || '옵션 정보 없음'}</p>
                            </div>
                            <div className="mt-3 flex justify-between text-[12px] text-gray-500">
                                <span>참가비 합계</span>
                                <span className="font-black text-teal-600">{selectedOptionsApp.total_amount ? Number(selectedOptionsApp.total_amount).toLocaleString() : 0}원</span>
                            </div>
                        </div>
                        <div className="px-5 pb-5">
                            <button onClick={() => setSelectedOptionsApp(null)} className="w-full py-2.5 bg-gray-800 text-white rounded-lg font-bold text-[13px] hover:bg-gray-700 transition-colors">닫기</button>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
                        <div className="flex justify-between items-center px-10 py-8 bg-gray-50/50 border-b border-gray-100">
                            <h3 className="text-[22px] font-black text-gray-900 tracking-tight">{editTargetId ? '정보 수정' : '신규 신청 등록'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-white rounded-full"><X size={28} /></button>
                        </div>

                        <div className="p-10 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-black text-gray-500">핸들러(ID)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold shadow-inner focus:border-blue-500 outline-none transition-all"
                                            value={formData.handler_id}
                                            onChange={e => setFormData({ ...formData, handler_id: e.target.value })}
                                            placeholder="아이디 입력"
                                        />
                                        <button
                                            onClick={handleSearchMember}
                                            disabled={isSearchingMember}
                                            className="px-4 bg-gray-800 text-white rounded-xl font-bold text-[13px] hover:bg-gray-700 transition-all flex items-center gap-2"
                                        >
                                            {isSearchingMember ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} 조회
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-black text-gray-500">이름 <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold shadow-inner"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-black text-gray-500">핸들러 이름(영문)</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold shadow-inner"
                                        value={formData.name_eng}
                                        onChange={e => setFormData({ ...formData, name_eng: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-black text-gray-500">연락처</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold shadow-inner"
                                        value={formData.contact}
                                        onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-black text-gray-500">견명</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold shadow-inner"
                                        value={formData.dog_name}
                                        onChange={e => setFormData({ ...formData, dog_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-black text-gray-500">견명(영문)</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold shadow-inner"
                                        value={formData.dog_name_eng}
                                        onChange={e => setFormData({ ...formData, dog_name_eng: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-black text-gray-500">견종</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold shadow-inner"
                                        value={formData.dog_breed}
                                        onChange={e => setFormData({ ...formData, dog_breed: e.target.value })}
                                        placeholder="견종 입력"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-black text-gray-500">팀명 (3명 이상)</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold shadow-inner"
                                        value={formData.team_name}
                                        onChange={e => setFormData({ ...formData, team_name: e.target.value })}
                                        placeholder="팀 참가 시 입력"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 relative" ref={dropdownRef}>
                                <label className="text-[13px] font-black text-gray-500">종목 (중복 선택 가능)</label>
                                <div
                                    onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold shadow-inner bg-white flex justify-between items-center cursor-pointer hover:border-blue-500 transition-all"
                                >
                                    <span className={formData.subject ? "text-gray-900" : "text-gray-400"}>
                                        {formData.subject || '종목 선택'}
                                    </span>
                                    <ChevronLeft className={`transition-transform flex-shrink-0 ${isSubjectDropdownOpen ? 'rotate-90' : '-rotate-90'}`} size={16} />
                                </div>
                                {isSubjectDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 z-[110] mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl py-3 max-h-[400px] overflow-y-auto animate-in slide-in-from-top-1 duration-200">
                                        {discDogSubjects.map((subject) => {
                                            const isSelected = formData.subject.split(', ').includes(subject);
                                            return (
                                                <div
                                                    key={subject}
                                                    onClick={() => {
                                                        const current = formData.subject ? formData.subject.split(', ').filter(Boolean) : [];
                                                        let next;
                                                        if (current.includes(subject)) {
                                                            next = current.filter(s => s !== subject);
                                                        } else {
                                                            next = [...current, subject];
                                                        }
                                                        setFormData({ ...formData, subject: next.join(', ') });
                                                    }}
                                                    className={`px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
                                                >
                                                    <span className={`text-[14px] ${isSelected ? 'text-blue-600 font-black' : 'text-gray-700 font-bold'}`}>
                                                        {subject}
                                                    </span>
                                                    {isSelected ? (
                                                        <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center">
                                                            <Check size={14} className="text-white" strokeWidth={4} />
                                                        </div>
                                                    ) : (
                                                        <div className="w-5 h-5 border-2 border-gray-200 rounded-md bg-white"></div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-8 pt-6 border-t border-gray-100">
                                <div className="space-y-3">
                                    <label className="text-[13px] font-black text-gray-500">학생증 사진</label>
                                    <div className="flex items-center gap-4">
                                        <div onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = 'image/*';
                                            input.onchange = (e: any) => handleImageUpload(e, 'student_id_photo');
                                            input.click();
                                        }} className="w-20 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner cursor-pointer hover:bg-gray-100 transition-colors">
                                            {formData.student_id_photo ? <img src={formData.student_id_photo} className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-gray-200" />}
                                        </div>
                                        <button onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = 'image/*';
                                            input.onchange = (e: any) => handleImageUpload(e, 'student_id_photo');
                                            input.click();
                                        }} className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-[11px] font-bold text-gray-700">사진 선택</button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <label className="text-[13px] font-black text-gray-500 mb-3 block">입금 상태</label>
                                <div className="flex gap-3">
                                    <button onClick={() => setFormData({ ...formData, payment_status: '미입금' })} className={`flex-1 py-4 border rounded-2xl text-[14px] font-black transition-all ${formData.payment_status === '미입금' ? 'bg-gray-800 border-gray-800 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-300'}`}>미입금</button>
                                    <button onClick={() => setFormData({ ...formData, payment_status: '입금완료' })} className={`flex-1 py-4 border rounded-2xl text-[14px] font-black transition-all ${formData.payment_status === '입금완료' ? 'bg-[#009292] border-[#009292] text-white shadow-lg' : 'bg-white border-gray-200 text-gray-300'}`}>입금완료</button>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 bg-gray-50/80 border-t border-gray-100 flex gap-4">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-white border border-gray-300 text-gray-500 rounded-2xl font-black text-[16px] hover:bg-gray-100 transition-all shadow-sm">취소하기</button>
                            <button onClick={handleSave} disabled={isSubmitting} className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[16px] hover:bg-blue-700 shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : '최종 저장 완료'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
