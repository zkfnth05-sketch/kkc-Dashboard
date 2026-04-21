import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Loader2, X, Check } from 'lucide-react';
import { fetchApplicants, createApplicant, deleteApplicant, updateApplicant } from '../services/eventService';
import { fetchMembers } from '../services/memberService';
import { Search } from 'lucide-react';

interface Applicant {
    id: string; // frontend component uses id
    uid?: string; // backend uses uid
    ds_pid: string;
    name: string;
    contact: string;
    reg_no: string;
    payment_status: '미입금' | '입금완료';
    handler_id?: string;
    total_amount?: number | string;
    options_summary?: string; // 신청 옵션 요약
}

interface CompetitionApplicantManagementProps {
    competitionId: string | number;
    competitionTitle: string;
    onClose: () => void;
    applicantTable?: string;
    showAlert: (title: string, message: string) => void;
    showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export const CompetitionApplicantManagement: React.FC<CompetitionApplicantManagementProps> = ({
    competitionId,
    competitionTitle,
    onClose,
    applicantTable = 'dogshow_applicant',
    showAlert,
    showConfirm
}) => {
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editTargetId, setEditTargetId] = useState<string | null>(null);
    const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);
    const [selectedOptionsApp, setSelectedOptionsApp] = useState<Applicant | null>(null); // 신청 옵션 팝업용

    // Form states
    const [formName, setFormName] = useState('');
    const [formContact, setFormContact] = useState('');
    const [formPedigree, setFormPedigree] = useState('');
    const [formHandlerId, setFormHandlerId] = useState('');
    const [formTotalAmount, setFormTotalAmount] = useState<string | number>('0');
    const [formPayment, setFormPayment] = useState<'미입금' | '입금완료'>('미입금');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearchingDog, setIsSearchingDog] = useState(false);

    // ds_pid에서 숫자만 추출 (ex: ds_5042 -> 5042)
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
            const res = await fetchApplicants(parsedDsPid, applicantTable);
            if (res.data) {
                // 백엔드에서 uid로 넘어올 경우 id로 매핑
                const mappedData = res.data.map((item: any) => ({
                    ...item,
                    id: item.uid || item.id,
                }));
                setApplicants(mappedData);
            }
        } catch (e: any) {
            showAlert('오류', '신청자 목록을 불러오지 못했습니다: ' + e.message);
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
            setFormName(applicant.name);
            setFormContact(applicant.contact || '');
            setFormPedigree((applicant as any).pedigree_number || applicant.reg_no || '');
            setFormHandlerId(applicant.handler_id || '');
            setFormTotalAmount(applicant.total_amount || 0);
            setFormPayment(applicant.payment_status || '미입금');
        } else {
            setEditTargetId(null);
            setFormName('');
            setFormContact('');
            setFormPedigree('');
            setFormHandlerId('');
            setFormTotalAmount(0);
            setFormPayment('미입금');
        }
        setIsModalOpen(true);
    };

    const handleSearchDog = async () => {
        if (!formPedigree.trim()) {
            showAlert('알림', '혈통서 등록번호를 입력해주세요.');
            return;
        }

        setIsSearchingDog(true);
        try {
            const res = await fetchMembers('dogTab', 1, formPedigree.trim(), 'reg_no', 1);
            if (res.data && res.data.length > 0) {
                const dog = res.data[0];
                setFormName(dog.poss_name || formName);
                setFormContact(dog.poss_phone || formContact);
                showAlert('조회 성공', `'${dog.name}'(소유자: ${dog.poss_name}) 정보를 불러왔습니다.`);
            } else {
                showAlert('조회 실패', '해당 등록번호를 가진 견 정보를 찾을 수 없습니다.');
            }
        } catch (e: any) {
            showAlert('오류', '조회 중 오류가 발생했습니다.');
        } finally {
            setIsSearchingDog(false);
        }
    };

    const [isSearchingMember, setIsSearchingMember] = useState(false);
    const handleSearchMember = async () => {
        if (!formHandlerId.trim()) {
            showAlert('알림', '회원 ID를 입력해주세요.');
            return;
        }

        setIsSearchingMember(true);
        try {
            const res = await fetchMembers('memTab', 1, formHandlerId.trim(), 'id', 1);
            if (res.data && res.data.length > 0) {
                const member = res.data[0];
                setFormName(member.name || formName);
                setFormContact(member.hp || member.tel || formContact);
                showAlert('조회 성공', `'${member.name}' 회원의 정보를 불러왔습니다.`);
            } else {
                showAlert('조회 실패', '해당 ID를 가진 회원 정보를 찾을 수 없습니다.');
            }
        } catch (e: any) {
            showAlert('오류', '조회 중 오류가 발생했습니다.');
        } finally {
            setIsSearchingMember(false);
        }
    };

    const handleSave = async () => {
        if (!formName.trim()) {
            showAlert('오류', '신청자 이름을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const isBreedExam = applicantTable === 'breed_exam_applicant';
            
            const payload: any = {
                ds_pid: parsedDsPid,
                name: formName,
                contact: formContact,
                handler_id: formHandlerId,
                total_amount: formTotalAmount,
                payment_status: formPayment
            };

            // 🚀 [PEDIGREE FIELD MAPPING] 테이블마다 컬럼명이 다릅니다.
            if (isBreedExam) {
                payload.pedigree_number = formPedigree;
            } else {
                payload.reg_no = formPedigree;
            }

            let res;
            if (editTargetId) {
                res = await updateApplicant({ ...payload, uid: editTargetId }, applicantTable);
            } else {
                res = await createApplicant(payload, applicantTable);
            }
            
            if (res.success) {
                showAlert('성공', editTargetId ? '신청자 정보가 수정되었습니다.' : '신청자가 추가되었습니다.');
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
        showConfirm('신청자 삭제', `'${name}' 신청자를 삭제하시겠습니까 ? `, async () => {
            setIsLoading(true);
            try {
                const res = await deleteApplicant(id, applicantTable);
                if (res.success) {
                    showAlert('성공', '삭제되었습니다.');
                    loadData();
                } else {
                    throw new Error(res.error);
                }
            } catch (e: any) {
                showAlert('오류', '삭제에 실패했습니다: ' + e.message);
            } finally {
                setIsLoading(false);
            }
        });
    };

    // 💰 [QUICK PAYMENT TOGGLE]
    const handleTogglePayment = async (item: Applicant) => {
        const nextStatus = item.payment_status === '입금완료' ? '미입금' : '입금완료';
        const msg = nextStatus === '입금완료' ? `'${item.name}' 신청자를 입금 완료 처리하시겠습니까?` : `'${item.name}' 신청자를 다시 미입금 상태로 변경하시겠습니까?`;
        
        showConfirm('입금 상태 변경', msg, async () => {
            setIsLoading(true);
            try {
                const payload = {
                    uid: item.id,
                    payment_status: nextStatus
                };
                const res = await updateApplicant(payload, applicantTable);
                if (res.success) {
                    loadData();
                } else {
                    throw new Error(res.error);
                }
            } catch (e: any) {
                showAlert('오류', '상태 변경에 실패했습니다: ' + e.message);
            } finally {
                setIsLoading(false);
            }
        });
    };

    const isSavingDone = parsedDsPid > 0;

    return (
        <div className="flex flex-col h-full bg-white p-6 font-sans text-gray-800 animate-in fade-in duration-300">
            {/* HEADER */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-800 transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-[24px] font-black tracking-tight flex items-center gap-3">
                    신청자 관리
                    <span className="text-[14px] font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                        {competitionTitle}
                    </span>
                </h2>
                {isSavingDone ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-[12px] font-bold text-gray-600 hover:bg-gray-100 transition-colors shadow-sm"
                        >
                            <Plus size={14} strokeWidth={3} /> 신청자 추가
                        </button>
                        <button
                            onClick={() => setShowUnpaidOnly(!showUnpaidOnly)}
                            className={`px-3 py-1.5 rounded text-[12px] font-bold transition-all shadow-sm ${showUnpaidOnly ? 'bg-orange-500 text-white border border-orange-500' : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                        >
                            {showUnpaidOnly ? '전체 보기' : '미입금자만 보기'}
                        </button>
                    </div>
                ) : (
                    <span className="text-red-500 text-[12px] font-bold ml-2">유효하지 않은 대회 ID입니다</span>
                )}
            </div>

            {/* TABLE DATA */}
            <div className="flex-1 overflow-auto border border-gray-100 rounded-lg relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/60 z-30 flex items-center justify-center">
                        <Loader2 className="animate-spin text-blue-500" size={40} />
                    </div>
                )}
                <table className="w-full text-[13px] border-collapse text-center">
                    <thead>
                        <tr className="bg-[#f8f9fa] border-b border-gray-200 text-gray-600 font-bold sticky top-0 z-10 shadow-sm">
                            <th className="py-4 px-4 w-[12%]">이름</th>
                            <th className="py-4 px-4 w-[12%]">회원 ID</th>
                            <th className="py-4 px-4 w-[15%]">연락처</th>
                            <th className="py-4 px-4 w-[15%]">혈통서 번호</th>
                            <th className="py-4 px-4 w-[10%]">참가비</th>
                            <th className="py-4 px-4 w-[10%]">신청옵션</th>
                            <th className="py-4 px-4 w-[10%]">입금상태</th>
                            <th className="py-4 px-4 w-[15%]">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {applicants
                            .filter(app => !showUnpaidOnly || app.payment_status === '미입금')
                            .length > 0 ? applicants
                            .filter(app => !showUnpaidOnly || app.payment_status === '미입금')
                            .map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 px-4 font-bold">{item.name}</td>
                                <td className="py-4 px-4 font-bold text-blue-600 font-mono text-[12px]">{item.handler_id || '-'}</td>
                                <td className="py-4 px-4">{item.contact || '-'}</td>
                                <td className="py-4 px-4 font-black text-slate-700 tracking-tighter">{(item as any).pedigree_number || item.reg_no || '-'}</td>
                                <td className="py-4 px-4 font-bold text-teal-600">
                                    {item.total_amount ? Number(item.total_amount).toLocaleString() : 0}원
                                </td>
                                <td className="py-4 px-4">
                                    {item.options_summary ? (
                                        <button
                                            onClick={() => setSelectedOptionsApp(item)}
                                            className="inline-flex items-center px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-[8px] text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition-colors max-w-[90px] truncate"
                                            title={item.options_summary}
                                        >
                                            옵션보기
                                        </button>
                                    ) : (
                                        <span className="text-gray-300 text-[12px]">-</span>
                                    )}
                                </td>
                                <td className="py-4 px-4">
                                    <button
                                        onClick={() => handleTogglePayment(item)}
                                        className={`inline-flex items-center justify-center px-4 py-1.5 border rounded-[10px] text-[12px] font-black transition-all active:scale-95 shadow-sm hover:shadow-md ${
                                            item.payment_status === '입금완료' 
                                            ? 'bg-teal-500 border-teal-500 text-white' 
                                            : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        {item.payment_status === '입금완료' ? <Check size={14} className="mr-1" /> : null}
                                        {item.payment_status}
                                    </button>
                                </td>
                                <td className="py-4 px-4">
                                    <div className="flex justify-center gap-1.5">
                                        <button
                                            onClick={() => handleOpenModal(item)}
                                            className="px-4 py-1.5 bg-gray-50 border border-gray-200 rounded text-[12px] font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                                        >
                                            수정
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id, item.name)}
                                            className="px-4 py-1.5 bg-[#fff0f0] border border-[#ffcdd2] rounded text-[12px] font-bold text-[#e53935] hover:bg-[#ffebee] transition-colors"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : !isLoading && (
                            <tr>
                                <td colSpan={5} className="py-32 text-center text-gray-400">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-[14px]">등록된 신청자가 없습니다.</span>
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
                            <button onClick={() => setSelectedOptionsApp(null)} className="text-gray-400 hover:text-gray-600 p-1">
                                <X size={18} />
                            </button>
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
                            <button onClick={() => setSelectedOptionsApp(null)} className="w-full py-2.5 bg-gray-800 text-white rounded-lg font-bold text-[13px] hover:bg-gray-700 transition-colors">
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 font-sans backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-[#f8f9fa]">
                            <h3 className="text-[18px] font-black tracking-tight text-gray-800">
                                {editTargetId ? '신청자 수정' : '신청자 추가'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-600">이름 <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    placeholder="신청자 이름 입력"
                                    className="w-full border border-gray-300 rounded px-4 py-2.5 text-[14px] text-gray-700 outline-none focus:border-blue-500 shadow-sm transition-colors"
                                    value={formName}
                                    onChange={e => setFormName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-600">연락처</label>
                                <input
                                    type="text"
                                    placeholder="연락처 (선택)"
                                    className="w-full border border-gray-300 rounded px-4 py-2.5 text-[14px] text-gray-700 outline-none focus:border-blue-500 shadow-sm transition-colors"
                                    value={formContact}
                                    onChange={e => setFormContact(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-600">회원 ID (검색)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="회원 아이디 입력"
                                        className="flex-1 border border-gray-300 rounded px-4 py-2.5 text-[14px] text-gray-700 outline-none focus:border-blue-500 shadow-sm transition-colors"
                                        value={formHandlerId}
                                        onChange={e => setFormHandlerId(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSearchMember}
                                        disabled={isSearchingMember}
                                        className="px-4 bg-blue-600 text-white rounded font-bold text-[12px] hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm disabled:opacity-50"
                                    >
                                        {isSearchingMember ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} 조회
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-600">참가비/결제금액</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full border border-gray-300 rounded px-4 py-2.5 pr-10 text-[14px] text-gray-700 font-bold outline-none focus:border-blue-500 shadow-sm transition-colors"
                                        value={formTotalAmount}
                                        onChange={e => setFormTotalAmount(e.target.value)}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[12px]">원</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-600">혈통서 등록번호</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="등록번호 (선택)"
                                        className="flex-1 border border-gray-300 rounded px-4 py-2.5 text-[14px] text-gray-700 outline-none focus:border-blue-500 shadow-sm transition-colors uppercase"
                                        value={formPedigree}
                                        onChange={e => setFormPedigree(e.target.value.toUpperCase())}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSearchDog}
                                        disabled={isSearchingDog}
                                        className="px-4 bg-gray-800 text-white rounded font-bold text-[12px] hover:bg-gray-700 transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm disabled:opacity-50"
                                    >
                                        {isSearchingDog ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} 조회
                                    </button>
                                </div>
                            </div>

                            {/* 신청 옵션 읽기 전용 표시 */}
                            {editTargetId && applicants.find(a => a.id === editTargetId)?.options_summary && (
                                <div className="space-y-2">
                                    <label className="text-[13px] font-bold text-gray-600">신청 옵션 (읽기 전용)</label>
                                    <div className="bg-blue-50 border border-blue-100 rounded px-4 py-3 text-[13px] text-blue-800 font-medium leading-relaxed whitespace-pre-wrap">
                                        {applicants.find(a => a.id === editTargetId)?.options_summary}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[13px] font-bold text-gray-600">입금 상태</label>
                                <div className="flex gap-3">
                                    <label className={`flex - 1 flex items - center justify - center gap - 2 py - 2.5 border rounded cursor - pointer transition - colors ${formPayment === '미입금' ? 'bg-gray-800 border-gray-800 text-white font-bold' : 'bg-gray-50 border-gray-200 text-gray-600 font-medium hover:bg-gray-100'} `}>
                                        <input
                                            type="radio"
                                            className="hidden"
                                            checked={formPayment === '미입금'}
                                            onChange={() => setFormPayment('미입금')}
                                        />
                                        미입금
                                    </label>
                                    <label className={`flex - 1 flex items - center justify - center gap - 2 py - 2.5 border rounded cursor - pointer transition - colors ${formPayment === '입금완료' ? 'bg-[#009292] border-[#009292] text-white font-bold' : 'bg-gray-50 border-gray-200 text-gray-600 font-medium hover:bg-gray-100'} `}>
                                        <input
                                            type="radio"
                                            className="hidden"
                                            checked={formPayment === '입금완료'}
                                            onChange={() => setFormPayment('입금완료')}
                                        />
                                        {formPayment === '입금완료' && <Check size={16} />} 입금완료
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 p-6 pt-2 bg-white">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-md font-bold text-[14px] hover:bg-gray-200 transition-colors"
                                disabled={isSubmitting}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSubmitting}
                                className="flex-[2] px-4 py-3 bg-blue-600 text-white rounded-md font-bold text-[14px] hover:bg-blue-700 shadow-md transition-colors flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
                                {isSubmitting ? '저장 중...' : '저장하기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
