import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Loader2, X, Check, Search } from 'lucide-react';
import { fetchApplicants, createApplicant, deleteApplicant, updateApplicant } from '../services/eventService';
import { fetchMembers } from '../services/memberService';

interface Applicant {
    id: string;
    ds_pid: string | number;
    handler_id: string;
    name: string;
    contact: string;
    birthdate: string;
    email: string;
    address: string;
    license_number: string;
    affiliation: string;
    entry_type: string;
    dog_breed: string;
    entry_category: string;
    payment_status: '미입금' | '입금완료';
}

interface StylistIntlApplicantManagementProps {
    competitionId: string | number;
    competitionTitle: string;
    onClose: () => void;
    showAlert: (title: string, message: string) => void;
    showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export const StylistIntlApplicantManagement: React.FC<StylistIntlApplicantManagementProps> = ({
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

    const [formData, setFormData] = useState({
        handler_id: '',
        name: '',
        contact: '',
        birthdate: '',
        email: '',
        address: '',
        license_number: '',
        affiliation: '',
        dog_breed: '',
        entry_type: '',
        entry_category: '',
        payment_status: '미입금' as '미입금' | '입금완료'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearchingMember, setIsSearchingMember] = useState(false);

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
            const res = await fetchApplicants(parsedDsPid, 'stylist_intl_applicant');
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
                handler_id: applicant.handler_id || '',
                name: applicant.name || '',
                contact: applicant.contact || '',
                birthdate: applicant.birthdate || '',
                email: applicant.email || '',
                address: applicant.address || '',
                license_number: applicant.license_number || '',
                affiliation: applicant.affiliation || '',
                dog_breed: applicant.dog_breed || '',
                entry_type: applicant.entry_type || '',
                entry_category: applicant.entry_category || '',
                payment_status: applicant.payment_status || '미입금'
            });
        } else {
            setEditTargetId(null);
            setFormData({
                handler_id: '',
                name: '',
                contact: '',
                birthdate: '',
                email: '',
                address: '',
                license_number: '',
                affiliation: '',
                dog_breed: '',
                entry_type: '',
                entry_category: '',
                payment_status: '미입금'
            });
        }
        setIsModalOpen(true);
    };

    const handleSearchMember = async () => {
        if (!formData.handler_id.trim()) {
            showAlert('알림', '아이디(ID)를 입력해주세요.');
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
                    contact: member.tel || member.hp || '',
                    email: member.email || '',
                    birthdate: member.birth || '',
                    address: member.addr1 ? `${member.addr1} ${member.addr2 || ''}` : '',
                    affiliation: member.company || ''
                }));
                showAlert('성공', `'${member.name}' 회원의 정보를 불러왔습니다.`);
            } else {
                showAlert('실패', '해당 ID의 회원을 찾을 수 없습니다.');
            }
        } catch (e: any) {
            showAlert('오류', '통신 중 오류가 발생했습니다.');
        } finally {
            setIsSearchingMember(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return showAlert('필수', '이름을 입력해주세요.');

        setIsSubmitting(true);
        try {
            const payload = { ...formData, ds_pid: parsedDsPid };
            let res;
            if (editTargetId) {
                res = await updateApplicant({ ...payload, id: editTargetId }, 'stylist_intl_applicant');
            } else {
                res = await createApplicant(payload, 'stylist_intl_applicant');
            }

            if (res.success) {
                showAlert('성공', '저장되었습니다.');
                setIsModalOpen(false);
                loadData();
            } else {
                throw new Error(res.error);
            }
        } catch (e: any) {
            showAlert('오류', '저장 실패: ' + e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id: string, name: string) => {
        showConfirm('삭제', `'${name}' 신청자를 삭제하시겠습니까?`, async () => {
            setIsLoading(true);
            try {
                const res = await deleteApplicant(id, 'stylist_intl_applicant');
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
        <div className="flex flex-col h-full bg-white p-6 font-sans text-gray-800 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors p-2 hover:bg-gray-100 rounded-full">
                        <ChevronLeft size={28} />
                    </button>
                    <div>
                        <h2 className="text-[28px] font-black tracking-tight text-gray-900 flex items-center gap-4">
                            국제 스타일리스트 신청자 관리
                            <span className="text-[14px] font-bold text-gray-500 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-200">
                                {competitionTitle}
                            </span>
                        </h2>
                    </div>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-xl text-[14px] font-black text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95">
                    <Plus size={18} strokeWidth={3} className="text-blue-600" /> 신청자 추가
                </button>
            </div>

            <div className="flex-1 overflow-auto border border-gray-200 rounded-2xl shadow-sm relative bg-white">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/60 z-30 flex items-center justify-center backdrop-blur-[2px]">
                        <Loader2 className="animate-spin text-blue-600" size={48} />
                    </div>
                )}
                <table className="w-full text-[13px] border-collapse text-center">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold sticky top-0 z-10">
                            <th className="py-4 px-2 w-[8%] border-r border-gray-100">아이디</th>
                            <th className="py-4 px-2 w-[8%] border-r border-gray-100">이름</th>
                            <th className="py-4 px-2 w-[10%] border-r border-gray-100">연락처</th>
                            <th className="py-4 px-2 w-[8%] border-r border-gray-100 font-medium">생년월일</th>
                            <th className="py-4 px-2 w-[10%] border-r border-gray-100 font-medium">이메일</th>
                            <th className="py-4 px-2 w-[12%] border-r border-gray-100 font-medium">주소</th>
                            <th className="py-4 px-2 w-[12%] border-r border-gray-100 font-black text-blue-600">반려견스타일리스트 자격증 번호</th>
                            <th className="py-4 px-2 w-[8%] border-r border-gray-100">소속</th>
                            <th className="py-4 px-2 w-[8%] border-r border-gray-100">참가유형</th>
                            <th className="py-4 px-2 w-[8%] border-r border-gray-100">모종</th>
                            <th className="py-4 px-2 w-[10%] border-r border-gray-100">종목</th>
                            <th className="py-4 px-2 w-[8%] border-r border-gray-100">입금 상태</th>
                            <th className="py-4 px-2 w-[10%]">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {applicants.length > 0 ? applicants.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                                <td className="py-4 px-2 border-r border-gray-50 text-[11px] text-gray-400">{item.handler_id || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 font-bold">{item.name}</td>
                                <td className="py-4 px-2 border-r border-gray-50">{item.contact || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 text-gray-500">{item.birthdate || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 text-gray-500 text-left truncate">{item.email || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 text-gray-500 text-left truncate" title={item.address}>{item.address || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 font-black text-blue-600 uppercase">{item.license_number || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50">{item.affiliation || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 font-bold">{item.entry_type || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50">{item.dog_breed || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50 font-medium">{item.entry_category || '-'}</td>
                                <td className="py-4 px-2 border-r border-gray-50">
                                    <span className={`px-2 py-1 rounded text-[11px] font-black ${item.payment_status === '입금완료' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                                        {item.payment_status}
                                    </span>
                                </td>
                                <td className="py-4 px-2">
                                    <div className="flex justify-center gap-1.5">
                                        <button onClick={() => handleOpenModal(item)} className="px-3 py-1 bg-white border border-gray-200 rounded text-[11px] font-bold text-gray-600 hover:bg-gray-50 transition-all">수정</button>
                                        <button onClick={() => handleDelete(item.id, item.name)} className="px-3 py-1 bg-red-50 border border-red-100 rounded text-[11px] font-bold text-red-500 hover:bg-red-100 transition-all">삭제</button>
                                    </div>
                                </td>
                            </tr>
                        )) : !isLoading && (
                            <tr>
                                <td colSpan={13} className="py-32 text-center text-gray-400 font-bold">등록된 신청자가 없습니다.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center px-10 py-8 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="text-[22px] font-black tracking-tight text-gray-900">{editTargetId ? '신청 정보 수정' : '신규 신청 등록'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-white rounded-full"><X size={28} /></button>
                        </div>

                        <div className="p-10 overflow-y-auto space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[14px] font-black text-gray-500">아이디 (ID)</label>
                                    <div className="flex gap-2">
                                        <input type="text" className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-[15px] font-bold focus:border-blue-500 outline-none" value={formData.handler_id} onChange={e => setFormData({ ...formData, handler_id: e.target.value })} placeholder="회원 ID" />
                                        <button onClick={handleSearchMember} disabled={isSearchingMember} className="px-5 bg-gray-800 text-white rounded-xl font-bold flex items-center gap-2">
                                            {isSearchingMember ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} 조회
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[14px] font-black text-gray-500">이름 *</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[15px] font-bold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="신청자 성함" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[14px] font-black text-gray-500">연락처</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[15px] font-bold" value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} placeholder="010-0000-0000" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[14px] font-black text-gray-500">생년월일</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[15px] font-bold" value={formData.birthdate} onChange={e => setFormData({ ...formData, birthdate: e.target.value })} placeholder="YYYY-MM-DD" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[14px] font-black text-gray-500">이메일</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[15px] font-bold" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="example@mail.com" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[14px] font-black text-gray-500">주소</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[15px] font-bold" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="상세 주소" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[14px] font-black text-blue-600">반려견스타일리스트 자격증 번호</label>
                                    <input type="text" className="w-full border border-blue-200 bg-blue-50/30 rounded-xl px-4 py-3 text-[15px] font-black text-blue-700 uppercase" value={formData.license_number} onChange={e => setFormData({ ...formData, license_number: e.target.value.toUpperCase() })} placeholder="자격증 번호 입력" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[14px] font-black text-gray-500">소속</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[15px] font-bold" value={formData.affiliation} onChange={e => setFormData({ ...formData, affiliation: e.target.value })} placeholder="소속 단체" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[14px] font-black text-gray-500">참가유형</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[15px] font-bold bg-white focus:border-blue-500 outline-none"
                                        value={formData.entry_type}
                                        onChange={e => setFormData({ ...formData, entry_type: e.target.value })}
                                    >
                                        <option value="">참가유형 선택</option>
                                        <option value="Level C">Level C</option>
                                        <option value="Level B">Level B</option>
                                        <option value="Level A">Level A</option>
                                        <option value="살롱프리스타일 실견">살롱프리스타일 실견</option>
                                        <option value="아트">아트</option>
                                        <option value="그외 순수견종">그외 순수견종</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[14px] font-black text-gray-500">모종</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[15px] font-bold bg-white focus:border-blue-500 outline-none"
                                        value={formData.dog_breed}
                                        onChange={e => setFormData({ ...formData, dog_breed: e.target.value })}
                                    >
                                        <option value="">모종 선택</option>
                                        <option value="위그">위그</option>
                                        <option value="실견">실견</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[14px] font-black text-gray-500">종목</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[15px] font-bold bg-white focus:border-blue-500 outline-none"
                                        value={formData.entry_category}
                                        onChange={e => setFormData({ ...formData, entry_category: e.target.value })}
                                    >
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
                            </div>

                            <div className="pt-6 border-t border-gray-100">
                                <label className="text-[14px] font-black text-gray-500 mb-4 block">입금 상태</label>
                                <div className="flex gap-4">
                                    <button onClick={() => setFormData({ ...formData, payment_status: '미입금' })} className={`flex-1 py-4 border rounded-2xl text-[15px] font-bold transition-all ${formData.payment_status === '미입금' ? 'bg-gray-800 border-gray-800 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-300'}`}>미입금</button>
                                    <button onClick={() => setFormData({ ...formData, payment_status: '입금완료' })} className={`flex-1 py-4 border rounded-2xl text-[15px] font-bold transition-all ${formData.payment_status === '입금완료' ? 'bg-[#009292] border-[#009292] text-white shadow-lg' : 'bg-white border-gray-200 text-gray-300'}`}>{formData.payment_status === '입금완료' && <Check size={18} className="inline mr-2" />}입금완료</button>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 bg-gray-50 border-t border-gray-100 flex gap-4">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-white border border-gray-300 text-gray-500 rounded-2xl font-black text-[16px]">취소</button>
                            <button onClick={handleSave} disabled={isSubmitting} className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[16px] flex items-center justify-center gap-3">
                                {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : '최종 저장 완료'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
