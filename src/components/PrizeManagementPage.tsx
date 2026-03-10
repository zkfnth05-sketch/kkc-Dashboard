import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Loader2, AlertCircle, X } from 'lucide-react';
import { Prize } from '../types';
import { fetchPrizes, deletePoint, fetchDogsByRegNos, updatePedigree, fetchPrizesByRegNo, createPrize, updatePrize } from '../services/memberService';

const TABLE_NAME = 'prize_dogTab';

/**
 * 🎯 [🏆 상력 관리 로직]
 * 상력이 변동될 때마다 혈통서(dogTab)의 spec_win2 필드를 갱신합니다.
 */
const syncPrizeAwards = async (regNo: string) => {
    if (!regNo || regNo.trim() === "") return;
    const cleanRegNo = regNo.trim();
    try {
        console.log(`[Sync Prize] Dog ${cleanRegNo} prize sync to spec_win2 initiated.`);
        const allPrizes = await fetchPrizesByRegNo(cleanRegNo);

        // 요약 텍스트 생성: "대회명(점수), 대회명2(점수2)"
        const summary = allPrizes
            .map(p => `${p.dogShowName}(${p.points}점)`)
            .join(', ');

        const dogs = await fetchDogsByRegNos([cleanRegNo]);
        const dog = Object.values(dogs)[0];

        if (dog && (dog as any).uid) {
            // Identified by UID, Update spec_win2
            await updatePedigree('dogTab', {
                uid: (dog as any).uid,
                spec_win2: summary
            } as any);
            console.log(`[Sync Success] dogTab.spec_win2 updated for ${cleanRegNo}: ${summary}`);
        } else {
            console.warn(`[Sync Cancel] No dog found in dogTab with RegNo: ${cleanRegNo}`);
        }
    } catch (e: any) {
        console.error("[Sync Error] Failed to sync prize text to spec_win2:", e.message);
    }
};

const DeleteConfirmModal: React.FC<{ onConfirm: () => void, onCancel: () => void }> = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-lg shadow-2xl w-full max-sm overflow-hidden border animate-in zoom-in-95">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-4 text-red-600">
                    <AlertCircle size={24} strokeWidth={2.5} />
                    <h3 className="text-lg font-black">삭제 확인</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">정말로 이 상력 내역을 삭제하시겠습니까?<br />삭제 시 혈통서의 '수상경력 2(spec_win2)' 정보도 함께 갱신됩니다.</p>
            </div>
            <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t border-slate-100">
                <button onClick={onCancel} className="px-5 py-2 text-sm font-black text-slate-400 hover:text-slate-600 transition-colors">취소</button>
                <button onClick={onConfirm} className="px-8 py-2 text-sm font-black bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-md transition-all active:scale-95">삭제 실행</button>
            </div>
        </div>
    </div>
);

interface PrizeAddModalProps {
    onClose: () => void;
    onSave: (data: Partial<Prize>) => Promise<void>;
}

const PrizeAddModal: React.FC<PrizeAddModalProps> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Prize>>({
        regNo: '', dogShowName: '', date: '', location: '', judge: '', points: '', detail: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.regNo) return alert('등록번호를 입력해주세요.');
        setIsSaving(true);
        try { await onSave(formData); } finally { setIsSaving(false); }
    };
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-[500px] overflow-hidden animate-in zoom-in-95">
                <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">상력 추가</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-black transition-colors"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-1.5">등록번호 *</label>
                        <input type="text" className="w-full border border-slate-200 rounded-md px-4 h-11 outline-none focus:border-blue-500 transition-all font-medium" value={formData.regNo} onChange={e => setFormData({ ...formData, regNo: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-1.5">대회명</label>
                        <input type="text" className="w-full border border-slate-200 rounded-md px-4 h-11 outline-none focus:border-blue-500 transition-all font-medium" value={formData.dogShowName} onChange={e => setFormData({ ...formData, dogShowName: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-1.5">개최일</label>
                        <input type="text" className="w-full border border-slate-200 rounded-md px-4 h-11 outline-none focus:border-blue-500 transition-all font-medium" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} placeholder="예: 03/06/22" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-1.5">개최장소</label>
                        <input type="text" className="w-full border border-slate-200 rounded-md px-4 h-11 outline-none focus:border-blue-500 transition-all font-medium" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-1.5">심사위원</label>
                        <input type="text" className="w-full border border-slate-200 rounded-md px-4 h-11 outline-none focus:border-blue-500 transition-all font-medium" value={formData.judge} onChange={e => setFormData({ ...formData, judge: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-1.5">점수</label>
                        <input type="text" className="w-full border border-slate-200 rounded-md px-4 h-11 outline-none focus:border-blue-500 transition-all font-medium" value={formData.points} onChange={e => setFormData({ ...formData, points: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-1.5">비고 (comment)</label>
                        <textarea
                            className="w-full border border-slate-200 rounded-md px-4 py-3 h-28 outline-none focus:border-blue-500 transition-all font-medium resize-none shadow-sm"
                            value={formData.detail}
                            onChange={e => setFormData({ ...formData, detail: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-7 py-2.5 bg-slate-50 text-slate-500 font-bold rounded-md hover:bg-slate-100 transition-colors">취소</button>
                        <button type="submit" disabled={isSaving} className="px-10 py-2.5 bg-[#007bff] text-white rounded-md font-bold shadow-md hover:bg-blue-600 transition-all active:scale-95">
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : '저장'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export const PrizeManagementPage: React.FC = () => {
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [searchField, setSearchField] = useState('regNo');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [deletingPrize, setDeletingPrize] = useState<Prize | null>(null);
    const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const loadData = async (page: number = 1, query: string = '', field: string = 'regNo') => {
        setIsLoading(true);
        try {
            const res = await fetchPrizes(TABLE_NAME, page, query, field);
            setPrizes(res.data);
            setTotalCount(res.total);
        } catch (e: any) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadData(1); }, []);

    const handleSaveAdd = async (data: Partial<Prize>) => {
        try {
            const res = await createPrize(data);
            if (res.success) {
                if (data.regNo) await syncPrizeAwards(data.regNo);
                setIsAddModalOpen(false);
                loadData(1, searchQuery, searchField);
            }
        } catch (e: any) { alert('저장 실패: ' + e.message); }
    };

    const handleSaveEdit = async (updated: Prize) => {
        try {
            const res = await updatePrize(updated);
            if (res.success) {
                if (updated.regNo) await syncPrizeAwards(updated.regNo);
                setEditingPrize(null);
                loadData(currentPage, searchQuery, searchField);
            }
        } catch (e: any) { alert('수정 실패: ' + e.message); }
    };

    const handleDeleteConfirm = async () => {
        if (!deletingPrize) return;
        setIsLoading(true);
        try {
            const res = await deletePoint(TABLE_NAME, deletingPrize.id);
            if (res.success) {
                if (deletingPrize.regNo) await syncPrizeAwards(deletingPrize.regNo);
                setDeletingPrize(null);
                loadData(currentPage, searchQuery, searchField);
            }
        } catch (e: any) { alert('삭제 실패: ' + e.message); } finally { setIsLoading(false); }
    };

    const getPages = () => {
        const totalPages = Math.ceil(totalCount / 20);
        const pages = [];
        const start = Math.max(1, currentPage - 2);
        const end = Math.min(totalPages, start + 4);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 p-8 lg:p-12 overflow-y-auto relative font-sans">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">상력 관리</h2>
                    <p className="text-sm text-slate-400 mt-2 font-medium">혈통서의 수상경력 (spec_win2) 필드와 자동 연동됩니다.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-black shadow-lg shadow-blue-100 flex items-center gap-1.5 transition-all active:scale-95"
                >
                    <Plus size={18} strokeWidth={3} /> 추가
                </button>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 mb-8 shadow-sm flex items-center gap-3">
                <div className="relative">
                    <select
                        className="appearance-none border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px] pr-10 cursor-pointer transition-all"
                        value={searchField}
                        onChange={(e) => setSearchField(e.target.value)}
                    >
                        <option value="regNo">등록번호</option>
                        <option value="dogShow">대회명</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronRight size={16} className="rotate-90" />
                    </div>
                </div>
                <div className="flex-1 relative">
                    <input
                        type="text"
                        className="w-full border border-slate-200 rounded-xl px-5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 bg-slate-50 outline-none transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="검색어를 입력하세요..."
                        onKeyDown={(e) => e.key === 'Enter' && loadData(1, searchQuery, searchField)}
                    />
                </div>
                <button
                    onClick={() => loadData(1, searchQuery, searchField)}
                    className="bg-slate-800 text-white px-8 py-2.5 rounded-xl text-sm font-black hover:bg-black transition-all shadow-md active:scale-95"
                >
                    검색
                </button>
            </div>

            <div className="flex-1 border border-slate-200 rounded-[24px] bg-white shadow-sm overflow-hidden flex flex-col mb-10">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-sm border-collapse">
                        <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
                            <tr>
                                <th className="py-5 px-6 font-bold text-left border-r border-slate-100">등록번호</th>
                                <th className="py-5 px-6 font-bold text-left border-r border-slate-100">대회명</th>
                                <th className="py-5 px-6 font-bold text-left border-r border-slate-100">개최일</th>
                                <th className="py-5 px-6 font-bold text-center border-r border-slate-100 w-20">점수</th>
                                <th className="py-5 px-6 font-bold text-left border-r border-slate-100">심사위원</th>
                                <th className="py-5 px-6 font-bold text-left border-r border-slate-100">비고</th>
                                <th className="py-5 px-6 font-bold text-center w-36">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-700">
                            {isLoading && (
                                <tr>
                                    <td colSpan={7} className="py-40 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="animate-spin text-blue-500" size={40} />
                                            <p className="text-slate-400 font-bold">상력 데이터를 불러오는 중...</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {!isLoading && prizes.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="py-5 px-6 border-r border-slate-100 font-bold uppercase text-slate-500">{item.regNo}</td>
                                    <td className="py-5 px-6 border-r border-slate-100 font-bold text-slate-800">{item.dogShowName}</td>
                                    <td className="py-5 px-6 border-r border-slate-100 text-slate-400 font-medium">{item.date}</td>
                                    <td className="py-5 px-6 border-r border-slate-100 text-center font-black text-blue-600 text-lg">{item.points}</td>
                                    <td className="py-5 px-6 border-r border-slate-100 text-slate-600 font-semibold">{item.judge}</td>
                                    <td className="py-5 px-6 border-r border-slate-100">
                                        <div className="text-slate-400 text-xs italic line-clamp-2 max-w-[200px]">
                                            {item.detail || '-'}
                                        </div>
                                    </td>
                                    <td className="py-5 px-6">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => setEditingPrize(item)}
                                                className="w-12 h-8 flex items-center justify-center bg-emerald-500 text-white rounded-md text-xs font-black shadow-sm hover:bg-emerald-600 transition-all active:scale-90"
                                            >
                                                수정
                                            </button>
                                            <button
                                                onClick={() => setDeletingPrize(item)}
                                                className="w-12 h-8 flex items-center justify-center bg-rose-500 text-white rounded-md text-xs font-black shadow-sm hover:bg-rose-600 transition-all active:scale-90"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!isLoading && prizes.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-40 text-center text-slate-300 font-bold italic">
                                        등록된 상력 데이터가 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-center items-center gap-2">
                    <button
                        onClick={() => { const p = Math.max(1, currentPage - 1); setCurrentPage(p); loadData(p, searchQuery, searchField); }}
                        disabled={currentPage === 1}
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all font-bold group shadow-sm"
                    >
                        <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                    </button>

                    <div className="flex gap-2 mx-2">
                        {getPages().map(p => (
                            <button
                                key={p}
                                onClick={() => { setCurrentPage(p); loadData(p, searchQuery, searchField); }}
                                className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-black transition-all shadow-sm ${currentPage === p ? 'bg-blue-600 text-white shadow-blue-200 scale-110' : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-400 hover:text-blue-600'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => { const p = currentPage + 1; setCurrentPage(p); loadData(p, searchQuery, searchField); }}
                        disabled={currentPage >= Math.ceil(totalCount / 20)}
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all font-bold group shadow-sm"
                    >
                        <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>

            {deletingPrize && <DeleteConfirmModal onConfirm={handleDeleteConfirm} onCancel={() => setDeletingPrize(null)} />}
            {isAddModalOpen && <PrizeAddModal onClose={() => setIsAddModalOpen(false)} onSave={handleSaveAdd} />}
            {editingPrize && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[500px] overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-800">상력 수정</h2>
                            <button onClick={() => setEditingPrize(null)} className="text-slate-400 hover:text-black transition-colors"><X size={24} /></button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(editingPrize); }} className="p-8 space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">등록번호 *</label>
                                <input type="text" className="w-full border border-slate-200 rounded-md px-4 h-11 outline-none focus:border-blue-500 transition-all font-medium" value={editingPrize.regNo} onChange={e => setEditingPrize({ ...editingPrize, regNo: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">대회명</label>
                                <input type="text" className="w-full border border-slate-200 rounded-md px-4 h-11 outline-none focus:border-blue-500 transition-all font-medium" value={editingPrize.dogShowName} onChange={e => setEditingPrize({ ...editingPrize, dogShowName: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">개최일</label>
                                <input type="text" className="w-full border border-slate-200 rounded-md px-4 h-11 outline-none focus:border-blue-500 transition-all font-medium" value={editingPrize.date} onChange={e => setEditingPrize({ ...editingPrize, date: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">개최장소</label>
                                <input type="text" className="w-full border border-slate-200 rounded-md px-4 h-11 outline-none focus:border-blue-500 transition-all font-medium" value={editingPrize.location || ''} onChange={e => setEditingPrize({ ...editingPrize, location: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">심사위원</label>
                                <input type="text" className="w-full border border-slate-200 rounded-md px-4 h-11 outline-none focus:border-blue-500 transition-all font-medium" value={editingPrize.judge} onChange={e => setEditingPrize({ ...editingPrize, judge: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">점수</label>
                                <input type="text" className="w-full border border-slate-200 rounded-md px-4 h-11 outline-none focus:border-blue-500 transition-all font-medium" value={editingPrize.points} onChange={e => setEditingPrize({ ...editingPrize, points: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1.5">비고 (comment)</label>
                                <textarea
                                    className="w-full border border-slate-200 rounded-md px-4 py-3 h-28 outline-none focus:border-blue-500 transition-all font-medium resize-none shadow-sm"
                                    value={editingPrize.detail}
                                    onChange={e => setEditingPrize({ ...editingPrize, detail: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setEditingPrize(null)} className="px-7 py-2.5 bg-slate-50 text-slate-500 font-bold rounded-md hover:bg-slate-100 transition-colors">취소</button>
                                <button type="submit" className="px-10 py-2.5 bg-[#007bff] text-white rounded-md font-bold shadow-md hover:bg-blue-600 transition-all active:scale-95">수정 완료</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};