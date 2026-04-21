import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Plus, Loader2, X, Check, Image as ImageIcon, Search } from 'lucide-react';
import { fetchApplicants, createApplicant, deleteApplicant, updateApplicant } from '../services/eventService';
import { BRIDGE_URL, SECRET_KEY, fetchMembers, uploadFile } from '../services/memberService';

interface SportsApplicant {
    id: string;
    ds_pid: string | number;
    handler_id: string;     // 지도사(ID)
    name: string;           // 이름
    contact: string;        // 연락처
    subject: string;        // 과목
    dog_breed: string;      // 견종
    dog_name: string;       // 견명
    dog_gender: string;     // 출진견 성별
    is_heat: string;        // 발정유무
    pedigree_no: string;    // 혈통서 번호 (IGP 출진견)
    division: string;       // 구분 (일반부/학생부)
    dog_photo: string;      // 견사진
    student_id_photo: string; // 학생증 사진
    payment_status: '미입금' | '입금완료';
    options_summary?: string; // 신청 옵션 요약
    total_amount?: number | string; // 참가비
}

interface SportsCompetitionApplicantManagementProps {
    competitionId: string | number;
    competitionTitle: string;
    onClose: () => void;
    showAlert: (title: string, message: string) => void;
    showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export const TrainingApplicantManagement: React.FC<SportsCompetitionApplicantManagementProps> = ({
    competitionId,
    competitionTitle,
    onClose,
    showAlert,
    showConfirm
}) => {
    const [applicants, setApplicants] = useState<SportsApplicant[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editTargetId, setEditTargetId] = useState<string | null>(null);
    const [selectedOptionsApp, setSelectedOptionsApp] = useState<SportsApplicant | null>(null);

    const [formData, setFormData] = useState({
        handler_id: '',
        name: '',
        contact: '',
        subject: '',
        dog_breed: '',
        dog_name: '',
        dog_gender: '수',
        is_heat: '무',
        pedigree_no: '-',
        division: '일반부',
        dog_photo: '',
        student_id_photo: '',
        payment_status: '미입금' as '미입금' | '입금완료'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearchingMember, setIsSearchingMember] = useState(false);
    const [isSearchingDog, setIsSearchingDog] = useState(false);

    const dogPhotoRef = useRef<HTMLInputElement>(null);
    const studentIdPhotoRef = useRef<HTMLInputElement>(null);

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
            const res = await fetchApplicants(parsedDsPid, 'sports_applicant');
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

    const handleOpenModal = (applicant?: SportsApplicant) => {
        if (applicant) {
            setEditTargetId(applicant.id);
            setFormData({
                handler_id: applicant.handler_id || '',
                name: applicant.name || '',
                contact: applicant.contact || '',
                subject: applicant.subject || '',
                dog_breed: applicant.dog_breed || '',
                dog_name: applicant.dog_name || '',
                dog_gender: applicant.dog_gender || '수',
                is_heat: applicant.is_heat || '무',
                pedigree_no: applicant.pedigree_no || '-',
                division: applicant.division || '일반부',
                dog_photo: applicant.dog_photo || '',
                student_id_photo: applicant.student_id_photo || '',
                payment_status: applicant.payment_status || '미입금'
            });
        } else {
            setEditTargetId(null);
            setFormData({
                handler_id: '',
                name: '',
                contact: '',
                subject: '',
                dog_breed: '',
                dog_name: '',
                dog_gender: '수',
                is_heat: '무',
                pedigree_no: '-',
                division: '일반부',
                dog_photo: '',
                student_id_photo: '',
                payment_status: '미입금'
            });
        }
        setIsModalOpen(true);
    };

    // 🔍 지도사(ID)로 회원 정보 조회
    const handleSearchMember = async () => {
        if (!formData.handler_id.trim()) {
            showAlert('조회 불가', '지도사(ID)를 입력해주세요.');
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

    // 🔍 혈통서 번호로 견 정보 조회 (dogTab)
    const handleSearchDog = async () => {
        if (!formData.pedigree_no.trim() || formData.pedigree_no === '-') {
            showAlert('조회 불가', '혈통서 번호를 입력해주세요.');
            return;
        }

        setIsSearchingDog(true);
        try {
            const res = await fetchMembers('dogTab', 1, formData.pedigree_no, 'reg_no', 1);
            if (res.data && res.data.length > 0) {
                const dog = res.data[0];
                setFormData(prev => ({
                    ...prev,
                    dog_breed: dog.dog_class || '',
                    dog_name: dog.name || '',
                    dog_gender: dog.sex === '1' ? '수' : dog.sex === '2' ? '암' : prev.dog_gender
                }));
                showAlert('조회 성공', `'${dog.name}' 견 정보를 불러왔습니다.`);
            } else {
                showAlert('조회 실패', '해당 번호로 등록된 견 정보를 찾을 수 없습니다.');
            }
        } catch (e: any) {
            showAlert('오류', '견 정보 조회 중 문제가 발생했습니다.');
        } finally {
            setIsSearchingDog(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'dog_photo' | 'student_id_photo') => {
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
                res = await updateApplicant({ ...payload, id: editTargetId }, 'sports_applicant');
            } else {
                res = await createApplicant(payload, 'sports_applicant');
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
                const res = await deleteApplicant(id, 'sports_applicant');
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
            {/* HEADER: Added back button and styled like the screenshot */}
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

            {/* TABLE: Modern design with rounded corners and sticky header */}
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
                            <th className="py-4 px-2 w-[10%] font-black uppercase tracking-wider border-r border-gray-100">연락처</th>
                            <th className="py-4 px-2 w-[8%] font-black uppercase tracking-wider border-r border-gray-100">종목</th>
                            <th className="py-4 px-2 w-[8%] font-black uppercase tracking-wider border-r border-gray-100">견종</th>
                            <th className="py-4 px-2 w-[8%] font-black uppercase tracking-wider border-r border-gray-100">견명</th>
                            <th className="py-4 px-2 w-[6%] font-black uppercase tracking-wider border-r border-gray-100">성별</th>
                            <th className="py-4 px-2 w-[6%] font-black uppercase tracking-wider border-r border-gray-100">발정유무</th>
                            <th className="py-4 px-2 w-[10%] font-black uppercase tracking-wider border-r border-gray-100">혈통서 번호</th>
                            <th className="py-4 px-2 w-[6%] font-black uppercase tracking-wider border-r border-gray-100">구분</th>
                            <th className="py-4 px-2 w-[8%] font-black uppercase tracking-wider border-r border-gray-100">견사진</th>
                            <th className="py-4 px-2 w-[8%] font-black uppercase tracking-wider border-r border-gray-100">학생증 사진</th>
                            <th className="py-4 px-2 w-[6%] font-black uppercase tracking-wider border-r border-gray-100">신청옵션</th>
                            <th className="py-4 px-2 w-[8%] font-black uppercase tracking-wider border-r border-gray-100">입금 상태</th>
                            <th className="py-4 px-3 w-[8%] font-black uppercase tracking-wider">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {applicants.length > 0 ? applicants.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="py-4 px-2 border-r border-gray-50 text-[11px] text-blue-500 font-medium">{item.handler_id || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 font-bold text-gray-900">{item.name}</td>
                                <td className="py-4 px-2 border-r border-gray-50 text-gray-600">{item.contact || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 font-bold text-gray-800">{item.subject || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 text-gray-500">{item.dog_breed || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 font-medium text-gray-900">{item.dog_name || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50">{item.dog_gender}</td>
                                <td className="py-4 px-2 border-r border-gray-50 text-gray-500">{item.is_heat}</td>
                                <td className="py-4 px-2 border-r border-gray-50 text-[11px] text-gray-400">{item.pedigree_no || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 font-medium">{item.division}</td>
                                <td className="py-4 px-2 border-r border-gray-50">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-16 h-20 bg-gray-100 border border-gray-200 rounded overflow-hidden shadow-sm relative group/img">
                                            {item.dog_photo ? (
                                                <img src={item.dog_photo} className="w-full h-full object-cover" alt="견사진" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={20} /></div>
                                            )}
                                        </div>
                                        {item.dog_photo && <a href={item.dog_photo} download className="text-[10px] text-gray-400 font-bold underline hover:text-blue-500">다운로드</a>}
                                    </div>
                                </td>
                                <td className="py-4 px-2 border-r border-gray-50">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-16 h-20 bg-gray-100 border border-gray-200 rounded overflow-hidden shadow-sm relative group/img">
                                            {item.student_id_photo ? (
                                                <img src={item.student_id_photo} className="w-full h-full object-cover" alt="학생증" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={20} /></div>
                                            )}
                                        </div>
                                        {item.student_id_photo && <a href={item.student_id_photo} download className="text-[10px] text-gray-400 font-bold underline hover:text-blue-500">다운로드</a>}
                                    </div>
                                </td>
                                <td className="py-4 px-2 border-r border-gray-50">
                                    {item.options_summary ? (
                                        <button
                                            onClick={() => setSelectedOptionsApp(item)}
                                            className="inline-flex items-center px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-[8px] text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition-colors"
                                            title={item.options_summary}
                                        >
                                            옵션보기
                                        </button>
                                    ) : (
                                        <span className="text-gray-300 text-[12px]">-</span>
                                    )}
                                </td>
                                <td className="py-4 px-2 border-r border-gray-50">
                                    <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-tighter ${item.payment_status === '입금완료'
                                        ? 'bg-green-50 text-green-600 border border-green-200'
                                        : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
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
                                <td colSpan={14} className="py-40 text-center text-gray-400">
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

            {/* 신청 옵션 상세 팝업 */}
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
                                <p className="text-[13px] font-bold text-blue-900 leading-relaxed whitespace-pre-wrap">
                                    {selectedOptionsApp.options_summary || '옵션 정보 없음'}
                                </p>
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

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
                        <div className="flex justify-between items-center px-10 py-8 bg-gray-50/50 border-b border-gray-100">
                            <h3 className="text-[22px] font-black text-gray-900 tracking-tight">{editTargetId ? '신청 정보 수정' : '신규 신청 등록'}</h3>
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
                                            {isSearchingMember ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                            조회
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-black text-gray-500">이름 <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold shadow-inner focus:border-blue-500 outline-none transition-all"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="조회 시 자동 입력"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-black text-gray-500">연락처</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold shadow-inner"
                                        value={formData.contact}
                                        onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                        placeholder="010-0000-0000"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-black text-gray-500">종목</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold bg-white outline-none focus:border-blue-500 shadow-inner"
                                        value={formData.subject}
                                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    >
                                        <option value="">종목을 선택하세요.</option>
                                        <option value="SD1">SD1</option>
                                        <option value="SD2">SD2</option>
                                        <option value="SD3">SD3</option>
                                        <option value="TT1">TT1</option>
                                        <option value="TT2">TT2</option>
                                        <option value="TT3">TT3</option>
                                        <option value="FD1">FD1</option>
                                        <option value="FD2">FD2</option>
                                        <option value="FD3">FD3</option>
                                        <option value="CD1">CD1</option>
                                        <option value="CD2">CD2</option>
                                        <option value="CD3">CD3</option>
                                        <option value="BH">BH</option>
                                        <option value="OB1">OB1</option>
                                        <option value="OB2">OB2</option>
                                        <option value="국가자격대비(2급)">국가자격대비(2급)</option>
                                        <option value="물품선별(ADS)">물품선별(ADS)</option>
                                    </select>
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
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-black text-gray-500">견명</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold shadow-inner"
                                        value={formData.dog_name}
                                        onChange={e => setFormData({ ...formData, dog_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-black text-gray-500">성별</label>
                                    <select className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold bg-white outline-none" value={formData.dog_gender} onChange={e => setFormData({ ...formData, dog_gender: e.target.value })}>
                                        <option value="수">수</option><option value="암">암</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-black text-gray-500">발정유무</label>
                                    <select className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold bg-white outline-none" value={formData.is_heat} onChange={e => setFormData({ ...formData, is_heat: e.target.value })}>
                                        <option value="무">무</option><option value="유">유</option>
                                    </select>
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-[13px] font-black text-gray-500">구분</label>
                                    <select className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold bg-white outline-none" value={formData.division} onChange={e => setFormData({ ...formData, division: e.target.value })}>
                                        <option value="일반부">일반부</option>
                                        <option value="학생부">학생부</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[13px] font-black text-gray-500">혈통서 번호 (IGP 출진견)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold shadow-inner"
                                        value={formData.pedigree_no}
                                        onChange={e => setFormData({ ...formData, pedigree_no: e.target.value })}
                                        placeholder="등록번호 입력"
                                    />
                                    <button
                                        onClick={handleSearchDog}
                                        disabled={isSearchingDog}
                                        className="px-4 bg-gray-800 text-white rounded-xl font-bold text-[13px] hover:bg-gray-700 transition-all flex items-center gap-2"
                                    >
                                        {isSearchingDog ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                        조회
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-10 pt-4 border-t border-gray-100">
                                <div className="flex flex-col gap-3">
                                    <label className="text-[13px] font-black text-gray-500">견사진</label>
                                    <div className="flex items-center gap-6">
                                        <div
                                            onClick={() => dogPhotoRef.current?.click()}
                                            className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner cursor-pointer hover:bg-gray-100 transition-colors group"
                                        >
                                            {formData.dog_photo ? (
                                                <img src={formData.dog_photo} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
                                            ) : (
                                                <ImageIcon size={32} className="text-gray-200 group-hover:text-gray-400 transition-colors" />
                                            )}
                                        </div>
                                        <input
                                            ref={dogPhotoRef}
                                            type="file"
                                            onChange={e => handleImageUpload(e, 'dog_photo')}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => dogPhotoRef.current?.click()}
                                            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-[11px] font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
                                        >
                                            사진 선택
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <label className="text-[13px] font-black text-gray-500">학생증 사진</label>
                                    <div className="flex items-center gap-6">
                                        <div
                                            onClick={() => studentIdPhotoRef.current?.click()}
                                            className="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner cursor-pointer hover:bg-gray-100 transition-colors group"
                                        >
                                            {formData.student_id_photo ? (
                                                <img src={formData.student_id_photo} className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
                                            ) : (
                                                <ImageIcon size={32} className="text-gray-200 group-hover:text-gray-400 transition-colors" />
                                            )}
                                        </div>
                                        <input
                                            ref={studentIdPhotoRef}
                                            type="file"
                                            onChange={e => handleImageUpload(e, 'student_id_photo')}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => studentIdPhotoRef.current?.click()}
                                            className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-[11px] font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
                                        >
                                            사진 선택
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6">
                                <label className="text-[13px] font-black text-gray-500 mb-3 block">입금 상태</label>
                                <div className="flex gap-3">
                                    <button onClick={() => setFormData({ ...formData, payment_status: '미입금' })} className={`flex-1 py-4 border rounded-2xl text-[15px] font-black transition-all ${formData.payment_status === '미입금' ? 'bg-gray-800 border-gray-800 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-300 hover:bg-gray-50'}`}>미입금</button>
                                    <button onClick={() => setFormData({ ...formData, payment_status: '입금완료' })} className={`flex-1 py-4 border rounded-2xl text-[15px] font-black transition-all ${formData.payment_status === '입금완료' ? 'bg-[#009292] border-[#009292] text-white shadow-lg' : 'bg-white border-gray-200 text-gray-300 hover:bg-gray-50'}`}>입금완료</button>
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
