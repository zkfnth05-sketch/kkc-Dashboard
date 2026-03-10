
/**
 * ============================================================================
 * [경고] 
 * 이 페이지는 완전히 완성된 페이지입니다.
 * 진행 중인 수정 작업에서 이 파일은 절대 건드리지 마십시오. (DO NOT MODIFY)
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import { Search, Plus, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, X, Save, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { Evaluation, ParentDogInfo } from '../types';
import { fetchEvaluations, updatePedigree, fetchDogsByRegNos, createRecord, deletePoint } from '../services/memberService';

// 🔴 삭제 확인용 커스텀 모달
const DeleteConfirmModal: React.FC<{ onConfirm: () => void, onCancel: () => void }> = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden border animate-in zoom-in-95">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-4 text-red-600">
                    <AlertCircle size={24} />
                    <h3 className="text-lg font-bold">삭제 확인</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                    정말로 이 종견 인정 평가 내역을 삭제하시겠습니까?<br />
                    삭제 시 혈통서의 종견 인정 정보도 함께 초기화됩니다.
                </p>
            </div>
            <div className="bg-gray-50 p-4 flex justify-end gap-2 border-t">
                <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded transition-colors">취소</button>
                <button onClick={onConfirm} className="px-6 py-2 text-sm font-bold bg-red-600 text-white rounded hover:bg-red-700 shadow-sm transition-all active:scale-95">삭제 실행</button>
            </div>
        </div>
    </div>
);

// 🟢 공통 모달 컴포넌트 (추가/수정 겸용)
export const EvaluationModal: React.FC<{
    mode: 'add' | 'edit',
    initialData?: Evaluation,
    onClose: () => void,
    onSave: (data: Evaluation) => Promise<void>
}> = ({ mode, initialData, onClose, onSave }) => {
    const [formData, setFormData] = useState<Evaluation>(
        initialData || { id: '', name: '', breed: '', regNo: '', judge: '', startDate: '', endDate: '', memo: '' }
    );
    const [isSaving, setIsSaving] = useState(false);
    const [checkStatus, setCheckStatus] = useState<'idle' | 'loading' | 'success' | 'fail'>('idle');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try { await onSave(formData); } finally { setIsSaving(false); }
    };

    const handleChange = (field: keyof Evaluation, val: string) => {
        setFormData(prev => ({ ...prev, [field]: val }));
        if (field === 'regNo') setCheckStatus('idle');
    };

    const handleRegNoCheck = async () => {
        if (!formData.regNo.trim()) return;
        setCheckStatus('loading');
        try {
            const results = await fetchDogsByRegNos([formData.regNo], 'dogTab');
            // [STABLE: FIX_TYPE_ERROR] Cast Object.values results to ParentDogInfo
            const foundDog = Object.values(results)[0] as ParentDogInfo | undefined;

            if (foundDog) {
                setCheckStatus('success');
                setFormData(prev => ({
                    ...prev,
                    name: foundDog.fullname || foundDog.name || prev.name,
                    breed: foundDog.dog_class || prev.breed
                }));
            } else {
                setCheckStatus('fail');
            }
        } catch (e) {
            setCheckStatus('fail');
        }
    };

    const Label = ({ children }: React.PropsWithChildren<{}>) => (
        <div className="text-[15px] font-medium text-gray-500 mb-2">
            {children}
        </div>
    );

    const inputClasses = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-400 bg-white transition-all";

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95">
                <div className="px-6 py-5 flex justify-between items-center border-b border-gray-100">
                    <h2 className="text-[19px] font-bold text-gray-800">
                        종견 인정 평가 {mode === 'add' ? '추가' : '수정'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors"><X size={22} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-7 space-y-6">
                    <div>
                        <Label>이름</Label>
                        <input type="text" className={inputClasses} value={formData.name} onChange={(e) => handleChange('name', e.target.value)} />
                    </div>
                    <div>
                        <Label>견종</Label>
                        <input type="text" className={inputClasses} value={formData.breed} onChange={(e) => handleChange('breed', e.target.value)} />
                    </div>
                    <div>
                        <Label>등록번호</Label>
                        <div className="flex gap-2 mb-1.5">
                            <input type="text" className={`${inputClasses} ${checkStatus === 'success' ? 'border-green-500' : checkStatus === 'fail' ? 'border-red-500' : ''}`} value={formData.regNo} onChange={(e) => handleChange('regNo', e.target.value)} />
                            <button type="button" onClick={handleRegNoCheck} disabled={checkStatus === 'loading'} className="bg-[#5cb85c] hover:bg-[#4cae4c] text-white px-4 py-2 rounded-md text-[13px] font-bold shrink-0 shadow-sm flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50">
                                {checkStatus === 'loading' ? <Loader2 size={14} className="animate-spin" /> : null} 번호 확인
                            </button>
                        </div>
                        <div className="h-5 px-1">
                            {checkStatus === 'success' && <p className="text-[12px] font-bold text-green-600 flex items-center gap-1"><CheckCircle2 size={12} /> 등록된 애견입니다.</p>}
                            {checkStatus === 'fail' && <p className="text-[12px] font-bold text-red-500 flex items-center gap-1"><AlertCircle size={12} /> 등록되지 않은 애견입니다.</p>}
                        </div>
                    </div>
                    <div>
                        <Label>심사위원</Label>
                        <input type="text" className={inputClasses} value={formData.judge} onChange={(e) => handleChange('judge', e.target.value)} />
                    </div>
                    <div>
                        <Label>시작일</Label>
                        <input type="text" className={inputClasses} value={formData.startDate} onChange={(e) => handleChange('startDate', e.target.value)} placeholder="YYYY-MM 또는 자유 형식" />
                    </div>
                    <div>
                        <Label>종료일</Label>
                        <input type="text" className={inputClasses} value={formData.endDate} onChange={(e) => handleChange('endDate', e.target.value)} placeholder="YYYY-MM 또는 자유 형식" />
                    </div>
                    <div>
                        <Label>비고 (comment)</Label>
                        <textarea className={`${inputClasses} h-28 resize-none py-3`} value={formData.memo || ''} onChange={(e) => handleChange('memo', e.target.value)} />
                    </div>
                    <div className="pt-4 flex justify-end gap-2 border-t border-gray-50 -mx-7 px-7 mt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-[#6c757d] hover:bg-[#5a6268] text-white font-bold rounded-md text-[14px]">취소</button>
                        <button type="submit" disabled={isSaving} className="px-8 py-2 bg-[#28a745] hover:bg-[#218838] text-white font-bold rounded-md text-[14px] shadow-sm transition-all flex items-center justify-center gap-2">
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : null} {mode === 'add' ? '추가' : '저장'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const EvaluationPage: React.FC = () => {
    const [data, setData] = useState<Evaluation[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchField, setSearchField] = useState('regNo');
    const [searchQuery, setSearchQuery] = useState('');
    const [editingItem, setEditingItem] = useState<Evaluation | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [deletingItem, setDeletingItem] = useState<Evaluation | null>(null);

    const loadData = async (page: number = 1, query: string = '', field: string = 'regNo') => {
        setIsLoading(true);
        try {
            const res = await fetchEvaluations(page, query, field);
            setData(res.data);
            setTotalCount(res.total);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadData(1); }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        loadData(1, searchQuery, searchField);
    };

    const handlePageChange = (p: number) => {
        setCurrentPage(p);
        loadData(p, searchQuery, searchField);
    };

    const handleSaveEvaluation = async (updated: Evaluation) => {
        try {
            const isUpdate = !!updated.id;
            let res;
            if (isUpdate) {
                res = await updatePedigree('breed_dogTab', updated);
            } else {
                const insertData = {
                    reg_no: updated.regNo,
                    dog_name: updated.name,
                    dog_class: updated.breed,
                    referee: updated.judge,
                    start_date: updated.startDate,
                    end_date: updated.endDate,
                    comment: updated.memo,
                    signdate: Math.floor(Date.now() / 1000)
                };
                res = await createRecord('breed_dogTab', insertData);
            }

            if (res.success && updated.regNo) {
                const dogs = await fetchDogsByRegNos([updated.regNo], 'dogTab');
                // [STABLE: FIX_TYPE_ERROR] Cast Object.values results to ParentDogInfo
                const dog = Object.values(dogs)[0] as ParentDogInfo | undefined;
                if (dog && dog.uid) {
                    await updatePedigree('dogTab', { uid: dog.uid, okDate: updated.startDate } as any);
                }
            }

            if (res.success) {
                setEditingItem(null);
                setIsAdding(false);
                loadData(currentPage, searchQuery, searchField);
            } else {
                throw new Error(res.error || "DB 저장 중 오류가 발생했습니다.");
            }
        } catch (e: any) {
            alert("처리 중 오류가 발생했습니다: " + e.message);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingItem) return;
        setIsLoading(true);
        try {
            const res = await deletePoint('breed_dogTab', deletingItem.id);
            if (res.success && deletingItem.regNo) {
                const dogs = await fetchDogsByRegNos([deletingItem.regNo], 'dogTab');
                // [STABLE: FIX_TYPE_ERROR] Cast Object.values results to ParentDogInfo
                const dog = Object.values(dogs)[0] as ParentDogInfo | undefined;
                if (dog && dog.uid) {
                    await updatePedigree('dogTab', { uid: dog.uid, okDate: '' } as any);
                }
            }
            // [STABLE: FIX_RUNTIME_ERROR] setDeletingId -> setDeletingItem
            setDeletingItem(null);
            loadData(currentPage, searchQuery, searchField);
        } catch (e: any) {
            alert("삭제 중 오류가 발생했습니다: " + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const totalPages = Math.ceil(totalCount / 20);
    const getPages = () => {
        const pages = [];
        const start = Math.max(1, currentPage - 2);
        const end = Math.min(totalPages, start + 4);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    return (
        <div className="flex flex-col h-full bg-white font-sans p-8 overflow-y-auto">
            <div className="mb-6"><h2 className="text-2xl font-bold text-gray-800">종견 인정 평가</h2></div>
            <div className="flex justify-between items-center mb-6">
                <form onSubmit={handleSearch} className="flex items-center gap-1">
                    <div className="relative">
                        <select className="border border-gray-300 rounded-sm px-4 pr-10 py-2 text-sm h-11 min-w-[140px] appearance-none focus:outline-none focus:border-blue-400 bg-white cursor-pointer font-medium" value={searchField} onChange={(e) => setSearchField(e.target.value)}>
                            <option value="regNo">등록번호</option>
                            <option value="name">견명</option>
                            <option value="breed">견종</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                    <input type="text" placeholder="검색어를 입력하세요" className="border border-gray-300 rounded-sm px-4 py-2 text-sm h-11 w-[350px] outline-none focus:border-blue-400 transition-all shadow-inner" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    <button type="submit" className="bg-[#007bff] hover:bg-[#0069d9] text-white px-8 h-11 text-sm font-bold rounded-sm transition-colors active:scale-95 shadow-sm">검색</button>
                </form>
                <div className="text-[15px] text-gray-700 font-medium">총 <span className="font-bold text-gray-900">{totalCount.toLocaleString()}</span>건의 데이터가 있습니다.</div>
            </div>
            <div className="flex justify-end mb-4">
                <button onClick={() => setIsAdding(true)} className="bg-[#4CAF50] hover:bg-[#43A047] text-white px-5 py-2.5 rounded-sm text-sm font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95">
                    <Plus size={16} /> 추가하기
                </button>
            </div>
            <div className="flex-1 overflow-x-auto border border-gray-200 rounded-sm bg-white min-h-[500px] relative shadow-sm">
                {isLoading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]"><Loader2 className="animate-spin text-blue-600" size={40} /></div>}
                <table className="w-full text-[14px] text-left border-collapse border-hidden">
                    <thead>
                        <tr className="bg-[#f8f9fa] text-gray-700">
                            <th className="py-4 px-6 font-bold text-center border border-gray-200">이름</th>
                            <th className="py-4 px-6 font-bold text-center border border-gray-200">견종</th>
                            <th className="py-4 px-6 font-bold text-center border border-gray-200">등록번호</th>
                            <th className="py-4 px-6 font-bold text-center border border-gray-200">심사위원</th>
                            <th className="py-4 px-6 font-bold text-center border border-gray-200">인정기간</th>
                            <th className="py-4 px-6 font-bold text-center border border-gray-200">비고</th>
                            <th className="py-4 px-6 font-bold text-center border border-gray-200">관리</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.length > 0 ? data.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="py-3 px-6 text-center border border-gray-100 text-gray-800">{item.name}</td>
                                <td className="py-3 px-6 text-center border border-gray-100 text-gray-800">{item.breed}</td>
                                <td className="py-3 px-6 text-center border border-gray-100 text-gray-800 font-medium">{item.regNo}</td>
                                <td className="py-3 px-6 text-center border border-gray-100 text-gray-800">{item.judge}</td>
                                <td className="py-3 px-6 text-center border border-gray-100 text-gray-800 font-mono text-[13px]">{item.startDate} ~ {item.endDate}</td>
                                <td className="py-3 px-6 text-center border border-gray-100 text-gray-800">{item.memo || '-'}</td>
                                <td className="py-3 px-6 text-center border border-gray-100">
                                    <div className="flex justify-center gap-1.5">
                                        <button onClick={() => setEditingItem(item)} className="bg-[#007bff] hover:bg-[#0069d9] text-white px-3 py-1.5 rounded-sm text-xs font-bold transition-all shadow-sm">수정</button>
                                        <button onClick={() => setDeletingItem(item)} className="bg-[#dc3545] hover:bg-[#c82333] text-white px-3 py-1.5 rounded-sm text-xs font-bold transition-all shadow-sm">삭제</button>
                                    </div>
                                </td>
                            </tr>
                        )) : !isLoading && (<tr><td colSpan={7} className="py-32 text-center text-gray-400">조회된 평가 데이터가 없습니다.</td></tr>)}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-center mt-10 gap-1 pb-10 select-none">
                <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} className="w-9 h-9 flex items-center justify-center border border-gray-200 text-gray-400 hover:bg-gray-50 rounded-sm disabled:opacity-30"><ChevronsLeft size={16} /></button>
                <button onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="w-9 h-9 flex items-center justify-center border border-gray-200 text-gray-400 hover:bg-gray-50 rounded-sm disabled:opacity-30"><ChevronLeft size={16} /></button>
                {getPages().map(p => (
                    <button key={p} onClick={() => handlePageChange(p)} className={`w-9 h-9 flex items-center justify-center rounded border text-[14px] font-bold transition-all ${currentPage === p ? 'bg-[#007bff] text-white border-[#007bff] shadow-md' : 'bg-white text-blue-600 border-gray-200 hover:bg-gray-50'}`}>{p}</button>
                ))}
                <button onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-sm hover:bg-gray-50 text-gray-400 disabled:opacity-30"><ChevronRight size={16} /></button>
                <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} className="w-9 h-9 flex items-center justify-center border border-gray-200 text-gray-400 hover:bg-gray-50 rounded-sm disabled:opacity-30"><ChevronsRight size={16} /></button>
            </div>
            {isAdding && (<EvaluationModal mode="add" onClose={() => setIsAdding(false)} onSave={handleSaveEvaluation} />)}
            {editingItem && (<EvaluationModal mode="edit" initialData={editingItem} onClose={() => setEditingItem(null)} onSave={handleSaveEvaluation} />)}
            {deletingItem && (<DeleteConfirmModal onConfirm={handleDeleteConfirm} onCancel={() => setDeletingItem(null)} />)}
        </div>
    );
};
