
/**
 * ============================================================================
 * [경고] 
 * 이 페이지는 완전히 완성된 페이지입니다.
 * 진행 중인 수정 작업에서 이 파일은 절대 건드리지 마십시오. (DO NOT MODIFY)
 * ============================================================================
 */
import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, X, Loader2, AlertCircle, RefreshCw, Calendar, ChevronDown } from 'lucide-react';
import { Point } from '../types';
import { fetchPoints, updatePoint, deletePoint, fetchDogShows, createPoint, fetchPointsByRegNo, fetchDogsByRegNos, updatePedigree } from '../services/memberService';

const TABLE_NAME = 'point';

const POINT_TITLES: Record<string, string> = {
  "1": "BOB", "2": "KING", "3": "R.KING", "4": "QUEEN", "5": "R.QUEEN",
  "6": "BIS", "7": "R.BIS", "8": "BISS", "9": "R.BISS", "10": "BIG1",
  "11": "BIG2", "12": "BIG3", "13": "BIG4"
};

const AWARD_LABELS: Record<string, string> = {
  "1": "1st", "2": "2st", "0": "ETC"
};

const getTitleLabel = (val: string) => POINT_TITLES[val] || val || '-';
const getAwardLabel = (val: string) => {
  const normalized = val?.toString().trim();
  if (!normalized || normalized === "") return "없음";
  return AWARD_LABELS[normalized] || normalized;
};

// 🛡️ dogTab과 수상경력 텍스트 동기화 함수
const syncDogTabAwards = async (regNo: string) => {
  if (!regNo || regNo.trim() === "") return;
  try {
    const allPoints = await fetchPointsByRegNo(regNo);
    const summary = allPoints
      .map(p => {
        const title = POINT_TITLES[p.title] || p.title || '수상';
        const show = p.dogShowName || '도그쇼';
        const pt = p.points || 0;
        return `${show}:${title}(${pt}Pt)`;
      })
      .join(', ');

    await updatePedigree('dogTab', { regNo: regNo, specWin: summary } as any);
  } catch (e: any) {
    console.error("[Sync Error]", e.message);
  }
};

const DeleteConfirmModal: React.FC<{ onConfirm: () => void, onCancel: () => void }> = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
    <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden border animate-in zoom-in-95">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4 text-red-600">
          <AlertCircle size={24} />
          <h3 className="text-lg font-bold">삭제 확인</h3>
        </div>
        <p className="text-sm text-gray-600">정말로 이 포인트 내역을 삭제하시겠습니까?<br />삭제 시 혈통서 상세 정보의 수상 경력 요약도 함께 갱신됩니다.</p>
      </div>
      <div className="bg-gray-50 p-4 flex justify-end gap-2 border-t">
        <button onClick={onCancel} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded">취소</button>
        <button onClick={onConfirm} className="px-6 py-2 text-sm font-bold bg-red-600 text-white rounded hover:bg-red-700 shadow-sm transition-all active:scale-95">삭제 실행</button>
      </div>
    </div>
  </div>
);

const PointAddModal: React.FC<{
  dogShows: { id: string, name: string }[],
  onClose: () => void,
  onSave: (data: Partial<Point>) => Promise<void>
}> = ({ dogShows, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Point>>({
    regNo: '', dogShow: '', title: '', className: '', points: 0, award: '', other: '',
    regDate: Math.floor(new Date().getTime() / 1000).toString()
  });
  const [dateValue, setDateValue] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.regNo || !formData.dogShow) return alert('필수 항목을 입력해주세요.');
    setIsSaving(true);
    try { await onSave(formData); } finally { setIsSaving(false); }
  };

  const labelStyle = "block text-[14px] font-bold text-gray-700 mb-2";
  const inputStyle = "w-full border border-gray-300 rounded px-4 h-[42px] text-[14px] outline-none focus:border-blue-400 bg-white";
  const selectStyle = "w-full border border-gray-300 rounded px-4 pr-10 h-[42px] text-[14px] outline-none focus:border-blue-400 bg-white appearance-none cursor-pointer";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-[640px] overflow-hidden border animate-in zoom-in-95">
        <div className="px-8 py-6 flex justify-between items-center border-b border-gray-100">
          <h2 className="text-[20px] font-bold text-gray-800">포인트 추가</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto max-h-[80vh]">
          <div>
            <label className={labelStyle}>등록번호 *</label>
            <input type="text" className={inputStyle} value={formData.regNo} onChange={e => setFormData({ ...formData, regNo: e.target.value })} placeholder="등록번호 입력" required />
          </div>
          <div>
            <label className={labelStyle}>도그쇼 *</label>
            <div className="relative">
              <select className={selectStyle} value={formData.dogShow} onChange={e => setFormData({ ...formData, dogShow: e.target.value })} required>
                <option value="">도그쇼를 선택하세요</option>
                {Array.isArray(dogShows) && dogShows.map(ds => <option key={ds.id} value={ds.id}>{ds.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>
          <div>
            <label className={labelStyle}>제목 *</label>
            <div className="relative">
              <select className={selectStyle} value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required>
                <option value="">없음</option>
                {Object.entries(POINT_TITLES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>
          <div>
            <label className={labelStyle}>클래스 *</label>
            <div className="relative">
              <select className={selectStyle} value={formData.className} onChange={e => setFormData({ ...formData, className: e.target.value })} required>
                <option value="">선택하세요</option>
                <option value="어덜트">어덜트</option><option value="퍼피">퍼피</option><option value="쥬니어">쥬니어</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>
          <div>
            <label className={labelStyle}>포인트 *</label>
            <div className="relative">
              <select className={selectStyle} value={formData.points} onChange={e => setFormData({ ...formData, points: parseInt(e.target.value) })} required>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>
          <div>
            <label className={labelStyle}>입상</label>
            <div className="relative">
              <select className={selectStyle} value={formData.award} onChange={e => setFormData({ ...formData, award: e.target.value })}>
                <option value="">없음</option>
                <option value="1">1st</option><option value="2">2st</option><option value="0">ETC</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>
          <div>
            <label className={labelStyle}>등록일 *</label>
            <input type="date" className={inputStyle} value={dateValue} onChange={e => { setDateValue(e.target.value); setFormData({ ...formData, regDate: Math.floor(new Date(e.target.value).getTime() / 1000).toString() }); }} required />
          </div>
          <div>
            <label className={labelStyle}>기타</label>
            <textarea className={`${inputStyle} h-24 py-3 resize-none`} value={formData.other} onChange={e => setFormData({ ...formData, other: e.target.value })} />
          </div>
          <div className="flex justify-center gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-10 py-2.5 bg-gray-100 text-gray-700 font-bold rounded border text-sm">취소</button>
            <button type="submit" disabled={isSaving} className="px-12 py-2.5 bg-[#3da5e1] text-white font-bold rounded text-sm shadow-md flex items-center justify-center gap-2 min-w-[140px]">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : null} 저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PointEditModalProps {
  point: Point;
  dogShows: { id: string, name: string }[];
  onClose: () => void;
  onSave: (updatedPoint: Point) => Promise<void>;
}

const PointEditModal: React.FC<PointEditModalProps> = ({ point, dogShows, onClose, onSave }) => {
  const [formData, setFormData] = useState<Point>({ ...point });
  const [isSaving, setIsSaving] = useState(false);
  const getInitialDate = (ts: string) => {
    if (!ts || ts === '0' || ts.trim() === '') return new Date().toISOString().split('T')[0];
    const date = new Date(parseInt(ts) * 1000);
    return isNaN(date.getTime()) ? new Date().toISOString().split('T')[0] : date.toISOString().split('T')[0];
  };
  const [dateValue, setDateValue] = useState(getInitialDate(point.regDate));
  const handleChange = (field: keyof Point, value: any) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleDateChange = (val: string) => {
    setDateValue(val);
    const ts = Math.floor(new Date(val).getTime() / 1000).toString();
    handleChange('regDate', ts);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try { await onSave(formData); } finally { setIsSaving(false); }
  };
  const labelStyle = "block text-[14px] font-bold text-gray-700 mb-2";
  const inputStyle = "w-full border border-gray-300 rounded px-4 h-[42px] text-[14px] outline-none focus:border-blue-400 transition-colors bg-white";
  const selectStyle = "w-full border border-gray-300 rounded px-4 pr-10 h-[42px] text-[14px] outline-none focus:border-blue-400 transition-colors bg-white appearance-none cursor-pointer";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-[1px] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-[640px] overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 flex justify-between items-center border-b border-gray-100 bg-white">
          <h2 className="text-[20px] font-bold text-gray-800 tracking-tight">포인트 내역 수정</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-6 overflow-y-auto max-h-[75vh]">
          <div>
            <label className={labelStyle}>등록번호 *</label>
            <input type="text" className={inputStyle} value={formData.regNo} onChange={(e) => handleChange('regNo', e.target.value)} required />
          </div>
          <div>
            <label className={labelStyle}>도그쇼 *</label>
            <div className="relative">
              <select className={selectStyle} value={formData.dogShow} onChange={(e) => handleChange('dogShow', e.target.value)} required>
                <option value="">도그쇼 선택</option>
                {Array.isArray(dogShows) && dogShows.map(ds => <option key={ds.id} value={ds.id}>{ds.name}</option>)}
                {formData.dogShow && Array.isArray(dogShows) && !dogShows.find(ds => ds.id === formData.dogShow) && (
                  <option value={formData.dogShow}>{formData.dogShowName || formData.dogShow}</option>
                )}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>제목 *</label>
              <div className="relative">
                <select className={selectStyle} value={formData.title} onChange={(e) => handleChange('title', e.target.value)} required>
                  <option value="">선택</option>
                  {Object.entries(POINT_TITLES).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>
            <div>
              <label className={labelStyle}>클래스 *</label>
              <div className="relative">
                <select className={selectStyle} value={formData.className} onChange={(e) => handleChange('className', e.target.value)} required>
                  <option value="">선택</option>
                  <option value="어덜트">어덜트</option><option value="퍼피">퍼피</option><option value="쥬니어">쥬니어</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelStyle}>포인트 *</label>
              <div className="relative">
                <select className={selectStyle} value={formData.points} onChange={(e) => handleChange('points', parseInt(e.target.value))} required>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>
            <div>
              <label className={labelStyle}>입상</label>
              <div className="relative">
                <select className={selectStyle} value={formData.award} onChange={(e) => handleChange('award', e.target.value)}>
                  <option value="">없음</option><option value="1">1st</option><option value="2">2st</option><option value="0">ETC</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>
          </div>
          <div>
            <label className={labelStyle}>등록일 *</label>
            <input type="date" className={inputStyle} value={dateValue} onChange={(e) => handleDateChange(e.target.value)} required />
          </div>
          <div>
            <label className={labelStyle}>기타 내용</label>
            <textarea className={`${inputStyle} h-24 py-3 resize-none`} value={formData.other} onChange={(e) => handleChange('other', e.target.value)} />
          </div>
          <div className="flex justify-center gap-3 pt-4 mb-4">
            <button type="button" onClick={onClose} className="bg-[#f8f9fa] hover:bg-gray-100 text-gray-700 font-bold py-2.5 px-12 rounded border text-sm">취소</button>
            <button type="submit" disabled={isSaving} className="bg-[#3da5e1] hover:bg-[#3494cc] text-white font-bold py-2.5 px-12 rounded text-sm shadow-md active:scale-95 flex items-center justify-center gap-2 min-w-[140px]">
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Edit2 size={16} />} 저장 완료
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PointManagementPageProps {
  initialSearch?: { query: string, field: string } | null;
  onSearchHandled?: () => void;
}

export const PointManagementPage: React.FC<PointManagementPageProps> = ({ initialSearch, onSearchHandled }) => {
  const [points, setPoints] = useState<Point[]>([]);
  const [dogShows, setDogShows] = useState<{ id: string, name: string }[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchField, setSearchField] = useState('regNo');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingPoint, setEditingPoint] = useState<Point | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeRegNo, setActiveRegNo] = useState<string | null>(null);

  const loadData = async (page: number = 1, query: string = '', field: string = 'all') => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchPoints(TABLE_NAME, page, query, field);
      if (res && res.data) {
        setPoints(res.data);
        setTotalCount(res.total);
      }

      // 🛡️ 도그쇼 목록 로딩 실패 시에도 전체 로직이 중단되지 않도록 보호
      try {
        const shows = await fetchDogShows();
        setDogShows(Array.isArray(shows) ? shows : []);
      } catch (showErr) {
        console.warn("도그쇼 목록을 불러올 수 없습니다. 수동 입력 모드를 사용하세요.");
        setDogShows([]);
      }
    } catch (e: any) {
      setErrorMsg(e.message || "데이터 로드 실패");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialSearch) {
      setSearchField(initialSearch.field);
      setSearchQuery(initialSearch.query);
      loadData(1, initialSearch.query, initialSearch.field);
      if (onSearchHandled) onSearchHandled();
    } else {
      loadData(1);
    }
  }, [initialSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData(1, searchQuery, searchField);
  };

  const handlePageChange = (p: number) => {
    setCurrentPage(p);
    loadData(p, searchQuery, searchField);
  };

  const handleEditClick = (point: Point) => {
    setEditingPoint(point);
  };

  const handleAddPoint = async (data: Partial<Point>) => {
    try {
      const res = await createPoint(data);
      if (res.success && data.regNo) {
        await syncDogTabAwards(data.regNo);
        setIsAddModalOpen(false);
        loadData(1, searchQuery, searchField);
      }
    } catch (e: any) {
      alert('추가 실패: ' + e.message);
    }
  };

  const handleSaveEdit = async (updatedPoint: Point) => {
    try {
      const res = await updatePoint(TABLE_NAME, updatedPoint);
      if (res.success) {
        await syncDogTabAwards(updatedPoint.regNo);
        loadData(currentPage, searchQuery, searchField);
        setEditingPoint(null);
      }
    } catch (e: any) { alert("수정 실패: " + e.message); }
  };

  const handleDeleteClick = (item: Point) => {
    setDeletingId(item.id);
    setActiveRegNo(item.regNo);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsLoading(true);
    const regNoToSync = activeRegNo;
    try {
      await deletePoint(TABLE_NAME, deletingId);
      setDeletingId(null);
      setActiveRegNo(null);
      if (regNoToSync) await syncDogTabAwards(regNoToSync);
      loadData(currentPage, searchQuery, searchField);
    } catch (e: any) {
      alert('삭제 실패: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (ts: string) => {
    if (!ts || ts === '0' || ts.trim() === '') return '-';
    try {
      const timestamp = parseInt(ts);
      const date = new Date(timestamp * 1000);
      return isNaN(date.getTime()) ? ts : `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}.`;
    } catch (e) { return ts; }
  };

  const totalPages = Math.ceil(totalCount / 50);
  const getPages = () => {
    const pages = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="flex flex-col h-full bg-white p-10 overflow-y-auto relative border-t-2 border-gray-800 font-sans">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-[22px] font-extrabold text-gray-800">포인트 관리</h2>
          <p className="text-xs text-gray-400 mt-1">도그쇼 입상 내역 및 획득 포인트를 관리합니다. (혈통서 상세정보와 자동 동기화)</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded text-sm transition-all shadow-lg flex items-center gap-2 active:scale-95"
        >
          <Plus size={16} /> 포인트 수동 추가
        </button>
      </div>

      <div className="flex justify-start items-center mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1">
          <div className="relative">
            <select className="border border-gray-300 rounded-sm px-3 pr-8 py-1.5 text-xs bg-white h-10 min-w-[160px] appearance-none cursor-pointer outline-none focus:border-blue-500" value={searchField} onChange={(e) => setSearchField(e.target.value)}>
              <option value="regNo">등록번호 검색</option>
              <option value="dogShow">도그쇼 검색</option>
              <option value="regDate">등록일 검색</option>
              <option value="all">전체 검색</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          </div>
          <div className="relative flex-1 max-w-md">
            <input type="text" placeholder="검색어 입력" className="w-full border border-gray-300 rounded-sm px-4 py-1.5 text-sm h-10 outline-none focus:border-blue-500 shadow-inner" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <button type="submit" className="bg-gray-800 text-white px-8 h-10 text-sm font-bold rounded hover:bg-black transition-colors active:scale-95">조회</button>
        </form>
      </div>

      <div className="flex-1 overflow-x-auto relative min-h-[500px] border border-gray-100 rounded-lg shadow-sm bg-white">
        {isLoading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-20 backdrop-blur-[1px]"><Loader2 size={40} className="animate-spin text-blue-600" /></div>}
        <table className="w-full text-[13px] text-left border-collapse">
          <thead>
            <tr className="bg-[#f9fafb] text-gray-600 border-b border-gray-200">
              <th className="py-4 px-4 font-bold w-32">등록번호</th>
              <th className="py-4 px-4 font-bold">도그쇼 명칭</th>
              <th className="py-4 px-4 font-bold w-24">제목</th>
              <th className="py-4 px-4 font-bold w-24">클래스</th>
              <th className="py-4 px-4 font-bold">기타 정보</th>
              <th className="py-4 px-4 font-bold w-20 text-center">포인트</th>
              <th className="py-4 px-4 font-bold w-24 text-center">입상</th>
              <th className="py-4 px-4 font-bold w-32">등록일자</th>
              <th className="py-4 px-4 font-bold w-32 text-center">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {points.map((item) => (
              <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                <td className="py-4 px-4 text-gray-900 font-bold uppercase">{item.regNo || '-'}</td>
                <td className="py-4 px-4 text-gray-600 truncate max-w-[200px]">{item.dogShowName || item.dogShow || '-'}</td>
                <td className="py-4 px-4"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-[11px] font-bold border border-gray-200">{getTitleLabel(item.title)}</span></td>
                <td className="py-4 px-4 text-gray-600">{item.className || '-'}</td>
                <td className="py-4 px-4 text-gray-500 italic max-w-xs truncate">{item.other || '-'}</td>
                <td className="py-4 px-4 text-gray-900 font-black text-center">{item.points} Pt</td>
                <td className="py-4 px-4 text-center">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${item.award === '1' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      item.award === '2' ? 'bg-gray-50 text-gray-600 border-gray-200' :
                        item.award === '0' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                          'bg-white text-gray-300 border-gray-100'
                    }`}>{getAwardLabel(item.award)}</span>
                </td>
                <td className="py-4 px-4 text-gray-400 font-mono text-[11px]">{formatTimestamp(item.regDate)}</td>
                <td className="py-4 px-4 text-center">
                  <div className="flex justify-center gap-1">
                    <button onClick={() => handleEditClick(item)} className="px-3 py-1.5 rounded bg-blue-50 text-blue-600 border border-blue-200 text-[11px] font-bold hover:bg-blue-100 transition-colors">수정</button>
                    <button onClick={() => handleDeleteClick(item)} className="px-3 py-1.5 rounded bg-red-50 text-red-600 border border-red-200 text-[11px] font-bold hover:bg-red-100 transition-colors">삭제</button>
                  </div>
                </td>
              </tr>
            ))}
            {points.length === 0 && !isLoading && (
              <tr><td colSpan={9} className="py-20 text-center text-gray-400">데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-10 gap-1 pb-10">
        {getPages().map(p => (
          <button key={p} onClick={() => handlePageChange(p)} className={`w-9 h-9 flex items-center justify-center rounded border text-[13px] font-bold transition-all ${currentPage === p ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{p}</button>
        ))}
      </div>

      {editingPoint && <PointEditModal point={editingPoint} dogShows={dogShows} onClose={() => setEditingPoint(null)} onSave={handleSaveEdit} />}
      {isAddModalOpen && <PointAddModal dogShows={dogShows} onClose={() => setIsAddModalOpen(false)} onSave={handleAddPoint} />}
      {deletingId && <DeleteConfirmModal onConfirm={handleDeleteConfirm} onCancel={() => { setDeletingId(null); setActiveRegNo(null); }} />}
    </div>
  );
};
