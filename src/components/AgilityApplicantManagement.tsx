import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Plus, Loader2, X, Check, Image as ImageIcon, Search } from 'lucide-react';
import { fetchApplicants, createApplicant, deleteApplicant, updateApplicant } from '../services/eventService';
import { BRIDGE_URL, SECRET_KEY, fetchMembers, uploadFile } from '../services/memberService';

interface AgilityApplicant {
    id: string;
    ds_pid: string | number;
    handler_id: string;     // 핸들러 ID
    name: string;           // 핸들러 이름
    contact: string;        // 연락처
    subject: string;        // 종목 (비기너1, 비기너2, 노비스1, 노비스2 등)
    size: string;           // 사이즈 (Toy, Small, Medium, Large)
    division: string;       // 구분 (일반부/학생부)
    dog_breed: string;      // 견종
    dog_name: string;       // 견명
    dog_gender: string;     // 출진견 성별 (수/암)
    is_heat: string;        // 발정유무 (무/유)
    dog_photo: string;      // 출진견 사진
    student_id_photo: string; // 학생증 사진
    payment_status: '미입금' | '입금완료';
}

interface AgilityApplicantManagementProps {
    competitionId: string | number;
    competitionTitle: string;
    onClose: () => void;
    showAlert: (title: string, message: string) => void;
    showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export const AgilityApplicantManagement: React.FC<AgilityApplicantManagementProps> = ({
    competitionId,
    competitionTitle,
    onClose,
    showAlert,
    showConfirm
}) => {
    const [applicants, setApplicants] = useState<AgilityApplicant[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editTargetId, setEditTargetId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        handler_id: '',
        name: '',
        contact: '',
        subject: '',
        size: '',
        division: '학생부',
        dog_breed: '',
        dog_name: '',
        dog_gender: '수',
        is_heat: '무',
        dog_photo: '',
        student_id_photo: '',
        payment_status: '미입금' as '미입금' | '입금완료'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearchingMember, setIsSearchingMember] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            const res = await fetchApplicants(parsedDsPid, 'agility_applicant');
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

    const handleOpenModal = (applicant?: AgilityApplicant) => {
        if (applicant) {
            setEditTargetId(applicant.id);
            setFormData({
                handler_id: applicant.handler_id || '',
                name: applicant.name || '',
                contact: applicant.contact || '',
                subject: applicant.subject || '',
                size: applicant.size || '',
                division: applicant.division || '학생부',
                dog_breed: applicant.dog_breed || '',
                dog_name: applicant.dog_name || '',
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
                contact: '',
                subject: '',
                size: '',
                division: '학생부',
                dog_breed: '',
                dog_name: '',
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
                res = await updateApplicant({ ...payload, id: editTargetId }, 'agility_applicant');
            } else {
                res = await createApplicant(payload, 'agility_applicant');
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
                const res = await deleteApplicant(id, 'agility_applicant');
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
                            어질리티 신청자 관리
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
                            <th className="py-4 px-2 w-[7%] font-black uppercase tracking-wider border-r border-gray-100">핸들러(ID)</th>
                            <th className="py-4 px-2 w-[8%] font-black uppercase tracking-wider border-r border-gray-100">이름</th>
                            <th className="py-4 px-2 w-[10%] font-black uppercase tracking-wider border-r border-gray-100">연락처</th>
                            <th className="py-4 px-2 w-[8%] font-black uppercase tracking-wider border-r border-gray-100">종목</th>
                            <th className="py-4 px-2 w-[7%] font-black uppercase tracking-wider border-r border-gray-100">사이즈</th>
                            <th className="py-4 px-2 w-[7%] font-black uppercase tracking-wider border-r border-gray-100">구분</th>
                            <th className="py-4 px-2 w-[10%] font-black uppercase tracking-wider border-r border-gray-100">견종</th>
                            <th className="py-4 px-2 w-[10%] font-black uppercase tracking-wider border-r border-gray-100">견명</th>
                            <th className="py-4 px-2 w-[7%] font-black uppercase tracking-wider border-r border-gray-100">출진견 성별</th>
                            <th className="py-4 px-2 w-[7%] font-black uppercase tracking-wider border-r border-gray-100">발정유무</th>
                            <th className="py-4 px-2 w-[8%] font-black uppercase tracking-wider border-r border-gray-100">사진</th>
                            <th className="py-4 px-2 w-[7%] font-black uppercase tracking-wider border-r border-gray-100">입금 상태</th>
                            <th className="py-4 px-2 w-[4%] font-black uppercase tracking-wider">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {applicants.length > 0 ? applicants.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="py-4 px-2 border-r border-gray-50 text-[11px] text-blue-500 font-medium">{item.handler_id || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 font-bold text-gray-900">{item.name}</td>
                                <td className="py-4 px-2 border-r border-gray-50 text-gray-700">{item.contact || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 font-black text-gray-900">{item.subject || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 font-bold text-gray-600">{item.size || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50">{item.division}</td>
                                <td className="py-4 px-2 border-r border-gray-50 text-gray-600">{item.dog_breed || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 font-bold text-gray-800">{item.dog_name || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 text-gray-600 font-medium">{item.dog_gender || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 text-gray-600">{item.is_heat || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50">
                                    <div className="flex gap-2 justify-center">
                                        <div className="w-12 h-16 bg-gray-100 border border-gray-200 rounded overflow-hidden shadow-sm relative group/img" title="견사진">
                                            {item.dog_photo ? <img src={item.dog_photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={14} /></div>}
                                        </div>
                                        <div className="w-12 h-16 bg-gray-100 border border-gray-200 rounded overflow-hidden shadow-sm relative group/img" title="학생증">
                                            {item.student_id_photo ? <img src={item.student_id_photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={14} /></div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-2 border-r border-gray-50">
                                    <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md text-[11px] font-black tracking-tighter ${item.payment_status === '입금완료'
                                        ? 'bg-green-50 text-green-600 border border-green-200'
                                        : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
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
                                <td colSpan={13} className="py-40 text-center text-gray-300 font-bold">등록된 신청 데이터가 없습니다.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
                        <div className="flex justify-between items-center px-10 py-8 bg-gray-50/50 border-b border-gray-100">
                            <h3 className="text-[22px] font-black text-gray-900 tracking-tight">{editTargetId ? '어질리티 정보 수정' : '어질리티 신청 등록'}</h3>
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
                                    <label className="text-[13px] font-black text-gray-500">연락처</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold shadow-inner"
                                        value={formData.contact}
                                        onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-black text-gray-500">종목</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold bg-white"
                                        value={formData.subject}
                                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    >
                                        <option value="">종목선택</option>
                                        <option value="비기너1">비기너1</option>
                                        <option value="비기너2">비기너2</option>
                                        <option value="노비스1">노비스1</option>
                                        <option value="노비스2">노비스2</option>
                                        <option value="점핑1">점핑1</option>
                                        <option value="점핑2">점핑2</option>
                                        <option value="점핑3">점핑3</option>
                                        <option value="어질리티1">어질리티1</option>
                                        <option value="어질리티2">어질리티2</option>
                                        <option value="어질리티3">어질리티3</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-black text-gray-500">사이즈</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold bg-white"
                                        value={formData.size}
                                        onChange={e => setFormData({ ...formData, size: e.target.value })}
                                    >
                                        <option value="">사이즈 선택</option>
                                        <option value="Toy">Toy</option>
                                        <option value="Mini">Mini</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Maxi">Maxi</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-black text-gray-500">구분</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold bg-white"
                                        value={formData.division}
                                        onChange={e => setFormData({ ...formData, division: e.target.value })}
                                    >
                                        <option value="학생부">학생부</option>
                                        <option value="일반부">일반부</option>
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

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-black text-gray-500">출진견 성별</label>
                                    <select className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold bg-white" value={formData.dog_gender} onChange={e => setFormData({ ...formData, dog_gender: e.target.value })}>
                                        <option value="수">수</option><option value="암">암</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[13px] font-black text-gray-500">발정유무</label>
                                    <select className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[14px] font-bold bg-white" value={formData.is_heat} onChange={e => setFormData({ ...formData, is_heat: e.target.value })}>
                                        <option value="무">무</option><option value="유">유</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                                <div className="space-y-3">
                                    <label className="text-[13px] font-black text-gray-500">출진견 사진</label>
                                    <div className="flex items-center gap-4">
                                        <div onClick={() => fileInputRef.current?.click()} className="w-20 h-24 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner cursor-pointer hover:bg-gray-100 transition-colors">
                                            {formData.dog_photo ? <img src={formData.dog_photo} className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-gray-200" />}
                                        </div>
                                        <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-[11px] font-bold text-gray-700">사진 선택</button>
                                        <input ref={fileInputRef} type="file" onChange={e => handleImageUpload(e, 'dog_photo')} accept="image/*" className="hidden" />
                                    </div>
                                </div>
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

                            <div className="pt-6">
                                <label className="text-[13px] font-black text-gray-500 mb-3 block">입금 상태</label>
                                <div className="flex gap-3">
                                    <button onClick={() => setFormData({ ...formData, payment_status: '미입금' })} className={`flex-1 py-4 border rounded-2xl text-[15px] font-black transition-all ${formData.payment_status === '미입금' ? 'bg-gray-800 border-gray-800 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-300'}`}>미입금</button>
                                    <button onClick={() => setFormData({ ...formData, payment_status: '입금완료' })} className={`flex-1 py-4 border rounded-2xl text-[15px] font-black transition-all ${formData.payment_status === '입금완료' ? 'bg-[#009292] border-[#009292] text-white shadow-lg' : 'bg-white border-gray-200 text-gray-300'}`}>입금완료</button>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 bg-gray-50 border-t border-gray-100 flex gap-4">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-white border border-gray-300 text-gray-500 rounded-2xl font-black text-[16px]">취소</button>
                            <button onClick={handleSave} disabled={isSubmitting} className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[16px] flex items-center justify-center gap-3">
                                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : '저장 완료'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
