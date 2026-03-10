import React, { useState } from 'react';
import { Loader2, Eye, Trash2, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { Notice, PostCategory } from '../types';

interface NoticePageProps {
  notices: Notice[];
  totalCount: number;
  currentPage: number;
  isLoading: boolean;
  onSearch: (field: string, query: string) => void;
  onPageChange: (page: number) => void;
  onDelete: (noticeId: number) => Promise<void>;
  onEdit: (notice: Notice) => void;
  onCreate: () => void;
  siteUrl: string;
  tableName: string;
  categories: PostCategory[];
}

export const NoticePage: React.FC<NoticePageProps> = ({
  notices,
  totalCount,
  currentPage,
  isLoading,
  onSearch,
  onPageChange,
  onDelete,
  onEdit,
  onCreate,
  siteUrl,
  tableName,
}) => {
  const isWordPressPosts = tableName.endsWith('_posts') || tableName === 'wp_posts';
  const [searchField, setSearchField] = useState(isWordPressPosts ? 'post_title' : 'wr_subject');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleSearch = () => onSearch(searchField, searchQuery);

  const handleInternalDelete = async (id: number) => {
    // 샌드박스 환경에서 차단되는 window.confirm 대신 부모의 커스텀 모달을 사용하도록 onDelete만 호출
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPageNumbers = () => {
    const pages = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
          <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
          협회소식/공지 관리 (워드프레스 연동)
        </h2>
        <button
          onClick={onCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black py-3 px-8 rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center gap-2"
        >
          새 공지 작성
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-8 flex gap-3 shadow-sm">
        <div className="relative">
          <select
            className="appearance-none border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold bg-slate-50 text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none pr-10 cursor-pointer"
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
          >
            <option value={isWordPressPosts ? 'post_title' : 'wr_subject'}>제목</option>
            <option value={isWordPressPosts ? 'post_content' : 'wr_content'}>내용</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronRight size={16} className="rotate-90" />
          </div>
        </div>
        <input
          type="text"
          className="flex-1 border border-slate-200 rounded-xl px-5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 bg-slate-50 outline-none transition-all"
          placeholder="검색어를 입력하세요..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} className="bg-slate-800 text-white px-8 py-2.5 rounded-xl text-sm font-black hover:bg-black transition-all shadow-md active:scale-95">
          검색
        </button>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-[24px] shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
              <tr>
                <th className="py-5 px-6 font-bold text-center w-24">ID</th>
                <th className="py-5 px-6 font-bold text-left">제목</th>
                <th className="py-5 px-6 font-bold text-center w-24">상태</th>
                <th className="py-5 px-6 font-bold text-center w-40">작성일</th>
                <th className="py-5 px-6 font-bold text-center w-56">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="animate-spin text-blue-500" size={40} />
                      <p className="text-slate-400 font-bold">데이터를 불러오는 중...</p>
                    </div>
                  </td>
                </tr>
              ) : notices.length > 0 ? (
                notices.map((notice) => (
                  <tr key={notice.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-5 px-6 text-center text-slate-400 font-mono text-xs">{notice.id}</td>
                    <td className="py-5 px-6 text-left font-bold text-slate-700">
                      <div className="truncate max-w-xl group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => onEdit(notice)}>
                        {notice.title}
                      </div>
                    </td>
                    <td className="py-5 px-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-black whitespace-nowrap ${notice.status === 'publish' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400'}`}>
                        {notice.status === 'publish' ? '공개됨' : '대기중'}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-center text-slate-400 text-xs font-medium">{formatDateTime(notice.createdAt)}</td>
                    <td className="py-5 px-6">
                      <div className="flex gap-2 justify-center items-center">
                        <button
                          onClick={() => window.open(`${siteUrl}/?p=${notice.id}`, '_blank')}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                          title="미리보기"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => onEdit(notice)}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-black hover:bg-blue-100 transition-colors"
                        >
                          수정
                        </button>
                        <button
                          disabled={deletingId === notice.id}
                          onClick={() => handleInternalDelete(notice.id)}
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black transition-all ${deletingId === notice.id
                            ? 'bg-red-100 text-red-300 cursor-not-allowed'
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                        >
                          <Trash2 size={14} />
                          {deletingId === notice.id ? '중...' : '삭제'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-32 text-center text-slate-300 font-bold italic">
                    등록된 게시물이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-center items-center gap-2">
          <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-white hover:text-blue-600 disabled:opacity-30 transition-all font-bold group shadow-sm"><ChevronsLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /></button>
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-white hover:text-blue-600 disabled:opacity-30 transition-all font-bold group shadow-sm"><ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /></button>

          <div className="flex gap-2 mx-2">
            {getPageNumbers().map(n => (
              <button
                key={n}
                onClick={() => onPageChange(n)}
                className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-black transition-all shadow-sm ${currentPage === n ? 'bg-blue-600 text-white shadow-blue-200 scale-110' : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-400 hover:text-blue-600'}`}
              >
                {n}
              </button>
            ))}
          </div>

          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-white hover:text-blue-600 disabled:opacity-30 transition-all font-bold group shadow-sm"><ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" /></button>
          <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-white hover:text-blue-600 disabled:opacity-30 transition-all font-bold group shadow-sm"><ChevronsRight size={16} className="group-hover:translate-x-0.5 transition-transform" /></button>
        </div>
      </div>
    </div>

  );
};